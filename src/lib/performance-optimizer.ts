// Performance optimization utilities
import { PerformanceMonitor, PerformanceMetrics, PerformanceIssue } from './performance-monitor';

export interface OptimizationSettings {
  audioQuality: 'low' | 'medium' | 'high';
  bufferSize: 256 | 512 | 1024 | 2048;
  sampleRate: 16000 | 22050 | 44100 | 48000;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  adaptiveMode: boolean;
}

export interface OptimizationProfile {
  name: string;
  description: string;
  settings: OptimizationSettings;
  criteria: {
    maxLatency: number;
    minBandwidth: number;
    maxMemoryUsage: number;
    batteryThreshold?: number;
  };
}

export class PerformanceOptimizer {
  private monitor: PerformanceMonitor;
  private currentSettings: OptimizationSettings;
  private optimizationProfiles: OptimizationProfile[];
  private adaptiveOptimization: boolean = true;
  private lastOptimizationTime: number = 0;
  private optimizationInterval: number = 30000; // 30 seconds

  constructor(monitor: PerformanceMonitor) {
    this.monitor = monitor;
    this.currentSettings = this.getDefaultSettings();
    this.optimizationProfiles = this.createOptimizationProfiles();
    
    if (this.adaptiveOptimization) {
      this.startAdaptiveOptimization();
    }
  }

  private getDefaultSettings(): OptimizationSettings {
    return {
      audioQuality: 'medium',
      bufferSize: 512,
      sampleRate: 44100,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      adaptiveMode: true
    };
  }

  private createOptimizationProfiles(): OptimizationProfile[] {
    return [
      {
        name: 'Ultra Performance',
        description: 'Minimum latency, maximum responsiveness',
        settings: {
          audioQuality: 'low',
          bufferSize: 256,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
          adaptiveMode: true
        },
        criteria: {
          maxLatency: 200,
          minBandwidth: 0.5,
          maxMemoryUsage: 30
        }
      },
      {
        name: 'Balanced',
        description: 'Good balance of quality and performance',
        settings: {
          audioQuality: 'medium',
          bufferSize: 512,
          sampleRate: 22050,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          adaptiveMode: true
        },
        criteria: {
          maxLatency: 400,
          minBandwidth: 1.0,
          maxMemoryUsage: 50
        }
      },
      {
        name: 'High Quality',
        description: 'Best audio quality, higher resource usage',
        settings: {
          audioQuality: 'high',
          bufferSize: 1024,
          sampleRate: 44100,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          adaptiveMode: true
        },
        criteria: {
          maxLatency: 600,
          minBandwidth: 2.0,
          maxMemoryUsage: 80
        }
      },
      {
        name: 'Battery Saver',
        description: 'Optimized for mobile battery life',
        settings: {
          audioQuality: 'low',
          bufferSize: 1024,
          sampleRate: 16000,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          adaptiveMode: true
        },
        criteria: {
          maxLatency: 800,
          minBandwidth: 0.5,
          maxMemoryUsage: 25,
          batteryThreshold: 30
        }
      },
      {
        name: 'Network Saver',
        description: 'Optimized for slow network connections',
        settings: {
          audioQuality: 'low',
          bufferSize: 2048,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
          adaptiveMode: true
        },
        criteria: {
          maxLatency: 1000,
          minBandwidth: 0.3,
          maxMemoryUsage: 40
        }
      }
    ];
  }

  // Analyze current performance and suggest optimizations
  analyzeAndOptimize(): {
    currentProfile: string;
    suggestedProfile: string;
    optimizations: string[];
    settingsChanged: boolean;
  } {
    const report = this.monitor.generateReport();
    const issues = report.issues;
    const metrics = report.metrics;

    const currentProfile = this.detectCurrentProfile();
    const suggestedProfile = this.selectOptimalProfile(metrics, issues);
    const optimizations: string[] = [];
    let settingsChanged = false;

    // Analyze specific issues and suggest optimizations
    issues.forEach(issue => {
      switch (issue.type) {
        case 'latency':
          if (issue.severity === 'critical' || issue.severity === 'high') {
            optimizations.push('Reduce audio quality to decrease latency');
            optimizations.push('Decrease buffer size for faster processing');
            optimizations.push('Disable non-essential audio processing');
          }
          break;
          
        case 'memory':
          optimizations.push('Enable memory cleanup optimizations');
          optimizations.push('Reduce buffer sizes to save memory');
          if (issue.severity === 'high') {
            optimizations.push('Consider restarting the session');
          }
          break;
          
        case 'audio':
          optimizations.push('Increase buffer size to reduce dropouts');
          optimizations.push('Check audio device stability');
          break;
          
        case 'network':
          optimizations.push('Enable network-optimized settings');
          optimizations.push('Reduce audio quality for better stability');
          break;
          
        case 'battery':
          optimizations.push('Enable battery saver mode');
          optimizations.push('Reduce processing-intensive features');
          break;
      }
    });

    // Apply optimizations if different profile is recommended
    if (suggestedProfile !== currentProfile) {
      const newProfile = this.optimizationProfiles.find(p => p.name === suggestedProfile);
      if (newProfile) {
        this.applyOptimizationProfile(newProfile);
        settingsChanged = true;
        optimizations.push(`Switched to ${suggestedProfile} profile for better performance`);
      }
    }

    return {
      currentProfile,
      suggestedProfile,
      optimizations,
      settingsChanged
    };
  }

