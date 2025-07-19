
"use client";
import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import CreatePlanner from "@/components/studyplanner/CreatePlanner";
import ActivePlanners from "@/components/studyplanner/ActivePlanners";
import CompletedPlanners from "@/components/studyplanner/CompletedPlanners";
import YourPlans from "@/components/studyplanner/YourPlans";
import './StudyPlannerStyles.css';
import { 
  Clock, 
  CheckCircle,
  Play,
  Plus,
  MapPin,
  Trophy,
  Lock,
  AlertTriangle,
  X
} from 'lucide-react';
import { color } from "framer-motion";

const StudyPlannerPage = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("create");
  const [selectedPlanner, setSelectedPlanner] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [planModifications, setPlanModifications] = useState(0);
  const [noteModifications, setNoteModifications] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [loadingStates, setLoadingStates] = useState({
    reactivating: null,
    dropping: null,
    deleting: null,
    togglingNote: null
  });
  const [showReactivateWarning, setShowReactivateWarning] = useState(false);
  const [plannerToReactivate, setPlannerToReactivate] = useState(null);
  const particlesContainer = useRef(null);

  // Queries
  const activePlanners = useQuery(
    api.studyPlanner.getActivePlanners, 
    user ? { username: user.username } :  "skip"
  );
  const completedPlanners = useQuery(
    api.studyPlanner.getCompletedPlanners, 
    user ? { username: user.username } :  "skip"
  );
  const droppedPlanners = useQuery(
    api.studyPlanner.getDroppedPlanners, 
    user ? { username: user.username } :  "skip"
  );
  const selectedPlannerData = useQuery(
    api.studyPlanner.getPlannerById,
    selectedPlanner ? { plannerId: selectedPlanner } : "skip"
  );

  // Mutations
  const toggleNoteCompletion = useMutation(api.studyPlanner.toggleNoteCompletion);
  const reactivatePlanner = useMutation(api.studyPlanner.reactivatePlanner);
  const dropPlanner = useMutation(api.studyPlanner.dropPlanner);
  const deletePlanner = useMutation(api.studyPlanner.deletePlanner);

  useEffect(() => {
    // Initialize user data with error handling
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (err) {
      console.error("Failed to parse user data from localStorage:", err);
      setUser(null); // Fallback to null if parsing fails
    }
    
    // Initialize theme based on localStorage or system preference
    const savedTheme = localStorage.getItem("theme");
    const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedTheme ? savedTheme === "dark" : systemDarkMode;
    setIsDark(initialDarkMode);
    document.documentElement.classList.toggle('dark', initialDarkMode);

    // Listen for theme changes from navbar
    const handleThemeChange = (e) => {
      const newDarkMode = e.detail?.isDark ?? initialDarkMode;
      setIsDark(newDarkMode);
      document.documentElement.classList.toggle('dark', newDarkMode);
    };

    // Handle mouse movement for dynamic background
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('themeChanged', handleThemeChange);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Create floating particles with cleanup
  useEffect(() => {
    if (!particlesContainer.current) return;

    const maxParticles = 50;
    let particleCount = 0;
    const particles = new Set();

    const createParticle = () => {
      if (particleCount >= maxParticles) return;

      const particle = document.createElement('div');
      particle.className = 'floating-particle';
      
      const colors = isDark 
        ? ['59, 130, 246', '168, 85, 247', '236, 72, 153']
        : ['37, 99, 235', '147, 51, 234', '219, 39, 119'];
      
      const size = Math.random() * 6 + 2;
      particle.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: ${size}px;
        background: rgba(${colors[Math.floor(Math.random() * colors.length)]}, ${Math.random() * 0.5 + 0.3});
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: 100vh;
        filter: blur(1px);
        animation: floatUp ${Math.random() * 25 + 15}s linear infinite;
        animation-delay: -${Math.random() * 20}s;
        pointer-events: none;
        z-index: 1;
      `;
      
      particlesContainer.current.appendChild(particle);
      particles.add(particle);
      particleCount++;

      const timeout = setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
          particles.delete(particle);
          particleCount--;
        }
      }, 5000);

      particles.add(timeout);
    };

    const interval = setInterval(createParticle, 300);

    return () => {
      clearInterval(interval);
      particles.forEach((item) => {
        if (item instanceof HTMLElement && item.parentNode) {
          item.parentNode.removeChild(item);
        } else if (typeof item === 'number') {
          clearTimeout(item);
        }
      });
      particles.clear();
    };
  }, [isDark]);

  const toggleNodeExpansion = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const handlePlanModification = async (action, data) => {
    // Only limit note toggles, not other actions
    if (action === 'toggle_note' && noteModifications >= 2) {
      return false;
    }
    
    try {
      switch (action) {
        case 'toggle_note':
          setLoadingStates(prev => ({ ...prev, togglingNote: data.noteId }));
          await toggleNoteCompletion(data);
          setNoteModifications(prev => prev + 1);
          break;
        case 'reactivate':
          setLoadingStates(prev => ({ ...prev, reactivating: data.plannerId }));
          await reactivatePlanner(data);
          break;
        case 'drop_plan':
          setLoadingStates(prev => ({ ...prev, dropping: data.plannerId }));
          await dropPlanner(data);
          break;
        case 'delete_plan':
          setLoadingStates(prev => ({ ...prev, deleting: data.plannerId }));
          await deletePlanner(data);
          break;
        default:
          break;
      }
      
      return true;
    } catch (err) {
      console.error("Error in plan modification:", err);
      return false;
    } finally {
      setLoadingStates({
        reactivating: null,
        dropping: null,
        deleting: null,
        togglingNote: null
      });
    }
  };

  const handleViewPlanner = (plannerId) => {
    setSelectedPlanner(plannerId);
    setActiveTab("roadmap");
    setNoteModifications(0); // Reset note modifications when viewing a new planner
  };

  const handleToggleNote = async (noteId, isCompleted) => {
    await handlePlanModification('toggle_note', {
      noteId,
      isCompleted: !isCompleted
    });
  };

  const handleReactivatePlanner = async (plannerId) => {
    // Check if the planner is completed and show warning
    const plannerData = [...(completedPlanners || []), ...(droppedPlanners || [])].find(p => p._id === plannerId);
    
    if (plannerData?.status === 'completed') {
      setPlannerToReactivate(plannerData);
      setShowReactivateWarning(true);
      return;
    }
    
    // For dropped plans, reactivate directly
    const success = await handlePlanModification('reactivate', { plannerId });
    if (success) {
      setActiveTab("active");
    }
  };

  const confirmReactivation = async () => {
    if (plannerToReactivate) {
      const success = await handlePlanModification('reactivate', { plannerId: plannerToReactivate._id });
      if (success) {
        setActiveTab("active");
      }
    }
    setShowReactivateWarning(false);
    setPlannerToReactivate(null);
  };

  const cancelReactivation = () => {
    setShowReactivateWarning(false);
    setPlannerToReactivate(null);
  };

  const handleDropPlanner = async (plannerId) => {
    const success = await handlePlanModification('drop_plan', { plannerId });
    if (success) {
      // Stay on the same tab
    }
  };

  const handleDeletePlanner = async (plannerId) => {
    const success = await handlePlanModification('delete_plan', { plannerId });
    if (success) {
      // Stay on the same tab, the planner will be removed from the list
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeRemaining = (expiresAt) => {
    const now = Date.now();
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return "Expired";
    
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
    return "Less than 1 hour left";
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-900 border-red-300 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-200 dark:border-red-700';
      case 'medium': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-900 border-yellow-300 dark:from-yellow-900/30 dark:to-yellow-800/30 dark:text-yellow-200 dark:border-yellow-700';
      case 'low': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-900 border-green-300 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-200 dark:border-green-700';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 border-gray-300 dark:from-gray-700 dark:to-gray-600 dark:text-gray-200 dark:border-gray-600';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      default: return '⚪';
    }
  };

  // Dynamic header content based on active tab
  const headerContent = {
    create: {
      title: "Create AI Study Planner",
      description: "Design a new personalized learning path with AI-powered insights.",
      icon: <Plus className="w-6 h-6 text-white" />,
      stats: [
        { color: 'green-500', text: 'AI-Powered Analysis' },
        { color: 'blue-500', text: 'Custom Learning Paths' },
        { color: 'purple-500', text: 'Goal Setting' },
      ],
    },
    active: {
      title: "Active Study Plans",
      description: "View and manage your ongoing learning plans.",
      icon: <Play className="w-6 h-6 text-white" />,
      stats: [
        { color: 'green-500', text: 'Track Progress' },
        { color: 'blue-500', text: 'Active Tasks' },
        { color: 'purple-500', text: 'Time Management' },
      ],
    },
    'your-plans': {
      title: "Your Study Plans",
      description: "Review your completed and dropped study plans.",
      icon: <Trophy className="w-6 h-6 text-white" />,
      stats: [
        { color: 'green-500', text: 'Achievements' },
        { color: 'blue-500', text: 'History Review' },
        { color: 'purple-500', text: 'Plan Insights' },
      ],
    },
    roadmap: {
      title: selectedPlannerData?.title ?? "Learning Roadmap",
      description: selectedPlannerData?.description ?? "Explore the detailed roadmap for your selected study plan.",
      icon: <MapPin className="w-6 h-6 text-white" />,
      stats: [],
    },
  };

  return (
    <ProtectedRoute>
      <div className={`min-h-screen relative overflow-hidden pt-16 transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'} ${isDark ? 'dark' : ''}`}>
        
        {/* Particles Container */}
        <div ref={particlesContainer} className="fixed inset-0 pointer-events-none z-0" />
        
        {/* Geometric Background Elements */}
        <div className="absolute inset-0">
          <div className={`absolute top-20 left-10 w-64 h-64 rounded-full blur-3xl animate-pulse ${
            isDark 
              ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10' 
              : 'bg-gradient-to-br from-blue-300/20 to-purple-300/20'
          }`}></div>
          <div className={`absolute top-40 right-20 w-80 h-80 rounded-full blur-3xl animate-pulse animation-delay-2000 ${
            isDark 
              ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10' 
              : 'bg-gradient-to-br from-purple-300/20 to-pink-300/20'
          }`}></div>
          <div className={`absolute bottom-20 left-10 w-56 h-56 rounded-full blur-3xl animate-pulse animation-delay-4000 ${
            isDark 
              ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10' 
              : 'bg-gradient-to-br from-green-300/20 to-emerald-300/20'
          }`}></div>
        </div>

        {/* Dynamic Background with Mouse Interaction */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`
          }}
        ></div>

        {showNotifications && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Study planner created successfully!</span>
            </div>
          </div>
        )}

        {/* Reactivation Warning Modal */}
        {showReactivateWarning && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Reactivate Completed Plan?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    This action will reset your progress
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>Warning:</strong> Reactivating "{plannerToReactivate?.title}" will reset all progress to 0%. 
                    You'll need to start learning from the beginning, but you can use your previous knowledge to progress faster.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelReactivation}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </div>
                </button>
                <button
                  onClick={confirmReactivation}
                  disabled={loadingStates.reactivating === plannerToReactivate?._id}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center space-x-2">
                    {loadingStates.reactivating === plannerToReactivate?._id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>Reactivate & Reset</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 md:py-8">
          {/* Modern Compact Header */}
          <div className="glass-card rounded-3xl shadow-xl mb-4 md:mb-6"
            style={{
              color: isDark ? 'white' : 'black',
              borderRadius: '25px',
            }}>
            <div className="relative px-4 md:px-6 py-4 md:py-8 text-center">
              {/* Compact Dynamic Icon */}
              <div className="inline-flex items-center justify-center w-8 h-8 md:w-12 md:h-12 rounded-xl mb-2 md:mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                {headerContent[activeTab].icon}
              </div>
              
              {/* Compact Title */}
              <h1 className="text-lg md:text-2xl lg:text-3xl font-bold mb-1 md:mb-2">
                {headerContent[activeTab].title}
              </h1>
              
              {/* Compact Description */}
              <p className="text-xs md:text-sm lg:text-base mb-4 md:mb-6 max-w-2xl mx-auto">
                {headerContent[activeTab].description}
              </p>
              
              {/* Compact Stats (Hidden for Roadmap) */}
              {headerContent[activeTab].stats.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 md:gap-4 text-xs mb-4 md:mb-6">
                  {headerContent[activeTab].stats.map((stat, index) => (
                    <div key={index} className="flex items-center space-x-1 md:space-x-2">
                      <div className={`w-2 h-2 bg-${stat.color} rounded-full animate-pulse ${index === 1 ? 'delay-300' : index === 2 ? 'delay-500' : ''}`}></div>
                      <span className="text-xs md:text-sm">{stat.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Compact Navigation Panel */}
              <div className="flex flex-wrap justify-center gap-1 md:gap-2 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab("create")}
                  className={`group relative px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center space-x-2 ${
                    activeTab === "create"
                      ? isDark 
                        ? "bg-gradient-to-r from-indigo-600/60 to-purple-600/60 backdrop-blur-md border border-indigo-400/30 shadow-lg transform scale-105 text-white" 
                        : "bg-gradient-to-r from-indigo-500/80 to-purple-600/80 backdrop-blur-md border border-white/30 shadow-lg transform scale-105 text-white"
                      : isDark
                        ? "hover:bg-white/10 hover:backdrop-blur-sm text-gray-200"
                        : "hover:bg-white/20 hover:backdrop-blur-sm text-gray-800"
                  }`}
                  aria-selected={activeTab === "create"}
                  role="tab"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create</span>
                  {activeTab === "create" && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-md"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("active")}
                  className={`group relative px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center space-x-2 ${
                    activeTab === "active"
                      ? isDark 
                        ? "bg-gradient-to-r from-indigo-600/60 to-purple-600/60 backdrop-blur-md border border-indigo-400/30 shadow-lg transform scale-105 text-white" 
                        : "bg-gradient-to-r from-indigo-500/80 to-purple-600/80 backdrop-blur-md border border-white/30 shadow-lg transform scale-105 text-white"
                      : isDark
                        ? "hover:bg-white/10 hover:backdrop-blur-sm text-gray-200"
                        : "hover:bg-white/20 hover:backdrop-blur-sm text-gray-800"
                  }`}
                  aria-selected={activeTab === "active"}
                  role="tab"
                >
                  <Play className="w-4 h-4" />
                  <span>Active</span>
                  {activePlanners?.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold animate-pulse">
                      {activePlanners.length}
                    </div>
                  )}
                  {activeTab === "active" && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-md"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("your-plans")}
                  className={`group relative px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center space-x-2 ${
                    activeTab === "your-plans"
                      ? isDark 
                        ? "bg-gradient-to-r from-indigo-600/60 to-purple-600/60 backdrop-blur-md border border-indigo-400/30 shadow-lg transform scale-105 text-white" 
                        : "bg-gradient-to-r from-indigo-500/80 to-purple-600/80 backdrop-blur-md border border-white/30 shadow-lg transform scale-105 text-white"
                      : isDark
                        ? "hover:bg-white/10 hover:backdrop-blur-sm text-gray-200"
                        : "hover:bg-white/20 hover:backdrop-blur-sm text-gray-800"
                  }`}
                  aria-selected={activeTab === "your-plans"}
                  role="tab"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Plans</span>
                  {activeTab === "your-plans" && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-md"></div>
                  )}
                </button>
                {selectedPlanner && (
                  <button
                    onClick={() => setActiveTab("roadmap")}
                    className={`group relative px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center space-x-2 animate-fade-in ${
                      activeTab === "roadmap"
                        ? isDark 
                          ? "bg-gradient-to-r from-indigo-600/60 to-purple-600/60 backdrop-blur-md border border-indigo-400/30 shadow-lg transform scale-105 text-white" 
                          : "bg-gradient-to-r from-indigo-500/80 to-purple-600/80 backdrop-blur-md border border-white/30 shadow-lg transform scale-105 text-white"
                        : isDark
                          ? "hover:bg-white/10 hover:backdrop-blur-sm text-gray-200"
                          : "hover:bg-white/20 hover:backdrop-blur-sm text-gray-800"
                    }`}
                    aria-selected={activeTab === "roadmap"}
                    role="tab"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Roadmap</span>
                    {activeTab === "roadmap" && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-md"></div>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {activeTab === "create" && (
              <div className="animate-slide-in-up">
                <CreatePlanner
                  user={user}
                  setSelectedPlanner={setSelectedPlanner}
                  setActiveTab={setActiveTab}
                  setShowNotifications={setShowNotifications}
                  isDark={isDark}
                />
              </div>
            )}
            {activeTab === "active" && (
              <div className="animate-slide-in-up">
                <ActivePlanners
                  activePlanners={activePlanners || []}
                  handleViewPlanner={handleViewPlanner}
                  handleDropPlanner={handleDropPlanner}
                  formatDate={formatDate}
                  getTimeRemaining={getTimeRemaining}
                  isDark={isDark}
                  loadingStates={loadingStates}
                />
              </div>
            )}
            {activeTab === "your-plans" && (
              <div className="animate-slide-in-up">
                <YourPlans
                  completedPlanners={completedPlanners || []}
                  droppedPlanners={droppedPlanners || []}
                  handleViewPlanner={handleViewPlanner}
                  handleReactivatePlanner={handleReactivatePlanner}
                  handleDeletePlanner={handleDeletePlanner}
                  formatDate={formatDate}
                  isDark={isDark}
                  loadingStates={loadingStates}
                />
              </div>
            )}
            {activeTab === "roadmap" && (
              <div className="space-y-6 animate-slide-in-up">
                {selectedPlannerData ? (
                  <>
                    <div className="bg-white/80 dark:bg-black/80 rounded-xl p-6 shadow-lg border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                              <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {selectedPlannerData.title ?? "Untitled Plan"}
                              </h2>
                              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {selectedPlannerData.description ?? "No description available"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold mb-2">
                            {selectedPlannerData.completion_percentage ?? 0}% Complete
                          </div>
                          <div className={`text-sm flex items-center justify-end space-x-2 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                            <Clock className="w-4 h-4" />
                            <span>{getTimeRemaining(selectedPlannerData.expires_at ?? Date.now())}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                          <div
                            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${selectedPlannerData.completion_percentage ?? 0}%` }}
                          ></div>
                        </div>
                        <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          <span>{selectedPlannerData.completed_notes ?? 0} completed</span>
                          <span>{selectedPlannerData.total_notes ?? 0} total</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          Note Modifications: {noteModifications}/2
                        </div>
                        {noteModifications >= 2 && (
                          <div className="flex items-center space-x-2 text-orange-500">
                            <Lock className="w-4 h-4" />
                            <span className="text-sm">Notes Locked</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-white/80 dark:bg-black/80 rounded-xl p-4 md:p-6 shadow-lg border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-4 md:mb-6">
                        <h3 className={`text-base md:text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Learning Roadmap
                        </h3>
                        <div className="flex items-center space-x-2 md:space-x-4">
                          <div className="flex items-center space-x-1 md:space-x-2">
                            <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full"></div>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Complete</span>
                          </div>
                          <div className="flex items-center space-x-1 md:space-x-2">
                            <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Pending</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Learning Roadmap - Grid format with horizontal scroll */}
                      <div className="relative overflow-x-auto">
                        <div className="min-w-full mt-4 md:mt-8">
                          {(() => {
                            const notes = selectedPlannerData.notes ?? [];
                            const rows = [];
                            const itemsPerRow = 3;
                            for (let i = 0; i < notes.length; i += itemsPerRow) {
                              rows.push(notes.slice(i, i + itemsPerRow));
                            }
                            return rows.map((row, rowIndex) => (
                              <div key={rowIndex} className="mb-6 md:mb-8">
                                <div className="flex justify-center items-center space-x-4 md:space-x-6 min-w-max">
                                  {row.map((note, colIndex) => {
                                    const noteIndex = rowIndex * itemsPerRow + colIndex;
                                    const isExpanded = expandedNodes[note._id];
                                    return (
                                      <div key={note._id} className="relative">
                                        {colIndex < row.length - 1 && (
                                          <div className={`absolute top-1/2 -right-2 md:-right-3 w-4 md:w-6 h-0.5 transform -translate-y-1/2 z-10 ${isDark ? 'bg-indigo-500' : 'bg-indigo-400'}`}>
                                            <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-3 md:border-l-4 border-t-2 border-b-2 border-transparent ${isDark ? 'border-l-indigo-500' : 'border-l-indigo-400'}`}></div>
                                          </div>
                                        )}
                                        {rowIndex < rows.length - 1 && colIndex === Math.floor(row.length / 2) && (
                                          <div className={`absolute top-full left-1/2 w-0.5 h-4 md:h-6 transform -translate-x-1/2 ${isDark ? 'bg-indigo-500' : 'bg-indigo-400'}`}>
                                            <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-t-4 border-l-2 border-r-2 border-transparent ${isDark ? 'border-t-indigo-500' : 'border-t-indigo-400'}`}></div>
                                          </div>
                                        )}
                                        <div
                                          className={`relative transition-all duration-300 cursor-pointer ${isExpanded ? 'w-64 md:w-72' : 'w-48 md:w-56'}`}
                                          onClick={() => toggleNodeExpansion(note._id)}
                                        >
                                          <div
                                            className={`relative p-3 md:p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-xl ${
                                              note.is_completed
                                                ? `${isDark ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500' : 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-400'}`
                                                : `${isDark ? 'bg-black/80 border-gray-600 hover:border-indigo-500' : 'bg-white/80 border-gray-300 hover:border-indigo-400'}`
                                            } ${isExpanded ? 'shadow-xl scale-105' : 'hover:scale-102'}`}
                                          >
                                            <div className={`absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                              note.is_completed
                                                ? 'bg-green-500 text-white'
                                                : `${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-400 text-white'}`
                                            }`}>
                                              {note.is_completed ? '✓' : noteIndex + 1}
                                            </div>
                                            <div className="text-center">
                                              <h4 className={`font-bold text-sm mb-2 ${note.is_completed ? `${isDark ? 'text-green-400' : 'text-green-800'} line-through` : `${isDark ? 'text-white' : 'text-gray-900'}`}`}>
                                                {note.title ?? "Untitled Note"}
                                              </h4>
                                              <div className="flex justify-center space-x-1 mb-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(note.priority)}`}>
                                                  {note.priority ?? "Unknown"}
                                                </span>
                                                <span className="text-sm">{getDifficultyIcon(note.difficulty_level)}</span>
                                              </div>
                                              <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{note.subject ?? "No subject"}</div>
                                            </div>
                                            {isExpanded && (
                                              <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                                                <div className={`text-xs mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                                  {(note.details ?? "").split('\n').slice(0, 3).map((line, i) => (
                                                    <p key={i} className="mb-1">{line}</p>
                                                  ))}
                                                </div>
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                  {(note.concepts ?? []).slice(0, 3).map((concept, i) => (
                                                    <span
                                                      key={i}
                                                      className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-100 text-indigo-800'}`}
                                                    >
                                                      {concept}
                                                    </span>
                                                  ))}
                                                </div>
                                                <div className={`text-xs mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                  <div className="flex items-center space-x-2">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{note.estimated_time ?? "Unknown"}</span>
                                                  </div>
                                                </div>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleNote(note._id, note.is_completed);
                                                  }}
                                                  disabled={noteModifications >= 2 || loadingStates.togglingNote === note._id}
                                                  className={`w-full py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                                    note.is_completed
                                                      ? `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                                                      : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
                                                  } ${noteModifications >= 2 || loadingStates.togglingNote === note._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                  {noteModifications >= 2 ? (
                                                    <div className="flex items-center justify-center space-x-1">
                                                      <Lock className="w-3 h-3" />
                                                      <span>Locked</span>
                                                    </div>
                                                  ) : loadingStates.togglingNote === note._id ? (
                                                    <div className="flex items-center justify-center space-x-1">
                                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                      <span>Updating...</span>
                                                    </div>
                                                  ) : (
                                                    note.is_completed ? "Mark Incomplete" : "Mark Complete"
                                                  )}
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white/80 dark:bg-black/80 rounded-xl p-6 shadow-lg border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm text-center">
                    <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Loading planner data or no planner selected...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default StudyPlannerPage;
