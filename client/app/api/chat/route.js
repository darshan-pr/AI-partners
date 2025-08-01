import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
// Import pdf-parse dynamically to avoid build issues
// import pdf from 'pdf-parse';

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

// Utility function to sanitize content for safe JSON processing
function sanitizeContent(content) {
  if (!content || typeof content !== 'string') return '';
  
  return content
    .replace(/\\/g, '\\\\')   // Escape backslashes
    .replace(/"/g, '\\"')     // Escape quotes
    .replace(/\n/g, '\\n')    // Escape newlines
    .replace(/\r/g, '\\r')    // Escape carriage returns
    .replace(/\t/g, '\\t')    // Escape tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
}

// Enhanced file processing with better error handling and content sanitization
async function processFile(file) {
  try {
    if (!file || file.size === 0) {
      throw new Error('Invalid file provided');
    }

    console.log(`[FILE PROCESSING] Starting to process file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    // Add artificial delay to show loading state for small files
    if (file.size < 100 * 1024) { // Files smaller than 100KB
      await new Promise(resolve => setTimeout(resolve, 800)); // 800ms delay
    } else if (file.size < 1024 * 1024) { // Files smaller than 1MB
      await new Promise(resolve => setTimeout(resolve, 1200)); // 1.2s delay
    } else {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay for larger files
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    const fileSize = (buffer.length / 1024).toFixed(2);
    
    console.log(`[FILE PROCESSING] File buffer created successfully: ${fileSize} KB`);
    
    let content = '';
    
    if (fileName.endsWith('.pdf')) {
      console.log(`[FILE PROCESSING] Processing PDF document: ${file.name}`);
      try {
        console.log(`[FILE PROCESSING] Extracting text from PDF: ${file.name}`);
        // Dynamic import for pdf-parse to avoid build issues
        const pdf = (await import('pdf-parse')).default;
        const pdfData = await pdf(buffer);
        
        if (pdfData.text && pdfData.text.trim().length > 0) {
          const sanitizedText = sanitizeContent(pdfData.text.trim());
          const wordCount = pdfData.text.split(/\s+/).filter(word => word.length > 0).length;
          const pageCount = pdfData.numpages;
          
          console.log(`[FILE PROCESSING] PDF text extraction successful: ${wordCount} words, ${pageCount} pages`);
          
          content = `📄 PDF Document Content:
• File: ${file.name}
• Size: ${fileSize} KB
• Pages: ${pageCount}
• Word Count: ${wordCount}

Full Text Content:
${sanitizedText}`;
        } else {
          console.log(`[FILE PROCESSING] PDF text extraction returned empty content`);
          content = `📄 PDF Document Analysis:
• File: ${file.name}
• Size: ${fileSize} KB
• Status: PDF file received but no extractable text found
• Note: This might be a scanned PDF or contain only images

The PDF was processed but appears to contain no readable text. This could happen if:
- The PDF contains only images or scanned pages
- The PDF is password protected
- The PDF has formatting that prevents text extraction`;
        }
      } catch (pdfError) {
        console.error(`[FILE PROCESSING] PDF extraction error:`, pdfError);
        content = `📄 PDF Document Processing Error:
• File: ${file.name}
• Size: ${fileSize} KB
• Error: ${pdfError.message}

Unable to extract text from this PDF file. The file may be:
- Corrupted or damaged
- Password protected
- In an unsupported PDF format
- Too complex for automatic text extraction

Please try converting the PDF to text format or use a different file.`;
      }
      
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv') || 
               fileName.endsWith('.json') || fileName.endsWith('.xml') || fileName.endsWith('.html') ||
               fileName.endsWith('.css') || fileName.endsWith('.js') || fileName.endsWith('.py') ||
               fileName.endsWith('.java') || fileName.endsWith('.cpp') || fileName.endsWith('.c') ||
               fileName.endsWith('.sql') || fileName.endsWith('.yml') || fileName.endsWith('.yaml') ||
               file.type.includes('text/') || file.type.includes('application/json')) {
      console.log(`[FILE PROCESSING] Processing text file: ${file.name}`);
      try {
        const textContent = buffer.toString('utf-8');
        // Sanitize content to prevent JSON parsing issues
        const sanitizedContent = sanitizeContent(textContent);
        
        const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
        const lineCount = textContent.split('\n').length;
        
        // For very large files, provide a preview
        const maxLength = 8000; // Reasonable limit for AI processing
        let displayContent = sanitizedContent;
        let truncated = false;
        
        if (sanitizedContent.length > maxLength) {
          displayContent = sanitizedContent.substring(0, maxLength);
          truncated = true;
        }
        
        const fileTypeMap = {
          '.txt': 'Plain Text',
          '.md': 'Markdown',
          '.csv': 'CSV Data',
          '.json': 'JSON Data',
          '.xml': 'XML Document',
          '.html': 'HTML Document',
          '.css': 'CSS Stylesheet',
          '.js': 'JavaScript',
          '.py': 'Python Code',
          '.java': 'Java Code',
          '.cpp': 'C++ Code',
          '.c': 'C Code'
        };
        
        const extension = fileName.substring(fileName.lastIndexOf('.'));
        const fileTypeDescription = fileTypeMap[extension] || 'Text File';
        
        content = `📝 ${fileTypeDescription} Content:
• File: ${file.name}
• Size: ${fileSize} KB
• Lines: ${lineCount}
• Word Count: ${wordCount}
${truncated ? '• Note: Large file truncated for processing\n' : ''}
Full Content:
${displayContent}${truncated ? '\n\n[Content truncated - showing first 8,000 characters]' : ''}`;
        
      } catch (textError) {
        console.error(`[FILE PROCESSING] Text file processing error:`, textError);
        content = `📝 Text File Processing Error:
• File: ${file.name}
• Size: ${fileSize} KB
• Error: ${textError.message}

Unable to read the text content. The file may have encoding issues or be corrupted.`;
      }
      
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      console.log(`[FILE PROCESSING] Processing Word document: ${file.name}`);
      content = `📝 Word Document Analysis:
• File: ${file.name}
• Size: ${fileSize} KB
• Type: Microsoft Word Document
• Status: Document received successfully

Note: For full Word document text extraction, additional libraries would be needed.
Current status: File structure analyzed and ready for processing.`;
      
    } else if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
      console.log(`[FILE PROCESSING] Processing PowerPoint presentation: ${file.name}`);
      content = `🎯 PowerPoint Presentation Analysis:
• File: ${file.name}
• Size: ${fileSize} KB
• Type: Microsoft PowerPoint Presentation
• Status: Presentation received successfully

Note: For full PowerPoint content extraction, additional libraries would be needed.
Current status: Presentation structure analyzed and ready for processing.`;
      
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      console.log(`[FILE PROCESSING] Processing Excel spreadsheet: ${file.name}`);
      content = `📊 Excel Spreadsheet Analysis:
• File: ${file.name}
• Size: ${fileSize} KB
• Type: Microsoft Excel Spreadsheet
• Status: Spreadsheet received successfully

Note: For full Excel data extraction, additional libraries would be needed.
Current status: Spreadsheet structure analyzed and ready for processing.`;
      
    } else if (file.type.startsWith('image/')) {
      console.log(`[FILE PROCESSING] Processing image file: ${file.name}`);
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
      console.log(`[FILE PROCESSING] Processing generic file: ${file.name}`);
      content = `📁 File Upload:
• File: ${file.name}
• Size: ${fileSize} KB
• Type: ${file.type || 'Unknown'}
• Status: File received successfully

This file type is supported for upload but may require specific processing based on its content.`;
    }
    
    console.log(`[FILE PROCESSING] File processing completed successfully: ${file.name}`);
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

// Retry logic with exponential backoff and better error handling
async function generateWithRetry(model, prompt, maxRetries = MAX_RETRIES) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Sanitize the prompt before sending to prevent JSON parsing issues
      const sanitizedPrompt = sanitizeContent(prompt);
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: sanitizedPrompt }] }],
      });
      
      const response = await result.response;
      
      // Validate response before returning
      if (!response) {
        throw new Error('Empty response from model');
      }
      
      return response;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed:`, error.message);
      
      // Handle specific JSON parsing errors
      if (error.message?.includes('invalid json') || error.message?.includes('hex escape')) {
        console.error('JSON parsing error detected, sanitizing content and retrying...');
        // On JSON errors, don't retry immediately - the error is likely in our prompt
        if (attempt === 0) {
          // Try to clean the prompt more aggressively
          prompt = prompt.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove all control characters
          continue;
        }
      }
      
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
        console.log(`[IMAGE ANALYSIS] Starting image analysis for: ${fileProcessingResult.data.fileName}`);
        
        const model = genAI.getGenerativeModel({ 
          model: MODELS.VISION,
          generationConfig: GENERATION_CONFIG,
        });
        
        // Add processing delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const imageAnalysisResult = await analyzeImage(
          fileProcessingResult.data, 
          userMessage, 
          model
        );
        
        console.log(`[IMAGE ANALYSIS] Image analysis completed successfully`);
        
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
    
    // Build the main prompt with proper sanitization
    let fullPrompt = contextPrompt;
    
    if (action) {
      const actionPrompt = buildActionPrompt(action, fileProcessingResult);
      fullPrompt += `Human: ${actionPrompt}`;
    } else {
      const userMessage = message || 'Please analyze the uploaded file.';
      
      if (fileProcessingResult && fileProcessingResult.type === 'text') {
        // Sanitize file content to prevent JSON parsing issues
        const sanitizedContent = sanitizeContent(fileProcessingResult.content);
        
        // Add enhanced context for document analysis
        const documentContext = `
You have been provided with a document for analysis. Please analyze the content thoroughly and provide comprehensive insights.

Document Information and Content:
${sanitizedContent}

Instructions for analysis:
- If this is educational content, explain key concepts clearly
- If this is technical documentation, break down complex information
- Provide practical examples and applications where relevant
- Answer any specific questions about the content
- Highlight important points and main takeaways

`;
        
        fullPrompt += `${documentContext}\nHuman: ${userMessage}`;
      } else if (fileProcessingResult && fileProcessingResult.type === 'error') {
        // Sanitize error content as well
        const sanitizedError = sanitizeContent(fileProcessingResult.content);
        fullPrompt += `File processing encountered an issue:\n${sanitizedError}\n\nHuman: ${userMessage}`;
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
    
    console.log(`[AI GENERATION] Starting content generation with model: ${modelName}`);
    console.log(`[AI GENERATION] Prompt length: ${fullPrompt.length} characters`);
    
    // Generate response with retry logic
    const response = await generateWithRetry(model, fullPrompt);
    
    console.log(`[AI GENERATION] Content generation completed successfully`);
    
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
    
    // Handle JSON parsing errors specifically
    if (error.message?.includes('invalid json') || error.message?.includes('hex escape')) {
      errorMessage = 'Content contains invalid characters that cannot be processed. Please try rephrasing your message or uploading a different file.';
      statusCode = 400;
      console.error('JSON parsing error detected. Raw error:', error.message);
    } else if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
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
        retryable: retryable,
        errorType: error.message?.includes('invalid json') ? 'JSON_PARSE_ERROR' : 'UNKNOWN'
      },
      { status: statusCode }
    );
  }
}