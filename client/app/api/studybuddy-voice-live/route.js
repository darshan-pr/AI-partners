import { NextResponse } from 'next/server';
import { WebSocketServer } from 'ws';
import { AgentSystem, AGENT_TYPES } from '../../../lib/agents/AgentSystem';

// WebSocket server instance
let wss = null;

// Global agent system instance for voice sessions
let voiceAgentSystem = null;

// Initialize or get the voice agent system
function getVoiceAgentSystem() {
  if (!voiceAgentSystem) {
    voiceAgentSystem = new AgentSystem();
  }
  return voiceAgentSystem;
}

// Initialize WebSocket server
function initWebSocketServer() {
  if (wss) return wss;
  
  wss = new WebSocketServer({ 
    port: 8080,
    verifyClient: (info) => {
      // Add any authentication logic here if needed
      return true;
    }
  });

  wss.on('connection', (ws, request) => {
    console.log('Voice WebSocket connection established');
    
    // Initialize session context
    const sessionContext = {
      sessionId: Date.now().toString(),
      username: null,
      agentSystem: getVoiceAgentSystem(),
      isListening: false,
      currentAgent: null,
      conversationBuffer: [],
      awaitingStyleChoice: false,
      pendingExplanation: null
    };

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleVoiceMessage(ws, message, sessionContext);
      } catch (error) {
        console.error('Voice message handling error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          error: error.message
        }));
      }
    });

    ws.on('close', () => {
      console.log('Voice WebSocket connection closed');
      // Clean up session context
      sessionContext.agentSystem.clearAllContexts();
    });

    ws.on('error', (error) => {
      console.error('Voice WebSocket error:', error);
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      sessionId: sessionContext.sessionId,
      message: 'Voice session established'
    }));
  });

  return wss;
}

// Handle incoming voice messages
async function handleVoiceMessage(ws, message, sessionContext) {
  const { type, data } = message;

  switch (type) {
    case 'init_session':
      sessionContext.username = data.username;
      sessionContext.multiAgentMode = data.multiAgentMode || false;
      
      ws.send(JSON.stringify({
        type: 'session_initialized',
        sessionId: sessionContext.sessionId,
        multiAgentMode: sessionContext.multiAgentMode,
        agentStatus: sessionContext.agentSystem.getSystemStatus()
      }));
      break;

    case 'start_listening':
      sessionContext.isListening = true;
      
      ws.send(JSON.stringify({
        type: 'listening_started',
        agentStatus: sessionContext.agentSystem.getSystemStatus()
      }));
      break;

    case 'stop_listening':
      sessionContext.isListening = false;
      
      ws.send(JSON.stringify({
        type: 'listening_stopped'
      }));
      break;

    case 'voice_input':
      const voiceMode = data.voiceMode || 'conversational';
      const inputData = { ...data, voiceMode };
      
      if (!sessionContext.multiAgentMode) {
        // Single agent mode - direct response
        await handleSingleAgentVoice(ws, inputData, sessionContext);
      } else {
        // Multi-agent mode - route through orchestrator
        await handleMultiAgentVoice(ws, inputData, sessionContext);
      }
      break;

    case 'get_agent_status':
      ws.send(JSON.stringify({
        type: 'agent_status',
        agentStatus: sessionContext.agentSystem.getSystemStatus()
      }));
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Unknown message type'
      }));
  }
}

// Detect if user is asking for an explanation
function isExplanationRequest(transcript) {
  const explanationKeywords = [
    'explain', 'how does', 'how do', 'what is', 'what are', 'tell me about',
    'can you explain', 'help me understand', 'break down', 'walk me through',
    'how to', 'why does', 'why do', 'what happens when', 'describe'
  ];
  
  const lowerTranscript = transcript.toLowerCase();
  return explanationKeywords.some(keyword => lowerTranscript.includes(keyword));
}

// Generate explanation style options
function generateStyleOptions(topic) {
  return `I'd love to explain ${topic}! What style would work best for you?

1. 📚 **Formal Academic** - Detailed, structured explanation with proper terminology
2. 📖 **Story Format** - I'll tell it like a story with characters and scenarios  
3. 🎬 **Movie Style** - Dramatic, visual explanations with analogies
4. 💬 **Casual Chat** - Like explaining to a friend over coffee
5. 🎯 **Step-by-Step** - Clear, numbered steps you can follow
6. 🧩 **Analogy Mode** - Using simple comparisons you already know

Just say the number or style name you prefer!`;
}

