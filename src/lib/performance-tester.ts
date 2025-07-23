// Comprehensive performance testing utilities
import { BrowserCompatibilityTester } from './browser-compatibility';
import { PerformanceMonitor, PerformanceMetrics } from './performance-monitor';
import { PerformanceOptimizer, PerformanceTester } from './performance-optimizer';

export interface NetworkPerformanceTest {
  name: string;
  description: string;
  connectionType: string;
  bandwidth: number;
  latency: number;
  packetLoss: number;
  results: {
    averageLatency: number;
    audioQuality: 'excellent' | 'good' | 'fair' | 'poor';
    dropouts: number;
    stability: 'stable' | 'unstable';
  };
}

export interface BatteryTest {
  testDuration: number; // minutes
  initialBattery: number; // percentage
  finalBattery: number; // percentage
  batteryDrain: number; // percentage
  drainRate: number; // percentage per hour
  performance: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface CrossBrowserTestResult {
  browser: string;
  version: string;
  compatibilityScore: number;
  criticalIssues: string[];
  performanceMetrics: PerformanceMetrics;
  latencyCompliance: boolean;
  recommendations: string[];
}

export class ComprehensivePerformanceTester {
  private monitor: PerformanceMonitor;
  private optimizer: PerformanceOptimizer;
  private browserTester: BrowserCompatibilityTester;
  private testResults: Map<string, any> = new Map();

  constructor() {
    this.monitor = new PerformanceMonitor();
    this.optimizer = new PerformanceOptimizer(this.monitor);
    this.browserTester = new BrowserCompatibilityTester();
  }

  // Network Quality Testing
  async testNetworkPerformance(): Promise<NetworkPerformanceTest[]> {
    console.group('🌐 Testing Network Performance');
    
    const networkTests: NetworkPerformanceTest[] = [];
    
    // Simulate different network conditions
    const networkConditions = [
      { name: 'High-Speed WiFi', bandwidth: 100, latency: 20, packetLoss: 0 },
      { name: 'Standard WiFi', bandwidth: 25, latency: 50, packetLoss: 0.1 },
      { name: '4G Mobile', bandwidth: 10, latency: 100, packetLoss: 0.5 },
      { name: '3G Mobile', bandwidth: 2, latency: 200, packetLoss: 2 },
      { name: 'Poor Connection', bandwidth: 1, latency: 500, packetLoss: 5 }
    ];

    for (const condition of networkConditions) {
      console.log(`Testing ${condition.name}...`);
      
      const testResult = await this.runNetworkTest(condition);
      networkTests.push(testResult);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.groupEnd();
    this.testResults.set('network', networkTests);
    return networkTests;
  }

  private async runNetworkTest(condition: {
    name: string;
    bandwidth: number;
    latency: number;
    packetLoss: number;
  }): Promise<NetworkPerformanceTest> {
    // Simulate network test with actual latency measurements
    const latencyResults = await PerformanceTester.testLatency(5);
    
    // Adjust results based on simulated network conditions
    const adjustedLatency = latencyResults.average + condition.latency;
    const audioQuality = this.determineAudioQuality(condition.bandwidth, adjustedLatency);
    const dropouts = Math.floor(condition.packetLoss * 2);
    const stability = condition.packetLoss < 1 ? 'stable' : 'unstable';

    return {
      name: condition.name,
      description: `Bandwidth: ${condition.bandwidth}Mbps, Latency: ${condition.latency}ms, Loss: ${condition.packetLoss}%`,
      connectionType: condition.name.includes('Mobile') ? 'cellular' : 'wifi',
      bandwidth: condition.bandwidth,
      latency: condition.latency,
      packetLoss: condition.packetLoss,
      results: {
        averageLatency: adjustedLatency,
        audioQuality,
        dropouts,
        stability
      }
    };
  }

  private determineAudioQuality(bandwidth: number, latency: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (bandwidth >= 10 && latency <= 100) return 'excellent';
    if (bandwidth >= 5 && latency <= 200) return 'good';
    if (bandwidth >= 2 && latency <= 400) return 'fair';
    return 'poor';
  }

  // Battery Usage Testing (Mobile)
  async testBatteryUsage(durationMinutes: number = 10): Promise<BatteryTest | null> {
    console.group('🔋 Testing Battery Usage');

    try {
      if (!('getBattery' in navigator)) {
        console.warn('Battery API not available');
        return null;
      }

      const battery = await (navigator as any).getBattery();
      const initialBattery = Math.round(battery.level * 100);
      const startTime = Date.now();

      console.log(`Starting battery test for ${durationMinutes} minutes`);
      console.log(`Initial battery level: ${initialBattery}%`);

      // Simulate intensive voice processing for testing
      const intensiveTask = setInterval(() => {
        // Simulate audio processing load
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        
        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          audioContext.close();
        }, 100);
      }, 1000);

      // Wait for test duration
      await new Promise(resolve => setTimeout(resolve, durationMinutes * 60 * 1000));

      clearInterval(intensiveTask);

      const finalBattery = Math.round(battery.level * 100);
      const batteryDrain = initialBattery - finalBattery;
      const drainRate = (batteryDrain / durationMinutes) * 60; // per hour

      let performance: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
      if (drainRate > 30) performance = 'poor';
      else if (drainRate > 20) performance = 'fair';
      else if (drainRate > 10) performance = 'good';

      const result: BatteryTest = {
        testDuration: durationMinutes,
        initialBattery,
        finalBattery,
        batteryDrain,
        drainRate,
        performance
      };

      console.log('Battery test results:', result);
      console.groupEnd();

      this.testResults.set('battery', result);
      return result;
    } catch (error) {
      console.error('Battery test failed:', error);
      console.groupEnd();
      return null;
    }
  }

