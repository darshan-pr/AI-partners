'use client'

export default function QuizLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-10">
      <div className="flex-grow flex items-center justify-center p-7 mt-3">
        <div className="w-full max-w-3xl mx-auto">
          <div className="bg-white dark:bg-black rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            
            {/* Loading Header Skeleton */}
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 dark:from-indigo-600 dark:to-blue-700 px-4 py-4 text-white">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="h-6 bg-white/20 rounded-lg animate-pulse mb-2 w-32"></div>
                  <div className="h-3 bg-white/15 rounded animate-pulse w-24 mb-2"></div>
                  <div className="flex gap-2 mt-2">
                    <div className="h-5 bg-white/20 rounded-full animate-pulse w-20"></div>
                    <div className="h-5 bg-white/20 rounded-full animate-pulse w-16"></div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="h-6 bg-white/20 rounded animate-pulse w-12 mb-1"></div>
                  <div className="h-3 bg-white/15 rounded animate-pulse w-16"></div>
                </div>
              </div>
              
              {/* Loading Progress Bar */}
              <div className="w-full bg-indigo-400/30 rounded-full h-2">
                <div className="bg-white/40 h-2 rounded-full w-0 animate-pulse"></div>
              </div>
              <div className="text-right text-xs text-indigo-100 mt-1 opacity-50">
                Loading...
              </div>
            </div>

            {/* Enhanced Loading Content */}
            <div className="p-6">
              <div className="flex flex-col items-center justify-center py-12">
                
                {/* Main Loading Spinner with Icon */}
                <div className="relative mb-6">
                  {/* Outer rotating ring */}
                  <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 rounded-full animate-spin border-t-indigo-500 dark:border-t-indigo-400"></div>
                  
                  {/* Inner pulsing circle */}
                  <div className="absolute inset-2 bg-indigo-100 dark:bg-indigo-900 rounded-full animate-pulse flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-500 dark:text-indigo-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>

                {/* Loading Text with Animation */}
                <div className="text-center mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Loading Your Quiz
                  </h2>
                  <div className="flex items-center justify-center space-x-1 text-gray-600 dark:text-gray-400">
                    <span>Preparing questions</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading Stats Footer */}
          <div className="mt-3 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-center items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
                <span>Loading questions...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
