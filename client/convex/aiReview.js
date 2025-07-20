import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Get AI review for a quiz
export const getReviewByQuizId = query({
  args: { quizId: v.string() },
  async handler(ctx, args) {
    const review = await ctx.db
      .query("ai_review")
      .withIndex("by_quiz_id", (q) => q.eq("quiz_id", args.quizId))
      .first();
    
    return review;
  }
});

// Get all AI reviews for a user
export const getUserAiReviews = query({
  args: { username: v.string() },
  async handler(ctx, args) {
    const reviews = await ctx.db
      .query("ai_review")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .collect();
    
    return reviews;
  }
});

// Generate AI review for a quiz
export const generateReview = mutation({
  args: { 
    quizId: v.string(),
    username: v.string()
  },
  async handler(ctx, args) {
    // Check if review already exists
    const existingReview = await ctx.db
      .query("ai_review")
      .withIndex("by_quiz_id", (q) => q.eq("quiz_id", args.quizId))
      .first();
    
    if (existingReview) {
      return existingReview._id;
    }
    
    // Fetch quiz data
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }
    
    // Fetch questions
    const questions = await ctx.db
      .query("quiz_questions")
      .withIndex("by_quizId", (q) => q.eq("quizId", args.quizId))
      .collect();
    
    // Fetch user answers
    const userAnswers = await ctx.db
      .query("user_answers")
      .withIndex("by_username_quizId", (q) => 
        q.eq("username", args.username).eq("quizId", args.quizId))
      .collect();
    
    // Structure the data for analysis
    const quizData = {
      subject: quiz.subject,
      score: quiz.score,
      questions: questions.map(q => {
        const userAnswer = userAnswers.find(a => a.questionId === q._id);
        return {
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.aiAnswer,
          userAnswer: userAnswer ? userAnswer.userAnswer : null,
          isCorrect: userAnswer ? userAnswer.isCorrect : false,
          explanation: q.explanation,
          analysisData: userAnswer ? userAnswer.analysisData : null,
          keywordMatches: q.keywordMatches || []
        };
      })
    };
    
    // Generate concept breakdown
    let conceptBreakdown = analyzeQuizByConceptAreas(quizData);
    
    // Ensure we have at least 2 concepts for the radar chart
    if (conceptBreakdown.length < 2) {
      console.log(`Generated only ${conceptBreakdown.length} concepts, adding generic concept`);
      
      // Add a generic concept based on the subject
      conceptBreakdown.push({
        concept: quizData.subject,
        mastery_level: quizData.score >= 70 ? "Strong" : 
                        quizData.score >= 50 ? "Moderate" : "Needs Improvement",
        suggestion: `Continue practicing general ${quizData.subject} concepts to improve your understanding.`
      });
      
      // If we still don't have enough, add one more
      if (conceptBreakdown.length < 2) {
        conceptBreakdown.push({
          concept: "General Knowledge",
          mastery_level: quizData.score >= 70 ? "Strong" : 
                          quizData.score >= 50 ? "Moderate" : "Needs Improvement",
          suggestion: "Keep expanding your knowledge across different areas of this subject."
        });
      }
    }
    
    // Generate feedback and improvement suggestions
    const feedback = generateFeedback(quizData);
    const suggestions = generateSuggestions(quizData);
    const strengths = identifyStrengths(quizData);
    
    // Generate personalized learning resources
    const learningResources = generateLearningResources(quizData, conceptBreakdown);
    
    // Debug: log concept data
    console.log('Generated concept breakdown:', conceptBreakdown);
    
    // Save the review to the database
    const reviewId = await ctx.db.insert("ai_review", {
      quiz_id: args.quizId,
      username: args.username,
      feedback,
      improvement_suggestions: suggestions,
      strengths,
      concept_breakdown: conceptBreakdown,
      learning_resources: learningResources,
      created_at: Date.now()
    });
    
    return reviewId;
  }
});

// Update the analyzeQuizByConceptAreas function to provide more specific feedback

