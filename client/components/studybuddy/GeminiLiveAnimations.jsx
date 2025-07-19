'use client';

import React, { useState, useEffect } from 'react';

const GeminiLiveAnimations = ({ 
  isListening, 
  isProcessing, 
  isSpeaking, 
  audioLevel = 0,
  multiAgentMode = false,
  currentAgent = 'general',
  isDark = false 
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    let interval;
    if (isListening || isProcessing || isSpeaking) {
      interval = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 8);
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isListening, isProcessing, isSpeaking]);

  const getAgentColor = (agent) => {
    switch (agent) {
      case 'orchestrator': return { 
        primary: 'rgb(147, 51, 234)', // purple-600
        secondary: 'rgb(124, 58, 237)', // violet-600
        primaryTw: 'purple',
        secondaryTw: 'violet'
      };
      case 'quiz': return { 
        primary: 'rgb(37, 99, 235)', // blue-600
        secondary: 'rgb(99, 102, 241)', // indigo-600
        primaryTw: 'blue',
        secondaryTw: 'indigo'
      };
      case 'general': return { 
        primary: 'rgb(34, 197, 94)', // green-600
        secondary: 'rgb(16, 185, 129)', // emerald-600
        primaryTw: 'green',
        secondaryTw: 'emerald'
      };
      case 'tutor': return { 
        primary: 'rgb(234, 88, 12)', // orange-600
        secondary: 'rgb(245, 158, 11)', // amber-600
        primaryTw: 'orange',
        secondaryTw: 'amber'
      };
      default: return { 
        primary: 'rgb(37, 99, 235)', // blue-600
        secondary: 'rgb(99, 102, 241)', // indigo-600
        primaryTw: 'blue',
        secondaryTw: 'indigo'
      };
    }
  };

  const colors = getAgentColor(currentAgent);

  // Listening Animation - Concentric circles with audio reactive
  const ListeningAnimation = () => (
    <div className="relative w-16 h-16 flex items-center justify-center">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border-2 opacity-60"
          style={{
            width: `${40 + (i * 12) + (audioLevel * 20)}px`,
            height: `${40 + (i * 12) + (audioLevel * 20)}px`,
            borderColor: colors.primary,
            opacity: 0.6 - (i * 0.2),
            animation: `pulse ${1 + (i * 0.3)}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`
          }}
        />
      ))}
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{
          background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`
        }}
      >
        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
      </div>
    </div>
  );

  // Processing Animation - Rotating particles
  const ProcessingAnimation = () => (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <div 
        className="w-8 h-8 rounded-full"
        style={{
          background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`
        }}
      />
      
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: colors.primary,
            transformOrigin: '32px 32px',
            transform: `rotate(${(i * 60) + (animationPhase * 45)}deg) translateX(24px)`,
            opacity: 0.7,
            transition: 'transform 0.15s ease-out'
          }}
        />
      ))}
      
      {multiAgentMode && (
        <div className="absolute -top-1 -right-1">
          <div 
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: colors.secondary }}
          />
        </div>
      )}
    </div>
  );

  // Speaking Animation - Sound waves
  const SpeakingAnimation = () => (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <div 
        className="w-8 h-8 rounded-full"
        style={{
          background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`
        }}
      />
      
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${24 + (i * 8)}px`,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          <div
            className="w-1 rounded-full"
            style={{
              backgroundColor: colors.primary,
              height: `${8 + Math.sin((animationPhase + i) * 0.8) * 12}px`,
              opacity: 0.8 - (i * 0.15),
              transition: 'height 0.15s ease-out'
            }}
          />
        </div>
      ))}
    </div>
  );

  // Idle Animation - Gentle glow
  const IdleAnimation = () => (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <div 
        className={`w-8 h-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 opacity-60`}
        style={{
          boxShadow: isDark 
            ? '0 0 20px rgba(156, 163, 175, 0.3)' 
            : '0 0 20px rgba(107, 114, 128, 0.2)'
        }}
      />
      <div className="absolute w-10 h-10 rounded-full border border-gray-300 opacity-30 animate-ping" />
    </div>
  );

  // Agent Type Indicator for Multi-Agent Mode
  const AgentIndicator = () => {
    if (!multiAgentMode) return null;
    
    return (
      <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded-full text-xs font-medium ${
        isDark 
          ? 'bg-gray-800/80 text-gray-200 border border-gray-700' 
          : 'bg-white/80 text-gray-800 border border-gray-200'
      }`}
      style={{
        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        borderColor: isDark ? colors.primary : colors.secondary
      }}>
        {currentAgent}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Main Animation Container */}
      <div className="relative">
        {isListening && <ListeningAnimation />}
        {isProcessing && <ProcessingAnimation />}
        {isSpeaking && <SpeakingAnimation />}
        {!isListening && !isProcessing && !isSpeaking && <IdleAnimation />}
        
        {/* Status Ring */}
        <div 
          className="absolute inset-0 rounded-full border-2"
          style={{
            borderColor: isListening 
              ? colors.primary
              : isProcessing 
                ? colors.secondary
                : isSpeaking 
                  ? colors.primary
                  : '#d1d5db', // gray-300
            transform: isListening || isProcessing || isSpeaking ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.3s ease'
          }}
        />
      </div>
      
      {/* Agent Indicator */}
      <AgentIndicator />
      
      {/* Status Text */}
      <div className={`mt-3 text-sm font-medium ${
        isDark ? 'text-gray-300' : 'text-gray-600'
      }`}>
        {isListening && 'Listening...'}
        {isProcessing && (multiAgentMode ? 'Analyzing & Routing...' : 'Processing...')}
        {isSpeaking && 'Speaking...'}
        {!isListening && !isProcessing && !isSpeaking && 'Ready'}
      </div>
      
      {/* Audio Level Meter for Listening */}
      {isListening && (
        <div className={`mt-2 w-24 h-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
          <div 
            className="h-full rounded-full transition-all duration-100"
            style={{ 
              width: `${Math.min(audioLevel * 100, 100)}%`,
              background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`
            }}
          />
        </div>
      )}
    </div>
  );
};

export default GeminiLiveAnimations;
