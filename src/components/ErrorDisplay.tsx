"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Mic, 
  Settings, 
  X,
  Info,
  AlertTriangle
} from 'lucide-react';
import { ErrorInfo } from '@/lib/error-handler';

interface ErrorDisplayProps {
  error: ErrorInfo;
  isRetrying?: boolean;
  retryCount?: number;
  fallbackState?: {
    isOffline: boolean;
    hasNetworkIssue: boolean;
    canRetry: boolean;
    recommendedAction: string;
  } | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

export function ErrorDisplay({
  error,
  isRetrying = false,
  retryCount = 0,
  fallbackState,
  onRetry,
  onDismiss,
  showDetails = false
}: ErrorDisplayProps) {
  const getSeverityIcon = () => {
    switch (error.severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <Info className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getCategoryIcon = () => {
    switch (error.category) {
      case 'network':
      case 'connection':
        return fallbackState?.isOffline ? 
          <WifiOff className="h-4 w-4" /> : 
          <Wifi className="h-4 w-4" />;
      case 'permission':
      case 'audio':
        return <Mic className="h-4 w-4" />;
      case 'session':
        return <Settings className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = () => {
    switch (error.severity) {
      case 'critical':
        return 'border-red-300 bg-red-50';
      case 'high':
        return 'border-orange-300 bg-orange-50';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50';
      default:
        return 'border-blue-300 bg-blue-50';
    }
  };

  const getTextColor = () => {
    switch (error.severity) {
      case 'critical':
        return 'text-red-800';
      case 'high':
        return 'text-orange-800';
      case 'medium':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  const getRetryButtonText = () => {
    if (isRetrying) {
      return retryCount > 0 ? `Retrying... (${retryCount})` : 'Retrying...';
    }
    return fallbackState?.isOffline ? 'Try When Online' : 'Try Again';
  };

  return (
    <Card className={`border-2 ${getSeverityColor()} shadow-md transition-all duration-300`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-0.5">
            {getSeverityIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getCategoryIcon()}
              <h3 className={`font-semibold ${getTextColor()}`}>
                {error.category === 'network' && fallbackState?.isOffline
                  ? 'No Internet Connection'
                  : error.category === 'connection'
                  ? 'Connection Issue'
                  : error.category === 'permission'
                  ? 'Permission Required' 
                  : error.category === 'audio'
                  ? 'Audio Issue'
                  : error.category === 'session'
                  ? 'Session Error'
                  : 'Error Occurred'}
              </h3>
              
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`ml-auto p-1 rounded-full hover:bg-white/50 transition-colors ${getTextColor()}`}
                  aria-label="Dismiss error"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <p className={`text-sm ${getTextColor()} mb-3 leading-relaxed`}>
              {error.userMessage}
            </p>

            {fallbackState?.recommendedAction && (
              <p className={`text-xs ${getTextColor()} opacity-75 mb-3 leading-relaxed`}>
                💡 {fallbackState.recommendedAction}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {error.retryable && onRetry && (
                <Button
                  size="sm"
                  onClick={onRetry}
                  disabled={isRetrying || fallbackState?.isOffline}
                  className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-sm"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                  {getRetryButtonText()}
                </Button>
              )}

              {fallbackState?.isOffline && (
                <div className="flex items-center gap-1 text-xs text-gray-600 bg-white px-2 py-1 rounded-full border border-gray-200">
                  <WifiOff className="h-3 w-3" />
                  Offline
                </div>
              )}

              {showDetails && (
                <details className="mt-2 w-full">
                  <summary className="text-xs cursor-pointer text-gray-600 hover:text-gray-800">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-2 bg-white rounded border text-xs font-mono text-gray-700 overflow-auto">
                    <div><strong>Code:</strong> {error.code}</div>
                    <div><strong>Category:</strong> {error.category}</div>
                    <div><strong>Severity:</strong> {error.severity}</div>
                    <div><strong>Recoverable:</strong> {error.recoverable ? 'Yes' : 'No'}</div>
                    <div><strong>Retryable:</strong> {error.retryable ? 'Yes' : 'No'}</div>
                    {retryCount > 0 && (
                      <div><strong>Retry Attempts:</strong> {retryCount}</div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simplified error toast component
export function ErrorToast({ 
  error, 
  onDismiss 
}: { 
  error: ErrorInfo; 
  onDismiss: () => void;
}) {
  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm transform transition-all duration-300 ease-in-out`}>
      <div className={`
        rounded-lg shadow-lg border-l-4 p-4 
        ${error.severity === 'critical' ? 'bg-red-50 border-red-400' :
          error.severity === 'high' ? 'bg-orange-50 border-orange-400' :
          error.severity === 'medium' ? 'bg-yellow-50 border-yellow-400' :
          'bg-blue-50 border-blue-400'}
      `}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className={`h-5 w-5 ${
              error.severity === 'critical' ? 'text-red-400' :
              error.severity === 'high' ? 'text-orange-400' :
              error.severity === 'medium' ? 'text-yellow-400' :
              'text-blue-400'
            }`} />
          </div>
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${
              error.severity === 'critical' ? 'text-red-800' :
              error.severity === 'high' ? 'text-orange-800' :
              error.severity === 'medium' ? 'text-yellow-800' :
              'text-blue-800'
            }`}>
              {error.userMessage}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onDismiss}
              className={`rounded-md inline-flex ${
                error.severity === 'critical' ? 'text-red-400 hover:text-red-600' :
                error.severity === 'high' ? 'text-orange-400 hover:text-orange-600' :
                error.severity === 'medium' ? 'text-yellow-400 hover:text-yellow-600' :
                'text-blue-400 hover:text-blue-600'
              } focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}