"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, AlertCircle, Shield, Settings } from "lucide-react";
import { AudioPermissions } from "@/types";

interface PermissionModalProps {
  isOpen: boolean;
  permissions: AudioPermissions;
  onRequestPermission: () => Promise<void>;
  onClose: () => void;
  browserInstructions: string;
  isHttpsRequired: boolean;
}

const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  permissions,
  onRequestPermission,
  onClose,
  browserInstructions,
  isHttpsRequired
}) => {
  if (!isOpen) return null;

  const isPermissionDenied = permissions.microphone === 'denied';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isHttpsRequired ? (
              <>
                <Shield className="h-5 w-5 text-red-500" />
                HTTPS Required
              </>
            ) : isPermissionDenied ? (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                Microphone Access Denied
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 text-blue-500" />
                Microphone Permission Required
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isHttpsRequired ? (
            <div className="space-y-3">
              <p className="text-sm text-red-600">
                This application requires HTTPS to access your microphone for security reasons.
              </p>
              <p className="text-sm text-gray-600">
                Please access this application through a secure HTTPS connection or run it locally.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>For development:</strong> Use localhost or 127.0.0.1, or set up HTTPS certificates.
                </p>
              </div>
            </div>
          ) : isPermissionDenied ? (
            <div className="space-y-3">
              <p className="text-sm text-red-600">
                Microphone access has been blocked. To use voice chat, you&apos;ll need to allow microphone access in your browser settings.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-semibold text-sm text-blue-800 mb-2">How to enable microphone access:</h4>
                <p className="text-xs text-blue-700">{browserInstructions}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={onRequestPermission}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={onClose}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                This application needs access to your microphone to enable voice conversations with the AI assistant.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-semibold text-sm text-green-800 mb-2">Your privacy is protected:</h4>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Voice data is processed in real-time</li>
                  <li>• No audio recordings are stored permanently</li>
                  <li>• Secure connection to ElevenLabs</li>
                  <li>• You can revoke access anytime</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={onRequestPermission}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Allow Microphone
                </Button>
                <Button 
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {!isHttpsRequired && (
            <div className="pt-2 border-t">
              <button 
                onClick={onClose}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 mx-auto"
              >
                <Settings className="h-3 w-3" />
                Advanced Settings
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionModal;