// Performance monitoring and optimization utilities
export interface LatencyMeasurement {
  id: string;
  type: 'input_start' | 'input_end' | 'processing_start' | 'processing_end' | 'output_start' | 'output_end' | 'roundtrip';
  timestamp: number;
  duration?: number;
  details?: Record<string, unknown>;
}

export interface PerformanceMetrics {
  latency: {
    input: number;           // Voice input capture latency
    processing: number;      // AI processing latency
    output: number;          // Audio output latency
    roundtrip: number;       // Total end-to-end latency
    average: number;         // Average latency over session
  };
  audio: {
    sampleRate: number;
    bufferSize: number;
    inputLevel: number;
    outputLevel: number;
    dropouts: number;
    quality: 'low' | 'medium' | 'high';
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    bufferMemory: number;
    leaks: number;
  };
  network: {
    bandwidth: number;
    packetLoss: number;
    jitter: number;
    connectionType: string;
  };
  battery?: {
    level: number;
    charging: boolean;
    estimatedTimeRemaining?: number;
  };
}

export interface PerformanceReport {
  sessionId: string;
  duration: number;
  metrics: PerformanceMetrics;
  issues: PerformanceIssue[];
  recommendations: string[];
  timestamp: Date;
}

export interface PerformanceIssue {
  type: 'latency' | 'memory' | 'audio' | 'network' | 'battery';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  suggestions: string[];
}

/**
 * PerformanceMonitor - Comprehensive performance monitoring and analysis system
 * 
 * Provides real-time monitoring of voice conversation performance including:
 * - Latency measurement and validation (<500ms requirement)
 * - Audio quality monitoring and dropout detection
 * - Memory usage tracking and leak detection
 * - Network performance analysis
 * - Battery usage monitoring (mobile devices)
 * - Performance issue analysis and recommendations
 */
export class PerformanceMonitor {
  private measurements: Map<string, LatencyMeasurement> = new Map();
  private metrics: Partial<PerformanceMetrics> = {};
  private sessionStart: number = Date.now();
  private sessionId: string = crypto.randomUUID();
  private memorySnapshots: number[] = [];
  private audioDropouts: number = 0;
  private performanceObserver?: PerformanceObserver;

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Only initialize monitoring in browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    // Initialize Performance Observer for detailed metrics
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      try {
        this.performanceObserver.observe({ 
          entryTypes: ['measure', 'navigation', 'resource'] 
        });
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }

    // Memory monitoring
    this.startMemoryMonitoring();
    
    // Network monitoring
    this.startNetworkMonitoring();
    
