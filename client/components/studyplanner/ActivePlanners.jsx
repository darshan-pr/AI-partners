import { Play, BookOpen, Calendar, Clock, Target, Eye, BarChart3, Trash2 } from 'lucide-react';

const ActivePlanners = ({ activePlanners, handleViewPlanner, handleDropPlanner, formatDate, getTimeRemaining, isDark, loadingStates }) => {
  return (
    <div className="space-y-6">
      {activePlanners && activePlanners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activePlanners.map((planner, index) => (
            <div
              key={planner._id}
              className={`bg-white/40 dark:bg-black/40 backdrop-blur-sm rounded-lg p-3 md:p-4 shadow-md border hover:shadow-lg transition-all duration-300 ${isDark ? 'border-gray-700/60' : 'border-gray-200/60'} flex flex-col h-full`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Header Section */}
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                    <BookOpen className="w-3 h-3 md:w-4 md:h-4" />
                  </div>
                  <h3 className={`text-base md:text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                    {planner.title.length > 20 ? `${planner.title.substring(0, 20)}...` : planner.title}
                  </h3>
                </div>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 flex-shrink-0">
                  {planner.completion_percentage}% Complete
                </div>
              </div>

              {/* Description */}
              <p className={`text-xs md:text-sm mb-3 md:mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>
                {planner.description.length > 100 ? `${planner.description.substring(0, 100)}...` : planner.description}
              </p>

              

              {/* Spacer to push content to bottom */}
              <div className="flex-1"></div>

              {/* Metadata Section */}
              <div className="space-y-2 mb-3 md:mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-indigo-500" />
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Created: {formatDate(planner.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-purple-500" />
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {getTimeRemaining(planner.expires_at)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="w-3 h-3 text-emerald-500" />
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    {planner.type.charAt(0).toUpperCase() + planner.type.slice(1)}
                  </span>
                </div>
              </div>

              {/* Progress Section - Always at bottom */}
              <div className="mb-3 md:mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Progress
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {planner.completed_notes}/{planner.total_notes} concepts mastered
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${planner.completion_percentage}%` }}
                  ></div>
                </div>
                <div className={`text-right text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {planner.completion_percentage}% complete
                </div>
              </div>

              {/* Action Buttons - Always at bottom */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={() => handleViewPlanner(planner._id)}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-2 px-3 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-md text-sm"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>View Roadmap</span>
                  </div>
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewPlanner(planner._id)}
                    className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} flex-shrink-0`}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDropPlanner(planner._id)}
                    disabled={loadingStates.dropping === planner._id}
                    className="px-3 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    title="Drop Plan"
                  >
                    {loadingStates.dropping === planner._id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`text-center py-12 bg-white/80 dark:bg-black rounded-lg shadow-md border ${isDark ? 'border-gray-700/60' : 'border-gray-200/60'}`}
        style={{borderRadius: '25px'}}>
          <div className="text-6xl mb-4">📚</div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            No Active Study Plans
          </h3>
          <p className={`mb-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Create your first concept-based study roadmap to get started!
          </p>
          <button
            onClick={() => setActiveTab("create")}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-2 px-6 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-md"
          >
            Create Study Plan
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivePlanners;