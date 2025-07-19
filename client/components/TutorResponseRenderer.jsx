'use client';

import React, { useState, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  BookOpen, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Clock,
  Trophy,
  Star,
  Zap,
  FileText
} from 'lucide-react';
import AIMessageRenderer from './AIMessageRenderer';
import SkillRadarChart from './SkillRadarChart';

const TutorResponseRenderer = ({ 
  content, 
  metadata, 
  isDark, 
  onQuickResponse 
}) => {
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [analyzingQuiz, setAnalyzingQuiz] = useState(null);
  const [expandedResources, setExpandedResources] = useState({});

  const handleQuizAnalysis = useCallback((quizId, quizSubject) => {
    setAnalyzingQuiz(quizId);
    onQuickResponse(`ANALYZE_QUIZ_ID:${quizId}`);
    // Reset after a delay to show loading state
    setTimeout(() => setAnalyzingQuiz(null), 2000);
  }, [onQuickResponse]);

  const toggleResourceExpansion = useCallback((concept) => {
    setExpandedResources(prev => ({
      ...prev,
      [concept]: !prev[concept]
    }));
  }, []);

  // If it's a quiz selection response, render it specially
  if (metadata?.tutorType === 'quiz_selection' && metadata?.availableQuizzes) {
    return (
      <div className="space-y-4">
        <AIMessageRenderer content={content} isDark={isDark} />
        
        <div className="space-y-3">
          {metadata.availableQuizzes.map((quiz, index) => {
            const scoreColor = quiz.score >= 80 ? 'text-green-500' : 
                              quiz.score >= 60 ? 'text-yellow-500' : 'text-red-500';
            const bgColor = quiz.score >= 80 ? 'bg-green-50 dark:bg-green-900/20' : 
                           quiz.score >= 60 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20';
            
            return (
              <div 
                key={quiz.id}
                className={`${bgColor} rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] ${
                  analyzingQuiz === quiz.id ? 'opacity-75 cursor-wait' : ''
                }`}
                onClick={() => handleQuizAnalysis(quiz.id, quiz.subject)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-sm font-semibold">
                      {analyzingQuiz === quiz.id ? (
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {quiz.subject}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {quiz.concept || 'General'} • {quiz.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`text-lg font-bold ${scoreColor}`}>
                      {quiz.score}%
                    </div>
                    {analyzingQuiz === quiz.id ? (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : quiz.score >= 80 ? (
                      <Trophy className="w-5 h-5 text-yellow-500" />
                    ) : quiz.score >= 60 ? (
                      <Star className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Target className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>
                {analyzingQuiz === quiz.id && (
                  <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center">
                    <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Analyzing {quiz.subject} quiz...
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
          <div className="relative flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white mr-3 shadow-lg">
              💡
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Quick tip
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Click on any quiz above to get detailed performance insights and personalized study recommendations!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If it's an analysis loading state
  if (metadata?.tutorType === 'analyzing' || content.includes('Analyzing Your Quiz Performance')) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 animate-pulse"></div>
          <div className="relative flex items-center">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Analyzing Your Performance</h3>
              <p className="text-purple-100 text-sm">
                AI is examining your answers and generating personalized insights...
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Analyzing answer patterns...</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Identifying knowledge gaps...</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Generating improvement suggestions...</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Preparing personalized resources...</span>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              ⏱️ This usually takes 10-15 seconds for comprehensive analysis
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If it's a detailed analysis, render it with enhanced visuals similar to QuizResultModal
  if (metadata?.tutorType === 'detailed_analysis' && metadata?.aiReview) {
    const { aiReview, quiz } = metadata;
    const score = quiz.score || 0;
    
    return (
      <div className="space-y-6">
        {/* Header with Score */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-semibold">AI Performance Analysis</h3>
                <p className="text-purple-100">{quiz.subject} • {new Date(quiz.attemptedAt || quiz.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className={`text-2xl font-bold px-3 py-1 rounded-full ${
              score >= 80 ? "bg-green-100 text-green-800" :
              score >= 60 ? "bg-yellow-100 text-yellow-800" :
              "bg-red-100 text-red-800"
            }`}>
              {score}%
            </div>
          </div>
        </div>

        {/* Performance Summary Card */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Performance Summary
            </h3>
            <div className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center ${
              score >= 80 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" :
              score >= 60 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200" :
              "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
            }`}>
              {score}% Score
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-white dark:bg-black rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center mb-1.5">
                <CheckCircle className="w-4 h-4 text-green-500 mr-1.5" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">STRENGTHS</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {(aiReview.strengths || "").split("\n\n")[0]}
              </p>
            </div>
            <div className="flex-1 bg-white dark:bg-black rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center mb-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500 mr-1.5" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">AREAS TO IMPROVE</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {(aiReview.improvement_suggestions || "").split("\n\n")[0]}
              </p>
            </div>
          </div>
        </div>

        {/* Skill Radar Chart */}
        <div className="bg-white dark:bg-black rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Concept Mastery Overview
          </h3>
          <div className="h-56 sm:h-64 relative">
            {aiReview && aiReview.concept_breakdown && aiReview.concept_breakdown.length >= 2 ? (
              <SkillRadarChart concepts={aiReview.concept_breakdown} />
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {!aiReview ? "Loading chart data..." : 
                   aiReview.concept_breakdown && aiReview.concept_breakdown.length === 1 ? 
                   "Need at least 2 concepts to generate a radar chart" : 
                   "No concept data available"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Concept Breakdown with Progress Bars */}
        <div className="bg-white dark:bg-black rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Concept Mastery Details
          </h3>
          <div className="space-y-4">
            {aiReview.concept_breakdown?.map((concept, index) => {
              const masteryPercentage = concept.mastery_level === "Strong" ? 85 : 
                                    concept.mastery_level === "Moderate" ? 65 : 35;
              
              const getBgColor = (level) => {
                switch(level) {
                  case "Strong": return "bg-green-500";
                  case "Moderate": return "bg-yellow-500";
                  default: return "bg-red-500";
                }
              };
              
              return (
                <div key={index} className="group relative cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-lg p-3 transition-all duration-300 hover:shadow-md"
                     onClick={() => onQuickResponse(`Tell me more about ${concept.concept}`)}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {concept.concept}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full transition-all duration-300 ${
                      concept.mastery_level === "Strong" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 group-hover:bg-green-200 dark:group-hover:bg-green-800/40" :
                      concept.mastery_level === "Moderate" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800/40" :
                      "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 group-hover:bg-red-200 dark:group-hover:bg-red-800/40"
                    }`}>
                      {concept.mastery_level}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden group-hover:h-3 transition-all duration-300">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getBgColor(concept.mastery_level)} group-hover:shadow-lg`}
                      style={{ 
                        width: `${masteryPercentage}%`,
                        background: concept.mastery_level === "Strong" ? 
                          "linear-gradient(90deg, #10b981, #059669)" :
                          concept.mastery_level === "Moderate" ? 
                          "linear-gradient(90deg, #f59e0b, #d97706)" :
                          "linear-gradient(90deg, #ef4444, #dc2626)"
                      }}
                    ></div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                    {concept.suggestion}
                  </div>
                  
                  {/* Hover indicator */}
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Analysis Section */}
        <div className="space-y-4">
          {/* Overall Feedback */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30">
            <div className="flex items-center mb-2">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
              <h3 className="text-base font-semibold text-purple-900 dark:text-purple-200">
                Overall Assessment
              </h3>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
              {aiReview.feedback}
            </p>
          </div>
          
          {/* Strengths */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800/30">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <h3 className="text-base font-semibold text-green-900 dark:text-green-200">
                Your Strengths
              </h3>
            </div>
            <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
              {aiReview.strengths}
            </div>
          </div>
          
          {/* Improvement Plan */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-center mb-2">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h3 className="text-base font-semibold text-blue-900 dark:text-blue-200">
                Improvement Plan
              </h3>
            </div>
            <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
              {aiReview.improvement_suggestions}
            </div>
          </div>
        </div>

        {/* Learning Resources */}
        {aiReview.learning_resources && Object.keys(aiReview.learning_resources).length > 0 && (
          <div className="bg-white dark:bg-black rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
              Personalized Learning Resources
              <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                {Object.keys(aiReview.learning_resources).length} concepts
              </span>
            </h3>
            <div className="space-y-3">
              {Object.entries(aiReview.learning_resources).map(([concept, data]) => (
                <div key={concept} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                  <button
                    onClick={() => toggleResourceExpansion(concept)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-left">
                        {concept}
                      </h4>
                      <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                        {data.resources?.length || 0} resources
                      </span>
                    </div>
                    <div className={`transition-transform duration-200 ${expandedResources[concept] ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {expandedResources[concept] && (
                    <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid gap-3 mt-3">
                        {data.resources?.slice(0, 4).map((resource, index) => (
                          <div key={index} className="group relative">
                            {resource.url ? (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-indigo-300 dark:hover:border-indigo-600 group relative overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative flex items-center space-x-3 flex-1">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md group-hover:shadow-lg transition-shadow">
                                    {resource.type === 'video' ? '▶️' : 
                                     resource.type === 'article' ? '📄' : 
                                     resource.type === 'interactive' ? '🎮' : 
                                     resource.type === 'course' ? '🎓' : 
                                     resource.type === 'tutorial' ? '📚' : '🔗'}
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                      {resource.title}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center space-x-2">
                                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full capitalize">
                                        {resource.type}
                                      </span>
                                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full capitalize">
                                        {resource.difficulty}
                                      </span>
                                      {resource.duration && (
                                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                          {resource.duration}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="relative flex items-center space-x-2">
                                  <div className="flex items-center space-x-1">
                                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                    <span className="text-xs text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                      Open
                                    </span>
                                  </div>
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                              </a>
                            ) : (
                              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 opacity-75">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                                    📚
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {resource.title}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center space-x-2">
                                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                                        {resource.type}
                                      </span>
                                      <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full">
                                        {resource.difficulty}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                  No link
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {data.resources?.length > 4 && (
                          <div className="text-center">
                            <button 
                              onClick={() => onQuickResponse(`Show me more resources for ${concept}`)}
                              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 font-medium transition-colors"
                            >
                              + {data.resources.length - 4} more resources
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <p className="text-xs text-indigo-700 dark:text-indigo-300 text-center">
                💡 Click on any concept above to explore personalized learning resources
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h5 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Zap className="w-4 h-4 mr-2 text-yellow-500" />
            Quick Actions
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiReview.concept_breakdown?.filter(c => c.mastery_level !== 'Strong').slice(0, 3).map((concept, index) => (
              <button
                key={index}
                onClick={() => onQuickResponse(`I need help with ${concept.concept}`)}
                className="group text-left p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-orange-300 dark:hover:border-orange-600 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold mr-3">
                      📚
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      Get help with {concept.concept}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 ml-11">
                    Personalized resources and practice
                  </div>
                </div>
              </button>
            ))}
            
            <button
              onClick={() => onQuickResponse('Show me more learning resources')}
              className="group text-left p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-blue-300 dark:hover:border-blue-600 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold mr-3">
                    🔗
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    More Resources
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 ml-11">
                  External links and study materials
                </div>
              </div>
            </button>

            <button
              onClick={() => onQuickResponse('Create a practice quiz on these topics')}
              className="group text-left p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-green-300 dark:hover:border-green-600 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold mr-3">
                    📝
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Practice Quiz
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 ml-11">
                  Test your improved knowledge
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // For other tutor responses, use the standard renderer
  return <AIMessageRenderer content={content} isDark={isDark} onQuickResponse={onQuickResponse} />;
};

export default TutorResponseRenderer;
