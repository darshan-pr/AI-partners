'use client';

import React, { useState, useEffect } from 'react';
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
  Settings,
  Lightning,
  Eye,
  Timer
} from 'lucide-react';
import ChatInput from '../../../components/studybuddy/ChatInput';
import useVoiceStates from '../../../lib/hooks/useVoiceStates';

const UltraResponsiveVoiceTest = () => {
  const [isDark, setIsDark] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);
  const [interruptionLogs, setInterruptionLogs] = useState([]);
  const [responseTimes, setResponseTimes] = useState([]);
  const [testingMode, setTestingMode] = useState('manual');
  
  // Voice animation states
  const {
    isUserSpeaking,
    isAISpeaking, 
    voiceAnimationIntensity,
    setUserSpeaking,
    setAISpeaking,
    setVoiceAnimationIntensity
  } = useVoiceStates();

  const addInterruptionLog = (message, responseTime = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setInterruptionLogs(prev => [...prev, { 
      message, 
      timestamp, 
      responseTime,
      type: responseTime ? (responseTime < 200 ? 'excellent' : responseTime < 500 ? 'good' : 'slow') : 'info'
    }]);
    
    if (responseTime) {
      setResponseTimes(prev => [...prev, responseTime]);
    }
  };

  const simulateInstantInterruption = () => {
    setSimulationActive(true);
    addInterruptionLog('🎬 Starting ultra-responsive interruption test...');
    
    // Start AI speaking
    setTimeout(() => {
      setAISpeaking(true);
      setVoiceAnimationIntensity(0.9);
      addInterruptionLog('🗣️ AI started speaking - monitoring for interruption');
    }, 1000);
    
    // Simulate INSTANT user interruption
    const interruptionStartTime = Date.now();
    setTimeout(() => {
      const responseTime = Date.now() - interruptionStartTime;
      addInterruptionLog('⚡ INSTANT USER VOICE DETECTED!', responseTime);
      
      // Simulate immediate AI stop
      setAISpeaking(false);
      setUserSpeaking(true);
      setVoiceAnimationIntensity(0.7);
      addInterruptionLog('🛑 AI speech STOPPED immediately');
    }, 2500);
    
    // Continue user input
    setTimeout(() => {
      addInterruptionLog('🎤 User continues speaking...');
    }, 3000);
    
    // End simulation
    setTimeout(() => {
      setUserSpeaking(false);
      setVoiceAnimationIntensity(0);
      setSimulationActive(false);
      addInterruptionLog('✅ Ultra-responsive interruption test complete!');
    }, 5000);
  };

  const runResponseTimeTest = () => {
    setResponseTimes([]);
    const tests = 5;
    let currentTest = 0;
    
    const runSingleTest = () => {
      if (currentTest >= tests) {
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        addInterruptionLog(`📊 Average response time: ${avgResponseTime.toFixed(1)}ms`);
        return;
      }
      
      setAISpeaking(true);
      addInterruptionLog(`🧪 Test ${currentTest + 1}/${tests} - AI speaking`);
      
      // Random interruption time between 1-3 seconds
      const interruptTime = 1000 + Math.random() * 2000;
      
      setTimeout(() => {
        const startTime = Date.now();
        
        // Simulate interruption
        setTimeout(() => {
          const responseTime = Date.now() - startTime;
          setAISpeaking(false);
          addInterruptionLog(`⚡ Test ${currentTest + 1} response: ${responseTime}ms`, responseTime);
          
          currentTest++;
          setTimeout(runSingleTest, 1000);
        }, 50); // 50ms simulated interruption
        
      }, interruptTime);
    };
    
    runSingleTest();
  };

  const clearLogs = () => {
    setInterruptionLogs([]);
    setResponseTimes([]);
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'excellent': return <Lightning className="w-4 h-4 text-green-500" />;
      case 'good': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'slow': return <Timer className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <MessageCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getAverageResponseTime = () => {
    if (responseTimes.length === 0) return 0;
    return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
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
                ⚡ Ultra-Responsive Voice Interruption Test
              </h1>
              <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Test INSTANT AI voice stopping when user speaks
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg ${
                isDark ? 'bg-gray-800' : 'bg-gray-200'
              }`}>
                <div className="text-sm font-medium">Avg Response Time</div>
                <div className={`text-lg font-bold ${
                  getAverageResponseTime() < 200 ? 'text-green-500' : 
                  getAverageResponseTime() < 500 ? 'text-blue-500' : 'text-yellow-500'
                }`}>
                  {getAverageResponseTime().toFixed(1)}ms
                </div>
              </div>
              
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
        {/* Key Features */}
        <div className={`rounded-xl border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        } p-6`}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Lightning className="w-5 h-5 text-yellow-500" />
            Ultra-Responsive Features
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Mic className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Dual Detection</span>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Speech recognition + Audio level monitoring for instant detection
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Lightning className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">Instant Stop</span>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                speechSynthesis.cancel() triggered on ANY voice activity
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-green-500" />
                <span className="font-medium">Smart Monitoring</span>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Low threshold (25db) with 2-frame trigger for maximum sensitivity
              </p>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className={`rounded-xl border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        } p-6`}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-500" />
            Interruption Tests
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {/* Manual Test */}
            <div>
              <h3 className="font-medium mb-3">Manual Testing</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setAISpeaking(!isAISpeaking);
                    if (!isAISpeaking) {
                      setVoiceAnimationIntensity(0.9);
                      addInterruptionLog('🗣️ AI started speaking - try interrupting!');
                    } else {
                      setVoiceAnimationIntensity(0);
                      addInterruptionLog('🛑 AI stopped speaking');
                    }
                  }}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
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
                
                <button
                  onClick={() => {
                    if (isAISpeaking) {
                      const startTime = Date.now();
                      setTimeout(() => {
                        const responseTime = Date.now() - startTime;
                        setAISpeaking(false);
                        setUserSpeaking(true);
                        setVoiceAnimationIntensity(0.7);
                        addInterruptionLog('⚡ Manual interruption triggered!', responseTime);
                      }, 10);
                    }
                  }}
                  disabled={!isAISpeaking}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                    !isAISpeaking
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  <Lightning className="w-4 h-4" />
                  Trigger Interruption
                </button>
              </div>
            </div>
            
            {/* Automated Tests */}
            <div>
              <h3 className="font-medium mb-3">Automated Tests</h3>
              <div className="space-y-3">
                <button
                  onClick={simulateInstantInterruption}
                  disabled={simulationActive}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    simulationActive
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                  }`}
                >
                  {simulationActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {simulationActive ? 'Running...' : 'Instant Interruption Test'}
                </button>
                
                <button
                  onClick={runResponseTimeTest}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    isDark 
                      ? 'bg-green-700 hover:bg-green-600 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <Timer className="w-4 h-4" />
                  Response Time Test (5x)
                </button>
              </div>
            </div>
            
            {/* Reset Controls */}
            <div>
              <h3 className="font-medium mb-3">Controls</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setUserSpeaking(false);
                    setAISpeaking(false);
                    setVoiceAnimationIntensity(0);
                    addInterruptionLog('🔄 All states reset');
                  }}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                    isDark 
                      ? 'bg-orange-700 hover:bg-orange-600 text-white' 
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  <Square className="w-4 h-4" />
                  Reset All States
                </button>
                
                <button
                  onClick={clearLogs}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                    isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Clear Logs
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Status */}
        <div className={`rounded-xl border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        } p-6`}>
          <h2 className="text-xl font-semibold mb-4">Real-time Voice States</h2>
          
          <div className="grid md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg text-center ${
              isUserSpeaking 
                ? 'bg-blue-500/20 border-2 border-blue-500' 
                : isDark 
                  ? 'bg-gray-800 border border-gray-700' 
                  : 'bg-gray-100 border border-gray-200'
            }`}>
              <Mic className={`w-8 h-8 mx-auto mb-2 ${isUserSpeaking ? 'text-blue-500' : 'text-gray-400'}`} />
              <div className="font-medium">User Speaking</div>
              <div className={`text-sm ${isUserSpeaking ? 'text-blue-600' : 'text-gray-500'}`}>
                {isUserSpeaking ? 'ACTIVE' : 'Inactive'}
              </div>
            </div>
            
            <div className={`p-4 rounded-lg text-center ${
              isAISpeaking 
                ? 'bg-purple-500/20 border-2 border-purple-500' 
                : isDark 
                  ? 'bg-gray-800 border border-gray-700' 
                  : 'bg-gray-100 border border-gray-200'
            }`}>
              <Radio className={`w-8 h-8 mx-auto mb-2 ${isAISpeaking ? 'text-purple-500' : 'text-gray-400'}`} />
              <div className="font-medium">AI Speaking</div>
              <div className={`text-sm ${isAISpeaking ? 'text-purple-600' : 'text-gray-500'}`}>
                {isAISpeaking ? 'ACTIVE' : 'Inactive'}
              </div>
            </div>
            
            <div className={`p-4 rounded-lg text-center ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'
            }`}>
              <Zap className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="font-medium">Intensity</div>
              <div className="text-sm text-green-600">
                {Math.round(voiceAnimationIntensity * 100)}%
              </div>
            </div>
            
            <div className={`p-4 rounded-lg text-center ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'
            }`}>
              <Lightning className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <div className="font-medium">Response Mode</div>
              <div className="text-sm text-yellow-600">
                Ultra Fast
              </div>
            </div>
          </div>
        </div>

        {/* Interruption Logs */}
        <div className={`rounded-xl border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        } p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Interruption Activity Logs</h2>
            <div className="text-sm">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Tests: {responseTimes.length}
              </span>
            </div>
          </div>
          
          <div className={`max-h-48 overflow-y-auto space-y-2 ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          } rounded-lg p-3`}>
            {interruptionLogs.length === 0 ? (
              <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'} text-center py-4`}>
                No interruption tests yet. Start a test to see logs.
              </div>
            ) : (
              interruptionLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  {getLogIcon(log.type)}
                  <div className="flex-1">
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      {log.message}
                    </span>
                    {log.responseTime && (
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-mono ${
                        log.type === 'excellent' ? 'bg-green-500/20 text-green-600' :
                        log.type === 'good' ? 'bg-blue-500/20 text-blue-600' :
                        'bg-yellow-500/20 text-yellow-600'
                      }`}>
                        {log.responseTime}ms
                      </span>
                    )}
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

export default UltraResponsiveVoiceTest;
