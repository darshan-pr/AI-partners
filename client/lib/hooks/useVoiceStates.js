'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export const useVoiceStates = () => {
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [voiceAnimationIntensity, setVoiceAnimationIntensity] = useState(0);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
  const animationIntervalRef = useRef(null);
  const intensityTimeoutRef = useRef(null);

  const startVoiceAnimation = useCallback(() => {
    if (animationIntervalRef.current) return;
    
    animationIntervalRef.current = setInterval(() => {
      // Create dynamic intensity based on speaking pattern
      const baseIntensity = isAISpeaking ? 0.7 : 0.5;
      const randomVariation = Math.random() * 0.4;
      setVoiceAnimationIntensity(baseIntensity + randomVariation);
    }, 150);
  }, [isAISpeaking]);

  const stopVoiceAnimation = useCallback(() => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    
    // Fade out animation intensity
    if (intensityTimeoutRef.current) {
      clearTimeout(intensityTimeoutRef.current);
    }
    
    intensityTimeoutRef.current = setTimeout(() => {
      setVoiceAnimationIntensity(0);
    }, 300);
  }, []);

  // Monitor voice states and update animation intensity
  useEffect(() => {
    if (isUserSpeaking || isAISpeaking) {
      setIsVoiceActive(true);
      startVoiceAnimation();
    } else {
      setIsVoiceActive(false);
      stopVoiceAnimation();
    }

    return () => {
      stopVoiceAnimation();
    };
  }, [isUserSpeaking, isAISpeaking, startVoiceAnimation, stopVoiceAnimation]);

  // Voice state setters
  const startUserSpeaking = () => {
    setIsAISpeaking(false); // Stop AI if user starts speaking
    setIsUserSpeaking(true);
  };

  const stopUserSpeaking = () => {
    setIsUserSpeaking(false);
  };

  const startAISpeaking = () => {
    setIsUserSpeaking(false); // Shouldn't happen but safety
    setIsAISpeaking(true);
  };

  const stopAISpeaking = () => {
    setIsAISpeaking(false);
  };

  const stopAllSpeaking = () => {
    setIsUserSpeaking(false);
    setIsAISpeaking(false);
  };

  return {
    // States
    isUserSpeaking,
    isAISpeaking,
    voiceAnimationIntensity,
    isVoiceActive,
    
    // Controls
    startUserSpeaking,
    stopUserSpeaking,
    startAISpeaking,
    stopAISpeaking,
    stopAllSpeaking,
    
    // Setters for external control
    setIsUserSpeaking,
    setIsAISpeaking,
    setVoiceAnimationIntensity
  };
};

export default useVoiceStates;
