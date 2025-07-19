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
  size = 128 // Size in pixels
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);

  // Calculate scale factor from default 128px
  const scale = size / 128;
  const center = size / 2;

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
        primary: 'rgb(147, 51, 234)', 
        secondary: 'rgb(124, 58, 237)'
      };
      case 'quiz': return { 
        primary: 'rgb(37, 99, 235)', 
        secondary: 'rgb(99, 102, 241)'
      };
      case 'general': return { 
        primary: 'rgb(34, 197, 94)', 
        secondary: 'rgb(16, 185, 129)'
      };
      case 'tutor': return { 
        primary: 'rgb(234, 88, 12)', 
        secondary: 'rgb(245, 158, 11)'
      };
      default: return { 
        primary: 'rgb(99, 102, 241)', 
        secondary: 'rgb(139, 92, 246)'
      };
    }
  };

  const colors = getAgentColor(currentAgent);

  // Idle Animation - Subtle pulse
  const IdleAnimation = () => (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div 
        className="rounded-full transition-all duration-1000"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          background: `radial-gradient(circle, ${colors.primary}20, ${colors.secondary}10)`,
          border: `2px solid ${isDark ? '#374151' : '#d1d5db'}`,
          animation: 'pulse 2s ease-in-out infinite'
        }}
      />
    </div>
  );

  // Listening Animation - Concentric circles with particles
  const ListeningAnimation = () => (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Concentric circles */}
      {[0.3, 0.5, 0.7].map((sizeRatio, index) => (
        <div
          key={index}
          className="absolute rounded-full border-2"
          style={{
            width: size * sizeRatio,
            height: size * sizeRatio,
            borderColor: colors.primary,
            opacity: 0.4 - index * 0.1,
            animation: `ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite`,
            animationDelay: `${index * 0.3}s`
          }}
        />
      ))}
      
      {/* Central orb */}
      <div 
        className="rounded-full relative z-10"
        style={{
          width: size * 0.4,
          height: size * 0.4,
          background: `radial-gradient(circle, ${colors.primary}, ${colors.secondary})`,
          boxShadow: `0 0 ${size * 0.2}px ${colors.primary}50`
        }}
      />
      
      {/* Audio reactive particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute rounded-full"
          style={{
            width: size * 0.02,
            height: size * 0.02,
            backgroundColor: colors.secondary,
            transformOrigin: `${center}px ${center}px`,
            transform: `rotate(${i * 45}deg) translateX(${center * 0.6 + audioLevel * center * 0.3}px)`,
            opacity: 0.6 + audioLevel * 0.4,
            animation: `spin 3s linear infinite`
          }}
        />
      ))}
    </div>
  );

  // Processing Animation - Rotating particles
  const ProcessingAnimation = () => (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Central orb */}
      <div 
        className="rounded-full relative z-10"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          background: `radial-gradient(circle, ${colors.primary}, ${colors.secondary})`,
          boxShadow: `0 0 ${size * 0.2}px ${colors.primary}30`
        }}
      >
        <div 
          className="w-full h-full rounded-full border-2 border-white/20" 
          style={{ 
            animation: 'spin 2s linear infinite'
          }} 
        />
      </div>
      
      {/* Orbiting particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: size * 0.09,
            height: size * 0.09,
            backgroundColor: i % 2 === 0 ? colors.primary : colors.secondary,
            transformOrigin: `${center}px ${center}px`,
            transform: `rotate(${(i * 45) + (animationPhase * 30)}deg) translateX(${center * 0.8}px)`,
            opacity: 0.8,
            transition: 'transform 0.1s ease-out',
            boxShadow: `0 0 ${size * 0.08}px ${i % 2 === 0 ? colors.primary : colors.secondary}50`
          }}
        />
      ))}
    </div>
  );

  // Speaking Animation - Bilateral sound waves
  const SpeakingAnimation = () => (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Central orb */}
      <div 
        className="rounded-full relative z-10"
        style={{
          width: size * 0.4,
          height: size * 0.4,
          background: `radial-gradient(circle, ${colors.primary}, ${colors.secondary})`,
          boxShadow: `0 0 ${size * 0.15}px ${colors.primary}40`
        }}
      />
      
      {/* Sound wave bars */}
      {[-3, -2, -1, 1, 2, 3].map((position, index) => (
        <div
          key={index}
          className="absolute rounded-full"
          style={{
            width: size * 0.03,
            height: size * (0.2 + Math.sin(animationPhase + index) * 0.15),
            backgroundColor: colors.secondary,
            left: center + position * size * 0.08,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.7,
            transition: 'height 0.1s ease-out'
          }}
        />
      ))}
      
      {/* Bilateral wave effect */}
      {[0, 1].map((side) => (
        <div
          key={side}
          className="absolute rounded-full border-2"
          style={{
            width: size * 0.6,
            height: size * 0.6,
            borderColor: colors.primary,
            opacity: 0.3,
            transform: `scaleX(${side === 0 ? -1 : 1})`,
            animation: `ping 0.8s ease-out infinite`,
            animationDelay: `${side * 0.1}s`
          }}
        />
      ))}
    </div>
  );

  const AgentIndicator = () => {
    if (!multiAgentMode) return null;
    
    return (
      <div 
        className={`absolute flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium ${
          isDark 
            ? 'bg-gray-800/80 text-gray-200 border border-gray-700' 
            : 'bg-white/80 text-gray-800 border border-gray-200'
        }`}
        style={{
          top: size + 8,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          borderColor: isDark ? colors.primary : colors.secondary,
          fontSize: Math.max(10, size * 0.08)
        }}
      >
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
          className="absolute inset-0 rounded-full border-2 pointer-events-none"
          style={{
            width: size,
            height: size,
            borderColor: isListening 
              ? colors.primary
              : isProcessing 
                ? colors.secondary
                : isSpeaking 
                  ? colors.primary
                  : '#d1d5db',
            transform: isListening || isProcessing || isSpeaking ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.3s ease'
          }}
        />
      </div>
      
      {/* Agent Indicator */}
      <AgentIndicator />
      
      {/* Status Text */}
      <div 
        className={`text-center font-medium ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}
        style={{ 
          marginTop: multiAgentMode ? size * 0.3 : size * 0.15,
          fontSize: Math.max(12, size * 0.1)
        }}
      >
        {isListening && 'Listening...'}
        {isProcessing && (multiAgentMode ? 'Analyzing & Routing...' : 'Processing...')}
        {isSpeaking && 'Speaking...'}
        {!isListening && !isProcessing && !isSpeaking && 'Ready'}
      </div>
      
      {/* Audio Level Meter for Listening */}
      {isListening && (
        <div 
          className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}
          style={{
            marginTop: 8,
            width: size * 0.6,
            height: Math.max(2, size * 0.02)
          }}
        >
          <div 
            className="h-full rounded-full transition-all duration-100"
            style={{ 
              width: `${Math.min(audioLevel * 100, 100)}%`,
              background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`
            }}
          />
        </div>
      )}
      
      <style jsx>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default GeminiLiveAnimations;
