import { Trophy, Calendar, CheckCircle, Eye, RotateCcw, Trash2, XCircle, Archive } from 'lucide-react';
import { useState } from 'react';

const YourPlans = ({ completedPlanners, droppedPlanners, handleViewPlanner, handleReactivatePlanner, handleDeletePlanner, formatDate, isDark, loadingStates }) => {
  const [activeSubTab, setActiveSubTab] = useState('completed');

  const getCompletedPlanners = () => {
    return completedPlanners?.filter(planner => planner.status === 'completed') || [];
  };

  const getDroppedPlanners = () => {
    return droppedPlanners?.filter(planner => planner.status === 'dropped') || [];
  };

  const renderCompletedPlans = () => {
    const completed = getCompletedPlanners();
    
    if (completed.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            No Completed Plans Yet
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Complete your active plans to see them here
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {completed.map((planner, index) => (
          <div
            key={planner._id}
            className={`bg-white/40 dark:bg-black/40 backdrop-blur-sm rounded-lg p-3 md:p-4 shadow-md border hover:shadow-lg transition-all duration-300 ${isDark ? 'border-gray-700/60 hover:border-green-500/40' : 'border-gray-200/60 hover:border-green-400/40'} flex flex-col h-full`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Header Section */}
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <Trophy className="w-3 h-3 md:w-4 md:h-4" />
                </div>
                <h3 className={`text-base md:text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                  {planner.title.length > 20 ? `${planner.title.substring(0, 20)}...` : planner.title}
                </h3>
              </div>
              <div className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 flex-shrink-0">
                COMPLETED
              </div>
            </div>

            {/* Description */}
            <p className={`text-xs md:text-sm mb-3 md:mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>
              {planner.description.length > 100 ? `${planner.description.substring(0, 100)}...` : planner.description}
            </p>

            {/* Metadata Section */}
            <div className="space-y-2 mb-3 md:mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-green-500" />
                  <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {formatDate(planner.completed_at || planner.created_at)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {planner.total_notes} concepts
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                  {planner.type === 'weekly' ? '7 days' : '30 days'} plan
                </span>
              </div>
            </div>

            {/* Spacer to push content to bottom */}
            <div className="flex-1"></div>

            {/* Progress Section - Always at bottom */}
            <div className="mb-3 md:mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Progress
                </span>
                <span className="text-xs text-green-600 font-medium">100% Complete</span>
              </div>
              <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full w-full transition-all duration-500 ease-out"></div>
              </div>
            </div>
            
            {/* Action Buttons - Always at bottom */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => handleViewPlanner(planner._id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDark 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleReactivatePlanner(planner._id, planner)}
                  disabled={loadingStates.reactivating === planner._id}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {loadingStates.reactivating === planner._id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDeletePlanner(planner._id)}
                  disabled={loadingStates.deleting === planner._id}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {loadingStates.deleting === planner._id ? (
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
    );
  };

  const renderDroppedPlans = () => {
    const dropped = getDroppedPlanners();
    
    if (dropped.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center">
            <Archive className="w-12 h-12 text-white" />
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            No Dropped Plans
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Plans you drop will appear here
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dropped.map((planner, index) => (
          <div
            key={planner._id}
            className={`bg-white/40 dark:bg-black/40 backdrop-blur-sm rounded-lg p-3 md:p-4 shadow-md border hover:shadow-lg transition-all duration-300 ${isDark ? 'border-gray-700/60 hover:border-red-500/40' : 'border-gray-200/60 hover:border-red-400/40'} flex flex-col h-full`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Header Section */}
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <XCircle className="w-3 h-3 md:w-4 md:h-4" />
                </div>
                <h3 className={`text-base md:text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                  {planner.title.length > 20 ? `${planner.title.substring(0, 20)}...` : planner.title}
                </h3>
              </div>
              <div className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 flex-shrink-0">
                DROPPED
              </div>
            </div>

            {/* Description */}
            <p className={`text-xs md:text-sm mb-3 md:mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>
              {planner.description.length > 100 ? `${planner.description.substring(0, 100)}...` : planner.description}
            </p>

            {/* Metadata Section */}
            <div className="space-y-2 mb-3 md:mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-red-500" />
                  <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {formatDate(planner.dropped_at || planner.created_at)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3 text-orange-500" />
                  <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {planner.completed_notes || 0}/{planner.total_notes}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                  {planner.type === 'weekly' ? '7 days' : '30 days'} plan
                </span>
              </div>
            </div>

            {/* Spacer to push content to bottom */}
            <div className="flex-1"></div>

            {/* Progress Section - Always at bottom */}
            <div className="mb-3 md:mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Progress when dropped
                </span>
                <span className="text-xs text-orange-600 font-medium">{planner.completion_percentage || 0}%</span>
              </div>
              <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${planner.completion_percentage || 0}%` }}
                ></div>
              </div>
            </div>
            
            {/* Action Buttons - Always at bottom */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => handleViewPlanner(planner._id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isDark 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleReactivatePlanner(planner._id, planner)}
                  disabled={loadingStates.reactivating === planner._id}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {loadingStates.reactivating === planner._id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDeletePlanner(planner._id)}
                  disabled={loadingStates.deleting === planner._id}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {loadingStates.deleting === planner._id ? (
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
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs for Completed and Dropped */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-2xl p-2 border border-white/10 dark:border-gray-700/50">
        <button
          onClick={() => setActiveSubTab('completed')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
            activeSubTab === 'completed'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg transform scale-105'
              : `${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'}`
          }`}
        >
          <Trophy className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-xs md:text-sm">Completed Plans</span>
          {getCompletedPlanners().length > 0 && (
            <div className="bg-white/20 rounded-full px-2 py-1 text-xs font-bold">
              {getCompletedPlanners().length}
            </div>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('dropped')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
            activeSubTab === 'dropped'
              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg transform scale-105'
              : `${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'}`
          }`}
        >
          <Archive className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-xs md:text-sm">Dropped Plans</span>
          {getDroppedPlanners().length > 0 && (
            <div className="bg-white/20 rounded-full px-2 py-1 text-xs font-bold">
              {getDroppedPlanners().length}
            </div>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeSubTab === 'completed' ? renderCompletedPlans() : renderDroppedPlans()}
      </div>
    </div>
  );
};

export default YourPlans;
