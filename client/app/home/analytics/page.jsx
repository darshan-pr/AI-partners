"use client";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { Fragment } from "react";
import QuizResultModal from "@/components/QuizResultModal";
import { Menu } from "@headlessui/react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Icons
const icons = {
  Chat: () => (
    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.477 8-10 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.477-8 10-8s10 3.582 10 8z" />
    </svg>
  ),
  Quiz: () => (
    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Analytics: () => (
    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Brain: () => (
    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
};

// Utility to process quiz data for charts
  const processQuizData = (quizzes = []) => {
    if (!quizzes) return {
      subjectScores: [],
      scoreTrends: [],
      completionStatus: { completed: 0, incomplete: 0 }
    };

    // Sort quizzes by attemptedAt in ascending order (oldest first)
    const sortedQuizzes = [...quizzes].sort((a, b) => new Date(a.attemptedAt) - new Date(b.attemptedAt));

    const subjects = [...new Set(sortedQuizzes.map((q) => q.subject))];
    const subjectScores = subjects.map((subject) => {
      const subjectQuizzes = sortedQuizzes.filter((q) => q.subject === subject);
      const avgScore =
        subjectQuizzes.reduce((sum, q) => sum + q.score, 0) /
        subjectQuizzes.length;
      return { subject, avgScore: Math.round(avgScore) };
    });

    const scoreTrends = sortedQuizzes.map((q) => ({
      date: new Date(q.attemptedAt).toLocaleDateString(),
      score: q.score,
    }));

    const completionStatus = {
      completed: sortedQuizzes.filter((q) => q.completed).length,
      incomplete: sortedQuizzes.filter((q) => !q.completed).length,
    };

    return { subjectScores, scoreTrends, completionStatus };
};

// Utility to get option style
const getOptionStyle = (isUserAnswer, isCorrect, isCorrectAnswer) => {
  let style = "p-1.5 sm:p-2 rounded-lg text-xs sm:text-sm ";
  if (isUserAnswer && isCorrect) {
    style += "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200";
  } else if (isUserAnswer && !isCorrect) {
    style += "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200";
  } else if (isCorrectAnswer) {
    style += "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200";
  } else {
    style += "bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200";
  }
  return style;
};

// Chart Modal Component
const ChartModal = ({ isOpen, onClose, chartType, chartData, chartOptions, title }) => {
  if (!isOpen) return null;

  const ChartComponent = {
    bar: Bar,
    line: Line,
    doughnut: Doughnut,
  }[chartType];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-1000" onClose={onClose}>
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
              <DialogPanel className="w-full max-w-lg sm:max-w-4xl transform overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-black shadow-xl border border-gray-200 dark:border-gray-800">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-700 dark:to-indigo-700 px-4 sm:px-6 py-3 sm:py-4 text-white">
                  <DialogTitle className="text-lg sm:text-2xl font-semibold mb-1">
                    {title}
                  </DialogTitle>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="h-[300px] sm:h-[500px]">
                    <ChartComponent data={chartData} options={chartOptions} />
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 py-3 sm:py-4 flex justify-end border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={onClose}
                    className="px-4 sm:px-6 py-1.5 sm:py-2 bg-gray-500 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base"
                  >
                    Close
                  </button>
                </div>
              </DialogPanel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Placeholder for getScoreColor function
const getScoreColor = (score) => {
  if (score >= 80) return "bg-green-600 text-white";
  if (score >= 60) return "bg-yellow-600 text-white";
  return "bg-red-600 text-white";
};

// Background Elements
const BackgroundElements = () => (
  <>
    <div className="absolute inset-0 opacity-30">
      <canvas 
        id="riveCanvas"
        className="w-full h-full"
        style={{ filter: 'blur(1px)' }}
      />
    </div>
    <div id="particlesContainer" className="absolute inset-0 pointer-events-none" />
    <div className="absolute inset-0">
      <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 rounded-full blur-3xl animate-pulse bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-400/10 dark:to-purple-400/10" />
      <div className="absolute top-40 right-20 w-64 sm:w-96 h-64 sm:h-96Rounded-full blur-3xl animate-pulse animation-delay-2000 bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-400/10 dark:to-pink-400/10" />
      <div className="absolute bottom-20 left-10 w-48 sm:w-64 h-48 sm:h-64 rounded-full blur-3xl animate-pulse animation-delay-4000 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-400/10 dark:to-emerald-400/10" />
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="grid-pattern" />
      </div>
    </div>
  </>
);

// Chart Card Component
const ChartCard = ({ title, children, onClick }) => (
  <div 
    onClick={onClick}
    className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 cursor-pointer backdrop-blur-lg bg-white/80 dark:bg-black"
    style={{ 
      border: '1px solid rgba(255, 255, 255, 0.07)',
      backdropFilter: 'blur(1px)',
    }}
  >
    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-4">
      {title}
    </h3>
    <div className="h-48 sm:h-64">
      {children}
    </div>
  </div>
);

// Stat Card Component
const StatCard = ({ title, value, icon, color }) => (
  <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md backdrop-blur-lg bg-white/80 dark:bg-black"
    style={{ 
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }}
  >
    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg mb-2 sm:mb-4 flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <h4 className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{title}</h4>
    <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
      {value}
    </div>
  </div>
);

// Utility functions for enhanced features
const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'hard':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
};

const getQuizTypeColor = (quizType) => {
  switch (quizType?.toLowerCase()) {
    case 'mcq':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'mixed':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'true/false':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
    case 'short answer':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
};

const formatTimeAgo = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

// Main Component
export default function AnalyticsPage() {
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [enlargedChart, setEnlargedChart] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [expandedActions, setExpandedActions] = useState(null);
  const router = useRouter();

  const userQuizzes = useQuery(api.quiz.getUserQuizzes, {
    username: user?.username,
  });

  // Theme Initialization
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push("/");
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
      ChartJS.defaults.color = newDarkMode ? "#f3f4f6" : "#1f2937";
      ChartJS.defaults.plugins.tooltip.backgroundColor = newDarkMode
        ? "#1f2937"
        : "#f3f4f6";
      ChartJS.defaults.plugins.tooltip.titleColor = newDarkMode
        ? "#f3f4f6"
        : "#1f2937";
      ChartJS.defaults.plugins.tooltip.bodyColor = newDarkMode
        ? "#f3f4f6"
        : "#1f2937";
    };
    window.addEventListener("themeChanged", handleThemeChange);

    return () => {
      window.removeEventListener("themeChanged", handleThemeChange);
    };
  }, [router]);

  // Process quiz data for charts
  const { subjectScores, scoreTrends, completionStatus } = useMemo(
    () => processQuizData(userQuizzes),
    [userQuizzes]
  );

 const chartColors = {
    primary: [
      "rgba(59, 130, 246, 0.4)", // Blue glass
      "rgba(139, 92, 246, 0.4)", // Purple glass
      "rgba(236, 72, 153, 0.4)", // Pink glass
      "rgba(16, 185, 129, 0.4)", // Emerald glass
      "rgba(245, 158, 11, 0.4)" // Amber glass
    ],
    secondary: [
      "rgba(96, 165, 250, 0.3)", // Lighter blue glass
      "rgba(167, 139, 250, 0.3)", // Lighter purple glass
      "rgba(244, 114, 182, 0.3)", // Lighter pink glass
      "rgba(52, 211, 153, 0.3)", // Lighter emerald glass
      "rgba(251, 191, 36, 0.3)" // Lighter amber glass
    ],
    border: [
      "rgba(29, 78, 216, 0.7)", // Darker blue border
      "rgba(88, 28, 135, 0.7)", // Darker purple border
      "rgba(219, 39, 119, 0.7)", // Darker pink border
      "rgba(5, 150, 105, 0.7)", // Darker emerald border
      "rgba(217, 119, 6, 0.7)" // Darker amber border
    ]
  };
  // Chart Data
  const barChartData = {
    labels: subjectScores?.map((s) => s.subject) || [],
    datasets: [
      {
        label: "Average Score",
        data: subjectScores?.map((s) => s.avgScore) || [],
        backgroundColor: chartColors.primary,
        borderColor: chartColors.border,
        borderWidth: 1,
      },
    ],
  };

  const lineChartData = {
    labels: scoreTrends?.map((t) => t.date) || [],
    datasets: [
      {
        label: "Score",
        data: scoreTrends?.map((t) => t.score) || [],
        borderColor: chartColors.border[0],
        backgroundColor: chartColors.primary[0] + "33", // 20% opacity
        fill: true,
        tension: 0.4,
      },
    ],
  };
  // Handle View Results click
  const handleViewResults = (quiz) => {
    setSelectedQuiz(quiz);
    setShowQuizModal(true);
  };

  // Handle Retake Quiz
  const handleRetakeQuiz = (quizId) => {
    router.push(`/quiz/${quizId}?retake=true`);
  };

  // Chart Options
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: isDark ? "#f3f4f6" : "#1f2937",
          font: {
            family: "'Inter', sans-serif",
            size: 10,
          }
        }
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(17, 24, 39, 0.8)" : "rgba(255, 255, 255, 0.8)",
        titleColor: isDark ? "#f3f4f6" : "#1f2937",
        bodyColor: isDark ? "#f3f4f6" : "#1f2937",
        padding: 8,
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        borderWidth: 1,
        displayColors: true,
        usePointStyle: true,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          drawBorder: false,
        },
        ticks: {
          color: isDark ? "#f3f4f6" : "#1f2937",
          font: {
            family: "'Inter', sans-serif",
            size: 10,
          }
        }
      },
      x: {
        display: enlargedChart === "bar", // Show x-axis only when enlarged
        grid: {
          display: false
        },
        ticks: {
          color: isDark ? "#f3f4f6" : "#1f2937",
          font: {
            family: "'Inter', sans-serif",
            size: 10,
          }
        }
      }
    },
    plugins: {
      ...(!enlargedChart && {
        datalabels: {
          display: true,
          color: isDark ? "#f3f4f6" : "#1f2937",
          font: {
            family: "'Inter', sans-serif",
            size: 10,
            weight: 'bold'
          },
          formatter: (value, context) => {
            return context.chart.data.labels[context.dataIndex];
          },
          anchor: 'end',
          align: 'start',
          rotation: -45,
          offset: 10
        }
      })
    }
  }), [isDark, enlargedChart]);

