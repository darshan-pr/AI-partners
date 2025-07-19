'use client';

import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Edit3, 
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw,
  User,
  Users,
  Brain,
  Zap,
  FileText,
  Image
} from 'lucide-react';
import AIMessageRenderer from '../AIMessageRenderer';
import QuizResponseRenderer from '../QuizResponseRenderer';
import TutorResponseRenderer from '../TutorResponseRenderer';
import InteractiveAIMessage from '../InteractiveAIMessage';

const MessageItem = ({ 
  message, 
  isUser, 
  onCopy, 
  onRegenerate, 
  onEdit, 
  onQuickResponse,
  isDark, 
  sidebarOpen, 
  setSidebarOpen, 
  isEditingDisabled, 
  multiAgentMode 
}) => {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleCopy = async () => {
    await onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    setLiked(!liked);
    if (disliked) setDisliked(false);
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (liked) setLiked(false);
  };

  const handleEdit = () => {
    if (isUser) {
      setIsEditingMode(!isEditingMode);
      setEditing(!editing);
    }
  };

  const handleSaveEdit = async () => {
    if (onEdit && editedContent.trim() !== message.content && editedContent.trim()) {
      setIsSaving(true);
      
      setIsEditingMode(false);
      setEditing(false);
      
      try {
        await onEdit(message._id, editedContent.trim());
      } catch (error) {
        console.error('Failed to save edit:', error);
        setEditedContent(message.content);
        setIsEditingMode(true);
        setEditing(true);
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditingMode(false);
      setEditing(false);
      setEditedContent(message.content);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditingMode(false);
    setEditing(false);
  };

  useEffect(() => {
    setEditedContent(message.content);
  }, [message.content]);

  // User Message - Right Aligned
  if (isUser) {
    return (
      <div 
        className="w-full py-3 sm:py-4"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="max-w-6xl mx-auto px-3 mt-20 sm:px-4 lg:px-6">
          <div className="flex justify-end">
            <div className="flex gap-2 sm:gap-3 max-w-[95%] lg:max-w-[90%]">
              <div className="flex-1 min-w-0">
                {message.metadata?.fileName && (
                  <div className="mb-2 p-2 sm:p-3 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center gap-2 text-sm">
                      {message.metadata.fileType?.startsWith('image/') ? 
                        <Image className="w-4 h-4 text-blue-500" /> : 
                        <FileText className="w-4 h-4 text-blue-500" />
                      }
                      <span className="font-medium text-blue-700 dark:text-blue-300 truncate">{message.metadata.fileName}</span>
                      <span className="text-blue-500 dark:text-blue-400 text-xs">({message.metadata.fileSize})</span>
                    </div>
                  </div>
                )}
                
                <div className={`studybuddy-message-user text-white rounded-2xl rounded-tr-md px-3 sm:px-4 py-2 sm:py-3 relative ${
                  isEditingMode ? 'ring-2 ring-white/30 ring-offset-2 ring-offset-blue-500/20' : ''
                } ${isSaving ? 'opacity-70' : ''}`}>
                  
                  {isSaving && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse rounded-2xl"></div>
                  )}
                  
                  {isEditingMode ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault();
                              handleSaveEdit();
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              handleCancelEdit();
                            }
                          }}
                          className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all"
                          rows={Math.max(3, editedContent.split('\n').length)}
                          autoFocus
                          placeholder="Edit your message... (Cmd+Enter to save, Esc to cancel)"
                          disabled={isSaving}
                        />
                      </div>
                      <div className="flex gap-2 justify-between items-center">
                        <div className="text-xs text-white/70 flex items-center gap-1">
                          <span className="text-yellow-300">⚡</span>
                          This will regenerate the AI response
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            disabled={isSaving || !editedContent.trim() || editedContent.trim() === message.content}
                            className="px-3 py-1.5 text-xs bg-white/20 hover:bg-white/30 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Save & Send
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed studybuddy-text-responsive relative ${
                      isSaving ? 'text-white/80' : ''
                    }`}>
                      {message.content}
                      {isSaving && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Action Buttons */}
                <div className={`flex items-center justify-end gap-2 mt-2 transition-all duration-200 ${
                  showActions ? 'opacity-100' : 'opacity-0'
                }`}>
                  <button
                    onClick={handleCopy}
                    className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                      copied 
                        ? (isDark ? 'text-green-400' : 'text-green-600')
                        : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
                    }`}
                    title={copied ? 'Copied!' : 'Copy message'}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={handleEdit}
                    disabled={isEditingDisabled || isSaving || multiAgentMode}
                    className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                      editing 
                        ? (isDark ? 'text-blue-400 bg-blue-400/10' : 'text-blue-600 bg-blue-100/50')
                        : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={
                      multiAgentMode ? 'Edit disabled in Multi-Agent mode' :
                      isEditingDisabled ? 'Cannot edit while AI is responding' : 
                      isSaving ? 'Updating message...' :
                      editing ? 'Editing message' : 'Edit message'
                    }
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-shrink-0 pt-1">
                <div 
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-xs sm:text-sm font-medium shadow-sm cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  title="Toggle sidebar"
                >
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AI Message - Left Aligned
  return (
    <div 
      className="w-full py-3 sm:py-4"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-start">
          <div className="flex gap-2 sm:gap-3 max-w-[85%] lg:max-w-[80%]">
            <div className="flex-shrink-0 pt-1">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs sm:text-sm font-medium shadow-sm">
                {message.metadata?.multiAgent ? (
                  message.metadata.agentType === 'quiz' ? (
                    <Users className="w-5 h-5 text-white" />
                  ) : message.metadata.agentType === 'general' ? (
                    <Brain className="w-5 h-5 text-white" />
                  ) : message.metadata.agentType === 'tutor' ? (
                    <Users className="w-5 h-5 text-white" />
                  ) : (
                    <Zap className="w-5 h-5 text-white" />
                  )
                ) : (
                  <Brain className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {/* Agent Info Banner */}
              {message.metadata?.multiAgent && (
                <div className={`mb-2 p-2 rounded-lg text-xs ${
                  isDark ? 'bg-blue-900/20 border border-blue-800/50' : 'bg-blue-50 border border-blue-200/50'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {message.metadata.agentType === 'quiz' ? (
                        <Users className="w-3 h-3 text-blue-500" />
                      ) : message.metadata.agentType === 'general' ? (
                        <Brain className="w-3 h-3 text-green-500" />
                      ) : message.metadata.agentType === 'tutor' ? (
                        <Users className="w-3 h-3 text-orange-500" />
                      ) : (
                        <Zap className="w-3 h-3 text-purple-500" />
                      )}
                      <span className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                        {message.metadata.agentType === 'quiz' ? 'Quiz Agent' : 
                         message.metadata.agentType === 'general' ? 'Study Assistant' : 
                         message.metadata.agentType === 'tutor' ? 'Performance Tutor' :
                         'Orchestrator'}
                      </span>
                    </div>
                    {message.metadata.routing && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        isDark ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {Math.round(message.metadata.routing.confidence * 100)}% confidence
                      </span>
                    )}
                  </div>
                  {message.metadata.routing?.reasoning && (
                    <div className={`mt-1 text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      {message.metadata.routing.reasoning}
                    </div>
                  )}
                </div>
              )}
              
              <div className={`studybuddy-message-ai rounded-2xl rounded-tl-md px-3 sm:px-4 py-2 sm:py-3 ${
                isDark ? 'bg-gray-900/90 border border-gray-700/50' : 'bg-gray-50 border border-gray-200/50'
              }`}>
                <div className={isDark ? 'text-gray-100' : 'text-gray-800'}>
                  {message.metadata?.multiAgent ? (
                    message.metadata?.agentType === 'quiz' && message.metadata?.quizGenerated ? (
                      <QuizResponseRenderer 
                        content={message.content} 
                        metadata={message.metadata} 
                        isDark={isDark} 
                        onQuickResponse={onQuickResponse}
                      />
                    ) : message.metadata?.agentType === 'tutor' ? (
                      <TutorResponseRenderer 
                        content={message.content} 
                        metadata={message.metadata} 
                        isDark={isDark} 
                        onQuickResponse={onQuickResponse}
                      />
                    ) : (
                      <InteractiveAIMessage 
                        content={message.content} 
                        isDark={isDark} 
                        onQuickResponse={onQuickResponse}
                      />
                    )
                  ) : (
                    <AIMessageRenderer content={message.content} isDark={isDark} />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`flex items-center gap-2 mt-2 transition-all duration-200 ${
                showActions ? 'opacity-100' : 'opacity-0'
              }`}>
                <button
                  onClick={handleCopy}
                  className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                    copied 
                      ? (isDark ? 'text-green-400' : 'text-green-600')
                      : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
                  }`}
                  title={copied ? 'Copied!' : 'Copy message'}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={handleLike}
                  className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                    liked 
                      ? (isDark ? 'text-green-400' : 'text-green-600')
                      : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
                  }`}
                  title={liked ? 'Liked' : 'Like'}
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleDislike}
                  className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                    disliked 
                      ? (isDark ? 'text-red-400' : 'text-red-600')
                      : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
                  }`}
                  title={disliked ? 'Disliked' : 'Dislike'}
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => onRegenerate(message)}
                  disabled={multiAgentMode}
                  className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                    multiAgentMode
                      ? 'text-gray-400/50 cursor-not-allowed'
                      : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  } disabled:opacity-50 disabled:hover:scale-100`}
                  title={multiAgentMode ? 'Regenerate disabled in Multi-Agent mode' : 'Regenerate response'}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
