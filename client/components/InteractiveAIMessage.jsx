'use client';

import React from 'react';
import AIMessageRenderer from './AIMessageRenderer';

const InteractiveAIMessage = ({ content, isDark, onQuickResponse }) => {
  return (
    <AIMessageRenderer 
      content={content} 
      isDark={isDark} 
      onQuickResponse={onQuickResponse}
    />
  );
};

export default InteractiveAIMessage;