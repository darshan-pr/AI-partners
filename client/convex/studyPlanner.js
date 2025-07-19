import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get user's study planners
export const getUserPlanners = query({
  args: { username: v.string() },
  async handler(ctx, args) {
    const planners = await ctx.db
      .query("study_planner")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .order("desc")
      .collect();
    
    return planners;
  }
});

// Get active study planners for a user
export const getActivePlanners = query({
  args: { username: v.string() },
  async handler(ctx, args) {
    const now = Date.now();
    const planners = await ctx.db
      .query("study_planner")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .filter((q) => q.and(
        q.eq(q.field("status"), "active"),
        q.gt(q.field("expires_at"), now)
      ))
      .collect();
    
    return planners;
  }
});

// Get completed study planners for a user
export const getCompletedPlanners = query({
  args: { username: v.string() },
  async handler(ctx, args) {
    const planners = await ctx.db
      .query("study_planner")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .order("desc")
      .collect();
    
    return planners;
  }
});

// Get dropped study planners for a user
export const getDroppedPlanners = query({
  args: { username: v.string() },
  async handler(ctx, args) {
    const planners = await ctx.db
      .query("study_planner")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .filter((q) => q.eq(q.field("status"), "dropped"))
      .order("desc")
      .collect();
    
    return planners;
  }
});

// Reactivate a completed study planner
export const reactivatePlanner = mutation({
  args: { plannerId: v.string() },
  async handler(ctx, args) {
    const planner = await ctx.db.get(args.plannerId);
    if (!planner) {
      throw new Error("Planner not found");
    }
    
    if (planner.status !== "completed" && planner.status !== "dropped") {
      throw new Error("Only completed or dropped planners can be reactivated");
    }
    
    const now = Date.now();
    const expirationDays = planner.type === 'weekly' ? 7 : 30;
    const newExpiresAt = now + (expirationDays * 24 * 60 * 60 * 1000);
    
    // Reset planner to active status and reset progress
    await ctx.db.patch(args.plannerId, {
      status: "active",
      expires_at: newExpiresAt,
      reactivated_at: now,
      completion_percentage: 0,
      completed_notes: 0
    });
    
    // Reset all associated study notes to incomplete
    const studyNotes = await ctx.db
      .query("study_notes")
      .withIndex("by_planner_id", (q) => q.eq("planner_id", args.plannerId))
      .collect();
    
    // Mark all notes as incomplete
    for (const note of studyNotes) {
      await ctx.db.patch(note._id, {
        is_completed: false,
        completed_at: undefined
      });
    }
    
    return {
      plannerId: args.plannerId,
      newExpiresAt,
      resetNotesCount: studyNotes.length
    };
  }
});

// Drop an active study planner
export const dropPlanner = mutation({
  args: { plannerId: v.string() },
  async handler(ctx, args) {
    const planner = await ctx.db.get(args.plannerId);
    if (!planner) {
      throw new Error("Planner not found");
    }
    
    if (planner.status !== "active") {
      throw new Error("Only active planners can be dropped");
    }
    
    const now = Date.now();
    
    // Mark planner as dropped
    await ctx.db.patch(args.plannerId, {
      status: "dropped",
      dropped_at: now
    });
    
    return {
      plannerId: args.plannerId,
      droppedAt: now
    };
  }
});

// Get study planner by ID
export const getPlannerById = query({
  args: { plannerId: v.string() },
  async handler(ctx, args) {
    const planner = await ctx.db.get(args.plannerId);
    if (!planner) {
      throw new Error("Planner not found");
    }
    
    // Get all notes for this planner
    const notes = await ctx.db
      .query("study_notes")
      .withIndex("by_planner_id", (q) => q.eq("planner_id", args.plannerId))
      .order("asc")
      .collect();
    
    return {
      ...planner,
      notes: notes.sort((a, b) => a.position_index - b.position_index)
    };
  }
});

