"use client";

import React, { useEffect, useState } from "react";

// ElevenLabs
import { useConversation } from "@11labs/react";

// Types
import { ConversationState, ConversationMessage, AudioPermissions, SessionState, AudioConfiguration, AudioSettings } from "@/types";

// Audio Permission Management
import { AudioPermissionManager } from "@/lib/audio-permissions";
import PermissionModal from "@/components/PermissionModal";

// Session Management
import { SessionManager } from "@/lib/session-manager";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX, AlertCircle, CheckCircle, Clock } from "lucide-react";

const VoiceComponent = () => {
  const [conversationState, setConversationState] = useState<ConversationState>({
    isActive: false,
    isListening: false,
    isSpeaking: false,
    isConnected: false,
    hasPermissions: false,
    error: null,
    sessionId: null,
    lastMessage: null,
    messageHistory: []
  });
  const [isMuted, setIsMuted] = useState(false);
  const [audioPermissions, setAudioPermissions] = useState<AudioPermissions>({
    microphone: 'unknown',
    speaker: 'granted'
  });
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionManager] = useState(() => new AudioPermissionManager());
  
  // Enhanced Audio Configuration for feedback prevention
  const [audioConfig] = useState<AudioConfiguration>({
    sampleRate: 44100,
    channels: 1,
    bitDepth: 16,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    latencyHint: 'interactive',
    bufferSize: 512 // Small buffer for low latency
  });
  
  // Audio feedback prevention state
  const [audioLevels, setAudioLevels] = useState({
    inputLevel: 0,
    outputLevel: 0,
    threshold: 0.8,
    isMuted: false
  });
  
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    inputVolume: 1.0,
    outputVolume: 1.0,
    microphoneEnabled: true,
    speakerEnabled: true,
    audioQuality: 'high'
  });
  const [sessionState, setSessionState] = useState<SessionState>({
    id: null,
    status: 'disconnected',
    startTime: null,
    endTime: null,
    duration: 0,
    connectionQuality: 'unknown',
    reconnectCount: 0,
    lastHeartbeat: null,
    metadata: {}
  });
  const [sessionManager] = useState(() => new SessionManager({
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'default-agent-id',
    maxDuration: 30 * 60 * 1000, // 30 minutes
    reconnectAttempts: 3,
    reconnectDelay: 2000,
    heartbeatInterval: 10000,
    timeoutDuration: 30000,
    enableLogging: process.env.NODE_ENV === 'development'
  }));

  const conversation = useConversation({
    onConnect: async (props: { conversationId: string }) => {
      console.log("Connected to ElevenLabs with session:", props.conversationId);
      
      // Initialize session manager
      await sessionManager.initializeSession(props.conversationId);
      await sessionManager.connectSession();
      
      // Configure real-time microphone capture with optimal settings
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              sampleRate: audioConfig.sampleRate,
              channelCount: audioConfig.channels,
              echoCancellation: audioConfig.echoCancellation,
              noiseSuppression: audioConfig.noiseSuppression,
              autoGainControl: audioConfig.autoGainControl
              // Enhanced echo cancellation is handled by echoCancellation: true
              // Note: latency is controlled by bufferSize in AudioConfiguration
            }
          });
          
          console.log('Microphone configured with optimal settings:', {
            sampleRate: audioConfig.sampleRate,
            channels: audioConfig.channels,
            latencyHint: audioConfig.latencyHint
          });
          
          // Store stream reference for cleanup
          sessionManager.setAudioStream(stream);
          
          // Set up audio level monitoring for feedback prevention
          setupAudioLevelMonitoring(stream);
        }
      } catch (audioError) {
        console.warn('Failed to configure optimal audio settings, using defaults:', audioError);
      }
      
      setConversationState(prev => ({ 
        ...prev, 
        isConnected: true, 
        isActive: true, 
        error: null,
        sessionId: props.conversationId 
      }));
    },
    onDisconnect: async () => {
      console.log("Disconnected from ElevenLabs");
      
      // Disconnect session manager
      await sessionManager.disconnectSession();
      
      setConversationState(prev => ({ 
        ...prev, 
        isConnected: false, 
        isActive: false,
        isListening: false,
        isSpeaking: false,
        sessionId: null
      }));
    },
    onMessage: (message: unknown) => {
      console.log("Received message:", message);
      
      // Measure and track latency for voice input streaming
      const messageTimestamp = new Date();
      const messageData = message as Record<string, unknown>;
      const latency = (messageData.latency as number) || (messageTimestamp.getTime() - ((messageData.timestamp as number) || messageTimestamp.getTime()));
      
      // Update session metrics and validate latency requirement
      if (latency) {
        sessionManager.updateLatency(latency);
        console.log(`Voice streaming latency: ${latency}ms`);
        
        // Validate latency against <500ms requirement
        const isLatencyValid = validateLatencyRequirement(latency);
        
        if (!isLatencyValid) {
          // Set warning state for high latency
          setConversationState(prev => ({
            ...prev,
            error: prev.error ? prev.error : `High latency: ${latency}ms (target: <500ms)`
          }));
        }
      }
      
      if (messageData.bytes) {
        sessionManager.updateBytesTransferred(messageData.bytes as number);
      }
      
      // Handle voice input streaming messages
      if (messageData.type === 'user_transcript' || messageData.type === 'user_speech') {
        const userMessage: ConversationMessage = {
          id: crypto.randomUUID(),
          content: (messageData.text as string) || (messageData.transcript as string),
          role: 'user',
          timestamp: messageTimestamp,
          latency: latency
        };
        
        setConversationState(prev => ({
          ...prev,
          lastMessage: (messageData.text as string) || (messageData.transcript as string),
          messageHistory: [...prev.messageHistory, userMessage]
        }));
        
        // Log voice input streaming success
        console.log('Voice input streamed successfully:', {
          text: userMessage.content,
          latency: latency,
          timestamp: messageTimestamp
        });
      }
      
      // Handle AI response streaming
      if (messageData.type === 'agent_response' || messageData.type === 'ai_response') {
        // Process the AI response for optimal audio playback
        processAIResponse(messageData);
        
        const assistantMessage: ConversationMessage = {
          id: crypto.randomUUID(),
          content: (messageData.text as string) || (messageData.response as string),
          role: 'assistant',
          timestamp: messageTimestamp,
          latency: latency
        };
        
        setConversationState(prev => ({
          ...prev,
          messageHistory: [...prev.messageHistory, assistantMessage]
        }));
        
        // Log AI response streaming
        console.log('AI response received:', {
          text: assistantMessage.content,
          latency: latency,
          timestamp: messageTimestamp
        });
      }
      
      // Handle audio chunk streaming for real-time playback
      if (messageData.type === 'audio_chunk' || messageData.audio_data) {
        console.log('Audio chunk received for streaming playback:', {
          size: (messageData.audio_data as ArrayBuffer)?.byteLength || (messageData.bytes as number),
          format: (messageData.format as string) || 'mp3',
          latency: latency
        });
      }
    },
    onError: (error: string | Error) => {
      const errorMessage = typeof error === "string" ? error : error.message;
      console.error("Conversation Error:", error);
      
      setConversationState(prev => ({ ...prev, error: errorMessage }));
      
      // Handle session errors and potential reconnection
      if (sessionManager.isActive() && sessionState.reconnectCount < 3) {
        console.log('Attempting to reconnect session...');
        sessionManager.reconnect().catch(reconnectError => {
          console.error('Reconnection failed:', reconnectError);
          setConversationState(prev => ({ 
            ...prev, 
            error: 'Connection lost. Please try again.' 
          }));
        });
      }
    },
  });

  const { status, isSpeaking } = conversation;

  useEffect(() => {
    // Update conversation state based on SDK status
    setConversationState(prev => ({
      ...prev,
      isSpeaking: isSpeaking || false,
      isListening: status === 'connected' && !isSpeaking
    }));
    
    // Update session manager based on conversation status
    if (status === 'connected' && sessionState.status !== 'connected') {
      sessionManager.resumeSession();
    } else if (status === 'disconnected' && sessionState.status === 'connected') {
      sessionManager.pauseSession();
    }
  }, [status, isSpeaking, sessionState.status, sessionManager]);

  useEffect(() => {
    // Set up session manager callbacks
    sessionManager.setCallbacks({
      onStatusChange: (status) => {
        setSessionState(prev => ({ ...prev, status }));
        console.log('Session status:', status);
      },
      onQualityChange: (quality) => {
        setSessionState(prev => ({ ...prev, connectionQuality: quality }));
      },
      onMetricsUpdate: (metrics) => {
        console.log('Session metrics:', metrics);
      },
      onReconnect: (attempt) => {
        console.log(`Reconnection attempt ${attempt}`);
        setConversationState(prev => ({ 
          ...prev, 
          error: `Reconnecting... (attempt ${attempt})` 
        }));
      },
      onTimeout: () => {
        console.log('Session timeout');
        setConversationState(prev => ({ 
          ...prev, 
          error: 'Connection timeout. Please try again.' 
        }));
      }
    });
    
    // Set up permission change listener
    const unsubscribe = permissionManager.onPermissionChange((permissions) => {
      setAudioPermissions(permissions);
      setConversationState(prev => ({
        ...prev,
        hasPermissions: permissions.microphone === 'granted'
      }));
    });

    // Check initial permissions
    const checkPermissions = async () => {
      try {
        const permissions = await permissionManager.checkMicrophonePermission();
        setAudioPermissions(permissions);
        setConversationState(prev => ({
          ...prev,
          hasPermissions: permissions.microphone === 'granted'
        }));

        // Show permission modal if needed
        if (permissions.microphone === 'prompt' || permissions.microphone === 'unknown') {
          setShowPermissionModal(true);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    };

    checkPermissions();
    
    return () => {
      unsubscribe();
      sessionManager.destroy();
    };
  }, [permissionManager, sessionManager]);

  const handleStartConversation = async () => {
    // Check permissions before starting
    if (audioPermissions.microphone !== 'granted') {
      setShowPermissionModal(true);
      return;
    }

    try {
      // Clear any previous errors
      setConversationState(prev => ({ ...prev, error: null }));
      
      // Start session (audio optimizations handled by configured microphone settings)
      const conversationId = await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'default-agent-id'
      });
      
      console.log("Started conversation with optimized audio settings:", {
        conversationId,
        audioConfig,
        microphoneOptimized: true
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to start conversation";
      setConversationState(prev => ({ ...prev, error: errorMessage }));
      console.error("Error starting conversation:", error);
      
      // Ensure session manager is reset on failure
      await sessionManager.disconnectSession('start_failed');
    }
  };

  const handleEndConversation = async () => {
    try {
      // Generate final latency report before ending
      const latencyReport = generateLatencyReport();
      if (latencyReport) {
        console.log('=== FINAL LATENCY VALIDATION REPORT ===');
        console.log(`Session completed with ${latencyReport.totalMessages} messages`);
        console.log(`Average latency: ${latencyReport.averageLatency}ms`);
        console.log(`Latency range: ${latencyReport.minimumLatency}ms - ${latencyReport.maximumLatency}ms`);
        console.log(`<500ms compliance: ${latencyReport.complianceRate}%`);
        console.log(`Meeting requirement: ${latencyReport.meetingRequirement ? '✅ YES' : '❌ NO'}`);
        console.log('==========================================');
      }
      
      // End the ElevenLabs session
      await conversation.endSession();
      
      // Disconnect session manager
      await sessionManager.disconnectSession('user_ended');
      
      setConversationState(prev => ({
        ...prev,
        isActive: false,
        isListening: false,
        isSpeaking: false,
        sessionId: null,
        error: null
      }));
      
      console.log('Conversation ended successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to end conversation";
      setConversationState(prev => ({ ...prev, error: errorMessage }));
      console.error("Error ending conversation:", error);
    }
  };

  const toggleMute = () => {
    try {
      const newVolume = isMuted ? audioSettings.outputVolume : 0;
      conversation.setVolume({ volume: newVolume });
      setIsMuted(!isMuted);
      
      console.log('Audio playback volume changed:', {
        previousVolume: isMuted ? 0 : audioSettings.outputVolume,
        newVolume,
        muted: !isMuted
      });
    } catch (error) {
      const errorMessage = "Failed to change volume";
      setConversationState(prev => ({ ...prev, error: errorMessage }));
      console.error("Error changing volume:", error);
    }
  };
  
  // AI Response Processing with optimized playback settings (used in message processing)
  const processAIResponse = (responseData: Record<string, unknown>) => {
    try {
      // Configure audio playbook for optimal quality
      if (conversation && responseData.audio_data) {
        // Apply output volume settings
        conversation.setVolume({ 
          volume: audioSettings.speakerEnabled ? audioSettings.outputVolume : 0 
        });
        
        // Log AI response processing
        console.log('Processing AI response for playback:', {
          audioDataSize: (responseData.audio_data as ArrayBuffer).byteLength,
          format: (responseData.format as string) || 'mp3',
          quality: audioSettings.audioQuality,
          outputVolume: audioSettings.outputVolume,
          timestamp: new Date()
        });
      }
      
      return responseData;
    } catch (error) {
      console.error('Error processing AI response:', error);
      setConversationState(prev => ({
        ...prev,
        error: 'Failed to process AI response audio'
      }));
      throw error;
    }
  };
  
  // Audio Settings Control
  const updateAudioSettings = (newSettings: Partial<AudioSettings>) => {
    setAudioSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // Apply volume changes to active conversation
      if (conversation && conversation.setVolume) {
        try {
          conversation.setVolume({ volume: updated.outputVolume });
        } catch (error) {
          console.error('Failed to apply volume setting:', error);
        }
      }
      
      console.log('Audio settings updated:', updated);
      return updated;
    });
  };
  
  // Latency Validation for <500ms requirement
  const validateLatencyRequirement = (latency: number): boolean => {
    const LATENCY_TARGET = 500; // milliseconds
    const isValid = latency <= LATENCY_TARGET;
    
    if (!isValid) {
      console.warn(`Latency validation failed: ${latency}ms exceeds ${LATENCY_TARGET}ms target`);
      
      // Log detailed information for troubleshooting
      console.log('Latency troubleshooting info:', {
        currentLatency: latency,
        target: LATENCY_TARGET,
        audioConfig: audioConfig,
        audioSettings: audioSettings,
        connectionQuality: sessionState.connectionQuality,
        timestamp: new Date()
      });
    } else {
      console.log(`Latency validation passed: ${latency}ms <= ${LATENCY_TARGET}ms ✓`);
    }
    
    return isValid;
  };
  
  // Audio Level Monitoring for Feedback Prevention
  const setupAudioLevelMonitoring = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    microphone.connect(analyser);
    
    const monitorLevels = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate RMS (Root Mean Square) for more accurate level detection
      const rms = Math.sqrt(dataArray.reduce((sum, value) => sum + value * value, 0) / bufferLength) / 255;
      
      // Update levels and smart muting logic
      setAudioLevels(prevLevels => {
        // Smart muting logic - mute microphone if output is detected and input is high
        if (rms > prevLevels.threshold && conversationState.isSpeaking && !prevLevels.isMuted) {
          console.log('Potential feedback detected - smart muting microphone');
          smartMuteMicrophone(true);
        }
        
        // Unmute when AI stops speaking and input level is normal
        if (!conversationState.isSpeaking && prevLevels.isMuted && rms < prevLevels.threshold * 0.5) {
          console.log('AI finished speaking - unmuting microphone');
          smartMuteMicrophone(false);
        }
        
        return {
          ...prevLevels,
          inputLevel: rms
        };
      });
      
      requestAnimationFrame(monitorLevels);
    };
    
    monitorLevels();
    
    // Store cleanup function
    return () => {
      microphone.disconnect();
      analyser.disconnect();
      audioContext.close();
    };
  };
  
  // Smart Microphone Muting for Feedback Prevention
  const smartMuteMicrophone = (shouldMute: boolean) => {
    try {
      const stream = sessionManager.getAudioStream();
      if (stream) {
        const audioTracks = stream.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = !shouldMute;
        });
        
        setAudioLevels(prev => ({
          ...prev,
          isMuted: shouldMute
        }));
        
        console.log(`Smart microphone ${shouldMute ? 'muted' : 'unmuted'} for feedback prevention`);
      }
    } catch (error) {
      console.error('Failed to control microphone:', error);
    }
  };
  
  // Performance Monitoring and Reporting
  const generateLatencyReport = () => {
    const messages = conversationState.messageHistory.filter(msg => msg.latency);
    if (messages.length === 0) return null;
    
    const latencies = messages.map(msg => msg.latency!);
    const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);
    const validMessages = latencies.filter(lat => validateLatencyRequirement(lat));
    const complianceRate = (validMessages.length / latencies.length) * 100;
    
    const report = {
      totalMessages: messages.length,
      averageLatency: Math.round(avgLatency),
      minimumLatency: minLatency,
      maximumLatency: maxLatency,
      complianceRate: Math.round(complianceRate),
      meetingRequirement: avgLatency <= 500,
      timestamp: new Date()
    };
    
    console.log('Latency Performance Report:', report);
    return report;
  };

  const handleRequestPermission = async () => {
    try {
      const permissions = await permissionManager.requestMicrophonePermission();
      setAudioPermissions(permissions);
      setConversationState(prev => ({
        ...prev,
        hasPermissions: permissions.microphone === 'granted',
        error: null
      }));
      
      if (permissions.microphone === 'granted') {
        setShowPermissionModal(false);
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setConversationState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get microphone permission'
      }));
    }
  };

  const getPermissionStatusIcon = () => {
    switch (audioPermissions.microphone) {
      case 'granted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'denied':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'prompt':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getConnectionStatusColor = () => {
    if (status === 'connected') return 'text-green-600';
    if (status === 'connecting') return 'text-yellow-600';
    if (conversationState.error) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Permission Modal */}
      <PermissionModal
        isOpen={showPermissionModal}
        permissions={audioPermissions}
        onRequestPermission={handleRequestPermission}
        onClose={() => setShowPermissionModal(false)}
        browserInstructions={permissionManager.getBrowserSpecificInstructions()}
        isHttpsRequired={permissionManager.isHttpsRequired()}
      />

      {/* Conversation History */}
      {conversationState.messageHistory.length > 0 && (
        <Card className="max-h-60 overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-sm">Conversation History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {conversationState.messageHistory.slice(-6).map((message: ConversationMessage) => (
              <div key={message.id} className={`text-sm p-2 rounded ${
                message.role === 'user' 
                  ? 'bg-blue-50 text-blue-800' 
                  : 'bg-green-50 text-green-800'
              }`}>
                <strong>{message.role === 'user' ? 'You' : 'AI'}:</strong> {message.content}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Voice Chat Controls */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Voice AI Assistant</span>
              {getPermissionStatusIcon()}
              
              {/* Connection Status Badge */}
              <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                status === 'connected' 
                  ? 'bg-green-100 text-green-800 border-green-300' 
                  : status === 'connecting' 
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300 animate-pulse' 
                  : conversationState.error 
                  ? 'bg-red-100 text-red-800 border-red-300' 
                  : 'bg-gray-100 text-gray-600 border-gray-300'
              }`}>
                {status === 'connected' ? 'CONNECTED' : 
                 status === 'connecting' ? 'CONNECTING' : 
                 conversationState.error ? 'ERROR' : 'OFFLINE'}
              </div>
            </div>
            <div className="flex gap-2">
              {/* Enhanced Mute Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleMute}
                disabled={status !== "connected"}
                className={`relative transition-all duration-200 ${
                  status === "connected" 
                    ? 'hover:scale-110 hover:shadow-md' 
                    : 'opacity-40'
                }`}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-red-500" />
                ) : (
                  <Volume2 className="h-4 w-4 text-blue-500" />
                )}
                {/* Volume indicator */}
                {!isMuted && status === "connected" && (
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      <CardContent>
        <div className="space-y-4 sm:space-y-6">
          {/* Enhanced Main Action Button with Mobile Optimization */}
          <div className="flex justify-center">
            {status === "connected" ? (
              <Button
                variant="destructive"
                onClick={handleEndConversation}
                className="w-full sm:w-auto sm:min-w-64 relative group bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 py-4 sm:py-6 text-base sm:text-lg font-semibold"
              >
                <MicOff className="mr-3 h-5 w-5 sm:h-6 sm:w-6 group-hover:animate-pulse" />
                End Conversation
                {/* Enhanced animated indicator for active session */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-300 rounded-full animate-ping opacity-75"></div>
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-200 rounded-full animate-pulse"></div>
              </Button>
            ) : (
              <Button
                onClick={handleStartConversation}
                disabled={audioPermissions.microphone !== 'granted'}
                className={`w-full sm:w-auto sm:min-w-64 relative group transition-all duration-300 py-4 sm:py-6 text-base sm:text-lg font-semibold border-0 shadow-xl hover:shadow-2xl ${
                  audioPermissions.microphone === 'granted' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105 text-white' 
                    : 'bg-gradient-to-r from-gray-300 to-gray-400 opacity-50 cursor-not-allowed text-gray-600'
                }`}
              >
                <Mic className={`mr-3 h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 ${
                  audioPermissions.microphone === 'granted' 
                    ? 'group-hover:animate-bounce' 
                    : ''
                }`} />
                Start Conversation
                {/* Enhanced ready indicator */}
                {audioPermissions.microphone === 'granted' && (
                  <>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-300 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-200 rounded-full animate-pulse"></div>
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Audio Quality Controls */}
          {status !== 'connected' && (
            <div className="space-y-2 p-3 bg-gray-50 rounded-md">
              <div className="text-sm font-medium text-gray-700 text-center">Audio Quality Settings</div>
              <div className="flex gap-2 justify-center">
                {(['low', 'medium', 'high'] as const).map((quality) => (
                  <Button
                    key={quality}
                    variant={audioSettings.audioQuality === quality ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateAudioSettings({ audioQuality: quality })}
                  >
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}
                  </Button>
                ))}
              </div>
              <div className="text-xs text-gray-500 text-center">
                {audioSettings.audioQuality === 'high' && 'Best quality, higher latency'}
                {audioSettings.audioQuality === 'medium' && 'Balanced quality and latency'}  
                {audioSettings.audioQuality === 'low' && 'Faster response, lower quality'}
              </div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="text-center text-sm space-y-2">
            {/* Enhanced Listening/Speaking State Indicators */}
            <div className={`flex items-center justify-center gap-3 ${getConnectionStatusColor()}`}>
              {/* Animated Status Indicator */}
              <div className="relative">
                <div className={`w-3 h-3 rounded-full ${
                  status === 'connected' ? (
                    conversationState.isSpeaking 
                      ? 'bg-blue-500 animate-pulse' 
                      : 'bg-green-500 animate-pulse'
                  ) :
                  status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  conversationState.error ? 'bg-red-500 animate-bounce' : 'bg-gray-400'
                }`} />
                {/* Listening ripple effect */}
                {status === 'connected' && !conversationState.isSpeaking && (
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-30"></div>
                )}
                {/* Speaking wave effect */}
                {status === 'connected' && conversationState.isSpeaking && (
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-blue-500 animate-ping opacity-40"></div>
                )}
              </div>
              
              {/* Status Text with Enhanced States */}
              <span className="font-medium">
                {status === 'connected' 
                  ? (conversationState.isSpeaking 
                      ? '🤖 AI is responding...' 
                      : audioLevels.inputLevel > 0.1 
                        ? '👂 Listening actively...' 
                        : '⏳ Ready to listen...'
                    ) 
                  : status === 'connecting' 
                  ? '🔄 Connecting...' 
                  : conversationState.error 
                  ? '❌ Connection error' 
                  : '💤 Ready to connect'
                }
              </span>
              
              {/* Voice Activity Indicator */}
              {status === 'connected' && audioLevels.inputLevel > 0.1 && !conversationState.isSpeaking && (
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div 
                      key={i}
                      className={`w-1 bg-green-500 rounded-full animate-bounce ${
                        audioLevels.inputLevel > 0.3 ? 'h-4' : 
                        audioLevels.inputLevel > 0.2 ? 'h-3' : 'h-2'
                      }`}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}
              
              {/* AI Response Audio Visualization */}
              {status === 'connected' && conversationState.isSpeaking && (
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div 
                      key={i}
                      className="w-1 bg-blue-500 rounded-full animate-pulse"
                      style={{ 
                        height: `${12 + Math.sin((Date.now() + i * 200) / 200) * 8}px`,
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: '0.8s'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Enhanced AI Response Visual Feedback */}
            {status === 'connected' && conversationState.isSpeaking && (
              <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                      <span className="text-white text-sm font-bold">AI</span>
                    </div>
                    <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-blue-400 animate-ping opacity-50"></div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="text-sm font-medium text-blue-800 mb-1">AI is responding</div>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4, 5, 6].map(i => (
                        <div 
                          key={i}
                          className="w-2 bg-gradient-to-t from-blue-400 to-blue-600 rounded-full animate-bounce opacity-70"
                          style={{ 
                            height: `${8 + Math.sin((Date.now() + i * 300) / 300) * 6}px`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-xs text-blue-600 font-medium">
                    🔊 Playing
                  </div>
                </div>
              </div>
            )}
            
            {/* Session Info (Development mode) */}
            {process.env.NODE_ENV === 'development' && sessionState.id && (
              <div className="text-xs text-gray-500 space-y-1">
                <div>Session: {sessionState.id.slice(0, 8)}...</div>
                <div className="flex justify-center gap-4">
                  <span>Quality: {sessionState.connectionQuality}</span>
                  {sessionState.reconnectCount > 0 && (
                    <span>Reconnects: {sessionState.reconnectCount}</span>
                  )}
                </div>
                <div className="flex justify-center gap-4">
                  <span>Audio: {audioSettings.audioQuality}</span>
                  <span>Config: {audioConfig.latencyHint}</span>
                </div>
              </div>
            )}
            
            {/* Audio Level Monitor (Feedback Prevention) */}
            {status === 'connected' && (
              <div className="text-xs space-y-1">
                <div className="flex justify-center gap-4">
                  <span className={`flex items-center gap-1 ${
                    audioLevels.inputLevel > 0.1 ? 'text-green-500' : 'text-gray-400'
                  }`}>
                    🎤 Input: {Math.round(audioLevels.inputLevel * 100)}%
                  </span>
                  {audioLevels.isMuted && (
                    <span className="text-yellow-500 flex items-center gap-1">
                      🔇 Smart Muted
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Latency Monitor (Production & Development) */}
            {status === 'connected' && conversationState.messageHistory.length > 0 && (
              <div className="text-xs space-y-1">
                {(() => {
                  const recentMessages = conversationState.messageHistory.slice(-3);
                  const avgLatency = recentMessages
                    .filter(msg => msg.latency)
                    .reduce((sum, msg) => sum + (msg.latency || 0), 0) / 
                    recentMessages.filter(msg => msg.latency).length;
                  
                  const latencyColor = avgLatency > 500 ? 'text-red-500' : avgLatency > 300 ? 'text-yellow-500' : 'text-green-500';
                  
                  return avgLatency > 0 ? (
                    <div className={`${latencyColor} font-medium`}>
                      Avg Latency: {Math.round(avgLatency)}ms {avgLatency <= 500 ? '✓' : '⚠️'}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
            
            {/* Permission Status */}
            {audioPermissions.microphone !== 'granted' && (
              <div className="flex items-center justify-center gap-2 text-yellow-600">
                {getPermissionStatusIcon()}
                <span>
                  {audioPermissions.microphone === 'denied' 
                    ? 'Microphone access denied' 
                    : 'Microphone permission required'
                  }
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-yellow-600 underline"
                  onClick={() => setShowPermissionModal(true)}
                >
                  Fix this
                </Button>
              </div>
            )}
            
            {/* Error Message */}
            {conversationState.error && (
              <p className="text-red-500 font-bold flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {conversationState.error}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default VoiceComponent;
