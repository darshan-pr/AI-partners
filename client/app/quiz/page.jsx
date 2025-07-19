"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
  Plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Brain: () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
};

// Constants
const PREDEFINED_SUBJECTS = [
  { name: 'Mathematics', icon: icons.Math, color: 'from-blue-400 to-blue-600' },
  { name: 'Science', icon: icons.Science, color: 'from-green-400 to-green-600' },
  { name: 'History', icon: icons.History, color: 'from-amber-400 to-amber-600' },
  { name: 'Geography', icon: icons.Geography, color: 'from-teal-400 to-teal-600' },
  { name: 'Literature', icon: icons.Literature, color: 'from-purple-400 to-purple-600' },
  { name: 'Computer Science', icon: icons.Computer, color: 'from-indigo-400 to-indigo-600' }
];

const QUESTION_COUNTS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

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

export default function CreateQuizPage() {
  const [user, setUser] = useState(null);
  const [subject, setSubject] = useState('');
  const [concept, setConcept] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [quizType, setQuizType] = useState('mixed');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [generationStage, setGenerationStage] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const riveContainer = useRef(null);
  const particlesContainer = useRef(null);
  const router = useRouter();

  // Theme, User, and Background Animations Initialization
  useEffect(() => {
    // Initialize user data
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/login');
      return;
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
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
          const particle = document.createElement('div');
          particle.className = 'floating-particle';
          const colors = isDark 
            ? ['59, 130, 246', '168, 85, 247', '236, 72, 153']
            : ['37, 99, 235', '147, 51, 234', '219, 39, 119'];
          
          const size = Math.random() * 4 + 2;
          particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(${colors[Math.floor(Math.random() * colors.length)]}, ${Math.random() * 0.4 + 0.2});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            filter: blur(1px);
            animation: floatParticle ${Math.random() * 20 + 15}s linear infinite;
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
  }, [isDark, router]);

  // Enhanced handleCreateQuiz with progress tracking
  const handleCreateQuiz = async () => {
    if (!subject.trim()) {
      alert('Please enter a subject');
      return;
    }

    const userData = localStorage.getItem("user");
    if (!userData) {
      alert('Please log in first');
      router.push('/login');
      return;
    }

    const { username } = JSON.parse(userData);
    setLoading(true);
    setGenerationProgress(0);
    
    try {
      // Stage 1: Preparing quiz parameters
      setGenerationStage('Preparing quiz parameters...');
      setGenerationProgress(10);
      
      const requestBody = { 
        subject: subject.trim(), 
        questionCount, 
        username,
        quizType,
        difficulty
      };

      if (concept && concept.trim()) {
        requestBody.concept = concept.trim();
      }

      // Stage 2: Generating questions with AI
      setGenerationStage('AI is crafting your questions...');
      setGenerationProgress(25);

      // Simulate progress updates during generation
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev < 70) return prev + Math.random() * 10;
          return prev;
        });
      }, 500);

      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      clearInterval(progressInterval);

      // Stage 3: Processing response
      setGenerationStage('Processing generated content...');
      setGenerationProgress(80);

      const data = await response.json();

      if (data.success && data.quizId) {
        // Stage 4: Finalizing quiz
        setGenerationStage('Quiz ready! Redirecting...');
        setGenerationProgress(100);

        // Small delay to show completion
        await new Promise(resolve => setTimeout(resolve, 800));

        // Clean up form state
        setSubject('');
        setConcept('');
        setQuizType('mixed');
        setDifficulty('medium');
        
        // Direct navigation
        router.push(`/quiz/${data.quizId}`);
      } else {
        alert(data.error || 'Failed to generate quiz. Please try again.');
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
      setGenerationStage('');
      setGenerationProgress(0);
    }
  };

  // Enhanced button rendering for quiz generation with compact animations
  const renderGenerateButton = () => {
    if (loading) {
      return (
        <div className="w-full">
          <div className="relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-md sm:rounded-xl shadow-lg border border-gray-300 dark:border-gray-600">
            {/* Animated background fill */}
            <div 
              className="absolute inset-0 bg-gradient-to-r transition-all duration-700 ease-out"
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
            <div className="relative z-10 px-2.5 sm:px-4 py-2 sm:py-3 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <div className="mr-1.5 sm:mr-3 flex-shrink-0">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium leading-tight truncate">{generationStage}</span>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <div className="text-xs sm:text-sm font-bold tabular-num text-black">
                    {Math.round(generationProgress)}%
                  </div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse " />
                </div>
              </div>
            </div>
            
            {/* Shimmer effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 transition-transform duration-1000"
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
        onClick={handleCreateQuiz}
        disabled={loading || !subject.trim()}
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 hover:from-indigo-600 hover:to-purple-600 dark:hover:from-indigo-700 dark:hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:dark:from-gray-600 disabled:dark:to-gray-600 text-white py-2 sm:py-3 px-3 sm:px-6 rounded-md sm:rounded-xl transition-all font-medium transform active:scale-95 shadow-md flex items-center justify-center text-sm sm:text-base"
      >
        <icons.Plus />
        <span className="ml-1 sm:ml-2">Generate Quiz</span>
      </button>
    );
  };

  return (
    <ProtectedRoute>
      <div className={`min-h-screen relative overflow-hidden pt-16 transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'} ${isDark ? 'dark' : ''}`}>
        
        {/* Rive Animation Background */}
        <div className="absolute inset-0 opacity-20">
          <canvas 
            ref={riveContainer}
            className="w-full h-full"
            style={{ filter: 'blur(2px)' }}
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
              ? 'bg-gradient-to-br from-blue-500/5 to-purple-500/5' 
              : 'bg-gradient-to-br from-blue-300/15 to-purple-300/15'
          }`}></div>
          <div className={`absolute top-40 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse animation-delay-2000 ${
            isDark 
              ? 'bg-gradient-to-br from-purple-500/5 to-pink-500/5' 
              : 'bg-gradient-to-br from-purple-300/15 to-pink-300/15'
          }`}></div>
          <div className={`absolute bottom-20 left-10 w-64 h-64 rounded-full blur-3xl animate-pulse animation-delay-4000 ${
            isDark 
              ? 'bg-gradient-to-br from-green-500/5 to-emerald-500/5' 
              : 'bg-gradient-to-br from-green-300/15 to-emerald-300/15'
          }`}></div>
        </div>

        {/* Dynamic Background with Mouse Interaction */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.1), transparent 40%)`
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-3 sm:px-5 py-4 sm:py-8">
          
          {/* Header */}
          <div className="text-center mb-4 sm:mb-8">
            <div className="flex items-center justify-center mb-3 sm:mb-4 relative">
              <button
                onClick={() => router.push('/home')}
                className="absolute left-0 p-1.5 sm:p-2 rounded-lg bg-white/10 dark:bg-gray-800/20 backdrop-blur-md border border-white/20 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-800/30 transition-all"
              >
                <icons.ArrowLeft />
              </button>
              
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/20 dark:bg-gray-800/20 rounded-full backdrop-blur-md">
                <icons.Brain className="text-gray-900 dark:text-gray-100 h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 text-gray-900 dark:text-gray-100">Create Your Quiz</h1>
            <p className="text-xs sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-2 sm:px-4">
              Customize your learning experience with AI-powered practice tests
            </p>
          </div>

          {/* Main Form */}
          <div className="glass-card  rounded-xl sm:rounded-3xl p-3 sm:p-6 md:p-8 shadow-xl justify-center "
                style={{borderRadius:'25px'}}>
            
            {/* Subject Selection */}
            <div className="mb-4 sm:mb-8">
              <label className="block text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-4">
                Choose Subject
              </label>
              
              {/* Predefined Subjects */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-3 mb-2 sm:mb-4">
                {PREDEFINED_SUBJECTS.map((predefinedSubject) => (
                  <button
                    key={predefinedSubject.name}
                    onClick={() => setSubject(predefinedSubject.name)}
                    className={`p-2 sm:p-3 rounded-md sm:rounded-xl border-2 transition-all text-left group ${
                      subject === predefinedSubject.name
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r ${predefinedSubject.color} rounded-md sm:rounded-lg mr-2 sm:mr-3 group-hover:scale-105 transition-transform`}>
                        <predefinedSubject.icon className="text-white" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm leading-tight">
                        {predefinedSubject.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Subject Input */}
              <div className="relative">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Or enter a custom subject..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-md sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Concept (Optional) */}
            <div className="mb-4 sm:mb-8">
              <label className="block text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                Specific Concept <span className="text-xs sm:text-sm font-normal text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="e.g., Quadratic equations, Photosynthesis, World War II..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-md sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base"
              />
            </div>

            {/* Question Count Slider */}
            <div className="mb-4 sm:mb-8">
              <label className="block text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-4">
                Number of Questions
              </label>
              
              {/* Current Value Display */}
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <span className="text-xs sm:text-base text-gray-600 dark:text-gray-400">Questions:</span>
                <span className="text-base sm:text-xl font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg">
                  {questionCount}
                </span>
              </div>
              
              {/* Dynamic Slider */}
              <div className="relative mb-3 sm:mb-4">
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="slider w-full h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: isDark 
                      ? `linear-gradient(to right, #6366f1 0%, #6366f1 ${((questionCount - 5) / 45) * 100}%, #374151 ${((questionCount - 5) / 45) * 100}%, #374151 100%)`
                      : `linear-gradient(to right, #6366f1 0%, #6366f1 ${((questionCount - 5) / 45) * 100}%, #e5e7eb ${((questionCount - 5) / 45) * 100}%, #e5e7eb 100%)`
                  }}
                />
                
                {/* Slider Range Labels */}
                <div className="flex justify-between mt-1 sm:mt-2 px-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">5</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">50</span>
                </div>
              </div>
              
              {/* Quick Selection Buttons */}
              <div className="space-y-1.5 sm:space-y-2">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Quick Select:</p>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {[10, 20, 30, 40, 50].map((count) => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`p-2 sm:p-3 rounded-md sm:rounded-lg border-2 transition-all text-xs sm:text-base font-medium ${
                        questionCount === count
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quiz Type */}
            <div className="mb-4 sm:mb-8">
              <label className="block text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-4">
                Question Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5 sm:gap-3">
                {QUIZ_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setQuizType(type.id)}
                    className={`p-2.5 sm:p-4 rounded-md sm:rounded-xl border-2 transition-all text-left ${
                      quizType === type.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                    }`}
                  >
                    <div className="flex items-start">
                      <type.icon className={`mt-0.5 sm:mt-1 mr-2 sm:mr-3 flex-shrink-0 ${quizType === type.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`} />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-base">{type.name}</div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">{type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Level */}
            <div className="mb-4 sm:mb-8">
              <label className="block text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-4">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5 sm:gap-3">
                {DIFFICULTY_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setDifficulty(level.id)}
                    className={`p-2.5 sm:p-4 rounded-md sm:rounded-xl border-2 transition-all text-left ${
                      difficulty === level.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                    }`}
                  >
                    <div className="flex items-start">
                      <level.icon className={`mt-0.5 sm:mt-1 mr-2 sm:mr-3 flex-shrink-0 ${difficulty === level.id ? 'text-indigo-600 dark:text-indigo-400' : level.color}`} />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-base">{level.name}</div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">{level.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-2 sm:pt-4">
              {renderGenerateButton()}
            </div>

          </div>
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

          .animation-delay-2000 {
            animation-delay: 2s;
          }

          .animation-delay-4000 {
            animation-delay: 4s;
          }

          .glass-card {
            background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)'};
            backdrop-filter: blur(40px) saturate(200%);
            -webkit-backdrop-filter: blur(40px) saturate(200%);
            border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.3)'};
            box-shadow: 
              0 8px 32px ${isDark ? 'rgba(0, 0, 0, 0.37)' : 'rgba(31, 38, 135, 0.37)'},
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1);
          }

          /* Custom Slider Styles */
          .slider {
            -webkit-appearance: none;
            appearance: none;
            background: transparent;
            cursor: pointer;
          }

          .slider::-webkit-slider-track {
            background: transparent;
          }

          .slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #6366f1;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
            transition: all 0.2s ease;
          }

          .slider::-webkit-slider-thumb:hover {
            background: #4f46e5;
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          }

          .slider::-moz-range-track {
            background: transparent;
            border: none;
          }

          .slider::-moz-range-thumb {
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #6366f1;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
            transition: all 0.2s ease;
          }

          .slider::-moz-range-thumb:hover {
            background: #4f46e5;
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          }

          @media (max-width: 640px) {
            .slider::-webkit-slider-thumb {
              height: 18px;
              width: 18px;
            }
            
            .slider::-moz-range-thumb {
              height: 18px;
              width: 18px;
            }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}
