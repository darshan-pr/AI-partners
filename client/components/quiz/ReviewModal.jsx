'use client'

export default function ReviewModal({ 
  showReviewModal, 
  isFullscreen, 
  quiz, 
  userAnswers, 
  onClose, 
  onContinue, 
  onSubmit,
  onKeepPreviousScore,
  onEditQuestion,
  submitting = false,
  submitStage = '',
  submitProgress = 0,
  getStageIcon
}) {
  if (!showReviewModal) return null;

  const isRetake = quiz?.retakeCount && quiz.retakeCount > 0;
  const previousScore = quiz?.score;
  // Only show previous score if it's a genuine retake with a valid previous score
  // Check for retakeCount > 0 AND score exists AND score is a valid number
  const hasPreviousScore = Boolean(
    quiz && 
    quiz.retakeCount && 
    quiz.retakeCount > 0 && 
    typeof quiz.score === 'number' && 
    quiz.score >= 0
  );

  const answeredQuestions = userAnswers.filter(answer => answer && answer !== 'SKIPPED');
  const skippedQuestions = userAnswers.filter(answer => answer === 'SKIPPED');
  const unansweredQuestions = userAnswers.filter((answer, index) => !answer);

  const getAnswerStatus = (answer, index) => {
    if (!answer) return { status: 'unanswered', className: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' };
    if (answer === 'SKIPPED') return { status: 'skipped', className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' };
    return { status: 'answered', className: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-black rounded-xl max-w-full sm:max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative border dark:border-gray-800`}>
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                {!isFullscreen ? 'Fullscreen Mode Required' : 'Review Your Quiz'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {!isFullscreen 
                  ? 'You exited fullscreen mode. Please return to fullscreen to continue.' 
                  : 'Review your answers before submitting'
                }
              </p>
              {hasPreviousScore && (
                <div className="mt-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Past Score: {previousScore}%
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          {!isFullscreen && (
            <div className="mb-4 sm:mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 sm:p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-xs sm:text-sm text-red-800 dark:text-red-200">
                  <p className="font-medium mb-1">Fullscreen Mode Required!</p>
                  <p className="text-red-700 dark:text-red-300">
                    You have exited fullscreen mode. To continue with the quiz, you must return to fullscreen mode. 
                    Click "Enter Fullscreen & Continue" below to resume your quiz.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className={`text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700 transition-all duration-300`}>
              <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {answeredQuestions.length}
              </div>
              <div className="text-xs sm:text-sm text-green-700 dark:text-green-300">Answered</div>
            </div>
            <div className={`text-center p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700 transition-all duration-300`}>
              <div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {skippedQuestions.length}
              </div>
              <div className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">Skipped</div>
            </div>
            <div className={`text-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300`}>
              <div className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400">
                {unansweredQuestions.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Unanswered</div>
            </div>
          </div>

          <div className={`max-h-48 sm:max-h-60 overflow-y-auto transition-opacity duration-300 ${submitting ? 'opacity-50' : 'opacity-100'}`}>
            {/* Horizontal strip of question numbers */}
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-3">
              {quiz.questions.map((question, index) => {
                const { status, className } = getAnswerStatus(userAnswers[index], index);
                const statusColors = {
                  answered: 'bg-green-500 text-white border-green-600',
                  skipped: 'bg-yellow-500 text-white border-yellow-600', 
                  unanswered: 'bg-red-500 text-white border-red-600'
                };
                
                return (
                  <div
                    key={index}
                    className={`relative h-12 w-12 flex items-center justify-center rounded-lg font-medium text-sm border-2 transition-all duration-200 ${statusColors[status]} ${
                      submitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-105 hover:shadow-lg'
                    }`}
                    onClick={() => !submitting && onEditQuestion && onEditQuestion(index)}
                    title={`Question ${index + 1}: ${status === 'unanswered' ? 'Not answered' : status}${!submitting && onEditQuestion ? ' (Click to edit)' : ''}`}
                  >
                    <span>{index + 1}</span>
                    {!submitting && onEditQuestion && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity">
                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded border-2 border-green-600"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded border-2 border-yellow-600"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Skipped</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded border-2 border-red-600"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Not Attempted</span>
              </div>
              {!submitting && onEditQuestion && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Click to edit</span>
                </div>
              )}
            </div>
          </div>

          <div className={`flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-800 ${hasPreviousScore ? 'sm:grid sm:grid-cols-3' : ''}`}>
            <button
              onClick={onContinue}
              disabled={submitting}
              className={`w-full ${hasPreviousScore ? 'sm:col-span-1' : 'sm:flex-1'} px-4 py-2 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                !isFullscreen 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40' 
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {!isFullscreen ? (
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span className="text-sm">Enter Fullscreen & Continue</span>
                </div>
              ) : (
                <span className="text-sm">Continue Quiz</span>
              )}
            </button>
            
            {hasPreviousScore && (
              <button
                onClick={onKeepPreviousScore}
                disabled={submitting}
                className="w-full sm:col-span-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium text-sm disabled:cursor-not-allowed"
              >
                Keep Previous Score
              </button>
            )}
            
            {/* Submit Button with Progress Animation */}
            {submitting ? (
              <div className="w-full sm:flex-1">
                <div className="relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-lg min-h-[44px] shadow-lg border border-gray-300 dark:border-gray-600">
                  {/* Progress Background */}
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
                  
                  {/* Progress Content */}
                  <div className="relative z-10 px-4 py-2.5 text-white">
                    <div className="flex items-center justify-between">
                      {/* Progress Info */}
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold tabular-nums">
                          {Math.round(submitProgress)}%
                        </div>
                        {/* Animated Spinner */}
                        <div className="relative w-5 h-5">
                          <div className="absolute inset-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            {getStageIcon && getStageIcon(submitStage)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Stage Text */}
                      <div className="flex items-center flex-1 justify-end">
                        <span className="text-sm font-medium leading-tight text-right">
                          {submitStage}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
                  </div>
                </div>
                
                {/* Progress Description */}
                <div className="text-center mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Processing your quiz submission...
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={onSubmit}
                disabled={submitting}
                className={`w-full ${hasPreviousScore ? 'sm:col-span-1' : 'sm:flex-1'} px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium text-sm disabled:cursor-not-allowed`}
              >
                Submit Quiz ({answeredQuestions.length} answered)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
