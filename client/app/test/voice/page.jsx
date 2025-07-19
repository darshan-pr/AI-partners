'use client';

import React, { useState } from 'react';
import LiveVoiceModal from '../../../components/studybuddy/LiveVoiceModal';

export default function VoiceTestPage() {
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [multiAgentMode, setMultiAgentMode] = useState(true);
  const [isDark, setIsDark] = useState(false);

  const mockAgentStatus = {
    currentAgent: 'orchestrator',
    agentStates: {
      orchestrator: 'listening',
      quiz: 'idle',
      general: 'idle',
      tutor: 'idle'
    },
    conversationLog: []
  };

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">StudyBuddy Live Voice Test</h1>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={multiAgentMode}
                onChange={(e) => setMultiAgentMode(e.target.checked)}
                className="rounded"
              />
              Multi-Agent Mode
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isDark}
                onChange={(e) => setIsDark(e.target.checked)}
                className="rounded"
              />
              Dark Theme
            </label>
          </div>
          
          <button
            onClick={() => setShowVoiceModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open Live Voice Chat
          </button>
          
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border`}>
            <h2 className="text-lg font-semibold mb-2">Test Instructions:</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Open Live Voice Chat" to launch the voice interface</li>
              <li>Grant microphone permissions when prompted</li>
              <li>Click the microphone button to start voice interaction</li>
              <li>Try saying: "Create a quiz about photosynthesis" (Quiz Agent)</li>
              <li>Try saying: "Explain quantum physics" (General Agent)</li>
              <li>Try saying: "How did I perform on my recent quizzes?" (Tutor Agent)</li>
              <li>Observe the agent routing and visual feedback</li>
            </ol>
          </div>
          
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border`}>
            <h2 className="text-lg font-semibold mb-2">Features to Test:</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>WebSocket connection status</li>
              <li>Speech recognition accuracy</li>
              <li>Text-to-speech output</li>
              <li>Multi-agent routing visualization</li>
              <li>Audio level visualization</li>
              <li>Fullscreen and minimize modes</li>
              <li>Volume and microphone controls</li>
            </ul>
          </div>
        </div>
        
        <LiveVoiceModal
          isOpen={showVoiceModal}
          onClose={() => setShowVoiceModal(false)}
          multiAgentMode={multiAgentMode}
          agentStatus={mockAgentStatus}
          isDark={isDark}
          username="test-user"
        />
      </div>
    </div>
  );
}
