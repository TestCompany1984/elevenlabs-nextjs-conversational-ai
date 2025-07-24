/**
 * Production Logging and Error Monitoring System
 * 
 * Provides structured logging for production environments with
 * error tracking, performance monitoring, and security auditing.
 */

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: 'voice' | 'performance' | 'security' | 'network' | 'system' | 'user';
  message: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
}

export class ProductionLogger {
  private static instance: ProductionLogger;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 1000;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Auto-flush logs every 30 seconds in production
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      this.flushInterval = setInterval(() => {
        this.flushLogs();
      }, 30000);
    }
  }

  static getInstance(): ProductionLogger {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger();
    }
    return ProductionLogger.instance;
  }

  /**
   * Log debug information (development only)
   */
  debug(category: LogEntry['category'], message: string, metadata?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', category, message, metadata);
    }
  }

  /**
   * Log informational messages
   */
  info(category: LogEntry['category'], message: string, metadata?: Record<string, unknown>) {
    this.log('info', category, message, metadata);
  }

  /**
   * Log warnings
   */
  warn(category: LogEntry['category'], message: string, metadata?: Record<string, unknown>) {
    this.log('warn', category, message, metadata);
  }

  /**
   * Log errors
   */
  error(category: LogEntry['category'], message: string, error?: Error, metadata?: Record<string, unknown>) {
    const errorMetadata = {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      } : undefined
    };

    this.log('error', category, message, errorMetadata);
  }

  /**
   * Log critical errors that require immediate attention
   */
  critical(category: LogEntry['category'], message: string, error?: Error, metadata?: Record<string, unknown>) {
    const errorMetadata = {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      } : undefined
    };

    this.log('critical', category, message, errorMetadata);

    // Send critical errors immediately
    this.flushLogs();
  }

  /**
   * Log voice conversation events
   */
  voiceEvent(event: string, metadata?: Record<string, unknown>) {
    this.info('voice', `Voice event: ${event}`, {
      ...metadata,
      timestamp: Date.now()
    });
  }

  /**
   * Log performance metrics
   */
  performance(metric: string, value: number, metadata?: Record<string, unknown>) {
    this.info('performance', `Performance metric: ${metric}`, {
      ...metadata,
      metric,
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Log security events
   */
  security(event: string, severity: 'low' | 'medium' | 'high', metadata?: Record<string, unknown>) {
    const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    
    this.log(level, 'security', `Security event: ${event}`, {
      ...metadata,
      severity,
      timestamp: Date.now()
    });
  }

  /**
   * Log network events
   */
  network(event: string, metadata?: Record<string, unknown>) {
    this.info('network', `Network event: ${event}`, {
      ...metadata,
      timestamp: Date.now()
    });
  }

  /**
   * Internal logging method
   */
  private log(
    level: LogEntry['level'],
    category: LogEntry['category'],
    message: string,
    metadata?: Record<string, unknown>
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message: this.sanitizeMessage(message),
      metadata: metadata ? this.sanitizeMetadata(metadata) : undefined
    };

    // Add contextual information if available
    if (typeof window !== 'undefined') {
      entry.userAgent = navigator.userAgent;
      entry.sessionId = this.getSessionId();
    }

    // Console output for development
    if (process.env.NODE_ENV !== 'production') {
      const logMethod = level === 'error' || level === 'critical' ? console.error :
                       level === 'warn' ? console.warn : console.log;
      
      logMethod(`[${level.toUpperCase()}] [${category}] ${message}`, metadata || '');
    }

    // Add to buffer for production logging
    this.logBuffer.push(entry);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flushLogs();
    }
  }

  /**
   * Sanitize log messages to remove sensitive information
   */
  private sanitizeMessage(message: string): string {
    return message
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]')
      .replace(/\b(?:sk_|pk_)[a-zA-Z0-9]{20,}/g, '[api_key]')
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[uuid]')
      .replace(/\b(?:token|key|secret|password|auth)[=:]\s*[^\s]+/gi, '[redacted]');
  }

  /**
   * Sanitize metadata to remove sensitive information
   */
  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeMessage(value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeMetadata(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('voice_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem('voice_session_id', sessionId);
      }
      return sessionId;
    }
    return 'server-session';
  }

  /**
   * Flush logs to external service (implement based on your logging service)
   */
  private async flushLogs() {
    if (this.logBuffer.length === 0) return;

    const logs = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // In production, send logs to your logging service
      if (process.env.NODE_ENV === 'production') {
        await this.sendToLoggingService(logs);
      }
    } catch (error) {
      // Don't let logging errors break the application
      console.error('Failed to flush logs:', error);
      
      // Put logs back in buffer if sending failed
      this.logBuffer.unshift(...logs);
    }
  }

  /**
   * Send logs to external logging service
   */
  private async sendToLoggingService(logs: LogEntry[]) {
    // Implement based on your logging service (Sentry, DataDog, etc.)
    
    // Example implementation for a generic logging endpoint
    if (process.env.LOGGING_ENDPOINT) {
      try {
        const response = await fetch(process.env.LOGGING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LOGGING_API_KEY}`,
          },
          body: JSON.stringify({
            source: 'voice-ai-assistant',
            environment: process.env.NODE_ENV,
            version: process.env.npm_package_version,
            logs
          }),
        });

        if (!response.ok) {
          throw new Error(`Logging service responded with ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to send logs to logging service:', error);
        throw error;
      }
    }

    // For Sentry integration
    if (process.env.SENTRY_DSN && typeof window !== 'undefined') {
      logs.forEach(log => {
        if (log.level === 'error' || log.level === 'critical') {
          // Send errors to Sentry
          console.error('Sentry error:', log);
        }
      });
    }
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Clear log buffer
   */
  clearLogs() {
    this.logBuffer = [];
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush remaining logs
    this.flushLogs();
  }
}

// Global logger instance
export const logger = ProductionLogger.getInstance();

// Error boundary integration
export function logUnhandledError(error: Error, errorInfo?: { componentStack?: string }) {
  logger.critical('system', 'Unhandled error in React component', error, {
    componentStack: errorInfo?.componentStack,
    boundary: 'react-error-boundary'
  });
}

// Promise rejection handler
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    logger.critical('system', 'Unhandled promise rejection', 
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
        type: 'unhandled-promise-rejection'
      });
  });
}

// Development logging helpers
if (process.env.NODE_ENV === 'development') {
  (window as any).logger = logger;
  console.log('📝 Production logger available at window.logger');
}