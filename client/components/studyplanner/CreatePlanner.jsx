import { useState, useEffect } from "react";
import { Brain, Zap, Plus, X, Calendar, Clock, Target, Star, BookOpen, Trophy, AlertCircle, CheckCircle } from 'lucide-react';

const CreatePlanner = ({ user, setSelectedPlanner, setActiveTab, setShowNotifications, isDark }) => {
  const [plannerType, setPlannerType] = useState("weekly");
  const [generationMode, setGenerationMode] = useState("ai-review");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualSubjects, setManualSubjects] = useState([]);
  const [manualTopics, setManualTopics] = useState([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [studyGoal, setStudyGoal] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [studyHours, setStudyHours] = useState(2);
  const [priority, setPriority] = useState("medium");
  const [generationStage, setGenerationStage] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);

  // Format date to "DD MMM" (e.g., "12 Jan")
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
  };

  // Calculate dates based on planner type
  useEffect(() => {
    const today = new Date();
    const startDateObj = new Date(today);
    let endDateObj;

    if (plannerType === "weekly") {
      endDateObj = new Date(today);
      endDateObj.setDate(today.getDate() + 7);
    } else if (plannerType === "monthly") {
      endDateObj = new Date(today);
      endDateObj.setMonth(today.getMonth() + 1);
    }

    setStartDate(startDateObj.toISOString().split('T')[0]);
    setEndDate(endDateObj.toISOString().split('T')[0]);
  }, [plannerType]);

  const handleGeneratePlanner = async () => {
    if (!user) return;

    // Validation for manual mode
    if (generationMode === "manual" && (manualSubjects.length === 0 || manualTopics.length === 0)) {
      setError('Please add at least one subject and one topic for manual mode.');
      setTimeout(() => setError(null), 4000);
      return;
    }

    setLoading(true);
    setError(null);
    setGenerationProgress(0);

    try {
      setGenerationStage('Preparing study plan parameters...');
      setGenerationProgress(10);

      await new Promise(resolve => setTimeout(resolve, 500));

      setGenerationStage('Analyzing your study requirements...');
      setGenerationProgress(25);

      const response = await fetch('/api/study-planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          type: plannerType,
          mode: generationMode,
          startDate,
          endDate,
          studyHours: parseInt(studyHours),
          priority,
          manualInput: generationMode === "manual" ? {
            subjects: manualSubjects,
            topics: manualTopics,
            difficulty,
            studyGoal
          } : null
        }),
      });

      setGenerationStage('AI is crafting your personalized study plan...');
      setGenerationProgress(50);

      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev < 70) {
            return prev + Math.random() * 5;
          }
          return prev;
        });
      }, 200);

      const data = await response.json();

      clearInterval(progressInterval);

      setGenerationStage('Processing study plan structure...');
      setGenerationProgress(80);

      if (!response.ok) {
        // Handle different error types with user-friendly messages
        if (data.error && data.error.includes('already have an active')) {
          setError('You already have an active study plan. Please complete or cancel it first.');
        } else if (data.error && data.error.includes('insufficient data')) {
          setError('Insufficient data to generate a study plan. Please try manual input mode.');
        } else if (data.error && data.error.includes('rate limit')) {
          setError('Too many requests. Please wait a moment before trying again.');
        } else {
          setError(data.error || 'Failed to generate study planner. Please try again.');
        }
        
        // Clear error after 5 seconds
        setTimeout(() => setError(null), 5000);
        return;
      }

      if (data.success) {
        setGenerationStage('Study plan ready! Redirecting...');
        setGenerationProgress(100);
        
        setSelectedPlanner(data.plannerId);
        setActiveTab("active");
        setShowNotifications(true);
        setTimeout(() => setShowNotifications(false), 5000);

        setManualSubjects([]);
        setManualTopics([]);
        setStudyGoal("");
        setSubjectInput("");
        setTopicInput("");

        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        setError(data.error || 'Failed to generate study planner. Please try again.');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Study planner generation error:', err);
      
      if (err.message.includes('Failed to fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message.includes('already have an active')) {
        setError('You already have an active study plan. Please complete or cancel it first.');
      } else {
        setError('Something went wrong. Please try again later.');
      }
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
      setGenerationStage('');
      setGenerationProgress(0);
    }
  };

  const handleSubjectKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSubject();
    }
  };

  const handleTopicKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTopic();
    }
  };

  const addSubject = () => {
    const trimmed = subjectInput.trim();
    if (trimmed && !manualSubjects.includes(trimmed)) {
      setManualSubjects([...manualSubjects, trimmed]);
      setSubjectInput("");
    }
  };

  const addTopic = () => {
    const trimmed = topicInput.trim();
    if (trimmed && !manualTopics.includes(trimmed)) {
      setManualTopics([...manualTopics, trimmed]);
      setTopicInput("");
    }
  };

  const removeSubject = (index) => {
    setManualSubjects(manualSubjects.filter((_, i) => i !== index));
  };

  const removeTopic = (index) => {
    setManualTopics(manualTopics.filter((_, i) => i !== index));
  };

  const renderGenerateButton = () => {
    if (loading) {
      return (
        <div className="w-full">
          <div className="relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600">
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
            <div className="relative z-10 px-4 py-3 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <div className="mr-3 flex-shrink-0">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
                  </div>
                  <span className="text-sm font-medium leading-tight truncate">{generationStage}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-sm font-bold tabular-num text-black">
                    {Math.round(generationProgress)}%
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
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

    // Show error state in button
    if (error) {
      return (
        <button
          onClick={handleGeneratePlanner}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2 transform active:scale-95 bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl`}
        >
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </button>
      );
    }

    return (
      <button
        onClick={handleGeneratePlanner}
        disabled={loading || (generationMode === "manual" && (manualSubjects.length === 0 || manualTopics.length === 0))}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2 transform active:scale-95 ${
          loading || (generationMode === "manual" && (manualSubjects.length === 0 || manualTopics.length === 0))
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
        }`}
      >
        <Zap className="w-5 h-5" />
        <span>Generate Study Plan</span>
      </button>
    );
  };

  return (
    <div className={`w-full mx-auto p-3 md:p-4 space-y-4 md:space-y-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>

      {/* Main Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full">
        {/* Planning Mode */}
        <div className={`bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Planning Mode
          </h2>
          <div className="space-y-3">
            <div
              onClick={() => setGenerationMode("ai-review")}
              className={`p-3 md:p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                generationMode === "ai-review"
                  ? `border-indigo-500 ${isDark ? 'bg-indigo-900/20' : 'bg-indigo-50'}`
                  : `${isDark ? 'border-gray-600 hover:border-indigo-400 bg-gray-900/20' : 'border-gray-200 hover:border-indigo-300 bg-gray-50'}`
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${
                  generationMode === "ai-review" 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' 
                    : `${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`
                }`}>
                  <Brain className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-semibold">AI-Powered</h3>
                  <p className={`text-xs md:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Quiz-based planning</p>
                </div>
              </div>
            </div>
            <div
              onClick={() => setGenerationMode("manual")}
              className={`p-3 md:p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                generationMode === "manual"
                  ? `border-indigo-500 ${isDark ? 'bg-indigo-900/20' : 'bg-indigo-50'}`
                  : `${isDark ? 'border-gray-600 hover:border-indigo-400 bg-gray-900/20' : 'border-gray-200 hover:border-indigo-300 bg-gray-50'}`
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${
                  generationMode === "manual" 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' 
                    : `${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`
                }`}>
                  <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-semibold">Manual Input</h3>
                  <p className={`text-xs md:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Custom subjects/topics</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Study Preferences */}
        <div className={`bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Study Preferences
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Daily Study Hours</label>
              <input
                type="number"
                min="1"
                max="12"
                value={studyHours}
                onChange={(e) => setStudyHours(parseInt(e.target.value))}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isDark ? 'border-gray-600 bg-gray-900/50 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isDark ? 'border-gray-600 bg-gray-900/50 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
              <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                📊 {studyHours} hours daily • {priority} priority
              </p>
            </div>
          </div>
        </div>

        {/* Study Period */}
        <div className={`bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} md:col-span-2 xl:col-span-1`}>
          <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Study Period
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Duration Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPlannerType("weekly")}
                  className={`p-2 md:p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    plannerType === "weekly"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                      : `${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setPlannerType("monthly")}
                  className={`p-2 md:p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    plannerType === "monthly"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                      : `${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Calendar className="w-10 h-10 md:w-12 md:h-12 text-indigo-500" />
                  <span className={`absolute top-1/2 mt-1.5 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {startDate ? formatDate(startDate).split(' ')[0] : 'DD'}
                  </span>
                </div>
                <span className={`mt-1 text-xs font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                  {startDate ? formatDate(startDate).split(' ')[1] : 'MMM'}
                </span>
              </div>

              <span className="text-sm font-medium">to</span>

              <div className="flex flex-col items-center">
                <div className="relative">
                  <Calendar className="w-10 h-10 md:w-12 md:h-12 text-indigo-500" />
                  <span className={`absolute top-1/2 mt-1.5 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {endDate ? formatDate(endDate).split(' ')[0] : 'DD'}
                  </span>
                </div>
                <span className={`mt-1 text-xs font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                  {endDate ? formatDate(endDate).split(' ')[1] : 'MMM'}
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-indigo-900/20 border-indigo-700' : 'bg-indigo-50 border-indigo-200'} border text-center`}>
              <p className={`text-sm font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                {plannerType === "weekly" ? "7 Days" : "30 Days"} Plan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Input Section (Collapsible) */}
      {generationMode === "manual" && (
        <div className={`w-full bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center">
            <Star className="w-5 h-5 md:w-6 md:h-6 mr-2" />
            Customize Study Content
          </h2>
          <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
            <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              💡 <strong>Pro Tip:</strong> Add subjects and topics to tailor your study plan.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Subjects Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium mb-2">
                Subjects <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onKeyDown={handleSubjectKeyDown}
                  placeholder="e.g., Mathematics, Physics"
                  className={`flex-1 px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isDark ? 'border-gray-600 bg-gray-900/50 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                />
                <button
                  onClick={addSubject}
                  disabled={!subjectInput.trim() || manualSubjects.includes(subjectInput.trim())}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    !subjectInput.trim() || manualSubjects.includes(subjectInput.trim())
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {manualSubjects.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {manualSubjects.map((subject, index) => (
                    <div key={index} className="flex items-center px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-xs md:text-sm">
                      {subject}
                      <button
                        onClick={() => removeSubject(index)}
                        className="ml-1 md:ml-2 hover:text-red-200 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Topics Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium mb-2">
                Topics <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={handleTopicKeyDown}
                  placeholder="e.g., Calculus, Quantum Physics"
                  className={`flex-1 px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isDark ? 'border-gray-600 bg-gray-900/50 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                />
                <button
                  onClick={addTopic}
                  disabled={!topicInput.trim() || manualTopics.includes(topicInput.trim())}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    !topicInput.trim() || manualTopics.includes(topicInput.trim())
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400'
                      : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {manualTopics.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {manualTopics.map((topic, index) => (
                    <div key={index} className="flex items-center px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full text-xs md:text-sm">
                      {topic}
                      <button
                        onClick={() => removeTopic(index)}
                        className="ml-1 md:ml-2 hover:text-red-200 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
            {/* Study Goal */}
            <div>
              <label className="block text-sm font-medium mb-2">Study Goal</label>
              <textarea
                value={studyGoal}
                onChange={(e) => setStudyGoal(e.target.value)}
                placeholder="Describe your learning objectives..."
                rows={1}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isDark ? 'border-gray-600 bg-gray-900/50 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
              />
            </div>
            
            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isDark ? 'border-gray-600 bg-gray-900/50 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          
         
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-center w-full">
        <div className="w-full max-w-lg">
          {renderGenerateButton()}
        </div>
      </div>
    </div>
  );
};

export default CreatePlanner;