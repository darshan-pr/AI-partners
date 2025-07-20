import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { AgentSystem, AGENT_TYPES } from '../../../lib/agents/AgentSystem';

// Initialize Convex client with error handling
let convex;
try {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is not set');
  }
  convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
} catch (error) {
  console.error('Failed to initialize Convex client:', error);
  // We'll handle this in the request handlers
}

// Global agent system instance (in production, consider using Redis or database)
let globalAgentSystem = null;

// Initialize or get the agent system
function getAgentSystem() {
  if (!globalAgentSystem) {
    globalAgentSystem = new AgentSystem();
  }
  return globalAgentSystem;
}

// Process file uploads (with Knowledge Nest support)
async function processFile(file) {
  try {
    if (!file || file.size === 0) {
      throw new Error('Invalid file provided');
    }

    // Handle Knowledge Nest files differently
    if (file.isKnowledgeNestFile) {
      return await processKnowledgeNestFile(file);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    const fileSize = (buffer.length / 1024).toFixed(2);
    
    let content = '';
    
    if (fileName.endsWith('.pdf')) {
      content = `📄 PDF Document Analysis:
      • File: ${file.name}
      • Size: ${fileSize} KB
      • Type: PDF Document
      
      Note: For full PDF text extraction, please install pdf-parse library.
      Current status: File received and ready for processing.`;
      
    } else if (fileName.endsWith('.txt')) {
      const textContent = buffer.toString('utf-8');
      const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
      const preview = textContent.substring(0, 500);
      
      content = `📝 Text File Analysis:
      • File: ${file.name}
      • Size: ${fileSize} KB
      • Words: ${wordCount}
      • Preview: ${preview}${textContent.length > 500 ? '...' : ''}`;
      
    } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      content = `📄 Word Document Analysis:
      • File: ${file.name}
      • Size: ${fileSize} KB
      • Type: Microsoft Word Document
      
      Note: For full document text extraction, please install docx library.
      Current status: File received and ready for processing.`;
      
    } else if (file.type.startsWith('image/')) {
      const mimeType = file.type;
      const data = {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: mimeType
        }
      };
      
      return {
        type: 'image',
        data: {
          ...data,
          fileName: file.name,
          fileSize: fileSize + ' KB',
          mimeType: mimeType
        }
      };
    } else {
      content = `📎 File Upload:
      • File: ${file.name}
      • Size: ${fileSize} KB
      • Type: ${file.type || 'Unknown'}
      
      Note: This file type is not directly supported for content analysis.
      Current status: File received and metadata processed.`;
    }
    
    return {
      type: 'text',
      content: content
    };
    
  } catch (error) {
    console.error('File processing error:', error);
    return {
      type: 'error',
      content: `Error processing file: ${error.message}`
    };
  }
}

// Process Knowledge Nest files
async function processKnowledgeNestFile(knowledgeNestFile) {
  try {
    const fileName = knowledgeNestFile.name.toLowerCase();
    const fileSize = (knowledgeNestFile.size / 1024).toFixed(2);

    // For Knowledge Nest files, we have more metadata
    let content = `📚 Knowledge Nest File Analysis:
    • File: ${knowledgeNestFile.name}
    • Size: ${fileSize} KB
    • Type: ${knowledgeNestFile.type}
    • Subject: ${knowledgeNestFile.subject}
    • Uploaded by: ${knowledgeNestFile.uploadedBy}
    • Source: Knowledge Nest (Institutional Resource)
    
    This is a shared educational resource from your institution's Knowledge Nest.
    
    `;

    // Handle different file types from Knowledge Nest
    if (fileName.endsWith('.pdf')) {
      content += `Type: PDF Document
      Status: Ready for content analysis. This PDF document is an institutional resource that can be analyzed for educational content.`;
      
    } else if (fileName.endsWith('.txt')) {
      content += `Type: Text Document
      Status: Text file ready for analysis. Content can be extracted and analyzed for educational insights.`;
      
    } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      content += `Type: Microsoft Word Document
      Status: Word document ready for analysis. Educational content can be extracted and processed.`;
      
    } else if (knowledgeNestFile.type.startsWith('image/')) {
      content += `Type: Image File
      Status: Image ready for visual analysis. This educational image can be analyzed for content, diagrams, charts, or other visual learning materials.`;
      
      return {
        type: 'text',
        content: content,
        isKnowledgeNestFile: true
      };
    } else {
      content += `Type: ${knowledgeNestFile.type}
      Status: File metadata processed. This institutional resource is available for supported content analysis.`;
    }
    
    return {
      type: 'text',
      content: content,
      isKnowledgeNestFile: true
    };
    
  } catch (error) {
    console.error('Knowledge Nest file processing error:', error);
    return {
      type: 'error',
      content: `Error processing Knowledge Nest file: ${error.message}`,
      isKnowledgeNestFile: true
    };
  }
}

