'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Info, 
  AlertTriangle, 
  Zap, 
  Users,
  X,
  FileText,
  Image,
  Radio
} from 'lucide-react';
import AgentStatusHeader from '../AgentStatusHeader';
import LiveVoiceInterface from './LiveVoiceInterface';
import LiveVoiceModal from './LiveVoiceModal';

const ChatInput = ({
  message,
  setMessage,
  selectedFile,
  setSelectedFile,
  isLoading,
  multiAgentMode,
  setMultiAgentMode,
  agentStatus,
  isDark,
  isMobile,
  sidebarOpen,
  onSendMessage,
  onFileSelect,
  username // Add username prop for voice interface
}) => {
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  const handleSendClick = () => {
    if ((!message.trim() && !selectedFile) || isLoading) return;
    onSendMessage(message);
  };

  const handleFileSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect && onFileSelect(file);
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 backdrop-blur-sm border-t transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent border-gray-800/50' 
        : 'bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent border-gray-200/50'
    } ${
      // On mobile, when sidebar is open, it's a full-screen overlay, so input should be behind it
      isMobile && sidebarOpen ? 'z-30' : 'z-40'
    }`}>
      {/* Hide input on mobile when sidebar is open to prevent overlap */}
      <div 
        className={`transition-all duration-300 ease-out ${
          isMobile && sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{
          marginLeft: isMobile 
            ? '60px' 
            : sidebarOpen 
              ? '320px' 
              : '80px',
          paddingRight: '0'
        }}
      >
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          
          {/* Multi-Agent Control Panel */}
          <div className="mb-3 sm:mb-4">
            <div className={`flex items-center justify-between p-2 sm:p-1 rounded-xl transition-all ${
              multiAgentMode 
                ? isDark 
                  ? 'bg-blue-900/20 border border-blue-800/30' 
                  : 'bg-blue-50/80 border border-blue-200/50'
                : isDark
                  ? 'bg-gray-900/50 border border-gray-800/50'
                  : 'bg-gray-100/80 border border-gray-200/50'
            }`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setMultiAgentMode(!multiAgentMode)}
                  className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-gray-50'
                  } ${
                    multiAgentMode 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                      : isDark ? 'bg-gray-700' : 'bg-gray-300'
                  }`}
                  title={multiAgentMode ? 'Disable Multi-Agent Mode' : 'Enable Multi-Agent Mode'}
                >
                  <span
                    className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      multiAgentMode ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  {multiAgentMode ? (
                    <Zap className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  ) : (
                    <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  )}
                  <span className={`text-xs sm:text-sm font-medium ${
                    multiAgentMode 
                      ? isDark ? 'text-blue-200' : 'text-blue-900'
                      : isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {multiAgentMode ? 'Multi-Agent Mode' : 'Single Agent Mode'}
                  </span>
                </div>
              </div>
              
              {/* Agent Status Header */}
              {multiAgentMode && agentStatus && (
                <div className="flex justify-center">
                  <AgentStatusHeader agentStatus={agentStatus} isDark={isDark} />
                </div>
              )}
              
              {multiAgentMode && (
                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Enhanced AI Processing</span>
                </div>
              )}
            </div>
          </div>
          
          {/* File Preview */}
          {selectedFile && (
            <div className={`mb-4 p-3 rounded-xl border backdrop-blur-sm ${
              isDark 
                ? 'border-gray-700/50 bg-gray-800/80' 
                : 'border-gray-200/50 bg-white/80'
            } shadow-sm`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedFile.type.startsWith('image/') 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  {selectedFile.type.startsWith('image/') ? (
                    <Image className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {selectedFile.name}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Unknown type'}
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedFile(null)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'hover:bg-gray-700/70 text-gray-400 hover:text-gray-200' 
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Main Input Container */}
          <div className={`relative rounded-2xl border-2 transition-all duration-200 ${
            isLoading
              ? isDark 
                ? 'border-blue-600/50 shadow-lg shadow-blue-500/20' 
                : 'border-blue-500/50 shadow-lg shadow-blue-500/20'
              : isDark 
                ? 'border-gray-700/50 hover:border-gray-600/50 focus-within:border-blue-600/50' 
                : 'border-gray-300/50 hover:border-gray-400/50 focus-within:border-blue-500/50'
          } ${
            isDark 
              ? 'bg-gray-900/90 shadow-lg shadow-black/20' 
              : 'bg-white/90 shadow-lg shadow-gray-200/50'
          } backdrop-blur-md`}>
            
            {/* Loading State Indicator */}
            {isLoading && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse rounded-t-2xl"></div>
            )}
            
            <div className="flex  items-end gap-2 sm:gap-3 p-1 sm:p-2">
              {/* Text Input */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={multiAgentMode 
                    ? "Ask anything - I'll route it to the best AI agent..." 
                    : "Ask me anything about your studies..."
                  }
                  className={`w-full resize-none border-0 bg-transparent focus:outline-none text-sm sm:text-base leading-6 placeholder:transition-colors pr-20 sm:pr-24 py-1 sm:py-2 ${
                    isDark 
                      ? 'text-white placeholder-gray-400 focus:placeholder-gray-500' 
                      : 'text-gray-900 placeholder-gray-500 focus:placeholder-gray-600'
                  }`}
                  style={{ maxHeight: '120px', minHeight: '20px' }}
                  disabled={isLoading}
                  rows={1}
                />
                
                {/* Voice and Info Icons Container */}
                <div className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {/* Live Voice Button */}
                  <button
                    onClick={() => setShowVoiceModal(true)}
                    className={`p-1 rounded-full transition-colors ${
                      isDark 
                        ? 'text-gray-500 hover:text-blue-400 hover:bg-gray-700/50' 
                        : 'text-gray-400 hover:text-blue-600 hover:bg-blue-100/50'
                    }`}
                    title="Open Live Voice Chat"
                  >
                    <Radio className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  
                  {/* Info Icon with Tooltip */}
                  <div className="relative">
                    <button
                      onMouseEnter={() => setShowInfoTooltip(true)}
                      onMouseLeave={() => setShowInfoTooltip(false)}
                      className={`p-1 rounded-full transition-colors ${
                        isDark 
                          ? 'text-gray-500 hover:text-gray-400 hover:bg-gray-700/50' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
                      }`}
                      title="Information"
                    >
                      <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    
                    {/* Tooltip */}
                    {showInfoTooltip && (
                      <div className={`absolute bottom-full right-0 mb-2 w-72 sm:w-80 p-3 rounded-lg shadow-lg border z-50 ${
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-gray-200' 
                          : 'bg-white border-gray-200 text-gray-800'
                      }`}>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">Important Notice</p>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                StudyBuddy can make mistakes. Consider checking important information.
                              </p>
                            </div>
                          </div>
                          
                          {multiAgentMode && (
                            <div className={`flex items-start gap-2 pt-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                              <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Multi-Agent Mode Active</p>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Using specialized AI agents for enhanced responses. Your queries are routed to the most appropriate agent.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Tooltip arrow */}
                        <div className={`absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
                          isDark ? 'border-t-gray-800' : 'border-t-white'
                        }`}></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1 sm:gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                
                {/* Live Voice Interface */}
                <LiveVoiceInterface
                  multiAgentMode={multiAgentMode}
                  agentStatus={agentStatus}
                  isDark={isDark}
                  username={username}
                  onConnectionChange={setIsVoiceConnected}
                />
                
                {/* File Upload Button */}
                <button
                  onClick={handleFileSelectClick}
                  className={`p-2 sm:p-3 rounded-xl transition-all duration-200 ${
                    isDark 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/70' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/70'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={isLoading}
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                
                {/* Send Button */}
                <button
                  onClick={handleSendClick}
                  disabled={(!message.trim() && !selectedFile) || isLoading}
                  className={`p-2 sm:p-3 rounded-xl transition-all duration-200 font-medium flex items-center justify-center min-w-[40px] sm:min-w-[48px] ${
                    (!message.trim() && !selectedFile) || isLoading
                      ? isDark 
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : multiAgentMode
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                        : 'studybuddy-message-user text-white hover:scale-105 shadow-lg'
                  } disabled:hover:scale-100 disabled:shadow-none`}
                  title="Send message"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Live Voice Modal */}
      <LiveVoiceModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        multiAgentMode={multiAgentMode}
        agentStatus={agentStatus}
        isDark={isDark}
        username={username}
      />
    </div>
  );
};

export default ChatInput;
