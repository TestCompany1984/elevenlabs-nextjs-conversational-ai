"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from 'lucide-react';

interface NetworkStatusProps {
  onRetryConnection?: () => void;
  isRetrying?: boolean;
}

export function NetworkStatus({ onRetryConnection, isRetrying = false }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      setReconnectAttempts(0);
      
      // Auto-retry connection when back online
      if (onRetryConnection && reconnectAttempts > 0) {
        setTimeout(() => {
          onRetryConnection();
        }, 1000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show offline message if already offline
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onRetryConnection, reconnectAttempts]);

  const handleRetryClick = () => {
    setReconnectAttempts(prev => prev + 1);
    onRetryConnection?.();
  };

  if (!showOfflineMessage) {
    return null;
  }

  return (
    <Card className="border-2 border-orange-300 bg-orange-50 shadow-md mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-orange-500" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <h3 className="font-semibold text-orange-800">
                {isOnline ? 'Connection Restored' : 'No Internet Connection'}
              </h3>
            </div>
            
            <p className="text-sm text-orange-700 mb-3">
              {isOnline 
                ? 'Your internet connection has been restored. You can now use voice features.'
                : 'Voice conversations require an internet connection. Please check your network settings and try again.'
              }
            </p>

            {!isOnline && (
              <div className="text-xs text-orange-600 mb-3">
                💡 Troubleshooting tips:
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Check your WiFi or ethernet connection</li>
                  <li>Try refreshing the page</li>
                  <li>Contact your network administrator if the issue persists</li>
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2">
              {isOnline && onRetryConnection && (
                <Button
                  size="sm"
                  onClick={handleRetryClick}
                  disabled={isRetrying}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                  Reconnect
                </Button>
              )}
              
              {!isOnline && (
                <div className="flex items-center gap-1 text-xs text-orange-600 bg-white px-2 py-1 rounded-full border border-orange-200">
                  <WifiOff className="h-3 w-3" />
                  Offline Mode
                </div>
              )}
              
              {reconnectAttempts > 0 && (
                <span className="text-xs text-orange-600">
                  Retry attempts: {reconnectAttempts}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simplified network indicator for status bars
export function NetworkIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
      isOnline 
        ? 'text-green-700 bg-green-100 border border-green-300' 
        : 'text-red-700 bg-red-100 border border-red-300'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          Online
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          Offline
        </>
      )}
    </div>
  );
}