  private detectCurrentProfile(): string {
    // Detect which profile best matches current settings
    const currentSettings = this.currentSettings;
    
    for (const profile of this.optimizationProfiles) {
      const matches = Object.keys(profile.settings).every(key => {
        const profileValue = profile.settings[key as keyof OptimizationSettings];
        const currentValue = currentSettings[key as keyof OptimizationSettings];
        return profileValue === currentValue;
      });
      
      if (matches) {
        return profile.name;
      }
    }
    
    return 'Custom';
  }

  private selectOptimalProfile(metrics: PerformanceMetrics, issues: PerformanceIssue[]): string {
    // Determine device capabilities
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasLowBattery = metrics.battery && metrics.battery.level < 30;
    const hasSlowNetwork = metrics.network && metrics.network.bandwidth < 1.0;
    const hasHighLatency = metrics.latency && metrics.latency.average > 500;
    const hasMemoryIssues = issues.some(i => i.type === 'memory' && i.severity === 'high');

    // Priority-based profile selection
    if (hasLowBattery && isMobile) {
      return 'Battery Saver';
    }
    
    if (hasSlowNetwork) {
      return 'Network Saver';
    }
    
    if (hasHighLatency || hasMemoryIssues) {
      return 'Ultra Performance';
    }
    
    // Check if current performance allows for high quality
    if (metrics.latency && metrics.latency.average < 300 && 
        metrics.memory && metrics.memory.heapUsed < 50 &&
        !isMobile) {
      return 'High Quality';
    }
    
    return 'Balanced';
  }

  private applyOptimizationProfile(profile: OptimizationProfile) {
    console.group(`🚀 Applying optimization profile: ${profile.name}`);
    console.log('Description:', profile.description);
    
    const oldSettings = { ...this.currentSettings };
    this.currentSettings = { ...profile.settings };
    
    // Log changes
    Object.keys(profile.settings).forEach(key => {
      const oldValue = oldSettings[key as keyof OptimizationSettings];
      const newValue = profile.settings[key as keyof OptimizationSettings];
      if (oldValue !== newValue) {
        console.log(`  ${key}: ${oldValue} → ${newValue}`);
      }
    });
    
    console.groupEnd();
    
    // Emit event for components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('performance-optimization', {
        detail: {
          profile: profile.name,
          settings: this.currentSettings,
          timestamp: Date.now()
        }
      }));
    }
  }

  // Automatic adaptive optimization
  private startAdaptiveOptimization() {
    const optimize = () => {
      const now = Date.now();
      if (now - this.lastOptimizationTime > this.optimizationInterval) {
        const result = this.analyzeAndOptimize();
        if (result.settingsChanged) {
          console.log(`🔧 Adaptive optimization applied: ${result.suggestedProfile}`);
        }
        this.lastOptimizationTime = now;
      }
    };

    // Run optimization periodically
    setInterval(optimize, 10000); // Check every 10 seconds
  }

  // Manual optimization methods
  optimizeForLatency(): OptimizationSettings {
    const latencyProfile = this.optimizationProfiles.find(p => p.name === 'Ultra Performance')!;
    this.applyOptimizationProfile(latencyProfile);
    return this.currentSettings;
  }

  optimizeForQuality(): OptimizationSettings {
    const qualityProfile = this.optimizationProfiles.find(p => p.name === 'High Quality')!;
    this.applyOptimizationProfile(qualityProfile);
    return this.currentSettings;
  }

  optimizeForBattery(): OptimizationSettings {
    const batteryProfile = this.optimizationProfiles.find(p => p.name === 'Battery Saver')!;
    this.applyOptimizationProfile(batteryProfile);
    return this.currentSettings;
  }

  optimizeForNetwork(): OptimizationSettings {
    const networkProfile = this.optimizationProfiles.find(p => p.name === 'Network Saver')!;
    this.applyOptimizationProfile(networkProfile);
    return this.currentSettings;
  }

  // Get current settings
  getCurrentSettings(): OptimizationSettings {
    return { ...this.currentSettings };
  }

  // Update specific settings
  updateSettings(partialSettings: Partial<OptimizationSettings>) {
    this.currentSettings = { ...this.currentSettings, ...partialSettings };
    
    // Disable adaptive mode if manual changes are made
    if (!partialSettings.adaptiveMode) {
      this.currentSettings.adaptiveMode = false;
    }
    
    console.log('Performance settings updated:', partialSettings);
  }

  // Enable/disable adaptive optimization
  setAdaptiveOptimization(enabled: boolean) {
    this.adaptiveOptimization = enabled;
    this.currentSettings.adaptiveMode = enabled;
    
    if (enabled) {
      this.startAdaptiveOptimization();
      console.log('🤖 Adaptive optimization enabled');
    } else {
      console.log('🤖 Adaptive optimization disabled');
    }
  }

  // Get optimization recommendations without applying them
  getRecommendations(): {
    profile: string;
    settings: OptimizationSettings;
    reasons: string[];
    impact: string;
  } {
    const report = this.monitor.generateReport();
    const suggestedProfile = this.selectOptimalProfile(report.metrics, report.issues);
    const profile = this.optimizationProfiles.find(p => p.name === suggestedProfile)!;
    
    const reasons: string[] = [];
    let impact = 'Minimal';
    
    // Analyze reasons for recommendation
    report.issues.forEach(issue => {
      if (issue.severity === 'high' || issue.severity === 'critical') {
        reasons.push(`${issue.type} issue: ${issue.message}`);
        impact = 'Significant';
      }
    });
    
    if (report.metrics.latency && report.metrics.latency.average > 400) {
      reasons.push('High average latency detected');
      impact = 'Moderate';
    }
    
    if (report.metrics.memory && report.metrics.memory.heapUsed > 80) {
      reasons.push('High memory usage detected');
      impact = 'Moderate';
    }

    return {
      profile: suggestedProfile,
      settings: profile.settings,
      reasons,
      impact
    };
  }

  // Export optimization data
  exportOptimizationData(): string {
    return JSON.stringify({
      currentSettings: this.currentSettings,
      profiles: this.optimizationProfiles,
      adaptiveEnabled: this.adaptiveOptimization,
      lastOptimization: this.lastOptimizationTime,
      performanceReport: this.monitor.generateReport()
    }, null, 2);
  }
}

