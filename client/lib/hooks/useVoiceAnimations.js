import { useState, useEffect, useRef } from 'react';

export const useVoiceAnimations = () => {
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [voiceAnimationIntensity, setVoiceAnimationIntensity] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize audio analysis for voice detection
  const initializeAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const microphone = audioContextRef.current.createMediaStreamSource(stream);
      microphone.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Calculate average audio level
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          const normalizedLevel = average / 255;
          
          setAudioLevel(normalizedLevel);
          setVoiceAnimationIntensity(normalizedLevel);
          
          // Detect speaking based on audio level threshold
          const speakingThreshold = 0.1;
          setIsUserSpeaking(normalizedLevel > speakingThreshold);
          
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
      return true;
    } catch (error) {
      console.error('Error initializing audio analysis:', error);
      return false;
    }
  };

  // Cleanup audio context
  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  // Simulate AI speaking state (would be controlled by TTS)
  const simulateAISpeaking = (duration = 3000) => {
    setIsAISpeaking(true);
    setVoiceAnimationIntensity(0.7);
    
    setTimeout(() => {
      setIsAISpeaking(false);
      setVoiceAnimationIntensity(0);
    }, duration);
  };

  // Manual control functions
  const startUserSpeaking = () => {
    setIsUserSpeaking(true);
    setVoiceAnimationIntensity(0.8);
  };

  const stopUserSpeaking = () => {
    setIsUserSpeaking(false);
    setVoiceAnimationIntensity(0);
  };

  const startAISpeaking = () => {
    setIsAISpeaking(true);
    setVoiceAnimationIntensity(0.9);
  };

  const stopAISpeaking = () => {
    setIsAISpeaking(false);
    setVoiceAnimationIntensity(0);
  };

  // Demo function to test animations
  const demoVoiceAnimations = () => {
    // User speaks for 2 seconds
    startUserSpeaking();
    setTimeout(() => {
      stopUserSpeaking();
      
      // AI responds for 3 seconds
      setTimeout(() => {
        startAISpeaking();
        setTimeout(() => {
          stopAISpeaking();
        }, 3000);
      }, 500);
    }, 2000);
  };

  useEffect(() => {
    return cleanup;
  }, []);

  return {
    isUserSpeaking,
    isAISpeaking,
    voiceAnimationIntensity,
    audioLevel,
    initializeAudioAnalysis,
    cleanup,
    simulateAISpeaking,
    startUserSpeaking,
    stopUserSpeaking,
    startAISpeaking,
    stopAISpeaking,
    demoVoiceAnimations
  };
};