function analyzeQuizByConceptAreas(quizData) {
  // Group questions by concepts
  const concepts = {};
  
  quizData.questions.forEach(question => {
    const possibleConcepts = extractConceptsFromQuestion(question.questionText, quizData.subject, question.analysisData);
    
    possibleConcepts.forEach(concept => {
      if (!concepts[concept]) {
        concepts[concept] = {
          total: 0,
          correct: 0,
          questions: []
        };
      }
      
      concepts[concept].total += 1;
      if (question.isCorrect) {
        concepts[concept].correct += 1;
      }
      concepts[concept].questions.push({
        text: question.questionText,
        isCorrect: question.isCorrect,
        userAnswer: question.userAnswer,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        analysisData: question.analysisData
      });
    });
  });
  
  // Convert to the required format with specific feedback
  return Object.entries(concepts).map(([concept, data]) => {
    const mastery = (data.correct / data.total) * 100;
    let masteryLevel;
    let suggestion;
    
    if (mastery >= 80) {
      masteryLevel = "Strong";
      
      // For strong concepts, offer advanced learning suggestions
      suggestion = `You have a strong grasp of ${concept}. To further enhance your knowledge, consider exploring advanced topics like ${getAdvancedTopics(concept, quizData.subject)}.`;
    } else if (mastery >= 50) {
      masteryLevel = "Moderate";
      
      // For moderate mastery, identify specific improvement areas
      const incorrectQuestions = data.questions.filter(q => !q.isCorrect);
      const specificIssue = identifySpecificIssue(incorrectQuestions, concept);
      
      suggestion = `You have a basic understanding of ${concept}, but need to strengthen certain aspects. ${specificIssue} Practice with more exercises focusing on these specific challenges.`;
    } else {
      masteryLevel = "Needs Improvement";
      
      // For weak areas, provide foundational guidance
      const misconceptions = identifyMisconceptions(data.questions, concept);
      
      suggestion = `This appears to be a challenging area. ${misconceptions} Start by reviewing the fundamental principles of ${concept} and work through basic examples before tackling more complex problems.`;
    }
    
    return {
      concept,
      mastery_level: masteryLevel,
      suggestion
    };
  });
}

// Helper function to identify specific issues in moderately understood concepts
function identifySpecificIssue(incorrectQuestions, concept) {
  if (incorrectQuestions.length === 0) return "";
  
  // Look for patterns in the incorrect questions
  const commonWords = findCommonWords(incorrectQuestions.map(q => q.text));
  
  // Map concepts to specific sub-topics
  const conceptSubtopics = {
    "variables": ["scope", "declaration", "assignment", "hoisting"],
    "functions": ["parameters", "return values", "closures", "callbacks"],
    "loops": ["for loops", "while loops", "iteration", "break/continue"],
    "objects": ["properties", "methods", "prototypes", "destructuring"],
    "arrays": ["array methods", "indexing", "iteration", "multidimensional arrays"],
    "async": ["event loop", "callbacks", "promises", "async/await"],
    "promises": ["chaining", "error handling", "Promise.all", "async/await"],
    "DOM": ["selectors", "event handling", "manipulation", "traversal"],
    // Add more concept mappings as needed
  };
  
  // Check if we can identify specific subtopics
  const subtopics = conceptSubtopics[concept] || [];
  const identifiedSubtopics = subtopics.filter(subtopic => 
    incorrectQuestions.some(q => 
      q.text.toLowerCase().includes(subtopic.toLowerCase()) || 
      (q.explanation && q.explanation.toLowerCase().includes(subtopic.toLowerCase()))
    )
  );
  
  if (identifiedSubtopics.length > 0) {
    return `You specifically struggled with ${identifiedSubtopics.join(", ")} within ${concept}.`;
  }
  
  // Fallback to a more generic analysis
  return `You seem to have difficulty with questions involving ${commonWords.slice(0, 2).join(", ")} in ${concept}.`;
}

// Helper function to identify misconceptions
function identifyMisconceptions(questions, concept) {
  const incorrectQuestions = questions.filter(q => !q.isCorrect);
  if (incorrectQuestions.length === 0) return "";
  
  // Look for patterns in incorrect answers
  const patterns = {
    "variables": {
      keywords: ["const", "let", "var", "scope", "global", "local"],
      misconception: "You may be confusing variable scope or declaration types."
    },
    "functions": {
      keywords: ["return", "parameter", "argument", "call", "invoke"],
      misconception: "You seem to have difficulty with function parameters or return values."
    },
    "loops": {
      keywords: ["iteration", "index", "break", "continue", "condition"],
      misconception: "You might be struggling with loop conditions or iteration control."
    },
    // Add more patterns as needed
  };
  
  const conceptPattern = patterns[concept];
  if (conceptPattern) {
    const hasKeywords = incorrectQuestions.some(q => 
      conceptPattern.keywords.some(keyword => 
        q.text.toLowerCase().includes(keyword) || 
        (q.explanation && q.explanation.toLowerCase().includes(keyword))
      )
    );
    
    if (hasKeywords) {
      return conceptPattern.misconception;
    }
  }
  
  // Fallback message
  return `Based on your answers, you may have some fundamental misconceptions about ${concept}.`;
}

