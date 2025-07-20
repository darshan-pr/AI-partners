// Example React component for displaying study note resources as tags
// This should be integrated into your existing study planner UI

import React from 'react';

const ResourceTags = ({ resources = [], noteId }) => {
  const handleResourceClick = (resource) => {
    if (resource.isClickable && resource.url && resource.url !== '#') {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
      red: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200'
    };
    return colorMap[color] || colorMap.blue;
  };

  if (!resources || resources.length === 0) {
    return (
      <div className="mt-3 text-sm text-gray-500">
        No study resources available
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="text-sm font-medium text-gray-700 mb-2">Study Resources:</div>
      <div className="flex flex-wrap gap-2">
        {resources.slice(0, 3).map((resource) => (
          <button
            key={resource.id || resource.title}
            onClick={() => handleResourceClick(resource)}
            className={`
              inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
              border transition-colors duration-200 cursor-pointer
              ${getColorClasses(resource.color)}
              ${!resource.isClickable ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            disabled={!resource.isClickable}
            title={resource.description || resource.title}
          >
            <span className="mr-1">
              {resource.type === 'Tutorial' && '🎓'}
              {resource.type === 'Practice' && '💪'}
              {resource.type === 'Quiz' && '📝'}
              {resource.type === 'Video' && '🎥'}
              {resource.type === 'Book' && '📚'}
              {resource.type === 'Reference' && '📖'}
              {!['Tutorial', 'Practice', 'Quiz', 'Video', 'Book', 'Reference'].includes(resource.type) && '🔗'}
            </span>
            {resource.title}
            {resource.isClickable && (
              <svg 
                className="ml-1 h-3 w-3" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                />
              </svg>
            )}
          </button>
        ))}
      </div>
      
      {resources.length > 3 && (
        <div className="mt-2 text-xs text-gray-500">
          +{resources.length - 3} more resources available
        </div>
      )}
    </div>
  );
};

// Usage example in your study note component:
const StudyNoteCard = ({ note }) => {
  // Use the Convex query to get resources
  // const resources = useQuery(api.studyPlanner.getStudyNoteResources, { noteId: note._id });
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{note.details}</p>
          
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            <span>📅 Due: {new Date(note.due_date).toLocaleDateString()}</span>
            <span>⏱️ {note.estimated_time}</span>
            <span className={`px-2 py-1 rounded-full ${
              note.priority === 'high' ? 'bg-red-100 text-red-800' :
              note.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {note.priority} priority
            </span>
          </div>
          
          {/* Resource tags component */}
          <ResourceTags resources={note.resources} noteId={note._id} />
        </div>
        
        <button className="ml-4 p-2 text-gray-400 hover:text-gray-600">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ResourceTags;
export { StudyNoteCard };
