'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useSidebar } from '../../../context/SidebarContext';
import { Brain } from 'lucide-react';

// Import our new components
import StudyBuddyLayout from '../../../../components/studybuddy/StudyBuddyLayout';
import MessagesContainer from '../../../../components/studybuddy/MessagesContainer';
import ChatInput from '../../../../components/studybuddy/ChatInput';

// Import required styles
import '../studybuddy.css';

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
  
  // Refs
  const messagesEndRef = useRef(null);
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
    <StudyBuddyLayout
      isDark={isDark}
      session={session}
      particles={particles}
      onBackClick={() => router.push('/home/studybuddy')}
    >
      <MessagesContainer
        messagesContainerRef={messagesContainerRef}
        messagesEndRef={messagesEndRef}
        stableMessages={stableMessages}
        isLoading={isLoading}
        isDark={isDark}
        showScrollDown={showScrollDown}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        multiAgentMode={multiAgentMode}
        onCopyMessage={handleCopyMessage}
        onRegenerateResponse={handleRegenerateResponse}
        onEditMessage={handleEditMessage}
        onQuickResponse={handleQuickResponse}
        onSendMessage={handleSendMessage}
        onScrollToBottom={scrollToLastAIMessage}
        setSidebarOpen={setSidebarOpen}
      />

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
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        onSendMessage={handleSendMessage}
        onFileSelect={() => {}} // File selection is handled internally in ChatInput
      />
    </StudyBuddyLayout>
  );
}
