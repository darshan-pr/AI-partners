'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  X,
  Minimize2,
  Settings,
  Radio
} from 'lucide-react';
import GeminiLiveAnimations from './GeminiLiveAnimationsResponsive';
import { VoiceSelector } from '../../lib/VoiceSelector';

const GeminiLiveCenteredInterface = ({ 
  isOpen,
  onClose,
  multiAgentMode, 
  agentStatus, 
  isDark, 
  username 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAgent, setCurrentAgent] = useState('general');
  const [error, setError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [conversationTurns, setConversationTurns] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const wsRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize connection when opened
  useEffect(() => {
    if (isOpen) {
      // Ensure voices are loaded
      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', () => {
          console.log('Standard voices loaded:', VoiceSelector.listAvailableVoices().length);
        });
      }
      
      initializeVoiceConnection();
    } else {
      cleanup();
    }
    return cleanup;
  }, [isOpen]);

  const initializeVoiceConnection = async () => {
    try {
      // Initialize WebSocket server
      await fetch('/api/studybuddy-voice-live?action=init_websocket');
      
      // Connect to WebSocket
      wsRef.current = new WebSocket('ws://localhost:8080');
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        
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
        setIsConnected(false);
        setIsListening(false);
        setIsProcessing(false);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error occurred');
        setIsConnected(false);
      };
      
    } catch (error) {
      console.error('Failed to initialize voice connection:', error);
      setError('Failed to connect to voice service');
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
        setTranscript('');
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
        setLastResponse(message.response);
        setConversationTurns(prev => prev + 1);
        speakResponse(message.response);
        break;
        
      case 'error':
        setError(message.error);
        setIsProcessing(false);
        setIsListening(false);
        break;
    }
  };

  const initializeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser');
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
      
      setTranscript(text);
      
      if (event.results[last].isFinal) {
        handleVoiceInput(text);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
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
      // Fallback settings for default voice
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

  const toggleListening = async () => {
    if (!isConnected) return;

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

  const cleanup = () => {
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
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Minimized floating button */}
      {isMinimized && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <button
            onClick={() => setIsMinimized(false)}
            className={`w-16 h-16 rounded-full border-4 transition-all duration-200 shadow-2xl ${
              isListening
                ? 'bg-red-500 border-red-400 animate-pulse'
                : isProcessing
                  ? 'bg-blue-500 border-blue-400 animate-pulse'
                  : isSpeaking
                    ? 'bg-purple-500 border-purple-400'
                    : isDark
                      ? 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Radio className={`w-6 h-6 mx-auto ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`} />
          </button>
        </div>
      )}

      {/* Full interface centered over chat area */}
      {!isMinimized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur effect */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Main Interface - Gemini Live Style, centered in viewport */}
          <div className={`relative w-full max-w-lg mx-4 ${
            isDark 
              ? 'bg-gray-900/95 border-gray-700' 
              : 'bg-white/95 border-gray-200'
          } border rounded-3xl shadow-2xl backdrop-blur-md overflow-hidden animate-scale-in`}>
            
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              isDark ? 'border-gray-700/50' : 'border-gray-200/50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  isConnected 
                    ? 'bg-green-500 animate-pulse' 
                    : 'bg-red-500'
                }`} />
                <span className={`font-medium ${
                  isDark ? 'text-white' : 'text-gray-900'
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
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(true)}
                  className={`p-2 rounded-full transition-colors ${
                    isDark 
                      ? 'hover:bg-gray-700 text-gray-400' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Minimize"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-full transition-colors ${
                    isDark 
                      ? 'hover:bg-gray-700 text-gray-400' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Content Area - Centered like Gemini Live */}
            <div className="p-8 flex flex-col items-center justify-center min-h-[500px]">
              
              {/* Central Animation - Large and prominent */}
              <div className="mb-8">
                <GeminiLiveAnimations
                  isListening={isListening}
                  isProcessing={isProcessing}
                  isSpeaking={isSpeaking}
                  audioLevel={audioLevel}
                  multiAgentMode={multiAgentMode}
                  currentAgent={currentAgent}
                  isDark={isDark}
                  size={160} // Larger size for prominence
                />
              </div>

              {/* Status Display */}
              <div className="text-center mb-8 max-w-md">
                {error ? (
                  <div className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    {error}
                  </div>
                ) : (
                  <>
                    <h3 className={`text-2xl font-semibold mb-3 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {isListening ? 'Listening...' :
                       isProcessing ? (multiAgentMode ? 'Routing to agent...' : 'Processing...') :
                       isSpeaking ? 'Speaking...' :
                       conversationTurns === 0 ? 'Tap to start conversation' : 'Ready for your next question'}
                    </h3>
                    
                    {/* Live Transcript */}
                    {isListening && transcript && (
                      <div className={`text-base p-4 rounded-xl mb-4 ${
                        isDark 
                          ? 'bg-gray-800/50 text-gray-300 border border-gray-700/50' 
                          : 'bg-blue-50/50 text-gray-700 border border-blue-200/50'
                      }`}>
                        <div className="text-xs text-gray-500 mb-1">You're saying:</div>
                        "{transcript}"
                      </div>
                    )}
                    
                    {/* Agent Status for Multi-Agent Mode */}
                    {multiAgentMode && currentAgent && (isProcessing || isSpeaking) && (
                      <div className={`text-sm px-3 py-2 rounded-full inline-block ${
                        isDark 
                          ? 'bg-blue-900/30 text-blue-300' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        <span className="capitalize font-medium">{currentAgent}</span> agent active
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Main Control Button - Prominent Gemini Style */}
              <div className="relative mb-8">
                <button
                  onClick={toggleListening}
                  disabled={!isConnected || isProcessing}
                  className={`relative w-24 h-24 rounded-full border-4 transition-all duration-300 transform ${
                    isListening
                      ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/30 scale-110'
                      : isProcessing
                        ? 'bg-blue-500 border-blue-400 animate-pulse scale-105'
                        : isSpeaking
                          ? 'bg-purple-500 border-purple-400 scale-105'
                          : isDark
                            ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:scale-105'
                            : 'bg-white border-gray-300 hover:bg-gray-50 hover:scale-105'
                  } disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl active:scale-95`}
                  title={
                    !isConnected ? 'Connecting...' :
                    isListening ? 'Tap to stop' :
                    isProcessing ? 'Processing...' :
                    isSpeaking ? 'Speaking...' :
                    'Tap to talk'
                  }
                >
                  {isProcessing ? (
                    <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : isListening ? (
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 bg-white rounded-sm" />
                    </div>
                  ) : isSpeaking ? (
                    <Volume2 className="w-10 h-10 text-white mx-auto" />
                  ) : (
                    <Mic className={`w-10 h-10 mx-auto ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`} />
                  )}
                </button>
                
                {/* Stop Speaking Button */}
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    title="Stop speaking"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Instructions */}
              <div className={`text-center text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <p className="mb-2">Tap the microphone to start talking</p>
                {multiAgentMode && (
                  <p className="text-xs">Questions are automatically routed to the best AI agent</p>
                )}
                <p className="text-xs mt-2">Conversation turns: {conversationTurns}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default GeminiLiveCenteredInterface;
