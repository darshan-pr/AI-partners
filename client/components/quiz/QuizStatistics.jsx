'use client'

export default function QuizStatistics({ userAnswers, totalQuestions }) {
  const answeredCount = userAnswers.filter(a => a && a !== 'SKIPPED').length;
  const skippedCount = userAnswers.filter(a => a === 'SKIPPED').length;
  const remainingCount = totalQuestions - userAnswers.filter(a => a).length;

  return (
    <div className="mt-3 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-center items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
          <span>Answered: {answeredCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
          <span>Skipped: {skippedCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
          <span>Remaining: {remainingCount}</span>
        </div>
      </div>
    </div>
  );
}
