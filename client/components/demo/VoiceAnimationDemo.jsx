'use client';

import React, { useState } from 'react';
import ChatInput from '../studybuddy/ChatInput';
import { useVoiceAnimations } from '../../lib/hooks/useVoiceAnimations';

const VoiceAnimationDemo = () => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [multiAgentMode, setMultiAgentMode] = useState(false);
  const [isDark, setIsDark] = useState(true);
  
  const {
    isUserSpeaking,
    isAISpeaking,
    voiceAnimationIntensity,
    demoVoiceAnimations,
    startUserSpeaking,
    stopUserSpeaking,
    startAISpeaking,
    stopAISpeaking,
    initializeAudioAnalysis
  } = useVoiceAnimations();

  const handleSendMessage = (msg) => {
    console.log('Sending message:', msg);
    setMessage('');
    
    // Simulate AI response with speaking animation
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      startAISpeaking();
      
      // Stop AI speaking after 3 seconds
      setTimeout(() => {
        stopAISpeaking();
      }, 3000);
    }, 1000);
  };

  const agentStatus = {
    general: { status: 'active', lastUsed: Date.now() },
    tutor: { status: 'ready', lastUsed: Date.now() - 1000 },
    quiz: { status: 'ready', lastUsed: Date.now() - 2000 }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gray-950' : 'bg-gray-50'
    }`}>
      {/* Demo Controls */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`p-4 rounded-lg shadow-lg border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Voice Animation Demo
          </h3>
          
          <div className="space-y-2">
            <button
              onClick={demoVoiceAnimations}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🎯 Demo Animation Sequence
            </button>
            
            <button
              onClick={startUserSpeaking}
              className="w-full px-3 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              🎤 Start User Speaking
            </button>
            
            <button
              onClick={stopUserSpeaking}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ⏹️ Stop User Speaking
            </button>
            
            <button
              onClick={startAISpeaking}
              className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              🤖 Start AI Speaking
            </button>
            
            <button
              onClick={stopAISpeaking}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ⏹️ Stop AI Speaking
            </button>
            
            <button
              onClick={initializeAudioAnalysis}
              className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🔊 Enable Mic Detection
            </button>
            
            <button
              onClick={() => setIsDark(!isDark)}
              className="w-full px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              {isDark ? '☀️' : '🌙'} Toggle Theme
            </button>
          </div>
          
          {/* Status Indicators */}
          <div className="mt-4 space-y-2">
            <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  isUserSpeaking ? 'bg-cyan-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                <span>User Speaking: {isUserSpeaking ? 'ON' : 'OFF'}</span>
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-3 h-3 rounded-full ${
                  isAISpeaking ? 'bg-purple-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                <span>AI Speaking: {isAISpeaking ? 'ON' : 'OFF'}</span>
              </div>
              
              <div className="mt-2">
                <span>Animation Intensity: {Math.round(voiceAnimationIntensity * 100)}%</span>
                <div className="w-full bg-gray-300 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${voiceAnimationIntensity * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col h-screen">
        <div className={`flex-1 p-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">Enhanced Voice Border Animations</h1>
            <p className="mb-6">
              Experience dynamic, animated borders that respond to voice interactions. 
              The input bar features different gradient animations for user speaking (blue/cyan) 
              and AI speaking (purple/green/pink) modes.
            </p>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Features:</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>🌊 Moving gradient borders with wave animations</li>
                <li>🎨 Different color schemes for user vs AI voice modes</li>
                <li>✨ Dynamic glow effects that respond to voice intensity</li>
                <li>🔄 Smooth transitions between speaking states</li>
                <li>📱 Responsive design that works on all devices</li>
                <li>🎭 Customizable animation speed and intensity</li>
              </ul>
            </div>
            
            <div className="mt-8 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-sm">
                💡 <strong>Tip:</strong> Use the demo controls in the top-right corner to test different voice states and see the animated borders in action!
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced ChatInput with Voice Animations */}
        <ChatInput
          message={message}
          setMessage={setMessage}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          isLoading={isLoading}
          multiAgentMode={multiAgentMode}
          setMultiAgentMode={setMultiAgentMode}
          agentStatus={agentStatus}
          isDark={isDark}
          isMobile={false}
          sidebarOpen={false}
          onSendMessage={handleSendMessage}
          onFileSelect={(file) => setSelectedFile(file)}
          username="demo-user"
          isUserSpeaking={isUserSpeaking}
          isAISpeaking={isAISpeaking}
          voiceAnimationIntensity={voiceAnimationIntensity}
        />
      </div>
    </div>
  );
};

export default VoiceAnimationDemo;
