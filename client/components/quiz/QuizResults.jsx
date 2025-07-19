'use client'
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function QuizResults({ results, quiz }) {
  const router = useRouter();

  const renderAnswerComparison = (result, index) => {
    const { questionType, userAnswer, correctAnswer, options, acceptableAnswers, isSkipped, isCorrect } = result;

    if (isSkipped) {
      return (
        <div className="mb-4">
          <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Status:</strong> <span className="text-yellow-600 dark:text-yellow-400">Question Skipped</span>
            </p>
          </div>
          <div className="mt-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Correct Answer:</strong> {correctAnswer}
            </p>
            {acceptableAnswers && acceptableAnswers.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Also Acceptable:</strong>
                </p>
                <ul className="list-disc list-inside text-xs text-blue-700 dark:text-blue-400 mt-1">
                  {acceptableAnswers.map((acceptable, i) => (
                    <li key={i}>{acceptable}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    }

    switch (questionType) {
      case 'mcq':
        return (
          <div className="mb-4">
            <div className="space-y-2">
              {options?.map((option, optIndex) => {
                const isUserSelection = userAnswer === option;
                const isCorrectOption = correctAnswer === option;
                
                let className = "p-3 rounded-lg border text-sm ";
                if (isUserSelection && isCorrect) {
                  className += "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-600 text-green-800 dark:text-green-200";
                } else if (isUserSelection && !isCorrect) {
                  className += "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-600 text-red-800 dark:text-red-200";
                } else if (isCorrectOption) {
                  className += "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-800 dark:text-blue-200";
                } else {
                  className += "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400";
                }
                
                return (
                  <div key={optIndex} className={className}>
                    <div className="flex items-center justify-between">
                      <span><strong>{String.fromCharCode(65 + optIndex)}.</strong> {option}</span>
                      <div className="flex gap-2">
                        {isUserSelection && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700">
                            Your Answer {isCorrect ? '✓' : '✗'}
                          </span>
                        )}
                        {isCorrectOption && (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'true_false':
        return (
          <div className="mb-4">
            <div className="space-y-2">
              {['True', 'False'].map((option) => {
                const isUserSelection = userAnswer === option;
                const isCorrectOption = correctAnswer === option;
                
                let className = "p-3 rounded-lg border text-sm ";
                if (isUserSelection && isCorrect) {
                  className += "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-600 text-green-800 dark:text-green-200";
                } else if (isUserSelection && !isCorrect) {
                  className += "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-600 text-red-800 dark:text-red-200";
                } else if (isCorrectOption) {
                  className += "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-800 dark:text-blue-200";
                } else {
                  className += "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400";
                }
                
                return (
                  <div key={option} className={className}>
                    <div className="flex items-center justify-between">
                      <span><strong>{option}</strong></span>
                      <div className="flex gap-2">
                        {isUserSelection && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700">
                            Your Answer {isCorrect ? '✓' : '✗'}
                          </span>
                        )}
                        {isCorrectOption && (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'text_input':
        return (
          <div className="mb-4 space-y-3">
            <div className={`p-3 rounded-lg border ${
              isCorrect 
                ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-600' 
                : 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-600'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Answer:</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isCorrect 
                    ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200' 
                    : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                }`}>
                  {isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                </span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200">{userAnswer}</p>
            </div>
            
            <div className="p-3 rounded-lg border bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600">
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">AI's Correct Answer:</span>
                <span className="text-xs px-2 py-1 ml-2 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                  Reference Answer
                </span>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">{correctAnswer}</p>
              
              {acceptableAnswers && acceptableAnswers.length > 0 && (
                <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Also Acceptable:</span>
                  <ul className="list-disc list-inside text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {acceptableAnswers.map((acceptable, i) => (
                      <li key={i}>{acceptable}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Your Answer:</strong> {userAnswer}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Correct Answer:</strong> {correctAnswer}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-black pt-16 p-4 sm:pt-20">
      <div className="flex-grow flex items-center justify-center p-2 sm:p-4 sm:mt-5 mt-5">
        <div className="w-full max-w-full sm:max-w-4xl mx-auto">
          <div className="bg-white dark:bg-black rounded-lg shadow-lg p-5 sm:p-8 border border-gray-200 dark:border-gray-800" 
          style={{borderRadius: '55px'}}>
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 sm:mb-4">Quiz Complete!</h1>
              <div className="text-4xl sm:text-6xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">{results.score}%</div>
              <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 mb-2">
                You got {results.correctCount} out of {results.totalQuestions} questions correct
              </p>
              {results.skippedCount > 0 && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  {results.skippedCount} question(s) skipped
                </p>
              )}
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Subject:</strong> {quiz.subject}</p>
                {quiz.concept && <p><strong>Concept:</strong> {quiz.concept}</p>}
                <p><strong>Difficulty:</strong> {quiz.difficulty}</p>
                <p><strong>Quiz Type:</strong> {quiz.quizType}</p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 sm:mb-4">Review Your Answers</h2>
              
              {results.results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 sm:p-6 rounded-lg border-2 ${
                    result.isSkipped 
                      ? 'border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
                      : result.isCorrect 
                      ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20' 
                      : 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
                      Question {index + 1} ({result.questionType.replace('_', ' ')})
                    </h3>
                    <div className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${
                      result.isSkipped
                        ? 'bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100'
                        : result.isCorrect 
                        ? 'bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-100' 
                        : 'bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-100'
                    }`}>
                      {result.isSkipped ? 'Skipped' : result.isCorrect ? 'Correct' : 'Incorrect'}
                    </div>
                  </div>
                  
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">{result.question}</p>
                  
                  {renderAnswerComparison(result, index)}
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-2 sm:p-3">
                    <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
                      <strong>Explanation:</strong> {result.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
              <Link
                href="/home"
                className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white font-semibold py-2 sm:py-3 px-6 sm:px-8 rounded-lg shadow-lg text-sm sm:text-base text-center transition-colors"
              >
                Go Home
              </Link>
              
              <button
                onClick={() => {
                  // Get the last session ID from localStorage or create a new one
                  const lastSessionId = localStorage.getItem('lastStudySessionId') || 'new';
                  router.push(`/home/studybuddy/${lastSessionId}`);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold py-2 sm:py-3 px-6 sm:px-8 rounded-lg shadow-lg text-sm sm:text-base transition-colors"
              >
                Go to Study Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
