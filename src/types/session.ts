export interface SessionConfiguration {
  agentId: string;
  apiUrl?: string;
  maxDuration?: number;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  timeoutDuration: number;
  enableLogging: boolean;
}

export interface SessionState {
  id: string | null;
  status: SessionStatus;
  startTime: Date | null;
  endTime: Date | null;
  duration: number;
  connectionQuality: ConnectionQuality;
  reconnectCount: number;
  lastHeartbeat: Date | null;
  metadata?: Record<string, unknown>;
}

export type SessionStatus = 
  | 'initializing'
  | 'connecting' 
  | 'connected'
  | 'active'
  | 'paused'
  | 'reconnecting'
  | 'disconnecting'
  | 'disconnected'
  | 'error'
  | 'expired';

export type ConnectionQuality = 
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'unknown';

export interface SessionMetrics {
  latency: number;
  packetsLost: number;
  packetsReceived: number;
  bytesTransferred: number;
  averageLatency: number;
  connectionUptime: number;
}

export interface SessionCallbacks {
  onStatusChange?: (status: SessionStatus) => void;
  onQualityChange?: (quality: ConnectionQuality) => void;
  onMetricsUpdate?: (metrics: SessionMetrics) => void;
  onReconnect?: (attempt: number) => void;
  onTimeout?: () => void;
  onExpired?: () => void;
}