// Enhanced Color Palette for Doughnut Chart
  const doughnutChartColors = {
    primary: [
      "rgba(34, 197, 94, 0.4)", // Green glass for Completed
      "rgba(239, 68, 68, 0.4)" // Red glass for Incomplete
    ],
    border: [
      "rgba(21, 128, 61, 0.7)", // Darker green border
      "rgba(220, 38, 38, 0.7)" // Darker red border
    ]
  };

  // Doughnut Chart Data
  const doughnutChartData = {
    labels: ["Completed", "Incomplete"],
    datasets: [
      {
        data: [
          completionStatus?.completed || 0,
          completionStatus?.incomplete || 0
        ],
        backgroundColor: doughnutChartColors.primary,
        borderColor: doughnutChartColors.border,
        borderWidth: 1,
      },
    ],
  };

  // Doughnut Chart Options
  const doughnutChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: isDark ? "#f3f4f6" : "#1f2937",
          font: {
            family: "'Inter', sans-serif",
            size: 10,
          }
        }
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(17, 24, 39, 0.8)" : "rgba(255, 255, 255, 0.8)",
        titleColor: isDark ? "#f3f4f6" : "#1f2937",
        bodyColor: isDark ? "#f3f4f6" : "#1f2937",
        padding: 20,
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        borderWidth: 4,
        displayColors: true,
        usePointStyle: true,
      },
      doughnut: {
        cutout: '110%' // Increased inner radius for thinner donut
      }
    },
    scales: {
      x: {
        display: false // Hide x-axis
      },
      y: {
        display: false, // Hide y-axis
        grid: {
          display: false // Remove grid lines
        }
      }
    }
  }), [isDark]);
  
  // Rive Animation
  useEffect(() => {
    const initRiveAnimation = async () => {
      try {
        const rive = await import('@rive-app/canvas');
        const canvas = document.getElementById('riveCanvas');
        
        if (canvas) {
          const riveInstance = new rive.Rive({
            src: 'https://public.rive.app/community/runtime-files/2063-4080-peaceful-rhythms.riv',
            canvas: canvas,
            autoplay: true,
            stateMachines: 'State Machine 1',
            onLoad: () => {
              riveInstance.resizeDrawingSurfaceToCanvas();
            },
          });
        }
      } catch (error) {
        console.log('Rive animation not available');
      }
    };

    initRiveAnimation();
  }, []);

  // Floating Particles
  useEffect(() => {
    const container = document.getElementById('particlesContainer');
    if (!container) return;

    const particles = [];
    const particleCount = 40;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'floating-particle';
      const colors = isDark 
        ? chartColors.primary
        : chartColors.secondary;
      
      const size = Math.random() * 4 + 2;
      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        filter: blur(1px);
        animation: floatParticle ${Math.random() * 25 + 15}s linear infinite;
        animation-delay: -${Math.random() * 20}s;
      `;
      container.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach(particle => particle.remove());
    };
  }, [isDark]);

  // Calculate stats
  const stats = useMemo(() => ({
    totalQuizzes: userQuizzes?.length || 0,
    averageScore: Math.round(
      userQuizzes?.reduce((sum, quiz) => sum + quiz.score, 0) / (userQuizzes?.length || 1)
    ),
    completedQuizzes: userQuizzes?.filter(q => q.completed).length || 0,
    subjects: new Set(userQuizzes?.map(q => q.subject)).size || 0
  }), [userQuizzes]);

  // Loading State
  if (!userQuizzes) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className={`min-h-screen relative overflow-hidden pt-12 sm:pt-20 transition-colors duration-300 ${
        isDark ? 'bg-black' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
      }`}>
        <BackgroundElements />

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-4 py-6 sm:py-8">
          {/* Header Section */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-8 sm:mt-10 mt-15 mb-6 sm:mb-8 backdrop-blur-lg bg-white/80 dark:bg-black"
            style={{ 
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)',
              backdropFilter: 'blur(1px)',
            }}>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
              Performance Analytics
            </h1>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-6">
              <StatCard
                title="Total Quizzes"
                value={stats.totalQuizzes}
                icon={<icons.Quiz />}
                color="bg-gradient-to-r from-blue-500 to-indigo-500"
              />
              <StatCard
                title="Average Score"
                value={`${stats.averageScore}%`}
                icon={<icons.Analytics />}
                color="bg-gradient-to-r from-green-500 to-emerald-500"
              />
              <StatCard
                title="Completed"
                value={stats.completedQuizzes}
                icon={<icons.Quiz />}
                color="bg-gradient-to-r from-purple-500 to-pink-500"
              />
              <StatCard
                title="Subjects"
                value={stats.subjects}
                icon={<icons.Brain />}
                color="bg-gradient-to-r from-amber-500 to-orange-500"
              />
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <ChartCard title="Subject Performance" onClick={() => setEnlargedChart("bar")}>
              <Bar data={barChartData} options={chartOptions} />
            </ChartCard>
            <ChartCard title="Progress Timeline" onClick={() => setEnlargedChart("line")}>
              <Line data={lineChartData} options={chartOptions} />
            </ChartCard>
            <ChartCard title="Completion Status" onClick={() => setEnlargedChart("doughnut")}>
              <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            </ChartCard>
          </div>

          {/* Enhanced Quiz History Section - Perfect Alignment */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-8 backdrop-blur-lg bg-white/80 dark:bg-black"
            style={{ 
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)',
              backdropFilter: 'blur(1px)',
            }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-0">
                Quiz History
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {userQuizzes?.length || 0} total quizzes
              </div>
            </div>
            
            {userQuizzes?.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <icons.Quiz />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">No quizzes taken yet</p>
                <Link
                  href="/home"
                  className="inline-block mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all font-medium text-sm"
                >
                  Take Your First Quiz
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {userQuizzes?.map((quiz) => (
                  <div
                    key={quiz._id}
                    data-quiz-actions
                    className="group bg-transparent dark:bg-black rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-700"
                    style={{
                      backdropFilter: 'blur(10px)',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.8)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {/* Main Content Container */}
                    <div className="flex flex-col gap-4">
                      
                      {/* Header Row - Title, Score, and Status */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100 truncate">
                              {quiz.subject}
                            </h3>
                            <span
                              className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold shadow-sm flex-shrink-0 ${getScoreColor(
                                quiz.score || 0
                              )}`}
                            >
                              {quiz.score || 0}%
                            </span>
                          </div>
                          
                          {/* Concept */}
                          {quiz.concept && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">
                              <span className="font-medium">Topic:</span> {quiz.concept}
                            </p>
                          )}
                          
                          {/* Time */}
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{quiz.attemptedAt ? formatTimeAgo(quiz.attemptedAt) : formatTimeAgo(quiz.createdAt)}</span>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="flex-shrink-0 ml-4">
                          {quiz.completed ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tags Row */}
                      <div className="flex flex-wrap gap-2">
                        {/* Retaken Tag - Show if retakeCount > 0 */}
                        {quiz.retakeCount > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-700">
                            <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            RETAKEN
                          </span>
                        )}

                        {/* Number of Questions */}
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                          <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {quiz.numberOfQuestions} Questions
                        </span>

                        {/* Quiz Type */}
                        {quiz.quizType && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getQuizTypeColor(quiz.quizType)}`}>
                            <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {quiz.quizType === 'mcq' ? 'Multiple Choice' : 
                             quiz.quizType === 'true_false' ? 'T / F' : 
                             quiz.quizType === 'writing' ? 'Text Input' : 
                             quiz.quizType === 'mixed' ? 'Mixed' : 
                             quiz.quizType?.charAt(0).toUpperCase() + quiz.quizType?.slice(1)}
                          </span>
                        )}

                        {/* Difficulty */}
                        {quiz.difficulty && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getDifficultyColor(quiz.difficulty)}`}>
                            <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {quiz.difficulty?.charAt(0).toUpperCase() + quiz.difficulty?.slice(1)}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons Row - Sliding Actions (Left to Right) */}
                      <div className="relative flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className={`text-xs text-gray-500 dark:text-gray-400 transition-opacity duration-300 ${
                          expandedActions === quiz._id ? 'opacity-0' : 'opacity-100'
                        }`}>
                          {quiz.completed ? 'Quiz completed' : 'Quiz in progress'}
                        </div>
                        
                        {quiz.completed ? (
                          <div className="relative flex items-center gap-2">
                            {/* Sliding Action Buttons Container - Positioned to the Left */}
                            <div className={`flex gap-2 transition-all duration-500 ease-in-out ${
                              expandedActions === quiz._id 
                                ? 'transform translate-x-0 opacity-100 w-auto' 
                                : 'transform -translate-x-full opacity-0 w-0 overflow-hidden pointer-events-none'
                            }`}>
                              {/* View Results Button */}
                              <button
                                onClick={() => {
                                  handleViewResults(quiz);
                                  setExpandedActions(null);
                                }}
                                className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 transition-all font-medium shadow-sm text-xs sm:text-sm gap-1 whitespace-nowrap flex-shrink-0"
                                title="View Results"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span className="hidden sm:inline">Results</span>
                                <span className="sm:hidden">View</span>
                              </button>

                              {/* Retake Quiz Button - Only show if retakeCount is 0 */}
                              {(quiz.retakeCount === 0 || quiz.retakeCount === undefined) && (
                                <button
                                  onClick={() => {
                                    handleRetakeQuiz(quiz._id);
                                    setExpandedActions(null);
                                  }}
                                  className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 transition-all font-medium shadow-sm text-xs sm:text-sm gap-1 whitespace-nowrap flex-shrink-0"
                                  title="Retake Quiz"
                                >
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  <span className="hidden sm:inline">Retake</span>
                                  <span className="sm:hidden">Retry</span>
                                </button>
                              )}
                            </div>

                            {/* Actions Button - Stays in Place */}
                            <button
                              onClick={() => setExpandedActions(expandedActions === quiz._id ? null : quiz._id)}
                              className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-600 dark:hover:from-indigo-700 dark:hover:to-purple-700 transition-all duration-300 shadow-sm flex-shrink-0"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                              <span className="hidden sm:inline">Actions</span>
                              <span className="sm:hidden">More</span>
                              <svg className={`w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 -mr-1 transition-transform duration-300 ${
                                expandedActions === quiz._id ? 'rotate-180' : ''
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <Link
                            href={`/quiz/${quiz._id}`}
                            className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 transition-all font-medium shadow-sm text-xs sm:text-sm gap-1 sm:gap-2"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="hidden sm:inline">Continue Quiz</span>
                            <span className="sm:hidden">Continue</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <QuizResultModal
          quiz={selectedQuiz}
          isOpen={showQuizModal}
          onClose={() => setShowQuizModal(false)}
          onRetake={handleRetakeQuiz}
        />

        <ChartModal
          isOpen={enlargedChart === "bar"}
          onClose={() => setEnlargedChart(null)}
          chartType="bar"
          chartData={barChartData}
          chartOptions={chartOptions}
          title="Average Scores by Subject"
        />
        <ChartModal
          isOpen={enlargedChart === "line"}
          onClose={() => setEnlargedChart(null)}
          chartType="line"
          chartData={lineChartData}
          chartOptions={chartOptions}
          title="Score Trends Over Time"
        />
        <ChartModal
          isOpen={enlargedChart === "doughnut"}
          onClose={() => setEnlargedChart(null)}
          chartType="doughnut"
          chartData={doughnutChartData}
          chartOptions={doughnutChartOptions}
          title="Quiz Completion Status"
        />

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
            background-size: 30px 30px;
          }

          .animation-delay-2000 {
            animation-delay: 2s;
          }

          .animation-delay-4000 {
            animation-delay: 4s;
          }

          @media (max-width: 640px) {
            .grid-pattern {
              background-size: 20px 20px;
            }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}