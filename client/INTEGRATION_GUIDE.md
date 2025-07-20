# 🔗 Integration Guide: Enhanced Voice Animations

This guide shows how to integrate the enhanced voice border animations into existing StudyBuddy pages.

## Quick Integration

### 1. Update ChatInput Props

In your existing page component (e.g., `app/home/studybuddy/page.jsx`):

```jsx
import { useVoiceAnimations } from '../../../lib/hooks/useVoiceAnimations';

export default function StudyBuddyPage() {
  // Add voice animation hook
  const {
    isUserSpeaking,
    isAISpeaking,
    voiceAnimationIntensity,
    startUserSpeaking,
    stopUserSpeaking,
    startAISpeaking,
    stopAISpeaking
  } = useVoiceAnimations();

  // Your existing state...
  const [message, setMessage] = useState('');
  // ... other state

  return (
    <div>
      {/* Your existing content */}
      
      <ChatInput
        message={message}
        setMessage={setMessage}
        // ... your existing props
        
        // Add these new props for voice animations
        isUserSpeaking={isUserSpeaking}
        isAISpeaking={isAISpeaking}
        voiceAnimationIntensity={voiceAnimationIntensity}
      />
    </div>
  );
}
```

### 2. Connect to Voice Events

In your WebSocket or voice handling code:

```jsx
// When user starts speaking (from speech recognition)
recognition.onstart = () => {
  startUserSpeaking();
};

recognition.onend = () => {
  stopUserSpeaking();
};

// When AI starts responding (from TTS)
const handleAIResponse = async (response) => {
  startAISpeaking();
  
  // Your existing TTS code
  await speakResponse(response);
  
  stopAISpeaking();
};
```

### 3. Import CSS (Optional)

Add the CSS file to your global styles or import it in your component:

```jsx
import '../../../styles/voice-animations.css';
```

Or add to `globals.css`:
```css
@import './voice-animations.css';
```

## Full Example Integration

```jsx
'use client';

import React, { useState, useEffect } from 'react';
import ChatInput from '../../../components/studybuddy/ChatInput';
import { useVoiceAnimations } from '../../../lib/hooks/useVoiceAnimations';

export default function StudyBuddyPage() {
  // Existing state
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [multiAgentMode, setMultiAgentMode] = useState(false);
  
  // Add voice animations
  const {
    isUserSpeaking,
    isAISpeaking,
    voiceAnimationIntensity,
    startUserSpeaking,
    stopUserSpeaking,
    startAISpeaking,
    stopAISpeaking
  } = useVoiceAnimations();

  // Enhanced message handling with voice feedback
  const handleSendMessage = async (msg) => {
    setMessage('');
    setIsLoading(true);
    
    try {
      // Your existing API call
      const response = await sendToAI(msg);
      
      // Trigger AI speaking animation
      startAISpeaking();
      
      // Handle TTS if enabled
      if (response.audioEnabled) {
        await speak(response.text);
      }
      
      // Stop animation after response
      setTimeout(stopAISpeaking, 3000);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Your existing content */}
      
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
        onFileSelect={setSelectedFile}
        username={username}
        
        // New voice animation props
        isUserSpeaking={isUserSpeaking}
        isAISpeaking={isAISpeaking}
        voiceAnimationIntensity={voiceAnimationIntensity}
      />
    </div>
  );
}
```

## Testing Your Integration

1. **Visit your page** - Animations should work immediately
2. **Test demo mode** - Add this button temporarily for testing:

```jsx
<button onClick={() => {
  startUserSpeaking();
  setTimeout(() => {
    stopUserSpeaking();
    setTimeout(() => {
      startAISpeaking();
      setTimeout(stopAISpeaking, 3000);
    }, 500);
  }, 2000);
}}>
  Test Animations
</button>
```

3. **Check responsiveness** - Test on mobile devices
4. **Verify accessibility** - Ensure animations respect reduced motion preferences

## Troubleshooting

### Common Issues

1. **No animations visible**
   - Check that props are passed correctly
   - Verify component is receiving state updates
   - Check browser console for errors

2. **Animations too fast/slow**
   - Adjust timing in `voice-animations.css`
   - Modify `voiceAnimationIntensity` scaling

3. **Performance issues**
   - Reduce animation complexity on mobile
   - Check for memory leaks in animation frames

### Debug Mode

Add this to see current state:

```jsx
{process.env.NODE_ENV === 'development' && (
  <div className="fixed top-4 left-4 bg-black text-white p-2 rounded text-xs">
    User: {isUserSpeaking ? 'ON' : 'OFF'} | 
    AI: {isAISpeaking ? 'ON' : 'OFF'} | 
    Intensity: {Math.round(voiceAnimationIntensity * 100)}%
  </div>
)}
```

That's it! Your ChatInput now has beautiful, responsive voice animations. 🎉
