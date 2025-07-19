'use client'
import { lazy, Suspense } from 'react';
import QuizLoading from './QuizLoading';

// Lazy load heavy components that aren't immediately needed
const ReviewModal = lazy(() => import('./ReviewModal'));
const QuizResults = lazy(() => import('./QuizResults'));
const ExitConfirmationModal = lazy(() => import('./ExitConfirmationModal'));

// Wrapper component for lazy-loaded modals
export function LazyReviewModal(props) {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl max-w-full sm:max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    }>
      <ReviewModal {...props} />
    </Suspense>
  );
}

export function LazyQuizResults(props) {
  return (
    <Suspense fallback={<QuizLoading />}>
      <QuizResults {...props} />
    </Suspense>
  );
}

export function LazyExitConfirmationModal(props) {
  return (
    <Suspense fallback={<div />}>
      <ExitConfirmationModal {...props} />
    </Suspense>
  );
}
