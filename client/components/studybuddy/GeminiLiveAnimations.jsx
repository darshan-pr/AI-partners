'use client';

import React, { useState, useEffect } from 'react';

const GeminiLiveAnimations = ({ 
  isListening, 
  isProcessing, 
  isSpeaking, 
  audioLevel = 0,
  multiAgentMode = false,
  currentAgent = 'general',
  isDark = false,
  size = 128 // Default size in pixels
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
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Outer pulsing rings */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border-2 opacity-40"
          style={{
            width: `${60 + (i * 20) + (audioLevel * 30)}px`,
            height: `${60 + (i * 20) + (audioLevel * 30)}px`,
            borderColor: colors.primary,
            opacity: 0.8 - (i * 0.15),
            animation: `pulse ${1.5 + (i * 0.4)}s ease-in-out infinite`,
            animationDelay: `${i * 0.15}s`
          }}
        />
      ))}
      
      {/* Main orb */}
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center relative z-10"
        style={{
          background: `radial-gradient(circle, ${colors.primary}, ${colors.secondary})`,
          boxShadow: `0 0 30px ${colors.primary}40`,
          transform: `scale(${1 + audioLevel * 0.3})`
        }}
      >
        {/* Inner pulse */}
        <div 
          className="w-8 h-8 bg-white/80 rounded-full"
          style={{
            transform: `scale(${0.8 + audioLevel * 0.4})`,
            opacity: 0.9
          }}
        />
      </div>
      
      {/* Audio reactive particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            backgroundColor: colors.secondary,
            transformOrigin: '64px 64px',
            transform: `rotate(${i * 45}deg) translateX(${40 + audioLevel * 20}px)`,
            opacity: 0.6 + audioLevel * 0.4,
            animation: `spin 3s linear infinite`
          }}
        />
      ))}
    </div>
  );

  // Processing Animation - Rotating particles
  const ProcessingAnimation = () => (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Central orb */}
      <div 
        className="w-16 h-16 rounded-full relative z-10"
        style={{
          background: `radial-gradient(circle, ${colors.primary}, ${colors.secondary})`,
          boxShadow: `0 0 25px ${colors.primary}30`
        }}
      >
        <div className="w-full h-full rounded-full border-2 border-white/20 animate-spin" 
             style={{ animationDuration: '2s' }} />
      </div>
      
      {/* Orbiting particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: i % 2 === 0 ? colors.primary : colors.secondary,
            transformOrigin: '64px 64px',
            transform: `rotate(${(i * 45) + (animationPhase * 30)}deg) translateX(50px)`,
            opacity: 0.8,
            transition: 'transform 0.1s ease-out',
            boxShadow: `0 0 10px ${i % 2 === 0 ? colors.primary : colors.secondary}50`
          }}
        />
      ))}
      
      {/* Multi-agent indicator */}
      {multiAgentMode && (
        <div className="absolute -top-2 -right-2 z-20">
          <div 
            className="w-6 h-6 rounded-full animate-pulse flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: colors.secondary }}
          >
            AI
          </div>
        </div>
      )}
    </div>
  );

  // Speaking Animation - Sound waves
  const SpeakingAnimation = () => (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Central orb */}
      <div 
        className="w-16 h-16 rounded-full relative z-10"
        style={{
          background: `radial-gradient(circle, ${colors.primary}, ${colors.secondary})`,
          boxShadow: `0 0 30px ${colors.primary}40`
        }}
      >
        {/* Speaking indicator */}
        <div className="w-full h-full rounded-full flex items-center justify-center">
          <div className="w-6 h-6 bg-white/90 rounded-full animate-pulse" />
        </div>
      </div>
      
      {/* Sound wave visualization */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute flex items-center justify-center"
          style={{
            left: `${96 + (i * 12)}px`,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          <div
            className="bg-white/70 rounded-full"
            style={{
              width: '3px',
              height: `${10 + Math.sin((animationPhase + i) * 0.5) * 20}px`,
              opacity: 0.9 - (i * 0.12),
              transition: 'height 0.1s ease-out',
              backgroundColor: colors.primary
            }}
          />
        </div>
      ))}
      
      {/* Mirrored sound waves on the left */}
      {[...Array(6)].map((_, i) => (
        <div
          key={`left-${i}`}
          className="absolute flex items-center justify-center"
          style={{
            left: `${32 - (i * 12)}px`,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          <div
            className="bg-white/70 rounded-full"
            style={{
              width: '3px',
              height: `${10 + Math.sin((animationPhase + i + 3) * 0.5) * 20}px`,
              opacity: 0.9 - (i * 0.12),
              transition: 'height 0.1s ease-out',
              backgroundColor: colors.secondary
            }}
          />
        </div>
      ))}
    </div>
  );

  // Idle Animation - Gentle glow
  const IdleAnimation = () => (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <div 
        className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 opacity-70"
        style={{
          boxShadow: isDark 
            ? '0 0 30px rgba(156, 163, 175, 0.2)' 
            : '0 0 30px rgba(107, 114, 128, 0.15)'
        }}
      />
      <div className="absolute w-20 h-20 rounded-full border border-gray-300/30 opacity-40 animate-ping" 
           style={{ animationDuration: '3s' }} />
      <div className="absolute w-24 h-24 rounded-full border border-gray-300/20 opacity-30 animate-ping" 
           style={{ animationDuration: '4s', animationDelay: '1s' }} />
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