export async function POST(request) {
  try {
    // Check if Convex is properly initialized
    if (!convex) {
      return NextResponse.json({ 
        error: 'Database connection not available. Please try again later.',
        success: false 
      }, { status: 503 });
    }

    const contentType = request.headers.get('content-type');
    let message, sessionId, username, file, multiAgentMode;

    if (contentType?.includes('multipart/form-data')) {
      // Handle regular file uploads
      const formData = await request.formData();
      message = formData.get('message');
      sessionId = formData.get('sessionId');
      username = formData.get('username');
      file = formData.get('file');
      multiAgentMode = formData.get('multiAgentMode') === 'true';
    } else if (contentType?.includes('application/json')) {
      // Handle Knowledge Nest file requests
      const jsonData = await request.json();
      message = jsonData.message;
      sessionId = jsonData.sessionId;
      username = jsonData.username;
      file = jsonData.file; // This will be the Knowledge Nest file object
      multiAgentMode = jsonData.multiAgentMode === 'true';
    } else {
      return NextResponse.json({ 
        error: 'Unsupported content type',
        success: false 
      }, { status: 400 });
    }

    // Validation
    if (!username) {
      return NextResponse.json({ 
        error: 'User not authenticated',
        success: false 
      }, { status: 401 });
    }

    if (!sessionId) {
      return NextResponse.json({ 
        error: 'Session ID is required',
        success: false 
      }, { status: 400 });
    }

    if (!message && !file) {
      return NextResponse.json({ 
        error: 'Message or file is required',
        success: false 
      }, { status: 400 });
    }

    // Get existing messages for context
    const existingMessages = await convex.query('chat:getSessionMessages', {
      sessionId,
      username
    });

    // Process file if uploaded
    let fileProcessingResult = null;
    let enhancedMessage = message || '';
    
    if (file && (file.size > 0 || file.isKnowledgeNestFile)) {
      fileProcessingResult = await processFile(file);
      
      if (fileProcessingResult.type === 'text') {
        enhancedMessage += `\n\nFile content:\n${fileProcessingResult.content}`;
      } else if (fileProcessingResult.type === 'error') {
        enhancedMessage += `\n\nFile processing error:\n${fileProcessingResult.content}`;
      }
      // For images, we'll handle them differently in multi-agent mode
    }

    // Prepare context for agents
    const context = {
      messages: existingMessages,
      sessionId,
      username,
      file: fileProcessingResult,
      hasFile: !!file
    };

    let response;
    let responseData = {};

    if (multiAgentMode) {
      // Multi-agent processing
      const agentSystem = getAgentSystem();
      
      try {
        const result = await agentSystem.processInput(enhancedMessage, context);
        
        // Handle different types of agent responses
        if (result.type === 'info_request') {
          // Agent needs more information
          response = result.message;
          
          // Add topic suggestions if available
          if (result.topicSuggestions && result.topicSuggestions.length > 0) {
            response += `

**💡 Popular Topics:**
`;
            result.topicSuggestions.forEach((topic, index) => {
              response += `• ${topic}\n`;
            });
          }

          // Add suggested questions
          if (result.suggestedQuestions && result.suggestedQuestions.length > 0) {
            response += `

**❓ Or try these prompts:**
`;
            result.suggestedQuestions.forEach((question, index) => {
              response += `• "${question}"\n`;
            });
          }

          responseData = {
            agentType: result.agent,
            needsMoreInfo: true,
            missingInfo: result.missingInfo,
            suggestedQuestions: result.suggestedQuestions,
            topicSuggestions: result.topicSuggestions,
            systemStatus: agentSystem.getSystemStatus()
          };
          
        } else if (result.type === 'quiz_generated') {
          // Quiz was generated, now we need to generate the actual quiz
          const quizData = result.data;
          
          try {
            // Import the quiz generation logic directly instead of making HTTP call
            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_CHAT || process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            // Generate quiz using the same logic as the quiz API
            let prompt = `Generate ${quizData.questionCount} questions about ${quizData.subject}`;
            if (quizData.topic && quizData.topic.trim()) {
              prompt += ` focusing on the concept: ${quizData.topic}`;
            }
            prompt += `. Difficulty level: ${quizData.difficulty || 'medium'}.`;

            // Add question type specific instructions
            switch (quizData.quizType || 'mixed') {
              case 'mcq':
                prompt += ` All questions should be multiple choice with 4 options each.`;
                break;
              case 'true_false':
                prompt += ` All questions should be true/false questions.`;
                break;
              case 'writing':
                prompt += ` All questions should be text input questions that require written answers.`;
                break;
              case 'mixed':
                prompt += ` Mix different question types: multiple choice, true/false, and text input questions.`;
                break;
            }

            prompt += `
            Format as JSON array with each question having:
            1. questionText
            2. questionType ("mcq", "true_false", or "text_input")
            3. For MCQ: options (array of 4 strings) and aiAnswer (correct option)
            4. For True/False: options ["True", "False"] and aiAnswer ("True" or "False")
            5. For Text Input: aiAnswer (correct answer), acceptableAnswers (array of acceptable variations), and keywordMatches (array of essential keywords that must be present)
            
            Ensure questions are educational, accurate, and appropriate for the difficulty level.`;

            const geminiResult = await model.generateContent(prompt);
            const geminiResponse = await geminiResult.response;
            let questions = geminiResponse.text();
            
            // Clean up the response
            questions = questions.replace(/```json|```/g, '').trim();
            
            let parsedQuestions;
            try {
              parsedQuestions = JSON.parse(questions);
            } catch (parseError) {
              console.error('Failed to parse questions:', parseError);
              throw new Error('Failed to generate valid quiz questions');
            }

            // Store quiz in Convex
            const quizId = await convex.mutation('quiz:createQuiz', {
              subject: quizData.subject,
              concept: quizData.topic || '',
              questions: parsedQuestions.map(q => ({
                ...q,
                explanation: `This question tests your understanding of ${quizData.subject}${quizData.topic ? ` - ${quizData.topic}` : ''}.`
              })),
              username: username,
              numberOfQuestions: quizData.questionCount,
              quizType: quizData.quizType || 'mixed',
              difficulty: quizData.difficulty || 'medium'
            });

            const quizResult = { quizId, success: true };
            
            // Use the enhanced message from the agent
            response = result.message;
            
            // Add quiz button and next suggestions
            response += `

<div style="margin: 16px 0; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; text-align: center;">
  <h3 style="margin: 0 0 8px 0; font-size: 18px;">🎯 Your Quiz is Ready!</h3>
  <p style="margin: 0 0 12px 0; opacity: 0.9;">Test your knowledge and track your progress</p>
  <a href="/quiz/${quizResult.quizId}" style="display: inline-block; background: white; color: #667eea; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; transition: transform 0.2s;">
    🚀 Start Quiz Now
  </a>
</div>`;

            // Add next suggestions if available
            if (result.nextSuggestions && result.nextSuggestions.length > 0) {
              response += `

**🔮 What's Next?**

`;
              result.nextSuggestions.forEach((suggestion, index) => {
                response += `${index + 1}. **${suggestion.title}** - ${suggestion.description}\n`;
              });
            }

            responseData = {
              agentType: result.agent,
              quizGenerated: true,
              quizId: quizResult.quizId,
              quizData: quizData,
              nextSuggestions: result.nextSuggestions,
              systemStatus: agentSystem.getSystemStatus()
            };
            
          } catch (quizError) {
            console.error('Quiz generation error:', quizError);
            
            // More specific error handling
            let errorMessage = 'Please try again or contact support if the issue persists.';
            
            if (quizError.message.includes('Failed to generate valid quiz questions')) {
              errorMessage = 'I had trouble generating questions for this topic. Could you try being more specific about what you\'d like to be quizzed on?';
            } else if (quizError.message.includes('Convex') || quizError.message.includes('database')) {
              errorMessage = 'There was a temporary issue saving your quiz. Please try again in a moment.';
            } else if (quizError.message.includes('API key') || quizError.message.includes('authentication')) {
              errorMessage = 'There was an authentication issue. Please refresh the page and try again.';
            }
            
            response = `I've identified that you want to create a quiz on **${quizData.subject}**, but I encountered an error while generating it. ${errorMessage}

**Error Details**: ${quizError.message}`;
            
            responseData = {
              agentType: result.agent,
              error: true,
              errorMessage: quizError.message,
              errorType: quizError.message.includes('Convex') ? 'database' : 
                         quizError.message.includes('API') ? 'api' : 'generation',
              systemStatus: agentSystem.getSystemStatus()
            };
          }
          
        } else if (result.type === 'study_response') {
          // General study response
          response = result.message;
          responseData = {
            agentType: result.agent,
            systemStatus: agentSystem.getSystemStatus()
          };
        } else if (result.type === 'tutor_response') {
          // Tutor agent response - handle different types of tutor interactions
          response = result.message;
          
          responseData = {
            agentType: result.agent,
            tutorType: result.data?.type,
            systemStatus: agentSystem.getSystemStatus()
          };

          // Handle quiz selection step - fetch user's recent quizzes
          if (result.data?.type === 'quiz_selection' || 
              result.data?.type === 'initial_review' ||
              (result.data?.type === 'general_tutor_response' && result.message.includes('fetch your recent quiz'))) {
            try {
              // Fetch user's recent quizzes (last 3)
              const userQuizzes = await convex.query('quiz:getUserQuizzes', { username });
              const recentQuizzes = userQuizzes
                .filter(quiz => quiz.completed && quiz.score !== undefined)
                .sort((a, b) => (b.attemptedAt || b.createdAt) - (a.attemptedAt || a.createdAt))
                .slice(0, 3);

              if (recentQuizzes.length === 0) {
                response = `📚 I'd love to help you analyze your performance, but it looks like you haven't completed any quizzes yet.

**Get Started:**
1. 🎯 Take a quiz first to build your performance history
2. 📊 Complete at least one quiz to see detailed analytics
3. 🔄 Return here after taking some quizzes for personalized insights

Would you like me to help you create a quiz to get started?`;
                
                responseData.agentType = 'tutor';
                responseData.tutorType = 'no_quizzes';
              } else {
                // Format quiz display
                response = `📊 **Your Recent Quiz Performance**

Here are your last ${recentQuizzes.length} completed quizzes. Select one to get detailed performance analysis:

${recentQuizzes.map((quiz, index) => {
  const date = new Date(quiz.attemptedAt || quiz.createdAt).toLocaleDateString();
  const score = quiz.score || 0;
  const emoji = score >= 80 ? '🎉' : score >= 60 ? '👍' : '📚';
  
  return `**${index + 1}. ${quiz.subject}** ${emoji}
   📅 Date: ${date}
   📊 Score: ${score}%
   🎯 Topic: ${quiz.concept || 'General'}`;
}).join('\n\n')}

💡 **To get detailed analysis:** Just tell me which quiz you'd like me to review (e.g., "Analyze quiz 1" or "Review my ${recentQuizzes[0].subject} quiz").

🔍 **I can provide:**
- Detailed performance breakdown
- Concept-wise analysis  
- Personalized improvement suggestions
- Learning resource recommendations`;

                responseData.agentType = 'tutor';
                responseData.tutorType = 'quiz_selection';
                responseData.availableQuizzes = recentQuizzes.map(quiz => ({
                  id: quiz._id,
                  subject: quiz.subject,
                  score: quiz.score,
                  date: new Date(quiz.attemptedAt || quiz.createdAt).toLocaleDateString(),
                  concept: quiz.concept
                }));
              }
            } catch (error) {
              console.error('Error fetching user quizzes:', error);
              response = `I encountered an error while fetching your quiz history. Please try again in a moment.

**Error**: ${error.message}`;
              responseData.agentType = 'tutor';
              responseData.tutorType = 'error';
            }
          }
          
          // Handle quiz analysis - when user selects a specific quiz
          else if (result.data?.type === 'quiz_analysis' && result.data?.selectedQuiz) {
            try {
              // Get the selected quiz - could be a number (1, 2, 3) or quiz ID
              let selectedQuizId = result.data.selectedQuiz;
              
              // If it's a number, we need to map it to the actual quiz ID
              if (/^\d+$/.test(selectedQuizId)) {
                const userQuizzes = await convex.query('quiz:getUserQuizzes', { username });
                const recentQuizzes = userQuizzes
                  .filter(quiz => quiz.completed && quiz.score !== undefined)
                  .sort((a, b) => (b.attemptedAt || b.createdAt) - (a.attemptedAt || a.createdAt))
                  .slice(0, 3);
                
                const quizIndex = parseInt(selectedQuizId) - 1; // Convert to 0-based index
                if (quizIndex >= 0 && quizIndex < recentQuizzes.length) {
                  selectedQuizId = recentQuizzes[quizIndex]._id;
                } else {
                  response = `Sorry, I couldn't find quiz ${selectedQuizId}. Please select from the available quizzes (1-${recentQuizzes.length}).`;
                  responseData.agentType = 'tutor';
                  responseData.tutorType = 'selection_error';
                  return NextResponse.json({ 
                    response: response,
                    success: true,
                    multiAgentMode: multiAgentMode,
                    ...responseData
                  });
                }
              }
              
              // Check if AI review exists, if not generate it
              let aiReview = await convex.query('aiReview:getReviewByQuizId', { quizId: selectedQuizId });
              
              if (!aiReview) {
                // Generate AI review
                await convex.mutation('aiReview:generateReview', { 
                  quizId: selectedQuizId, 
                  username 
                });
                
                // Fetch the newly generated review
                aiReview = await convex.query('aiReview:getReviewByQuizId', { quizId: selectedQuizId });
              }
              
              if (aiReview) {
                // Get quiz details
                const quiz = await convex.query('quiz:getQuizById', { quizId: selectedQuizId });
                
                response = `🎯 **Performance Analysis: ${quiz.subject}**

${aiReview.feedback}

📊 **Concept Breakdown:**
${aiReview.concept_breakdown.map(concept => 
  `• **${concept.concept}**: ${concept.mastery_level}\n  ${concept.suggestion}`
).join('\n\n')}

💪 **Your Strengths:**
${aiReview.strengths}

🎯 **Improvement Suggestions:**
${aiReview.improvement_suggestions}

📚 **Personalized Learning Resources:**
${Object.entries(aiReview.learning_resources || {}).map(([concept, data]) => 
  `\n**${concept}:**\n${data.resources.slice(0, 2).map(resource => 
    `• ${resource.title} (${resource.type})`
  ).join('\n')}`
).join('\n')}

🔍 **Want More Details?** Ask me things like:
- "Give me more details on [concept name]"
- "I need help with [specific topic]"
- "Show me more resources for [subject]"`;

                responseData.agentType = 'tutor';
                responseData.tutorType = 'detailed_analysis';
                responseData.aiReview = aiReview;
                responseData.quiz = quiz;
              } else {
                response = `I'm having trouble generating the analysis for this quiz. Please try again in a moment.`;
                responseData.agentType = 'tutor';
                responseData.tutorType = 'analysis_error';
              }
              
            } catch (error) {
              console.error('Error analyzing quiz:', error);
              response = `I encountered an error while analyzing your quiz. Please try again.

**Error**: ${error.message}`;
              responseData.tutorType = 'analysis_error';
            }
          }
          // Handle when user selects a quiz by number or makes a selection
          else if (result.data?.type === 'quiz_selection' || 
                   (result.agent === 'tutor' && 
                    (enhancedMessage.toLowerCase().includes('quiz') && 
                     (enhancedMessage.match(/\b[123]\b/) || 
                      enhancedMessage.toLowerCase().includes('analyze') ||
                      enhancedMessage.toLowerCase().includes('review')))) ||
                   enhancedMessage.startsWith('ANALYZE_QUIZ_ID:')) {
            
            let selectedQuizId = null;
            
            // Check if it's a direct quiz ID selection from UI
            if (enhancedMessage.startsWith('ANALYZE_QUIZ_ID:')) {
              selectedQuizId = enhancedMessage.replace('ANALYZE_QUIZ_ID:', '');
            } else {
              // Extract quiz number or handle the selection
              let quizNumber = null;
              const numberMatch = enhancedMessage.match(/\b([123])\b/);
              if (numberMatch) {
                quizNumber = numberMatch[1];
              } else if (enhancedMessage.toLowerCase().includes('first') || enhancedMessage.toLowerCase().includes('1')) {
                quizNumber = '1';
              } else if (enhancedMessage.toLowerCase().includes('second') || enhancedMessage.toLowerCase().includes('2')) {
                quizNumber = '2';
              } else if (enhancedMessage.toLowerCase().includes('third') || enhancedMessage.toLowerCase().includes('3')) {
                quizNumber = '3';
              }

              if (quizNumber) {
                // Map quiz number to actual quiz ID
                try {
                  const userQuizzes = await convex.query('quiz:getUserQuizzes', { username });
                  const recentQuizzes = userQuizzes
                    .filter(quiz => quiz.completed && quiz.score !== undefined)
                    .sort((a, b) => (b.attemptedAt || b.createdAt) - (a.attemptedAt || a.createdAt))
                    .slice(0, 3);
                  
                  const quizIndex = parseInt(quizNumber) - 1;
                  if (quizIndex >= 0 && quizIndex < recentQuizzes.length) {
                    selectedQuizId = recentQuizzes[quizIndex]._id;
                  } else {
                    response = `Sorry, I couldn't find quiz ${quizNumber}. Please select from the available quizzes.`;
                    responseData.tutorType = 'selection_error';
                    return NextResponse.json({ 
                      response: response,
                      success: true,
                      multiAgentMode: multiAgentMode,
                      ...responseData
                    });
                  }
                } catch (error) {
                  console.error('Error mapping quiz number:', error);
                  response = `I encountered an error while finding the quiz. Please try again.`;
                  responseData.tutorType = 'selection_error';
                  return NextResponse.json({ 
                    response: response,
                    success: true,
                    multiAgentMode: multiAgentMode,
                    ...responseData
                  });
                }
              }
            }

            if (selectedQuizId) {
              // Trigger quiz analysis with the selected quiz ID
              try {
                // Check if AI review exists, if not generate it
                let aiReview = await convex.query('aiReview:getReviewByQuizId', { quizId: selectedQuizId });
                
                if (!aiReview) {
                  response = `🔄 **Analyzing Your Quiz Performance**

Please wait while I generate a detailed performance analysis for your quiz...

This may take a moment as I analyze your answers and prepare personalized recommendations.`;
                  
                  // Generate AI review in the background
                  try {
                    await convex.mutation('aiReview:generateReview', { 
                      quizId: selectedQuizId, 
                      username 
                    });
                    
                    // Fetch the newly generated review
                    aiReview = await convex.query('aiReview:getReviewByQuizId', { quizId: selectedQuizId });
                  } catch (reviewError) {
                    console.error('Error generating review:', reviewError);
                    response = `I encountered an error while generating the analysis. Please try again.

**Error**: ${reviewError.message}`;
                    responseData.tutorType = 'analysis_error';
                    return NextResponse.json({ 
                      response: response,
                      success: true,
                      multiAgentMode: multiAgentMode,
                      ...responseData
                    });
                  }
                }
                
                if (aiReview) {
                  // Get quiz details using the correct function name
                  const quiz = await convex.query('quiz:getQuizById', { quizId: selectedQuizId });
                  
                  response = `🎯 **Performance Analysis: ${quiz.subject}**

${aiReview.feedback}

📊 **Concept Breakdown:**
${aiReview.concept_breakdown.map(concept => 
  `• **${concept.concept}**: ${concept.mastery_level}\n  ${concept.suggestion}`
).join('\n\n')}

💪 **Your Strengths:**
${aiReview.strengths}

🎯 **Improvement Suggestions:**
${aiReview.improvement_suggestions}

📚 **Personalized Learning Resources:**
${Object.entries(aiReview.learning_resources || {}).map(([concept, data]) => 
  `\n**${concept}:**\n${data.resources.slice(0, 2).map(resource => 
    `• ${resource.title} (${resource.type})`
  ).join('\n')}`
).join('\n')}

🔍 **Want More Details?** Ask me things like:
- "Give me more details on [concept name]"  
- "I need help with [specific topic]"
- "Show me more resources for [subject]"`;

                  responseData.tutorType = 'detailed_analysis';
                  responseData.aiReview = aiReview;
                  responseData.quiz = quiz;
                }
              } catch (error) {
                console.error('Error in quiz analysis:', error);
                response = `I encountered an error while analyzing your quiz. Please try again.

**Error**: ${error.message}`;
                responseData.tutorType = 'analysis_error';
              }
            } else {
              response = result.message; // Use the original tutor response
            }
          }
        }
        
        // Set agentType based on the agent that handled the request
        if (result.agent) {
          responseData.agentType = result.agent;
        }
        
        // Add system status for debugging and UI state
        responseData.systemStatus = agentSystem.getSystemStatus();
        
        // Add routing information to response
        if (result.routing) {
          responseData.routing = {
            targetAgent: result.routing.targetAgent,
            confidence: result.routing.confidence,
            reasoning: result.routing.reasoning
          };
        }
        
      } catch (agentError) {
        console.error('Agent system error:', agentError);
        response = `I encountered an error while processing your request. Please try again.

**Error**: ${agentError.message}`;
        
        responseData = {
          error: true,
          errorMessage: agentError.message,
          systemStatus: agentSystem.getSystemStatus()
        };
      }
      
    } else {
      // Fallback to original single-agent behavior
      // This is essentially the original StudyBuddy logic
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_CHAT);
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      });

      // Build context (simplified version of original logic)
      let context = `You are StudyBuddy, an AI learning companion. Help the student with their request.\n\nStudent: ${enhancedMessage}`;
      
      if (existingMessages && existingMessages.length > 0) {
        const recentMessages = existingMessages.slice(-10);
        const historyContext = recentMessages.map(msg => {
          const role = msg.role === 'user' ? 'Student' : 'StudyBuddy';
          return `${role}: ${msg.content}`;
        }).join('\n');
        
        context = `You are StudyBuddy, an AI learning companion. Here's our conversation history:\n\n${historyContext}\n\nContinue the conversation as StudyBuddy.\n\nStudent's new message: ${enhancedMessage}`;
      }

      const result = await model.generateContent(context);
      const aiResponse = await result.response;
      response = aiResponse.text();
      
      responseData = {
        mode: 'single-agent'
      };
    }

    return NextResponse.json({ 
      response: response,
      success: true,
      multiAgentMode: multiAgentMode,
      ...responseData
    });

  } catch (error) {
    console.error('Multi-Agent StudyBuddy API Error:', error);
    return NextResponse.json({ 
      error: `Failed to process request: ${error.message}`,
      success: false 
    }, { status: 500 });
  }
}

// GET endpoint to retrieve agent system status
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'status') {
      const agentSystem = getAgentSystem();
      return NextResponse.json({
        status: agentSystem.getSystemStatus(),
        success: true
      });
    } else if (action === 'reset') {
      const agentSystem = getAgentSystem();
      agentSystem.clearAllContexts();
      return NextResponse.json({
        message: 'Agent system reset successfully',
        success: true
      });
    }
    
    return NextResponse.json({
      message: 'Multi-Agent StudyBuddy API',
      availableActions: ['status', 'reset'],
      success: true
    });
    
  } catch (error) {
    console.error('GET request error:', error);
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}
