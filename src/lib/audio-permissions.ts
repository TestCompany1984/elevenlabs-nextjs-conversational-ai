import { AudioPermissions } from "@/types";

/**
 * AudioPermissionManager - Manages microphone and speaker permissions
 * 
 * Provides comprehensive audio permission management with cross-browser compatibility,
 * graceful error handling, and user-friendly permission request flows.
 */
export class AudioPermissionManager {
  private permissionStatus: AudioPermissions = {
    microphone: 'unknown',
    speaker: 'granted' // Speakers don't require explicit permission
  };

  private permissionChangeCallbacks: Array<(permissions: AudioPermissions) => void> = [];

  /**
   * Requests microphone permission from the user
   * 
   * Attempts to request microphone access using the MediaDevices API.
   * Handles permission state tracking and provides detailed error messages
   * for different failure scenarios.
   * 
   * @returns Promise<AudioPermissions> - Updated permission status
   * @throws Error with user-friendly message on permission denial
   */
  async requestMicrophonePermission(): Promise<AudioPermissions> {
    try {
      // Check if permissions API is available
      if ('permissions' in navigator) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        this.updateMicrophoneStatus(permissionStatus.state as any);
        
        // Listen for permission changes
        permissionStatus.onchange = () => {
          this.updateMicrophoneStatus(permissionStatus.state as any);
        };
      }

      // Request microphone access
      const stream = await (navigator as any).mediaDevices.getUserMedia({ audio: true });
      
      // Immediately stop the stream since we only need permission
      stream.getTracks().forEach((track: any) => track.stop());
      
      this.updateMicrophoneStatus('granted');
      return this.permissionStatus;
      
    } catch (error) {
      console.error('Microphone permission denied:', error);
      this.updateMicrophoneStatus('denied');
      throw new Error(this.getPermissionErrorMessage(error));
    }
  }

  async checkMicrophonePermission(): Promise<AudioPermissions> {
    try {
      if ('permissions' in navigator) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        this.updateMicrophoneStatus(permissionStatus.state as any);
      } else {
        // Fallback: try to access microphone to check permission
        try {
          const nav = navigator as any;
          if (nav.mediaDevices && nav.mediaDevices.getUserMedia) {
            const stream = await nav.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track: any) => track.stop());
            this.updateMicrophoneStatus('granted');
          } else {
            this.updateMicrophoneStatus('unknown');
          }
        } catch {
          this.updateMicrophoneStatus('denied');
        }
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      this.updateMicrophoneStatus('unknown');
    }
    
    return this.permissionStatus;
  }

  private updateMicrophoneStatus(status: 'granted' | 'denied' | 'prompt' | 'unknown') {
    const oldStatus = this.permissionStatus.microphone;
    this.permissionStatus.microphone = status;
    
    if (oldStatus !== status) {
      this.notifyPermissionChange();
    }
  }

  private notifyPermissionChange() {
    this.permissionChangeCallbacks.forEach(callback => {
      try {
        callback({ ...this.permissionStatus });
      } catch (error) {
        console.error('Error in permission change callback:', error);
      }
    });
  }

  onPermissionChange(callback: (permissions: AudioPermissions) => void) {
    this.permissionChangeCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.permissionChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.permissionChangeCallbacks.splice(index, 1);
      }
    };
  }

  getCurrentPermissions(): AudioPermissions {
    return { ...this.permissionStatus };
  }

  private getPermissionErrorMessage(error: any): string {
    if (error?.name === 'NotAllowedError') {
      return 'Microphone access was denied. Please check your browser settings and allow microphone access.';
    } else if (error?.name === 'NotFoundError') {
      return 'No microphone found. Please connect a microphone and try again.';
    } else if (error?.name === 'NotReadableError') {
      return 'Microphone is already in use by another application.';
    } else if (error?.name === 'OverconstrainedError') {
      return 'Microphone constraints could not be satisfied.';
    } else if (error?.name === 'SecurityError') {
      return 'Microphone access blocked due to security settings.';
    }
    
    return 'Unable to access microphone. Please check your browser settings.';
  }

  getBrowserSpecificInstructions(): string {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'Please check your browser settings to allow microphone access for this site.';
    }
    
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') || userAgent.includes('chromium')) {
      return 'Click the microphone icon in the address bar or go to Chrome Settings > Privacy and security > Site settings > Microphone.';
    } else if (userAgent.includes('firefox')) {
      return 'Click the microphone icon next to the address bar or go to Firefox Preferences > Privacy & Security > Permissions.';
    } else if (userAgent.includes('safari')) {
      return 'Go to Safari Preferences > Websites > Microphone and allow access for this site.';
    } else if (userAgent.includes('edge')) {
      return 'Click the microphone icon in the address bar or go to Edge Settings > Cookies and site permissions > Microphone.';
    }
    
    return 'Please check your browser settings to allow microphone access for this site.';
  }

  isHttpsRequired(): boolean {
    if (typeof window === 'undefined' || typeof location === 'undefined') {
      return false;
    }
    return location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';
  }
}