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
      conversationBuffer: []
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
      if (!sessionContext.multiAgentMode) {
        // Single agent mode - direct response
        await handleSingleAgentVoice(ws, data, sessionContext);
      } else {
        // Multi-agent mode - route through orchestrator
        await handleMultiAgentVoice(ws, data, sessionContext);
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

// Handle single agent voice response
async function handleSingleAgentVoice(ws, data, sessionContext) {
  const { transcript } = data;
  
  try {
    ws.send(JSON.stringify({
      type: 'processing',
      message: 'Processing your request...'
    }));

    // Use Gemini for direct response (no message storage)
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_CHAT);
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    const prompt = `You are StudyBuddy, an AI learning companion in voice mode. Provide a concise, conversational response to the student's question. Keep responses brief and engaging, suitable for voice interaction.

Student: ${transcript}

Respond naturally and conversationally, as if speaking directly to the student.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Send response for voice synthesis
    ws.send(JSON.stringify({
      type: 'voice_response',
      response: responseText,
      mode: 'single-agent'
    }));

  } catch (error) {
    console.error('Single agent voice error:', error);
    ws.send(JSON.stringify({
      type: 'voice_response',
      response: "I'm sorry, I encountered an error. Please try again.",
      mode: 'single-agent',
      error: true
    }));
  }
}

// Handle multi-agent voice response
async function handleMultiAgentVoice(ws, data, sessionContext) {
  const { transcript } = data;
  
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
      isVoiceMode: true
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

    // Send response based on result type
    let responseText = result.message;
    let responseData = {
      type: 'voice_response',
      response: responseText,
      mode: 'multi-agent',
      agentType: result.agent,
      routing: result.routing,
      agentStatus: sessionContext.agentSystem.getSystemStatus()
    };

    // Handle different response types
    if (result.type === 'info_request') {
      responseData.needsMoreInfo = true;
      responseData.suggestedQuestions = result.suggestedQuestions;
      
      // Make response more voice-friendly
      if (result.suggestedQuestions && result.suggestedQuestions.length > 0) {
        responseText += " Here are some suggestions: " + 
          result.suggestedQuestions.slice(0, 3).join(", or ");
      }
    } else if (result.type === 'quiz_generated') {
      responseData.quizGenerated = true;
      responseData.quizData = result.data;
      responseText = "Great! I've created a quiz for you. You can access it in the StudyBuddy interface.";
    }

    responseData.response = responseText;
    ws.send(JSON.stringify(responseData));

  } catch (error) {
    console.error('Multi-agent voice error:', error);
    ws.send(JSON.stringify({
      type: 'voice_response',
      response: "I encountered an error while processing your request. Please try again.",
      mode: 'multi-agent',
      error: true,
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
