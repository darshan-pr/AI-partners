'use client'
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

// Import quiz components
import QuizHeader from '@/components/quiz/QuizHeader';
import QuestionDisplay from '@/components/quiz/QuestionDisplay';
import QuizNavigation from '@/components/quiz/QuizNavigation';
import FullscreenWarning from '@/components/quiz/FullscreenWarning';
import QuizStatistics from '@/components/quiz/QuizStatistics';
import QuizLoading from '@/components/quiz/QuizLoading';
import FullscreenPrompt from '@/components/quiz/FullscreenPrompt';

// Import lazy-loaded components for better performance
import { 
  LazyReviewModal as ReviewModal, 
  LazyQuizResults as QuizResults, 
  LazyExitConfirmationModal as ExitConfirmationModal 
} from '@/components/quiz/LazyComponents';

// Import utility functions
import { 
  analyzeTextInputAnswer, 
  isAnswerCorrect, 
  enterFullscreen, 
  exitFullscreen, 
  checkFullscreen,
  getStageIcon 
} from '@/components/quiz/quizUtils';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  
  // State management
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState('');
  const [submitProgress, setSubmitProgress] = useState(0);
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [navigationBlocked, setNavigationBlocked] = useState(false);

  // Convex queries and mutations
  const quizData = useQuery(api.quiz.getQuizById, { 
    quizId: params.quizId 
  });
  const submitAnswersMutation = useMutation(api.quiz.submitQuizAnswers);
  const updateQuizScoreMutation = useMutation(api.quiz.updateQuizScore);
  const keepPreviousScoreMutation = useMutation(api.quiz.keepPreviousScore);

  // Fullscreen event handler
  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(checkFullscreen());
  }, []);

  // Start quiz function
  const startQuiz = () => {
    enterFullscreen();
    setTimeout(() => {
      if (checkFullscreen()) {
        setQuizStarted(true);
        setShowFullscreenPrompt(false);
        // Push initial state to enable navigation prevention
        window.history.pushState(null, null, window.location.pathname);
      }
    }, 100);
  };

  // Initialize component
  useEffect(() => {
    // Hide navbar on quiz page
    const navbar = document.querySelector('nav');
    if (navbar) {
      navbar.style.display = 'none';
    }

    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const savedTheme = localStorage.getItem("theme");
    const systemDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDarkMode = savedTheme ? savedTheme === "dark" : systemDarkMode;
    setIsDark(initialDarkMode);
    document.documentElement.classList.toggle("dark", initialDarkMode);

    const handleThemeChange = (e) => {
      const newDarkMode = e.detail.isDark;
      setIsDark(newDarkMode);
      document.documentElement.classList.toggle("dark", newDarkMode);
    };
    window.addEventListener("themeChanged", handleThemeChange);

    // Add fullscreen event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    // Check initial fullscreen state
    setIsFullscreen(checkFullscreen());

    // Browser navigation prevention
    const handleBeforeUnload = (e) => {
      if (quizStarted && !showResults && !submitting) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handlePopState = (e) => {
      if (quizStarted && !showResults && !submitting && !showExitConfirm) {
        e.preventDefault();
        // Push current state back to prevent navigation
        window.history.pushState(null, null, window.location.pathname);
        setShowExitConfirm(true);
        return false;
      }
    };

    // Add browser navigation prevention
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    if (quizData) {
      setQuiz(quizData);
      setUserAnswers(new Array(quizData.questions?.length || 0).fill(''));
      // Check if user is in fullscreen, if not show prompt
      if (!checkFullscreen()) {
        setShowFullscreenPrompt(true);
      } else {
        setQuizStarted(true);
      }
    }

    // Cleanup function to show navbar when leaving quiz page
    return () => {
      const navbar = document.querySelector('nav');
      if (navbar) {
        navbar.style.display = 'block';
      }
      window.removeEventListener("themeChanged", handleThemeChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [quizData, handleFullscreenChange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Additional useEffect to handle fullscreen change events for starting quiz
  useEffect(() => {
    const handleFullscreenStartQuiz = () => {
      if (checkFullscreen() && showFullscreenPrompt && !quizStarted) {
        setQuizStarted(true);
        setShowFullscreenPrompt(false);
      }
      if (checkFullscreen() && showReviewModal) {
        setShowReviewModal(false);
      }
    };

    const handleKeyDown = (event) => {
      // F11 for fullscreen toggle
      if (event.key === 'F11') {
        event.preventDefault();
        if (checkFullscreen()) {
          exitFullscreen();
        } else {
          enterFullscreen();
        }
      }
      // Escape key handling during quiz
      if (event.key === 'Escape' && quizStarted && !showResults && !submitting) {
        event.preventDefault();
        setShowExitConfirm(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenStartQuiz);
    document.addEventListener('mozfullscreenchange', handleFullscreenStartQuiz);
    document.addEventListener('webkitfullscreenchange', handleFullscreenStartQuiz);
    document.addEventListener('msfullscreenchange', handleFullscreenStartQuiz);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenStartQuiz);
      document.removeEventListener('mozfullscreenchange', handleFullscreenStartQuiz);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenStartQuiz);
      document.removeEventListener('msfullscreenchange', handleFullscreenStartQuiz);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFullscreenPrompt, quizStarted, showReviewModal, showResults, submitting, setShowExitConfirm, setQuizStarted, setShowFullscreenPrompt, setShowReviewModal]);

  // Security useEffect - Disable developer tools, copy, paste, select
  useEffect(() => {
    if (!quizStarted || showResults) return;

    // Disable right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Disable copy, paste, cut, select all
    const handleKeyDown = (e) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U')) ||
        (e.ctrlKey && (e.key === 's' || e.key === 'S')) ||
        (e.ctrlKey && (e.key === 'a' || e.key === 'A')) ||
        (e.ctrlKey && (e.key === 'c' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'v' || e.key === 'V')) ||
        (e.ctrlKey && (e.key === 'x' || e.key === 'X')) ||
        (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) ||
        (e.ctrlKey && (e.key === 'y' || e.key === 'Y'))
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Disable text selection
    const handleSelectStart = (e) => {
      e.preventDefault();
      return false;
    };

    // Disable drag
    const handleDragStart = (e) => {
      e.preventDefault();
      return false;
    };

    // Add security event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);

    // Add CSS to disable text selection
    const style = document.createElement('style');
    style.textContent = `
      body.quiz-security {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      .quiz-container * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        pointer-events: auto !important;
      }
      .quiz-container input, .quiz-container textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
        pointer-events: auto !important;
      }
      .quiz-container img {
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
        pointer-events: none !important;
      }
      .quiz-container::selection {
        background: transparent !important;
      }
      .quiz-container::-moz-selection {
        background: transparent !important;
      }
    `;
    document.head.appendChild(style);
    document.body.classList.add('quiz-security');

    // Disable printing
    window.addEventListener('beforeprint', (e) => {
      e.preventDefault();
      alert('Printing is disabled during the quiz.');
      return false;
    });

    // Monitor developer tools
    let devtools = {
      open: false,
      orientation: null
    };
    
    const checkDevTools = () => {
      const threshold = 160;
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true;
          alert('Developer tools detected! Please close them to continue the quiz.');
          // Optionally trigger exit confirmation
          setShowExitConfirm(true);
        }
      } else {
        devtools.open = false;
      }
    };

    const devToolsInterval = setInterval(checkDevTools, 500);

    // Disable console
    if (typeof window !== 'undefined') {
      // Disable console methods
      const noop = () => {};
      if (window.console) {
        Object.keys(window.console).forEach(key => {
          if (typeof window.console[key] === 'function') {
            window.console[key] = noop;
          }
        });
      }
    }

    // Prevent text highlighting with mouse
    const handleMouseDown = (e) => {
      if (e.detail > 1) { // Multiple clicks
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('mousedown', handleMouseDown);

    // Disable image saving
    const handleDrop = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragover', (e) => e.preventDefault());

    // Detect tab switching / window focus loss
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs or minimized window
        console.warn('Tab switch detected during quiz');
        // You could add more strict measures here if needed
      }
    };

    const handleWindowBlur = () => {
      console.warn('Window focus lost during quiz');
      // You could add more strict measures here if needed
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    // Disable page zoom
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup security features
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragover', (e) => e.preventDefault());
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('wheel', handleWheel);
      window.removeEventListener('blur', handleWindowBlur);
      document.body.classList.remove('quiz-security');
      
      // Remove the style element
      const styleElements = document.querySelectorAll('style');
      styleElements.forEach(el => {
        if (el.textContent.includes('quiz-security')) {
          el.remove();
        }
      });
      
      clearInterval(devToolsInterval);
    };
  }, [quizStarted, showResults, setShowExitConfirm, showExitConfirm, submitting]);

  // Answer handling functions
  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleTextChange = (value) => {
    setTextAnswer(value);
  };

  const getCurrentAnswer = () => {
    const question = quiz.questions[currentQuestion];
    if (question.questionType === 'text_input') {
      return textAnswer;
    }
    return selectedAnswer;
  };

  const handleNext = () => {
    const currentAnswer = getCurrentAnswer();
    
    const newAnswers = [...userAnswers];
    // If no answer provided, treat as skip
    newAnswers[currentQuestion] = currentAnswer || 'SKIPPED';
    setUserAnswers(newAnswers);
    
    setSelectedAnswer('');
    setTextAnswer('');

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      const nextAnswer = newAnswers[currentQuestion + 1] || '';
      const nextQuestion = quiz.questions[currentQuestion + 1];
      if (nextQuestion.questionType === 'text_input') {
        setTextAnswer(nextAnswer === 'SKIPPED' ? '' : nextAnswer);
        setSelectedAnswer('');
      } else {
        setSelectedAnswer(nextAnswer === 'SKIPPED' ? '' : nextAnswer);
        setTextAnswer('');
      }
    } else {
      // Show review modal before submitting
      setShowReviewModal(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      const prevAnswer = userAnswers[currentQuestion - 1] || '';
      const prevQuestion = quiz.questions[currentQuestion - 1];
      if (prevQuestion.questionType === 'text_input') {
        setTextAnswer(prevAnswer === 'SKIPPED' ? '' : prevAnswer);
        setSelectedAnswer('');
      } else {
        setSelectedAnswer(prevAnswer === 'SKIPPED' ? '' : prevAnswer);
        setTextAnswer('');
      }
    }
  };

  const handleSubmit = () => {
    // Mark remaining questions as skipped and show review modal
    const newAnswers = [...userAnswers];
    const currentAnswer = getCurrentAnswer();
    
    // Update current question answer
    newAnswers[currentQuestion] = currentAnswer || 'SKIPPED';
    
    // Mark all remaining questions as skipped
    for (let i = currentQuestion + 1; i < quiz.questions.length; i++) {
      if (!newAnswers[i]) {
        newAnswers[i] = 'SKIPPED';
      }
    }
    
    setUserAnswers(newAnswers);
    setShowReviewModal(true);
  };

  const handleContinueQuiz = () => {
    if (!isFullscreen) {
      enterFullscreen();
    } else {
      setShowReviewModal(false);
    }
  };

  const handleSubmitAndExit = async () => {
    // Mark all remaining questions as skipped
    const newAnswers = [...userAnswers];
    const currentAnswer = getCurrentAnswer();
    
    // Update current question answer
    newAnswers[currentQuestion] = currentAnswer || 'SKIPPED';
    
    // Mark all remaining questions as skipped
    for (let i = currentQuestion + 1; i < quiz.questions.length; i++) {
      if (!newAnswers[i]) {
        newAnswers[i] = 'SKIPPED';
      }
    }
    
    setUserAnswers(newAnswers);
    setShowExitConfirm(false);
    
    // Submit the quiz directly without showing review modal
    await submitQuiz(newAnswers);
  };

  const handleEditQuestion = (questionIndex) => {
    if (submitting) return; // Prevent editing during submission
    
    setCurrentQuestion(questionIndex);
    setShowReviewModal(false);
    
    // Set the current answer for the question being edited
    const answer = userAnswers[questionIndex] || '';
    const question = quiz.questions[questionIndex];
    
    if (question.questionType === 'text_input') {
      setTextAnswer(answer === 'SKIPPED' ? '' : answer);
      setSelectedAnswer('');
    } else {
      setSelectedAnswer(answer === 'SKIPPED' ? '' : answer);
      setTextAnswer('');
    }
    
    // Re-enter fullscreen if not already in fullscreen
    if (!checkFullscreen()) {
      enterFullscreen();
    }
  };

  const handleKeepPreviousScore = async () => {
    try {
      await keepPreviousScoreMutation({
        quizId: params.quizId
      });
      
      setShowReviewModal(false);
      
      // Exit fullscreen and redirect to home
      if (checkFullscreen()) {
        exitFullscreen();
      }
      
      router.push('/home');
    } catch (error) {
      console.error('Error keeping previous score:', error);
      alert('Error keeping previous score. Please try again.');
    }
  };

  const handleKeepPreviousScoreAndExit = async () => {
    try {
      await keepPreviousScoreMutation({
        quizId: params.quizId
      });
      
      setShowExitConfirm(false);
      
      // Exit fullscreen and redirect to home
      if (checkFullscreen()) {
        exitFullscreen();
      }
      
      router.push('/home');
    } catch (error) {
      console.error('Error keeping previous score and exiting:', error);
      alert('Error keeping previous score. Please try again.');
    }
  };

  const submitQuiz = async (answers) => {
    if (!user?.username) {
      alert('User not authenticated');
      return;
    }

    setSubmitting(true);
    setSubmitProgress(0);
    
    try {
      setSubmitStage('Analyzing your answers...');
      setSubmitProgress(10);
      
      let correctCount = 0;
      let skippedCount = 0;
      
      const results = [];
      const processedAnswers = [];
      
      for (let index = 0; index < quiz.questions.length; index++) {
        const question = quiz.questions[index];
        const userAnswer = answers[index];
        const isSkipped = userAnswer === 'SKIPPED';
        
        setSubmitStage(`Analyzing question ${index + 1} of ${quiz.questions.length}...`);
        setSubmitProgress(10 + (index / quiz.questions.length) * 40);
        
        let isCorrect = false;
        let analysis = null;

        if (!isSkipped) {
          isCorrect = await isAnswerCorrect(question, userAnswer);
          if (question.questionType === 'text_input') {
            analysis = await analyzeTextInputAnswer(question, userAnswer);
          }
        }
        
        if (isCorrect) correctCount++;
        if (isSkipped) skippedCount++;
        
        results.push({
          question: question.questionText,
          questionType: question.questionType,
          userAnswer,
          correctAnswer: question.aiAnswer,
          options: question.options,
          acceptableAnswers: question.acceptableAnswers,
          keywordMatches: question.keywordMatches,
          isCorrect,
          isSkipped,
          explanation: question.explanation,
          analysis
        });

        processedAnswers.push({
          questionId: question._id,
          userAnswer: userAnswer,
          isCorrect
        });
      }

      setSubmitStage('Calculating your final score...');
      setSubmitProgress(60);
      
      const finalResults = {
        score: Math.round((correctCount / quiz.questions.length) * 100),
        correctCount,
        skippedCount,
        totalQuestions: quiz.questions.length,
        results
      };

      setSubmitStage('Saving your results...');
      setSubmitProgress(80);

      await submitAnswersMutation({
        quizId: params.quizId,
        username: user.username,
        answers: processedAnswers
      });

      await updateQuizScoreMutation({
        quizId: params.quizId,
        score: finalResults.score,
        completed: true
      });

      setSubmitStage('Finalizing results...');
      setSubmitProgress(100);

      setResults(finalResults);
      setShowResults(true);
      setShowReviewModal(false);
      
      // Exit fullscreen when results are shown
      if (checkFullscreen()) {
        exitFullscreen();
      }
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error submitting quiz. Please try again.');
    } finally {
      setSubmitting(false);
      setSubmitStage('');
      setSubmitProgress(0);
    }
  };

  // Component rendering logic
  if (showResults) {
    return <QuizResults results={results} quiz={quiz} />;
  }

  if (!quiz || !quiz.questions) {
    return <QuizLoading />;
  }

  // Show fullscreen prompt if quiz is loaded but not started
  if (quiz && showFullscreenPrompt && !quizStarted) {
    return <FullscreenPrompt quiz={quiz} onStartQuiz={startQuiz} />;
  }

  if (quiz?.completed) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-black pt-16 sm:pt-20">
        <div className="flex-grow flex items-center justify-center p-2 sm:p-4">
          <div className="w-full max-w-full sm:max-w-2xl mx-auto">
            <div className="bg-white dark:bg-black rounded-lg shadow-lg p-4 sm:p-8 text-center border border-gray-200 dark:border-gray-800"
            style={{borderRadius: '45px'}}>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 sm:mb-4">
                Quiz Already Completed
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                You have already taken this quiz. Your score was {quiz.score}%.
              </p>
              <Link
                href="/home"
                className="inline-block px-4 sm:px-6 py-1.5 sm:py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 text-sm sm:text-base"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz?.questions?.[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  // Only render quiz if it has started (user is in fullscreen)
  if (!quizStarted) {
    return null; // This should not happen as we have other guards, but just in case
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-black pt-16 quiz-container">
        <div className="flex-grow flex items-center justify-center p-6 mt-6 sm:p-4">
          <div className="w-full max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              
              {/* Quiz Header */}
              <QuizHeader 
                quiz={quiz}
                currentQuestion={currentQuestion}
                totalQuestions={quiz.questions.length}
                progress={progress}
                isFullscreen={isFullscreen}
              />

              {/* Quiz Content */}
              <div className="p-4 sm:p-6 dark:bg-black">
                {/* Fullscreen Warning */}
                <FullscreenWarning 
                  isFullscreen={isFullscreen} 
                  onEnterFullscreen={enterFullscreen}
                />

                {/* Question Display */}
                <div className={`mb-6 transition-all duration-300 ${
                  !isFullscreen 
                    ? 'filter blur-md opacity-60 pointer-events-none select-none' 
                    : 'filter blur-none opacity-100'
                }`}>
                  <QuestionDisplay 
                    question={question}
                    currentQuestion={currentQuestion}
                    selectedAnswer={selectedAnswer}
                    textAnswer={textAnswer}
                    onAnswerSelect={isFullscreen ? handleAnswerSelect : () => {}}
                    onTextChange={isFullscreen ? handleTextChange : () => {}}
                    disabled={!isFullscreen}
                  />
                </div>

                {/* Quiz Navigation */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Previous/Next Navigation Buttons - Blurred when not fullscreen */}
                  <div className={`flex gap-2 order-2 sm:order-1 transition-all duration-300 ${
                    !isFullscreen 
                      ? 'filter blur-sm opacity-50 pointer-events-none select-none' 
                      : 'filter blur-none opacity-100'
                  }`}>
                    <button
                      onClick={isFullscreen ? handlePrevious : () => {}}
                      disabled={currentQuestion === 0 || submitting || !isFullscreen}
                      className={`flex items-center px-3 py-2 border rounded-lg font-medium text-sm transition-all duration-200 ${
                        !isFullscreen
                          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>

                    {currentQuestion < quiz.questions.length - 1 && (
                      <button
                        onClick={isFullscreen ? handleNext : () => {}}
                        disabled={submitting || !isFullscreen}
                        className={`flex items-center px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 transform min-w-[120px] justify-center shadow-md ${
                          !isFullscreen
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed transform-none scale-100'
                            : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 hover:from-indigo-600 hover:via-indigo-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white hover:scale-105 hover:shadow-lg active:scale-95 disabled:transform-none disabled:scale-100 disabled:shadow-md'
                        }`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Next
                      </button>
                    )}
                  </div>

                  {/* Submit Button - Always visible and functional */}
                  <div className="flex gap-2 order-1 sm:order-2">
                    {submitting ? (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-lg min-w-[290px] shadow-lg border border-gray-300 dark:border-gray-600">
                          <div 
                            className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-all duration-700 ease-out"
                            style={{ 
                              width: `${submitProgress}%`,
                              background: submitProgress > 80 
                                ? 'linear-gradient(to right, #10b981, #059669, #047857)'
                                : submitProgress > 50
                                ? 'linear-gradient(to right, #3b82f6, #6366f1, #8b5cf6)'
                                : 'linear-gradient(to right, #60a5fa, #3b82f6, #2563eb)'
                            }}
                          />
                          
                          <div className="relative z-10 px-4 py-2.5 text-white">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-bold tabular-nums">
                                  {Math.round(submitProgress)}%
                                </div>
                                <div className="relative w-5 h-5">
                                  <div className="absolute inset-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    {getStageIcon && getStageIcon(submitStage)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center">
                                <span className="text-sm font-medium leading-tight">{submitStage}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Please wait while we process your quiz...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center px-4 py-2.5 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 shadow-md min-w-[120px] justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Submit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quiz Statistics */}
            <QuizStatistics 
              userAnswers={userAnswers}
              totalQuestions={quiz?.questions?.length}
            />
          </div>
        </div>

        {/* Modals */}
        <ReviewModal 
          showReviewModal={showReviewModal}
          isFullscreen={isFullscreen}
          quiz={quiz}
          userAnswers={userAnswers}
          onClose={() => setShowReviewModal(false)}
          onContinue={handleContinueQuiz}
          onSubmit={() => submitQuiz(userAnswers)}
          onKeepPreviousScore={handleKeepPreviousScore}
          onEditQuestion={submitting ? null : handleEditQuestion}
          submitting={submitting}
          submitStage={submitStage}
          submitProgress={submitProgress}
          getStageIcon={getStageIcon}
        />
        
        <ExitConfirmationModal 
          showExitConfirm={showExitConfirm}
          onClose={() => setShowExitConfirm(false)}
          onSubmitAndExit={handleSubmitAndExit}
          onKeepPreviousScoreAndExit={handleKeepPreviousScoreAndExit}
          isRetake={quiz?.retakeCount > 0}
        />
      </div>
    </ProtectedRoute>
  );
}
