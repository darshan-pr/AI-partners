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

// Get study planner by ID with enriched resource data
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
    
    // Ensure each note has properly formatted resources for display
    const notesWithResources = notes.map(note => ({
      ...note,
      resources: (note.resources || []).map(resource => ({
        title: resource.title || "Study Resource",
        type: resource.type || "Link",
        url: resource.url || "#",
        description: resource.description || "",
        difficulty: resource.difficulty || ""
      })).slice(0, 3) // Limit to 3 resources for better UI
    }));
    
    return {
      ...planner,
      notes: notesWithResources.sort((a, b) => a.position_index - b.position_index)
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
    const studyPlan = generateStudyPlan(analysisData, args.type, reviewsWithQuizData);
    
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
        url: v.optional(v.string()),
        description: v.optional(v.string()),
        difficulty: v.optional(v.string())
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
function generateStudyPlan(analysisData, type, reviewsWithQuizData) {
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
    
    // Generate more descriptive and varied task titles
    const taskTitles = [
      `Strengthen Your ${conceptData.concept} Skills`,
      `Deep Dive into ${conceptData.concept}`,
      `Practice ${conceptData.concept} Fundamentals`, 
      `Build Confidence in ${conceptData.concept}`,
      `${conceptData.concept} Problem Solving Workshop`,
      `Advanced ${conceptData.concept} Study Session`,
      `Complete Guide to ${conceptData.concept}`,
      `${conceptData.concept} Mastery Challenge`,
      `Explore ${conceptData.concept} in Detail`,
      `Solidify Your ${conceptData.concept} Understanding`,
      `${conceptData.concept} Concepts & Applications`,
      `Hands-on ${conceptData.concept} Practice`
    ];
    
    const titleIndex = index % taskTitles.length;
    const taskTitle = taskTitles[titleIndex];
    
    const task = {
      title: taskTitle,
      details: generateConceptTaskDetails(conceptData),
      start_date: startDate,
      due_date: endDate,
      priority: conceptData.priority,
      difficulty_level: mapMasteryToDifficulty(conceptData.masteryLevel),
      estimated_time: calculateEstimatedTime(conceptData.priority, isWeekly),
      subject: conceptData.subject,
      concepts: [conceptData.concept],
      resources: generateConceptResourcesFromReviews(conceptData, reviewsWithQuizData)
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
      resources: generateReviewResources(conceptsToStudy, reviewsWithQuizData)
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
  const detailTemplates = [
    `Dive deep into "${conceptData.concept}" in ${conceptData.subject}. Build a strong foundation through structured learning and hands-on practice.`,
    `Strengthen your understanding of "${conceptData.concept}" with focused study sessions and practical applications.`,
    `Master the fundamentals of "${conceptData.concept}" through comprehensive review and targeted practice exercises.`,
    `Develop expertise in "${conceptData.concept}" by exploring core concepts and solving challenging problems.`,
    `Enhance your "${conceptData.concept}" skills with interactive learning and real-world application scenarios.`,
    `Build confidence in "${conceptData.concept}" through step-by-step learning and progressive skill development.`,
    `Explore advanced aspects of "${conceptData.concept}" and strengthen your problem-solving abilities.`,
    `Solidify your grasp of "${conceptData.concept}" through comprehensive study and practical implementation.`
  ];
  
  const templateIndex = Math.floor(Math.random() * detailTemplates.length);
  const baseDetails = detailTemplates[templateIndex];
  
  const weaknessInfo = `\nCurrent level: ${conceptData.masteryLevel} • Priority: ${conceptData.priority}`;
  
  const suggestions = conceptData.allSuggestions && conceptData.allSuggestions.length > 0 
    ? `\n\n🎯 AI Recommendations:\n${conceptData.allSuggestions.slice(0, 2).map(s => `• ${s}`).join('\n')}`
    : '';
  
  const studySteps = `\n\n📚 Study Plan:
• Review core concepts and terminology
• Practice with guided examples  
• Identify and address common mistakes
• Apply knowledge to diverse problems
• Self-assess with practice questions`;
  
  return `${baseDetails}${weaknessInfo}${suggestions}${studySteps}`;
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

function generateConceptResourcesFromReviews(conceptData, reviewsWithQuizData) {
  const resources = [];
  
  // Find AI reviews that contain this concept
  const relevantReviews = reviewsWithQuizData.filter(reviewData => {
    return reviewData.learning_resources && 
           reviewData.learning_resources[conceptData.concept] &&
           reviewData.learning_resources[conceptData.concept].resources;
  });
  
  // Extract resources from AI reviews
  relevantReviews.forEach(reviewData => {
    const conceptResources = reviewData.learning_resources[conceptData.concept];
    if (conceptResources && conceptResources.resources) {
      conceptResources.resources.forEach(resource => {
        // Add the resource with proper structure, filtering out undefined values
        const cleanResource = {
          title: resource.title || `${conceptData.concept} Study Material`,
          type: resource.type || "Study Guide",
          url: resource.url || `https://www.google.com/search?q=${encodeURIComponent(conceptData.concept + ' ' + conceptData.subject + ' learn')}`
        };
        
        // Only add optional fields if they have valid values
        if (resource.description && resource.description !== 'undefined') {
          cleanResource.description = resource.description;
        }
        if (resource.difficulty && resource.difficulty !== 'undefined') {
          cleanResource.difficulty = resource.difficulty;
        }
        
        resources.push(cleanResource);
      });
    }
  });
  
  // Always ensure we have at least 3 high-quality resources
  const ensuredResources = [...resources];
  
  // Add curated resources based on concept and subject
  const curatedResources = generateCuratedResources(conceptData);
  curatedResources.forEach(resource => {
    // Only add if we don't already have a similar resource
    const exists = ensuredResources.some(existing => 
      existing.title.toLowerCase().includes(resource.title.toLowerCase().substring(0, 10)) ||
      existing.url === resource.url
    );
    if (!exists) {
      ensuredResources.push(resource);
    }
  });
  
  // Limit to 3 resources for better UI display
  return ensuredResources.slice(0, 3);
}

// Generate curated, high-quality resources based on concept and subject
function generateCuratedResources(conceptData) {
  const concept = conceptData.concept.toLowerCase();
  const subject = conceptData.subject.toLowerCase();
  
  const resources = [];
  
  // Subject-specific curated resources
  if (subject.includes('javascript') || subject.includes('js')) {
    if (concept.includes('variable') || concept.includes('var')) {
      resources.push(
        {
          title: "JavaScript Variables Guide - MDN",
          type: "Documentation",
          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#variables",
          description: "Official MDN documentation on JavaScript variables",
          difficulty: "Beginner"
        },
        {
          title: "JavaScript Variables Tutorial",
          type: "Interactive Tutorial",
          url: "https://www.w3schools.com/js/js_variables.asp",
          description: "Interactive tutorial on JavaScript variables",
          difficulty: "Beginner"
        }
      );
    } else if (concept.includes('function')) {
      resources.push(
        {
          title: "JavaScript Functions - MDN",
          type: "Documentation", 
          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions",
          description: "Comprehensive guide to JavaScript functions",
          difficulty: "Intermediate"
        },
        {
          title: "Function Exercises - freeCodeCamp",
          type: "Practice",
          url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-javascript/",
          description: "Practice JavaScript functions with exercises",
          difficulty: "Beginner"
        }
      );
    } else if (concept.includes('loop')) {
      resources.push(
        {
          title: "JavaScript Loops Guide",
          type: "Tutorial",
          url: "https://www.w3schools.com/js/js_loop_for.asp",
          description: "Learn JavaScript loops with examples",
          difficulty: "Beginner"
        },
        {
          title: "Loop Practice Problems",
          type: "Practice",
          url: "https://www.codewars.com/kata/search/javascript?tags=loops",
          description: "Practice loop problems on Codewars",
          difficulty: "Intermediate"
        }
      );
    }
  } else if (subject.includes('python')) {
    if (concept.includes('variable')) {
      resources.push(
        {
          title: "Python Variables Tutorial",
          type: "Tutorial",
          url: "https://www.w3schools.com/python/python_variables.asp",
          description: "Learn Python variables and data types",
          difficulty: "Beginner"
        },
        {
          title: "Python Variables - Real Python",
          type: "Guide",
          url: "https://realpython.com/python-variables/",
          description: "In-depth guide to Python variables",
          difficulty: "Intermediate"
        }
      );
    } else if (concept.includes('function')) {
      resources.push(
        {
          title: "Python Functions Guide",
          type: "Documentation",
          url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions",
          description: "Official Python documentation on functions",
          difficulty: "Intermediate"
        },
        {
          title: "Python Function Exercises",
          type: "Practice",
          url: "https://www.hackerrank.com/domains/python",
          description: "Practice Python functions on HackerRank",
          difficulty: "Beginner"
        }
      );
    }
  } else if (subject.includes('math')) {
    resources.push(
      {
        title: `${conceptData.concept} - Khan Academy`,
        type: "Video Course",
        url: `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(conceptData.concept)}`,
        description: `Learn ${conceptData.concept} with Khan Academy`,
        difficulty: "All Levels"
      },
      {
        title: `${conceptData.concept} Practice`,
        type: "Practice",
        url: `https://www.mathway.com/`,
        description: `Practice ${conceptData.concept} problems`,
        difficulty: "All Levels"
      }
    );
  }
  
  // Generic fallback resources
  if (resources.length === 0) {
    resources.push(
      {
        title: `Learn ${conceptData.concept}`,
        type: "Tutorial",
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(conceptData.concept + ' ' + conceptData.subject + ' tutorial')}`,
        description: `Video tutorials for ${conceptData.concept}`,
        difficulty: "Beginner"
      },
      {
        title: `${conceptData.concept} Practice`,
        type: "Practice",
        url: `https://www.google.com/search?q=${encodeURIComponent(conceptData.concept + ' ' + conceptData.subject + ' practice exercises')}`,
        description: `Practice exercises for ${conceptData.concept}`,
        difficulty: "Intermediate"
      },
      {
        title: `${conceptData.concept} Reference`,
        type: "Reference",
        url: `https://www.google.com/search?q=${encodeURIComponent(conceptData.concept + ' ' + conceptData.subject + ' documentation')}`,
        description: `Reference materials for ${conceptData.concept}`,
        difficulty: "All Levels"
      }
    );
  }
  
  return resources;
}

function generateReviewResources(conceptsToStudy, reviewsWithQuizData) {
  const resources = [
    {
      title: "Create Practice Quiz",
      type: "Quiz",
      url: "/quiz",
      description: "Test your understanding of all studied concepts",
      difficulty: "All Levels"
    }
  ];
  
  // Add summary resources from AI reviews
  const allReviewResources = [];
  reviewsWithQuizData.forEach(reviewData => {
    if (reviewData.learning_resources) {
      Object.values(reviewData.learning_resources).forEach(conceptResource => {
        if (conceptResource.resources) {
          allReviewResources.push(...conceptResource.resources);
        }
      });
    }
  });
  
  // Find unique summary/overview type resources
  const summaryResources = allReviewResources.filter(resource => 
    resource.type && resource.type.toLowerCase().includes('guide') || 
    resource.type && resource.type.toLowerCase().includes('reference') ||
    resource.title && resource.title.toLowerCase().includes('complete') ||
    resource.title && resource.title.toLowerCase().includes('comprehensive')
  );
  
  if (summaryResources.length > 0) {
    const summaryResource = summaryResources[0];
    const cleanSummaryResource = {
      title: summaryResource.title || "Comprehensive Study Guide",
      type: summaryResource.type || "Study Guide",
      url: summaryResource.url || `https://www.google.com/search?q=${encodeURIComponent('comprehensive study guide')}`
    };
    
    // Only add optional fields if they have valid values
    if (summaryResource.description && summaryResource.description !== 'undefined') {
      cleanSummaryResource.description = `Comprehensive review material covering multiple concepts`;
    }
    if (summaryResource.difficulty && summaryResource.difficulty !== 'undefined') {
      cleanSummaryResource.difficulty = "All Levels";
    }
    
    resources.push(cleanSummaryResource);
  }
  
  // Add concept summary notes
  resources.push({
    title: "Concept Summary Notes",
    type: "Study Guide",
    url: `https://www.google.com/search?q=${encodeURIComponent(conceptsToStudy.map(c => c.concept).join(' ') + ' summary notes')}`,
    description: `Summary notes covering: ${conceptsToStudy.map(c => c.concept).join(', ')}`,
    difficulty: "All Levels"
  });
  
  return resources;
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

// Get study notes for a planner with enriched resource data
export const getStudyNotesWithResources = query({
  args: { plannerId: v.string() },
  async handler(ctx, args) {
    const notes = await ctx.db
      .query("study_notes")
      .withIndex("by_planner_id", (q) => q.eq("planner_id", args.plannerId))
      .order("asc")
      .collect();
    
    // Sort by position index and return with properly formatted resource data
    return notes
      .sort((a, b) => a.position_index - b.position_index)
      .map(note => ({
        ...note,
        resources: (note.resources || []).map(resource => ({
          title: resource.title || "Study Resource",
          type: resource.type || "Link", 
          url: resource.url || "#",
          description: resource.description || `Learn more about ${note.concepts[0] || note.subject}`,
          difficulty: resource.difficulty || "All Levels",
          isClickable: Boolean(resource.url && resource.url !== "#")
        })).slice(0, 3), // Limit to 3 resources for better display
        hasResources: (note.resources || []).length > 0
      }));
  }
});

// Update study notes resources from AI reviews
export const updateStudyNotesResources = mutation({
  args: { 
    plannerId: v.string(),
    username: v.string()
  },
  async handler(ctx, args) {
    // Get the planner
    const planner = await ctx.db.get(args.plannerId);
    if (!planner || planner.username !== args.username) {
      throw new Error("Planner not found or access denied");
    }
    
    // Get all study notes for this planner
    const notes = await ctx.db
      .query("study_notes")
      .withIndex("by_planner_id", (q) => q.eq("planner_id", args.plannerId))
      .collect();
    
    // Get AI reviews for this user
    const reviews = await ctx.db
      .query("ai_review")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .collect();
    
    // Prepare reviews with quiz data
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
    
    let updatedCount = 0;
    
    // Update each note's resources
    for (const note of notes) {
      const conceptData = {
        concept: note.concepts[0], // Use the first concept
        subject: note.subject,
        priority: note.priority,
        masteryLevel: note.difficulty_level
      };
      
      const newResources = generateConceptResourcesFromReviews(conceptData, reviewsWithQuizData);
      
      // Only update if we found new resources
      if (newResources.length > 0) {
        await ctx.db.patch(note._id, {
          resources: newResources
        });
        updatedCount++;
      }
    }
    
    return {
      plannerId: args.plannerId,
      updatedNotesCount: updatedCount,
      totalNotesCount: notes.length,
      success: true
    };
  }
});

// Get all resources for a specific concept across all user's reviews
export const getConceptResources = query({
  args: { 
    username: v.string(),
    concept: v.string()
  },
  async handler(ctx, args) {
    const reviews = await ctx.db
      .query("ai_review")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .collect();
    
    const resources = [];
    
    reviews.forEach(review => {
      if (review.learning_resources && review.learning_resources[args.concept]) {
        const conceptResources = review.learning_resources[args.concept];
        if (conceptResources.resources) {
          resources.push(...conceptResources.resources);
        }
      }
    });
    
    // Remove duplicates based on URL and format for display
    const uniqueResources = resources.filter((resource, index, self) => 
      index === self.findIndex(r => r.url === resource.url)
    );
    
    return uniqueResources.map(resource => ({
      title: resource.title || "Study Resource",
      type: resource.type || "Link",
      url: resource.url || "#",
      description: resource.description || "",
      difficulty: resource.difficulty || "All Levels",
      isClickable: Boolean(resource.url && resource.url !== "#")
    })).slice(0, 3);
  }
});

// Get formatted study note resources for UI display
export const getStudyNoteResources = query({
  args: { noteId: v.string() },
  async handler(ctx, args) {
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Study note not found");
    }
    
    const resources = note.resources || [];
    
    // Format resources for UI display with fallbacks
    const formattedResources = resources.map((resource, index) => ({
      id: `${args.noteId}_resource_${index}`,
      title: resource.title || `${note.concepts[0] || note.subject} Study Material`,
      type: resource.type || "Study Guide",
      url: resource.url || `https://www.google.com/search?q=${encodeURIComponent((note.concepts[0] || note.subject) + ' learn')}`,
      description: resource.description || `Study materials for ${note.concepts[0] || note.subject}`,
      difficulty: resource.difficulty || "All Levels",
      isClickable: true,
      color: getResourceTypeColor(resource.type || "Study Guide")
    }));
    
    // Ensure we have at least 2-3 resources for display
    while (formattedResources.length < 3) {
      const concept = note.concepts[0] || note.subject;
      const resourceTypes = ["Tutorial", "Practice", "Reference"];
      const typeIndex = formattedResources.length;
      const resourceType = resourceTypes[typeIndex] || "Study Guide";
      
      formattedResources.push({
        id: `${args.noteId}_fallback_${typeIndex}`,
        title: `${concept} ${resourceType}`,
        type: resourceType,
        url: generateFallbackUrl(concept, note.subject, resourceType),
        description: `${resourceType} materials for ${concept}`,
        difficulty: "All Levels",
        isClickable: true,
        color: getResourceTypeColor(resourceType)
      });
    }
    
    return formattedResources.slice(0, 3);
  }
});

// Helper function to generate fallback URLs
function generateFallbackUrl(concept, subject, type) {
  const searchQuery = encodeURIComponent(`${concept} ${subject} ${type.toLowerCase()}`);
  
  switch (type.toLowerCase()) {
    case 'tutorial':
      return `https://www.youtube.com/results?search_query=${searchQuery}`;
    case 'practice':
      return `https://www.google.com/search?q=${searchQuery}+practice+exercises`;
    case 'reference':
      return `https://www.google.com/search?q=${searchQuery}+documentation`;
    default:
      return `https://www.google.com/search?q=${searchQuery}`;
  }
}

// Helper function to get color for resource type
function getResourceTypeColor(type) {
  const colors = {
    'book': 'blue',
    'guide': 'blue',
    'tutorial': 'green', 
    'video': 'red',
    'practice': 'orange',
    'quiz': 'purple',
    'reference': 'gray',
    'interactive': 'indigo'
  };
  
  const typeKey = type.toLowerCase();
  for (const [key, color] of Object.entries(colors)) {
    if (typeKey.includes(key)) {
      return color;
    }
  }
  return 'blue'; // default color
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
