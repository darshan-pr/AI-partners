/**
 * Multi-Agent AI System for StudyBuddy
 * 
 * This system implements a multi-agent architecture with:
 * - Orchestrator Agent: Central controller that routes requests
 * - Quiz Agent: Specialized agent for quiz-related tasks
 * - Future agents can be easily added to this system
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_CHAT || process.env.NEXT_PUBLIC_GEMINI_API_KEY);

// Agent types
export const AGENT_TYPES = {
  ORCHESTRATOR: 'orchestrator',
  QUIZ: 'quiz',
  GENERAL: 'general',
  TUTOR: 'tutor'
};

// Agent states
export const AGENT_STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  WAITING_FOR_INPUT: 'waiting_for_input',
  COMPLETED: 'completed'
};

/**
 * Base Agent Class
 */
class BaseAgent {
  constructor(type, name, description) {
    this.type = type;
    this.name = name;
    this.description = description;
    this.state = AGENT_STATES.IDLE;
    this.context = {};
    this.conversations = [];
  }

  setState(state) {
    this.state = state;
    this.notifyStateChange?.(this.type, state);
  }

  addToConversation(role, message, metadata = {}) {
    this.conversations.push({
      role,
      message,
      timestamp: Date.now(),
      metadata,
      agent: this.type
    });
  }

  getConversationHistory() {
    return this.conversations;
  }

  clearContext() {
    this.context = {};
    this.conversations = [];
  }

  async process(input, context = {}) {
    throw new Error('Process method must be implemented by subclass');
  }
}

/**
 * Orchestrator Agent - Central controller
 */
class OrchestratorAgent extends BaseAgent {
  constructor() {
    super(AGENT_TYPES.ORCHESTRATOR, 'Orchestrator', 'Central AI controller that routes requests to appropriate agents');
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent routing decisions
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 1024,
      }
    });
  }

  async process(input, context = {}) {
    this.setState(AGENT_STATES.PROCESSING);
    this.addToConversation('user', input);

    try {
      // Update status to show we're analyzing
      this.setState('analyzing');
      
      // Analyze the input to determine routing
      const routingDecision = await this.analyzeAndRoute(input, context);
      
      // Update status to show we're routing
      this.setState('routing');
      
      this.addToConversation('orchestrator', `Routing to ${routingDecision.targetAgent}: ${routingDecision.reasoning}`, {
        targetAgent: routingDecision.targetAgent,
        confidence: routingDecision.confidence,
        extractedInfo: routingDecision.extractedInfo
      });

      this.setState(AGENT_STATES.COMPLETED);
      return routingDecision;
    } catch (error) {
      this.setState(AGENT_STATES.IDLE);
      throw error;
    }
  }

  async analyzeAndRoute(input, context) {
    const prompt = `You are the Orchestrator Agent in a multi-agent AI system for StudyBuddy. Your job is to analyze user requests and route them to the most appropriate specialized agent.

Available Agents:
1. QUIZ - Handles all quiz-related tasks (creating quizzes, quiz questions, quiz management)
2. GENERAL - Handles general study help, explanations, homework assistance, and other educational content
3. TUTOR - Handles performance analysis, review, suggestions, and improvement guidance based on quiz history

Current conversation context: ${JSON.stringify(context.messages?.slice(-3) || [], null, 2)}

User Input: "${input}"

Analyze this input and determine:
1. Which agent should handle this request?
2. What information can you extract that would be useful for the target agent?
3. Does the user need to provide more information?

Respond in JSON format:
{
  "targetAgent": "QUIZ" | "GENERAL" | "TUTOR",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this agent was chosen",
  "extractedInfo": {
    "intent": "primary intent (e.g., 'create_quiz', 'explain_concept', 'solve_problem')",
    "subject": "subject if mentioned",
    "topic": "specific topic if mentioned",
    "questionCount": number if mentioned,
    "difficulty": "difficulty level if mentioned",
    "quizType": "quiz type if mentioned",
    "needsMoreInfo": boolean,
    "missingInfo": ["list of missing information needed"]
  },
  "suggestedQuestions": ["questions to ask user if more info needed"]
}

Examples:
- "Create a quiz on photosynthesis" → QUIZ agent
- "I need 10 questions about calculus derivatives" → QUIZ agent  
- "Explain quantum physics to me" → GENERAL agent
- "Help me solve this math problem" → GENERAL agent
- "Quiz me on history" → QUIZ agent (but needs more info)
- "How did I perform on my recent quizzes?" → TUTOR agent
- "I need suggestions to improve my performance" → TUTOR agent
- "Review my quiz results" → TUTOR agent
- "Analyze my learning progress" → TUTOR agent`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    let jsonString = response.text().trim();
    
    // Clean up the JSON response
    jsonString = jsonString.replace(/```json|```/g, '').trim();
    
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      // Fallback routing if JSON parsing fails
      console.error('Failed to parse orchestrator response:', error);
      return {
        targetAgent: input.toLowerCase().includes('quiz') ? 'QUIZ' : 
                    input.toLowerCase().includes('performance') || 
                    input.toLowerCase().includes('review') || 
                    input.toLowerCase().includes('improve') || 
                    input.toLowerCase().includes('analysis') ? 'TUTOR' : 'GENERAL',
        confidence: 0.5,
        reasoning: 'Fallback routing due to parsing error',
        extractedInfo: {
          intent: 'unknown',
          needsMoreInfo: false,
          missingInfo: []
        },
        suggestedQuestions: []
      };
    }
  }
}

