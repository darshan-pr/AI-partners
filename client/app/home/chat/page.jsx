'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Search, Upload, Brain, X, Copy, Edit, Trash2, Check, Plus } from 'lucide-react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "Hello! I'm your **AI assistant**. How can I help you today? Try asking me something or uploading a file!",
      role: 'assistant',
      timestamp: new Date(),
      type: 'text',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const [responseMode, setResponseMode] = useState(null);

  useEffect(() => {
    marked.setOptions({
      highlight: function(code, lang) {
        const validLang = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language: validLang }).value;
      },
      breaks: true,
      gfm: true,
    });
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setIsDark(savedTheme === 'dark');
    document.documentElement.className = savedTheme;

    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const handleLogin = (event) => {
      const userData = event.detail || JSON.parse(localStorage.getItem('user'));
      setUser(userData);
    };

    const handleStorage = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
      const theme = localStorage.getItem('theme') || 'dark';
      setIsDark(theme === 'dark');
      document.documentElement.className = theme;
    };

    const handleThemeChange = (event) => {
      setIsDark(event.detail.isDark);
      document.documentElement.className = event.detail.isDark ? 'dark' : 'light';
      localStorage.setItem('theme', event.detail.isDark ? 'dark' : 'light');
    };

    window.addEventListener('userLoggedIn', handleLogin);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('themeChanged', handleThemeChange);

    return () => {
      window.removeEventListener('userLoggedIn', handleLogin);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

useEffect(() => {
  if (messagesEndRef.current) {
    // Add a small delay to ensure DOM is updated
    setTimeout(() => {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  }
}, [messages, isLoading]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) {
        if (selectedFile.size > 10 * 1024 * 1024) {
          alert('Image file too large. Please select an image under 10MB.');
          return;
        }
      } else if (selectedFile.size > 25 * 1024 * 1024) {
        alert('File too large. Please select a file under 25MB.');
        return;
      }
      
      setFile(selectedFile);
      setShowOptions(false);
      setSelectedMode('upload');
    }
  };

  const resendEditedMessage = async (originalMessage, newContent) => {
  setIsLoading(true);
  
  try {
    const formData = new FormData();
    formData.append('message', newContent);
    
    // Get message history up to the edited message (excluding it)
    const messageIndex = messages.findIndex(msg => msg.id === originalMessage.id);
    const historyUpToEdit = messages.slice(0, messageIndex);
    
    formData.append('history', JSON.stringify(historyUpToEdit.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))));
    
    // Add original message properties if they exist
    if (originalMessage.hasWebSearch) formData.append('webSearch', 'true');
    if (originalMessage.hasThinking) formData.append('thinkMode', 'true');
    if (['euro-2024', 'occams-razor', 'summarize-pdf'].includes(originalMessage.mode)) {
      formData.append('action', originalMessage.mode);
    }
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      const assistantMessage = {
        id: Date.now() + 1,
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text',
        thinking: data.thinking || null,
        searchResults: data.searchResults || null,
        key: `assistant-${Date.now()}`,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } else {
      throw new Error(data.error || 'Failed to get response');
    }
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = {
      id: Date.now() + 1,
      content: `Sorry, I encountered an error: ${error.message}`,
      role: 'assistant',
      timestamp: new Date(),
      type: 'error',
      key: `error-${Date.now()}`,
    };
    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
  }
};

  const sendMessage = async (e) => {
    e?.preventDefault();
    
    if (isLoading) return;
    
    if (!input.trim() && !file && !selectedMode) return;

    const modeLabel = selectedMode;
    let messageContent = '';
    if (file) {
      messageContent = `${modeLabel}${input.trim() || `Analyzing ${file.name}`}`;
    } else if (selectedMode && !input.trim()) {
      messageContent = `${modeLabel}${getActionLabel(selectedMode)}`;
    } else {
      messageContent = `${input.trim()}`;
    }

    const userMessage = {
      id: Date.now(),
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
      type: file ? (file.type.startsWith('image/') ? 'image' : 'file') : 'text',
      file: file ? URL.createObjectURL(file) : null,
      hasWebSearch: selectedMode === 'web-search' || selectedMode === 'search-think' || selectedMode === 'euro-2024',
      hasThinking: selectedMode === 'thinking' || selectedMode === 'search-think' || selectedMode === 'euro-2024' || selectedMode === 'occams-razor',
      key: `user-${Date.now()}`,
      mode: selectedMode,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const currentFile = file;
    setFile(null);
    setIsLoading(true);
    setShowOptions(false);
    const currentMode = selectedMode;
    setSelectedMode(null);
    setResponseMode(currentMode);

    if (inputRef.current) {
      inputRef.current.style.height = '48px';
    }

    try {
      const formData = new FormData();
      formData.append('message', messageContent);
      formData.append('history', JSON.stringify(messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }))));
      
      if (currentFile) formData.append('file', currentFile);
      if (userMessage.hasWebSearch) formData.append('webSearch', 'true');
      if (userMessage.hasThinking) formData.append('thinkMode', 'true');
      if (['euro-2024', 'occams-razor', 'summarize-pdf'].includes(currentMode)) {
        formData.append('action', currentMode);
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          content: data.message,
          role: 'assistant',
          timestamp: new Date(),
          type: 'text',
          thinking: data.thinking || null,
          searchResults: data.searchResults || null,
          key: `assistant-${Date.now()}`,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        content: `Sorry, I encountered an error: ${error.message}`,
        role: 'assistant',
        timestamp: new Date(),
        type: 'error',
        key: `error-${Date.now()}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setResponseMode(null);
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      'euro-2024': 'Who won Euro 2024?',
      'occams-razor': 'Explain Occam\'s Razor',
      'summarize-pdf': 'Summarize uploaded PDF',
    };
    return labels[action] || action;
  };

  const getModeLabel = (mode) => {
    const modeLabels = {
      'web-search': 'Web Search',
      'thinking': 'Thinking',
      'search-think': 'Search + Think',
      'upload': 'File Upload',
      'euro-2024': 'Euro 2024 Winner',
      'occams-razor': 'Occam\'s Razor Demo',
      'summarize-pdf': 'Summarize PDF',
    };
    return modeLabels[mode] || mode;
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  const deleteMessage = (messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const startEdit = (message) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

const saveEdit = async (messageId) => {
  const messageIndex = messages.findIndex(msg => msg.id === messageId);
  const message = messages[messageIndex];
  
  if (message.role === 'user') {
    // Update the message content
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, content: editContent, edited: true } : msg
    );
    
    // Remove all messages after the edited user message
    const messagesUpToEdit = updatedMessages.slice(0, messageIndex + 1);
    setMessages(messagesUpToEdit);
    
    setEditingMessage(null);
    setEditContent('');
    
    // Resend the edited message
    await resendEditedMessage(message, editContent);
  } else {
    // For assistant messages, just update the content
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, content: editContent, edited: true } : msg
    ));
    setEditingMessage(null);
    setEditContent('');
  }
};

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('theme', newTheme);
    document.documentElement.className = newTheme;
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark: !isDark } }));
  };

  const selectMode = (mode) => {
    setSelectedMode(mode);
    setShowOptions(false);
  };

  const Message = ({ message }) => {
    const isUser = message.role === 'user';
    const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const isEditing = editingMessage === message.id;

    const renderModeIndicator = () => {
      if (!message.mode) return null;
      const modeLabels = {
        'web-search': { icon: <Search className="w-3 h-3 md:w-4 md:h-4" />, label: 'Web Search', bg: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700' },
        'thinking': { icon: <Brain className="w-3 h-3 md:w-4 md:h-4" />, label: 'Thinking', bg: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700' },
        'search-think': { icon: [<Search className="w-3 h-3 md:w-4 md:h-4" key="search" />, <Brain className="w-3 h-3 md:w-4 md:h-4" key="brain" />], label: 'Search + Think', bg: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700' },
        'upload': { icon: <Upload className="w-3 h-3 md:w-4 md:h-4" />, label: 'File Upload', bg: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' },
        'euro-2024': { icon: <Search className="w-3 h-3 md:w-4 md:h-4" />, label: 'Euro 2024 Winner', bg: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700' },
        'occams-razor': { icon: <Brain className="w-3 h-3 md:w-4 md:h-4" />, label: 'Occam\'s Razor Demo', bg: 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-700' },
        'summarize-pdf': { icon: <Upload className="w-3 h-3 md:w-4 md:h-4" />, label: 'Summarize PDF', bg: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' },
      };
      const mode = modeLabels[message.mode] || { icon: null, label: getModeLabel(message.mode), bg: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600' };
      return (
        <div className={`flex items-center space-x-2 ${mode.bg} border rounded-lg px-2 py-1 text-xs md:text-sm shadow-sm mb-2 animate-fade-in`}>
          {Array.isArray(mode.icon) ? mode.icon : mode.icon}
          <span className="truncate font-medium">{mode.label}</span>
        </div>
      );
    };

    const renderContent = () => {
      if (isEditing) {
        return (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none min-h-[80px] text-sm md:text-base"
              style={{ 
            direction: 'ltr !important', 
            textAlign: 'left !important',
            unicodeBidi: 'embed',
            writingMode: 'horizontal-tb',
            textDirection: 'ltr'
          }}
          dir="ltr"
          lang="en"
          spellCheck="false"
          autoComplete="off"
          autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={() => saveEdit(message.id)}
                className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs md:text-sm"
              >
                <Check className="w-3 h-3 md:w-4 md:h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center space-x-1 px-2 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs md:text-sm"
              >
                <X className="w-3 h-3 md:w-4 md:h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        );
      }

      if (message.role === 'assistant' && message.type !== 'error') {
        return (
          <div className="message-content">
            <div
              className="prose prose-sm max-w-none dark:prose-invert prose-pre:bg-gray-900 dark:prose-pre:bg-gray-800 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:text-gray-900 dark:prose-code:text-gray-100 text-sm md:text-base"
              dangerouslySetInnerHTML={{
                __html: marked(message.content, {
                  highlight: (code, lang) => {
                    const validLang = hljs.getLanguage(lang) ? lang : 'plaintext';
                    return hljs.highlight(code, { language: validLang }).value;
                  },
                })
              }}
            />
            {message.edited && (
              <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                (edited)
              </span>
            )}
          </div>
        );
      }
      return (
        <div>
          <p className="whitespace-pre-wrap text-sm md:text-base">{message.content}</p>
          {message.edited && (
            <span className="text-xs text-gray-500 dark:text-gray-400 italic">
              (edited)
            </span>
          )}
        </div>
      );
    };

    return (
      <div key={message.key || message.id} className={`flex mb-4 animate-slide-in ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex items-start space-x-2 md:space-x-3 max-w-[80%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : ''}`}>
          {/* Avatar */}
          <div className="flex-shrink-0 mt-1 ml-2">
            {isUser ? (
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center transform transition-transform hover:scale-110">
                <User className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </div>
            ) : (
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center transform transition-transform hover:scale-110">
                <Bot className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </div>
            )}
          </div>
          
          <div className="group relative flex-1">
            {/* Mode indicator for both user and assistant */}
            {message.mode && (
              <div className="mb-2 animate-fade-in flex justify-start ">
                {(() => {
                  const modeLabels = {
                    'web-search': { icon: <Search className="w-3 h-3 md:w-4 md:h-4" />, label: 'Web Search', bg: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700' },
                    'thinking': { icon: <Brain className="w-3 h-3 md:w-4 md:h-4" />, label: 'Thinking', bg: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700' },
                    'search-think': { icon: [<Search className="w-3 h-3 md:w-4 md:h-4" key="search" />, <Brain className="w-3 h-3 md:w-4 md:h-4" key="brain" />], label: 'Search + Think', bg: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700' },
                    'upload': { icon: <Upload className="w-3 h-3 md:w-4 md:h-4" />, label: 'File Upload', bg: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' },
                    'euro-2024': { icon: <Search className="w-3 h-3 md:w-4 md:h-4" />, label: 'Euro 2024 Winner', bg: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700' },
                    'occams-razor': { icon: <Brain className="w-3 h-3 md:w-4 md:h-4" />, label: 'Occam\'s Razor Demo', bg: 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-700' },
                    'summarize-pdf': { icon: <Upload className="w-3 h-3 md:w-4 md:h-4" />, label: 'Summarize PDF', bg: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' },
                  };
                  const mode = modeLabels[message.mode] || { icon: null, label: message.mode, bg: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600' };
                  return (
                    <div
                      className={`flex items-center space-x-2 ${mode.bg} border rounded-lg px-2 py-1 text-xs md:text-sm shadow-sm`}
                      style={{ maxWidth: '120px', minWidth: 0, width: 'fit-content' }}
                    >
                      {Array.isArray(mode.icon) ? mode.icon : mode.icon}
                      <span className="truncate font-medium">{mode.label}</span>
                    </div>
                  );
                })()}
              </div>
            )}
            <div className={`p-3 md:p-4 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md ${
              isUser 
                ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
            }`}>
              {message.file && (
                <div className="mb-2">
                  {message.type === 'image' ? (
                    <div className="relative">
                      <img 
                        src={message.file} 
                        alt="Uploaded image" 
                        className="max-w-full h-auto max-h-64 rounded-lg shadow-sm transition-transform duration-300 hover:scale-[1.02] object-contain" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="hidden p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <Upload className="w-4 h-4 md:w-5 md:h-5" />
                          <span>Image preview not available</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Upload className="w-4 h-4" />
                      <span className="text-xs md:text-sm truncate">{message.content.includes('Uploaded') ? message.content : `File: ${message.file?.name || 'Unknown'}`}</span>
                    </div>
                  )}
              
                </div>
              )}
              
              
              {message.thinking && (
                <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg border border-purple-200 dark:border-purple-700/50 animate-fade-in">
                  <div className="flex items-center space-x-2 mb-2">
                    <Brain className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs md:text-sm font-semibold text-purple-800 dark:text-purple-300">AI Thinking Process</span>
                  </div>
                  <div className="text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed bg-white dark:bg-gray-800/50 p-2 rounded-lg border border-purple-100 dark:border-purple-700/30 max-h-48 overflow-y-auto">
                    {message.thinking}
                  </div>
                </div>
              )}
              
              {message.searchResults && (
                <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border border-green-200 dark:border-green-700/50 animate-fade-in">
                  <div className="flex items-center space-x-2 mb-2">
                    <Search className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
                    <span className="text-xs md:text-sm font-semibold text-green-800 dark:text-green-300">Web Search Results</span>
                  </div>
                  <div className="text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-gray-800/50 p-2 rounded-lg border border-green-100 dark:border-green-700/30 max-h-32 overflow-y-auto">
                    {message.searchResults}
                  </div>
                </div>
              )}
              
              {renderContent()}
            </div>
            
            <div className={`absolute ${isUser ? 'left-0' : 'right-0'} top-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 ${isUser ? '-translate-x-full -ml-2' : 'translate-x-full ml-2'}`}>
              <button
                onClick={() => copyMessage(message.content)}
                className="p-1 md:p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Copy message"
              >
                <Copy className="w-3 h-3 md:w-4 md:h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => startEdit(message)}
                className="p-1 md:p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Edit message"
              >
                <Edit className="w-3 h-3 md:w-4 md:h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => deleteMessage(message.id)}
                className="p-1 md:p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                title="Delete message"
              >
                <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-red-600 dark:text-red-400" />
              </button>
            </div>

            <div className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${isUser ? 'text-right' : 'text-left'}`}>
              {timestamp}
            </div>
          </div>
        </div>
      </div>
    );
  };