// Utility functions for performance testing
export class PerformanceTester {
  static async testLatency(iterations: number = 10): Promise<{
    measurements: number[];
    average: number;
    min: number;
    max: number;
    passes: number;
    failures: number;
  }> {
    const measurements: number[] = [];
    let passes = 0;
    let failures = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // Simulate audio processing delay
      await new Promise(resolve => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        oscillator.start();
        
        setTimeout(() => {
          oscillator.stop();
          audioContext.close();
          resolve(undefined);
        }, 10);
      });
      
      const latency = performance.now() - start;
      measurements.push(latency);
      
      if (latency <= 500) {
        passes++;
      } else {
        failures++;
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      measurements,
      average: measurements.reduce((sum, lat) => sum + lat, 0) / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      passes,
      failures
    };
  }

  static async testMemoryUsage(duration: number = 30000): Promise<{
    initial: number;
    peak: number;
    final: number;
    growth: number;
    stability: 'stable' | 'growing' | 'fluctuating';
  }> {
    if (!('memory' in performance)) {
      throw new Error('Memory API not available');
    }

    const memInfo = (performance as any).memory;
    const initial = memInfo.usedJSHeapSize;
    let peak = initial;
    const samples: number[] = [initial];

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const current = memInfo.usedJSHeapSize;
        samples.push(current);
        peak = Math.max(peak, current);
      }, 1000);

      setTimeout(() => {
        clearInterval(interval);
        
        const final = memInfo.usedJSHeapSize;
        const growth = ((final - initial) / initial) * 100;
        
        // Determine stability
        let stability: 'stable' | 'growing' | 'fluctuating' = 'stable';
        if (growth > 10) {
          stability = 'growing';
        } else {
          const variance = samples.reduce((sum, val) => {
            const diff = val - (samples.reduce((s, v) => s + v, 0) / samples.length);
            return sum + diff * diff;
          }, 0) / samples.length;
          
          if (variance > initial * 0.1) {
            stability = 'fluctuating';
          }
        }

        resolve({
          initial: Math.round(initial / 1024 / 1024), // MB
          peak: Math.round(peak / 1024 / 1024),       // MB
          final: Math.round(final / 1024 / 1024),     // MB
          growth: Math.round(growth * 10) / 10,       // %
          stability
        });
      }, duration);
    });
  }
}