/**
 * Quiz Agent - Specialized for quiz operations
 */
class QuizAgent extends BaseAgent {
  constructor() {
    super(AGENT_TYPES.QUIZ, 'Quiz Agent', 'Specialized agent for creating and managing quizzes');
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.4,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 2048,
      }
    });
    this.requiredInfo = {
      subject: false,
      questionCount: false,
      // topic, difficulty, quizType are optional
    };
  }

  async process(input, context = {}) {
    this.setState(AGENT_STATES.PROCESSING);
    this.addToConversation('user', input);

    try {
      // Update status to show we're thinking about the request
      this.setState('thinking');
      
      // Check if we have enough information to create a quiz
      const infoCheck = await this.checkRequiredInformation(input, context);
      
      if (infoCheck.needsMoreInfo) {
        this.setState(AGENT_STATES.WAITING_FOR_INPUT);
        this.addToConversation('quiz_agent', infoCheck.message, {
          missingInfo: infoCheck.missingInfo,
          suggestedQuestions: infoCheck.suggestedQuestions
        });
        
        return {
          type: 'info_request',
          message: infoCheck.message,
          missingInfo: infoCheck.missingInfo,
          suggestedQuestions: infoCheck.suggestedQuestions,
          topicSuggestions: infoCheck.topicSuggestions,
          agent: AGENT_TYPES.QUIZ
        };
      }

      // We have enough info, proceed with quiz creation
      this.setState('generating');
      const quizData = await this.generateQuizData(infoCheck.extractedInfo);
      
      this.addToConversation('quiz_agent', 'Quiz data generated successfully', {
        quizData: quizData
      });

      this.setState(AGENT_STATES.COMPLETED);
      
      // Generate next suggestions based on the current quiz
      const nextSuggestions = this.generateNextSuggestions(infoCheck.extractedInfo);
      
      return {
        type: 'quiz_generated',
        data: quizData,
        message: `🎯 Perfect! I've created a **${quizData.difficulty}** difficulty quiz on **${quizData.subject}** ${quizData.topic ? `focusing on **${quizData.topic}**` : ''} with **${quizData.questionCount} questions**.

✨ This quiz will help you test your knowledge and identify areas for improvement!

🚀 **Ready to start your quiz?** Click the button below!`,
        nextSuggestions: nextSuggestions,
        agent: AGENT_TYPES.QUIZ
      };

    } catch (error) {
      this.setState(AGENT_STATES.IDLE);
      this.addToConversation('quiz_agent', `Error: ${error.message}`, { error: true });
      throw error;
    }
  }

  async checkRequiredInformation(input, context) {
    const prompt = `You are the Quiz Agent, an intelligent study companion that creates personalized quizzes. Your job is to extract quiz-related information from user input and determine if you have enough information to create an engaging quiz.

Required Information:
- subject: The subject area for the quiz
- questionCount: Number of questions (default: 5 if not specified)

Optional Information:
- topic: Specific topic within the subject
- difficulty: easy, medium, hard (default: medium)
- quizType: mcq, true_false, short_answer, mixed (default: mixed)

Popular Topics by Subject:
- Mathematics: Algebra, Calculus, Geometry, Statistics, Trigonometry
- Science: Biology, Chemistry, Physics, Environmental Science
- History: World War 2, American History, Ancient Civilizations, Renaissance
- Literature: Shakespeare, Poetry Analysis, Classic Novels, Writing Techniques
- Computer Science: Programming, Data Structures, Algorithms, Web Development
- Psychology: Cognitive Psychology, Social Psychology, Developmental Psychology
- Geography: World Capitals, Climate, Physical Geography, Cultural Geography

Current conversation context: ${JSON.stringify(context.messages?.slice(-5) || [], null, 2)}
Previous quiz agent context: ${JSON.stringify(this.context, null, 2)}

User Input: "${input}"

Extract information and determine if you can proceed with quiz creation. If missing critical info, provide helpful topic suggestions.

Respond in JSON format:
{
  "needsMoreInfo": boolean,
  "extractedInfo": {
    "subject": "extracted subject or null",
    "topic": "extracted topic or null", 
    "questionCount": number or 5,
    "difficulty": "easy|medium|hard",
    "quizType": "mcq|true_false|short_answer|mixed"
  },
  "missingInfo": ["list of critical missing information"],
  "message": "Friendly response message to user with topic suggestions if needed",
  "suggestedQuestions": ["specific clarifying questions"],
  "topicSuggestions": ["relevant topic suggestions based on subject"],
  "nextSteps": ["suggested actions for better quiz experience"]
}

Examples:
- "Create a quiz on photosynthesis" → has subject and topic, proceed
- "Quiz me on math" → needs specific topic, suggest algebra, calculus, etc.
- "10 hard questions about World War 2" → has all info, proceed
- "Test my knowledge" → needs subject and topic, suggest popular subjects`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    let jsonString = response.text().trim();
    
    jsonString = jsonString.replace(/```json|```/g, '').trim();
    
    try {
      const parsed = JSON.parse(jsonString);
      
      // Update our context with extracted info
      if (parsed.extractedInfo) {
        this.context = { ...this.context, ...parsed.extractedInfo };
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to parse quiz agent response:', error);
      return {
        needsMoreInfo: true,
        extractedInfo: {},
        missingInfo: ['subject'],
        message: `I'd love to create a quiz for you! 🎯 

To get started, I need to know what subject you'd like to be quizzed on. Here are some popular options:

**📚 Popular Subjects:**
• Mathematics (Algebra, Calculus, Geometry)
• Science (Biology, Chemistry, Physics) 
• History (World History, American History)
• Literature (Classic Novels, Poetry, Writing)
• Computer Science (Programming, Algorithms)
• Psychology (Cognitive, Social, Developmental)

Just tell me something like "Quiz me on Biology" or "Create a math quiz on algebra" and I'll take care of the rest!`,
        suggestedQuestions: [
          'Quiz me on Biology', 
          'Create a math quiz on algebra',
          'Test my knowledge of World War 2',
          'I want a chemistry quiz about organic compounds'
        ],
        topicSuggestions: [
          'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History', 
          'Literature', 'Computer Science', 'Psychology'
        ],
        nextSteps: [
          'Choose a subject from above',
          'Specify difficulty level (easy, medium, hard)',
          'Tell me how many questions you want'
        ]
      };
    }
  }

  async generateQuizData(extractedInfo) {
    // This will call the existing quiz generation API
    return {
      subject: extractedInfo.subject,
      topic: extractedInfo.topic,
      questionCount: extractedInfo.questionCount || 5,
      difficulty: extractedInfo.difficulty || 'medium',
      quizType: extractedInfo.quizType || 'mixed'
    };
  }

  generateNextSuggestions(extractedInfo) {
    const suggestions = [];
    
    // Difficulty progression suggestions
    if (extractedInfo.difficulty === 'easy') {
      suggestions.push({
        type: 'difficulty',
        title: '📈 Try Medium Difficulty',
        description: `Ready for a challenge? Try a medium difficulty quiz on ${extractedInfo.subject}`,
        action: 'create_quiz',
        params: { ...extractedInfo, difficulty: 'medium' }
      });
    } else if (extractedInfo.difficulty === 'medium') {
      suggestions.push({
        type: 'difficulty',
        title: '🔥 Challenge Yourself',
        description: `Test your mastery with a hard difficulty quiz on ${extractedInfo.subject}`,
        action: 'create_quiz',
        params: { ...extractedInfo, difficulty: 'hard' }
      });
    }
    
    // Related topic suggestions based on subject
    const relatedTopics = this.getRelatedTopics(extractedInfo.subject, extractedInfo.topic);
    relatedTopics.forEach(topic => {
      suggestions.push({
        type: 'topic',
        title: `🎯 Explore ${topic}`,
        description: `Expand your knowledge with a quiz on ${topic}`,
        action: 'create_quiz',
        params: { ...extractedInfo, topic: topic }
      });
    });
    
    // Quiz type variations
    if (extractedInfo.quizType !== 'mcq') {
      suggestions.push({
        type: 'format',
        title: '📋 Try Multiple Choice',
        description: 'Practice with multiple choice questions for quick review',
        action: 'create_quiz',
        params: { ...extractedInfo, quizType: 'mcq' }
      });
    }
    
    // Study suggestions
    suggestions.push({
      type: 'study',
      title: '📚 Study This Topic',
      description: `Get detailed explanations and examples about ${extractedInfo.topic || extractedInfo.subject}`,
      action: 'study_help',
      params: { topic: extractedInfo.topic || extractedInfo.subject }
    });
    
    // Tutor agent suggestion
    suggestions.push({
      type: 'tutor',
      title: '🎓 Get Performance Review',
      description: 'Analyze your quiz results and get personalized improvement suggestions',
      action: 'tutor_review',
      params: { subject: extractedInfo.subject, topic: extractedInfo.topic }
    });
    
    return suggestions.slice(0, 4); // Return top 4 suggestions to include tutor
  }
  
  getRelatedTopics(subject, currentTopic) {
    const topicMap = {
      'Mathematics': ['Algebra', 'Calculus', 'Geometry', 'Statistics', 'Trigonometry', 'Linear Algebra'],
      'Science': ['Biology', 'Chemistry', 'Physics', 'Environmental Science', 'Astronomy'],
      'Biology': ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Human Anatomy', 'Photosynthesis'],
      'Chemistry': ['Organic Chemistry', 'Inorganic Chemistry', 'Biochemistry', 'Physical Chemistry', 'Chemical Reactions'],
      'Physics': ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Quantum Physics', 'Optics'],
      'History': ['World War 2', 'American History', 'Ancient Civilizations', 'Renaissance', 'Medieval Period'],
      'Literature': ['Shakespeare', 'Poetry Analysis', 'Classic Novels', 'Writing Techniques', 'Literary Devices'],
      'Computer Science': ['Programming', 'Data Structures', 'Algorithms', 'Web Development', 'Machine Learning'],
      'Psychology': ['Cognitive Psychology', 'Social Psychology', 'Developmental Psychology', 'Behavioral Psychology']
    };
    
    const topics = topicMap[subject] || topicMap[subject?.toLowerCase()] || [];
    return topics.filter(topic => topic.toLowerCase() !== currentTopic?.toLowerCase()).slice(0, 2);
  }
}

