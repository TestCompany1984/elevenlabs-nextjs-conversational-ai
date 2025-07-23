import { useState, useCallback, useEffect } from 'react';
import { ErrorHandler, ErrorInfo, UseErrorHandlerResult } from '@/lib/error-handler';

export function useErrorHandler(): UseErrorHandlerResult {
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [fallbackState, setFallbackState] = useState<ReturnType<typeof ErrorHandler.createFallbackState> | null>(null);
  const [, setNetworkStatus] = useState(navigator.onLine);

  // Monitor network status
  useEffect(() => {
    const cleanup = ErrorHandler.monitorNetworkStatus(
      () => {
        setNetworkStatus(true);
        // Clear network-related errors when back online
        if (error?.category === 'network' || error?.category === 'connection') {
          setError(null);
          setFallbackState(null);
        }
      },
      () => {
        setNetworkStatus(false);
        // Set offline error state
        const offlineError = ErrorHandler.categorizeError('Network connection lost');
        setError(offlineError);
        setFallbackState(ErrorHandler.createFallbackState(offlineError));
      }
    );

    return cleanup;
  }, [error]);

  const handleError = useCallback((errorInput: unknown) => {
    const errorInfo = ErrorHandler.categorizeError(errorInput);
    const sanitizedError = {
      ...errorInfo,
      message: ErrorHandler.sanitizeErrorMessage(errorInfo.message)
    };
    
    setError(sanitizedError);
    setFallbackState(ErrorHandler.createFallbackState(sanitizedError));
    setRetryCount(0);
    
    // Log error for monitoring (in production, this would go to error tracking service)
    console.error('Error handled:', {
      code: sanitizedError.code,
      category: sanitizedError.category,
      severity: sanitizedError.severity,
      message: sanitizedError.message,
      timestamp: new Date().toISOString()
    });
  }, []);

  const retry = useCallback(async () => {
    if (!error || !error.retryable) {
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      // Clear error state to allow retry
      setError(null);
      setFallbackState(null);
      
      // Wait a moment to show retrying state
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsRetrying(false);
    }
  }, [error]);

  const clearError = useCallback(() => {
    setError(null);
    setFallbackState(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  const executeWithRetry = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    setIsRetrying(true);
    
    try {
      const result = await ErrorHandler.executeWithRetry(
        operation,
        { maxAttempts: 3 },
        (attempt, errorInfo) => {
          setRetryCount(attempt);
          console.log(`Retry attempt ${attempt} for error:`, errorInfo.userMessage);
        }
      );

      if (result.success && result.result !== undefined) {
        clearError();
        return result.result;
      } else {
        throw result.error || new Error('Operation failed after retries');
      }
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [handleError, clearError]);

  return {
    error,
    isRetrying,
    retryCount,
    fallbackState,
    handleError,
    retry,
    clearError,
    executeWithRetry
  };
}

// Specialized hook for connection errors
export function useConnectionErrorHandler() {
  const errorHandler = useErrorHandler();
  
  const handleConnectionError = useCallback((error: unknown, operation?: () => Promise<void>) => {
    const errorInfo = ErrorHandler.categorizeError(error);
    
    // Auto-retry connection errors
    if ((errorInfo.category === 'connection' || errorInfo.category === 'network') && 
        errorInfo.retryable && operation) {
      
      ErrorHandler.executeWithRetry(
        operation,
        { maxAttempts: 3, baseDelay: 2000 },
        (attempt) => {
          console.log(`Connection retry attempt ${attempt}`);
        }
      ).catch((finalError) => {
        errorHandler.handleError(finalError);
      });
    } else {
      errorHandler.handleError(error);
    }
  }, [errorHandler]);

  return {
    ...errorHandler,
    handleConnectionError
  };
}