    // Battery monitoring (if supported)
    this.startBatteryMonitoring();
  }

  // Latency measurement methods
  /**
   * Starts a latency measurement for performance tracking
   * 
   * Initiates timing measurement for various voice conversation operations.
   * Uses Performance API for high-precision measurements when available.
   * 
   * @param id - Unique identifier for this measurement
   * @param type - Type of latency being measured (input, processing, output, roundtrip)
   * @param details - Optional additional metadata for the measurement
   */
  startLatencyMeasurement(id: string, type: LatencyMeasurement['type'], details?: Record<string, unknown>) {
    const measurement: LatencyMeasurement = {
      id,
      type,
      timestamp: performance.now(),
      details
    };
    
    this.measurements.set(id, measurement);
    
    // Mark start for Performance API
    if ('mark' in performance) {
      performance.mark(`${id}-start`);
    }
  }

  endLatencyMeasurement(id: string): number | null {
    const startMeasurement = this.measurements.get(id);
    if (!startMeasurement) {
      console.warn(`No start measurement found for ${id}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startMeasurement.timestamp;
    
    // Update measurement with duration
    startMeasurement.duration = duration;
    
    // Create Performance API measure
    if ('mark' in performance && 'measure' in performance) {
      try {
        performance.mark(`${id}-end`);
        performance.measure(id, `${id}-start`, `${id}-end`);
      } catch (error) {
        console.warn('Performance measure failed:', error);
      }
    }

    // Update metrics based on measurement type
    this.updateLatencyMetrics(startMeasurement.type, duration);
    
    console.log(`📊 Latency [${startMeasurement.type}]: ${Math.round(duration)}ms`);
    
    return duration;
  }

  private updateLatencyMetrics(type: LatencyMeasurement['type'], duration: number) {
    if (!this.metrics.latency) {
      this.metrics.latency = {
        input: 0,
        processing: 0,
        output: 0,
        roundtrip: 0,
        average: 0
      };
    }

    switch (type) {
      case 'input_end':
        this.metrics.latency.input = duration;
        break;
      case 'processing_end':
        this.metrics.latency.processing = duration;
        break;
      case 'output_end':
        this.metrics.latency.output = duration;
        break;
      case 'roundtrip':
        this.metrics.latency.roundtrip = duration;
        this.updateAverageLatency(duration);
        break;
    }
  }

  private updateAverageLatency(newLatency: number) {
    if (!this.metrics.latency) return;
    
    const measurements = Array.from(this.measurements.values())
      .filter(m => m.type === 'roundtrip' && m.duration)
      .map(m => m.duration!);
    
    this.metrics.latency.average = measurements.length > 0 
      ? measurements.reduce((sum, lat) => sum + lat, 0) / measurements.length 
      : newLatency;
  }

  // Audio quality monitoring
  updateAudioMetrics(metrics: {
    sampleRate?: number;
    bufferSize?: number;
    inputLevel?: number;
    outputLevel?: number;
    quality?: 'low' | 'medium' | 'high';
  }) {
    if (!this.metrics.audio) {
      this.metrics.audio = {
        sampleRate: 44100,
        bufferSize: 512,
        inputLevel: 0,
        outputLevel: 0,
        dropouts: 0,
        quality: 'medium'
      };
    }

    Object.assign(this.metrics.audio, metrics);
  }

  reportAudioDropout() {
    this.audioDropouts++;
    if (this.metrics.audio) {
      this.metrics.audio.dropouts = this.audioDropouts;
    }
    console.warn(`🔊 Audio dropout detected (total: ${this.audioDropouts})`);
  }

  // Memory monitoring
  private startMemoryMonitoring() {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return;
    }
    
    if ('memory' in performance) {
      const updateMemoryMetrics = () => {
        const memInfo = (performance as any).memory;
        const heapUsed = memInfo.usedJSHeapSize;
        const heapTotal = memInfo.totalJSHeapSize;
        
        this.memorySnapshots.push(heapUsed);
        
        // Keep only last 100 snapshots
        if (this.memorySnapshots.length > 100) {
          this.memorySnapshots.shift();
        }

        this.metrics.memory = {
          heapUsed: Math.round(heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(heapTotal / 1024 / 1024), // MB
          bufferMemory: this.estimateBufferMemory(),
          leaks: this.detectMemoryLeaks()
        };
      };

      // Update every 5 seconds
      setInterval(updateMemoryMetrics, 5000);
      updateMemoryMetrics(); // Initial measurement
    }
  }

  private estimateBufferMemory(): number {
    // Estimate memory used by audio buffers (rough calculation)
    const audioMetrics = this.metrics.audio;
    if (!audioMetrics) return 0;
    
    const bufferSizeBytes = audioMetrics.bufferSize * 4; // Float32 = 4 bytes
    const estimatedBuffers = 10; // Estimate multiple buffers in pipeline
    return Math.round(bufferSizeBytes * estimatedBuffers / 1024); // KB
  }

  private detectMemoryLeaks(): number {
    if (this.memorySnapshots.length < 10) return 0;
    
    const recent = this.memorySnapshots.slice(-10);
    const older = this.memorySnapshots.slice(-20, -10);
    
    if (older.length === 0) return 0;
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const growthRate = (recentAvg - olderAvg) / olderAvg;
    
    // Consider it a potential leak if memory grew > 10%
    return growthRate > 0.1 ? Math.round(growthRate * 100) : 0;
  }

  // Network monitoring
  private startNetworkMonitoring() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('connection' in navigator)) {
      return;
    }
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkMetrics = () => {
        this.metrics.network = {
          bandwidth: connection.downlink || 0,
          packetLoss: 0, // Would need WebRTC stats API
          jitter: 0,     // Would need WebRTC stats API
          connectionType: connection.effectiveType || 'unknown'
        };
      };

      connection.addEventListener('change', updateNetworkMetrics);
      updateNetworkMetrics(); // Initial measurement
    }
  }

  // Battery monitoring
  private async startBatteryMonitoring() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('getBattery' in navigator)) {
      return;
    }
    
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        
        const updateBatteryMetrics = () => {
          this.metrics.battery = {
            level: Math.round(battery.level * 100),
            charging: battery.charging,
            estimatedTimeRemaining: battery.dischargingTime !== Infinity 
              ? Math.round(battery.dischargingTime / 60) // minutes
              : undefined
          };
        };

        battery.addEventListener('levelchange', updateBatteryMetrics);
        battery.addEventListener('chargingchange', updateBatteryMetrics);
        updateBatteryMetrics(); // Initial measurement
      } catch (error) {
        console.warn('Battery API not available:', error);
      }
    }
  }

  // Performance analysis
  analyzePerformance(): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    
    // Latency analysis
    if (this.metrics.latency) {
      const { roundtrip, average } = this.metrics.latency;
      
      if (roundtrip > 500) {
        issues.push({
          type: 'latency',
          severity: roundtrip > 1000 ? 'critical' : 'high',
          message: `High latency detected: ${Math.round(roundtrip)}ms`,
          value: roundtrip,
          threshold: 500,
          suggestions: [
            'Check network connection stability',
            'Consider lowering audio quality settings',
            'Close other bandwidth-intensive applications'
          ]
        });
      }
      
      if (average > 400) {
        issues.push({
          type: 'latency',
          severity: 'medium',
          message: `Average latency is elevated: ${Math.round(average)}ms`,
          value: average,
          threshold: 400,
          suggestions: [
            'Monitor network conditions',
            'Consider audio optimization settings'
          ]
        });
      }
    }

    // Memory analysis
    if (this.metrics.memory) {
      const { heapUsed, leaks } = this.metrics.memory;
      
      if (heapUsed > 100) {
        issues.push({
          type: 'memory',
          severity: heapUsed > 200 ? 'high' : 'medium',
          message: `High memory usage: ${heapUsed}MB`,
          value: heapUsed,
          threshold: 100,
          suggestions: [
            'Close other browser tabs',
            'Restart the browser if issues persist',
            'Check for memory leaks in development'
          ]
        });
      }
      
      if (leaks > 15) {
        issues.push({
          type: 'memory',
          severity: 'high',
          message: `Potential memory leak detected: ${leaks}% growth`,
          value: leaks,
          threshold: 15,
          suggestions: [
            'Refresh the page to reset memory usage',
            'Report this issue to developers'
          ]
        });
      }
    }

    // Audio analysis
    if (this.metrics.audio && this.metrics.audio.dropouts > 3) {
      issues.push({
        type: 'audio',
        severity: this.metrics.audio.dropouts > 10 ? 'high' : 'medium',
        message: `Audio dropouts detected: ${this.metrics.audio.dropouts}`,
        value: this.metrics.audio.dropouts,
        threshold: 3,
        suggestions: [
          'Check audio device connections',
          'Reduce audio quality if needed',
          'Close other audio applications'
        ]
      });
    }

    // Battery analysis (mobile)
    if (this.metrics.battery && this.metrics.battery.level < 20) {
      issues.push({
        type: 'battery',
        severity: this.metrics.battery.level < 10 ? 'high' : 'medium',
        message: `Low battery: ${this.metrics.battery.level}%`,
        value: this.metrics.battery.level,
        threshold: 20,
        suggestions: [
          'Consider charging your device',
          'Enable battery saver mode',
          'Reduce audio quality to conserve power'
        ]
      });
    }

    return issues;
  }

  // Generate performance report
  generateReport(): PerformanceReport {
    const sessionDuration = (Date.now() - this.sessionStart) / 1000; // seconds
    const issues = this.analyzePerformance();
    
    const recommendations: string[] = [];
    
    // Generate recommendations based on performance
    if (this.metrics.latency?.average && this.metrics.latency.average < 300) {
      recommendations.push('✅ Excellent latency performance - optimal for real-time conversations');
    } else if (this.metrics.latency?.average && this.metrics.latency.average < 500) {
      recommendations.push('⚠️ Good latency but could be improved with network optimization');
    } else {
      recommendations.push('❌ High latency detected - check network and device performance');
    }
    
    if (this.metrics.memory?.heapUsed && this.metrics.memory.heapUsed < 50) {
      recommendations.push('✅ Efficient memory usage');
    } else {
      recommendations.push('⚠️ Consider optimizing memory usage');
    }
    
    if (this.metrics.audio?.dropouts && this.metrics.audio.dropouts === 0) {
      recommendations.push('✅ Stable audio performance');
    } else {
      recommendations.push('⚠️ Audio stability could be improved');
    }

    return {
      sessionId: this.sessionId,
      duration: sessionDuration,
      metrics: this.metrics as PerformanceMetrics,
      issues,
      recommendations,
      timestamp: new Date()
    };
  }

  private processPerformanceEntry(entry: PerformanceEntry) {
    // Process Performance API entries for additional insights
    if (entry.entryType === 'measure') {
      console.log(`📏 Performance measure: ${entry.name} = ${Math.round(entry.duration)}ms`);
    }
  }

  // Cleanup
  destroy() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.measurements.clear();
    this.memorySnapshots = [];
  }

  // Export data for analysis
  exportData(): string {
    const report = this.generateReport();
    return JSON.stringify({
      report,
      rawMeasurements: Array.from(this.measurements.values()),
      memorySnapshots: this.memorySnapshots
    }, null, 2);
  }

  // Static utility methods
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round(bytes / Math.pow(k, i))} ${sizes[i]}`;
  }

  static formatLatency(ms: number): string {
    if (ms < 100) return `${Math.round(ms)}ms (Excellent)`;
    if (ms < 300) return `${Math.round(ms)}ms (Good)`;
    if (ms < 500) return `${Math.round(ms)}ms (Acceptable)`;
    return `${Math.round(ms)}ms (Poor)`;
  }
}

// Global performance monitor instance for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as Record<string, unknown>).performanceMonitor = new PerformanceMonitor();
  console.log('📊 Performance monitor available at window.performanceMonitor');
}