// Helper function to suggest advanced topics
function getAdvancedTopics(concept, subject) {
  const advancedTopicsMap = {
    "variables": "closures and lexical scoping",
    "functions": "higher-order functions and functional programming patterns",
    "loops": "recursive algorithms and advanced iteration techniques",
    "objects": "object composition patterns and prototype inheritance",
    "arrays": "functional array methods and advanced data manipulation",
    "async": "advanced state management in asynchronous flows",
    "promises": "custom promise implementations and advanced error handling strategies",
    "DOM": "virtual DOM concepts and optimization techniques",
    // Add more advanced topics as needed
  };
  
  return advancedTopicsMap[concept] || `advanced applications of ${concept}`;
}

// Helper function to find common words in a set of strings
function findCommonWords(strings) {
  const wordCounts = {};
  const stopWords = ["the", "a", "an", "in", "on", "at", "to", "for", "with", "by", "and", "or", "of"];
  
  strings.forEach(str => {
    const words = str.toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word));
    
    new Set(words).forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  });
  
  return Object.entries(wordCounts)
    .filter(([_, count]) => count > 1)
    .sort(([_, countA], [__, countB]) => countB - countA)
    .map(([word]) => word);
}

// Helper function to generate feedback
function generateFeedback(quizData) {
  const correctCount = quizData.questions.filter(q => q.isCorrect).length;
  const totalCount = quizData.questions.length;
  const percentCorrect = (correctCount / totalCount) * 100;
  
  // Gather insights from analysis data
  const questionsWithAnalysis = quizData.questions.filter(q => q.analysisData);
  const avgConfidence = questionsWithAnalysis.length > 0 
    ? questionsWithAnalysis.reduce((sum, q) => sum + q.analysisData.confidence, 0) / questionsWithAnalysis.length 
    : 0;
  
  let feedback = `You scored ${percentCorrect.toFixed(1)}% on this ${quizData.subject} quiz. `;
  
  // Add confidence-based insights
  if (questionsWithAnalysis.length > 0) {
    if (avgConfidence > 80) {
      feedback += "Your answers showed high confidence levels, indicating good understanding. ";
    } else if (avgConfidence > 60) {
      feedback += "Your answers showed moderate confidence, suggesting some areas need reinforcement. ";
    } else {
      feedback += "Your answers showed lower confidence levels, indicating fundamental concepts need more study. ";
    }
  }
  
  if (percentCorrect >= 80) {
    feedback += "Excellent work! You have demonstrated a strong understanding of the material.";
  } else if (percentCorrect >= 60) {
    feedback += "Good job! You have a solid foundation, but there are some areas where you could improve.";
  } else if (percentCorrect >= 40) {
    feedback += "You're making progress, but there are several concepts that need more attention.";
  } else {
    feedback += "This topic seems challenging for you. I recommend revisiting the fundamentals before moving forward.";
  }
  
  // Add specific insights from incorrect answers
  const incorrectAnswers = quizData.questions.filter(q => !q.isCorrect && q.analysisData);
  if (incorrectAnswers.length > 0) {
    const commonMissingConcepts = [];
    incorrectAnswers.forEach(q => {
      if (q.analysisData.conceptsIdentified) {
        commonMissingConcepts.push(...q.analysisData.conceptsIdentified);
      }
    });
    
    if (commonMissingConcepts.length > 0) {
      const uniqueConcepts = [...new Set(commonMissingConcepts)];
      feedback += ` The most challenging concepts for you appear to be: ${uniqueConcepts.slice(0, 3).join(", ")}.`;
    }
  }
  
  return feedback;
}

