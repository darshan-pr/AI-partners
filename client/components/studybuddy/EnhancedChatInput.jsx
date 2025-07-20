'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Radio,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Minimize2,
  BookOpen
} from 'lucide-react';
import AgentStatusHeader from '../AgentStatusHeader';
import { VoiceSelector } from '../../lib/VoiceSelector';
import KnowledgeNestFileSelector from '../KnowledgeNestFileSelector';

const EnhancedChatInput = ({
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
  username
}) => {
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [showKnowledgeNestSelector, setShowKnowledgeNestSelector] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, right: 0 });
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceError, setVoiceError] = useState(null);
  const [currentAgent, setCurrentAgent] = useState('general');
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const attachButtonRef = useRef(null);
  const infoButtonRef = useRef(null);
  const wsRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFileSelector && !event.target.closest('.file-selector-dropdown') && !event.target.closest('[data-attach-button]')) {
        setShowFileSelector(false);
      }
      if (showInfoTooltip && !event.target.closest('[data-info-button]')) {
        setShowInfoTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFileSelector, showInfoTooltip]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && !isVoiceMode) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message, isVoiceMode]);

  // Voice connection management
  useEffect(() => {
    if (isVoiceMode) {
      initializeVoiceConnection();
    } else {
      cleanupVoice();
    }
    return cleanupVoice;
  }, [isVoiceMode]);

  const initializeVoiceConnection = async () => {
    try {
      // Initialize WebSocket server
      await fetch('/api/studybuddy-voice-live?action=init_websocket');
      
      // Connect to WebSocket
      wsRef.current = new WebSocket('ws://localhost:8080');
      
      wsRef.current.onopen = () => {
        setIsVoiceConnected(true);
        setVoiceError(null);
        
        // Initialize session
        wsRef.current.send(JSON.stringify({
          type: 'init_session',
          data: {
            username: username,
            multiAgentMode: multiAgentMode
          }
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };
      
      wsRef.current.onclose = () => {
        setIsVoiceConnected(false);
        setIsListening(false);
        setIsProcessing(false);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setVoiceError('Connection error occurred');
        setIsVoiceConnected(false);
      };
      
    } catch (error) {
      console.error('Failed to initialize voice connection:', error);
      setVoiceError('Failed to connect to voice service');
    }
  };

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'connected':
        console.log('Voice session established:', message.sessionId);
        break;
        
      case 'session_initialized':
        console.log('Session initialized with multi-agent mode:', message.multiAgentMode);
        break;
        
      case 'listening_started':
        setIsListening(true);
        setIsProcessing(false);
        setVoiceTranscript('');
        break;
        
      case 'listening_stopped':
        setIsListening(false);
        break;
        
      case 'processing':
        setIsProcessing(true);
        setIsListening(false);
        setCurrentAgent(message.agentStatus?.currentAgent || 'general');
        break;
        
      case 'voice_response':
        setIsProcessing(false);
        setCurrentAgent(message.agentType || 'general');
        speakResponse(message.response);
        break;
        
      case 'error':
        setVoiceError(message.error);
        setIsProcessing(false);
        setIsListening(false);
        break;
    }
  };

  const initializeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setVoiceError('Speech recognition not supported in this browser');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      
      setVoiceTranscript(text);
      
      if (event.results[last].isFinal) {
        handleVoiceInput(text);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setVoiceError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return true;
  };

  const initializeAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      microphoneRef.current.connect(analyserRef.current);
      
      updateAudioLevel();
    } catch (error) {
      console.error('Failed to initialize audio visualization:', error);
    }
  };

  const updateAudioLevel = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / bufferLength;
    setAudioLevel(average / 255);
    
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const handleVoiceInput = (transcriptText) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'voice_input',
        data: { transcript: transcriptText }
      }));
    }
  };

  const speakResponse = (text) => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      return;
    }

    setIsSpeaking(true);
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Use standard voice selector for most reliable voice
    const selectedVoice = VoiceSelector.getStandardVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      const settings = VoiceSelector.getOptimalSettings(selectedVoice);
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;
    } else {
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
    }
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
    };
    
    speechSynthesis.speak(utterance);
  };

  const toggleVoiceMode = async () => {
    setIsVoiceMode(!isVoiceMode);
    if (!isVoiceMode) {
      setMessage(''); // Clear text input when switching to voice
    }
  };

  const toggleListening = async () => {
    if (!isVoiceConnected) return;

    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: 'stop_listening' }));
      }
    } else {
      // Start listening
      if (!recognitionRef.current) {
        if (!initializeSpeechRecognition()) return;
      }
      
      if (!audioContextRef.current) {
        await initializeAudioVisualization();
      }
      
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: 'start_listening' }));
      }
      
      recognitionRef.current.start();
    }
  };

  const stopSpeaking = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const cleanupVoice = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    // Reset states
    setIsVoiceConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setVoiceTranscript('');
    setAudioLevel(0);
    setVoiceError(null);
  };

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
    if (attachButtonRef.current) {
      const rect = attachButtonRef.current.getBoundingClientRect();
      const dropdownHeight = 280; // Approximate height of dropdown
      let top = rect.top - 8; // Position above the button with some margin
      
      // Check if dropdown would go above viewport
      if (top - dropdownHeight < 0) {
        top = rect.bottom + 8; // Position below the button instead
      }
      
      setDropdownPosition({
        top: top,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 264 - 8)) // Keep within viewport width
      });
    }
    setShowFileSelector(true);
  };

  const handleInfoHover = (show) => {
    if (show && infoButtonRef.current) {
      const rect = infoButtonRef.current.getBoundingClientRect();
      const tooltipHeight = 200; // Approximate height of tooltip
      let top = rect.top - 8; // Position above the button
      
      // Check if tooltip would go above viewport
      if (top - tooltipHeight < 0) {
        top = rect.bottom + 8; // Position below the button instead
      }
      
      setTooltipPosition({
        top: top,
        right: Math.max(8, window.innerWidth - rect.right)
      });
    }
    setShowInfoTooltip(show);
  };

  const handleKnowledgeNestClick = () => {
    setShowKnowledgeNestSelector(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect && onFileSelect(file);
      setShowFileSelector(false);
    }
  };

  const handleKnowledgeNestFileSelect = (file) => {
    // Convert Knowledge Nest file to a format similar to File object
    const knowledgeNestFile = {
      name: file.filename,
      size: file.size,
      type: file.mimetype,
      lastModified: file.upload_timestamp,
      // Add Knowledge Nest specific properties
      isKnowledgeNestFile: true,
      fileId: file._id,
      fileUrl: file.url,
      subject: file.subject,
      uploadedBy: file.uploaded_username
    };
    
    setSelectedFile(knowledgeNestFile);
    onFileSelect && onFileSelect(knowledgeNestFile);
    setShowKnowledgeNestSelector(false);
  };

  // Get voice status colors
  const getVoiceStatusColors = () => {
    if (!isVoiceMode) return null;
    
    if (isListening) {
      return {
        primary: 'rgb(34, 197, 94)', // green
        secondary: 'rgb(16, 185, 129)', // emerald
        glow: 'rgba(34, 197, 94, 0.3)'
      };
    } else if (isProcessing) {
      return {
        primary: 'rgb(59, 130, 246)', // blue
        secondary: 'rgb(99, 102, 241)', // indigo
        glow: 'rgba(59, 130, 246, 0.3)'
      };
    } else if (isSpeaking) {
      return {
        primary: 'rgb(147, 51, 234)', // purple
        secondary: 'rgb(168, 85, 247)', // violet
        glow: 'rgba(147, 51, 234, 0.3)'
      };
    } else if (isVoiceConnected) {
      return {
        primary: 'rgb(99, 102, 241)', // indigo
        secondary: 'rgb(139, 92, 246)', // violet
        glow: 'rgba(99, 102, 241, 0.2)'
      };
    }
    
    return {
      primary: 'rgb(239, 68, 68)', // red for error
      secondary: 'rgb(248, 113, 113)',
      glow: 'rgba(239, 68, 68, 0.3)'
    };
  };

  const voiceColors = getVoiceStatusColors();

  return (
    <div className={`fixed bottom-0 left-0 right-0 backdrop-blur-sm border-t transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent border-gray-800/50' 
        : 'bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent border-gray-200/50'
    } ${
      isMobile && sidebarOpen ? 'z-30' : 'z-50'
    }`}>
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
                  selectedFile.type?.startsWith('image/') 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : selectedFile.isKnowledgeNestFile
                      ? 'bg-purple-100 dark:bg-purple-900/30'
                      : 'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  {selectedFile.isKnowledgeNestFile ? (
                    <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  ) : selectedFile.type?.startsWith('image/') ? (
                    <Image className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {selectedFile.name}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} space-y-1`}>
                    <div>
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Unknown type'}
                    </div>
                    {selectedFile.isKnowledgeNestFile && (
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                        <BookOpen className="w-3 h-3" />
                        <span>From Knowledge Nest • {selectedFile.subject}</span>
                      </div>
                    )}
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

          {/* Voice Transcript Display */}
          {isVoiceMode && voiceTranscript && (
            <div className={`mb-4 p-3 rounded-xl border backdrop-blur-sm ${
              isDark 
                ? 'border-green-700/50 bg-green-900/20' 
                : 'border-green-200/50 bg-green-50/80'
            } shadow-sm`}>
              <div className="flex items-start gap-2">
                <Mic className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className={`text-xs font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    You're saying:
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    "{voiceTranscript}"
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Input Container - Enhanced for Voice Mode */}
          <div className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
            isVoiceMode && voiceColors
              ? `border-transparent shadow-2xl`
              : isLoading
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
          } backdrop-blur-md`}
          style={{
            ...(isVoiceMode && voiceColors && {
              backgroundImage: `linear-gradient(45deg, ${voiceColors.primary}10, ${voiceColors.secondary}10)`,
              boxShadow: `
                0 0 0 2px ${voiceColors.primary},
                0 0 20px ${voiceColors.glow},
                0 10px 25px rgba(0,0,0,0.2)
              `
            })
          }}>
            
            {/* Animated Voice Border - Fixed CSS conflicts */}
            {isVoiceMode && voiceColors && (
              <>
                {/* Outer animated border */}
                <div 
                  className={`absolute inset-0 rounded-2xl pointer-events-none voice-border-mask voice-border-animate ${
                    isListening || isProcessing || isSpeaking ? 'voice-active' : ''
                  }`}
                  style={{
                    backgroundImage: `linear-gradient(90deg, 
                      ${voiceColors.primary}, 
                      ${voiceColors.secondary}, 
                      ${voiceColors.primary}
                    )`,
                    padding: '2px'
                  }}
                />
                
                {/* Pulsing glow effect */}
                <div 
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 20px ${voiceColors.glow}`,
                    opacity: isListening ? 0.8 : isProcessing ? 0.6 : isSpeaking ? 0.7 : 0.4,
                    animation: isListening || isProcessing || isSpeaking ? 'voice-pulse 2s ease-in-out infinite' : 'none'
                  }}
                />
              </>
            )}
            
            {/* Loading State Indicator */}
            {isLoading && !isVoiceMode && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse rounded-t-2xl"></div>
            )}
            
            {/* Voice Status Indicator - More prominent */}
            {isVoiceMode && (
              <div 
                className="absolute top-0 left-0 right-0 h-2 rounded-t-2xl overflow-hidden"
                style={{
                  backgroundImage: voiceColors 
                    ? `linear-gradient(90deg, ${voiceColors.primary}, ${voiceColors.secondary}, ${voiceColors.primary})`
                    : 'linear-gradient(90deg, rgb(239, 68, 68), rgb(248, 113, 113), rgb(239, 68, 68))',
                  backgroundSize: '200% 100%',
                  animation: isListening || isProcessing || isSpeaking 
                    ? 'gradient-flow 1.5s ease infinite' 
                    : 'gradient-flow 3s ease infinite'
                }}
              >
                {/* Additional pulse effect for active states */}
                {(isListening || isProcessing || isSpeaking) && (
                  <div 
                    className="absolute inset-0 animate-pulse"
                    style={{
                      backgroundImage: `linear-gradient(90deg, 
                        ${voiceColors?.primary || 'rgb(239, 68, 68)'}, 
                        ${voiceColors?.secondary || 'rgb(248, 113, 113)'}, 
                        ${voiceColors?.primary || 'rgb(239, 68, 68)'}
                      )`,
                      opacity: 0.6
                    }}
                  />
                )}
              </div>
            )}
            
            <div className="flex items-end gap-2 sm:gap-3 p-1 sm:p-2">
              {/* Voice Mode Display or Text Input */}
              <div className="flex-1 relative">
                {isVoiceMode ? (
                  /* Voice Mode Interface - Gemini Live Style */
                  <div className="py-6 px-4">
                    {/* Voice Mode Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          isVoiceConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                        }`} />
                        <span className={`text-sm font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          StudyBuddy Live
                        </span>
                        {multiAgentMode && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isDark 
                              ? 'bg-blue-900/30 text-blue-300' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            Multi-Agent
                          </span>
                        )}
                      </div>
                      
                      {/* Exit Voice Mode Button - Prominent */}
                      <button
                        onClick={toggleVoiceMode}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          isDark 
                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-gray-200'
                        } hover:scale-105 shadow-sm`}
                        title="Exit voice mode"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-center gap-6">
                      {/* Voice Status Icon with Animation */}
                      <div className={`relative p-4 rounded-full transition-all duration-300 ${
                        isListening 
                          ? 'bg-green-500/20 scale-110'
                          : isProcessing
                            ? 'bg-blue-500/20 scale-105'
                            : isSpeaking
                              ? 'bg-purple-500/20 scale-105'
                              : isVoiceConnected
                                ? 'bg-indigo-500/20 scale-100'
                                : 'bg-red-500/20 scale-100'
                      }`}>
                        {/* Pulsing rings for active states */}
                        {(isListening || isProcessing || isSpeaking) && (
                          <>
                            <div className={`absolute inset-0 rounded-full border-2 animate-ping ${
                              isListening 
                                ? 'border-green-500/50'
                                : isProcessing
                                  ? 'border-blue-500/50'
                                  : 'border-purple-500/50'
                            }`} style={{ animationDuration: '1.5s' }} />
                            <div className={`absolute inset-2 rounded-full border-2 animate-ping ${
                              isListening 
                                ? 'border-green-500/30'
                                : isProcessing
                                  ? 'border-blue-500/30'
                                  : 'border-purple-500/30'
                            }`} style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                          </>
                        )}
                        
                        {isListening ? (
                          <Mic className="w-8 h-8 text-green-500" />
                        ) : isProcessing ? (
                          <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        ) : isSpeaking ? (
                          <Volume2 className="w-8 h-8 text-purple-500" />
                        ) : isVoiceConnected ? (
                          <Radio className="w-8 h-8 text-indigo-500" />
                        ) : (
                          <VolumeX className="w-8 h-8 text-red-500" />
                        )}
                      </div>
                      
                      {/* Status and Controls */}
                      <div className="flex-1 text-center">
                        <div className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {isListening ? 'Listening...' :
                           isProcessing ? (multiAgentMode ? 'Routing to agent...' : 'Processing...') :
                           isSpeaking ? 'Speaking...' :
                           isVoiceConnected ? 'Tap microphone to speak' :
                           voiceError ? 'Connection failed' : 'Connecting...'}
                        </div>
                        
                        {multiAgentMode && currentAgent && (isProcessing || isSpeaking) && (
                          <div className={`text-sm px-3 py-1 rounded-full inline-block ${
                            isDark 
                              ? 'bg-blue-900/30 text-blue-300' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            <span className="capitalize">{currentAgent}</span> agent
                          </div>
                        )}
                        
                        {voiceError && (
                          <div className="text-sm text-red-500 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            {voiceError}
                          </div>
                        )}
                      </div>
                      
                      {/* Audio Level Meter */}
                      {isListening && (
                        <div className="w-20">
                          <div className="text-xs text-center mb-1 text-gray-500">Audio</div>
                          <div className={`h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                            <div 
                              className="h-full rounded-full transition-all duration-100"
                              style={{ 
                                width: `${Math.min(audioLevel * 100, 100)}%`,
                                backgroundImage: voiceColors 
                                  ? `linear-gradient(to right, ${voiceColors.primary}, ${voiceColors.secondary})`
                                  : 'linear-gradient(to right, rgb(34, 197, 94), rgb(16, 185, 129))'
                              }}
                            />
                          </div>
                          <div className="text-xs text-center mt-1 text-gray-500">
                            {Math.round(audioLevel * 100)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Text Mode Interface */
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
                )}
                
                {/* Voice Mode Toggle and Info Icons */}
                {!isVoiceMode && (
                  <div className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {/* Voice Mode Toggle */}
                    <button
                      onClick={toggleVoiceMode}
                      className={`p-2 rounded-full transition-all duration-200 ${
                        isDark 
                          ? 'text-gray-500 hover:text-blue-400 hover:bg-gray-700/50 hover:scale-110' 
                          : 'text-gray-400 hover:text-blue-600 hover:bg-blue-100/50 hover:scale-110'
                      }`}
                      title="Switch to Live Voice Mode"
                    >
                      <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    
                    {/* Info Icon */}
                    <div className="relative info-tooltip-container">
                      <button
                        ref={infoButtonRef}
                        data-info-button
                        onMouseEnter={() => handleInfoHover(true)}
                        onMouseLeave={() => handleInfoHover(false)}
                        className={`p-1 rounded-full transition-colors ${
                          isDark 
                            ? 'text-gray-500 hover:text-gray-400 hover:bg-gray-700/50' 
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
                        }`}
                        title="Information"
                      >
                        <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                )}
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
                
                {/* Voice Mode Controls */}
                {isVoiceMode ? (
                  <>
                    {/* Main Voice Control Button - Gemini Live Style */}
                    <button
                      onClick={toggleListening}
                      disabled={!isVoiceConnected || isProcessing}
                      className={`relative p-4 rounded-full transition-all duration-300 transform ${
                        isListening
                          ? 'bg-red-500 text-white hover:bg-red-600 shadow-2xl scale-110 animate-pulse'
                          : isProcessing
                            ? 'bg-blue-500 text-white scale-105'
                            : isSpeaking
                              ? 'bg-purple-500 text-white scale-105'
                              : isVoiceConnected
                                ? 'bg-green-500 text-white hover:bg-green-600 shadow-xl hover:scale-110'
                                : 'bg-gray-500 text-white cursor-not-allowed'
                      } disabled:opacity-50 active:scale-95`}
                      style={{
                        boxShadow: isListening 
                          ? '0 0 30px rgba(239, 68, 68, 0.5)' 
                          : isVoiceConnected 
                            ? '0 0 20px rgba(34, 197, 94, 0.3)' 
                            : 'none'
                      }}
                      title={
                        !isVoiceConnected ? 'Connecting...' :
                        isListening ? 'Tap to stop listening' :
                        isProcessing ? 'Processing...' :
                        isSpeaking ? 'Speaking...' :
                        'Tap to start listening'
                      }
                    >
                      {/* Button glow effect */}
                      {(isListening || isVoiceConnected) && (
                        <div className={`absolute inset-0 rounded-full animate-ping ${
                          isListening ? 'bg-red-500/30' : 'bg-green-500/20'
                        }`} style={{ animationDuration: '2s' }} />
                      )}
                      
                      {isListening ? (
                        <div className="relative z-10">
                          <div className="w-6 h-6 bg-white rounded-sm" />
                        </div>
                      ) : isProcessing ? (
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : isSpeaking ? (
                        <Volume2 className="w-6 h-6" />
                      ) : (
                        <Mic className="w-6 h-6" />
                      )}
                    </button>
                    
                    {/* Stop Speaking Button */}
                    {isSpeaking && (
                      <button
                        onClick={stopSpeaking}
                        className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-200 shadow-lg hover:scale-105 active:scale-95"
                        title="Stop speaking"
                      >
                        <VolumeX className="w-5 h-5" />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {/* File Upload Button with Dropdown */}
                    <div className="relative">
                      <button
                        ref={attachButtonRef}
                        data-attach-button
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
                    </div>
                    
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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes gradient-flow {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes voice-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        
        @keyframes voice-ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .studybuddy-message-user {
          background-image: linear-gradient(135deg, #f97316, #ea580c);
        }
        
        .voice-border-animate {
          background-size: 200% 100%;
          animation: gradient-flow 3s ease infinite;
        }
        
        .voice-active .voice-border-animate {
          animation: gradient-flow 1.5s ease infinite;
        }
        
        /* Webkit mask for better browser support */
        .voice-border-mask {
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
        }
      `}</style>

      {/* Portal-based Knowledge Nest File Selector Modal */}
      {showKnowledgeNestSelector && typeof window !== 'undefined' && createPortal(
        <KnowledgeNestFileSelector
          isOpen={showKnowledgeNestSelector}
          onClose={() => setShowKnowledgeNestSelector(false)}
          onSelectFile={handleKnowledgeNestFileSelect}
          username={username}
          isDark={isDark}
          allowMultiple={false}
        />,
        document.body
      )}

      {/* Portal-based File Selector Dropdown */}
      {showFileSelector && typeof window !== 'undefined' && createPortal(
        <div 
          className="file-selector-dropdown"
          style={{
            position: 'fixed',
            top: dropdownPosition.top < 300 ? dropdownPosition.top + 50 : dropdownPosition.top - 280, // Smart positioning
            left: dropdownPosition.left,
            zIndex: 9999
          }}
        >
          <div className={`w-64 rounded-2xl shadow-2xl border backdrop-blur-sm transform-gpu animate-in fade-in duration-200 ${
            isDark 
              ? 'bg-gray-900/95 border-gray-700/50' 
              : 'bg-white/95 border-gray-200/50'
          }`}
          style={{
            maxHeight: '400px',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div className="p-3">
              <h3 className={`font-medium text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Attach File
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowFileSelector(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all hover:scale-105 ${
                    isDark 
                      ? 'hover:bg-gray-800/70 text-gray-200' 
                      : 'hover:bg-gray-100/70 text-gray-700'
                  } flex items-center gap-3`}
                >
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Paperclip className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      From your device
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Upload files from computer
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={handleKnowledgeNestClick}
                  className={`w-full text-left p-3 rounded-xl transition-all hover:scale-105 ${
                    isDark 
                      ? 'hover:bg-gray-800/70 text-gray-200' 
                      : 'hover:bg-gray-100/70 text-gray-700'
                  } flex items-center gap-3`}
                >
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      From Knowledge Nest
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Select shared resources
                    </div>
                  </div>
                </button>
              </div>
              
              <button
                onClick={() => setShowFileSelector(false)}
                className={`absolute top-2 right-2 p-1 rounded-lg transition-all ${
                  isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Portal-based Info Tooltip */}
      {showInfoTooltip && typeof window !== 'undefined' && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: tooltipPosition.top < 250 ? tooltipPosition.top + 50 : tooltipPosition.top - 200, // Smart positioning
            right: tooltipPosition.right,
            zIndex: 9999
          }}
        >
          <div className={`w-72 sm:w-80 p-3 rounded-lg shadow-lg border transform-gpu animate-in fade-in duration-200 ${
            isDark 
              ? 'bg-gray-800 border-gray-700 text-gray-200' 
              : 'bg-white border-gray-200 text-gray-800'
          }`}
          style={{
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
          }}>
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
        </div>,
        document.body
      )}
    </div>
  );
};

export default EnhancedChatInput;
