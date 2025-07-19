'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Sun, Moon, Plus, Search, Menu, X, MessageCircle, Trash2, Settings, Upload, User, Mail, Palette, Home, Edit3, Share, Archive } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
// Import StudyBuddy styles
import './studybuddy.css';

// Create context for sidebar state
const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export default function StudyBuddyLayout({ children, params }) {
  const [theme, setTheme] = useState('light');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're in a chat session (hide navbar)
  const isInChatSession = pathname.includes('/studybuddy/') && pathname !== '/home/studybuddy';

  const sessions = useQuery(api.chat.getUserSessions, user ? { username: user.username } : "skip");
  const createSession = useMutation(api.chat.createSession);
  const deleteSession = useMutation(api.chat.deleteSession);
  const updateSessionTitle = useMutation(api.chat.updateSessionTitle);

  // Optimized useEffect with memoized callbacks
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // Changed from 1024 to 768 for better mobile detection
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    
    const handleThemeChange = (event) => setTheme(event.detail.theme);
    
    // Initialize
    checkMobile();
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme === 'dark' ? 'dark' : 'light');

    // Event listeners
    window.addEventListener('resize', checkMobile);
    window.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  // Optimized handlers with useCallback equivalent logic
  const handleNewChat = async () => {
    if (!user) return;
    try {
      const sessionId = await createSession({ username: user.username, title: 'New Study Session' });
      router.push(`/home/studybuddy/${sessionId}`);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    if (!user) return;
    e.stopPropagation();
    try {
      await deleteSession({ sessionId, username: user.username });
      if (pathname.includes(sessionId)) {
        router.push('/home/studybuddy');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleRenameSession = async (sessionId, currentTitle, e) => {
    if (!user) return;
    e.stopPropagation();
    setEditingSession(sessionId);
    setEditTitle(currentTitle);
  };

  const handleSaveTitle = async (sessionId) => {
    if (!user || !editTitle.trim()) return;
    try {
      await updateSessionTitle({ 
        sessionId, 
        username: user.username, 
        title: editTitle.trim() 
      });
      setEditingSession(null);
      setEditTitle('');
    } catch (error) {
      console.error('Failed to rename session:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
    setEditTitle('');
  };

  const handleShareSession = async (sessionId, e) => {
    e.stopPropagation();
    try {
      const chatLink = `${window.location.origin}/home/studybuddy/${sessionId}`;
      
      // Try native Web Share API first
      if (navigator.share) {
        await navigator.share({
          title: 'StudyBuddy Chat Session',
          text: 'Check out this StudyBuddy chat session',
          url: chatLink
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(chatLink);
        alert('Chat link copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to share link:', error);
      // Fallback for browsers that don't support clipboard API
      const chatLink = `${window.location.origin}/home/studybuddy/${sessionId}`;
      const textArea = document.createElement('textarea');
      textArea.value = chatLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Chat link copied to clipboard!');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
  };

  const handleGoHome = () => {
    router.push('/home');
  };

  const filteredSessions = sessions?.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.lastMessage && session.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  return (
    <ProtectedRoute>
      <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen, isMobile }}>
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'} transition-colors duration-200`}>
          {/* Navbar is completely hidden in StudyBuddy */}
          
          <div className="flex h-screen">
          {/* Enhanced Left Sidebar */}
          <div className={`${sidebarOpen ? (isMobile ? 'w-full' : 'w-80') : 'w-16'} ${
            theme === 'dark' 
              ? 'bg-gray-900/80 backdrop-blur-xl border-gray-800/30' 
              : 'bg-white/90 backdrop-blur-xl border-gray-200/30'
          } border-r flex flex-col transition-all duration-300 fixed left-0 top-0 h-full z-50 shadow-2xl studybuddy-sidebar`}>
            
            {/* Enhanced Sidebar Header */}
            <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700/30' : 'border-gray-200/30'} pt-4`}>
              <div className="flex items-center justify-between mb-4">
                {sidebarOpen && (
                  <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    StudyBuddy AI
                  </h1>
                )}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  onMouseEnter={() => !sidebarOpen && setSidebarOpen(true)}
                  className={`p-2 rounded-lg transition-all hover:scale-110 ${
                    theme === 'dark' 
                      ? 'hover:bg-gray-800/50 text-white hover:bg-gray-700/70' 
                      : 'hover:bg-gray-50/50 text-gray-900 hover:bg-gray-100/70'
                  } backdrop-blur-sm`}
                  title={sidebarOpen ? 'Close sidebar' : 'Open sidebar (hover to open)'}
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Enhanced New Chat Button */}
              {sidebarOpen && (
                <button
                  onClick={handleNewChat}
                  disabled={!user}
                  className={`w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl flex items-center gap-2 font-medium transition-all transform hover:scale-105 hover:shadow-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group`}
                >
                  <div className="absolute mt-5  inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <Plus className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">New Study Session</span>
                </button>
              )}
            </div>

            {/* Enhanced Search */}
            {sidebarOpen && (
              <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700/30' : 'border-gray-200/30'}`}>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all backdrop-blur-sm placeholder-gray-400 ${
                      theme === 'dark' 
                        ? 'bg-gray-800/30 border-gray-700/30 text-white hover:bg-gray-800/50' 
                        : 'bg-white/30 border-gray-300/30 text-gray-900 hover:bg-white/50'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Enhanced Chat Sessions */}
            <div className="flex-1 overflow-y-auto studybuddy-scroll studybuddy-chat-list">
              {sidebarOpen ? (
                sessions === undefined ? (
                  // Enhanced Loading state with sophisticated animations
                  <div className="p-6 text-center">
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br ${
                      theme === 'dark' ? 'from-gray-800/50 to-gray-700/50' : 'from-gray-100/50 to-gray-50/50'
                    } flex items-center justify-center backdrop-blur-sm relative overflow-hidden`}>
                      {/* Multiple animated rings */}
                      <div className="absolute inset-0 rounded-3xl">
                        <div className="absolute inset-2 rounded-2xl border-2 border-blue-500/20 border-t-blue-500 animate-spin"></div>
                        <div className="absolute inset-3 rounded-2xl border-2 border-purple-500/20 border-r-purple-500 animate-spin" style={{animationDirection: 'reverse', animationDuration: '2s'}}></div>
                        <div className="absolute inset-4 rounded-xl border border-orange-500/20 border-b-orange-500 animate-spin" style={{animationDuration: '3s'}}></div>
                      </div>
                      
                      {/* Pulsing center icon */}
                      <div className="relative z-10">
                        <MessageCircle className={`w-10 h-10 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} animate-pulse`} />
                        {/* Ripple effect */}
                        <div className="absolute inset-0 w-10 h-10 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-ping"></div>
                        <div className="absolute inset-0 w-10 h-10 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 animate-ping" style={{animationDelay: '1s'}}></div>
                      </div>
                      
                      {/* Floating particles */}
                      <div className="absolute inset-0 overflow-hidden rounded-3xl">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className={`absolute w-1 h-1 rounded-full ${
                              theme === 'dark' ? 'bg-blue-400/40' : 'bg-blue-500/30'
                            } animate-bounce`}
                            style={{
                              left: `${20 + (i * 10)}%`,
                              top: `${20 + (i * 8)}%`,
                              animationDelay: `${i * 0.2}s`,
                              animationDuration: `${1.5 + (i * 0.1)}s`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Enhanced text with gradient */}
                    <div className="mb-4">
                      <p className={`text-lg font-semibold bg-gradient-to-r ${
                        theme === 'dark' 
                          ? 'from-blue-400 via-purple-400 to-orange-400' 
                          : 'from-blue-600 via-purple-600 to-orange-600'
                      } bg-clip-text text-transparent animate-pulse`}>
                        Loading conversations...
                      </p>
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm mt-2`}>
                        Fetching your study sessions
                      </p>
                    </div>
                    
                    {/* Enhanced Loading skeleton for sessions with staggered animation */}
                    <div className="mt-8 space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`p-4 rounded-xl border ${
                          theme === 'dark' ? 'border-gray-800/40 bg-gray-800/30' : 'border-gray-200/40 bg-gray-100/30'
                        } relative overflow-hidden`} style={{animationDelay: `${i * 0.1}s`}}>
                          {/* Shimmer effect */}
                          <div className={`absolute inset-0 bg-gradient-to-r ${
                            theme === 'dark' 
                              ? 'from-transparent via-gray-700/30 to-transparent' 
                              : 'from-transparent via-gray-300/30 to-transparent'
                          } animate-pulse translate-x-[-100%] animate-shimmer`}></div>
                          
                          {/* Content skeleton */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-3 h-3 rounded-full ${
                              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                            } animate-pulse`} style={{animationDelay: `${i * 0.2}s`}}></div>
                            <div className={`h-4 rounded flex-1 ${
                              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                            } animate-pulse`} style={{ 
                              width: `${60 + Math.random() * 30}%`,
                              animationDelay: `${i * 0.2}s`
                            }}></div>
                          </div>
                          <div className={`h-3 rounded ${
                            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                          } animate-pulse`} style={{ 
                            width: `${40 + Math.random() * 40}%`,
                            animationDelay: `${i * 0.3}s`
                          }}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${
                      theme === 'dark' ? 'from-gray-800/50 to-gray-700/50' : 'from-gray-100/50 to-gray-50/50'
                    } flex items-center justify-center backdrop-blur-sm`}>
                      <MessageCircle className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                    </div>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>
                      {searchTerm ? 'No conversations found' : 'Start your first conversation'}
                    </p>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-xs mt-1`}>
                      {searchTerm ? 'Try different keywords' : 'Click "New Study Session" to begin'}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {filteredSessions.map((session) => (
                      <div
                        key={session._id}
                        className={`group relative p-4 rounded-xl cursor-pointer border transition-all transform hover:scale-[1.02] backdrop-blur-sm hover:shadow-lg studybuddy-chat-item ${
                          pathname.includes(session.sessionId) ? 'studybuddy-chat-item-active' : ''
                        } ${
                          pathname.includes(session.sessionId)
                            ? theme === 'dark' 
                              ? 'bg-blue-900/30 border-blue-700/30 shadow-blue-900/20' 
                              : 'bg-blue-50/30 border-blue-200/30 shadow-blue-100/50'
                            : theme === 'dark' 
                              ? 'hover:bg-gray-800/30 border-gray-800/20 hover:border-gray-700/30' 
                              : 'hover:bg-gray-100/30 border-gray-100/20 hover:border-gray-200/30'
                        }`}
                        onClick={() => router.push(`/home/studybuddy/${session.sessionId}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-2">
                            {editingSession === session.sessionId ? (
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveTitle(session.sessionId);
                                    } else if (e.key === 'Escape') {
                                      handleCancelEdit();
                                    }
                                  }}
                                  onBlur={() => handleSaveTitle(session.sessionId)}
                                  className={`flex-1 text-sm font-semibold bg-transparent border-b-2 border-blue-500 focus:outline-none ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <h3 
                                className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} truncate text-sm`}
                              >
                                {session.title}
                              </h3>
                            )}
                            {session.lastMessage && (
                              <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} truncate mt-1.5 leading-relaxed`}>
                                {session.lastMessage}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-3">
                                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                                  {new Date(session.updatedAt).toLocaleDateString([], { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                                {session.messageCount && (
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    theme === 'dark' 
                                      ? 'bg-gray-800/50 text-gray-300 border border-gray-700/30' 
                                      : 'bg-gray-100/50 text-gray-600 border border-gray-200/30'
                                  }`}>
                                    {session.messageCount} msgs
                                  </span>
                                )}
                              </div>
                              
                              {/* Action Icons */}
                              <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200`}>
                                <button
                                  onClick={(e) => handleRenameSession(session.sessionId, session.title, e)}
                                  className={`studybuddy-action-btn p-1.5 rounded-md transition-all hover:scale-110 ${
                                    theme === 'dark' 
                                      ? 'hover:bg-gray-700/50 text-gray-400 hover:text-blue-400' 
                                      : 'hover:bg-gray-200/50 text-gray-500 hover:text-blue-600'
                                  }`}
                                  title="Rename chat"
                                >
                                  <Edit3 className="w-3.5 h-3.5 relative z-10" />
                                </button>
                                
                                <button
                                  onClick={(e) => handleShareSession(session.sessionId, e)}
                                  className={`studybuddy-action-btn p-1.5 rounded-md transition-all hover:scale-110 ${
                                    theme === 'dark' 
                                      ? 'hover:bg-gray-700/50 text-gray-400 hover:text-green-400' 
                                      : 'hover:bg-gray-200/50 text-gray-500 hover:text-green-600'
                                  }`}
                                  title="Share chat"
                                >
                                  <Share className="w-3.5 h-3.5 relative z-10" />
                                </button>
                                
                                <button
                                  onClick={(e) => handleDeleteSession(session.sessionId, e)}
                                  className={`studybuddy-action-btn p-1.5 rounded-md transition-all hover:scale-110 ${
                                    theme === 'dark' 
                                      ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' 
                                      : 'hover:bg-red-500/20 text-gray-500 hover:text-red-600'
                                  }`}
                                  title="Delete chat"
                                >
                                  <Trash2 className="w-3.5 h-3.5 relative z-10" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="p-2 space-y-3">
                  {sessions === undefined ? (
                    // Simple Loading state for collapsed sidebar - just outline color changing
                    [1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`p-3 rounded-xl transition-all ${
                        theme === 'dark' ? 'bg-gray-800/20' : 'bg-gray-100/20'
                      }`}>
                        {/* Simple outline color-changing message icon */}
                        <div className="w-6 h-6 mx-auto relative">
                          <MessageCircle className={`w-6 h-6 ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          } studybuddy-loading-icon`} 
                          style={{animationDelay: `${i * 0.2}s`}} />
                        </div>
                      </div>
                    ))
                  ) : (
                    filteredSessions.slice(0, 8).map((session) => (
                    <div
                      key={session._id}
                      onClick={() => router.push(`/home/studybuddy/${session.sessionId}`)}
                      className={`p-3 rounded-xl cursor-pointer transition-all backdrop-blur-sm hover:scale-110 ${
                        pathname.includes(session.sessionId)
                          ? theme === 'dark' ? 'bg-blue-900/50 shadow-lg' : 'bg-blue-50/50 shadow-lg'
                          : theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100/50'
                      }`}
                      title={session.title}
                    >
                      <MessageCircle className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mx-auto`} />
                    </div>
                  )))}
                </div>
              )}
            </div>

            {/* Enhanced User Profile Section */}
            <div className={`border-t ${theme === 'dark' ? 'border-gray-700/30' : 'border-gray-200/30'}`}>
              {sidebarOpen ? (
                <div className="p-4">
                  <div 
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all backdrop-blur-sm hover:scale-[1.02] ${
                      theme === 'dark' ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50/30'
                    }`}
                    onClick={() => setShowUserSettings(!showUserSettings)}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 flex items-center justify-center shadow-lg`}>
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} truncate text-sm`}>
                        {user?.username || 'User'}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                        {user?.email || 'user@example.com'}
                      </p>
                    </div>
                    <Settings className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} transition-transform ${showUserSettings ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {/* Enhanced User Settings Dropdown */}
                  {showUserSettings && (
                    <div className={`mt-3 p-3 rounded-xl border backdrop-blur-sm shadow-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-800/50 border-gray-700/30' 
                        : 'bg-gray-50/50 border-gray-200/30'
                    }`}>
                      <div className="space-y-1">
                        <div className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${
                          theme === 'dark' ? 'text-gray-300 bg-gray-700/30' : 'text-gray-600 bg-gray-100/30'
                        }`}>
                          <Mail className="w-4 h-4" />
                          <span className="truncate font-medium">{user?.email || 'user@example.com'}</span>
                        </div>
                        
                        <button
                          onClick={toggleTheme}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-lg hover:scale-105 transition-all text-sm font-medium ${
                            theme === 'dark' 
                              ? 'text-gray-300 hover:bg-gray-700/50' 
                              : 'text-gray-600 hover:bg-gray-200/50'
                          }`}
                        >
                          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </button>
                        
                        <button
                          onClick={handleGoHome}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition-all text-sm font-medium ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        >
                          <Home className="w-4 h-4" />
                          Go Home
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3">
                  <div 
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 flex items-center justify-center mx-auto cursor-pointer hover:scale-110 transition-all shadow-lg`}
                    onClick={() => setSidebarOpen(true)}
                    title={user?.username || 'User - Click to open sidebar'}
                  >
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Main Content Area */}
          <div className={`flex-1 ${sidebarOpen ? (isMobile ? 'ml-0' : 'ml-80') : 'ml-16'} transition-all duration-300 flex flex-col relative ${
            theme === 'dark' ? 'bg-black' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
          }`}>
            {/* Vignette Effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className={`absolute inset-0 ${
                theme === 'dark' 
                  ? 'bg-gradient-to-t from-black/20 via-transparent to-black/10' 
                  : 'bg-gradient-to-t from-gray-100/20 via-transparent to-gray-50/10'
              }`}></div>
            </div>
            
            <div className="relative z-10 flex-1">
              {children}
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Overlay */}
        {sidebarOpen && isMobile && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
      </SidebarContext.Provider>
    </ProtectedRoute>
  );
}