// Process explanation with chosen style
function processExplanationWithStyle(topic, style, originalTranscript) {
  const stylePrompts = {
    '1': 'formal academic',
    'formal': 'formal academic',
    'academic': 'formal academic',
    '2': 'story format',
    'story': 'story format', 
    'narrative': 'story format',
    '3': 'movie style',
    'movie': 'movie style',
    'cinematic': 'movie style',
    'dramatic': 'movie style',
    '4': 'casual chat',
    'casual': 'casual chat',
    'friendly': 'casual chat',
    'chat': 'casual chat',
    '5': 'step-by-step',
    'steps': 'step-by-step',
    'step': 'step-by-step',
    '6': 'analogy mode',
    'analogy': 'analogy mode',
    'comparison': 'analogy mode'
  };

  const selectedStyle = stylePrompts[style.toLowerCase()] || 'casual chat';
  
  const styleInstructions = {
    'formal academic': 'Provide a formal, academic explanation with proper terminology, structured format, and scholarly depth. Use precise language and comprehensive coverage.',
    'story format': 'Tell this as an engaging story with characters, plot, and narrative flow. Make it memorable and entertaining while being educational.',
    'movie style': 'Explain this dramatically like a movie scene with vivid descriptions, analogies, and cinematic language. Make it exciting and visual.',
    'casual chat': 'Explain this like you\'re talking to a close friend over coffee - relaxed, friendly, using everyday language and relatable examples.',
    'step-by-step': 'Break this down into clear, numbered steps that are easy to follow. Make each step actionable and build logically.',
    'analogy mode': 'Use simple analogies and comparisons to everyday things the student already knows. Make complex concepts relatable.'
  };

  return `${styleInstructions[selectedStyle]}

Topic to explain: ${topic}
Original question: ${originalTranscript}

Provide the explanation in ${selectedStyle} style:`;
}

// Handle single agent voice response
async function handleSingleAgentVoice(ws, data, sessionContext) {
  const { transcript, voiceMode = 'conversational' } = data;
  
  try {
    ws.send(JSON.stringify({
      type: 'processing',
      message: 'Processing your request...'
    }));

    // Check if this is an explanation request
    if (isExplanationRequest(transcript) && !sessionContext.awaitingStyleChoice) {
      // Extract topic from the explanation request
      const topic = transcript.replace(/^(can you |please |could you |)?(explain|tell me about|what is|what are|how does|how do)/i, '').trim();
      
      // Store the original request for later processing
      sessionContext.pendingExplanation = {
        topic: topic,
        originalTranscript: transcript
      };
      sessionContext.awaitingStyleChoice = true;
      
      // Offer style choices
      const styleOptions = generateStyleOptions(topic);
      
      ws.send(JSON.stringify({
        type: 'voice_response',
        response: styleOptions,
        mode: 'style-selection',
        voiceMode: 'detailed' // Always use detailed for style selection
      }));
      
      return;
    }
    
    // Check if user is choosing an explanation style
    if (sessionContext.awaitingStyleChoice && sessionContext.pendingExplanation) {
      const styleChoice = transcript.toLowerCase().trim();
      
      // Generate explanation with chosen style
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_CHAT);
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 400,
        }
      });

      const explanationPrompt = processExplanationWithStyle(
        sessionContext.pendingExplanation.topic,
        styleChoice,
        sessionContext.pendingExplanation.originalTranscript
      );

      const result = await model.generateContent(explanationPrompt);
      const response = await result.response;
      let responseText = response.text();

      // Clean up session state
      sessionContext.awaitingStyleChoice = false;
      sessionContext.pendingExplanation = null;

      // Send styled explanation
      ws.send(JSON.stringify({
        type: 'voice_response',
        response: responseText,
        mode: 'styled-explanation',
        voiceMode: voiceMode
      }));
      
      return;
    }

    // Regular conversation - continue with normal flow
    // Use Gemini for direct response (no message storage)
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_CHAT);
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: voiceMode === 'conversational' ? 150 : 300,
      }
    });

    const conversationalPrompt = voiceMode === 'conversational' ? 
      `You are StudyBuddy, a friendly AI learning companion in LIVE VOICE mode. Respond like you're having a natural conversation with a student.

VOICE CONVERSATION RULES:
- Keep responses SHORT (1-2 sentences max)
- Use casual, conversational language like "Yeah", "Sure thing", "Got it"
- Be enthusiastic and encouraging
- Use contractions (I'll, you're, let's, etc.)
- Add natural fillers occasionally ("Alright", "So", "Well")
- Speak like a helpful friend, not a formal tutor
- If the topic is complex, say "Want me to break that down?" instead of explaining everything

Student says: "${transcript}"

Respond naturally and briefly:` :
      `You are StudyBuddy, an AI learning companion. Provide a detailed but voice-friendly response to the student's question. Keep it conversational but comprehensive.

Student: ${transcript}

Provide a helpful, detailed response suitable for voice delivery:`;

    const result = await model.generateContent(conversationalPrompt);
    const response = await result.response;
    let responseText = response.text();

    // Post-process for voice delivery
    if (voiceMode === 'conversational') {
      responseText = makeResponseConversational(responseText);
    }

    // Send response for voice synthesis
    ws.send(JSON.stringify({
      type: 'voice_response',
      response: responseText,
      mode: 'single-agent',
      voiceMode: voiceMode
    }));

  } catch (error) {
    console.error('Single agent voice error:', error);
    ws.send(JSON.stringify({
      type: 'voice_response',
      response: "Hmm, I hit a snag there. Mind asking again?",
      mode: 'single-agent',
      error: true
    }));
  }
}

