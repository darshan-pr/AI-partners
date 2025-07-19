// Quiz utility functions
export const analyzeTextInputAnswer = async (question, userAnswer) => {
  try {
    const response = await fetch('/api/quiz/analyze-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText: question.questionText,
        correctAnswer: question.aiAnswer,
        userAnswer: userAnswer,
        acceptableAnswers: question.acceptableAnswers
      })
    });

    const data = await response.json();
    if (data.success) {
      return data.analysis;
    }
    
    // Fallback to keyword matching if API fails
    return keywordBasedComparison(question, userAnswer);
  } catch (error) {
    console.error('Error analyzing text input:', error);
    // Fallback to keyword matching
    return keywordBasedComparison(question, userAnswer);
  }
};

// Enhanced keyword-based comparison function
export const keywordBasedComparison = (question, userAnswer) => {
  const normalizeText = (text) => {
    if (!text) return '';
    return text.toString().trim().toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize spaces
  };

  const userNormalized = normalizeText(userAnswer);
  const correctNormalized = normalizeText(question.aiAnswer);

  // Check exact match first
  if (userNormalized === correctNormalized) {
    return {
      isCorrect: true,
      confidence: 100,
      keywordMatches: ['exact match'],
      missingKeywords: [],
      reasoning: 'Exact match with correct answer'
    };
  }

  // Check acceptable answers
  if (question.acceptableAnswers) {
    for (const acceptable of question.acceptableAnswers) {
      if (normalizeText(acceptable) === userNormalized) {
        return {
          isCorrect: true,
          confidence: 95,
          keywordMatches: ['acceptable variation'],
          missingKeywords: [],
          reasoning: 'Matches acceptable answer variation'
        };
      }
    }
  }

  // Use AI-generated keywords if available
  if (question.keywordMatches && question.keywordMatches.length > 0) {
    const matchedKeywords = [];
    const missingKeywords = [];

    question.keywordMatches.forEach(keyword => {
      const keywordNormalized = normalizeText(keyword);
      
      // Check for direct keyword match
      if (userNormalized.includes(keywordNormalized)) {
        matchedKeywords.push(keyword);
      } 
      // Check for synonym matches (simple implementation)
      else if (checkSynonyms(keywordNormalized, userNormalized)) {
        matchedKeywords.push(keyword);
      } 
      else {
        missingKeywords.push(keyword);
      }
    });

    const matchPercentage = (matchedKeywords.length / question.keywordMatches.length) * 100;
    
    // Determine if answer is correct based on keyword matches
    const isCorrect = matchPercentage >= 60; // At least 60% of keywords must match
    const confidence = Math.min(matchPercentage, 95);

    return {
      isCorrect,
      confidence,
      keywordMatches: matchedKeywords,
      missingKeywords,
      reasoning: `Keyword matching: ${matchPercentage.toFixed(1)}% match`
    };
  }

  // Fallback: simple word overlap check
  const similarity = calculateWordSimilarity(userNormalized, correctNormalized);
  const isCorrect = similarity > 0.6; // 60% similarity threshold

  return {
    isCorrect,
    confidence: similarity * 100,
    keywordMatches: [],
    missingKeywords: [],
    reasoning: `Word similarity: ${(similarity * 100).toFixed(1)}%`
  };
};

// Simple synonym checking function
export const checkSynonyms = (keyword, userText) => {
  // Basic synonym mappings - can be expanded
  const synonyms = {
    'big': ['large', 'huge', 'enormous', 'massive', 'giant'],
    'small': ['little', 'tiny', 'mini', 'minute', 'compact'],
    'fast': ['quick', 'rapid', 'swift', 'speedy'],
    'slow': ['sluggish', 'gradual', 'leisurely'],
    'good': ['excellent', 'great', 'wonderful', 'fine', 'nice'],
    'bad': ['terrible', 'awful', 'poor', 'horrible'],
    'happy': ['joyful', 'glad', 'cheerful', 'content'],
    'sad': ['unhappy', 'sorrowful', 'depressed', 'melancholy'],
    // Add more synonyms as needed
  };

  const keywordLower = keyword.toLowerCase();
  if (synonyms[keywordLower]) {
    return synonyms[keywordLower].some(synonym => 
      userText.includes(synonym.toLowerCase())
    );
  }
  
  return false;
};

// Calculate word similarity between two texts
export const calculateWordSimilarity = (text1, text2) => {
  const words1 = text1.split(' ').filter(word => word.length > 2);
  const words2 = text2.split(' ').filter(word => word.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(word => words2.includes(word));
  const maxLength = Math.max(words1.length, words2.length);
  
  return commonWords.length / maxLength;
};

// Fullscreen utility functions
export const enterFullscreen = () => {
  const element = document.documentElement;
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
};

export const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
};

export const checkFullscreen = () => {
  return !!(
    document.fullscreenElement ||
    document.mozFullScreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  );
};

// Answer validation function
export const isAnswerCorrect = async (question, userAnswer) => {
  if (userAnswer === 'SKIPPED') return false;
  
  const normalizeText = (text) => {
    if (!text) return '';
    return text.toString().trim().toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ');
  };

  const userNormalized = normalizeText(userAnswer);
  const correctNormalized = normalizeText(question.aiAnswer);

  switch (question.questionType) {
    case 'mcq':
      if (/^[a-d]$/i.test(userAnswer)) {
        const optionIndex = userAnswer.toUpperCase().charCodeAt(0) - 65;
        return question.options?.[optionIndex] === question.aiAnswer;
      }
      return userNormalized === correctNormalized;

    case 'true_false':
      return userNormalized === correctNormalized;

    case 'text_input':
      const analysis = await analyzeTextInputAnswer(question, userAnswer);
      return analysis.isCorrect;

    default:
      return false;
  }
};

// Progress stage icons
export const getStageIcon = (stage) => {
  if (stage.includes('Analyzing')) {
    return <span className="text-xs">🔍</span>;
  } else if (stage.includes('Calculating')) {
    return <span className="text-xs">📊</span>;
  } else if (stage.includes('Saving') || stage.includes('Finalizing')) {
    return <span className="text-xs">💾</span>;
  }
  return <span className="text-xs">⚡</span>;
};
