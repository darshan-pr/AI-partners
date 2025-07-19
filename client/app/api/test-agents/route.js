import { NextResponse } from 'next/server';
import { AgentSystem } from '../../../lib/agents/AgentSystem';

// Test endpoint for the AgentSystemDemo
export async function POST(request) {
  try {
    const { message, mode } = await request.json();
    
    if (!message) {
      return NextResponse.json({ 
        error: 'Message is required',
        success: false 
      }, { status: 400 });
    }

    if (mode === 'multi-agent') {
      // Use the agent system for testing
      const agentSystem = new AgentSystem();
      
      const context = {
        messages: [],
        username: 'test-user', // Use a test username
        sessionId: 'test-session'
      };

      const result = await agentSystem.processInput(message, context);
      
      return NextResponse.json({
        success: true,
        agentType: result.agent,
        message: result.message,
        routing: result.routing,
        systemStatus: agentSystem.getSystemStatus()
      });
    } else {
      // Single agent mode fallback
      return NextResponse.json({
        success: true,
        agentType: 'general',
        message: `Test response for: "${message}"`
      });
    }
    
  } catch (error) {
    console.error('Test API Error:', error);
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}
