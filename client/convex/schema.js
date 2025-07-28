import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  login: defineTable({
    email: v.string(),
    otp: v.string(),
    status: v.boolean(),
    lastLoggedIn: v.optional(v.number()),
    lastLoggedOut: v.optional(v.number()),
    lastLoginDuration: v.optional(v.string()),
  }).index("by_email", ["email"]),
  
  register: defineTable({
    username: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    password: v.optional(v.string()),
    isVerified: v.boolean(),
    createdAt: v.number(),
  }).index("by_username", ["username"])
    .index("by_email", ["email"])
    .index("by_phone", ["phoneNumber"]),

  verification: defineTable({
    email: v.string(),
    otp: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    isUsed: v.boolean(),
  }).index("by_email", ["email"])
    .index("by_otp", ["otp"]),

  org: defineTable({
    org_name: v.string(),
    org_user: v.string(), // Username from localStorage
    org_mail: v.string(),
    org_verified: v.boolean(),
    class_sec: v.string(),
    semester: v.string(), // Add semester field
    branch: v.string(),
    createdAt: v.number(),
    verifiedAt: v.optional(v.number()),
  }).index("by_org_user", ["org_user"])
    .index("by_org_mail", ["org_mail"])
    .index("by_verified", ["org_verified"])
    .index("by_semester", ["semester"]),

  quizzes: defineTable({
    username: v.string(),
    subject: v.string(),
    concept: v.optional(v.string()),
    numberOfQuestions: v.number(),
    quizType: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    createdAt: v.number(),
    score: v.optional(v.number()),
    completed: v.optional(v.boolean()),
    attemptedAt: v.optional(v.number()),
    retakeCount: v.optional(v.number())
  }).index("by_username", ["username"])
    .index("by_attemptedAt", ["attemptedAt"]),

  quiz_questions: defineTable({
    quizId: v.string(),
    questionText: v.string(),
    questionType: v.optional(v.string()),
    aiAnswer: v.string(),
    options: v.optional(v.array(v.string())),
    explanation: v.string(),
    acceptableAnswers: v.optional(v.array(v.string())),
    keywordMatches: v.optional(v.array(v.string())), // Add this field
    createdAt: v.number()
  }).index("by_quizId", ["quizId"]),

  user_answers: defineTable({
    username: v.string(),
    quizId: v.string(),
    questionId: v.string(),
    userAnswer: v.string(),
    isCorrect: v.boolean(),
    submittedAt: v.number(),
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
  }).index("by_username_quizId", ["username", "quizId"]),

  ai_review: defineTable({
      quiz_id: v.string(),
      username: v.string(),
      feedback: v.string(),
      improvement_suggestions: v.string(),
      strengths: v.string(),
      concept_breakdown: v.array(v.object({
        concept: v.string(),
        mastery_level: v.string(),
        suggestion: v.string()
      })),
      learning_resources: v.any(),
      created_at: v.number()
    }).index("by_quiz_id", ["quiz_id"])
      .index("by_username", ["username"]),

  chat_sessions: defineTable({
    sessionId: v.string(),
    username: v.string(),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    messageCount: v.optional(v.number()),
    lastMessage: v.optional(v.string())
  }).index("by_username", ["username"])
    .index("by_sessionId", ["sessionId"])
    .index("by_updatedAt", ["updatedAt"]),

  chat_messages: defineTable({
    sessionId: v.string(),
    username: v.string(),
    role: v.string(), // 'user' or 'assistant'
    content: v.string(),
    timestamp: v.number(),
    messageType: v.optional(v.string()), // 'text', 'image', 'file'
    metadata: v.optional(v.any()) // For storing file info, image data, etc.
  }).index("by_sessionId", ["sessionId"])
    .index("by_timestamp", ["timestamp"]),

  // Study Planner Tables
  study_planner: defineTable({
    username: v.string(),
    type: v.string(), // 'weekly' or 'monthly'
    title: v.string(),
    description: v.string(),
    created_at: v.number(),
    expires_at: v.number(),
    status: v.string(), // 'active', 'expired', 'completed', 'dropped'
    completion_percentage: v.number(),
    total_notes: v.number(),
    completed_notes: v.number(),
    generated_from_reviews: v.array(v.string()), // Array of review IDs used to generate this planner
    reactivated_at: v.optional(v.number()),
    dropped_at: v.optional(v.number()),
  }).index("by_username", ["username"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_expires_at", ["expires_at"]),

  study_notes: defineTable({
    planner_id: v.string(),
    title: v.string(),
    details: v.string(),
    start_date: v.number(),
    due_date: v.number(),
    is_completed: v.boolean(),
    completed_at: v.optional(v.number()),
    position_index: v.number(),
    connected_to: v.optional(v.string()), // ID of the next connected note
    priority: v.string(), // 'high', 'medium', 'low'
    difficulty_level: v.string(), // 'easy', 'medium', 'hard'
    estimated_time: v.string(), // e.g., "30 minutes", "2 hours"
    subject: v.string(),
    concepts: v.array(v.string()), // Array of concept names this note covers
    resources: v.optional(v.array(v.object({
      title: v.string(),
      type: v.string(),
      url: v.optional(v.string()),
      description: v.optional(v.string()),
      difficulty: v.optional(v.string())
    }))),
  }).index("by_planner_id", ["planner_id"])
    .index("by_position", ["position_index"])
    .index("by_due_date", ["due_date"])
    .index("by_completion", ["is_completed"]),

  // Knowledge Nest File Storage
  knowledge_nest: defineTable({
    file_id: v.string(), // Convex file storage ID
    organization_id: v.string(), // Reference to org table
    class_sec: v.string(),
    semester: v.string(), // Add semester field for filtering
    branch: v.string(),
    uploaded_username: v.string(),
    subject: v.string(),
    filename: v.string(), // Original filename
    file_size: v.number(), // File size in bytes
    file_type: v.string(), // MIME type
    upload_date: v.number(),
    description: v.optional(v.string()),
    is_active: v.boolean(), // For soft delete
  }).index("by_organization", ["organization_id"])
    .index("by_class_sec", ["class_sec"])
    .index("by_semester", ["semester"])
    .index("by_branch", ["branch"])
    .index("by_username", ["uploaded_username"])
    .index("by_subject", ["subject"])
    .index("by_upload_date", ["upload_date"])
    .index("by_org_semester", ["organization_id", "semester"])
    .index("by_semester_only", ["semester"])
    .index("by_org_branch_semester", ["organization_id", "branch", "semester"]) // Compound index for optimal filtering
});