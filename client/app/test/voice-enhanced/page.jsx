'use client';

import React, { useState } from 'react';
import ChatInput from '../../../components/studybuddy/ChatInput';
import { useVoiceStates } from '../../../lib/hooks/useVoiceStates';

const VoiceTestPage = () => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [multiAgentMode, setMultiAgentMode] = useState(false);
  const [isDark, setIsDark] = useState(true);
  
  // Use the voice states hook
  const {
    isUserSpeaking,
    isAISpeaking,
    voiceAnimationIntensity,
    isVoiceActive,
    startUserSpeaking,
    stopUserSpeaking,
    startAISpeaking,
    stopAISpeaking,
    stopAllSpeaking
  } = useVoiceStates();

  const handleSendMessage = (msg) => {
    console.log('Sending message:', msg);
    setMessage('');
  };

  const simulateUserSpeaking = () => {
    startUserSpeaking();
    setTimeout(() => {
      stopUserSpeaking();
    }, 3000);
  };

  const simulateAISpeaking = () => {
    startAISpeaking();
    setTimeout(() => {
      stopAISpeaking();
    }, 5000);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50">
        <h1 className="text-2xl font-bold mb-4">StudyBuddy Enhanced Voice Interface Demo</h1>
        
        {/* Controls */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setIsDark(!isDark)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Toggle {isDark ? 'Light' : 'Dark'} Mode
          </button>
          
          <button
            onClick={simulateUserSpeaking}
            disabled={isVoiceActive}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Simulate User Speaking
          </button>
          
          <button
            onClick={simulateAISpeaking}
            disabled={isVoiceActive}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Simulate AI Speaking
          </button>
          
          <button
            onClick={stopAllSpeaking}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Stop All
          </button>
        </div>

        {/* Status */}
        <div className="flex gap-4 text-sm">
          <div className={`px-3 py-1 rounded-full ${
            isUserSpeaking ? 'bg-green-900/30 text-green-300' : 'bg-gray-700/30 text-gray-500'
          }`}>
            User Speaking: {isUserSpeaking ? 'Yes' : 'No'}
          </div>
          <div className={`px-3 py-1 rounded-full ${
            isAISpeaking ? 'bg-purple-900/30 text-purple-300' : 'bg-gray-700/30 text-gray-500'
          }`}>
            AI Speaking: {isAISpeaking ? 'Yes' : 'No'}
          </div>
          <div className={`px-3 py-1 rounded-full ${
            isVoiceActive ? 'bg-blue-900/30 text-blue-300' : 'bg-gray-700/30 text-gray-500'
          }`}>
            Animation Intensity: {voiceAnimationIntensity.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Enhanced Voice Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-4 rounded-lg border ${
                isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'
              }`}>
                <h3 className="font-semibold mb-2">🎯 Interactive Voice Border</h3>
                <p className="text-sm opacity-80">
                  The input bar now shows animated gradient borders that respond differently to user vs AI speech.
                </p>
              </div>
              
              <div className={`p-4 rounded-lg border ${
                isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'
              }`}>
                <h3 className="font-semibold mb-2">⚡ Voice Interruption</h3>
                <p className="text-sm opacity-80">
                  Users can interrupt AI responses by speaking, creating natural conversation flow.
                </p>
              </div>
              
              <div className={`p-4 rounded-lg border ${
                isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'
              }`}>
                <h3 className="font-semibold mb-2">💬 Conversational Mode</h3>
                <p className="text-sm opacity-80">
                  AI responses are shorter, more casual, and use human-like language and slang.
                </p>
              </div>
              
              <div className={`p-4 rounded-lg border ${
                isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'
              }`}>
                <h3 className="font-semibold mb-2">🔄 Real-time Animation</h3>
                <p className="text-sm opacity-80">
                  Dynamic border animations that change intensity based on voice activity levels.
                </p>
              </div>
            </div>
          </div>

          {/* Demo Instructions */}
          <div className={`p-4 rounded-lg border ${
            isDark ? 'border-blue-700/50 bg-blue-900/20' : 'border-blue-200 bg-blue-50'
          } mb-8`}>
            <h3 className="font-semibold mb-2">📋 How to Test</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Use the buttons above to simulate voice states</li>
              <li>Watch the input bar border animate differently for user vs AI speech</li>
              <li>Try the live voice interface by clicking the radio button</li>
              <li>Test interruption by speaking while AI is responding</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Enhanced ChatInput with Voice Animation */}
      <ChatInput
        message={message}
        setMessage={setMessage}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        isLoading={isLoading}
        multiAgentMode={multiAgentMode}
        setMultiAgentMode={setMultiAgentMode}
        agentStatus={null}
        isDark={isDark}
        isMobile={false}
        sidebarOpen={false}
        onSendMessage={handleSendMessage}
        onFileSelect={setSelectedFile}
        username="demo-user"
        isUserSpeaking={isUserSpeaking}
        isAISpeaking={isAISpeaking}
        voiceAnimationIntensity={voiceAnimationIntensity}
      />
    </div>
  );
};

export default VoiceTestPage;
