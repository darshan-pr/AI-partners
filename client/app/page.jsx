"use client"
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Head from "next/head";

// Add this function at the top of your file
function FontLoader() {
  return (
    <Head>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
    </Head>
  );
}

export default function LandingPage() {
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const riveContainer = useRef(null);
  const particlesContainer = useRef(null);

  useEffect(() => {
    // Check initial theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
    }

    // Check initial user state
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Handle login event
    const handleLogin = (event) => {
      const userData = event.detail || JSON.parse(localStorage.getItem("user"));
      setUser(userData);
    };

    // Handle storage changes
    const handleStorage = () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    };

    // Handle theme changes
    const handleThemeChange = (event) => {
      setIsDark(event.detail.isDark);
    };

    // Add event listeners
    window.addEventListener("userLoggedIn", handleLogin);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("themeChanged", handleThemeChange);

    return () => {
      window.removeEventListener("userLoggedIn", handleLogin);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("themeChanged", handleThemeChange);
    };
  }, []);

  useEffect(() => {
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
      if (!particlesContainer.current) return;
      
      const particles = [];
      const particleCount = 40; // Reduced from 70 to 40
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        const colors = isDark 
          ? ['59, 130, 246', '168, 85, 247', '236, 72, 153'] // Added pink color
          : ['37, 99, 235', '147, 51, 234', '219, 39, 119'];
        
        const size = Math.random() * 6 + 2; // Slightly larger particles
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
      
      return () => {
        particles.forEach(particle => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        });
      };
    };

    initRiveAnimation();
    const cleanup = createParticles();
    
    return cleanup;
  }, [isDark]);

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
      isDark 
        ? 'bg-black' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}
    >
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
        <div className={`absolute bottom-20 left-20 w-80 h-80 rounded-full blur-3xl animate-pulse animation-delay-4000 ${
          isDark 
            ? 'bg-gradient-to-br from-pink-500/10 to-blue-500/10' 
            : 'bg-gradient-to-br from-pink-300/20 to-blue-300/20'
        }`}></div>
        
        {/* Grid Pattern */}
        <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-10'}`}>
          <div className="grid-pattern"></div>
        </div>
      </div>

      <div className="container mx-auto mt-0 pt-25  relative z-10">
        {/* Hero Section */}
        <div className={`text-center pt-16 md:pt-24 pb-12 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <FontLoader />
          <div className="animate-fade-in-up">
            <div className="flex flex-col items-center justify-center md:flex-row md:justify-center md:items-center gap-4 mb-8">
              <Image
                src="/logo.png"
                alt="AI Partner"
                width={150}
                height={150}
                className="md:mr-4 drop-shadow-xl"
              />
              <h1 className={`font-outfit text-6xl md:text-7xl mb-0 bg-clip-text text-transparent tracking-tight font-extrabold ${
                isDark 
                  ? 'bg-gradient-to-r from-white via-blue-300 to-purple-300' 
                  : 'bg-gradient-to-r from-gray-900 via-blue-700 to-purple-700'
              }`}>
                AI Partner
              </h1>
            </div>
          </div>
          
          <div className="animate-fade-in-up animation-delay-500">
            <h2 className={`font-jakarta text-3xl md:text-5xl mb-6 max-w-4xl mx-auto font-bold tracking-tight ${
              isDark ? 'text-gray-100' : 'text-gray-800'
            }`}>
              Learn <span className="text-blue-500">Smarter</span>, Not Harder
            </h2>
            <p className={`font-jakarta text-xl mb-8 max-w-3xl mx-auto leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Our AI-powered educational platform adapts to your unique learning style, helping you master concepts faster with personalized assessments and actionable insights.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up animation-delay-1000">
            {user ? (
              <Link
                href="/home"
                className="magnetic-button group relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-full font-jakarta font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 transform active:scale-95 overflow-hidden border border-white/10"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                  e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
                }}
              >
                <span className="relative z-10 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Resume Your Journey
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="ripple-effect absolute rounded-full bg-white/30 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-500 ease-out"></div>
              </Link>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="magnetic-button group relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-full font-jakarta font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 transform active:scale-95 overflow-hidden border border-white/10"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
                  }}
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <div className="ripple-effect absolute rounded-full bg-white/30 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-500 ease-out"></div>
                </Link>
                <Link
                  href="/auth"
                  className={`magnetic-button group border-2 px-10 py-4 rounded-full font-jakarta font-semibold text-lg transition-all duration-300 hover:scale-105 transform active:scale-95 overflow-hidden relative ${
                    isDark 
                      ? 'border-gray-700 backdrop-blur-sm text-white hover:bg-white/5 hover:border-gray-600' 
                      : 'border-gray-300 backdrop-blur-sm text-gray-700 hover:bg-gray-100/50 hover:border-gray-400'
                  }`}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
                  }}
                >
                  <span className="relative z-10">
                    Sign In
                    <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300 inline-block">→</span>
                  </span>
                  <div className={`ripple-effect absolute rounded-full opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-500 ease-out ${
                    isDark ? 'bg-white/20' : 'bg-gray-500/20'
                  }`}></div>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className={`mt-24 grid md:grid-cols-3 gap-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <div className="group text-center animate-fade-in-up animation-delay-1500">
            <div className={`magnetic-card relative backdrop-blur-md p-8 rounded-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10 border overflow-hidden ${
              isDark 
                ? 'bg-gray-900/50 hover:bg-gray-800/50 border-gray-800/50' 
                : 'bg-white/70 hover:bg-white/80 border-gray-200/50 hover:border-gray-300/50'
            }`}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="card-ripple absolute rounded-full bg-blue-500/20 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-700 ease-out"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 shadow-lg shadow-blue-500/25">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent">Intelligent Assessment</h3>
                <p className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Advanced AI creates personalized quizzes that adapt to your skill level, filling knowledge gaps and reinforcing strengths.
                </p>
                <ul className={`mt-4 text-left text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <li className="flex items-start mb-2">
                    <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Adaptive difficulty progression</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Topic-specific question sets</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="group text-center animate-fade-in-up animation-delay-2000">
            <div className={`magnetic-card relative backdrop-blur-md p-8 rounded-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10 border overflow-hidden ${
              isDark 
                ? 'bg-gray-900/50 hover:bg-gray-800/50 border-gray-800/50' 
                : 'bg-white/70 hover:bg-white/80 border-gray-200/50 hover:border-gray-300/50'
            }`}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="card-ripple absolute rounded-full bg-purple-500/20 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-700 ease-out"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 shadow-lg shadow-purple-500/25">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-300 to-purple-100 bg-clip-text text-transparent">Insightful Analytics</h3>
                <p className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Comprehensive performance tracking with visual analytics to identify patterns and optimize your learning journey.
                </p>
                <ul className={`mt-4 text-left text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <li className="flex items-start mb-2">
                    <svg className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Skill radar visualization</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Progress tracking over time</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="group text-center animate-fade-in-up animation-delay-2500">
            <div className={`magnetic-card relative backdrop-blur-md p-8 rounded-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/10 border overflow-hidden ${
              isDark 
                ? 'bg-gray-900/50 hover:bg-gray-800/50 border-gray-800/50' 
                : 'bg-white/70 hover:bg-white/80 border-gray-200/50 hover:border-gray-300/50'
            }`}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="card-ripple absolute rounded-full bg-pink-500/20 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-700 ease-out"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl mx-auto mb-6 flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 shadow-lg shadow-pink-500/25">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-pink-300 to-pink-100 bg-clip-text text-transparent">Personalized Resources</h3>
                <p className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  AI-curated learning materials tailored to your specific needs, from beginner fundamentals to advanced expertise.
                </p>
                <ul className={`mt-4 text-left text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <li className="flex items-start mb-2">
                    <svg className="w-5 h-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Targeted learning recommendations</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Concept-specific improvement plans</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className={`mt-28 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <div className="text-center mb-16 animate-fade-in-up animation-delay-2800">
            <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>How AI Partner Transforms Your Learning</h2>
            <div className={`h-1 w-20 mx-auto rounded-full ${
              isDark ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-blue-600 to-purple-600'
            }`}></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={`p-6 md:p-10 rounded-3xl relative overflow-hidden ${
              isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-white to-gray-50'
            } border ${isDark ? 'border-gray-800' : 'border-gray-200'} shadow-xl animate-fade-in-up animation-delay-3000`}>
              <div className="relative z-10">
                <div className={`grid grid-cols-1 gap-6 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  <div className="flex items-start">
                    <div className={`rounded-full p-3 mr-4 ${
                      isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>For Students</h3>
                      <p className="mb-3">Prepare for exams with confidence using targeted quizzes that identify and strengthen weak areas.</p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Focus on concepts you struggle with most</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Track improvement over time with visual analytics</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Access detailed explanations and resources</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className={`rounded-full p-3 mr-4 ${
                      isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>For Professionals</h3>
                      <p className="mb-3">Keep your skills sharp and prepare for interviews with advanced, industry-relevant assessments.</p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Practice with real-world scenario questions</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Receive personalized improvement plans</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Stay current with evolving industry standards</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="animate-fade-in-up animation-delay-3200">
              <div className="relative">
                <div className={`absolute inset-0 rounded-3xl transform rotate-2 ${
                  isDark ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30' : 'bg-gradient-to-r from-blue-100 to-purple-100'
                }`}></div>
                <div className={`absolute inset-0 rounded-3xl transform -rotate-2 ${
                  isDark ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30' : 'bg-gradient-to-r from-purple-100 to-pink-100'
                }`}></div>
                <div className={`relative p-6 md:p-8 rounded-3xl ${
                  isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
                } shadow-xl`}>
                  <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Advanced AI-Driven Features</h3>
                  
                  <div className="space-y-6">
                    <div className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-100'
                    }`}>
                      <div className="flex items-start">
                        <div className={`rounded-lg p-2 mr-4 ${
                          isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'
                        }`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className={`text-lg font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Concept Mastery Analysis</h4>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Detailed breakdown of your understanding across various subject concepts with visual radar charts.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-100'
                    }`}>
                      <div className="flex items-start">
                        <div className={`rounded-lg p-2 mr-4 ${
                          isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600'
                        }`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className={`text-lg font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Smart Question Generation</h4>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>AI creates unique questions that target your specific knowledge gaps and learning objectives.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-100'
                    }`}>
                      <div className="flex items-start">
                        <div className={`rounded-lg p-2 mr-4 ${
                          isDark ? 'bg-pink-900/50 text-pink-400' : 'bg-pink-100 text-pink-600'
                        }`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div>
                          <h4 className={`text-lg font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Resource Recommendations</h4>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Curated learning resources from top platforms matched precisely to your improvement needs.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className={`mt-28 mb-20 animate-fade-in-up animation-delay-3500 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <div className={`p-8 rounded-3xl ${
            isDark 
              ? 'bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800' 
              : 'bg-gradient-to-br from-white to-gray-50 border border-gray-100'
          } shadow-xl`}>
            <div className="text-center mb-10">
              <h2 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Join Our Growing Community
              </h2>
              <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Experience the platform trusted by students and professionals worldwide
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-10">
              <div className="group text-center">
                <div className={`p-6 rounded-2xl ${
                  isDark 
                    ? 'bg-gray-800/80 border border-gray-700 hover:border-blue-500/30' 
                    : 'bg-white border border-gray-200 hover:border-blue-300'
                } transition-all duration-300 group-hover:shadow-lg`}>
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">10K+</div>
                  <div className={isDark ? 'text-gray-300' : 'text-gray-700'}>Active Learners</div>
                  <p className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>From high school students to seasoned professionals</p>
                </div>
              </div>
              
              <div className="group text-center">
                <div className={`p-6 rounded-2xl ${
                  isDark 
                    ? 'bg-gray-800/80 border border-gray-700 hover:border-purple-500/30' 
                    : 'bg-white border border-gray-200 hover:border-purple-300'
                } transition-all duration-300 group-hover:shadow-lg`}>
                  <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">95%</div>
                  <div className={isDark ? 'text-gray-300' : 'text-gray-700'}>Success Rate</div>
                  <p className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Users report significant improvement in test scores</p>
                </div>
              </div>
              
              <div className="group text-center">
                <div className={`p-6 rounded-2xl ${
                  isDark 
                    ? 'bg-gray-800/80 border border-gray-700 hover:border-pink-500/30' 
                    : 'bg-white border border-gray-200 hover:border-pink-300'
                } transition-all duration-300 group-hover:shadow-lg`}>
                  <div className="text-5xl font-bold bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">24/7</div>
                  <div className={isDark ? 'text-gray-300' : 'text-gray-700'}>AI Support</div>
                  <p className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Learn on your schedule with always-available assistance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`py-8 border-t ${
          isDark ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="AI Partner"
                  width={40}
                  height={40}
                  className="mr-2"
                />
                <span className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>AI Partner</span>
              </div>
              <p className="text-sm mt-2">Powering the future of personalized education</p>
            </div>
            
            <div className="flex space-x-8">
              <div>
                <h4 className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Platform</h4>
                <ul className="space-y-1 text-sm">
                  <li><a href="#" className="hover:underline">Features</a></li>
                  <li><a href="#" className="hover:underline">Pricing</a></li>
                  <li><a href="#" className="hover:underline">FAQs</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Resources</h4>
                <ul className="space-y-1 text-sm">
                  <li><a href="#" className="hover:underline">Blog</a></li>
                  <li><a href="#" className="hover:underline">Documentation</a></li>
                  <li><a href="#" className="hover:underline">Community</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Connect</h4>
                <ul className="space-y-1 text-sm">
                  <li><a href="#" className="hover:underline">Contact</a></li>
                  <li><a href="#" className="hover:underline">Support</a></li>
                  <li><a href="#" className="hover:underline">Twitter</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className={`mt-8 pt-6 border-t text-center text-xs ${
            isDark ? 'border-gray-800' : 'border-gray-200'
          }`}>
            © {new Date().getFullYear()} AI Partner. All rights reserved.
          </div>
        </div>
      </div>

      <style jsx global>{`
        :root {
          --font-outfit: 'Outfit', sans-serif;
          --font-jakarta: 'Plus Jakarta Sans', sans-serif;
        }
        
        .font-outfit {
          font-family: var(--font-outfit);
        }
        
        .font-jakarta {
          font-family: var(--font-jakarta);
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: var(--font-outfit);
        }
        
        p, span, button, a {
          font-family: var(--font-jakarta);
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
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
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 30px rgba(168, 85, 247, 0.7);
          }
        }
        
        @keyframes drawLine {
          0% {
            stroke-dasharray: 0 1000;
          }
          100% {
            stroke-dasharray: 1000 0;
          }
        }
        
        @keyframes magneticFloat {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-2px) scale(1.02);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }
        
        .animate-draw-line {
          animation: drawLine 8s ease-in-out infinite;
        }
        
        /* Magnetic Button Effects */
        .magnetic-button {
          position: relative;
          --mouse-x: 50%;
          --mouse-y: 50%;
        }
        
        .magnetic-button:hover {
          animation: magneticFloat 2s ease-in-out infinite;
        }
        
        .magnetic-button .ripple-effect {
          left: var(--mouse-x);
          top: var(--mouse-y);
          width: 0;
          height: 0;
          transform: translate(-50%, -50%);
        }
        
        .magnetic-button:hover .ripple-effect {
          width: 300px;
          height: 300px;
          animation: rippleExpand 0.6s ease-out;
        }
        
        /* Magnetic Card Effects */
        .magnetic-card {
          position: relative;
          --mouse-x: 50%;
          --mouse-y: 50%;
          transition: transform 0.3s ease;
        }
        
        .magnetic-card:hover {
          transform: perspective(1000px) rotateX(5deg) rotateY(5deg) scale(1.02);
        }
        
        .magnetic-card .card-ripple {
          left: var(--mouse-x);
          top: var(--mouse-y);
          width: 0;
          height: 0;
          transform: translate(-50%, -50%);
        }
        
        .magnetic-card:hover .card-ripple {
          width: 400px;
          height: 400px;
          animation: cardRippleExpand 0.8s ease-out;
        }
        
        @keyframes rippleExpand {
          0% {
            width: 0;
            height: 0;
            opacity: 0.8;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            width: 300px;
            height: 300px;
            opacity: 0;
          }
        }
        
        @keyframes cardRippleExpand {
          0% {
            width: 0;
            height: 0;
            opacity: 0.6;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            width: 400px;
            height: 400px;
            opacity: 0;
          }
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
          opacity: 0;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
          opacity: 0;
        }
        
        .animation-delay-1500 {
          animation-delay: 1.5s;
          opacity: 0;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
          opacity: 0;
        }
        
        .animation-delay-2500 {
          animation-delay: 2.5s;
          opacity: 0;
        }
        
        .animation-delay-3000 {
          animation-delay: 3s;
          opacity: 0;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}