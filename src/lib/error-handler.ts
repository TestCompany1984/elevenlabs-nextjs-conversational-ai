// Enhanced error handling system for Voice AI Assistant
export interface ErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  retryable: boolean;
  category: 'connection' | 'permission' | 'audio' | 'session' | 'network' | 'unknown';
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

export interface ErrorRecoveryResult {
  success: boolean;
  error?: ErrorInfo;
  attemptsUsed: number;
}

export class ErrorHandler {
  private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  private static readonly ERROR_PATTERNS: Record<string, Partial<ErrorInfo>> = {
    // Connection Errors
    'NetworkError': {
      category: 'network',
      severity: 'high',
      recoverable: true,
      retryable: true,
      userMessage: 'Network connection issue. Please check your internet connection.'
    },
    'WebSocket connection failed': {
      category: 'connection',
      severity: 'high', 
      recoverable: true,
      retryable: true,
      userMessage: 'Failed to connect to voice service. Retrying...'
    },
    'Connection timeout': {
      category: 'connection',
      severity: 'medium',
      recoverable: true,
      retryable: true,
      userMessage: 'Connection timed out. Attempting to reconnect...'
    },
    'Authentication failed': {
      category: 'session',
      severity: 'critical',
      recoverable: false,
      retryable: false,
      userMessage: 'Authentication failed. Please check your API credentials.'
    },
    
    // Permission Errors
    'Permission denied': {
      category: 'permission',
      severity: 'high',
      recoverable: true,
      retryable: false,
      userMessage: 'Microphone access denied. Please grant permission to continue.'
    },
    'NotAllowedError': {
      category: 'permission',
      severity: 'high',
      recoverable: true,
      retryable: false,
      userMessage: 'Microphone permission was denied. Please enable it in your browser settings.'
    },
    
    // Audio Errors
    'No audio devices': {
      category: 'audio',
      severity: 'high',
      recoverable: false,
      retryable: false,
      userMessage: 'No microphone detected. Please connect a microphone and try again.'
    },
    'Audio processing failed': {
      category: 'audio',
      severity: 'medium',
      recoverable: true,
      retryable: true,
      userMessage: 'Audio processing issue. Attempting to reset audio connection...'
    },
    
    // Session Errors
    'Session expired': {
      category: 'session',
      severity: 'medium',
      recoverable: true,
      retryable: true,
      userMessage: 'Session expired. Starting a new conversation...'
    },
    'Agent not found': {
      category: 'session',
      severity: 'critical',
      recoverable: false,
      retryable: false,
      userMessage: 'AI agent is not available. Please check your configuration.'
    }
  };

  static categorizeError(error: unknown): ErrorInfo {
    const errorMessage = this.extractErrorMessage(error);
    const errorCode = this.generateErrorCode(error);
    
    // Find matching pattern
    const matchedPattern = Object.entries(this.ERROR_PATTERNS).find(([pattern]) => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );

    const baseInfo = matchedPattern?.[1] || {};
    
    return {
      code: errorCode,
      message: errorMessage,
      userMessage: baseInfo.userMessage || 'An unexpected error occurred. Please try again.',
      severity: baseInfo.severity || 'medium',
      recoverable: baseInfo.recoverable ?? true,
      retryable: baseInfo.retryable ?? true,
      category: baseInfo.category || 'unknown',
      ...baseInfo
    };
  }

  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    onRetry?: (attempt: number, error: ErrorInfo) => void
  ): Promise<ErrorRecoveryResult & { result?: T }> {
    const retryConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config };
    let lastError: ErrorInfo | undefined;
    
    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          result,
          attemptsUsed: attempt
        };
      } catch (error) {
        lastError = this.categorizeError(error);
        
        // Don't retry if error is not retryable
        if (!lastError.retryable) {
          break;
        }
        
        // Don't retry on last attempt
        if (attempt === retryConfig.maxAttempts) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
          retryConfig.maxDelay
        );
        
        // Notify about retry attempt
        onRetry?.(attempt, lastError);
        
        // Wait before retry
        await this.delay(delay);
      }
    }
    
    return {
      success: false,
      error: lastError,
      attemptsUsed: retryConfig.maxAttempts
    };
  }

  static createFallbackState(error: ErrorInfo): {
    isOffline: boolean;
    hasNetworkIssue: boolean;
    canRetry: boolean;
    recommendedAction: string;
  } {
    const isConnectionError = error.category === 'connection' || error.category === 'network';
    const isOffline = !navigator.onLine;
    
    return {
      isOffline,
      hasNetworkIssue: isConnectionError || isOffline,
      canRetry: error.retryable && !isOffline,
      recommendedAction: this.getRecommendedAction(error, isOffline)
    };
  }

  static getRecommendedAction(error: ErrorInfo, isOffline: boolean = false): string {
    if (isOffline) {
      return 'Check your internet connection and try again.';
    }
    
    switch (error.category) {
      case 'permission':
        return 'Please grant microphone permission in your browser settings.';
      case 'connection':
      case 'network':
        return 'Check your network connection and try reconnecting.';
      case 'audio':
        return 'Check your microphone is connected and working properly.';
      case 'session':
        return error.retryable ? 'Try starting a new conversation.' : 'Please check your configuration.';
      default:
        return 'Try refreshing the page or contact support if the issue persists.';
    }
  }

  static sanitizeErrorMessage(message: string): string {
    // Remove sensitive information from error messages
    return message
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]')
      .replace(/\b(?:sk_|pk_)[a-zA-Z0-9]{20,}/g, '[api_key]')
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[uuid]')
      .replace(/\b(?:token|key|secret|password|auth)[=:]\s*[^\s]+/gi, '[redacted]');
  }

  private static extractErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as Record<string, unknown>).message);
    }
    
    return 'Unknown error occurred';
  }

  private static generateErrorCode(error: unknown): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 5);
    
    if (error instanceof Error) {
      const errorType = error.constructor.name;
      return `${errorType}_${timestamp}_${random}`.toUpperCase();
    }
    
    return `ERROR_${timestamp}_${random}`.toUpperCase();
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Network connectivity monitoring
  static monitorNetworkStatus(
    onOnline: () => void,
    onOffline: () => void
  ): () => void {
    const handleOnline = () => onOnline();
    const handleOffline = () => onOffline();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

// Hook for using error handling in React components
export interface UseErrorHandlerResult {
  error: ErrorInfo | null;
  isRetrying: boolean;
  retryCount: number;
  fallbackState: ReturnType<typeof ErrorHandler.createFallbackState> | null;
  handleError: (error: unknown) => void;
  retry: () => Promise<void>;
  clearError: () => void;
  executeWithRetry: <T>(operation: () => Promise<T>) => Promise<T>;
}