import { SessionState, SessionConfiguration, SessionStatus, ConnectionQuality, SessionMetrics, SessionCallbacks } from "@/types";

export class SessionManager {
  private sessionState: SessionState = {
    id: null,
    status: 'disconnected',
    startTime: null,
    endTime: null,
    duration: 0,
    connectionQuality: 'unknown',
    reconnectCount: 0,
    lastHeartbeat: null,
    metadata: {}
  };

  private configuration: SessionConfiguration;
  private callbacks: SessionCallbacks = {};
  private heartbeatInterval?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;
  private audioStream?: MediaStream;
  private metrics: SessionMetrics = {
    latency: 0,
    packetsLost: 0,
    packetsReceived: 0,
    bytesTransferred: 0,
    averageLatency: 0,
    connectionUptime: 0
  };

  private latencyMeasurements: number[] = [];

  constructor(config: SessionConfiguration) {
    this.configuration = config;
  }

  setCallbacks(callbacks: SessionCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  async initializeSession(sessionId: string): Promise<void> {
    this.sessionState = {
      ...this.sessionState,
      id: sessionId,
      status: 'initializing',
      startTime: new Date(),
      endTime: null,
      duration: 0,
      reconnectCount: 0,
      lastHeartbeat: new Date()
    };

    this.notifyStatusChange('initializing');
    
    // Start heartbeat monitoring
    this.startHeartbeat();
    
    // Initialize metrics
    this.resetMetrics();
  }

  async connectSession(): Promise<void> {
    if (!this.sessionState.id) {
      throw new Error('Session not initialized');
    }

    this.updateStatus('connecting');
    
    try {
      // Connection logic would be handled by the ElevenLabs SDK
      // Here we just update our internal state
      this.updateStatus('connected');
      this.updateConnectionQuality('good');
      
      // Start connection quality monitoring
      this.startConnectionMonitoring();
      
    } catch (error) {
      this.updateStatus('error');
      throw error;
    }
  }

  async disconnectSession(reason?: string): Promise<void> {
    this.updateStatus('disconnecting');
    
    // Stop all monitoring
    this.stopHeartbeat();
    this.stopConnectionMonitoring();
    
    // Update final state
    this.sessionState = {
      ...this.sessionState,
      status: 'disconnected',
      endTime: new Date(),
      duration: this.calculateDuration()
    };
    
    this.notifyStatusChange('disconnected');
    
    if (this.configuration.enableLogging) {
      console.log('Session disconnected:', { 
        sessionId: this.sessionState.id, 
        duration: this.sessionState.duration,
        reason 
      });
    }
  }

  async reconnect(): Promise<void> {
    if (this.sessionState.reconnectCount >= this.configuration.reconnectAttempts) {
      throw new Error('Maximum reconnection attempts exceeded');
    }

    this.sessionState.reconnectCount++;
    this.updateStatus('reconnecting');
    this.callbacks.onReconnect?.(this.sessionState.reconnectCount);

    await new Promise(resolve => {
      setTimeout(resolve, this.configuration.reconnectDelay);
    });

    try {
      await this.connectSession();
    } catch {
      if (this.sessionState.reconnectCount < this.configuration.reconnectAttempts) {
        // Schedule another reconnection attempt
        this.reconnectTimeout = setTimeout(() => {
          this.reconnect().catch(console.error);
        }, this.configuration.reconnectDelay * Math.pow(2, this.sessionState.reconnectCount));
      } else {
        this.updateStatus('error');
        throw new Error('Failed to reconnect after maximum attempts');
      }
    }
  }

  pauseSession(): void {
    if (this.sessionState.status === 'connected' || this.sessionState.status === 'active') {
      this.updateStatus('paused');
    }
  }

  resumeSession(): void {
    if (this.sessionState.status === 'paused') {
      this.updateStatus('active');
    }
  }

  updateLatency(latency: number): void {
    this.metrics.latency = latency;
    this.latencyMeasurements.push(latency);
    
    // Keep only last 100 measurements for average calculation
    if (this.latencyMeasurements.length > 100) {
      this.latencyMeasurements.shift();
    }
    
    this.metrics.averageLatency = this.latencyMeasurements.reduce((a, b) => a + b, 0) / this.latencyMeasurements.length;
    
    // Update connection quality based on latency
    this.updateConnectionQualityFromMetrics();
    this.callbacks.onMetricsUpdate?.(this.metrics);
  }

  updateBytesTransferred(bytes: number): void {
    this.metrics.bytesTransferred += bytes;
    this.metrics.packetsReceived++;
    this.callbacks.onMetricsUpdate?.(this.metrics);
  }

  reportPacketLoss(packetsLost: number): void {
    this.metrics.packetsLost += packetsLost;
    this.updateConnectionQualityFromMetrics();
    this.callbacks.onMetricsUpdate?.(this.metrics);
  }

  getSessionState(): SessionState {
    return { ...this.sessionState };
  }

  getMetrics(): SessionMetrics {
    return { ...this.metrics };
  }

  isActive(): boolean {
    return ['connected', 'active', 'paused'].includes(this.sessionState.status);
  }

  setAudioStream(stream: MediaStream): void {
    this.audioStream = stream;
    
    if (this.configuration.enableLogging) {
      console.log('Audio stream configured:', {
        tracks: stream.getTracks().length,
        audio: stream.getAudioTracks().length,
        video: stream.getVideoTracks().length
      });
    }
  }

  getAudioStream(): MediaStream | undefined {
    return this.audioStream;
  }

  private updateStatus(status: SessionStatus): void {
    const oldStatus = this.sessionState.status;
    this.sessionState.status = status;
    
    if (oldStatus !== status) {
      this.notifyStatusChange(status);
    }
  }

  private notifyStatusChange(status: SessionStatus): void {
    this.callbacks.onStatusChange?.(status);
    
    if (this.configuration.enableLogging) {
      console.log('Session status changed:', status);
    }
  }

  private updateConnectionQuality(quality: ConnectionQuality): void {
    const oldQuality = this.sessionState.connectionQuality;
    this.sessionState.connectionQuality = quality;
    
    if (oldQuality !== quality) {
      this.callbacks.onQualityChange?.(quality);
    }
  }

  private updateConnectionQualityFromMetrics(): void {
    const { latency, packetsLost, packetsReceived } = this.metrics;
    const packetLossRate = packetsReceived > 0 ? packetsLost / packetsReceived : 0;
    
    let quality: ConnectionQuality;
    
    if (latency < 100 && packetLossRate < 0.01) {
      quality = 'excellent';
    } else if (latency < 200 && packetLossRate < 0.02) {
      quality = 'good';
    } else if (latency < 400 && packetLossRate < 0.05) {
      quality = 'fair';
    } else {
      quality = 'poor';
    }
    
    this.updateConnectionQuality(quality);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sessionState.lastHeartbeat = new Date();
      this.metrics.connectionUptime = this.calculateDuration();
    }, this.configuration.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  private startConnectionMonitoring(): void {
    // Monitor for timeouts
    const timeoutCheck = setInterval(() => {
      const now = new Date().getTime();
      const lastHeartbeat = this.sessionState.lastHeartbeat?.getTime() || now;
      
      if (now - lastHeartbeat > this.configuration.timeoutDuration) {
        clearInterval(timeoutCheck);
        this.callbacks.onTimeout?.();
        
        if (this.sessionState.reconnectCount < this.configuration.reconnectAttempts) {
          this.reconnect().catch(console.error);
        } else {
          this.updateStatus('error');
        }
      }
    }, 5000); // Check every 5 seconds
  }

  private stopConnectionMonitoring(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
  }

  private calculateDuration(): number {
    if (!this.sessionState.startTime) return 0;
    const endTime = this.sessionState.endTime || new Date();
    return endTime.getTime() - this.sessionState.startTime.getTime();
  }

  private resetMetrics(): void {
    this.metrics = {
      latency: 0,
      packetsLost: 0,
      packetsReceived: 0,
      bytesTransferred: 0,
      averageLatency: 0,
      connectionUptime: 0
    };
    this.latencyMeasurements = [];
  }

  destroy(): void {
    this.stopHeartbeat();
    this.stopConnectionMonitoring();
    
    // Clean up audio stream
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => {
        track.stop();
      });
      this.audioStream = undefined;
    }
    
    this.callbacks = {};
  }
}