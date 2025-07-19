'use client'

export default function FullscreenWarning({ isFullscreen, onEnterFullscreen }) {
  if (isFullscreen) return null;

  return (
    <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start sm:items-center">
          <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-sm text-red-800 dark:text-red-200">
            <p className="font-medium">Quiz Paused - Fullscreen Required</p>
            <p className="text-red-700 dark:text-red-300">Please return to fullscreen mode to continue.</p>
          </div>
        </div>
        <button
          onClick={onEnterFullscreen}
          className="w-full sm:w-auto px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <span className="sm:hidden">Enter Fullscreen</span>
          <span className="hidden sm:inline">Enter Fullscreen</span>
        </button>
      </div>
    </div>
  );
}
