"use client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

// Icon Components
const icons = {
  Math: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  Science: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  History: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Geography: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Literature: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Computer: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
  MCQ: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  TrueFalse: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Writing: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  Mixed: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  Easy: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Medium: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Hard: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    </svg>
  ),
  Close: () => (
    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  )
};

// Constants with icon references
const PREDEFINED_SUBJECTS = [
  { name: 'Mathematics', icon: icons.Math, color: 'from-blue-400 to-blue-600' },
  { name: 'Science', icon: icons.Science, color: 'from-green-400 to-green-600' },
  { name: 'History', icon: icons.History, color: 'from-amber-400 to-amber-600' },
  { name: 'Geography', icon: icons.Geography, color: 'from-teal-400 to-teal-600' },
  { name: 'Literature', icon: icons.Literature, color: 'from-purple-400 to-purple-600' },
  { name: 'Computer Science', icon: icons.Computer, color: 'from-indigo-400 to-indigo-600' }
];

const QUESTION_COUNTS = [5, 10, 15, 20];

const QUIZ_TYPES = [
  { id: 'mcq', name: 'Multiple Choice', icon: icons.MCQ, description: 'Only MCQ questions' },
  { id: 'true_false', name: 'True/False', icon: icons.TrueFalse, description: 'Only True/False questions' },
  { id: 'writing', name: 'Writing', icon: icons.Writing, description: 'Only text input questions' },
  { id: 'mixed', name: 'Mixed', icon: icons.Mixed, description: 'Combination of all types' }
];

const DIFFICULTY_LEVELS = [
  { id: 'easy', name: 'Easy', icon: icons.Easy, description: 'Basic concepts', color: 'text-green-500' },
  { id: 'medium', name: 'Medium', icon: icons.Medium, description: 'Intermediate level', color: 'text-yellow-500' },
  { id: 'hard', name: 'Hard', icon: icons.Hard, description: 'Advanced concepts', color: 'text-red-500' }
];

