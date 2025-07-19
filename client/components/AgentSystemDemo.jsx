import React, { useState } from 'react';
import { 
  Brain, 
  Users, 
  MessageSquare, 
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const AgentSystemDemo = () => {
  const [testCases, setTestCases] = useState([
    {
      id: 1,
      input: "Create a quiz on photosynthesis with 5 questions",
      expectedAgent: "QUIZ",
      expectedAction: "Generate quiz",
      status: "pending"
    },
    {
      id: 2,
      input: "Explain quantum physics to me in simple terms",
      expectedAgent: "GENERAL",
      expectedAction: "Provide explanation",
      status: "pending"
    },
    {
      id: 3,
      input: "I need help with calculus problems",
      expectedAgent: "GENERAL", 
      expectedAction: "Study assistance",
      status: "pending"
    },
    {
      id: 4,
      input: "Quiz me on World War 2",
      expectedAgent: "QUIZ",
      expectedAction: "Ask for more details",
      status: "pending"
    },
    {
      id: 5,
      input: "10 hard questions about machine learning",
      expectedAgent: "QUIZ",
      expectedAction: "Generate quiz",
      status: "pending"
    },
    {
      id: 6,
      input: "How did I perform on my recent quizzes?",
      expectedAgent: "TUTOR",
      expectedAction: "Show recent quiz performance",
      status: "pending"
    },
    {
      id: 7,
      input: "I need suggestions to improve my performance",
      expectedAgent: "TUTOR",
      expectedAction: "Provide improvement suggestions",
      status: "pending"
    },
    {
      id: 8,
      input: "Review my quiz results and analyze my weak areas",
      expectedAgent: "TUTOR", 
      expectedAction: "Analyze performance",
      status: "pending"
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);

  const runTest = async (testCase) => {
    setTestCases(prev => prev.map(tc => 
      tc.id === testCase.id ? { ...tc, status: 'running' } : tc
    ));

    try {
      const response = await fetch('/api/test-agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testCase.input,
          mode: 'multi-agent'
        })
      });

      const result = await response.json();
      
      const success = (
        (testCase.expectedAgent === "QUIZ" && result.agentType === "quiz") ||
        (testCase.expectedAgent === "GENERAL" && result.agentType === "general") ||
        (testCase.expectedAgent === "TUTOR" && result.agentType === "tutor")
      );

      setTestCases(prev => prev.map(tc => 
        tc.id === testCase.id ? { 
          ...tc, 
          status: success ? 'success' : 'failed',
          actualAgent: result.agentType,
          response: result.message,
          routing: result.routing
        } : tc
      ));

    } catch (error) {
      setTestCases(prev => prev.map(tc => 
        tc.id === testCase.id ? { 
          ...tc, 
          status: 'failed',
          error: error.message
        } : tc
      ));
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    for (const testCase of testCases) {
      await runTest(testCase);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setIsRunning(false);
  };

  const resetTests = () => {
    setTestCases(prev => prev.map(tc => ({ 
      ...tc, 
      status: 'pending',
      actualAgent: undefined,
      response: undefined,
      routing: undefined,
      error: undefined
    })));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAgentIcon = (agentType) => {
    switch (agentType) {
      case 'QUIZ':
      case 'quiz':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'GENERAL':
      case 'general':
        return <Brain className="w-4 h-4 text-green-500" />;
      case 'TUTOR':
      case 'tutor':
        return <Users className="w-4 h-4 text-orange-500" />;
      case 'orchestrator':
        return <Zap className="w-4 h-4 text-purple-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Multi-Agent AI System Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Test the routing and communication between different AI agents in the StudyBuddy system.
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Run All Tests
            </>
          )}
        </button>
        
        <button
          onClick={resetTests}
          disabled={isRunning}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
      </div>

      <div className="space-y-4">
        {testCases.map((testCase) => (
          <div 
            key={testCase.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(testCase.status)}
                  <span className="font-medium text-gray-900 dark:text-white">
                    Test {testCase.id}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    testCase.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    testCase.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    testCase.status === 'running' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {testCase.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <strong>Input:</strong> "{testCase.input}"
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    {getAgentIcon(testCase.expectedAgent)}
                    <span>Expected: {testCase.expectedAgent} Agent</span>
                  </div>
                  
                  {testCase.actualAgent && (
                    <div className="flex items-center gap-1">
                      {getAgentIcon(testCase.actualAgent)}
                      <span>Actual: {testCase.actualAgent} Agent</span>
                    </div>
                  )}
                  
                  {testCase.routing && (
                    <div className="text-xs">
                      Confidence: {Math.round(testCase.routing.confidence * 100)}%
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => runTest(testCase)}
                disabled={isRunning || testCase.status === 'running'}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
              >
                {testCase.status === 'running' ? 'Running...' : 'Test'}
              </button>
            </div>
            
            {testCase.routing && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded text-xs">
                <strong>Routing Decision:</strong> {testCase.routing.reasoning}
              </div>
            )}
            
            {testCase.response && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                <strong>Response:</strong>
                <div className="mt-1 text-gray-700 dark:text-gray-300">
                  {testCase.response.substring(0, 200)}
                  {testCase.response.length > 200 && '...'}
                </div>
              </div>
            )}
            
            {testCase.error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                <strong>Error:</strong>
                <div className="mt-1 text-red-700 dark:text-red-400">
                  {testCase.error}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          Expected Behavior:
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• Quiz-related requests should route to the Quiz Agent</li>
          <li>• General study questions should route to the General Study Agent</li>
          <li>• Performance analysis and review requests should route to the Tutor Agent</li>
          <li>• The Orchestrator should provide reasoning for routing decisions</li>
          <li>• Confidence levels should be reasonable (above 70% for clear requests)</li>
          <li>• Agents should ask for more information when needed</li>
        </ul>
      </div>
    </div>
  );
};

export default AgentSystemDemo;
