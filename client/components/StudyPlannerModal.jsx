"use client";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const StudyPlannerModal = ({ isOpen, onClose, username }) => {
  const [plannerType, setPlannerType] = useState("weekly");
  const [selectedPlanner, setSelectedPlanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState("create"); // 'create', 'view', 'roadmap'

  // Queries
  const activePlanners = useQuery(api.studyPlanner.getActivePlanners, { username });
  const selectedPlannerData = useQuery(
    api.studyPlanner.getPlannerById,
    selectedPlanner ? { plannerId: selectedPlanner } : "skip"
  );

  // Mutations
  const generatePlanner = useMutation(api.studyPlanner.generateStudyPlanner);
  const toggleNoteCompletion = useMutation(api.studyPlanner.toggleNoteCompletion);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setView("create");
      setSelectedPlanner(null);
    }
  }, [isOpen]);

  const handleGeneratePlanner = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await generatePlanner({
        username,
        type: plannerType
      });
      
      setSelectedPlanner(result.plannerId);
      setView("roadmap");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPlanner = (plannerId) => {
    setSelectedPlanner(plannerId);
    setView("roadmap");
  };

  const handleToggleNote = async (noteId, isCompleted) => {
    try {
      await toggleNoteCompletion({
        noteId,
        isCompleted: !isCompleted
      });
    } catch (err) {
      console.error("Error toggling note:", err);
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
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              📚 Study Planner
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Navigation */}
          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => setView("create")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === "create"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              Create New
            </button>
            
            {activePlanners && activePlanners.length > 0 && (
              <button
                onClick={() => setView("view")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === "view"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                View Active Plans
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {view === "create" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Generate Your Personalized Study Roadmap
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create a structured learning path based on your quiz performance and identified weak areas.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Study Plan Duration
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPlannerType("weekly")}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        plannerType === "weekly"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        📅 Weekly Plan
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        7-day focused study roadmap
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setPlannerType("monthly")}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        plannerType === "monthly"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        📆 Monthly Plan
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        30-day comprehensive study plan
                      </div>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="text-red-800 dark:text-red-400 font-medium">
                      Error
                    </div>
                    <div className="text-red-700 dark:text-red-300 text-sm">
                      {error}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleGeneratePlanner}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating Your Study Plan...
                    </div>
                  ) : (
                    `🚀 Generate ${plannerType.charAt(0).toUpperCase() + plannerType.slice(1)} Plan`
                  )}
                </button>
              </div>
            </div>
          )}

          {view === "view" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Active Study Plans
              </h3>
              
              {activePlanners && activePlanners.length > 0 ? (
                <div className="grid gap-4">
                  {activePlanners.map((planner) => (
                    <div
                      key={planner._id}
                      className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {planner.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {planner.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {getTimeRemaining(planner.expires_at)}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            Created: {formatDate(planner.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Progress
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {planner.completed_notes}/{planner.total_notes} tasks
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${planner.completion_percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {planner.completion_percentage}% complete
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleViewPlanner(planner._id)}
                        className="w-full bg-blue-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        📋 View Roadmap
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📚</div>
                  <p className="text-gray-600 dark:text-gray-400">
                    No active study plans found. Create your first personalized study roadmap!
                  </p>
                </div>
              )}
            </div>
          )}

          {view === "roadmap" && selectedPlannerData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedPlannerData.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedPlannerData.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {getTimeRemaining(selectedPlannerData.expires_at)}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {selectedPlannerData.completion_percentage}% complete
                  </div>
                </div>
              </div>

              {/* Study Roadmap */}
              <div className="relative">
                <div className="space-y-4">
                  {selectedPlannerData.notes.map((note, index) => (
                    <div key={note._id} className="relative">
                      {/* Connection Line */}
                      {index < selectedPlannerData.notes.length - 1 && (
                        <div className="absolute left-6 top-16 w-0.5 h-8 bg-gray-300 dark:bg-gray-600"></div>
                      )}
                      
                      {/* Note Card */}
                      <div className={`relative flex items-start space-x-4 p-4 rounded-lg border-2 transition-all duration-300 ${
                        note.is_completed
                          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                          : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                      }`}>
                        {/* Status Circle */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                          note.is_completed
                            ? "bg-green-500 border-green-500 text-white"
                            : "bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600 text-gray-400"
                        }`}>
                          {note.is_completed ? "✓" : index + 1}
                        </div>
                        
                        {/* Note Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`font-semibold ${
                              note.is_completed
                                ? "text-green-800 dark:text-green-400 line-through"
                                : "text-gray-900 dark:text-white"
                            }`}>
                              {note.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(note.priority)}`}>
                                {note.priority}
                              </span>
                              <span className="text-sm">
                                {getDifficultyIcon(note.difficulty_level)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <div className="flex items-center space-x-4">
                              <span>📅 {formatDate(note.start_date)} - {formatDate(note.due_date)}</span>
                              <span>⏱️ {note.estimated_time}</span>
                              <span>📖 {note.subject}</span>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                            {note.details.split('\n').map((line, i) => (
                              <p key={i} className="mb-1">{line}</p>
                            ))}
                          </div>
                          
                          {note.concepts.length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-2">
                                {note.concepts.map((concept, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs"
                                  >
                                    {concept}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => handleToggleNote(note._id, note.is_completed)}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                note.is_completed
                                  ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                  : "bg-green-500 text-white hover:bg-green-600"
                              }`}
                            >
                              {note.is_completed ? "Mark Incomplete" : "Mark Complete"}
                            </button>
                            
                            {note.resources && note.resources.length > 0 && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Resources:</span>
                                {note.resources.map((resource, i) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                                  >
                                    {resource.type}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyPlannerModal;
