import { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import SkillRadarChart from './SkillRadarChart';
import ResourceRecommendations from './ResourceRecommendations';

const getOptionStyle = (isUserAnswer, isCorrect, isCorrectAnswer) => {
  let baseStyle = "p-2 rounded-lg text-sm transition-all";
  
  if (isUserAnswer && isCorrect) {
    return `${baseStyle} bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-200 border border-green-400 dark:border-green-700`;
  }
  if (isUserAnswer && !isCorrect) {
    return `${baseStyle} bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-200 border border-red-400 dark:border-red-700`;
  }
  if (isCorrectAnswer && !isUserAnswer) {
    return `${baseStyle} bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 border border-blue-400 dark:border-blue-700`;
  }
  return `${baseStyle} bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600`;
};

export default function QuizResultModal({ quiz, isOpen, onClose, onRetake }) {
  const [showAiReview, setShowAiReview] = useState(false);
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  
  const generateReview = useMutation(api.aiReview.generateReview);
  
  // Query for existing AI review
  const aiReview = useQuery(
    api.aiReview.getReviewByQuizId, 
    quiz ? { quizId: quiz._id } : { quizId: "" }
  );
  
  if (!quiz) return null;
  
  const handleGenerateReview = async () => {
    if (aiReview) {
      // Review already exists, just show it
      setShowAiReview(true);
      return;
    }
    
    // Generate new review
    setIsGeneratingReview(true);
    try {
      await generateReview({ 
        quizId: quiz._id,
        username: quiz.username
      });
      setShowAiReview(true);
    } catch (error) {
      console.error("Error generating review:", error);
    } finally {
      setIsGeneratingReview(false);
    }
  };
  
  // Calculate total score
  const totalQuestions = quiz.questions?.length || 0;
  const correctAnswers = quiz.answers?.filter(a => a.isCorrect).length || 0;
  const score = Math.round((correctAnswers / totalQuestions) * 100);

  // Helper function to render answer based on question type
  const renderAnswer = (question, userAnswer, isUserAnswer = false) => {
    switch (question.questionType) {
      case 'mcq':
        // For MCQ, show the full option text if user selected a letter
        if (isUserAnswer && /^[a-d]$/i.test(userAnswer?.userAnswer)) {
          const optionIndex = userAnswer.userAnswer.toUpperCase().charCodeAt(0) - 65;
          return question.options?.[optionIndex] || userAnswer.userAnswer;
        }
        return isUserAnswer ? userAnswer?.userAnswer : question.aiAnswer;
        
      case 'true_false':
        return isUserAnswer ? userAnswer?.userAnswer : question.aiAnswer;
        
      case 'text_input':
        return isUserAnswer ? userAnswer?.userAnswer : question.aiAnswer;
        
      default:
        return isUserAnswer ? userAnswer?.userAnswer : question.aiAnswer;
    }
  };

  // Helper function to render question options based on type
  const renderQuestionOptions = (question, userAnswer) => {
    const isCorrect = userAnswer?.isCorrect || false;

    switch (question.questionType) {
      case 'mcq':
        return (
          <div className="ml-8 space-y-2">
            {question.options?.map((option, oIndex) => {
              const letter = String.fromCharCode(65 + oIndex);
              const isUserSelection = userAnswer?.userAnswer === letter || userAnswer?.userAnswer === option;
              const isCorrectOption = question.aiAnswer === option;
              
              return (
                <div 
                  key={oIndex}
                  className={getOptionStyle(isUserSelection, isCorrect, isCorrectOption)}
                >
                  <span className="font-medium">{letter}. </span>
                  {option}
                  {isUserSelection && (
                    <span className="ml-2">
                      {isCorrect ? '✓' : '✗'}
                    </span>
                  )}
                  {isCorrectOption && !isUserSelection && (
                    <span className="ml-2 text-blue-600 dark:text-blue-300">
                      (Correct Answer)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'true_false':
        return (
          <div className="ml-8 space-y-2">
            {['True', 'False'].map((option) => {
              const isUserSelection = userAnswer?.userAnswer === option;
              const isCorrectOption = question.aiAnswer === option;
              
              return (
                <div 
                  key={option}
                  className={getOptionStyle(isUserSelection, isCorrect, isCorrectOption)}
                >
                  {option}
                  {isUserSelection && (
                    <span className="ml-2">
                      {isCorrect ? '✓' : '✗'}
                    </span>
                  )}
                  {isCorrectOption && !isUserSelection && (
                    <span className="ml-2 text-blue-600 dark:text-blue-300">
                      (Correct Answer)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'text_input':
        return (
          <div className="ml-8 space-y-3">
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
              <p className="text-sm text-gray-800 dark:text-gray-200">{userAnswer?.userAnswer}</p>
            </div>
            
            <div className="p-3 rounded-lg border bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600">
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">AI's Correct Answer:</span>
                <span className="text-xs px-2 py-1 ml-2 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                  Reference Answer
                </span>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">{question.aiAnswer}</p>
              
              {/* Show keywords that were expected */}
              {question.keywordMatches && question.keywordMatches.length > 0 && (
                <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Key concepts:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {question.keywordMatches.map((keyword, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {question.acceptableAnswers && question.acceptableAnswers.length > 0 && (
                <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Also Acceptable:</span>
                  <ul className="list-disc list-inside text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {question.acceptableAnswers.map((acceptable, i) => (
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
          <div className="ml-8 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Your Answer:</strong> {userAnswer?.userAnswer}</p>
            <p><strong>Correct Answer:</strong> {question.aiAnswer}</p>
          </div>
        );
    }
  };
  
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md sm:max-w-2xl transform overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-black shadow-xl border border-gray-200 dark:border-gray-800">
                {!showAiReview ? (
                  // Quiz Results View
                  <>
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-700 dark:to-indigo-700 px-4 sm:px-6 py-3 sm:py-4 text-white">
                      <Dialog.Title className="text-lg sm:text-2xl font-semibold mb-1">
                        Quiz Results: {quiz.subject}
                      </Dialog.Title>
                      <div className="text-sm sm:text-base opacity-90 space-y-1">
                        <p>Score: {score}% ({correctAnswers} out of {totalQuestions} correct)</p>
                        {quiz.concept && <p>Concept: {quiz.concept}</p>}
                        <div className="flex gap-4 text-xs sm:text-sm">
                          {quiz.quizType && <span>Type: {quiz.quizType}</span>}
                          {quiz.difficulty && <span>Difficulty: {quiz.difficulty}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
                      {quiz.questions?.map((question, qIndex) => {
                        const userAnswer = quiz.answers?.find(a => a.questionId === question._id);
                        const isCorrect = userAnswer?.isCorrect || false;
                        
                        return (
                          <div key={question._id} className="mb-6 sm:mb-8 last:mb-0">
                            <div className="flex items-start mb-3">
                              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3 ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                {isCorrect ? '✓' : '✗'}
                              </span>
                              <div className="flex-1">
                                <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                                  {qIndex + 1}. {question.questionText}
                                </h3>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                                    {question.questionType?.replace('_', ' ') || 'MCQ'}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    isCorrect 
                                      ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200' 
                                      : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                                  }`}>
                                    {isCorrect ? 'Correct' : 'Incorrect'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {renderQuestionOptions(question, userAnswer)}
                            
                            {(!isCorrect || question.questionType === 'text_input') && (
                              <div className="mt-3 ml-8 text-xs sm:text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                                <span className="font-medium">Explanation:</span> {question.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 py-3 sm:py-4 flex justify-between border-t border-gray-200 dark:border-gray-800">
                      <button
                        onClick={handleGenerateReview}
                        disabled={isGeneratingReview}
                        className="px-4 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-600 dark:to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 dark:hover:from-purple-700 dark:hover:to-indigo-700 transition-colors font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                      >
                        {isGeneratingReview ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating Review...
                          </>
                        ) : (
                          <>
                            <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                            </svg>
                            AI Review
                          </>
                        )}
                      </button>
                      
                      <div className="flex gap-2">
                        {quiz.retakeCount < 1 && (
                          <button
                            onClick={() => onRetake(quiz._id)}
                            className="px-4 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 transition-colors font-medium text-sm"
                          >
                            Retake Quiz
                          </button>
                        )}
                        <button
                          onClick={onClose}
                          className="px-4 sm:px-5 py-1.5 sm:py-2 bg-gray-500 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  // AI Review View
                  <>
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-700 dark:to-indigo-700 px-4 sm:px-6 py-3 sm:py-4 text-white">
                      <Dialog.Title className="text-lg sm:text-2xl font-semibold mb-1 flex items-center">
                        <svg className="mr-2 h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        AI Review: {quiz.subject}
                      </Dialog.Title>
                    </div>
                    
                    <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
                      {!aiReview ? (
                        <div className="flex flex-col items-center justify-center py-10">
                          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Loading AI review...</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Performance Summary Card */}
                          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                Performance Summary
                              </h3>
                              <div className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center ${
                                score >= 80 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" :
                                score >= 60 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200" :
                                "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                              }`}>
                                {score}% Score
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex-1 bg-white dark:bg-black rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center mb-1.5">
                                  <svg className="w-4 h-4 text-green-500 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                  </svg>
                                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">STRENGTHS</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                  {(aiReview.strengths || "").split("\n\n")[0]}
                                </p>
                              </div>
                              <div className="flex-1 bg-white dark:bg-black rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center mb-1.5">
                                  <svg className="w-4 h-4 text-amber-500 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                  </svg>
                                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">AREAS TO IMPROVE</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                  {(aiReview.improvement_suggestions || "").split("\n\n")[0]}
                                </p>
                              </div>
                            </div>
                          </div>


                          {/* Skill Radar Chart */}
                          <div className="bg-white dark:bg-black rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                              Concept Mastery Overview
                            </h3>
                            <div className="h-56 sm:h-64 relative">
                              {aiReview && aiReview.concept_breakdown && aiReview.concept_breakdown.length >= 2 ? (
                                <SkillRadarChart concepts={aiReview.concept_breakdown} />
                              ) : (
                                <div className="flex items-center justify-center h-full w-full">
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {!aiReview ? "Loading chart data..." : 
                                     aiReview.concept_breakdown && aiReview.concept_breakdown.length === 1 ? 
                                     "Need at least 2 concepts to generate a radar chart" : 
                                     "No concept data available"}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Debug information */}
                          {process.env.NODE_ENV === 'development' && aiReview && (
                            <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                              <details>
                                <summary>Debug: Concept Data</summary>
                                <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-32">
                                  {JSON.stringify(aiReview.concept_breakdown, null, 2)}
                                </pre>
                              </details>
                            </div>
                          )}
                          
                          {/* Concept Breakdown with Progress Bars */}
                          <div className="bg-white dark:bg-black rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                              Concept Mastery Details
                            </h3>
                            <div className="space-y-4">
                              {aiReview.concept_breakdown?.map((concept, index) => {
                                const masteryPercentage = concept.mastery_level === "Strong" ? 85 : 
                                                      concept.mastery_level === "Moderate" ? 65 : 35;
                                
                                const getBgColor = (level) => {
                                  switch(level) {
                                    case "Strong": return "bg-green-500";
                                    case "Moderate": return "bg-yellow-500";
                                    default: return "bg-red-500";
                                  }
                                };
                                
                                return (
                                  <div key={index} className="relative">
                                    <div className="flex justify-between items-center mb-1">
                                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {concept.concept}
                                      </h4>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        concept.mastery_level === "Strong" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" :
                                        concept.mastery_level === "Moderate" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200" :
                                        "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                                      }`}>
                                        {concept.mastery_level}
                                      </span>
                                    </div>
                                    
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                      <div 
                                        className={`h-2.5 rounded-full ${getBgColor(concept.mastery_level)}`}
                                        style={{ width: `${masteryPercentage}%` }}
                                      ></div>
                                    </div>
                                    
                                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                      {concept.suggestion}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Detailed Analysis Section */}
                          <div className="space-y-4">
                            {/* Overall Feedback */}
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30">
                              <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                </svg>
                                <h3 className="text-base font-semibold text-purple-900 dark:text-purple-200">
                                  Overall Assessment
                                </h3>
                              </div>
                              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
                                {aiReview.feedback}
                              </p>
                            </div>
                            
                            {/* Strengths */}
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800/30">
                              <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <h3 className="text-base font-semibold text-green-900 dark:text-green-200">
                                  Your Strengths
                                </h3>
                              </div>
                              <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
                                {aiReview.strengths}
                              </div>
                            </div>
                            
                            {/* Improvement Plan */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                              <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                                <h3 className="text-base font-semibold text-blue-900 dark:text-blue-200">
                                  Improvement Plan
                                </h3>
                              </div>
                              <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
                                {aiReview.improvement_suggestions}
                              </div>
                            </div>
                          </div>
                          
                          {/* Learning Resources */}
                          <ResourceRecommendations 
                            concepts={aiReview.concept_breakdown} 
                            subject={quiz.subject}
                            learningResources={aiReview.learning_resources}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 py-3 sm:py-4 flex justify-between border-t border-gray-200 dark:border-gray-800">
                      <button
                        onClick={() => setShowAiReview(false)}
                        className="px-4 sm:px-5 py-1.5 sm:py-2 bg-purple-500 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-600 dark:hover:bg-purple-600 transition-colors font-medium text-sm"
                      >
                        Back to Results
                      </button>
                      <button
                        onClick={onClose}
                        className="px-4 sm:px-5 py-1.5 sm:py-2 bg-gray-500 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}