// Generate study planner based on AI reviews
export const generateStudyPlanner = mutation({
  args: { 
    username: v.string(),
    type: v.string() // 'weekly' or 'monthly'
  },
  async handler(ctx, args) {
    // Check if user already has an active planner of this type
    const now = Date.now();
    const existingPlanner = await ctx.db
      .query("study_planner")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .filter((q) => q.and(
        q.eq(q.field("type"), args.type),
        q.eq(q.field("status"), "active"),
        q.gt(q.field("expires_at"), now)
      ))
      .first();
    
    if (existingPlanner) {
      throw new Error(`You already have an active ${args.type} study planner. Please wait for it to expire or complete it before generating a new one.`);
    }
    
    // Get all AI reviews for this user
    const reviews = await ctx.db
      .query("ai_review")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .collect();
    
    if (reviews.length === 0) {
      throw new Error("No quiz reviews found. Please take some quizzes first to generate a personalized study plan.");
    }
    
    // Get quiz data for each review to extract subjects
    const reviewsWithQuizData = [];
    for (const review of reviews) {
      const quiz = await ctx.db.get(review.quiz_id);
      if (quiz) {
        reviewsWithQuizData.push({
          ...review,
          quiz: quiz
        });
      }
    }
    
    // Analyze reviews to extract weak areas and concepts
    const analysisData = analyzeUserPerformance(reviewsWithQuizData);
    
    // Generate study plan based on analysis
    const studyPlan = generateStudyPlan(analysisData, args.type);
    
    // Set expiration date
    const expirationDays = args.type === 'weekly' ? 7 : 30;
    const expiresAt = now + (expirationDays * 24 * 60 * 60 * 1000);
    
    // Create study planner
    const plannerId = await ctx.db.insert("study_planner", {
      username: args.username,
      type: args.type,
      title: studyPlan.title,
      description: studyPlan.description,
      created_at: now,
      expires_at: expiresAt,
      status: "active",
      completion_percentage: 0,
      total_notes: studyPlan.notes.length,
      completed_notes: 0,
      generated_from_reviews: reviewsWithQuizData.map(r => r._id),
    });
    
    // Create study notes
    for (let i = 0; i < studyPlan.notes.length; i++) {
      const note = studyPlan.notes[i];
      await ctx.db.insert("study_notes", {
        planner_id: plannerId,
        title: note.title,
        details: note.details,
        start_date: note.start_date,
        due_date: note.due_date,
        is_completed: false,
        position_index: i,
        connected_to: i < studyPlan.notes.length - 1 ? `note_${i + 1}` : undefined,
        priority: note.priority,
        difficulty_level: note.difficulty_level,
        estimated_time: note.estimated_time,
        subject: note.subject,
        concepts: note.concepts,
        resources: note.resources || []
      });
    }
    
    return {
      plannerId,
      type: args.type,
      notesCount: studyPlan.notes.length,
      expiresAt
    };
  }
});

// Toggle note completion
export const toggleNoteCompletion = mutation({
  args: { 
    noteId: v.string(),
    isCompleted: v.boolean() 
  },
  async handler(ctx, args) {
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }
    
    const now = Date.now();
    await ctx.db.patch(args.noteId, {
      is_completed: args.isCompleted,
      completed_at: args.isCompleted ? now : undefined
    });
    
    // Update planner completion percentage
    const allNotes = await ctx.db
      .query("study_notes")
      .withIndex("by_planner_id", (q) => q.eq("planner_id", note.planner_id))
      .collect();
    
    const completedNotes = allNotes.filter(n => 
      n._id === args.noteId ? args.isCompleted : n.is_completed
    ).length;
    
    const completionPercentage = Math.round((completedNotes / allNotes.length) * 100);
    
    await ctx.db.patch(note.planner_id, {
      completed_notes: completedNotes,
      completion_percentage: completionPercentage,
      status: completionPercentage === 100 ? "completed" : "active"
    });
    
    return {
      noteId: args.noteId,
      isCompleted: args.isCompleted,
      completionPercentage
    };
  }
});

// Create manual study planner
export const createManualPlanner = mutation({
  args: {
    username: v.string(),
    type: v.string(),
    title: v.string(),
    description: v.string(),
    notes: v.array(v.object({
      title: v.string(),
      details: v.string(),
      start_date: v.number(),
      due_date: v.number(),
      position_index: v.number(),
      connected_to: v.optional(v.string()),
      priority: v.string(),
      difficulty_level: v.string(),
      estimated_time: v.string(),
      subject: v.string(),
      concepts: v.array(v.string()),
      resources: v.array(v.object({
        title: v.string(),
        type: v.string(),
        url: v.optional(v.string())
      }))
    })),
    expiresAt: v.number()
  },
  async handler(ctx, args) {
    const now = Date.now();
    const plannerId = await ctx.db.insert("study_planner", {
      username: args.username,
      type: args.type,
      title: args.title,
      description: args.description,
      created_at: now,
      expires_at: args.expiresAt,
      status: "active",
      completion_percentage: 0,
      total_notes: args.notes.length,
      completed_notes: 0,
      generated_from_reviews: [],
    });

    for (const note of args.notes) {
      await ctx.db.insert("study_notes", {
        planner_id: plannerId,
        title: note.title,
        details: note.details,
        start_date: note.start_date,
        due_date: note.due_date,
        is_completed: false,
        position_index: note.position_index,
        connected_to: note.connected_to,
        priority: note.priority,
        difficulty_level: note.difficulty_level,
        estimated_time: note.estimated_time,
        subject: note.subject,
        concepts: note.concepts,
        resources: note.resources
      });
    }

    return plannerId;
  }
});

