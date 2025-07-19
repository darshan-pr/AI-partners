'use client'

export default function QuizHeader({ 
  quiz, 
  currentQuestion, 
  totalQuestions, 
  progress, 
  isFullscreen 
}) {
  const isRetake = quiz?.retakeCount && quiz.retakeCount > 0;
  return (
    <div className="bg-gradient-to-r from-indigo-500 to-blue-600 dark:from-indigo-600 dark:to-blue-700 px-4 py-4 text-white">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg sm:text-xl font-bold">{quiz?.subject}</h1>
            {isRetake && (
              <span className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                RETAKE
              </span>
            )}
          </div>
          {quiz?.concept && (
            <p className="text-indigo-100 text-xs mt-1 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {quiz.concept}
            </p>
          )}
          <div className="flex gap-2 mt-2 text-xs">
            <span className="bg-white/20 px-2 py-0.5 rounded-full flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              {quiz?.difficulty || 'Medium'}
            </span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {quiz?.quizType || 'Mixed'}
            </span>
          </div>
        </div>
        <div className="text-right ml-4">
          <div className="text-base font-semibold">
            {currentQuestion + 1}/{totalQuestions}
          </div>
          <div className="text-indigo-200 text-xs flex items-center">
            <span className="mr-2">Question</span>
            {isFullscreen && (
              <svg className="w-3 h-3 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-indigo-400/30 rounded-full h-2">
        <div
          className="bg-white h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-right text-xs text-indigo-100 mt-1">
        {Math.round(progress)}% Complete
      </div>
    </div>
  );
}