const TypingIndicator = ({ mode }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '');
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const modeConfig = {
    'web-search': {
      icon: <Search className="w-4 h-4 md:w-5 md:h-5 text-blue-500 animate-pulse" />,
      text: `Searching the web${dots}`,
      bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50',
      animation: 'animate-[pulse_1.5s_ease-in-out_infinite]',
    },
    'thinking': {
      icon: <Brain className="w-4 h-4 md:w-5 md:h-5 text-purple-500 animate-spin-slow" />,
      text: `Thinking deeply${dots}`,
      bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/50',
      animation: 'animate-[pulse_1.8s_ease-in-out_infinite]',
    },
    'search-think': {
      icon: <Search className="w-4 h-4 md:w-5 md:h-5 text-indigo-500 animate-bounce" />,
      text: `Searching and analyzing${dots}`,
      bg: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50',
      animation: 'animate-[bounce_1.2s_ease-in-out_infinite]',
    },
    'upload': {
      icon: <Upload className="w-4 h-4 md:w-5 md:h-5 text-green-500 animate-bounce" />,
      text: `Processing file${dots}`,
      bg: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/50',
      animation: 'animate-[bounce_1.5s_ease-in-out_infinite]',
    },
    'euro-2024': {
      icon: <Search className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 animate-pulse" />,
      text: `Fetching Euro 2024 data${dots}`,
      bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800/50',
      animation: 'animate-[pulse_1.5s_ease-in-out_infinite]',
    },
    'occams-razor': {
      icon: <Brain className="w-4 h-4 md:w-5 md:h-5 text-pink-500 animate-spin-slow" />,
      text: `Simplifying with Occam's Razor${dots}`,
      bg: 'bg-pink-50 dark:bg-pink-900/20 border-pink-100 dark:border-pink-800/50',
      animation: 'animate-[pulse_1.8s_ease-in-out_infinite]',
    },
    'summarize-pdf': {
      icon: <Upload className="w-4 h-4 md:w-5 md:h-5 text-green-500 animate-bounce" />,
      text: `Summarizing PDF${dots}`,
      bg: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/50',
      animation: 'animate-[bounce_1.5s_ease-in-out_infinite]',
    },
  };

  const config = modeConfig[mode] || {
    icon: <Bot className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 animate-pulse" />,
    text: `Responding${dots}`,
    bg: 'bg-gray-50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-700/50',
    animation: 'animate-[pulse_1.5s_ease-in-out_infinite]',
  };

  return (
    <div className="flex justify-start mb-4 animate-fade-in">
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${config.bg} border ${config.animation}`}>
          {config.icon}
        </div>
        <div className={`border p-2.5 rounded-xl shadow-sm ${config.bg} ${config.animation}`}>
          <span className="font-medium text-sm md:text-base text-gray-800 dark:text-gray-200">{config.text}</span>
        </div>
      </div>
    </div>
  );
};

  return (
    <ProtectedRoute>
      <div className={`flex flex-col min-h-screen ${isDark ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col transition-colors duration-300">
        <main className="flex-1 overflow-y-auto pt-24 pb-24 w-[92vw] md:w-[76.5vw] mx-auto px-2 md:px-4">
          {messages.map((message) => (
            <Message key={message.key || message.id} message={message} />
          ))}
          {isLoading && <TypingIndicator mode={responseMode} />}
          <div ref={messagesEndRef} className="h-28" />
        </main>

    <div className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300">
        {/* Compact gradient backdrop blur - only extends to input panel height */}
        <div className="absolute inset-0 bg-transparent dark:to-black backdrop-blur-sm" style={{height: showOptions ? 'auto' : '130px'}}></div>

        <div className="relative w-[92vw] md:w-[76.5vw] mx-auto  px-2 md:px-4 pb-2 md:pb-4">
          <form onSubmit={sendMessage} className="relative">
            {/* Compact Modern Options Panel */}
            {showOptions && (
              <div className="absolute bottom-full mb-3 left-0 right-0 animate-slide-up">
                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/30 dark:border-gray-700/30 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>AI Modes</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowOptions(false)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Compact Grid - Claude/GPT Style */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {[
                      { mode: 'web-search', icon: <Search className="w-3.5 h-3.5" />, label: 'Web Search', color: 'blue' },
                      { mode: 'thinking', icon: <Brain className="w-3.5 h-3.5" />, label: 'Deep Think', color: 'purple' },
                      { mode: 'search-think', icon: [<Search className="w-2.5 h-2.5" key="search" />, <Brain className="w-2.5 h-2.5" key="brain" />], label: 'Search + Think', color: 'indigo' },
                      { mode: 'upload', icon: <Upload className="w-3.5 h-3.5" />, label: 'Upload File', color: 'green' },
                      { mode: 'euro-2024', icon: <Search className="w-3.5 h-3.5" />, label: 'Euro 2024', color: 'yellow' },
                      { mode: 'occams-razor', icon: <Brain className="w-3.5 h-3.5" />, label: 'Occam\'s Razor', color: 'pink' },
                    ].map(({ mode, icon, label, color }) => {
                      const colorClasses = {
                        blue: 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400',
                        purple: 'hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400',
                        indigo: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
                        green: 'hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400',
                        yellow: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
                        pink: 'hover:bg-pink-50 dark:hover:bg-pink-900/20 text-pink-600 dark:text-pink-400',
                      };
                      
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => mode === 'upload' ? fileInputRef.current?.click() : selectMode(mode)}
                          className={`group relative p-2.5 rounded-lg transition-all duration-200 ${colorClasses[color]} ${selectedMode === mode ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-200 dark:ring-blue-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                        >
                          <div className="flex flex-col items-center space-y-1.5">
                            <div className="flex items-center justify-center">
                              {Array.isArray(icon) ? (
                                <div className="flex space-x-0.5">
                                  {icon}
                                </div>
                              ) : icon}
                            </div>
                            <div className="text-xs font-medium text-center leading-tight px-1">
                              {label}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* File Preview - More Compact */}
            {file && (
              <div className="mb-3 animate-fade-in">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt="File preview"
                          className="w-12 h-12 object-cover rounded-lg shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg transition-all hover:bg-red-100 dark:hover:bg-red-900/50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Main Input Area - Claude/GPT Style */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/40 dark:border-gray-700/40 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="flex items-end space-x-3 p-3">
                {/* Compact Options Button */}
                <button
                  type="button"
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex-shrink-0 p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-all group"
                  title="AI Modes"
                >
                  <Plus className={`w-4 h-4 transition-all duration-300 ${showOptions ? 'rotate-45' : 'group-hover:rotate-90'}`} />
                </button>

                {/* Input Container */}
                <div className="flex-1 relative">
                  {/* Compact Mode Indicator */}
                  {selectedMode && !file && (
                    <div className="mb-2 animate-fade-in">
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>{selectedMode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        <button
                          onClick={() => setSelectedMode(null)}
                          className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Text Input */}
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Message AI Partner..."
                    className="w-full p-0 text-base border-0 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none transition-all duration-300 focus:outline-none min-h-[20px] max-h-[120px]"
                    rows={1}
                    disabled={isLoading}
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !file && !selectedMode)}
                  className="flex-shrink-0 p-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 dark:bg-white dark:hover:bg-gray-100 dark:disabled:bg-gray-600 text-white dark:text-gray-900 rounded-lg shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
                  title="Send message"
                >
                  <Send className={`w-4 h-4 transition-all duration-300 ${isLoading ? 'animate-pulse' : 'group-hover:translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.json,.csv,.xlsx,.xls"
            />
          </form>
        </div>
      </div>

        <style jsx>{`
          @keyframes slide-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fade-in {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          .animate-slide-in {
            animation: slide-in 0.3s ease-out;
          }

          .animate-slide-up {
            animation: slide-up 0.2s ease-out;
          }

          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }

          .message-content {
            word-wrap: break-word;
            overflow-wrap: break-word;
          }

          .message-content pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-width: 100%;
            overflow-x: auto;
          }

          .message-content code {
            word-wrap: break-word;
            overflow-wrap: break-word;
          }

          .prose pre code {
            background: transparent !important;
          }
          
          .prose pre {
            position: relative;
            padding: 0.75rem !important;
            border-radius: 0.5rem !important;
            margin: 0.75rem 0 !important;
            overflow-x: auto;
          }

          .prose code:not(pre code) {
            padding: 0.1rem 0.2rem !important;
            border-radius: 0.25rem !important;
            font-size: 0.85em !important;
          }

          .prose table {
            margin: 0.75rem 0 !important;
            border-collapse: collapse !important;
            width: 100% !important;
          }

          .prose th,
          .prose td {
            border: 1px solid #e5e7eb !important;
            padding: 0.4rem !important;
            text-align: left !important;
          }

          .dark .prose th,
          .dark .prose td {
            border-color: #374151 !important;
          }

          .prose th {
            background-color: #f9fafb !important;
            font-weight: 600 !important;
          }

          .dark .prose th {
            background-color: #1f2937 !important;
          }

          .prose blockquote {
            border-left: 3px solid #e5e7eb !important;
            padding-left: 0.75rem !important;
            margin: 0.75rem 0 !important;
            font-style: italic !important;
          }

          .dark .prose blockquote {
            border-left-color: #374151 !important;
          }

          .prose ul,
          .prose ol {
            padding-left: 1.25rem !important;
            margin: 0.4rem 0 !important;
          }

          .prose li {
            margin: 0.2rem 0 !important;
          }

          .prose h1,
          .prose h2,
          .prose h3,
          .prose h4,
          .prose h5,
          .prose h6 {
            margin: 0.75rem 0 0.4rem 0 !important;
            font-weight: 600 !important;
          }

          .prose p {
            margin: 0.4rem 0 !important;
          }

          .prose a {
            color: #3b82f6 !important;
            text-decoration: underline !important;
          }

          .dark .prose a {
            color: #60a5fa !important;
          }

          .prose a:hover {
            text-decoration: none !important;
          }

          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }

          ::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
          }

          .dark ::-webkit-scrollbar-track {
            background: #1e293b;
          }

          ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }

          .dark ::-webkit-scrollbar-thumb {
            background: #475569;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }

          .dark ::-webkit-scrollbar-thumb:hover {
            background: #64748b;
          }
            @keyframes spin-slow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
          }
        `}</style>
      </div>
      </div>
    </ProtectedRoute>
  );
}