import React from 'react';
import { 
  Play, 
  BookOpen, 
  TrendingUp, 
  Target,
  ExternalLink,
  ArrowRight,
  GraduationCap
} from 'lucide-react';

const QuizResponseRenderer = ({ content, metadata, isDark, onQuickResponse }) => {
  // Check if this is a quiz response with quiz ID
  const hasQuizId = metadata?.quizGenerated && metadata?.quizId;
  const nextSuggestions = metadata?.nextSuggestions || [];
  const isCompleted = metadata?.quizCompleted;
  const finalScore = metadata?.finalScore;
  const totalQuestions = metadata?.totalQuestions;

  const handleSuggestionClick = (suggestion) => {
    if (onQuickResponse) {
      // Create a prompt based on the suggestion
      let prompt = '';
      if (suggestion.type === 'difficulty') {
        prompt = `Create a ${suggestion.params.difficulty} difficulty quiz on ${suggestion.params.subject}`;
      } else if (suggestion.type === 'topic') {
        prompt = `Quiz me on ${suggestion.params.topic}`;
      } else if (suggestion.type === 'format') {
        prompt = `Create a ${suggestion.params.quizType} quiz on ${suggestion.params.subject}`;
      } else if (suggestion.type === 'tutor') {
        prompt = `Review my performance and give me improvement suggestions for ${suggestion.params.subject}`;
      }
      onQuickResponse(prompt);
    }
  };

  if (!hasQuizId) {
    return <div>{content}</div>;
  }

  // Split content to separate main message from quiz button section
  const parts = content.split('<div style=');
  const mainContent = parts[0];
  
  return (
    <div className="space-y-4">
      {/* Main Response Content with proper markdown rendering */}
      <div className={`space-y-3 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
        {mainContent.split('\n').map((line, index) => {
          // Handle different markdown elements
          if (line.trim() === '') return <br key={index} />;
          
          // Handle bold text with **
          if (line.includes('**')) {
            const parts = line.split(/(\*\*.*?\*\*)/);
            return (
              <p key={index} className="leading-relaxed">
                {parts.map((part, partIndex) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <strong key={partIndex} className={isDark ? 'text-white font-semibold' : 'text-gray-900 font-semibold'}>
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return part;
                })}
              </p>
            );
          }
          
          // Handle emoji lines and regular text
          return (
            <p key={index} className="leading-relaxed">
              {line}
            </p>
          );
        })}
      </div>
      
      {/* Enhanced Quiz Launch Card */}
      <div className={`relative overflow-hidden rounded-xl border ${
        isDark 
          ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-800/30' 
          : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200/50'
      }`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <Target className="w-5 h-5 text-blue-500" />
                Your Quiz is Ready!
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Test your knowledge and track your progress
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {metadata.quizData?.questionCount || 5}
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Questions
              </div>
            </div>
          </div>
          
          {/* Quiz Details */}
          <div className={`grid grid-cols-2 gap-4 mb-4 p-3 rounded-lg ${
            isDark ? 'bg-gray-800/50' : 'bg-white/50'
          }`}>
            <div>
              <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Subject
              </div>
              <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {metadata.quizData?.subject}
              </div>
            </div>
            <div>
              <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Difficulty
              </div>
              <div className={`text-sm font-medium capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {metadata.quizData?.difficulty}
              </div>
            </div>
          </div>
          
          {/* Quiz Completion Status */}
          {isCompleted && (
            <div className={`p-3 rounded-lg mb-4 ${
              isDark ? 'bg-green-900/30 border border-green-700/50' : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                  Quiz Completed!
                </span>
              </div>
              <div className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                Final Score: {finalScore}/{totalQuestions} ({Math.round((finalScore / totalQuestions) * 100)}%)
              </div>
            </div>
          )}
          
          {/* Start Quiz Button */}
          <a
            href={`/quiz/${metadata.quizId}`}
            className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 ${
              isDark
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
            } shadow-lg hover:shadow-xl`}
          >
            <div className="flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              Start Quiz Now
              <ArrowRight className="w-4 h-4" />
            </div>
          </a>
        </div>
      </div>
      
      {/* Next Suggestions */}
      {nextSuggestions.length > 0 && (
        <div className="space-y-3">
          <h4 className={`text-sm font-semibold flex items-center gap-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <TrendingUp className="w-4 h-4" />
            What's Next?
          </h4>
          
          <div className="grid gap-2">
            {nextSuggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`p-3 rounded-lg border transition-colors cursor-pointer hover:shadow-md ${
                  isDark 
                    ? 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50' 
                    : 'bg-gray-50/50 border-gray-200/50 hover:border-gray-300/50'
                }`}
              >
                <div className={`flex items-start gap-3`}>
                  <div className="mt-0.5">
                    {suggestion.type === 'difficulty' && <TrendingUp className="w-4 h-4 text-orange-500" />}
                    {suggestion.type === 'topic' && <BookOpen className="w-4 h-4 text-green-500" />}
                    {suggestion.type === 'format' && <Target className="w-4 h-4 text-blue-500" />}
                    {suggestion.type === 'study' && <BookOpen className="w-4 h-4 text-purple-500" />}
                    {suggestion.type === 'tutor' && <GraduationCap className="w-4 h-4 text-indigo-500" />}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {suggestion.title}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {suggestion.description}
                    </div>
                  </div>
                  <ExternalLink className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizResponseRenderer;