// Delete study planner
export const deletePlanner = mutation({
  args: { plannerId: v.string() },
  async handler(ctx, args) {
    const planner = await ctx.db.get(args.plannerId);
    if (!planner) {
      throw new Error("Planner not found");
    }
    
    if (planner.status !== "completed" && planner.status !== "dropped") {
      throw new Error("Only completed or dropped planners can be deleted");
    }
    
    const notes = await ctx.db
      .query("study_notes")
      .withIndex("by_planner_id", (q) => q.eq("planner_id", args.plannerId))
      .collect();
    
    for (const note of notes) {
      await ctx.db.delete(note._id);
    }
    
    await ctx.db.delete(args.plannerId);
    
    return { 
      deleted: true, 
      deletedNotesCount: notes.length,
      deletedAt: Date.now()
    };
  }
});

// Helper function to analyze user performance
function analyzeUserPerformance(reviewsWithQuizData) {
  const weakConcepts = [];
  const strongConcepts = [];
  const subjects = new Set();
  const improvementSuggestions = [];
  const conceptCounts = {};
  
  reviewsWithQuizData.forEach(reviewData => {
    const review = reviewData;
    const quiz = reviewData.quiz;
    
    const subject = quiz.subject || quiz.concept || "General";
    subjects.add(subject);
    
    if (review.concept_breakdown && Array.isArray(review.concept_breakdown)) {
      review.concept_breakdown.forEach(concept => {
        const conceptName = concept.concept;
        
        if (!conceptCounts[conceptName]) {
          conceptCounts[conceptName] = { 
            weak: 0, 
            strong: 0, 
            total: 0, 
            subject: subject,
            suggestions: []
          };
        }
        conceptCounts[conceptName].total++;
        
        if (concept.mastery_level === "Needs Improvement" || 
            concept.mastery_level === "Weak" || 
            concept.mastery_level === "Poor") {
          conceptCounts[conceptName].weak++;
          conceptCounts[conceptName].suggestions.push(concept.suggestion);
          weakConcepts.push({
            concept: conceptName,
            suggestion: concept.suggestion,
            subject: subject,
            masteryLevel: concept.mastery_level,
            priority: concept.mastery_level === "Weak" ? "high" : "medium",
            quizContext: quiz.concept || quiz.subject
          });
        } else if (concept.mastery_level === "Strong" || 
                   concept.mastery_level === "Excellent" || 
                   concept.mastery_level === "Good") {
          conceptCounts[conceptName].strong++;
          strongConcepts.push({
            concept: conceptName,
            subject: subject,
            masteryLevel: concept.mastery_level,
            quizContext: quiz.concept || quiz.subject
          });
        }
      });
    }
    
    if (review.improvement_suggestions) {
      improvementSuggestions.push(review.improvement_suggestions);
    }
  });
  
  const prioritizedWeakConcepts = Object.entries(conceptCounts)
    .filter(([concept, counts]) => counts.weak > 0)
    .sort((a, b) => {
      const aRatio = a[1].weak / a[1].total;
      const bRatio = b[1].weak / b[1].total;
      return bRatio - aRatio;
    })
    .map(([concept, counts]) => {
      const weakEntry = weakConcepts.find(w => w.concept === concept);
      return {
        ...weakEntry,
        weakCount: counts.weak,
        totalCount: counts.total,
        weaknessRatio: counts.weak / counts.total,
        priority: counts.weak / counts.total > 0.7 ? "high" : 
                 counts.weak / counts.total > 0.4 ? "medium" : "low",
        allSuggestions: counts.suggestions
      };
    });
  
  const uniqueStrongConcepts = Array.from(
    new Map(strongConcepts.map(c => [c.concept, c])).values()
  );
  
  return {
    weakConcepts: prioritizedWeakConcepts,
    strongConcepts: uniqueStrongConcepts,
    subjects: Array.from(subjects),
    improvementSuggestions: [...new Set(improvementSuggestions)],
    totalReviews: reviewsWithQuizData.length,
    conceptCounts
  };
}

