'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { MessageCircle, BookOpen, Brain, Lightbulb, Send, ArrowRight, Sparkles } from 'lucide-react';

export default function StudyBuddyHome() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [particles, setParticles] = useState([]);
  const canvasRef = useRef(null);
  const router = useRouter();
  const createSession = useMutation(api.chat.createSession);

  // Particle system for enhanced visual effects
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.1,
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
    window.addEventListener('resize', generateParticles);

    const animateParticles = () => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          x: particle.x + particle.speedX,
          y: particle.y + particle.speedY,
          x: particle.x > window.innerWidth ? 0 : particle.x < 0 ? window.innerWidth : particle.x,
          y: particle.y > window.innerHeight ? 0 : particle.y < 0 ? window.innerHeight : particle.y,
        }))
      );
    };

    const interval = setInterval(animateParticles, 50);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', generateParticles);
    };
  }, []);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));

    // Get initial theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme === 'dark' ? 'dark' : 'light');

    // Listen for theme changes from navbar
    const handleThemeChange = (event) => setTheme(event.detail.theme);
    window.addEventListener('themeChanged', handleThemeChange);
    
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  const handleStartNewChat = async () => {
    if (!user) return;
    try {
      const sessionId = await createSession({ username: user.username, title: 'New Study Session' });
      router.push(`/home/studybuddy/${sessionId}`);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleQuickStart = async (title, prompt) => {
    if (!user) return;
    try {
      const sessionId = await createSession({ username: user.username, title });
      router.push(`/home/studybuddy/${sessionId}?prompt=${encodeURIComponent(prompt)}`);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const quickStartOptions = [
    {
      title: 'Explain a Concept',
      description: 'Get detailed explanations of complex topics',
      icon: Brain,
      prompt: 'Hi StudyBuddy! I need help understanding a concept. Can you help me break down complex topics into simpler, easier-to-understand explanations?',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Homework Help',
      description: 'Get assistance with your assignments',
      icon: BookOpen,
      prompt: 'Hi StudyBuddy! I need help with my homework. Can you guide me through solving problems step by step?',
      gradient: 'from-green-500 to-emerald-600'
    }
  ];

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6 relative overflow-hidden ${
      isDark ? 'bg-black' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }`}>
      
      {/* Animated Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className={`absolute rounded-full ${
              isDark ? 'bg-blue-400' : 'bg-blue-500'
            }`}
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      {/* Vignette Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute inset-0 ${
          isDark 
            ? 'bg-gradient-radial from-transparent via-transparent to-black/20' 
            : 'bg-gradient-radial from-transparent via-transparent to-gray-200/20'
        }`}></div>
      </div>

      <div className="max-w-2xl w-full text-center relative z-10 px-3 sm:px-4">
        {/* Compact Logo and Welcome */}
        <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 mb-4 sm:mb-6 shadow-2xl transform hover:scale-110 transition-all duration-300 relative overflow-hidden group mx-auto`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white relative z-10" />
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
          </div>
        </div>
        
        <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3 leading-tight`}>
          How can I help you 
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> study today</span>?
        </h1>
        
        <p className={`text-base ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-8 leading-relaxed max-w-xl mx-auto`}>
          Ask me anything about your studies, homework, or learning goals.
        </p>

        {/* Centered Main Start Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleStartNewChat}
            disabled={!user}
            className={`bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white px-8 py-4 rounded-2xl font-semibold text-base shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none backdrop-blur-sm relative overflow-hidden group`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <Send className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Start New Study Session</span>
          </button>
        </div>

        {/* Compact Quick Start Suggestions */}
        <div className="space-y-3 mb-6">
          <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-4 flex items-center justify-center gap-2`}>
            <Sparkles className="w-4 h-4" />
            Or try these suggestions:
          </p>
          
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto">
            {quickStartOptions.map((option, index) => (
              <div
                key={index}
                onClick={() => handleQuickStart(option.title, option.prompt)}
                className={`${
                  isDark 
                    ? 'bg-gray-900/30 border-gray-800/30 hover:bg-gray-800/30 hover:border-gray-700/50' 
                    : 'bg-white/40 border-gray-200/30 hover:bg-white/60 hover:border-gray-300/50'
                } border rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group backdrop-blur-sm ${
                  !user ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg bg-gradient-to-br ${option.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                    <option.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h3 className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                      {option.title}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                      {option.description}
                    </p>
                  </div>
                  <ArrowRight className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} group-hover:translate-x-1 group-hover:text-blue-500 transition-all duration-300 flex-shrink-0`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compact Features hint */}
        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center justify-center gap-2 p-3 rounded-lg ${
          isDark ? 'bg-gray-900/20' : 'bg-gray-100/20'
        } backdrop-blur-sm border ${isDark ? 'border-gray-800/30' : 'border-gray-200/30'} max-w-sm mx-auto`}>
          <span className="text-base">💡</span>
          <span className="font-medium text-center">I can help with homework, explanations, and more!</span>
        </div>
      </div>
    </div>
  );
}


