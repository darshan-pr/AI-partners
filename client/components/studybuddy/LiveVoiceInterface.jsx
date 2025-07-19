'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Wifi,
  WifiOff,
  Brain,
  Zap,
  Activity
} from 'lucide-react';

const LiveVoiceInterface = ({ 
  multiAgentMode, 
  agentStatus, 
  isDark, 
  username,
  onConnectionChange 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [error, setError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const wsRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    initializeVoiceConnection();
    return () => {
      cleanup();
    };
  }, []);

  // Update connection status callback
  useEffect(() => {
    onConnectionChange && onConnectionChange(isConnected);
  }, [isConnected, onConnectionChange]);

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
        break;
        
      case 'listening_stopped':
        setIsListening(false);
        break;
        
      case 'processing':
        setIsProcessing(true);
        setIsListening(false);
        setCurrentAgent(message.agentStatus?.currentAgent);
        break;
        
      case 'voice_response':
        setIsProcessing(false);
        setCurrentAgent(message.agentType);
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

  const handleVoiceInput = (transcript) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'voice_input',
        data: { transcript }
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
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
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

  const getAgentIcon = (agent) => {
    switch (agent) {
      case 'orchestrator': return Brain;
      case 'quiz': return Activity;
      case 'general': return Zap;
      case 'tutor': return Brain;
      default: return Mic;
    }
  };

  const getStatusColor = () => {
    if (error) return 'red';
    if (!isConnected) return 'gray';
    if (isProcessing) return 'blue';
    if (isListening) return 'green';
    if (isSpeaking) return 'purple';
    return 'gray';
  };

  const statusColors = {
    red: 'bg-red-500',
    gray: 'bg-gray-500', 
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="flex items-center gap-2">
      {/* Live Voice Button */}
      <div className="relative">
        <button
          onClick={toggleListening}
          disabled={!isConnected || isProcessing}
          className={`relative p-2 rounded-xl transition-all duration-200 ${
            isListening
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
              : isProcessing
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                : isSpeaking
                  ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white'
                  : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={
            !isConnected ? 'Connecting...' :
            isListening ? 'Stop listening' :
            isProcessing ? 'Processing...' :
            isSpeaking ? 'Speaking...' :
            'Start voice chat'
          }
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isListening ? (
            <Mic className="w-5 h-5" />
          ) : isSpeaking ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <MicOff className="w-5 h-5" />
          )}
        </button>

        {/* Audio Level Visualization */}
        {isListening && (
          <div className="absolute -top-1 -right-1 w-3 h-3">
            <div 
              className="w-full h-full bg-green-400 rounded-full animate-pulse"
              style={{ 
                opacity: 0.3 + (audioLevel * 0.7),
                transform: `scale(${0.8 + (audioLevel * 0.4)})`
              }}
            />
          </div>
        )}

        {/* Connection Status Indicator */}
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 ${
          isDark ? 'border-gray-800' : 'border-white'
        } ${statusColors[getStatusColor()]}`} />
      </div>

      {/* Current Agent Indicator (Multi-Agent Mode) */}
      {multiAgentMode && isConnected && currentAgent && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
          isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
        }`}>
          {React.createElement(getAgentIcon(currentAgent), { className: 'w-3 h-3' })}
          <span className="capitalize">{currentAgent}</span>
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <div className="flex items-center gap-1 text-xs text-red-500">
          <WifiOff className="w-3 h-3" />
          <span>Offline</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className={`text-xs px-2 py-1 rounded ${
          isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-600'
        }`}>
          {error}
        </div>
      )}
    </div>
  );
};

export default LiveVoiceInterface;
