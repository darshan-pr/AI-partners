'use client';

import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Radio,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  MessageCircle,
  Brain,
  Zap,
  CheckCircle2,
  XCircle,
  Settings
} from 'lucide-react';
import ChatInput from '../../../components/studybuddy/ChatInput';
import useVoiceStates from '../../../lib/hooks/useVoiceStates';

const VoiceInterruptionTestPage = () => {
  const [isDark, setIsDark] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);
  const [testScenario, setTestScenario] = useState('explanation');
  const [logs, setLogs] = useState([]);
  
  // Voice animation states
  const {
    isUserSpeaking,
    isAISpeaking, 
    voiceAnimationIntensity,
    setUserSpeaking,
    setAISpeaking,
    setVoiceAnimationIntensity
  } = useVoiceStates();

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const testScenarios = {
    explanation: {
      title: 'Explanation Style Selection',
      description: 'Test the new explanation style feature',
      steps: [
        'Say: "Can you explain photosynthesis?"',
        'AI should offer style choices (formal, story, movie, etc.)',
        'Choose a style (e.g., "movie style")',
        'AI delivers explanation in chosen style'
      ]
    },
    interruption: {
      title: 'Voice Interruption Test',
      description: 'Test AI stopping when user speaks',
      steps: [
        'Ask AI to explain something complex',
        'While AI is speaking, start talking',
        'AI should immediately stop and listen',
        'Continue your thought'
      ]
    },
    conversation: {
      title: 'Natural Conversation',
      description: 'Test conversational flow',
      steps: [
        'Have a casual conversation',
        'Test interruptions mid-sentence',
        'Try follow-up questions',
        'Test style changes'
      ]
    }
  };

  const simulateVoiceStates = () => {
    setSimulationActive(true);
    addLog('🎬 Starting voice state simulation...', 'success');
    
    // Simulate user speaking
    setTimeout(() => {
      setUserSpeaking(true);
      setVoiceAnimationIntensity(0.8);
      addLog('🎤 Simulating user speaking...', 'info');
    }, 1000);
    
    // Stop user, start AI
    setTimeout(() => {
      setUserSpeaking(false);
      setVoiceAnimationIntensity(0);
      addLog('🤖 User finished, AI responding...', 'info');
    }, 3000);
    
    setTimeout(() => {
      setAISpeaking(true);
      setVoiceAnimationIntensity(0.9);
      addLog('🗣️ AI speaking with animation...', 'success');
    }, 3500);
    
    // Simulate interruption
    setTimeout(() => {
      addLog('⚠️ Simulating user interruption...', 'warning');
      setAISpeaking(false);
      setUserSpeaking(true);
      setVoiceAnimationIntensity(0.6);
    }, 7000);
    
    // End simulation
    setTimeout(() => {
      setUserSpeaking(false);
      setAISpeaking(false);
      setVoiceAnimationIntensity(0);
      setSimulationActive(false);
      addLog('✅ Simulation complete!', 'success');
    }, 10000);
  };

  const clearLogs = () => setLogs([]);

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <MessageCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${
      isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                🎙️ Enhanced Voice System Test
              </h1>
              <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Test voice interruption and explanation style features
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
                }`}
                title="Toggle theme"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Test Scenarios */}
        <div className={`rounded-xl border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        } p-6`}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Test Scenarios
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {Object.entries(testScenarios).map(([key, scenario]) => (
              <div
                key={key}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  testScenario === key
                    ? isDark 
                      ? 'border-blue-500 bg-blue-900/20' 
                      : 'border-blue-500 bg-blue-50'
                    : isDark 
                      ? 'border-gray-700 hover:border-gray-600' 
                      : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setTestScenario(key)}
              >
                <h3 className="font-semibold text-sm mb-2">{scenario.title}</h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                  {scenario.description}
                </p>
                <div className="space-y-1">
                  {scenario.steps.map((step, index) => (
                    <div key={index} className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {index + 1}. {step}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voice State Controls */}
        <div className={`rounded-xl border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        } p-6`}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-green-500" />
            Voice Animation Controls
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Manual Controls */}
            <div>
              <h3 className="font-medium mb-3">Manual Controls</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setUserSpeaking(!isUserSpeaking);
                      if (!isUserSpeaking) {
                        setAISpeaking(false);
                        setVoiceAnimationIntensity(0.7);
                      } else {
                        setVoiceAnimationIntensity(0);
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isUserSpeaking
                        ? 'bg-blue-600 text-white shadow-lg'
                        : isDark 
                          ? 'bg-gray-700 hover:bg-gray-600' 
                          : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {isUserSpeaking ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    {isUserSpeaking ? 'User Speaking' : 'Start User Speaking'}
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setAISpeaking(!isAISpeaking);
                      if (!isAISpeaking) {
                        setUserSpeaking(false);
                        setVoiceAnimationIntensity(0.9);
                      } else {
                        setVoiceAnimationIntensity(0);
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isAISpeaking
                        ? 'bg-gradient-to-r from-purple-600 to-green-600 text-white shadow-lg'
                        : isDark 
                          ? 'bg-gray-700 hover:bg-gray-600' 
                          : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {isAISpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    {isAISpeaking ? 'AI Speaking' : 'Start AI Speaking'}
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setUserSpeaking(false);
                      setAISpeaking(false);
                      setVoiceAnimationIntensity(0);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isDark 
                        ? 'bg-red-700 hover:bg-red-600 text-white' 
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    <Square className="w-4 h-4" />
                    Stop All
                  </button>
                </div>
              </div>
            </div>
            
            {/* Simulation */}
            <div>
              <h3 className="font-medium mb-3">Automated Simulation</h3>
              <button
                onClick={simulateVoiceStates}
                disabled={simulationActive}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  simulationActive
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                } ${simulationActive ? '' : 'transform hover:scale-105'}`}
              >
                {simulationActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {simulationActive ? 'Simulation Running...' : 'Run Full Simulation'}
              </button>
              
              <div className="mt-3 text-sm space-y-1">
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Simulates: User → AI → Interruption
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Watch the input border animations change
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Display */}
        <div className={`rounded-xl border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        } p-6`}>
          <h2 className="text-xl font-semibold mb-4">Current Voice States</h2>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${
              isUserSpeaking 
                ? 'bg-blue-500/20 border-2 border-blue-500' 
                : isDark 
                  ? 'bg-gray-800 border border-gray-700' 
                  : 'bg-gray-100 border border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Mic className={`w-5 h-5 ${isUserSpeaking ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="font-medium">User Speaking</span>
              </div>
              <div className={`text-sm ${isUserSpeaking ? 'text-blue-600' : 'text-gray-500'}`}>
                {isUserSpeaking ? 'Active' : 'Inactive'}
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${
              isAISpeaking 
                ? 'bg-purple-500/20 border-2 border-purple-500' 
                : isDark 
                  ? 'bg-gray-800 border border-gray-700' 
                  : 'bg-gray-100 border border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Radio className={`w-5 h-5 ${isAISpeaking ? 'text-purple-500' : 'text-gray-400'}`} />
                <span className="font-medium">AI Speaking</span>
              </div>
              <div className={`text-sm ${isAISpeaking ? 'text-purple-600' : 'text-gray-500'}`}>
                {isAISpeaking ? 'Active' : 'Inactive'}
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-green-500" />
                <span className="font-medium">Animation Intensity</span>
              </div>
              <div className="text-sm text-green-600">
                {Math.round(voiceAnimationIntensity * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Activity Logs */}
        <div className={`rounded-xl border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        } p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Activity Logs</h2>
            <button
              onClick={clearLogs}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Clear
            </button>
          </div>
          
          <div className={`max-h-40 overflow-y-auto space-y-2 ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          } rounded-lg p-3`}>
            {logs.length === 0 ? (
              <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'} text-center py-4`}>
                No activity yet. Start a test or simulation to see logs.
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  {getLogIcon(log.type)}
                  <div className="flex-1">
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      {log.message}
                    </span>
                    <span className={`ml-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {log.timestamp}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Enhanced ChatInput with Voice Animations */}
      <div className="mt-12">
        <ChatInput
          message=""
          setMessage={() => {}}
          selectedFile={null}
          setSelectedFile={() => {}}
          isLoading={false}
          multiAgentMode={true}
          setMultiAgentMode={() => {}}
          agentStatus={{}}
          isDark={isDark}
          isMobile={false}
          sidebarOpen={false}
          onSendMessage={() => {}}
          onFileSelect={() => {}}
          username="TestUser"
          // Voice animation props
          isUserSpeaking={isUserSpeaking}
          isAISpeaking={isAISpeaking}
          voiceAnimationIntensity={voiceAnimationIntensity}
        />
      </div>
    </div>
  );
};

export default VoiceInterruptionTestPage;
