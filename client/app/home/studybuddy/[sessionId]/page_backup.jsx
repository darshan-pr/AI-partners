'use client';

import { useState, useEffect, useRef, use, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useSidebar } from '../layout'; // Import sidebar context
import { 
  Send, 
  Paperclip, 
  Copy, 
  RotateCcw, 
  FileText, 
  Image, 
  X, 
  ArrowLeft,
  User,
  Brain,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Check,
  ChevronDown,
  Share,
  Zap,
  Users,
  Info,
  AlertTriangle
} from 'lucide-react';
// Import the CSS file for StudyBuddy styles
import '../studybuddy.css';
// Import the AI Message Renderer component
import AIMessageRenderer from '../../../../components/AIMessageRenderer';
// Import the Multi-Agent Toggle component
import MultiAgentToggle from '../../../../components/MultiAgentToggle';
// Import the Agent Status Header component
import AgentStatusHeader from '../../../../components/AgentStatusHeader';
// Import the Quiz Response Renderer component
import QuizResponseRenderer from '../../../../components/QuizResponseRenderer';
// Import the Interactive AI Message component
import InteractiveAIMessage from '../../../../components/InteractiveAIMessage'; 

// Modern Chat Message Component with Proper Alignment
const MessageItem = ({ message, isUser, onCopy, onRegenerate, onEdit, isDark, sidebarOpen, setSidebarOpen, isEditingDisabled, multiAgentMode }) => {
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
      if (!isEditingMode) {
        setEditedContent(message.content);
        // Focus will be handled by autoFocus on textarea
      }
    }
  };

  const handleSaveEdit = async () => {
    if (onEdit && editedContent.trim() !== message.content && editedContent.trim()) {
      setIsSaving(true);
      
      // Immediately exit edit mode for seamless UX (like modern AI chats)
      setIsEditingMode(false);
      setEditing(false);
      
      try {
        await onEdit(message._id, editedContent.trim());
        // Content will be updated by the backend automatically
      } catch (error) {
        console.error('Failed to save edit:', error);
        // Reset to original content on error and re-enter edit mode
        setEditedContent(message.content);
        setIsEditingMode(true);
        setEditing(true);
      } finally {
        setIsSaving(false);
      }
    } else {
      // If no changes, just exit edit mode
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

  // Sync edited content with message content when it updates from backend
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
                  
                  {/* Subtle loading overlay for seamless editing experience */}
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
                      {/* Subtle updating indicator */}
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
                {/* Dynamic Agent Icon */}
                {message.metadata?.multiAgent ? (
                  message.metadata.agentType === 'quiz' ? (
                    <Users className="w-5 h-5 text-white" />
                  ) : message.metadata.agentType === 'general' ? (
                    <Brain className="w-5 h-5 text-white" />
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
                      ) : (
                        <Zap className="w-3 h-3 text-purple-500" />
                      )}
                      <span className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                        {message.metadata.agentType === 'quiz' ? 'Quiz Agent' : 
                         message.metadata.agentType === 'general' ? 'Study Assistant' : 
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
                  {/* Enhanced rendering for multi-agent responses */}
                  {message.metadata?.multiAgent ? (
                    message.metadata?.agentType === 'quiz' && message.metadata?.quizGenerated ? (
                      <QuizResponseRenderer 
                        content={message.content} 
                        metadata={message.metadata} 
                        isDark={isDark} 
                        onQuickResponse={handleQuickResponse}
                      />
                    ) : (
                      <InteractiveAIMessage 
                        content={message.content} 
                        isDark={isDark} 
                        onQuickResponse={handleQuickResponse}
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

// Simple Loading Component with Typing Dots
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
              
              {/* Simple Typing Animation */}
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

export default function StudyBuddySession({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Sidebar context for dynamic input positioning
  const { sidebarOpen, setSidebarOpen, isMobile } = useSidebar();
  
  // Particle system for background animations
  const [particles, setParticles] = useState([]);
  
  // State management
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  
  // Multi-agent system state
  const [multiAgentMode, setMultiAgentMode] = useState(false);
  const [agentStatus, setAgentStatus] = useState(null);
  const [lastAgentResponse, setLastAgentResponse] = useState(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // URL params
  const sessionId = params.sessionId;
  const initialPrompt = searchParams.get('prompt');

  // Particle system for enhanced visual effects
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 30; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.3 + 0.1,
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
    window.addEventListener('resize', generateParticles);

    const animateParticles = () => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          x: particle.x + particle.speedX,
          y: particle.y + particle.speedY,
          x: particle.x > window.innerWidth ? 0 : particle.x < 0 ? window.innerWidth : particle.x,
          y: particle.y > window.innerHeight ? 0 : particle.y < 0 ? window.innerHeight : particle.y,
        }))
      );
    };

    const interval = setInterval(animateParticles, 100);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', generateParticles);
    };
  }, []);

  // Convex queries and mutations
  const session = useQuery(api.chat.getSession, 
    user && sessionId ? { sessionId, username: user.username } : "skip"
  );
  const messages = useQuery(api.chat.getSessionMessages, 
    user && sessionId ? { sessionId, username: user.username } : "skip"
  );
  const addMessage = useMutation(api.chat.addMessage);
  const updateSessionTitle = useMutation(api.chat.updateSessionTitle);
  const deleteMessagesAfter = useMutation(api.chat.deleteMessagesAfter);
  const updateMessage = useMutation(api.chat.updateMessage);

  // Memoized messages for performance
  const stableMessages = useMemo(() => {
    if (!messages) return [];
    return messages.map(msg => ({
      ...msg,
      id: msg._id || `${msg.timestamp}-${msg.role}`
    }));
  }, [messages]);

  // Initialize user and theme
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/auth');
      return;
    }

    // Save current session ID for quiz results navigation
    localStorage.setItem('lastStudySessionId', sessionId);

    const theme = localStorage.getItem('theme') || 'light';
    setIsDark(theme === 'dark');

    const handleThemeChange = (event) => {
      setIsDark(event.detail.theme === 'dark');
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, [router, sessionId]);

  // Handle session loading
  useEffect(() => {
    if (session !== undefined) {
      setSessionLoading(false);
    }
  }, [session]);

  // Initialize agent status when multi-agent mode is enabled
  useEffect(() => {
    if (multiAgentMode && !agentStatus) {
      setAgentStatus({
        currentAgent: 'orchestrator',
        agentStates: {
          orchestrator: 'listening',
          quiz: 'idle', 
          general: 'idle'
        },
        conversationLog: []
      });
    } else if (!multiAgentMode) {
      setAgentStatus(null);
    }
  }, [multiAgentMode, agentStatus]);

  // Message handlers
  const handleCopyMessage = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  }, []);

  // Send message handler - defined first to avoid initialization order issues
  const handleSendMessage = useCallback(async (messageText = message) => {
    if ((!messageText.trim() && !selectedFile) || isLoading || !user) return;

    const currentMessage = messageText.trim();
    const currentFile = selectedFile;
    
    setMessage('');
    setSelectedFile(null);
    setIsLoading(true);

    try {
      await addMessage({
        sessionId,
        username: user.username,
        role: 'user',
        content: currentMessage,
        messageType: currentFile ? 'file' : 'text',
        metadata: currentFile ? { 
          fileName: currentFile.name, 
          fileType: currentFile.type,
          fileSize: `${(currentFile.size / 1024).toFixed(2)} KB`
        } : null
      });

      const formData = new FormData();
      formData.append('message', currentMessage);
      formData.append('sessionId', sessionId);
      formData.append('username', user.username);
      formData.append('multiAgentMode', multiAgentMode.toString());
      
      if (currentFile) {
        formData.append('file', currentFile);
      }

      // Choose API endpoint based on multi-agent mode
      const apiEndpoint = multiAgentMode ? '/api/studybuddy-agents' : '/api/studybuddy';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }
      
      const result = await response.json();

      // Store the agent response data for displaying agent info
      if (multiAgentMode && result.agentType) {
        setLastAgentResponse(result);
        setAgentStatus(result.systemStatus);
      }

      await addMessage({
        sessionId,
        username: user.username,
        role: 'assistant',
        content: result.response || result.message,
        messageType: 'text',
        metadata: multiAgentMode ? {
          agentType: result.agentType,
          routing: result.routing,
          multiAgent: true,
          needsMoreInfo: result.needsMoreInfo,
          quizGenerated: result.quizGenerated,
          quizId: result.quizId,
          quizData: result.quizData,
          nextSuggestions: result.nextSuggestions,
          topicSuggestions: result.topicSuggestions
        } : null
      });

      if (stableMessages?.length === 0) {
        const title = currentMessage.length > 50 ? `${currentMessage.substring(0, 47)}...` : currentMessage;
        await updateSessionTitle({ sessionId, username: user.username, title });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      await addMessage({
        sessionId,
        username: user.username,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        messageType: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [message, selectedFile, isLoading, user, sessionId, addMessage, updateSessionTitle, stableMessages?.length, multiAgentMode]);

  // Quick response handler for interactive AI messages - defined after handleSendMessage
  const handleQuickResponse = useCallback((responseText) => {
    setMessage(responseText);
    // Small delay to show the text in input, then send
    setTimeout(() => {
      handleSendMessage(responseText);
    }, 100);
  }, [handleSendMessage]);

  const handleEditMessage = useCallback(async (messageId, newContent) => {
    if (!user || !messageId || !newContent.trim()) return;
    
    try {
      setIsLoading(true);
      
      // Step 1: Update the user message content
      await updateMessage({
        messageId,
        username: user.username,
        newContent: newContent.trim()
      });

      // Step 2: Delete all AI responses after this message
      await deleteMessagesAfter({
        sessionId,
        username: user.username,
        messageId
      });

      // Step 3: Generate new AI response for the edited message
      const formData = new FormData();
      formData.append('message', newContent.trim());
      formData.append('sessionId', sessionId);
      formData.append('username', user.username);

      const response = await fetch('/api/studybuddy', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate AI response');
      }
      
      const result = await response.json();

      // Step 4: Add the new AI response
      await addMessage({
        sessionId,
        username: user.username,
        role: 'assistant',
        content: result.response || result.message,
        messageType: 'text'
      });

      // Step 5: Auto-scroll to the new response
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error('Failed to edit message:', error);
      // Add more specific error message to chat
      await addMessage({
        sessionId,
        username: user.username,
        role: 'assistant',
        content: `Sorry, I encountered an error while processing your edited message: ${error.message || 'Unknown error'}. Please try again.`,
        messageType: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, sessionId, updateMessage, deleteMessagesAfter, addMessage, messagesEndRef]);

  // Handle initial prompt
  useEffect(() => {
    if (initialPrompt && stableMessages?.length === 0 && user && !isLoading) {
      // Use a small timeout to ensure the UI is ready before sending
      const timer = setTimeout(() => {
        handleSendMessage(initialPrompt);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialPrompt, stableMessages?.length, user, isLoading, handleSendMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [stableMessages, isLoading]);

  // Scroll detection for down arrow
  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        // Show arrow if scrolled up more than 200px from bottom or if there are messages above view
        const isScrolledUp = scrollTop < scrollHeight - clientHeight - 200;
        setShowScrollDown(isScrolledUp && stableMessages.length > 2);
      }
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Check initial state
      handleScroll();
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [stableMessages.length]);

  // Scroll to last AI message
  const scrollToLastAIMessage = () => {
    // Scroll to bottom where the latest messages are
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Event handlers
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);
  
  const handleRegenerateResponse = useCallback(async (messageToRegen) => {
      // To regenerate, we need the last user message.
      const lastUserMessage = [...stableMessages].reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        setIsLoading(true);
        // We can pass the content of the last user message to the send handler.
        await handleSendMessage(lastUserMessage.content);
      } else {
        console.error("Could not find a user message to regenerate a response from.");
      }
  }, [stableMessages, handleSendMessage]);

  // Handle quiz completion and score updates
  useEffect(() => {
    const handleQuizCompletion = (event) => {
      const { quizId, score, totalQuestions } = event.detail;
      
      // Find the message that created this quiz and update it with the score
      const updatedMessages = stableMessages.map(msg => {
        if (msg.metadata?.quizId === quizId && msg.metadata?.quizGenerated) {
          return {
            ...msg,
            metadata: {
              ...msg.metadata,
              quizCompleted: true,
              finalScore: score,
              totalQuestions: totalQuestions,
              completionDate: new Date().toISOString()
            }
          };
        }
        return msg;
      });
      
      // Here we would normally update the messages in the database
      // For now, we'll just update the local state
      console.log('Quiz completed with score:', score, '/', totalQuestions);
    };

    window.addEventListener('quizCompleted', handleQuizCompletion);
    return () => window.removeEventListener('quizCompleted', handleQuizCompletion);
  }, [stableMessages]);

  // Full-page loading state
  if (sessionLoading) {
    return (
      <div className={`h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="text-center">
          {/* Enhanced Main Loading Animation */}
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white text-xl font-bold shadow-lg mx-auto animate-pulse">
              <Brain className="w-5 h-5 text-white" />
            </div>
            {/* Ripple Effects */}
            <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-orange-500/20 animate-ping"></div>
            <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-red-500/20 animate-ping" style={{animationDelay: '0.5s'}}></div>
          </div>
          
          <div className="space-y-3">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              StudyBuddy
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading your session...
            </p>
            
            {/* Progress Indicator */}
            <div className={`w-32 h-1 rounded-full mx-auto ${isDark ? 'bg-gray-800' : 'bg-gray-200'} overflow-hidden`}>
              <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-pulse" style={{
                animation: 'progressBar 2s ease-in-out infinite'
              }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen studybuddy-scrollbar transition-colors duration-300 relative overflow-hidden ${
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
      <div className="z-10 flex flex-col h-screen">
      {/* Refined Header */}
      <header className="fixed top-0 z-50 w-full backdrop-blur-md transition-colors duration-300" style={{
        backgroundColor: isDark ? 'rgba(3, 7, 18, 0.8)' : 'rgba(249, 250, 251, 0.8)',
        borderBottom: `1px solid ${isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.3)'}`
      }}>
        <div className="mx-auto px-1 sm:px-2 lg:px-3">
          <div className="flex items-center justify-between h-12 sm:h-14">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/home/studybuddy')}
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
            
            {/* Center - Empty (Agent Status moved to input area) */}
            <div className="flex-1 flex justify-center">
              {/* Agent status header moved to input area for better UX */}
            </div>
            
            {/* Right side spacer */}
            <div className="w-12 sm:w-20">
              {/* Future: Add settings or other controls here */}
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto studybuddy-scrollbar ${isDark ? 'bg-gray-950' : 'bg-gray-50'} relative`}
      >
        {/* Scroll to Bottom Button - Positioned above the new input area */}
        {showScrollDown && (
          <div 
            className="fixed z-30 transition-all duration-300"
            style={{
              bottom: '180px', // Adjusted for the new taller input area
              left: isMobile ? '50%' : sidebarOpen ? '50%' : '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <button
              onClick={scrollToLastAIMessage}
              className={`p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600' 
                  : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'
              }`}
              title="Scroll to latest message"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        )}
        
        <div className="pb-32 sm:pb-40"> {/* Increased padding for the new professional input area */}
          {stableMessages && stableMessages.length > 0 ? (
            <>
              {stableMessages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  isUser={msg.role === 'user'}
                  onCopy={handleCopyMessage}
                  onRegenerate={handleRegenerateResponse}
                  onEdit={handleEditMessage}
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
            <div className="flex items-center justify-center h-full pt-8 sm:pt-16">
              <div className="text-center max-w-lg mx-auto px-3 sm:px-4 lg:px-6">
                {/* Refined Welcome Section */}
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

                {/* Refined Suggestion prompts */}
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
                      onClick={() => handleSendMessage(item.prompt)}
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
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Professional Input Area - Fixed positioning and proper spacing */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent dark:from-gray-950 dark:via-gray-950/95 dark:to-transparent backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-800/50">
        <div 
          className="transition-all duration-300 ease-out"
          style={{
            marginLeft: isMobile ? '0' : sidebarOpen ? '320px' : '80px',
            paddingRight: '0'
          }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            
            {/* Multi-Agent Control Panel */}
            <div className="mb-4">
              <div className={`flex items-center justify-between p-1 rounded-xl transition-all ${
                multiAgentMode 
                  ? isDark 
                    ? 'bg-blue-900/20 border border-blue-800/30' 
                    : 'bg-blue-50/80 border border-blue-200/50'
                  : isDark
                    ? 'bg-gray-900/50 border border-gray-800/50'
                    : 'bg-gray-100/80 border border-gray-200/50'
              }`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMultiAgentMode(!multiAgentMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                      multiAgentMode 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                        : isDark ? 'bg-gray-700' : 'bg-gray-300'
                    }`}
                    title={multiAgentMode ? 'Disable Multi-Agent Mode' : 'Enable Multi-Agent Mode'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                        multiAgentMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {multiAgentMode ? (
                      <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Users className="w-5 h-5 text-gray-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      multiAgentMode 
                        ? 'text-blue-900 dark:text-blue-200' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {multiAgentMode ? 'Multi-Agent Mode' : 'Single Agent Mode'}
                    </span>
                  </div>
                </div>
                {/* Agent Status Header - Positioned below toggle */}
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
              
              <div className="flex items-end gap-3 p-2">
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
                    className={`w-full resize-none border-0 bg-transparent focus:outline-none text-base leading-6 placeholder:transition-colors pr-10 ${
                      isDark 
                        ? 'text-white placeholder-gray-400 focus:placeholder-gray-500' 
                        : 'text-gray-900 placeholder-gray-500 focus:placeholder-gray-600'
                    }`}
                    style={{ maxHeight: '120px', minHeight: '24px' }}
                    disabled={isLoading}
                    rows={1}
                  />
                  
                  {/* Info Icon with Tooltip */}
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
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
                        <Info className="w-4 h-4" />
                      </button>
                      
                      {/* Tooltip */}
                      {showInfoTooltip && (
                        <div className={`absolute bottom-full right-0 mb-2 w-80 p-3 rounded-lg shadow-lg border z-50 ${
                          isDark 
                            ? 'bg-gray-800 border-gray-700 text-gray-200' 
                            : 'bg-white border-gray-200 text-gray-800'
                        }`}>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium">Important Notice</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  StudyBuddy can make mistakes. Consider checking important information.
                                </p>
                              </div>
                            </div>
                            
                            {multiAgentMode && (
                              <div className="flex items-start gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Multi-Agent Mode Active</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
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
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  
                  {/* File Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-3 rounded-xl transition-all duration-200 ${
                      isDark 
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/70' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/70'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={isLoading}
                    title="Attach file"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  
                  {/* Send Button */}
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={(!message.trim() && !selectedFile) || isLoading}
                    className={`p-3 rounded-xl transition-all duration-200 font-medium flex items-center justify-center min-w-[48px] ${
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
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