const CreateQuizModal = ({ 
  isOpen, 
  onClose, 
  subject, 
  setSubject, 
  concept,
  setConcept,
  questionCount, 
  setQuestionCount,
  quizType,
  setQuizType,
  difficulty,
  setDifficulty,
  onCreateQuiz, 
  loading,
  generationStage,
  generationProgress
}) => {
  // Enhanced button rendering for quiz generation
  const renderGenerateButton = () => {
    if (loading) {
      return (
        <div className="flex-2">
          <div className="relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600">
            {/* Animated background fill */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-600 transition-all duration-700 ease-out"
              style={{ 
                width: `${generationProgress}%`,
                background: generationProgress > 80 
                  ? 'linear-gradient(to right, #10b981, #059669, #047857)'
                  : generationProgress > 50
                  ? 'linear-gradient(to right, #6366f1, #8b5cf6, #ec4899)'
                  : 'linear-gradient(to right, #3b82f6, #6366f1, #8b5cf6)'
              }}
            />
            
            {/* Content overlay */}
            <div className="relative z-10 px-3 py-2.5 sm:px-4 sm:py-3 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-2 flex-shrink-0">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium leading-tight">{generationStage}</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <div className="text-xs sm:text-sm font-bold tabular-nums">
                    {Math.round(generationProgress)}%
                  </div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>
            </div>
            
            {/* Shimmer effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 transition-transform duration-1000"
              style={{
                transform: `translateX(${generationProgress * 3 - 100}%) skewX(-12deg)`,
                width: '50%'
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={onCreateQuiz}
        disabled={loading || !subject.trim()}
        className="flex-2 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 hover:from-indigo-600 hover:to-purple-600 dark:hover:from-indigo-700 dark:hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:dark:from-gray-600 disabled:dark:to-gray-600 text-white py-2.5 px-4 sm:py-3 sm:px-6 rounded-lg transition-all font-medium transform active:scale-95 shadow-md flex items-center justify-center text-sm sm:text-base"
      >
        <icons.Plus />
        <span className="ml-1.5 sm:ml-2">Create Quiz</span>
      </button>
    );
  };

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog 
          as="div" 
          className="relative z-50" 
          onClose={() => !loading && onClose()}
          static={loading}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto p-4 sm:p-4">
            <div className="flex min-h-full items-start sm:items-center justify-center p-2 sm:p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 mt-4 sm:mt-0">
                  {/* Enhanced Header */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 px-4 py-4 sm:px-6 sm:py-5 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/5"></div>
                    <div className="relative z-10 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="mr-2 sm:mr-3 p-1.5 sm:p-2 bg-white/10 rounded-lg">
                          <icons.MCQ />
                        </div>
                        <div>
                          <Dialog.Title className="text-lg sm:text-xl font-bold mb-0.5 sm:mb-1">
                            Create Custom Quiz
                          </Dialog.Title>
                          <p className="text-indigo-100 dark:text-indigo-200 text-xs sm:text-sm">Design your personalized learning experience</p>
                        </div>
                      </div>
                      {!loading && (
                        <button
                          onClick={onClose}
                          className="text-white hover:text-indigo-100 dark:hover:text-indigo-300 p-1.5 sm:p-2 rounded-full hover:bg-white/10 dark:hover:bg-gray-800/30 transition-all"
                        >
                          <icons.Close />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 bg-white dark:bg-gray-900">
                    <div className="space-y-5 sm:space-y-6">
                      {/* Subject Section */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3">
                          Subject *
                        </label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="e.g., Mathematics, Computer Science, History"
                          className="w-full p-3 sm:p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all text-sm sm:text-base"
                          disabled={loading}
                        />
                        
                        <div className="mt-3 sm:mt-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">Popular Subjects:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
                            {PREDEFINED_SUBJECTS.map((subj) => (
                              <button
                                key={subj.name}
                                onClick={() => setSubject(subj.name)}
                                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all active:scale-95 ${
                                  subject === subj.name
                                    ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-md'
                                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                                disabled={loading}
                              >
                                <div className="flex items-center">
                                  <div className="mr-2 sm:mr-3">
                                    <subj.icon />
                                  </div>
                                  <span className="truncate">{subj.name}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Concept Section */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3">
                          Specific Concept (Optional)
                        </label>
                        <input
                          type="text"
                          value={concept}
                          onChange={(e) => setConcept(e.target.value)}
                          placeholder="e.g., Linear Algebra, Data Structures, World War II"
                          className="w-full p-3 sm:p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all text-sm sm:text-base"
                          disabled={loading}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m-1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Narrow down your quiz to a specific topic for focused learning
                        </p>
                      </div>

                      {/* Quiz Type Section */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4">
                          Question Type
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-3">
                          {QUIZ_TYPES.map((type) => (
                            <button
                              key={type.id}
                              onClick={() => setQuizType(type.id)}
                              className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all active:scale-95 ${
                                quizType === type.id
                                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-md'
                                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                              }`}
                              disabled={loading}
                            >
                              <div className="flex items-center mb-2">
                                <div className="mr-2 sm:mr-3">
                                  <type.icon />
                                </div>
                                <span className="font-semibold text-sm sm:text-base">{type.name}</span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{type.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Difficulty Section */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4">
                          Difficulty Level
                        </label>
                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                          {DIFFICULTY_LEVELS.map((level) => (
                            <button
                              key={level.id}
                              onClick={() => setDifficulty(level.id)}
                              className={`p-3 sm:p-4 rounded-xl border-2 text-center transition-all active:scale-95 ${
                                difficulty === level.id
                                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-md'
                                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                              }`}
                              disabled={loading}
                            >
                              <div className={`mb-1 sm:mb-2 flex justify-center ${level.color}`}>
                                <level.icon />
                              </div>
                              <div className="font-semibold text-sm">{level.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">{level.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Question Count Section */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4">
                          Number of Questions
                        </label>
                        <div className="grid grid-cols-4 gap-2 sm:gap-3">
                          {QUESTION_COUNTS.map((count) => (
                            <button
                              key={count}
                              onClick={() => setQuestionCount(count)}
                              className={`p-3 sm:p-4 rounded-xl border-2 text-center transition-all active:scale-95 ${
                                questionCount === count
                                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-md'
                                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                              }`}
                              disabled={loading}
                            >
                              <div className="flex items-center justify-center mb-1 sm:mb-2">
                                <icons.Plus className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500" />
                              
                              {/* visible on mobile only */}
                              <div className="text-lg sm:text-xl ml-1 font-bold">{count}</div>
                              <div className="text-md sm:text-sm text-black font-bold dark:text-black-400 ml-1 block sm:hidden">Q</div>
                              </div>
                              {/* visible on on desktop only */}
                              <div className="hidden sm:block mt-1.5">
                                <div className="text-xs text-gray-500 dark:text-gray-400">Questions</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Enhanced Quiz Summary */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 sm:p-5 border border-gray-200 dark:border-gray-600">
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center text-sm sm:text-base">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Quiz Summary
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Subject:</span>
                              <span className="font-medium text-gray-800 dark:text-gray-200 truncate ml-2">{subject || 'Not selected'}</span>
                            </div>
                            {concept && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Concept:</span>
                                <span className="font-medium text-gray-800 dark:text-gray-200 truncate ml-2">{concept}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Type:</span>
                              <span className="font-medium text-gray-800 dark:text-gray-200">{QUIZ_TYPES.find(t => t.id === quizType)?.name}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                              <span className="font-medium text-gray-800 dark:text-gray-200">{DIFFICULTY_LEVELS.find(d => d.id === difficulty)?.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Questions:</span>
                              <span className="font-medium text-gray-800 dark:text-gray-200">{questionCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Footer */}
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row gap-2 sm:gap-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={onClose}
                      className="order-2 sm:order-1 flex-1 py-2.5 px-4 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold transition-all active:scale-95 text-sm sm:text-base"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <div className="order-1 sm:order-2 flex-2 flex justify-center sm:justify-end">
                      {renderGenerateButton()}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <style jsx>{`
        .stage-text {
          animation: fadeInUp 0.3s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .flex-2 {
            flex: 1;
          }
        }
      `}</style>
    </>
  );
};

export default CreateQuizModal;