  // Cross-Browser Compatibility Testing
  async testCrossBrowserCompatibility(): Promise<CrossBrowserTestResult> {
    console.group('🧪 Testing Cross-Browser Compatibility');

    const compatibilityResults = await this.browserTester.runAllTests();
    const summary = this.browserTester.getTestSummary();
    
    // Run performance benchmarks
    const latencyResults = await PerformanceTester.testLatency(10);
    const memoryResults = await PerformanceTester.testMemoryUsage(5000);

    // Create mock performance metrics for compatibility testing
    const performanceMetrics: PerformanceMetrics = {
      latency: {
        input: latencyResults.average * 0.3,
        processing: latencyResults.average * 0.4,
        output: latencyResults.average * 0.3,
        roundtrip: latencyResults.average,
        average: latencyResults.average
      },
      audio: {
        sampleRate: 44100,
        bufferSize: 512,
        inputLevel: 0.5,
        outputLevel: 0.7,
        dropouts: latencyResults.failures,
        quality: 'medium'
      },
      memory: {
        heapUsed: memoryResults.final,
        heapTotal: memoryResults.peak,
        bufferMemory: 2,
        leaks: memoryResults.growth > 10 ? memoryResults.growth : 0
      },
      network: {
        bandwidth: 10,
        packetLoss: 0,
        jitter: 10,
        connectionType: 'wifi'
      }
    };

    const result: CrossBrowserTestResult = {
      browser: `${summary.browser.name} ${summary.browser.version}`,
      version: summary.browser.version,
      compatibilityScore: summary.compatibilityScore,
      criticalIssues: summary.criticalIssues,
      performanceMetrics,
      latencyCompliance: latencyResults.average <= 500,
      recommendations: summary.recommendations
    };

    console.log('Cross-browser compatibility results:', result);
    console.groupEnd();

    this.testResults.set('browser', result);
    return result;
  }

  // Memory Usage Optimization Testing
  async testMemoryOptimization(): Promise<{
    baseline: number;
    optimized: number;
    improvement: number;
    leaksDetected: boolean;
    recommendations: string[];
  }> {
    console.group('🧠 Testing Memory Optimization');

    const baselineTest = await PerformanceTester.testMemoryUsage(10000);
    
    // Apply memory optimizations
    if (typeof window !== 'undefined') {
      // Force garbage collection if available (Chrome DevTools)
      if ('gc' in window) {
        (window as any).gc();
      }
    }

    // Run optimization
    const optimizationResult = this.optimizer.analyzeAndOptimize();
    
    const optimizedTest = await PerformanceTester.testMemoryUsage(10000);

    const improvement = ((baselineTest.final - optimizedTest.final) / baselineTest.final) * 100;
    const leaksDetected = baselineTest.stability === 'growing';

    const recommendations: string[] = [];
    if (improvement < 5) {
      recommendations.push('Consider implementing more aggressive memory cleanup');
    }
    if (leaksDetected) {
      recommendations.push('Memory leaks detected - investigate audio buffer cleanup');
    }
    if (optimizedTest.peak > 100) {
      recommendations.push('High memory usage detected - consider reducing buffer sizes');
    }

    const result = {
      baseline: baselineTest.final,
      optimized: optimizedTest.final,
      improvement: Math.round(improvement),
      leaksDetected,
      recommendations
    };

    console.log('Memory optimization results:', result);
    console.groupEnd();

    this.testResults.set('memory', result);
    return result;
  }

