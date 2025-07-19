import React from 'react';
import { 
  Brain, 
  Users, 
  MessageSquare, 
  Zap,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const AgentStatusHeader = ({ agentStatus, isDark }) => {
  if (!agentStatus || !agentStatus.currentAgent) return null;

  const getAgentIcon = (agentType) => {
    switch(agentType) {
      case 'orchestrator':
        return <Zap className="w-3 h-3 text-purple-400" />;
      case 'quiz':
        return <MessageSquare className="w-3 h-3 text-blue-400" />;
      case 'general':
        return <Brain className="w-3 h-3 text-green-400" />;
      default:
        return <Users className="w-3 h-3 text-gray-400" />;
    }
  };

  const getAgentName = (agentType) => {
    switch(agentType) {
      case 'orchestrator':
        return 'Orchestrator';
      case 'quiz':
        return 'Quiz Agent';
      case 'general':
        return 'Study Assistant';
      default:
        return 'AI Agent';
    }
  };

  const getStateIcon = (state) => {
    switch(state) {
      case 'processing':
        return <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />;
      case 'analyzing':
        return <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />;
      case 'routing':
        return <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />;
      case 'generating':
        return <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />;
      case 'thinking':
        return <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'waiting_for_input':
        return <AlertCircle className="w-3 h-3 text-orange-400" />;
      case 'listening':
        return <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const currentAgent = agentStatus.currentAgent;
  const currentState = agentStatus.agentStates?.[currentAgent] || 'idle';

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
      isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/50 border border-gray-200/50'
    } backdrop-blur-sm shadow-sm`}>
      <div className="flex items-center gap-1.5">
        {getAgentIcon(currentAgent)}
        <span className={`text-xs font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          {getAgentName(currentAgent)}
        </span>
      </div>
      
      <div className="w-px h-3 bg-gray-300 dark:bg-gray-600"></div>
      
      <div className="flex items-center gap-1">
        {getStateIcon(currentState)}
        <span className={`text-xs capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {currentState?.replace('_', ' ') || 'idle'}
        </span>
      </div>
    </div>
  );
};

export default AgentStatusHeader;
