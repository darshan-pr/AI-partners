import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createQuiz = mutation({
  args: {
    username: v.string(),
    subject: v.string(),
    concept: v.optional(v.string()),
    numberOfQuestions: v.number(),
    quizType: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    questions: v.array(v.object({
      questionText: v.string(),
      questionType: v.optional(v.string()),
      options: v.optional(v.array(v.string())),
      aiAnswer: v.string(),
      acceptableAnswers: v.optional(v.array(v.string())),
      keywordMatches: v.optional(v.array(v.string())), // Add this
      explanation: v.string()
    }))
  },
  async handler(ctx, args) {
    const quizId = await ctx.db.insert("quizzes", {
      username: args.username,
      subject: args.subject,
      concept: args.concept || undefined,
      numberOfQuestions: args.numberOfQuestions,
      quizType: args.quizType || "mixed",
      difficulty: args.difficulty || "medium",
      createdAt: Date.now(),
      retakeCount: 0
    });

    for (const question of args.questions) {
      await ctx.db.insert("quiz_questions", {
        quizId,
        questionText: question.questionText,
        questionType: question.questionType || "mcq",
        options: question.options || undefined,
        aiAnswer: question.aiAnswer,
        acceptableAnswers: question.acceptableAnswers || undefined,
        keywordMatches: question.keywordMatches || undefined, // Add this
        explanation: question.explanation,
        createdAt: Date.now()
      });
    }

    return quizId;
  }
});

export const getUserQuizzes = query({
  args: { username: v.optional(v.string()) },
  async handler(ctx, args) {
    if (!args.username) return [];
    
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .order("desc")
      .collect();

    const detailedQuizzes = await Promise.all(
      quizzes.map(async (quiz) => {
        const questions = await ctx.db
          .query("quiz_questions")
          .withIndex("by_quizId", (q) => q.eq("quizId", quiz._id))
          .collect();

        const answers = await ctx.db
          .query("user_answers")
          .withIndex("by_username_quizId", (q) => 
            q.eq("username", args.username).eq("quizId", quiz._id))
          .collect();

        return {
          ...quiz,
          questions,
          answers
        };
      })
    );

    return detailedQuizzes;
  }
});

export const getQuizById = query({
  args: { quizId: v.string() },
  async handler(ctx, args) {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) return null;

    const questions = await ctx.db
      .query("quiz_questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    return {
      ...quiz,
      questions
    };
  }
});

export const submitQuizAnswers = mutation({
  args: {
    quizId: v.string(),
    username: v.string(),
    answers: v.array(v.object({
      questionId: v.string(),
      userAnswer: v.string(),
      isCorrect: v.boolean(),
      analysisData: v.optional(v.object({
        confidence: v.number(),
        keywordMatches: v.array(v.string()),
        missingKeywords: v.array(v.string()),
        reasoning: v.string(),
        partialCredit: v.boolean(),
        educationalFeedback: v.string(),
        conceptsIdentified: v.array(v.string()),
        improvementSuggestion: v.string()
      }))
    }))
  },
  async handler(ctx, args) {
    for (const answer of args.answers) {
      await ctx.db.insert("user_answers", {
        username: args.username,
        quizId: args.quizId,
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        isCorrect: answer.isCorrect,
        submittedAt: Date.now(),
        analysisData: answer.analysisData || undefined
      });
    }
    return true;
  }
});

export const updateQuizScore = mutation({
  args: {
    quizId: v.string(),
    score: v.number(),
    completed: v.boolean()
  },
  async handler(ctx, args) {
    await ctx.db.patch(args.quizId, {
      score: args.score,
      completed: args.completed,
      attemptedAt: Date.now()
    });
  }
});

export const retakeQuiz = mutation({
  args: { quizId: v.string() },
  async handler(ctx, args) {
    const quiz = await ctx.db.get(args.quizId);
    
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    if (quiz.retakeCount >= 1) {
      throw new Error("Maximum retake attempts reached");
    }

    await ctx.db.patch(args.quizId, {
      completed: false,
      retakeCount: (quiz.retakeCount || 0) + 1,
      attemptedAt: Date.now()
    });

    const previousAnswers = await ctx.db
      .query("user_answers")
      .withIndex("by_username_quizId", (q) => 
        q.eq("username", quiz.username).eq("quizId", args.quizId))
      .collect();

    for (const answer of previousAnswers) {
      await ctx.db.delete(answer._id);
    }

    return { success: true };
  }
});

export const keepPreviousScore = mutation({
  args: {
    quizId: v.string()
  },
  async handler(ctx, args) {
    const quiz = await ctx.db.get(args.quizId);
    
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    // Mark quiz as completed and update retake count if it's the first retake
    const updateData = {
      completed: true,
      attemptedAt: Date.now()
    };

    // If this is the first attempt (retakeCount is 0), increment it to 1
    if (quiz.retakeCount === 0) {
      updateData.retakeCount = 1;
    }

    await ctx.db.patch(args.quizId, updateData);

    // Clear any answers from the current attempt
    const currentAnswers = await ctx.db
      .query("user_answers")
      .withIndex("by_username_quizId", (q) => 
        q.eq("username", quiz.username).eq("quizId", args.quizId))
      .collect();

    for (const answer of currentAnswers) {
      await ctx.db.delete(answer._id);
    }

    return { success: true };
  }
});

// Get user answers with detailed analysis data
export const getUserAnswersWithAnalysis = query({
  args: { 
    quizId: v.string(),
    username: v.string()
  },
  async handler(ctx, args) {
    const answers = await ctx.db
      .query("user_answers")
      .withIndex("by_username_quizId", (q) => 
        q.eq("username", args.username).eq("quizId", args.quizId))
      .collect();

    // Enrich answers with question data
    const enrichedAnswers = await Promise.all(
      answers.map(async (answer) => {
        const question = await ctx.db.get(answer.questionId);
        return {
          ...answer,
          questionData: question
        };
      })
    );

    return enrichedAnswers;
  }
});