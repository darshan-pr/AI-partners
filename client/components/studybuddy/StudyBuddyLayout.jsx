'use client';

import React from 'react';
import { ArrowLeft, Brain, ChevronDown } from 'lucide-react';

const StudyBuddyLayout = ({ 
  children, 
  isDark, 
  session, 
  onBackClick,
  particles = [],
  showScrollDown = false,
  onScrollToBottom,
  isMobile = false
}) => {

  return (
    <div className={`h-screen w-full studybuddy-scrollbar transition-colors duration-300 relative overflow-hidden ${
      isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      
      {/* Animated Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map(particle => (
          <div
            key={particle.id}
            className={`absolute rounded-full transition-colors duration-300 ${
              isDark ? 'bg-blue-400/30' : 'bg-blue-500/20'
            }`}
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      {/* Subtle vignette effect */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className={`absolute inset-0 transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-radial from-transparent via-transparent to-gray-950/20' 
            : 'bg-gradient-radial from-transparent via-transparent to-gray-100/20'
        }`}></div>
      </div>
      
      {/* Content with higher z-index */}
      <div className="z-10 h-full flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 backdrop-blur-md transition-colors duration-300 border-b" style={{
          backgroundColor: isDark ? 'rgba(3, 7, 18, 0.8)' : 'rgba(249, 250, 251, 0.8)',
          borderBottomColor: isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.3)'
        }}>
          <div className="mx-auto px-1 sm:px-2 lg:px-3">
            <div className="flex items-center justify-between h-12 sm:h-14">
              <div className="flex items-center">
                <button
                  onClick={onBackClick}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-md transition-colors text-xs sm:text-sm font-medium ${
                      isDark ? 'hover:bg-gray-900 text-gray-300 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <h1 className={`text-sm sm:text-base font-medium truncate text-center px-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {session?.title || 'New Chat'}
                  </h1>
                </button>
              </div>
              
              <div className="flex-1 flex justify-center">
                {/* Empty center space */}
              </div>
              
              <div className="w-12 sm:w-20">
                {/* Future: Add settings or other controls here */}
              </div>
            </div>
          </div>
        </header>

        {/* Main content area - this should take remaining space and be scrollable */}
        <div className="flex-1 min-h-0 relative">
          {children}
          
          {/* Scroll to Bottom Button - Modern AI chat style positioning */}
          {showScrollDown && (
            <div className="absolute bottom-40 right-30 transform -translate-x-1/4 z-50">
              <button
                onClick={onScrollToBottom}
                className={`p-3 rounded-full shadow-xl transition-all duration-200 hover:scale-105 border-2 ${
                  isDark 
                    ? 'bg-gray-800/95 hover:bg-gray-700 text-gray-200 border-gray-600/70 backdrop-blur-sm' 
                    : 'bg-white/95 hover:bg-gray-50 text-gray-700 border-gray-300/70 backdrop-blur-sm'
                }`}
                title="Scroll to latest message"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyBuddyLayout;
