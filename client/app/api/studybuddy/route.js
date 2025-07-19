import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_CHAT);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

const MODELS = {
  VISION: "gemini-2.5-flash",
  TEXT: "gemini-2.5-flash",
  THINKING: "gemini-2.5-flash"
};

const GENERATION_CONFIG = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 4096,
};

const MAX_HISTORY_LENGTH = 20;
const MAX_RETRIES = 3;

// Enhanced file processing
async function processFile(file) {
  try {
    if (!file || file.size === 0) {
      throw new Error('Invalid file provided');
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
      // Handle images
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

// Image analysis function
async function analyzeImage(imageData, prompt, model) {
  try {
    const result = await model.generateContent([
      prompt,
      imageData,
    ]);

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Image analysis error:', error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

// Build conversation context for study buddy
function buildStudyBuddyContext(messages) {
  if (!messages || messages.length === 0) {
    return `You are StudyBuddy, an AI learning companion designed to help students learn effectively. You should:

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

Start the conversation by greeting the student warmly and asking how you can help with their studies today.\n\n`;
  }

  // Build context from recent messages
  const recentMessages = messages.slice(-MAX_HISTORY_LENGTH);
  let context = `You are StudyBuddy, an AI learning companion. Here's our conversation history:\n\n`;
  
  context += recentMessages.map(msg => {
    const role = msg.role === 'user' ? 'Student' : 'StudyBuddy';
    return `${role}: ${msg.content}`;
  }).join('\n') + '\n\n';
  
  context += `Continue the conversation as StudyBuddy, maintaining your helpful and educational tone. Use emojis and formatting to make your response engaging and easy to understand.\n\nStudent's new message:\n`;
  
  return context;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const message = formData.get('message');
    const sessionId = formData.get('sessionId');
    const username = formData.get('username');
    const file = formData.get('file');

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
    let isImageAnalysis = false;
    
    if (file && file.size > 0) {
      fileProcessingResult = await processFile(file);
      isImageAnalysis = fileProcessingResult.type === 'image';
    }

    // Handle image analysis
    if (isImageAnalysis && fileProcessingResult.data) {
      const userMessage = message || 'Please analyze this image and help me understand what I\'m looking at.';
      
      try {
        const model = genAI.getGenerativeModel({ 
          model: MODELS.VISION,
          generationConfig: GENERATION_CONFIG,
        });
        
        const imageAnalysisResult = await analyzeImage(
          fileProcessingResult.data, 
          `As StudyBuddy, analyze this image and help the student understand it. ${userMessage}`, 
          model
        );
        
        return NextResponse.json({ 
          response: imageAnalysisResult,
          success: true,
          messageType: 'image_analysis'
        });
      } catch (error) {
        console.error('Image analysis failed:', error);
        return NextResponse.json({ 
          error: `Failed to analyze image: ${error.message}`,
          success: false 
        }, { status: 500 });
      }
    }

    // Build conversation context
    const contextPrompt = buildStudyBuddyContext(existingMessages);
    
    // Build the main prompt
    let fullPrompt = contextPrompt;
    const userMessage = message || 'Please analyze the uploaded file.';
    
    if (fileProcessingResult && fileProcessingResult.type === 'text') {
      fullPrompt += `File content:\n${fileProcessingResult.content}\n\n${userMessage}`;
    } else if (fileProcessingResult && fileProcessingResult.type === 'error') {
      fullPrompt += `File processing error:\n${fileProcessingResult.content}\n\n${userMessage}`;
    } else {
      fullPrompt += userMessage;
    }

    // Generate response using Gemini
    const model = genAI.getGenerativeModel({ 
      model: MODELS.TEXT,
      generationConfig: GENERATION_CONFIG,
    });

    let retryCount = 0;
    let response = null;

    while (retryCount < MAX_RETRIES) {
      try {
        const result = await model.generateContent(fullPrompt);
        response = await result.response;
        break;
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        
        if (retryCount >= MAX_RETRIES) {
          throw new Error(`Failed to generate response after ${MAX_RETRIES} attempts: ${error.message}`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (!response) {
      throw new Error('Failed to generate response');
    }

    const aiResponse = response.text();

    return NextResponse.json({ 
      response: aiResponse,
      success: true,
      messageType: fileProcessingResult ? 'file_analysis' : 'text'
    });

  } catch (error) {
    console.error('StudyBuddy API Error:', error);
    return NextResponse.json({ 
      error: `Failed to process request: ${error.message}`,
      success: false 
    }, { status: 500 });
  }
}
