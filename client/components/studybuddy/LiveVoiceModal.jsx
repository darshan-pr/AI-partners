'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Minimize2, 
  Maximize2,
  Settings,
  Volume2,
  VolumeX,
  Mic,
  MicOff
} from 'lucide-react';
import GeminiLiveAnimations from './GeminiLiveAnimations';
import LiveVoiceInterface from './LiveVoiceInterface';

const LiveVoiceModal = ({ 
  isOpen, 
  onClose, 
  multiAgentMode, 
  agentStatus, 
  isDark, 
  username 
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentAgent, setCurrentAgent] = useState('general');
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [volume, setVolume] = useState(1);
  const [micEnabled, setMicEnabled] = useState(true);

  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = isFullscreen ? 'hidden' : 'auto';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, isFullscreen]);

  const handleKeyPress = (e) => {
    if (e.key === 'Escape' && !isFullscreen) {
      onClose();
    } else if (e.key === 'F11') {
      e.preventDefault();
      setIsFullscreen(!isFullscreen);
    } else if (e.key === ' ' && e.target === document.body) {
      e.preventDefault();
      // Toggle listening with spacebar
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isOpen, isFullscreen]);

  if (!isOpen) return null;

  const modalClasses = isFullscreen
    ? 'fixed inset-0 z-50'
    : isMinimized
      ? 'fixed bottom-4 right-4 w-80 h-20 z-50'
      : 'fixed inset-0 z-50 flex items-center justify-center p-4';

  const contentClasses = isFullscreen
    ? 'w-full h-full'
    : isMinimized
      ? 'w-full h-full'
      : 'w-full max-w-2xl h-[80vh] max-h-[600px]';

  return (
    <div className={modalClasses}>
      {/* Backdrop */}
      {!isMinimized && !isFullscreen && (
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      {/* Modal Content */}
      <div 
        ref={modalRef}
        className={`relative ${contentClasses} ${
          isDark 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-white border-gray-200'
        } border rounded-2xl shadow-2xl overflow-hidden ${
          isMinimized ? 'shadow-lg' : ''
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        } ${isMinimized ? 'p-2' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 ${isMinimized ? 'text-sm' : ''}`}>
              <div className={`w-3 h-3 rounded-full ${
                isVoiceConnected 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-red-500'
              }`} />
              <span className={`font-medium ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {isMinimized ? 'Voice' : 'Live Voice Chat'}
              </span>
              {multiAgentMode && !isMinimized && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isDark 
                    ? 'bg-blue-900/30 text-blue-300' 
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  Multi-Agent
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isMinimized && (
              <>
                {/* Volume Control */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVolume(volume > 0 ? 0 : 1)}
                    className={`p-1 rounded ${
                      isDark 
                        ? 'hover:bg-gray-700 text-gray-400' 
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {volume > 0 ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-16"
                  />
                </div>

                {/* Mic Toggle */}
                <button
                  onClick={() => setMicEnabled(!micEnabled)}
                  className={`p-1 rounded ${
                    micEnabled
                      ? isDark ? 'text-green-400' : 'text-green-600'
                      : isDark ? 'text-red-400' : 'text-red-600'
                  } ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  {micEnabled ? (
                    <Mic className="w-4 h-4" />
                  ) : (
                    <MicOff className="w-4 h-4" />
                  )}
                </button>

                {/* Fullscreen Toggle */}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className={`p-1 rounded ${
                    isDark 
                      ? 'hover:bg-gray-700 text-gray-400' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </>
            )}
            
            {/* Minimize/Restore */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className={`p-1 rounded ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            
            {/* Close */}
            <button
              onClick={onClose}
              className={`p-1 rounded ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            {/* Main Animation */}
            <div className="mb-8">
              <GeminiLiveAnimations
                isListening={isListening}
                isProcessing={isProcessing}
                isSpeaking={isSpeaking}
                audioLevel={audioLevel}
                multiAgentMode={multiAgentMode}
                currentAgent={currentAgent}
                isDark={isDark}
              />
            </div>

            {/* Status Information */}
            <div className="text-center mb-6">
              <h3 className={`text-lg font-semibold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {isListening ? 'I\'m listening...' :
                 isProcessing ? (multiAgentMode ? 'Routing to best agent...' : 'Processing...') :
                 isSpeaking ? 'Speaking...' :
                 'Ready to chat'}
              </h3>
              
              {multiAgentMode && currentAgent && (
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Current Agent: <span className="capitalize font-medium">{currentAgent}</span>
                </p>
              )}
            </div>

            {/* Voice Interface Controls */}
            <div className="flex justify-center">
              <LiveVoiceInterface
                multiAgentMode={multiAgentMode}
                agentStatus={agentStatus}
                isDark={isDark}
                username={username}
                onConnectionChange={setIsVoiceConnected}
              />
            </div>

            {/* Instructions */}
            <div className={`mt-8 text-center text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <p>Click the microphone to start talking</p>
              {multiAgentMode && (
                <p className="mt-1">Multi-agent mode will route your questions to specialized AI agents</p>
              )}
              <p className="mt-2 text-xs">Press Esc to close • F11 for fullscreen</p>
            </div>
          </div>
        )}

        {/* Minimized View */}
        {isMinimized && (
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8">
                <GeminiLiveAnimations
                  isListening={isListening}
                  isProcessing={isProcessing}
                  isSpeaking={isSpeaking}
                  audioLevel={audioLevel}
                  multiAgentMode={false}
                  currentAgent={currentAgent}
                  isDark={isDark}
                />
              </div>
              <span className={`text-sm font-medium ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {isListening ? 'Listening' :
                 isProcessing ? 'Processing' :
                 isSpeaking ? 'Speaking' :
                 'Ready'}
              </span>
            </div>
            
            <LiveVoiceInterface
              multiAgentMode={multiAgentMode}
              agentStatus={agentStatus}
              isDark={isDark}
              username={username}
              onConnectionChange={setIsVoiceConnected}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveVoiceModal;