// Helper function to generate improvement suggestions
function generateSuggestions(quizData) {
  const incorrectQuestions = quizData.questions.filter(q => !q.isCorrect);
  
  if (incorrectQuestions.length === 0) {
    return "Congratulations on a perfect score! To continue growing, consider exploring more advanced topics in this subject.";
  }
  
  let suggestions = "Based on your answers, here are some specific areas to focus on:\n\n";
  
  // Use analysis data for more detailed suggestions
  incorrectQuestions.forEach((q, index) => {
    if (q.analysisData) {
      suggestions += `${index + 1}. **Question about "${q.questionText.substring(0, 50)}..."**\n`;
      suggestions += `   - **Issue**: ${q.analysisData.reasoning}\n`;
      suggestions += `   - **Learning Focus**: ${q.analysisData.educationalFeedback}\n`;
      suggestions += `   - **Improvement Tip**: ${q.analysisData.improvementSuggestion}\n\n`;
    } else {
      // Fallback for questions without analysis data
      suggestions += `${index + 1}. Review the concept: "${q.questionText.substring(0, 50)}..."\n`;
      suggestions += `   - Study why "${q.correctAnswer}" is the correct answer.\n\n`;
    }
  });
  
  // Group incorrect questions by concept for broader suggestions
  const conceptMistakes = {};
  incorrectQuestions.forEach(q => {
    if (q.analysisData && q.analysisData.conceptsIdentified) {
      q.analysisData.conceptsIdentified.forEach(concept => {
        if (!conceptMistakes[concept]) {
          conceptMistakes[concept] = [];
        }
        conceptMistakes[concept].push(q);
      });
    } else {
      // Fallback concept extraction
      const concepts = extractConceptsFromQuestion(q.questionText, quizData.subject);
      concepts.forEach(concept => {
        if (!conceptMistakes[concept]) {
          conceptMistakes[concept] = [];
        }
        conceptMistakes[concept].push(q);
      });
    }
  });
  
  // Add general concept-based suggestions
  if (Object.keys(conceptMistakes).length > 0) {
    suggestions += "\n**Overall Learning Priorities:**\n\n";
    Object.entries(conceptMistakes).forEach(([concept, questions]) => {
      suggestions += `• **${concept}**: ${questions.length} question${questions.length > 1 ? 's' : ''} - `;
      suggestions += `This is a key area that needs attention. `;
      suggestions += `Focus on understanding the fundamentals and practice with similar examples.\n\n`;
    });
  }
  
  return suggestions;
}

// Helper function to identify strengths
function identifyStrengths(quizData) {
  const correctQuestions = quizData.questions.filter(q => q.isCorrect);
  
  if (correctQuestions.length === 0) {
    return "Keep practicing! Everyone starts somewhere, and with consistent effort, you'll improve.";
  }
  
  // Group correct questions by concept
  const conceptStrengths = {};
  correctQuestions.forEach(q => {
    const concepts = extractConceptsFromQuestion(q.questionText, quizData.subject);
    concepts.forEach(concept => {
      if (!conceptStrengths[concept]) {
        conceptStrengths[concept] = [];
      }
      conceptStrengths[concept].push(q);
    });
  });
  
  let strengths = "Your strengths in this quiz include:\n\n";
  
  // Generate strengths for each concept with at least 2 correct answers
  const significantStrengths = Object.entries(conceptStrengths)
    .filter(([_, questions]) => questions.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);
  
  if (significantStrengths.length === 0) {
    strengths += "• You answered some questions correctly, but need more practice to develop strong concept mastery.";
  } else {
    significantStrengths.forEach(([concept, questions]) => {
      const percentage = (questions.length / 
        quizData.questions.filter(q => 
          extractConceptsFromQuestion(q.questionText, quizData.subject).includes(concept)
        ).length) * 100;
      
      strengths += `• ${concept}: You answered ${percentage.toFixed(0)}% of questions in this area correctly.\n\n`;
    });
  }
  
  return strengths;
}


