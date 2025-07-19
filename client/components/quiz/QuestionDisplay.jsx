'use client'

export default function QuestionDisplay({ 
  question, 
  currentQuestion, 
  selectedAnswer, 
  textAnswer, 
  onAnswerSelect, 
  onTextChange,
  disabled = false
}) {
  const handleAnswerSelect = (answer) => {
    onAnswerSelect(answer);
  };

  const handleTextChange = (value) => {
    onTextChange(value);
  };

  const renderQuestionInput = () => {
    if (!question) return null;

    switch (question.questionType) {
      case 'mcq':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => !disabled && handleAnswerSelect(option)}
                disabled={disabled}
                className={`w-full text-left p-3 sm:p-4 border rounded-lg transition-all duration-200 ${
                  disabled 
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60'
                    : selectedAnswer === option
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 ${
                    selectedAnswer === option
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedAnswer === option && (
                      <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                    )}
                  </div>
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium">
                    {String.fromCharCode(65 + index)}. {option}
                  </span>
                </div>
              </button>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-3">
            {['True', 'False'].map((option) => (
              <button
                key={option}
                onClick={() => !disabled && handleAnswerSelect(option)}
                disabled={disabled}
                className={`w-full text-left p-3 sm:p-4 border rounded-lg transition-all duration-200 ${
                  disabled 
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60'
                    : selectedAnswer === option
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 ${
                    selectedAnswer === option
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedAnswer === option && (
                      <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                    )}
                  </div>
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium">
                    {option}
                  </span>
                </div>
              </button>
            ))}
          </div>
        );

      case 'text_input':
        return (
          <div className="space-y-3">
            <textarea
              value={textAnswer}
              onChange={(e) => !disabled && handleTextChange(e.target.value)}
              placeholder={disabled ? "Please enter fullscreen to answer..." : "Type your answer here..."}
              disabled={disabled}
              className={`w-full p-3 sm:p-4 border rounded-lg resize-none text-sm sm:text-base transition-all duration-200 ${
                disabled 
                  ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-100'
              }`}
              rows="4"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Provide a clear and concise answer. The AI will evaluate your response.
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Unsupported question type</p>
          </div>
        );
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-lg w-7 h-7 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
          Q{currentQuestion + 1}
        </div>
        <div className="flex-1">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {question?.questionText}
          </h2>
          <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs font-medium">
            {question?.questionType?.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {renderQuestionInput()}
    </div>
  );
}
