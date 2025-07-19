"use client";
import { useState } from 'react';

export default function ResourceRecommendations({ concepts, subject, learningResources }) {
  const [expandedConcept, setExpandedConcept] = useState(null);
  
  // Skip if no concepts
  if (!concepts || concepts.length === 0) {
    return null;
  }
  
  // Filter to show only concepts needing improvement
  const conceptsToImprove = concepts.filter(c => c.mastery_level !== "Strong");
  
  if (conceptsToImprove.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800/30">
        <div className="flex items-center mb-2">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 className="text-base font-semibold text-green-900 dark:text-green-200">
            Excellent Work!
          </h3>
        </div>
        <p className="text-sm text-gray-800 dark:text-gray-200">
          You've demonstrated strong understanding across all concepts. To continue growing, consider exploring more advanced topics in {subject}.
        </p>
      </div>
    );
  }
  
  // Check if we have AI-generated resources
  const hasAiResources = learningResources && Object.keys(learningResources).length > 0;
  
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800/30">
      <div className="flex items-center mb-3">
        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
        <h3 className="text-base font-semibold text-amber-900 dark:text-amber-200">
          Personalized Learning Resources
        </h3>
      </div>
      
      <div className="space-y-4">
        {conceptsToImprove.map((concept, index) => {
          // Get AI-generated resources for this concept if available
          const conceptResources = hasAiResources && learningResources[concept.concept] 
            ? learningResources[concept.concept].resources 
            : null;
            
          const isExpanded = expandedConcept === concept.concept;
          
          return (
            <div 
              key={index} 
              className={`bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 ${
                isExpanded ? 'ring-2 ring-amber-300 dark:ring-amber-600' : ''
              }`}
            >
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedConcept(isExpanded ? null : concept.concept)}
              >
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {concept.concept}
                </h4>
                <div className="flex items-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full mr-2 ${
                    concept.mastery_level === "Moderate" 
                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                  }`}>
                    {concept.mastery_level}
                  </span>
                  <svg 
                    className={`w-4 h-4 text-gray-600 dark:text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mb-2">
                {concept.suggestion}
              </p>
              
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <h5 className="text-xs font-medium text-gray-800 dark:text-gray-200 mb-2">
                    Recommended Learning Resources:
                  </h5>
                  
                  <div className="space-y-3">
                    {conceptResources ? (
                      // Show AI-generated resources
                      conceptResources.map((resource, idx) => (
                        <div 
                          key={idx}
                          className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex justify-between items-start">
                            <h6 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {resource.title}
                            </h6>
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded">
                              {resource.type}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-600 dark:text-gray-400 mb-1.5">
                            {resource.description}
                          </p>
                          <div className="flex items-center">
                            <span className="text-[10px] text-gray-500 dark:text-gray-500">
                              Difficulty: {resource.difficulty}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Fallback: Show general resources if AI resources not available
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <p className="italic">Search for resources on platforms like:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>Online learning platforms (Coursera, Udemy, edX)</li>
                          <li>Documentation websites specific to the subject</li>
                          <li>YouTube tutorials and educational channels</li>
                          <li>Interactive coding platforms (if applicable)</li>
                          <li>Books and e-books on the topic</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        <div className="mt-4 text-xs text-gray-600 dark:text-gray-400">
          <p className="mb-2 font-medium">General Learning Platforms:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><a href="https://www.khanacademy.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">Khan Academy</a> - Free courses on various subjects</li>
            <li><a href="https://www.coursera.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">Coursera</a> - University-level courses</li>
            <li><a href="https://www.udemy.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">Udemy</a> - Practical skill-based courses</li>
            <li><a href="https://www.youtube.com/learning" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">YouTube Learning</a> - Free video tutorials</li>
            <li><a href="https://developer.mozilla.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">MDN Web Docs</a> - Web development documentation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}