// Helper function to extract concepts from question text
function extractConceptsFromQuestion(questionText, subject, analysisData = null) {
  // First try to use concepts from analysis data if available
  if (analysisData && analysisData.conceptsIdentified && analysisData.conceptsIdentified.length > 0) {
    return analysisData.conceptsIdentified;
  }
  
  // This is a simplified implementation
  // In a real application, you might use NLP or a predefined list of concepts per subject
  
  // Some example concept extraction for different subjects
  const conceptKeywords = {
    "JavaScript": ["variables", "functions", "loops", "objects", "arrays", "async", "promises", "DOM", "classes", "closures", "scope", "hoisting", "destructuring", "arrow functions", "callbacks", "event handling", "prototypes", "inheritance"],
    "Python": ["variables", "functions", "loops", "objects", "lists", "dictionaries", "classes", "inheritance", "exceptions", "modules", "comprehensions", "decorators", "generators", "async", "file handling"],
    "Mathematics": ["algebra", "geometry", "calculus", "statistics", "trigonometry", "probability", "derivatives", "integrals", "equations", "functions", "limits", "series"],
    "Science": ["physics", "chemistry", "biology", "astronomy", "mechanics", "thermodynamics", "organic chemistry", "genetics", "ecology", "atomic structure"],
    // Add more subjects and concepts as needed
  };
  
  const subjectConcepts = conceptKeywords[subject] || [];
  const detectedConcepts = [];
  
  // Enhanced concept detection with better matching
  const lowerQuestionText = questionText.toLowerCase();
  
  subjectConcepts.forEach(concept => {
    // Check for exact matches and variations
    const conceptVariations = [
      concept,
      concept.replace(/s$/, ''), // Remove plural 's'
      concept + 's', // Add plural 's'
      concept.replace(/-/g, ' '), // Replace hyphens with spaces
      concept.replace(/\s/g, '-'), // Replace spaces with hyphens
    ];
    
    if (conceptVariations.some(variation => 
      lowerQuestionText.includes(variation.toLowerCase())
    )) {
      detectedConcepts.push(concept);
    }
  });
  
  // If no concepts detected, extract keywords from the question
  if (detectedConcepts.length === 0) {
    const words = questionText.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4 && !["what", "which", "where", "when", "the", "and", "that", "with", "this", "for", "you", "your"].includes(word));
    
    // Get the most important word as a concept
    if (words.length > 0) {
      // Find the most "important" word (not in common words list)
      const commonWords = ["about", "would", "could", "should", "there", "their", "these", "those", "have", "been", "were", "they"];
      const importantWord = words.find(word => !commonWords.includes(word)) || words[0];
      detectedConcepts.push(importantWord.charAt(0).toUpperCase() + importantWord.slice(1));
    } else {
      detectedConcepts.push(subject);
    }
  }
  
  return detectedConcepts;
}

// Add this function to generate personalized learning resources with valid links

function generateLearningResources(quizData, conceptBreakdown) {
  // Create a map to store resources for each concept
  const conceptResources = {};
  
  // Analyze each concept and generate targeted resources
  conceptBreakdown.forEach(concept => {
    const conceptName = concept.concept;
    const masteryLevel = concept.mastery_level;
    
    // Skip generating extensive resources for concepts with strong mastery
    if (masteryLevel === "Strong") {
      conceptResources[conceptName] = {
        resources: [
          {
            title: `Advanced ${conceptName} techniques`,
            description: `Explore cutting-edge approaches and advanced patterns in ${conceptName} to take your knowledge to the next level.`,
            type: "Advanced Tutorial",
            difficulty: "Advanced",
            url: generateValidResourceUrl(conceptName, quizData.subject, "advanced")
          }
        ]
      };
      return;
    }
    
    // Find relevant questions for this concept
    const relevantQuestions = quizData.questions.filter(q => {
      const questionConcepts = extractConceptsFromQuestion(q.questionText, quizData.subject);
      return questionConcepts.includes(conceptName);
    });
    
    // Extract key terms from incorrect questions
    const incorrectQuestions = relevantQuestions.filter(q => !q.isCorrect);
    const keyTerms = extractKeyTerms(incorrectQuestions, conceptName);
    
    // Generate resources based on concept and subject
    const resources = [];
    
    // Generate a textbook or comprehensive guide
    resources.push({
      title: generateResourceTitle("book", conceptName, quizData.subject),
      description: `A comprehensive guide that covers ${conceptName} fundamentals with clear explanations and examples${keyTerms.length > 0 ? `, including ${keyTerms.filter(term => term && term !== 'undefined').slice(0, 2).join(" and ")}` : ""}.`,
      type: "Book/Guide",
      difficulty: masteryLevel === "Needs Improvement" ? "Beginner" : "Intermediate",
      url: generateValidResourceUrl(conceptName, quizData.subject, "book")
    });
    
    // Generate an interactive tutorial
    resources.push({
      title: generateResourceTitle("tutorial", conceptName, quizData.subject),
      description: `Step-by-step tutorial with hands-on exercises to practice ${conceptName}${keyTerms.length > 0 && keyTerms.filter(term => term && term !== 'undefined').length > 0 ? ` with focus on ${keyTerms.filter(term => term && term !== 'undefined')[0]}` : ""}.`,
      type: "Interactive Tutorial",
      difficulty: masteryLevel === "Needs Improvement" ? "Beginner" : "Intermediate",
      url: generateValidResourceUrl(conceptName, quizData.subject, "tutorial")
    });
    
    // Generate a video course
    resources.push({
      title: generateResourceTitle("video", conceptName, quizData.subject),
      description: `Visual explanations of ${conceptName} concepts with demonstrations${keyTerms.length > 0 && keyTerms.filter(term => term && term !== 'undefined').length > 0 ? ` and practical examples of ${keyTerms.filter(term => term && term !== 'undefined').join(", ")}` : ""}.`,
      type: "Video Course",
      difficulty: masteryLevel === "Needs Improvement" ? "Beginner" : "Intermediate",
      url: generateValidResourceUrl(conceptName, quizData.subject, "video")
    });
    
    // If specific misconceptions were identified, add a targeted resource
    if (incorrectQuestions.length > 0) {
      resources.push({
        title: `Common Misconceptions in ${conceptName}`,
        description: `Addresses frequent mistakes and misconceptions in ${conceptName}, with clarifications on ${extractMisconceptionTopics(incorrectQuestions, conceptName).join(", ")}.`,
        type: "Practice Guide",
        difficulty: "All Levels",
        url: generateValidResourceUrl(conceptName, quizData.subject, "practice")
      });
    }
    
    // Store the generated resources
    conceptResources[conceptName] = {
      resources: resources,
      keyTerms: keyTerms
    };
  });
  
  return conceptResources;
}