// Make responses more conversational
function makeResponseConversational(text) {
  return text
    // Make it more casual
    .replace(/You should/g, "You might wanna")
    .replace(/I recommend/g, "I'd say")
    .replace(/It is important/g, "It's pretty key")
    .replace(/However,/g, "But,")
    .replace(/Therefore,/g, "So,")
    .replace(/Furthermore,/g, "Also,")
    .replace(/Additionally,/g, "Plus,")
    .replace(/Nevertheless,/g, "Still,")
    // Add conversational starters
    .replace(/^Let me/, "Alright, let me")
    .replace(/^I think/, "I think")
    .replace(/^The answer/, "So the answer")
    .replace(/^This/, "This")
    // Limit length for voice
    .split('.').slice(0, 2).join('.') + (text.includes('.') ? '.' : '');
}

// Handle multi-agent voice response
async function handleMultiAgentVoice(ws, data, sessionContext) {
  const { transcript, voiceMode = 'conversational' } = data;
  
  try {
    ws.send(JSON.stringify({
      type: 'processing',
      message: 'Analyzing request and routing to specialized agent...',
      agentStatus: sessionContext.agentSystem.getSystemStatus()
    }));

    // Build context for agents (without storing messages)
    const context = {
      messages: sessionContext.conversationBuffer.slice(-5), // Keep only recent context in memory
      username: sessionContext.username,
      sessionId: sessionContext.sessionId,
      isVoiceMode: true,
      voiceMode: voiceMode,
      maxResponseLength: voiceMode === 'conversational' ? 150 : 300
    };

    // Process through multi-agent system
    const result = await sessionContext.agentSystem.processInput(transcript, context);

    // Update conversation buffer (temporary, not persisted)
    sessionContext.conversationBuffer.push(
      { role: 'user', content: transcript },
      { role: 'assistant', content: result.message }
    );

    // Keep buffer size manageable
    if (sessionContext.conversationBuffer.length > 10) {
      sessionContext.conversationBuffer = sessionContext.conversationBuffer.slice(-10);
    }

    // Process response for voice mode
    let responseText = result.message;
    if (voiceMode === 'conversational') {
      responseText = makeResponseConversational(responseText);
    }
    
    let responseData = {
      type: 'voice_response',
      response: responseText,
      mode: 'multi-agent',
      agentType: result.agent,
      routing: result.routing,
      voiceMode: voiceMode,
      agentStatus: sessionContext.agentSystem.getSystemStatus()
    };

    // Handle different response types with voice-friendly modifications
    if (result.type === 'info_request') {
      responseData.needsMoreInfo = true;
      responseData.suggestedQuestions = result.suggestedQuestions;
      
      // Make response more voice-friendly and shorter
      if (result.suggestedQuestions && result.suggestedQuestions.length > 0) {
        const suggestions = result.suggestedQuestions.slice(0, 2); // Only 2 suggestions for voice
        if (voiceMode === 'conversational') {
          responseText += ` How about: ${suggestions.join(' or ')}?`;
        } else {
          responseText += " Here are some suggestions: " + suggestions.join(", or ");
        }
      }
    } else if (result.type === 'quiz_generated') {
      responseData.quizGenerated = true;
      responseData.quizData = result.data;
      responseText = voiceMode === 'conversational' 
        ? "Sweet! Got a quiz ready for you. Check your screen!"
        : "Great! I've created a quiz for you. You can access it in the StudyBuddy interface.";
    }

    responseData.response = responseText;
    ws.send(JSON.stringify(responseData));

  } catch (error) {
    console.error('Multi-agent voice error:', error);
    const errorResponse = voiceMode === 'conversational'
      ? "Oops, something went wonky. Try asking again?"
      : "I encountered an error while processing your request. Please try again.";
      
    ws.send(JSON.stringify({
      type: 'voice_response',
      response: errorResponse,
      mode: 'multi-agent',
      error: true,
      voiceMode: voiceMode,
      agentStatus: sessionContext.agentSystem.getSystemStatus()
    }));
  }
}

// HTTP handlers for REST endpoints
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'init_websocket') {
      // Initialize WebSocket server
      const server = initWebSocketServer();
      
      return NextResponse.json({
        message: 'Voice WebSocket server initialized',
        port: 8080,
        success: true
      });
    }
    
    return NextResponse.json({
      message: 'StudyBuddy Live Voice API',
      websocketPort: 8080,
      success: true
    });
    
  } catch (error) {
    console.error('Voice API GET error:', error);
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { action, data } = await request.json();
    
    if (action === 'init_websocket') {
      const server = initWebSocketServer();
      
      return NextResponse.json({
        message: 'Voice WebSocket server initialized',
        port: 8080,
        success: true
      });
    }
    
    return NextResponse.json({
      error: 'Unknown action',
      success: false
    }, { status: 400 });
    
  } catch (error) {
    console.error('Voice API POST error:', error);
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}
