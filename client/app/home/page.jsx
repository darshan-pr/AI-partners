"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import QuizResultModal from "@/components/QuizResultModal";
import Image from "next/image";


// Optimized Icon Components
const icons = {
  Chat: () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.477 8-10 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.477-8 10-8s10 3.582 10 8z" />
    </svg>
  ),
  Quiz: () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Analytics: () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Brain: () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  StudyPlan: () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  KnowledgeNest: () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  )
};

// Utility functions
const getScoreColor = (score) => {
  if (score >= 80) return 'bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-200';
  if (score >= 60) return 'bg-yellow-200 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-200';
  return 'bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200';
};

const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
    case 'hard':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-700';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  }
};

const getQuizTypeColor = (quizType) => {
  switch (quizType?.toLowerCase()) {
    case 'mcq':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700';
    case 'mixed':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-700';
    case 'true_false':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700';
    case 'writing':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  }
};

const formatTimeAgo = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

// Feature Card Component
const FeatureCard = ({ href, icon: Icon, title, description, actionText, gradient, onClick }) => {
  const CardContent = (
    <div className="glass-card rounded-3xl p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 group mt-5 mb-5 "
      style={{ border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(2px)' ,borderRadius: '25px'}}>
      <div className={`flex items-center justify-center w-12 h-12 bg-gradient-to-r ${gradient} rounded-lg mb-4 group-hover:scale-105 transition-transform`}>
        <Icon className="text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
      <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium mt-3">
        <span>{actionText}</span>
        <icons.ArrowRight />
      </div>
    </div>
  );

  return href ? (
    <Link href={href}>{CardContent}</Link>
  ) : (
    <div onClick={onClick} className="cursor-pointer">
      {CardContent}
    </div>
  );
};

// Quiz Card Skeleton Component
const QuizCardSkeleton = () => (
  <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm animate-pulse">
    <div className="flex justify-between items-start mb-2">
      <div className="h-4 sm:h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 sm:h-5 bg-gray-300 dark:bg-gray-700 rounded w-12"></div>
    </div>
    <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
    <div className="h-7 sm:h-8 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
  </div>
);

// Main Component
export default function HomePage() {
  const [user, setUser] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isStudyPlannerOpen, setIsStudyPlannerOpen] = useState(false);
  const riveContainer = useRef(null);
  const particlesContainer = useRef(null);
  const router = useRouter();

  const userQuizzes = useQuery(api.quiz.getUserQuizzes, {
    username: user?.username,
  });

  const retakeQuiz = useMutation(api.quiz.retakeQuiz);

  const isQuizzesLoading = userQuizzes === undefined;

  // Theme, User, and Background Animations Initialization
  useEffect(() => {
    // Initialize user data
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Initialize theme based on localStorage or system preference
    const savedTheme = localStorage.getItem("theme");
    const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedTheme ? savedTheme === "dark" : systemDarkMode;
    setIsDark(initialDarkMode);
    document.documentElement.classList.toggle('dark', initialDarkMode);

    // Listen for theme changes
    const handleThemeChange = (e) => {
      const newDarkMode = e.detail.isDark;
      setIsDark(newDarkMode);
      document.documentElement.classList.toggle('dark', newDarkMode);
    };

    // Handle mouse movement for dynamic background
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('themeChanged', handleThemeChange);
    window.addEventListener("mousemove", handleMouseMove);

    // Initialize Rive animation
    const initRiveAnimation = async () => {
      try {
        const rive = await import('@rive-app/canvas');
        
        if (riveContainer.current) {
          const riveInstance = new rive.Rive({
            src: 'https://public.rive.app/community/runtime-files/2063-4080-peaceful-rhythms.riv',
            canvas: riveContainer.current,
            autoplay: true,
            stateMachines: 'State Machine 1',
            onLoad: () => {
              riveInstance.resizeDrawingSurfaceToCanvas();
            },
          });
        }
      } catch (error) {
        console.log('Rive animation not available, using fallback');
      }
    };

    // Create floating particles animation
    const createParticles = () => {
      let cleanup = () => {};

      if (particlesContainer.current) {
        const particles = [];
        const particleCount = 40;
        
        for (let i = 0; i < particleCount; i++) {
          const particle = document.createElement('div');
          particle.className = 'floating-particle';
          const colors = isDark 
            ? ['59, 130, 246', '168, 85, 247', '236, 72, 153']
            : ['37, 99, 235', '147, 51, 234', '219, 39, 119'];
          
          const size = Math.random() * 6 + 2;
          particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(${colors[Math.floor(Math.random() * colors.length)]}, ${Math.random() * 0.5 + 0.3});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            filter: blur(1px);
            animation: floatParticle ${Math.random() * 25 + 15}s linear infinite;
            animation-delay: -${Math.random() * 20}s;
          `;
          particlesContainer.current.appendChild(particle);
          particles.push(particle);
        }
        
        cleanup = () => {
          particles.forEach(particle => {
            if (particle.parentNode) {
              particle.parentNode.removeChild(particle);
            }
          });
        };
      }

      return cleanup;
    };

    initRiveAnimation();
    const cleanupParticles = createParticles();

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener("mousemove", handleMouseMove);
      if (riveContainer.current) {
        riveContainer.current.innerHTML = '';
      }
      cleanupParticles();
    };
  }, [isDark]);

  const handleSubjectSelect = useCallback((selectedSubject) => {
    // Navigate to quiz creation page
    router.push('/quiz');
  }, [router]);

  const handleRetakeQuiz = async (quizId) => {
    try {
      const quiz = userQuizzes.find(q => q._id === quizId);
      
      if (!quiz) {
        alert('Quiz not found');
        return;
      }

      if (quiz.retakeCount >= 1) {
        alert('You have already used your one-time retake for this quiz.');
        return;
      }

      const result = await retakeQuiz({ quizId });
      
      if (result.success) {
        setSelectedQuiz(null);
        // Direct navigation without intermediate loading
        router.push(`/quiz/${quizId}`);
      } else {
        alert('Failed to retake quiz. Please try again.');
      }
    } catch (error) {
      console.error('Error retaking quiz:', error);
      alert(error.message || 'An error occurred while retaking the quiz.');
    }
  };

  const features = [
    {
      href: "/home/studybuddy",
      icon: icons.Chat,
      title: "AI Study Assistant",
      description: "Get instant help with detailed explanations and guidance.",
      actionText: "Start chatting",
      gradient: "from-blue-400 to-cyan-400 dark:from-blue-600 dark:to-cyan-600"
    },
    {
      href: "/quiz",
      icon: icons.Quiz,
      title: "Practice Tests",
      description: "Create customized quizzes and track your progress.",
      actionText: "Create quiz",
      gradient: "from-green-400 to-emerald-400 dark:from-green-600 dark:to-emerald-600"
    },
    {
      href: "/home/study-planner",
      icon: icons.StudyPlan,
      title: "Study Planner",
      description: "Generate personalized learning roadmaps based on your performance.",
      actionText: "Create study plan",
      gradient: "from-orange-400 to-red-400 dark:from-orange-600 dark:to-red-600"
    },
    {
      href: "/home/analytics",
      icon: icons.Analytics,
      title: "Performance Analytics",
      description: "Analyze your study patterns and improve weak areas.",
      actionText: "View analytics",
      gradient: "from-purple-400 to-pink-400 dark:from-purple-600 dark:to-pink-600"
    },
    {
      href: "/home/knowledge-nest",
      icon: icons.KnowledgeNest,
      title: "Knowledge Nest",
      description: "Access institutional resources and collaborative learning materials.",
      actionText: "Explore resources",
      gradient: "from-indigo-400 to-blue-400 dark:from-indigo-600 dark:to-blue-600"
    }
  ];

  // Show full screen loading when quiz is being generated
  return (
    <ProtectedRoute>
      <div className={`min-h-screen relative overflow-hidden pt-16 transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'} ${isDark ? 'dark' : ''}`}>
        
        {/* Rive Animation Background */}
        <div className="absolute inset-0 opacity-30">
          <canvas 
            ref={riveContainer}
            className="w-full h-full"
            style={{ filter: 'blur(1px)' }}
          />
        </div>

        {/* Floating Particles */}
        <div 
          ref={particlesContainer}
          className="absolute inset-0 pointer-events-none"
        />

        {/* Geometric Background Elements */}
        <div className="absolute inset-0">
          <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse ${
            isDark 
              ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10' 
              : 'bg-gradient-to-br from-blue-300/20 to-purple-300/20'
          }`}></div>
          <div className={`absolute top-40 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse animation-delay-2000 ${
            isDark 
              ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10' 
              : 'bg-gradient-to-br from-purple-300/20 to-pink-300/20'
          }`}></div>
          <div className={`absolute bottom-20 left-10 w-64 h-64 rounded-full blur-3xl animate-pulse animation-delay-4000 ${
            isDark 
              ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10' 
              : 'bg-gradient-to-br from-green-300/20 to-emerald-300/20'
          }`}></div>
          
          {/* Grid Pattern */}
          <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-10'}`}>
            <div className="grid-pattern"></div>
          </div>
        </div>

        {/* Dynamic Background with Mouse Interaction */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-5 py-8 ">
          <div className="relative overflow-hidden rounded-3xl glass-card  mt-15 text-white shadow-lg mb-8"
          style={{borderRadius: '45px'}}>
            <div className="relative px-6 py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 dark:bg-gray-800/20 rounded-full mb-4 backdrop-blur-md">
                <icons.Brain className="text-white dark:text-gray-200" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">Smart Study Hub</h1>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-3xl mx-auto">
                Transform your exam preparation with AI-powered practice tests
              </p>
              <button
                onClick={() => router.push('/quiz')}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 text-white font-medium py-2 px-6 rounded-3xl hover:from-indigo-600 hover:to-purple-600 dark:hover:from-indigo-700 dark:hover:to-purple-700 transition-all transform hover:scale-105 shadow-md"
              >
                Start Your First Quiz
              </button>
            </div>
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-white/10 dark:bg-gray-800/10 rounded-full"></div>
            <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 bg-white/10 dark:bg-gray-800/10 rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 mb-8 gap-6 mb-8 ">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>

          {isQuizzesLoading ? (
            <div className="rounded-3xl p-4 sm:p-6 shadow-md">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Recent Quiz Results
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <QuizCardSkeleton key={idx} />
                ))}
              </div>
            </div>
          ) : userQuizzes && userQuizzes.length > 0 ? (
            <div className="rounded-3xl p-4 sm:p-6 shadow-md relative z-10" >
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
                Recent Quiz Results
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 pt-2" style={{ position: 'relative', zIndex: 20 }}>
                {userQuizzes
                  .sort((a, b) => b.attemptedAt - a.attemptedAt)
                  .slice(0, 6)
                  .map((quiz, index) => (
                    <div
                      key={quiz._id}
                      className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm transition-all hover:shadow-xl hover:-translate-y-2 hover:scale-[1.03] relative"
                      style={{ 
                        transformOrigin: 'center',
                        zIndex: 30 + index,
                        position: 'relative',
                      }}
                    >
                      {/* Quiz Header */}
                      <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="flex-1 min-w-0 pr-3">
                          <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
                            {quiz.subject}
                          </h3>
                          {quiz.concept && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">
                              {quiz.concept}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-sm sm:text-base font-bold ${getScoreColor(quiz.score)}`}>
                            {quiz.score}%
                          </span>
                          {quiz.completed ? (
                            <span className="inline-flex items-center p-1 sm:p-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center p-1 sm:p-1.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                              ⏳
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quiz Metadata - Better mobile layout */}
                      <div className="space-y-2 mb-4">
                        {/* First row: Type and Difficulty */}
                        <div className="flex flex-wrap gap-2">
                          {/* Number of Questions */}
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                            {quiz.numberOfQuestions} Questions
                          </span>

                          {/* Quiz Type */}
                          {quiz.quizType && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getQuizTypeColor(quiz.quizType)}`}>
                              {quiz.quizType === 'mcq' ? 'Multiple Choice' : 
                               quiz.quizType === 'true_false' ? 'True/False' : 
                               quiz.quizType === 'writing' ? 'Writing' : 
                               quiz.quizType === 'mixed' ? 'Mixed Type' : 
                               quiz.quizType}
                            </span>
                          )}

                          {/* Difficulty */}
                          {quiz.difficulty && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getDifficultyColor(quiz.difficulty)}`}>
                              {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                            </span>
                          )}
                        </div>

                        {/* Second row: Time stamp */}
                        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            {quiz.attemptedAt ? formatTimeAgo(quiz.attemptedAt) : formatTimeAgo(quiz.createdAt)}
                          </span>
                          {quiz.retakeCount !== undefined && quiz.retakeCount > 0 && (
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md text-xs">
                              Retaken
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-4">
                        {quiz.completed ? (
                          <button
                            onClick={() => setSelectedQuiz(quiz)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 transition-all font-semibold shadow-sm text-sm sm:text-base"
                          >
                            View Results
                          </button>
                        ) : (
                          <Link
                            href={`/quiz/${quiz._id}`}
                            className="block w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 transition-all font-semibold shadow-sm text-sm sm:text-base text-center"
                          >
                            Continue Test
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {userQuizzes.length > 6 && (
                <div className="mt-4 text-center">
                  <Link
                    href="/home/analytics"
                    className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-sm"
                  >
                    View All Results
                    <icons.ArrowRight />
                  </Link>
                </div>
              )}
            </div>
          ) : userQuizzes && userQuizzes.length === 0 && (
            <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-md text-center relative z-10"
                style={{ borderRadius: '27px' }}>
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-100/30 dark:bg-gray-800/30 rounded-lg flex items-center justify-center">
                <icons.Quiz className="text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Ready to Start Learning?
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                Create your first practice quiz to begin your learning journey.
              </p>
              <button
                onClick={() => router.push('/quiz')}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 text-white font-medium py-2 px-4 sm:px-6 rounded-3xl hover:from-indigo-600 hover:to-purple-600 dark:hover:from-indigo-700 dark:hover:to-purple-700 transition-all transform hover:scale-105 text-sm sm:text-base"
              >
                Create Your First Quiz
              </button>
            </div>
          )}

          <QuizResultModal
            quiz={selectedQuiz}
            isOpen={!!selectedQuiz}
            onClose={() => setSelectedQuiz(null)}
            onRetake={handleRetakeQuiz}
          />

          {/* Removed the isNavigating state and its related JSX */}
        </div>

        <style jsx>{`
          @keyframes floatParticle {
            0% {
              transform: translateY(110vh) translateX(-10px);
              opacity: 0;
            }
            20% {
              opacity: 1;
            }
            80% {
              opacity: 0.8;
            }
            100% {
              transform: translateY(-10vh) translateX(10px);
              opacity: 0;
            }
          }

          .grid-pattern {
            width: 100%;
            height: 100%;
            background-image: 
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
            background-size: 40px 40px;
          }

          .animation-delay-2000 {
            animation-delay: 2s;
          }

          .animation-delay-4000 {
            animation-delay: 4s;
          }

          .glass-card {
            background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.5)'};
            backdrop-filter: blur(40px) saturate(200%);
            -webkit-backdrop-filter: blur(40px) saturate(200%);
            border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.3)'};
            box-shadow: 
              0 8px 32px ${isDark ? 'rgba(0, 0, 0, 0.37)' : 'rgba(31, 38, 135, 0.37)'},
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1);
          }

          /* Line clamp utility for text truncation */
          .line-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          /* Custom breakpoint for very small screens */
          @media (max-width: 480px) {
            .glass-card {
              padding: 1rem;
              margin: 1px;
            }
            
            /* Ensure proper spacing on mobile */
            .quiz-grid {
              gap: 1rem;
            }
          }

          @media (max-width: 640px) {
            .glass-card {
              padding: 0.875rem;
            }
            
            .modal-content {
              margin: 0.5rem;
            }

            /* Better mobile quiz card spacing */
            .quiz-card-mobile {
              padding: 1rem;
              border-radius: 1rem;
            }
          }

          @media (min-width: 641px) {
            /* Desktop hover effects with proper z-index */
            .quiz-card-hover:hover {
              z-index: 50 !important;
              transform: translateY(-8px) scale(1.03) !important;
              box-shadow: 
                0 25px 50px ${isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(31, 38, 135, 0.6)'},
                0 8px 16px ${isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(31, 38, 135, 0.4)'},
                inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
            }
            
            /* Ensure quiz cards stay on top during hover */
            .quiz-grid-container {
              isolation: isolate;
            }
            
            .quiz-card {
              will-change: transform, box-shadow;
              backface-visibility: hidden;
            }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}