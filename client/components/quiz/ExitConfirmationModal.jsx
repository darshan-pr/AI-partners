'use client'

export default function ExitConfirmationModal({ showExitConfirm, onClose, onSubmitAndExit, onKeepPreviousScoreAndExit, isRetake = false }) {

  if (!showExitConfirm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-black rounded-xl p-4 sm:p-6 max-w-full sm:max-w-md w-full shadow-2xl border dark:border-gray-800">
        <div className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Leave Quiz in Progress?
          </h3>
          
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
            {isRetake 
              ? 'You are attempting to leave the retake quiz. You can either continue or keep your previous score and exit.'
              : 'You are attempting to leave the quiz. You can either continue with the quiz or submit your current progress and exit.'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              Stay and Continue
            </button>
            <button
              onClick={isRetake ? onKeepPreviousScoreAndExit : onSubmitAndExit}
              className="w-full sm:flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm"
            >
              {isRetake ? 'Keep Previous Score and Exit' : 'Submit and Exit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
