// Voice Selection Utility for StudyBuddy Live Voice
export const VoiceSelector = {
  // Standard voice selection with most common/default voices
  getStandardVoice: () => {
    const voices = speechSynthesis.getVoices();
    
    // Priority order for most standard/common voices across platforms
    const standardVoices = [
      // Default system voices (most reliable)
      'Google US English',
      'Microsoft David Desktop',
      'Microsoft David',
      'Alex',
      'Daniel',
      'Samantha',
      
      // Fallback to platform defaults
      'Google UK English Female',
      'Microsoft Zira Desktop', 
      'Microsoft Zira',
      'Karen',
      
      // Generic fallbacks
      'en-US',
      'en-GB',
      'English'
    ];
    
    // Try to find standard voices first
    for (const standardName of standardVoices) {
      const voice = voices.find(v => 
        v.name.includes(standardName) || 
        v.name.toLowerCase().includes(standardName.toLowerCase()) ||
        v.lang === standardName
      );
      if (voice) {
        console.log(`Selected standard voice: ${voice.name}`);
        return voice;
      }
    }
    
    // Fallback: find any clear English voice
    const clearEnglishVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.toLowerCase().includes('us') ||
       voice.name.toLowerCase().includes('uk') ||
       voice.name.toLowerCase().includes('english'))
    );
    
    if (clearEnglishVoice) {
      console.log(`Selected fallback voice: ${clearEnglishVoice.name}`);
      return clearEnglishVoice;
    }
    
    // Last resort: any English voice
    const anyEnglishVoice = voices.find(voice => 
      voice.lang.startsWith('en') && voice.localService
    );
    
    if (anyEnglishVoice) {
      console.log(`Selected last resort voice: ${anyEnglishVoice.name}`);
      return anyEnglishVoice;
    }
    
    console.log('No suitable voice found, using default');
    return null;
  },
  
  // Get optimal speech settings for standard voice
  getOptimalSettings: (voice) => {
    const settings = {
      rate: 0.95,
      pitch: 1.0,
      volume: 1.0
    };
    
    if (voice) {
      // Adjust settings based on voice characteristics for clarity
      if (voice.name.includes('Google')) {
        settings.rate = 0.9;
        settings.pitch = 1.0;
      } else if (voice.name.includes('Microsoft')) {
        settings.rate = 0.92;
        settings.pitch = 0.98;
      } else if (voice.name.includes('Alex')) {
        settings.rate = 0.88;
        settings.pitch = 1.0;
      } else if (voice.name.includes('Samantha')) {
        settings.rate = 0.9;
        settings.pitch = 1.02;
      } else if (voice.name.includes('Daniel')) {
        settings.rate = 0.93;
        settings.pitch = 0.95;
      }
    }
    
    return settings;
  },
  
  // Test voice availability
  testVoice: (voice) => {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance('Testing voice');
      utterance.voice = voice;
      utterance.volume = 0; // Silent test
      
      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);
      
      speechSynthesis.speak(utterance);
    });
  },
  
  // List all available voices for debugging
  listAvailableVoices: () => {
    const voices = speechSynthesis.getVoices();
    console.log('Available voices:');
    voices.forEach((voice, index) => {
      console.log(`${index}: ${voice.name} (${voice.lang}) - ${voice.gender || 'Unknown gender'}`);
    });
    return voices;
  }
};

export default VoiceSelector;
