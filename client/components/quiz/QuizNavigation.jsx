'use client'

export default function QuizNavigation({ 
  currentQuestion, 
  totalQuestions, 
  submitting, 
  submitStage,
  submitProgress,
  onPrevious, 
  onNext, 
  onSubmit,
  getStageIcon,
  disabled = false
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex gap-2 order-2 sm:order-1">
        <button
          onClick={onPrevious}
          disabled={currentQuestion === 0 || submitting || disabled}
          className={`flex items-center px-3 py-2 border rounded-lg font-medium text-sm transition-all duration-200 ${
            disabled
              ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300'
          }`}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        {currentQuestion < totalQuestions - 1 && (
          <button
            onClick={onNext}
            disabled={submitting || disabled}
            className={`flex items-center px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 transform min-w-[120px] justify-center shadow-md ${
              disabled
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed transform-none scale-100'
                : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 hover:from-indigo-600 hover:via-indigo-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white hover:scale-105 hover:shadow-lg active:scale-95 disabled:transform-none disabled:scale-100 disabled:shadow-md'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Next
          </button>
        )}
      </div>

      <div className="flex gap-2 order-1 sm:order-2">
        {submitting ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-lg min-w-[290px] shadow-lg border border-gray-300 dark:border-gray-600">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-all duration-700 ease-out"
                style={{ 
                  width: `${submitProgress}%`,
                  background: submitProgress > 80 
                    ? 'linear-gradient(to right, #10b981, #059669, #047857)'
                    : submitProgress > 50
                    ? 'linear-gradient(to right, #3b82f6, #6366f1, #8b5cf6)'
                    : 'linear-gradient(to right, #60a5fa, #3b82f6, #2563eb)'
                }}
              />
              
              <div className="relative z-10 px-4 py-2.5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold tabular-nums">
                      {Math.round(submitProgress)}%
                    </div>
                    <div className="relative w-5 h-5">
                      <div className="absolute inset-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        {getStageIcon && getStageIcon(submitStage)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-sm font-medium leading-tight">{submitStage}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Please wait while we process your quiz...
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={onSubmit}
            disabled={submitting || disabled}
            className={`flex items-center px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 transform shadow-md min-w-[120px] justify-center ${
              disabled
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed transform-none scale-100'
                : 'bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white hover:scale-105 hover:shadow-lg active:scale-95'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
