import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Zap, 
  Users, 
  MessageSquare, 
  ChevronRight,
  Info,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings
} from 'lucide-react';

const AGENT_TYPES = {
  ORCHESTRATOR: 'orchestrator',
  QUIZ: 'quiz',
  GENERAL: 'general',
  TUTOR: 'tutor'
};

const AGENT_STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  WAITING_FOR_INPUT: 'waiting_for_input',
  COMPLETED: 'completed'
};

const AgentStatusIndicator = ({ agentType, state, isActive, onClick }) => {
  const getAgentInfo = (type) => {
    switch(type) {
      case AGENT_TYPES.ORCHESTRATOR:
        return { 
          name: 'Orchestrator', 
          icon: Brain, 
          color: 'purple',
          description: 'Routes requests to specialized agents'
        };
      case AGENT_TYPES.QUIZ:
        return { 
          name: 'Quiz Agent', 
          icon: MessageSquare, 
          color: 'blue',
          description: 'Creates and manages quizzes'
        };
      case AGENT_TYPES.GENERAL:
        return { 
          name: 'Study Assistant', 
          icon: Users, 
          color: 'green',
          description: 'Provides general study help'
        };
      case AGENT_TYPES.TUTOR:
        return { 
          name: 'Performance Tutor', 
          icon: Users, 
          color: 'orange',
          description: 'Analyzes quiz performance and provides improvement suggestions'
        };
      default:
        return { 
          name: 'Unknown', 
          icon: Settings, 
          color: 'gray',
          description: 'Unknown agent type'
        };
    }
  };

  const getStateIcon = (state) => {
    switch(state) {
      case AGENT_STATES.IDLE:
        return Clock;
      case AGENT_STATES.LISTENING:
        return Info;
      case AGENT_STATES.PROCESSING:
        return Zap;
      case AGENT_STATES.WAITING_FOR_INPUT:
        return AlertCircle;
      case AGENT_STATES.COMPLETED:
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const getStateColor = (state) => {
    switch(state) {
      case AGENT_STATES.IDLE:
        return 'text-gray-400';
      case AGENT_STATES.LISTENING:
        return 'text-blue-500';
      case AGENT_STATES.PROCESSING:
        return 'text-yellow-500';
      case AGENT_STATES.WAITING_FOR_INPUT:
        return 'text-orange-500';
      case AGENT_STATES.COMPLETED:
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  const agentInfo = getAgentInfo(agentType);
  const StateIcon = getStateIcon(state);
  const AgentIcon = agentInfo.icon;
  
  return (
    <div 
      className={`flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer ${
        isActive 
          ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      onClick={onClick}
      title={agentInfo.description}
    >
      <div className={`relative p-1.5 rounded-full ${
        agentInfo.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
        agentInfo.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
        agentInfo.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
        'bg-gray-100 dark:bg-gray-800'
      }`}>
        <AgentIcon className={`w-4 h-4 ${
          agentInfo.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
          agentInfo.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
          agentInfo.color === 'green' ? 'text-green-600 dark:text-green-400' :
          'text-gray-600 dark:text-gray-400'
        }`} />
        
        {/* State indicator dot */}
        <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white dark:border-gray-900 ${
          state === AGENT_STATES.PROCESSING ? 'animate-pulse' : ''
        } ${
          state === AGENT_STATES.IDLE ? 'bg-gray-400' :
          state === AGENT_STATES.LISTENING ? 'bg-blue-500' :
          state === AGENT_STATES.PROCESSING ? 'bg-yellow-500' :
          state === AGENT_STATES.WAITING_FOR_INPUT ? 'bg-orange-500' :
          state === AGENT_STATES.COMPLETED ? 'bg-green-500' :
          'bg-gray-400'
        }`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
          {agentInfo.name}
        </div>
        <div className={`text-xs capitalize ${getStateColor(state)}`}>
          {state.replace('_', ' ')}
        </div>
      </div>
      
      {isActive && (
        <ChevronRight className="w-3 h-3 text-blue-500" />
      )}
    </div>
  );
};

const MultiAgentToggle = ({ 
  enabled, 
  onChange, 
  agentStatus = null, 
  isDark = false,
  className = ""
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`multi-agent-control ${className}`}>
      {/* Main Toggle */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
              enabled 
                ? 'bg-blue-600' 
                : isDark ? 'bg-gray-700' : 'bg-gray-300'
            }`}
            title={enabled ? 'Disable Multi-Agent Mode' : 'Enable Multi-Agent Mode'}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
          
          <div className="flex items-center gap-1.5">
            <Users className={`w-4 h-4 ${enabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`} />
            <span className={`text-sm font-medium ${
              enabled 
                ? 'text-blue-900 dark:text-blue-200' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              Multi-Agent
            </span>
            
            {enabled && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Show agent details"
              >
                <Info className="w-3 h-3 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Agent Status Display */}
      {enabled && agentStatus && (
        <div className={`transition-all duration-300 ${showDetails ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'}`}>
          <div className={`p-3 rounded-lg border ${
            isDark 
              ? 'bg-gray-900/50 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Agent System Status
              </span>
            </div>
            
            <div className="space-y-2">
              {Object.entries(agentStatus.agentStates || {}).map(([agentType, state]) => (
                <AgentStatusIndicator
                  key={agentType}
                  agentType={agentType}
                  state={state}
                  isActive={agentStatus.currentAgent === agentType}
                />
              ))}
            </div>
            
            {agentStatus.conversationLog && agentStatus.conversationLog.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recent Activity
                </div>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {agentStatus.conversationLog.slice(-3).map((log, index) => (
                    <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{log.type}:</span> {log.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {enabled && (
        <div className="mt-2">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            🤖 Multi-agent mode uses specialized AI agents for better responses
          </p>
        </div>
      )}
    </div>
  );
};

export default MultiAgentToggle;