// Helper function to extract key terms from questions
function extractKeyTerms(questions, concept) {
  if (questions.length === 0) return [];
  
  // Combine all question texts and explanations
  const allText = questions.map(q => `${q.text} ${q.explanation || ""}`).join(" ");
  
  // Get concept-specific keywords
  const conceptKeywords = {
    "variables": ["scope", "declaration", "hoisting", "const", "let", "var", "global", "local"],
    "functions": ["parameters", "arguments", "return", "arrow functions", "callbacks", "closures"],
    "loops": ["for", "while", "do-while", "forEach", "map", "iteration", "break", "continue"],
    "objects": ["properties", "methods", "this", "prototypes", "inheritance", "destructuring"],
    "arrays": ["indexing", "methods", "sort", "filter", "map", "reduce", "splice"],
    "async": ["promises", "async/await", "callbacks", "event loop", "setTimeout"],
    "promises": ["then", "catch", "finally", "async/await", "Promise.all", "race"],
    "DOM": ["selectors", "events", "manipulation", "traversal", "bubbling"],
    // Add more as needed
  };
  
  // Find which keywords appear in the questions
  const keywords = conceptKeywords[concept.toLowerCase()] || [];
  const foundKeywords = keywords.filter(keyword => 
    keyword && allText.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // If no specific keywords found, extract general terms
  if (foundKeywords.length === 0) {
    // Simple word frequency analysis (excluding common words)
    const words = allText.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word && word.length > 3 && !["the", "and", "that", "with", "this", "for", "you", "your"].includes(word));
    
    const wordCounts = {};
    words.forEach(word => {
      if (word && word !== 'undefined') {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
    
    // Get the most frequent words
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word)
      .filter(word => word && word !== 'undefined');
  }
  
  return foundKeywords.filter(keyword => keyword && keyword !== 'undefined');
}

// Helper function to extract misconception topics
function extractMisconceptionTopics(questions, concept) {
  // Default topics if nothing specific can be found
  const defaultTopics = [`understanding ${concept} basics`, `applying ${concept} correctly`];
  
  if (questions.length === 0) return defaultTopics;
  
  // Try to identify specific misconceptions from the explanations
  const misconceptions = [];
  questions.forEach(q => {
    if (q.explanation) {
      // Look for common phrases that indicate misconceptions
      const explanation = q.explanation.toLowerCase();
      if (explanation.includes("common mistake") || 
          explanation.includes("often confused") || 
          explanation.includes("important to remember") ||
          explanation.includes("key concept")) {
        
        // Extract the sentence containing the phrase
        const sentences = q.explanation.split(/[.!?]+/);
        const relevantSentence = sentences.find(s => 
          s.toLowerCase().includes("common mistake") || 
          s.toLowerCase().includes("often confused") ||
          s.toLowerCase().includes("important to remember") ||
          s.toLowerCase().includes("key concept")
        );
        
        if (relevantSentence) {
          // Simplify the sentence to extract the core misconception
          let misconception = relevantSentence
            .replace(/common mistake is /i, "")
            .replace(/often confused with /i, "")
            .replace(/important to remember that /i, "")
            .replace(/key concept is that /i, "")
            .trim();
          
          // Truncate if too long
          if (misconception.length > 60) {
            misconception = misconception.substring(0, 57) + "...";
          }
          
          misconceptions.push(misconception);
        }
      }
    }
  });
  
  // If we found specific misconceptions, return those
  if (misconceptions.length > 0) {
    return misconceptions;
  }
  
  // Otherwise, analyze the questions to identify topics
  const topics = new Set();
  questions.forEach(q => {
    const keyPhrases = extractKeyTerms([q], concept);
    keyPhrases.forEach(phrase => topics.add(phrase));
  });
  
  return topics.size > 0 ? Array.from(topics) : defaultTopics;
}

// Helper function to generate resource titles
function generateResourceTitle(type, concept, subject) {
  const titles = {
    "book": [
      `The Complete Guide to ${concept} in ${subject}`,
      `${concept} Essentials: A Comprehensive Reference`,
      `Mastering ${concept}: From Fundamentals to Advanced Techniques`,
      `${subject} ${concept}: A Practical Approach`,
      `Understanding ${concept} in ${subject}`
    ],
    "tutorial": [
      `Interactive ${concept} Tutorial for ${subject} Learners`,
      `Learn ${concept} by Doing: Hands-on Workshop`,
      `Step-by-Step Guide to ${concept} Mastery`,
      `${concept} in Practice: Interactive Exercises`,
      `Coding Workshop: Building with ${concept}`
    ],
    "video": [
      `${concept} Explained: Video Series`,
      `Visual Guide to ${concept} in ${subject}`,
      `${concept} Fundamentals: Video Course`,
      `Watch & Learn: ${concept} in Action`,
      `${subject} Masterclass: ${concept} Deep Dive`
    ]
  };
  
  const options = titles[type] || titles.book;
  return options[Math.floor(Math.random() * options.length)];
}

// Helper function to generate valid resource URLs based on concept and subject
function generateValidResourceUrl(concept, subject, type) {
  // Normalize concept and subject for URL generation
  const normalizedConcept = concept.toLowerCase().replace(/\s+/g, '-');
  const normalizedSubject = subject.toLowerCase().replace(/\s+/g, '-');
  
  // Define base URLs for different types of resources
  const resourceBases = {
    "book": [
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      "https://javascript.info",
      "https://www.w3schools.com",
      "https://eloquentjavascript.net"
    ],
    "tutorial": [
      "https://www.freecodecamp.org/learn",
      "https://www.codecademy.com/learn",
      "https://www.khanacademy.org/computing",
      "https://scrimba.com"
    ],
    "video": [
      "https://www.youtube.com/results?search_query=",
      "https://www.coursera.org/search?query=",
      "https://www.udemy.com/courses/search/?q=",
      "https://egghead.io/q/"
    ],
    "practice": [
      "https://leetcode.com/tag/",
      "https://codewars.com/kata/search/",
      "https://www.hackerrank.com/domains/",
      "https://exercism.org/tracks/"
    ],
    "advanced": [
      "https://github.com/topics/",
      "https://stackoverflow.com/questions/tagged/",
      "https://dev.to/t/",
      "https://medium.com/search?q="
    ]
  };
  
  // Subject-specific URL mapping
  const subjectMapping = {
    "javascript": {
      "book": [
        "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        "https://javascript.info/",
        "https://eloquentjavascript.net/",
        "https://www.w3schools.com/js/"
      ],
      "tutorial": [
        "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
        "https://www.codecademy.com/learn/introduction-to-javascript",
        "https://javascript30.com/",
        "https://www.theodinproject.com/paths/full-stack-javascript"
      ],
      "video": [
        `https://www.youtube.com/results?search_query=javascript+${normalizedConcept}+tutorial`,
        `https://www.coursera.org/search?query=javascript+${normalizedConcept}`,
        `https://egghead.io/q/javascript+${normalizedConcept}`,
        `https://www.udemy.com/courses/search/?q=javascript+${normalizedConcept}`
      ],
      "practice": [
        `https://leetcode.com/tag/javascript/`,
        `https://www.hackerrank.com/domains/algorithms`,
        `https://codewars.com/kata/search/javascript`,
        `https://exercism.org/tracks/javascript`
      ],
      "advanced": [
        `https://github.com/topics/javascript-${normalizedConcept}`,
        `https://stackoverflow.com/questions/tagged/javascript+${normalizedConcept}`,
        `https://dev.to/t/javascript`,
        `https://medium.com/search?q=javascript+${normalizedConcept}`
      ]
    },
    "python": {
      "book": [
        "https://docs.python.org/3/tutorial/",
        "https://realpython.com/",
        "https://automatetheboringstuff.com/",
        "https://www.w3schools.com/python/"
      ],
      "tutorial": [
        "https://www.freecodecamp.org/learn/scientific-computing-with-python/",
        "https://www.codecademy.com/learn/learn-python-3",
        "https://www.learnpython.org/",
        "https://pythontutor.com/"
      ],
      "video": [
        `https://www.youtube.com/results?search_query=python+${normalizedConcept}+tutorial`,
        `https://www.coursera.org/search?query=python+${normalizedConcept}`,
        `https://realpython.com/search?q=${normalizedConcept}`,
        `https://www.udemy.com/courses/search/?q=python+${normalizedConcept}`
      ],
      "practice": [
        `https://leetcode.com/tag/python/`,
        `https://www.hackerrank.com/domains/python`,
        `https://codewars.com/kata/search/python`,
        `https://exercism.org/tracks/python`
      ],
      "advanced": [
        `https://github.com/topics/python-${normalizedConcept}`,
        `https://stackoverflow.com/questions/tagged/python+${normalizedConcept}`,
        `https://dev.to/t/python`,
        `https://medium.com/search?q=python+${normalizedConcept}`
      ]
    },
    "mathematics": {
      "book": [
        "https://www.khanacademy.org/math",
        "https://www.mathsisfun.com/",
        "https://brilliant.org/math/",
        "https://www.purplemath.com/"
      ],
      "tutorial": [
        "https://www.khanacademy.org/math",
        "https://www.coursera.org/browse/math-and-logic",
        "https://www.edx.org/learn/mathematics",
        "https://www.mathway.com/"
      ],
      "video": [
        `https://www.youtube.com/results?search_query=mathematics+${normalizedConcept}+explained`,
        `https://www.khanacademy.org/search?page_search_query=${normalizedConcept}`,
        `https://www.coursera.org/search?query=mathematics+${normalizedConcept}`,
        `https://brilliant.org/search/?q=${normalizedConcept}`
      ],
      "practice": [
        `https://www.khanacademy.org/math`,
        `https://brilliant.org/practice/`,
        `https://www.mathway.com/`,
        `https://www.wolframalpha.com/`
      ],
      "advanced": [
        `https://mathoverflow.net/search?q=${normalizedConcept}`,
        `https://math.stackexchange.com/search?q=${normalizedConcept}`,
        `https://brilliant.org/wiki/${normalizedConcept}/`,
        `https://www.youtube.com/results?search_query=advanced+mathematics+${normalizedConcept}`
      ]
    }
  };
  
  // Get URLs for the specific subject and type, or fallback to general
  const subjectUrls = subjectMapping[normalizedSubject]?.[type];
  if (subjectUrls && subjectUrls.length > 0) {
    return subjectUrls[Math.floor(Math.random() * subjectUrls.length)];
  }
  
  // Fallback to general resource URLs
  const generalUrls = resourceBases[type];
  if (generalUrls && generalUrls.length > 0) {
    const baseUrl = generalUrls[Math.floor(Math.random() * generalUrls.length)];
    
    // For search-based URLs, append the search term
    if (baseUrl.includes("search") || baseUrl.includes("results") || baseUrl.includes("/q/")) {
      return `${baseUrl}${normalizedSubject}+${normalizedConcept}`;
    }
    
    return baseUrl;
  }
  
  // Ultimate fallback
  return `https://www.google.com/search?q=${normalizedSubject}+${normalizedConcept}+learn`;
}