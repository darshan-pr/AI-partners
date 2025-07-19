import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_CHAT);

// Constants for better configuration management
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

const MAX_HISTORY_LENGTH = 10; // Limit history to prevent context overflow
const MAX_RETRIES = 2;

// Enhanced file processing with better error handling
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
      • Word Count: ${wordCount}
      
      Preview:
      ${preview}${textContent.length > 500 ? '...\n\n[Content truncated for preview]' : ''}`;
      
    } else if (file.type.startsWith('image/')) {
      const base64Data = buffer.toString('base64');
      return {
        type: 'image',
        data: {
          fileName: file.name,
          fileSize: fileSize,
          mimeType: file.type,
          base64Data: base64Data
        }
      };
      
    } else {
      content = `📁 File Upload:
      • File: ${file.name}
      • Size: ${fileSize} KB
      • Type: ${file.type || 'Unknown'}
      • Status: File received successfully`;
    }
    
    return { type: 'text', content: content };
  } catch (error) {
    console.error('File processing error:', error);
    return { 
      type: 'error', 
      content: `❌ Error processing file "${file.name}": ${error.message}` 
    };
  }
}

// Improved image analysis with better error handling
async function analyzeImage(imageData, userMessage, model) {
  try {
    const prompt = userMessage || "Please analyze this image in detail. Describe what you see, including objects, people, activities, colors, composition, and any text visible in the image.";
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64Data,
        },
      },
    ]);

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Image analysis error:', error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

// Improved thinking content extraction
function extractThinkingContent(response, thinkMode) {
  let thinkingContent = '';
  let mainContent = '';
  
  if (!thinkMode) {
    return { thinking: '', main: response.text() };
  }
  
  try {
    const fullText = response.text();
    
    // Look for explicit thinking tags
    const thinkingMatch = fullText.match(/<thinking>([\s\S]*?)<\/thinking>/i);
    if (thinkingMatch) {
      thinkingContent = thinkingMatch[1].trim();
      mainContent = fullText.replace(/<thinking>[\s\S]*?<\/thinking>/i, '').trim();
    } else {
      // If no thinking tags found, treat as main content
      mainContent = fullText;
    }
    
    // Fallback if main content is empty
    if (!mainContent && response.text) {
      mainContent = response.text();
    }
    
  } catch (error) {
    console.error('Error extracting thinking content:', error);
    mainContent = response.text ? response.text() : 'Error processing response';
  }
  
  return {
    thinking: thinkingContent.trim(),
    main: mainContent.trim()
  };
}

// Create mode-specific conversation context
function buildConversationContext(history, mode, webSearch, action) {
  // Filter history based on mode to prevent cross-contamination
  const modeKey = `${mode}_${webSearch ? 'search' : 'normal'}`;
  
  // Get relevant history for current mode
  let relevantHistory = [];
  if (Array.isArray(history)) {
    relevantHistory = history
      .filter(msg => {
        // Only include messages from the same mode context
        return msg.mode === mode && msg.webSearch === webSearch;
      })
      .slice(-MAX_HISTORY_LENGTH); // Limit history length
  }
  
  let contextPrompt = '';
  
  // Build conversation context
  if (relevantHistory.length > 0) {
    contextPrompt = relevantHistory.map(msg => {
      const role = msg.role === 'user' ? 'Human' : 'Assistant';
      return `${role}: ${msg.content}`;
    }).join('\n') + '\n\n';
  }
  
  // Add mode-specific instructions
  if (mode === 'thinking') {
    contextPrompt += `[THINKING MODE ACTIVE] Please show your reasoning process by wrapping your thoughts in <thinking></thinking> tags before providing your final answer.\n\n`;
  }
  
  if (webSearch) {
    contextPrompt += `[WEB SEARCH ENABLED] You have access to current information through web search.\n\n`;
  }
  
  return contextPrompt;
}

// Build prompt based on action type
function buildActionPrompt(action, fileProcessingResult) {
  switch (action) {
    case 'euro-2024':
      return 'Who won the Euro 2024 football championship? Please provide details about the final match.';
      
    case 'occams-razor':
      return 'Explain Occam\'s Razor principle with a practical example and demonstrate how it applies to problem-solving in different fields.';
      
    case 'summarize-pdf':
      if (fileProcessingResult && fileProcessingResult.type === 'text') {
        return `Please provide a comprehensive summary and analysis of this document:\n\n${fileProcessingResult.content}\n\nPlease summarize and analyze the key points from this document.`;
      } else {
        return 'I\'d like to summarize a PDF, but no file was uploaded. Please explain how to upload and summarize PDF files.';
      }
      
    default:
      return `Please help me with this action: ${action}`;
  }
}

// Retry logic with exponential backoff
async function generateWithRetry(model, prompt, maxRetries = MAX_RETRIES) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      
      return await result.response;
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // Exponential backoff: wait 1s, then 2s, then 4s
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        console.log(`Retry attempt ${attempt + 1} after ${waitTime}ms`);
      }
    }
  }
  
  throw lastError;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const message = formData.get('message');
    const historyString = formData.get('history');
    const file = formData.get('file');
    const webSearch = formData.get('webSearch') === 'true';
    const thinkMode = formData.get('thinkMode') === 'true';
    const action = formData.get('action');

    // Validate input
    if (!message && !file && !action) {
      return NextResponse.json({ 
        error: 'Message, file, or action is required',
        success: false 
      }, { status: 400 });
    }

    // Parse conversation history with validation
    let history = [];
    try {
      if (historyString && historyString !== 'undefined' && historyString !== 'null') {
        const parsedHistory = JSON.parse(historyString);
        if (Array.isArray(parsedHistory)) {
          history = parsedHistory;
        }
      }
    } catch (e) {
      console.error('Error parsing history:', e);
      history = [];
    }

    // Determine current mode
    const currentMode = thinkMode ? 'thinking' : 'normal';
    
    // Process file if uploaded
    let fileProcessingResult = null;
    let isImageAnalysis = false;
    
    if (file && file.size > 0) {
      fileProcessingResult = await processFile(file);
      isImageAnalysis = fileProcessingResult.type === 'image';
    }

    // Handle image analysis separately to avoid context confusion
    if (isImageAnalysis && fileProcessingResult.data) {
      const userMessage = message || 'Please analyze this image in detail.';
      
      try {
        const model = genAI.getGenerativeModel({ 
          model: MODELS.VISION,
          generationConfig: GENERATION_CONFIG,
        });
        
        const imageAnalysisResult = await analyzeImage(
          fileProcessingResult.data, 
          userMessage, 
          model
        );
        
        return NextResponse.json({ 
          message: imageAnalysisResult,
          thinking: null,
          hasGrounding: false,
          success: true,
          isImageAnalysis: true,
          mode: 'image',
          imageInfo: {
            fileName: fileProcessingResult.data.fileName,
            fileSize: fileProcessingResult.data.fileSize,
            mimeType: fileProcessingResult.data.mimeType
          }
        });
      } catch (error) {
        console.error('Image analysis failed:', error);
        return NextResponse.json({ 
          error: `Failed to analyze image: ${error.message}`,
          success: false 
        }, { status: 500 });
      }
    }

    // Build conversation context for current mode
    const contextPrompt = buildConversationContext(history, currentMode, webSearch, action);
    
    // Build the main prompt
    let fullPrompt = contextPrompt;
    
    if (action) {
      const actionPrompt = buildActionPrompt(action, fileProcessingResult);
      fullPrompt += `Human: ${actionPrompt}`;
    } else {
      const userMessage = message || 'Please analyze the uploaded file.';
      
      if (fileProcessingResult && fileProcessingResult.type === 'text') {
        fullPrompt += `File content:\n${fileProcessingResult.content}\n\nHuman: ${userMessage}`;
      } else if (fileProcessingResult && fileProcessingResult.type === 'error') {
        fullPrompt += `File processing error:\n${fileProcessingResult.content}\n\nHuman: ${userMessage}`;
      } else {
        fullPrompt += `Human: ${userMessage}`;
      }
    }

    // Choose appropriate model
    const modelName = thinkMode ? MODELS.THINKING : MODELS.TEXT;
    
    // Configure model
    const modelConfig = { 
      model: modelName,
      generationConfig: GENERATION_CONFIG,
    };

    // Add tools for web search if needed
    if (webSearch || action === 'euro-2024') {
      modelConfig.tools = [{ googleSearch: {} }];
    }

    const model = genAI.getGenerativeModel(modelConfig);
    
    // Generate response with retry logic
    const response = await generateWithRetry(model, fullPrompt);
    
    // Extract thinking and main content
    const { thinking, main } = extractThinkingContent(response, thinkMode);
    
    let aiMessage = main;
    let thinkingContent = thinking;
    let hasGroundingInfo = false;

    // Check for grounding metadata
    if (response.candidates && response.candidates[0] && response.candidates[0].groundingMetadata) {
      hasGroundingInfo = true;
    }

    // Add search context note if applicable
    if (hasGroundingInfo || webSearch || action === 'euro-2024') {
      aiMessage += '\n\n---\n*Response enhanced with Google Search results*';
    }

    // Validate response
    if (!aiMessage || aiMessage.trim().length === 0) {
      aiMessage = 'I apologize, but I couldn\'t generate a proper response. Please try again.';
    }

    return NextResponse.json({ 
      message: aiMessage,
      thinking: thinkingContent || null,
      hasGrounding: hasGroundingInfo,
      success: true,
      mode: currentMode,
      webSearch: webSearch,
      debug: process.env.NODE_ENV === 'development' ? {
        modelUsed: modelName,
        thinkMode: thinkMode,
        hasThinking: !!thinkingContent,
        thinkingLength: thinkingContent ? thinkingContent.length : 0,
        historyLength: history.length,
        promptLength: fullPrompt.length
      } : undefined
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Enhanced error handling with specific error types
    let errorMessage = 'Failed to get response from AI';
    let statusCode = 500;
    let retryable = false;
    
    if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
      errorMessage = 'Gemini API key is missing or invalid';
      statusCode = 401;
    } else if (error.message?.includes('quota') || error.message?.includes('QUOTA')) {
      errorMessage = 'API quota exceeded. Please try again later.';
      statusCode = 429;
      retryable = true;
    } else if (error.message?.includes('SAFETY') || error.message?.includes('safety')) {
      errorMessage = 'Content filtered by safety policies';
      statusCode = 400;
    } else if (error.code === 'ENOTFOUND' || error.message?.includes('network')) {
      errorMessage = 'Network connection error. Please check your internet connection.';
      statusCode = 503;
      retryable = true;
    } else if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
      errorMessage = 'Request timeout. Please try again with a shorter message.';
      statusCode = 408;
      retryable = true;
    } else if (error.message?.includes('model') || error.message?.includes('MODEL')) {
      errorMessage = 'Model not available. Please try again with a different configuration.';
      statusCode = 400;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        success: false,
        retryable: retryable
      },
      { status: statusCode }
    );
  }
}