/**
 * General Study Agent - Handles general educational queries
 */
class GeneralStudyAgent extends BaseAgent {
  constructor() {
    super(AGENT_TYPES.GENERAL, 'Study Assistant', 'General purpose study helper for explanations and problem solving');
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      }
    });
  }

  async process(input, context = {}) {
    this.setState(AGENT_STATES.PROCESSING);
    this.addToConversation('user', input);

    try {
      const response = await this.generateStudyResponse(input, context);
      
      this.addToConversation('study_agent', response);
      this.setState(AGENT_STATES.COMPLETED);
      
      return {
        type: 'study_response',
        message: response,
        agent: AGENT_TYPES.GENERAL
      };
    } catch (error) {
      this.setState(AGENT_STATES.IDLE);
      throw error;
    }
  }

  async generateStudyResponse(input, context) {
    const conversationHistory = context.messages?.slice(-10) || [];
    
    const prompt = `You are StudyBuddy's Study Assistant Agent, specialized in helping students learn effectively. You should:

1. Provide clear, detailed explanations
2. Break down complex concepts into simpler parts
3. Use examples and analogies when helpful
4. Ask follow-up questions to ensure understanding
5. Encourage critical thinking
6. Adapt your teaching style to the student's needs
7. Be patient and supportive
8. Use emojis and formatting to make responses engaging
9. Provide step-by-step solutions for problems
10. Encourage learning rather than just giving answers

Conversation History:
${conversationHistory.map(msg => `${msg.role === 'user' ? 'Student' : 'StudyBuddy'}: ${msg.content}`).join('\n')}

Current question: "${input}"

Provide a helpful, educational response that assists the student with their learning goals.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}

/**
 * Tutor Agent - Handles performance analysis, review, and improvement suggestions
 */
class TutorAgent extends BaseAgent {
  constructor() {
    super(AGENT_TYPES.TUTOR, 'Performance Tutor', 'AI tutor specialized in analyzing quiz performance and providing personalized improvement suggestions');
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.6,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 3072,
      }
    });
    this.userQuizzes = null;
    this.selectedQuiz = null;
    this.currentStep = 'initial'; // 'initial', 'showing_quizzes', 'quiz_selected', 'detailed_analysis'
  }

  async process(input, context = {}) {
    this.setState(AGENT_STATES.PROCESSING);
    this.addToConversation('user', input);

    try {
      // Check what the user is asking for
      const requestType = await this.analyzeRequest(input, context);
      
      let response;
      let responseData = {};

      switch (requestType.type) {
        case 'initial_review':
          response = await this.handleInitialReview(context);
          responseData = {
            type: 'quiz_selection',
            quizzes: this.userQuizzes,
            step: 'showing_quizzes'
          };
          break;
          
        case 'quiz_selection':
          response = await this.handleQuizSelection(requestType.selectedQuiz, context);
          responseData = {
            type: 'quiz_analysis',
            selectedQuiz: this.selectedQuiz,
            step: 'quiz_selected'
          };
          break;
          
        case 'detailed_analysis':
          response = await this.handleDetailedAnalysis(context);
          responseData = {
            type: 'detailed_analysis',
            step: 'detailed_analysis'
          };
          break;
          
        case 'further_help':
          response = await this.handleFurtherHelp(requestType.topic, context);
          responseData = {
            type: 'further_help',
            topic: requestType.topic
          };
          break;
          
        default:
          response = await this.handleGeneralTutorQuery(input, context);
          responseData = {
            type: 'general_tutor_response'
          };
      }

      this.addToConversation('tutor_agent', response);
      this.setState(AGENT_STATES.COMPLETED);
      
      return {
        type: 'tutor_response',
        message: response,
        agent: AGENT_TYPES.TUTOR,
        data: responseData
      };
      
    } catch (error) {
      this.setState(AGENT_STATES.IDLE);
      throw error;
    }
  }

  async analyzeRequest(input, context) {
    const prompt = `You are the Performance Tutor Agent. Analyze this user request and determine what type of tutoring assistance they need.

User input: "${input}"
Context: ${JSON.stringify(context.messages?.slice(-3) || [], null, 2)}

Determine the request type:
1. "initial_review" - User wants to see their recent quizzes to select one for review
2. "quiz_selection" - User is selecting a specific quiz (extract quiz number like "1", "2", "3" or quiz subject)
3. "detailed_analysis" - User wants more detailed analysis of an already selected quiz
4. "further_help" - User wants more resources or help on a specific topic
5. "general_tutor_response" - General tutoring question not related to quiz performance

For quiz_selection, extract:
- If user says "quiz 1", "analyze 1", "first quiz" → selectedQuiz: "1"  
- If user says "quiz 2", "second quiz" → selectedQuiz: "2"
- If user says quiz name/subject like "analyze my math quiz" → selectedQuiz: "math"

Respond in JSON format:
{
  "type": "initial_review|quiz_selection|detailed_analysis|further_help|general_tutor_response",
  "selectedQuiz": "quiz_number_or_subject_if_selecting",
  "topic": "topic_if_requesting_further_help",
  "reasoning": "brief explanation"
}`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    let jsonString = response.text().trim();
    jsonString = jsonString.replace(/```json|```/g, '').trim();
    
    try {
      const parsed = JSON.parse(jsonString);
      
      // If this is a quiz selection, we need to handle it specially
      if (parsed.type === 'quiz_selection' && parsed.selectedQuiz) {
        // Store the selection for use in the API route
        this.selectedQuiz = parsed.selectedQuiz;
      }
      
      return parsed;
    } catch (error) {
      // Fallback analysis with better quiz selection detection
      const lowerInput = input.toLowerCase();
      
      // Detect recent quiz/performance requests
      if (lowerInput.includes('recent') && (lowerInput.includes('quiz') || lowerInput.includes('performance'))) {
        return { type: 'initial_review', reasoning: 'User asking for recent quiz performance' };
      } else if (lowerInput.includes('performance') || lowerInput.includes('how did i') || lowerInput.includes('my quiz')) {
        return { type: 'initial_review', reasoning: 'User asking for quiz performance review' };
      } else if ((lowerInput.includes('quiz') && (lowerInput.includes('1') || lowerInput.includes('first'))) ||
          (lowerInput.includes('analyze') && lowerInput.includes('1'))) {
        return { type: 'quiz_selection', selectedQuiz: '1', reasoning: 'User selecting quiz 1' };
      } else if (lowerInput.includes('quiz') && (lowerInput.includes('2') || lowerInput.includes('second'))) {
        return { type: 'quiz_selection', selectedQuiz: '2', reasoning: 'User selecting quiz 2' };
      } else if (lowerInput.includes('quiz') && (lowerInput.includes('3') || lowerInput.includes('third'))) {
        return { type: 'quiz_selection', selectedQuiz: '3', reasoning: 'User selecting quiz 3' };
      } else if (lowerInput.includes('select') || lowerInput.includes('choose') || lowerInput.includes('analyze')) {
        return { type: 'quiz_selection', reasoning: 'User seems to be selecting a quiz' };
      } else if (lowerInput.includes('detail') || lowerInput.includes('more')) {
        return { type: 'detailed_analysis', reasoning: 'User wants more details' };
      } else if (lowerInput.includes('help') || lowerInput.includes('resource')) {
        return { type: 'further_help', reasoning: 'User wants additional help' };
      } else {
        return { type: 'initial_review', reasoning: 'Default to initial review' };
      }
    }
  }

  async handleInitialReview(context) {
    this.setState('fetching_quizzes');
    
    // We need to get user quizzes from the context or make a request
    // For now, we'll return a message asking the frontend to provide quiz data
    const username = context.username;
    if (!username) {
      return `Hi! I'm your Performance Tutor 📊. I'd love to help you analyze your quiz performance and provide personalized suggestions for improvement.

However, I need to know who you are first. Please make sure you're logged in so I can access your quiz history.`;
    }

    // This will be handled by the frontend to fetch the quizzes
    return `Hi! I'm your Performance Tutor 📊. I'm here to help you analyze your quiz performance and provide personalized suggestions for improvement.

🔍 **Let me fetch your recent quiz results...**

Please wait while I gather your quiz history to show you your recent performances.`;
  }

  async handleQuizSelection(selectedQuizId, context) {
    this.selectedQuiz = selectedQuizId;
    this.currentStep = 'quiz_selected';
    
    return `Great choice! 🎯 I'll analyze your performance on this quiz.

📋 **Analyzing quiz performance...**

Let me examine your answers, identify your strengths and areas for improvement, and prepare a detailed performance analysis for you.

Please wait while I generate your personalized review...`;
  }

  async handleDetailedAnalysis(context) {
    if (!this.selectedQuiz) {
      return "Please select a quiz first so I can provide detailed analysis.";
    }

    return `📈 **Detailed Performance Analysis**

Based on my analysis of your quiz performance, here's a comprehensive breakdown:

🎯 **Key Areas for Improvement:**
- Focus on areas where you scored below 70%
- Review fundamental concepts that appeared in multiple questions
- Practice similar question types where you struggled

📚 **Recommended Study Plan:**
1. **Immediate Focus**: Address the weakest concept areas first
2. **Practice Strategy**: Work through similar problems daily
3. **Review Cycle**: Revisit improved areas weekly to maintain progress

🔗 **Additional Resources:**
Would you like me to provide specific study materials, practice exercises, or learning resources for any particular topic you struggled with?

💡 **Pro Tip**: The best way to improve is consistent, targeted practice. Focus on one concept at a time rather than trying to improve everything at once.

What specific area would you like to dive deeper into?`;
  }

  async handleFurtherHelp(topic, context) {
    const prompt = `You are a Performance Tutor providing additional learning resources and detailed help for the topic: "${topic}".

Provide comprehensive guidance including:
1. Specific study materials or resources
2. Practice strategies 
3. Common misconceptions to avoid
4. Step-by-step improvement plan
5. External links or references where helpful

Make it detailed, actionable, and encouraging.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  async handleGeneralTutorQuery(input, context) {
    const prompt = `You are a Performance Tutor Agent responding to a general tutoring question. The student asked: "${input}"

Provide helpful guidance related to:
- Study strategies and learning techniques
- Performance improvement methods  
- Learning analytics and progress tracking
- General academic advice
- Time management for studying

Be supportive, practical, and encouraging in your response.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  clearContext() {
    super.clearContext();
    this.userQuizzes = null;
    this.selectedQuiz = null;
    this.currentStep = 'initial';
  }
}

