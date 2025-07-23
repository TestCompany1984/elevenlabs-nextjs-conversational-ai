export interface ConversationState {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isConnected: boolean;
  hasPermissions: boolean;
  error: string | null;
  sessionId: string | null;
  lastMessage: string | null;
  messageHistory: ConversationMessage[];
}

export interface ConversationMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  audioUrl?: string;
  latency?: number; // Voice streaming latency in milliseconds
}

export type ConversationStatus = 
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error'
  | 'disconnected';

export interface ConversationCallbacks {
  onStatusChange?: (status: ConversationStatus) => void;
  onMessage?: (message: ConversationMessage) => void;
  onError?: (error: string) => void;
  onPermissionChange?: (granted: boolean) => void;
}