// Helper function to generate study plan
function generateStudyPlan(analysisData, type) {
  const isWeekly = type === 'weekly';
  const totalDays = isWeekly ? 7 : 30;
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  const { weakConcepts, strongConcepts, subjects, improvementSuggestions } = analysisData;
  
  const primarySubject = subjects.length > 0 ? subjects[0] : "General";
  const title = `${isWeekly ? 'Weekly' : 'Monthly'} Concept Mastery Plan - ${primarySubject}`;
  
  const weakConceptCount = weakConcepts.length;
  const description = `AI-generated study plan focusing on ${weakConceptCount} weak concepts across ${subjects.length} subject${subjects.length > 1 ? 's' : ''}. Prioritized by difficulty and importance.`;
  
  const notes = [];
  
  const maxNotes = isWeekly ? 7 : 15;
  const conceptsToStudy = weakConcepts.slice(0, maxNotes);
  
  conceptsToStudy.forEach((conceptData, index) => {
    const dayOffset = Math.floor((index * totalDays) / conceptsToStudy.length);
    const startDate = now + (dayOffset * dayInMs);
    const endDate = startDate + (2 * dayInMs);
    
    const task = {
      title: `Master ${conceptData.concept}`,
      details: generateConceptTaskDetails(conceptData),
      start_date: startDate,
      due_date: endDate,
      priority: conceptData.priority,
      difficulty_level: mapMasteryToDifficulty(conceptData.masteryLevel),
      estimated_time: calculateEstimatedTime(conceptData.priority, isWeekly),
      subject: conceptData.subject,
      concepts: [conceptData.concept],
      resources: generateConceptResources(conceptData)
    };
    
    notes.push(task);
  });
  
  if (notes.length > 0) {
    const reviewTask = {
      title: `Review and Practice All Concepts`,
      details: `Review all studied concepts: ${conceptsToStudy.map(c => c.concept).join(', ')}. Practice applying these concepts together and identify any remaining gaps.`,
      start_date: now + ((totalDays - 2) * dayInMs),
      due_date: now + (totalDays * dayInMs),
      priority: "medium",
      difficulty_level: "medium",
      estimated_time: isWeekly ? "2-3 hours" : "4-5 hours",
      subject: primarySubject,
      concepts: conceptsToStudy.map(c => c.concept),
      resources: [
        {
          title: "Create Practice Quiz",
          type: "quiz",
          url: "/quiz"
        },
        {
          title: "Concept Summary Notes",
          type: "study_guide"
        }
      ]
    };
    
    notes.push(reviewTask);
  }
  
  return {
    title,
    description,
    notes
  };
}

// Helper functions for task generation
function generateConceptTaskDetails(conceptData) {
  const baseDetails = `Focus on mastering "${conceptData.concept}" in ${conceptData.subject}.`;
  const weaknessInfo = `Current mastery level: ${conceptData.masteryLevel}. Priority: ${conceptData.priority}.`;
  const suggestions = conceptData.allSuggestions && conceptData.allSuggestions.length > 0 
    ? `\n\nAI Recommendations:\n${conceptData.allSuggestions.slice(0, 3).join('\n')}`
    : '';
  
  const studySteps = `\n\nStudy Steps:
1. Review fundamental concepts and definitions
2. Work through practice examples
3. Identify common mistakes and misconceptions
4. Apply knowledge to varied problems
5. Test understanding with quiz questions`;
  
  return `${baseDetails}\n\n${weaknessInfo}${suggestions}${studySteps}`;
}

function mapMasteryToDifficulty(masteryLevel) {
  switch (masteryLevel) {
    case "Weak":
    case "Poor":
      return "hard";
    case "Needs Improvement":
      return "medium";
    default:
      return "easy";
  }
}

function calculateEstimatedTime(priority, isWeekly) {
  if (isWeekly) {
    return priority === "high" ? "3-4 hours" : 
           priority === "medium" ? "2-3 hours" : "1-2 hours";
  } else {
    return priority === "high" ? "4-6 hours" : 
           priority === "medium" ? "3-4 hours" : "2-3 hours";
  }
}

function generateConceptResources(conceptData) {
  return [
    {
      title: `${conceptData.concept} Study Guide`,
      type: "study_guide"
    },
    {
      title: `Practice Quiz - ${conceptData.concept}`,
      type: "quiz",
      url: "/quiz"
    },
    {
      title: `${conceptData.subject} Reference Materials`,
      type: "reference"
    }
  ];
}

// Clean up expired planners
export const cleanupExpiredPlanners = mutation({
  args: {},
  async handler(ctx) {
    const now = Date.now();
    const expiredPlanners = await ctx.db
      .query("study_planner")
      .filter((q) => q.and(
        q.eq(q.field("status"), "active"),
        q.lt(q.field("expires_at"), now)
      ))
      .collect();
    
    for (const planner of expiredPlanners) {
      await ctx.db.patch(planner._id, {
        status: "expired"
      });
    }
    
    return { expiredCount: expiredPlanners.length };
  }
});
