'use client';

import React from 'react';
import { Brain } from 'lucide-react';
import MessageItem from './MessageItem';

const LoadingMessage = ({ isDark }) => (
  <div className="w-full py-3 sm:py-4">
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
      <div className="flex justify-start">
        <div className="flex gap-2 sm:gap-3 max-w-[95%] lg:max-w-[90%]">
          <div className="flex-shrink-0 pt-1">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs sm:text-sm font-medium shadow-sm">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className={`studybuddy-message-ai rounded-2xl rounded-tl-md px-3 sm:px-4 py-2 sm:py-3 ${
              isDark ? 'bg-gray-800/90 border border-gray-700/50' : 'bg-gray-50 border border-gray-200/50'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  StudyBuddy is typing
                </span>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-gray-400' : 'bg-gray-500'} animate-bounce`} style={{animationDelay: '0s'}}></div>
                  <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-gray-400' : 'bg-gray-500'} animate-bounce`} style={{animationDelay: '0.2s'}}></div>
                  <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-gray-400' : 'bg-gray-500'} animate-bounce`} style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const WelcomeScreen = ({ isDark, onSetMessage }) => (
  <div className="flex items-center justify-center h-full pt-8 sm:pt-16">
    <div className="text-center max-w-lg mx-auto px-3 sm:px-4 lg:px-6">
      <div className="mb-6 sm:mb-8">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-500 flex items-center justify-center mx-auto mb-4 sm:mb-5 text-white text-lg sm:text-xl font-bold shadow-lg">
          <Brain className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        
        <h2 className={`text-lg sm:text-xl lg:text-2xl font-medium mb-2 sm:mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          How can I help you today?
        </h2>
        <p className={`text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Ask me anything about your studies, homework, or learning goals.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-lg mx-auto">
        {[
          { title: "Explain concepts clearly", prompt: "Explain quantum physics in simple terms" },
          { title: "Solve problems step-by-step", prompt: "Help me solve this calculus problem: find the derivative of f(x) = x^3 * ln(x)" },
          { title: "Create structured plans", prompt: "Create a detailed study plan for my final exams in math and physics" },
          { title: "Improve your writing", prompt: "Help me write a persuasive essay on the importance of renewable energy" },
        ].map(item => (
          <button 
            key={item.title}
            className={`p-2.5 sm:p-3 rounded-lg border text-left transition-all duration-200 ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-gray-600' 
                : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 shadow-sm'
            }`} 
            onClick={() => onSetMessage(item.prompt)}
          >
            <div className={`font-medium text-xs sm:text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {item.title}
            </div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
              &ldquo;{item.prompt.substring(0,45)}...&rdquo;
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

const MessagesContainer = ({
  messagesContainerRef,
  messagesEndRef,
  stableMessages,
  isLoading,
  isDark,
  isMobile,
  sidebarOpen,
  multiAgentMode,
  onCopyMessage,
  onRegenerateResponse,
  onEditMessage,
  onQuickResponse,
  onSetMessage,
  setSidebarOpen
}) => {
  return (
    <div className="studybuddy-flex-scroll h-full ">
      <div 
        ref={messagesContainerRef}
        className={`studybuddy-chat-container studybuddy-scrollbar studybuddy-prevent-overscroll flex-1 ${isDark ? 'bg-gray-950' : 'bg-gray-50'} relative`}
        style={{ 
          height: '100%',
          maxHeight: '100%',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >

        
        <div className="pb-32 sm:pb-40 studybuddy-message-wrapper ">
          {stableMessages && stableMessages.length > 0 ? (
            <>
              {stableMessages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  isUser={msg.role === 'user'}
                  onCopy={onCopyMessage}
                  onRegenerate={onRegenerateResponse}
                  onEdit={onEditMessage}
                  onQuickResponse={onQuickResponse}
                  isDark={isDark}
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                  isEditingDisabled={isLoading}
                  multiAgentMode={multiAgentMode}
                />
              ))}
              {isLoading && <LoadingMessage isDark={isDark} />}
            </>
          ) : (
            <WelcomeScreen isDark={isDark} onSetMessage={onSetMessage} />
          )}
        </div>
        <div ref={messagesEndRef} style={{height: '1px'}} />
      </div>
    </div>
  );
};

export default MessagesContainer;
