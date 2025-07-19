'use client'
import { useRouter } from 'next/navigation';

export default function FullscreenPrompt({ quiz, onStartQuiz }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-16">
      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 mt-6">
        <div className="w-full max-w-full sm:max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 dark:from-indigo-600 dark:to-blue-700 px-4 sm:px-6 py-6 sm:py-8 text-white text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mb-2">Fullscreen Mode Required</h1>
              <p className="text-indigo-100 text-sm sm:text-base">This quiz must be taken in fullscreen mode to ensure focus and prevent distractions.</p>
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Quiz Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="font-medium text-gray-700 dark:text-gray-300">Subject</div>
                    <div className="text-gray-900 dark:text-gray-100 break-words">{quiz?.subject}</div>
                  </div>
                  {quiz?.concept && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="font-medium text-gray-700 dark:text-gray-300">Concept</div>
                      <div className="text-gray-900 dark:text-gray-100 break-words">{quiz.concept}</div>
                    </div>
                  )}
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="font-medium text-gray-700 dark:text-gray-300">Questions</div>
                    <div className="text-gray-900 dark:text-gray-100">{quiz?.questions?.length}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="font-medium text-gray-700 dark:text-gray-300">Difficulty</div>
                    <div className="text-gray-900 dark:text-gray-100">{quiz?.difficulty || 'Medium'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 sm:p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium mb-1">Important Notes:</p>
                    <ul className="space-y-1 text-amber-700 dark:text-amber-300">
                      <li>• Fullscreen mode is mandatory for this quiz</li>
                      <li>• Exiting fullscreen will pause the quiz</li>
                      <li>• You can resume by re-entering fullscreen</li>
                      <li className="hidden sm:block">• Use F11 or the button below to enter fullscreen</li>
                      <li className="sm:hidden">• Use the button below to enter fullscreen</li>
                      <li className="hidden sm:block">• Press F11 anytime to toggle fullscreen mode</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => router.push('/home')}
                  className="w-full sm:flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Go Back
                </button>
                <button
                  onClick={onStartQuiz}
                  className="w-full sm:flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  Enter Fullscreen & Start Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