  // Comprehensive Benchmark Suite
  async runFullBenchmarkSuite(): Promise<{
    latency: { average: number; compliance: boolean };
    audio: { quality: string; dropouts: number };
    memory: { usage: number; leaks: boolean };
    network: NetworkPerformanceTest[];
    battery: BatteryTest | null;
    browser: CrossBrowserTestResult;
    overall: { score: number; grade: string };
  }> {
    console.group('🚀 Running Full Performance Benchmark Suite');
    console.log('This may take several minutes...');

    const startTime = Date.now();

    // Run all tests
    const [
      networkResults,
      batteryResults,
      browserResults,
      memoryResults
    ] = await Promise.all([
      this.testNetworkPerformance(),
      this.testBatteryUsage(2), // Shorter test for benchmark
      this.testCrossBrowserCompatibility(),
      this.testMemoryOptimization()
    ]);

    // Calculate overall performance score
    let totalScore = 0;
    let maxScore = 0;

    // Latency score (40% weight)
    const latencyScore = browserResults.latencyCompliance ? 40 : 20;
    totalScore += latencyScore;
    maxScore += 40;

    // Browser compatibility score (20% weight)
    const compatScore = (browserResults.compatibilityScore / 100) * 20;
    totalScore += compatScore;
    maxScore += 20;

    // Memory score (20% weight)
    const memoryScore = memoryResults.leaksDetected ? 10 : 20;
    totalScore += memoryScore;
    maxScore += 20;

    // Network score (20% weight)
    const avgNetworkQuality = networkResults.reduce((sum, test) => {
      const qualityScore = test.results.audioQuality === 'excellent' ? 4 :
                          test.results.audioQuality === 'good' ? 3 :
                          test.results.audioQuality === 'fair' ? 2 : 1;
      return sum + qualityScore;
    }, 0) / networkResults.length;
    const networkScore = (avgNetworkQuality / 4) * 20;
    totalScore += networkScore;
    maxScore += 20;

    const overallScore = Math.round((totalScore / maxScore) * 100);
    const grade = overallScore >= 90 ? 'A' :
                  overallScore >= 80 ? 'B' :
                  overallScore >= 70 ? 'C' :
                  overallScore >= 60 ? 'D' : 'F';

    const duration = (Date.now() - startTime) / 1000;
    
    const results = {
      latency: {
        average: browserResults.performanceMetrics.latency.average,
        compliance: browserResults.latencyCompliance
      },
      audio: {
        quality: browserResults.performanceMetrics.audio.quality,
        dropouts: browserResults.performanceMetrics.audio.dropouts
      },
      memory: {
        usage: memoryResults.optimized,
        leaks: memoryResults.leaksDetected
      },
      network: networkResults,
      battery: batteryResults,
      browser: browserResults,
      overall: {
        score: overallScore,
        grade
      }
    };

    console.log(`Benchmark suite completed in ${duration}s`);
    console.log('Overall Results:', results);
    console.groupEnd();

    this.testResults.set('benchmark', results);
    return results;
  }

  // Export all test results
  exportResults(): string {
    const timestamp = new Date().toISOString();
    const allResults = Object.fromEntries(this.testResults);

    const report = {
      timestamp,
      testEnvironment: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      },
      results: allResults
    };

    return JSON.stringify(report, null, 2);
  }

  // Cleanup
  destroy() {
    this.monitor.destroy();
    this.testResults.clear();
  }
}

// Export for development console access
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).performanceTester = new ComprehensivePerformanceTester();
  console.log('🧪 Comprehensive performance tester available at window.performanceTester');
}