/**
 * Main Agent System Controller
 */
export class AgentSystem {
  constructor() {
    this.agents = {
      [AGENT_TYPES.ORCHESTRATOR]: new OrchestratorAgent(),
      [AGENT_TYPES.QUIZ]: new QuizAgent(),
      [AGENT_TYPES.GENERAL]: new GeneralStudyAgent(),
      [AGENT_TYPES.TUTOR]: new TutorAgent()
    };
    
    this.currentAgent = null;
    this.systemState = AGENT_STATES.IDLE;
    this.conversationLog = [];
    this.stateChangeListeners = [];
  }

  // Add state change listener
  onStateChange(listener) {
    this.stateChangeListeners.push(listener);
    
    // Set up state change notifications for all agents
    Object.values(this.agents).forEach(agent => {
      agent.notifyStateChange = (agentType, state) => {
        this.stateChangeListeners.forEach(listener => 
          listener(agentType, state, agent.getConversationHistory())
        );
      };
    });
  }

  // Remove state change listener
  offStateChange(listener) {
    this.stateChangeListeners = this.stateChangeListeners.filter(l => l !== listener);
  }

  async processInput(input, context = {}) {
    try {
      // Step 1: Orchestrator analyzes and routes the request
      this.currentAgent = AGENT_TYPES.ORCHESTRATOR;
      const routing = await this.agents[AGENT_TYPES.ORCHESTRATOR].process(input, context);
      
      this.logInteraction('system', `Orchestrator routed to ${routing.targetAgent}: ${routing.reasoning}`);
      
      // Step 2: Route to the appropriate specialized agent
      const targetAgent = routing.targetAgent.toLowerCase();
      this.currentAgent = targetAgent;
      
      if (!this.agents[targetAgent]) {
        throw new Error(`Unknown agent type: ${targetAgent}`);
      }
      
      // Merge orchestrator's extracted info with context
      const enhancedContext = {
        ...context,
        orchestratorInfo: routing.extractedInfo,
        routing: routing
      };
      
      const result = await this.agents[targetAgent].process(input, enhancedContext);
      
      this.logInteraction('system', `${targetAgent} agent completed processing`);
      
      return {
        ...result,
        routing: routing,
        systemLog: this.getSystemLog()
      };
      
    } catch (error) {
      this.logInteraction('error', `System error: ${error.message}`);
      throw error;
    }
  }

  logInteraction(type, message) {
    this.conversationLog.push({
      type,
      message,
      timestamp: Date.now(),
      currentAgent: this.currentAgent
    });
  }

  getSystemLog() {
    return this.conversationLog;
  }

  getCurrentAgent() {
    return this.currentAgent;
  }

  getAgentState(agentType) {
    return this.agents[agentType]?.state || AGENT_STATES.IDLE;
  }

  getAgentConversation(agentType) {
    return this.agents[agentType]?.getConversationHistory() || [];
  }

  clearAllContexts() {
    Object.values(this.agents).forEach(agent => agent.clearContext());
    this.conversationLog = [];
    this.currentAgent = null;
  }

  // Get system status for UI display
  getSystemStatus() {
    return {
      currentAgent: this.currentAgent,
      systemState: this.systemState,
      agentStates: Object.fromEntries(
        Object.entries(this.agents).map(([type, agent]) => [type, agent.state])
      ),
      conversationLog: this.conversationLog
    };
  }
}

export default AgentSystem;
