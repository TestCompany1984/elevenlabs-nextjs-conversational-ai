// Browser compatibility testing and detection utilities
export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  isMobile: boolean;
  supportsWebRTC: boolean;
  supportsMediaDevices: boolean;
  supportsGetUserMedia: boolean;
  supportsAudioContext: boolean;
  supportsWebSockets: boolean;
  supportsES2020: boolean;
}

export interface CompatibilityTestResult {
  testName: string;
  browser: string;
  passed: boolean;
  error?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface BrowserFeatureSupport {
  webrtc: {
    supported: boolean;
    details: {
      peerConnection: boolean;
      dataChannel: boolean;
      mediaStream: boolean;
      getUserMedia: boolean;
    };
  };
  audio: {
    supported: boolean;
    details: {
      audioContext: boolean;
      webAudio: boolean;
      mediaRecorder: boolean;
      audioWorklet: boolean;
    };
  };
  websockets: {
    supported: boolean;
    details: {
      websocket: boolean;
      binaryType: boolean;
    };
  };
  permissions: {
    supported: boolean;
    details: {
      navigator: boolean;
      query: boolean;
    };
  };
}

export class BrowserCompatibilityTester {
  private testResults: CompatibilityTestResult[] = [];

  // Detect browser information
  static detectBrowser(): BrowserInfo {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    let name = 'Unknown';
    let version = 'Unknown';
    let engine = 'Unknown';
    
    // Browser detection
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Blink';
    } else if (userAgent.includes('Firefox')) {
      name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Gecko';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'WebKit';
    } else if (userAgent.includes('Edg')) {
      name = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Blink';
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    return {
      name,
      version,
      engine,
      platform,
      isMobile,
      supportsWebRTC: 'RTCPeerConnection' in window,
      supportsMediaDevices: 'mediaDevices' in navigator,
      supportsGetUserMedia: 'getUserMedia' in navigator.mediaDevices,
      supportsAudioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
      supportsWebSockets: 'WebSocket' in window,
      supportsES2020: this.checkES2020Support()
    };
  }

  // Check ES2020 feature support
  private static checkES2020Support(): boolean {
    try {
      // Test optional chaining
      const obj = { a: { b: 'test' } };
      const test1 = (obj as any)?.a?.b === 'test';
      
      // Test nullish coalescing
      const nullValue: unknown = null;
      const test2 = (nullValue ?? 'default') === 'default';
      
      // Test BigInt
      const test3 = typeof BigInt(123) === 'bigint';
      
      return test1 && test2 && test3;
    } catch {
      return false;
    }
  }

  // Test WebRTC compatibility
  async testWebRTCSupport(): Promise<CompatibilityTestResult> {
    const browser = BrowserCompatibilityTester.detectBrowser();
    const testName = 'WebRTC Support';

    try {
      const details = {
        peerConnection: 'RTCPeerConnection' in window,
        dataChannel: 'RTCDataChannel' in window,
        mediaStream: 'MediaStream' in window,
        getUserMedia: navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices
      };

      const allSupported = Object.values(details).every(Boolean);

      const result: CompatibilityTestResult = {
        testName,
        browser: `${browser.name} ${browser.version}`,
        passed: allSupported,
        details,
        timestamp: new Date()
      };

      if (!allSupported) {
        const missing = Object.entries(details)
          .filter(([, supported]) => !supported)
          .map(([feature]) => feature);
        result.error = `Missing WebRTC features: ${missing.join(', ')}`;
      }

      this.testResults.push(result);
      return result;
    } catch (error) {
      const result: CompatibilityTestResult = {
        testName,
        browser: `${browser.name} ${browser.version}`,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      this.testResults.push(result);
      return result;
    }
  }

  // Test audio processing capabilities
  async testAudioSupport(): Promise<CompatibilityTestResult> {
    const browser = BrowserCompatibilityTester.detectBrowser();
    const testName = 'Audio Processing Support';

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext as typeof AudioContext;
      
      const details = {
        audioContext: !!AudioContextClass,
        webAudio: 'createGain' in (AudioContextClass ? AudioContextClass.prototype : {}),
        mediaRecorder: 'MediaRecorder' in window,
        audioWorklet: AudioContextClass && 'audioWorklet' in AudioContextClass.prototype
      };

      // Test AudioContext creation
      let contextTest = false;
      try {
        const testContext = new AudioContextClass();
        contextTest = testContext.state !== undefined;
        testContext.close();
      } catch {
        contextTest = false;
      }

      details.audioContext = details.audioContext && contextTest;
      const allSupported = Object.values(details).every(Boolean);

      const result: CompatibilityTestResult = {
        testName,
        browser: `${browser.name} ${browser.version}`,
        passed: allSupported,
        details,
        timestamp: new Date()
      };

      if (!allSupported) {
        const missing = Object.entries(details)
          .filter(([, supported]) => !supported)
          .map(([feature]) => feature);
        result.error = `Missing audio features: ${missing.join(', ')}`;
      }

      this.testResults.push(result);
      return result;
    } catch (error) {
      const result: CompatibilityTestResult = {
        testName,
        browser: `${browser.name} ${browser.version}`,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      this.testResults.push(result);
      return result;
    }
  }

  // Test microphone access
  async testMicrophoneAccess(): Promise<CompatibilityTestResult> {
    const browser = BrowserCompatibilityTester.detectBrowser();
    const testName = 'Microphone Access';

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }

      // Test with minimal constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const details = {
        streamObtained: !!stream,
        audioTracks: stream.getAudioTracks().length,
        trackSettings: stream.getAudioTracks()[0]?.getSettings(),
        constraints: stream.getAudioTracks()[0]?.getConstraints()
      };

      // Clean up
      stream.getTracks().forEach(track => track.stop());

      const result: CompatibilityTestResult = {
        testName,
        browser: `${browser.name} ${browser.version}`,
        passed: true,
        details,
        timestamp: new Date()
      };

      this.testResults.push(result);
      return result;
    } catch (error) {
      const result: CompatibilityTestResult = {
        testName,
        browser: `${browser.name} ${browser.version}`,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      this.testResults.push(result);
      return result;
    }
  }

  // Test WebSocket connectivity
  async testWebSocketSupport(): Promise<CompatibilityTestResult> {
    const browser = BrowserCompatibilityTester.detectBrowser();
    const testName = 'WebSocket Support';

    try {
      const details = {
        websocketConstructor: 'WebSocket' in window,
        binaryType: false,
        connectionTest: false
      };

      if (details.websocketConstructor) {
        // Test WebSocket creation (without actually connecting)
        const testWs = new WebSocket('wss://echo.websocket.org');
        details.binaryType = 'binaryType' in testWs;
        testWs.close();
        details.connectionTest = true;
      }

      const result: CompatibilityTestResult = {
        testName,
        browser: `${browser.name} ${browser.version}`,
        passed: Object.values(details).every(Boolean),
        details,
        timestamp: new Date()
      };

      this.testResults.push(result);
      return result;
    } catch (error) {
      const result: CompatibilityTestResult = {
        testName,
        browser: `${browser.name} ${browser.version}`,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      this.testResults.push(result);
      return result;
    }
  }

  // Test performance APIs
  async testPerformanceAPIs(): Promise<CompatibilityTestResult> {
    const browser = BrowserCompatibilityTester.detectBrowser();
    const testName = 'Performance APIs';

    try {
      const details = {
        performance: 'performance' in window,
        performanceNow: 'now' in performance,
        performanceMark: 'mark' in performance,
        performanceMeasure: 'measure' in performance,
        performanceObserver: 'PerformanceObserver' in window
      };

      const result: CompatibilityTestResult = {
        testName,
        browser: `${browser.name} ${browser.version}`,
        passed: Object.values(details).every(Boolean),
        details,
        timestamp: new Date()
      };

      this.testResults.push(result);
      return result;
    } catch (error) {
      const result: CompatibilityTestResult = {
        testName,
        browser: `${browser.name} ${browser.version}`,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      this.testResults.push(result);
      return result;
    }
  }

  // Run all compatibility tests
  async runAllTests(): Promise<CompatibilityTestResult[]> {
    console.group('🧪 Running Browser Compatibility Tests');
    
    const browser = BrowserCompatibilityTester.detectBrowser();
    console.log(`Testing on: ${browser.name} ${browser.version} (${browser.engine})`);
    console.log(`Platform: ${browser.platform}${browser.isMobile ? ' (Mobile)' : ''}`);

    this.testResults = [];

    try {
      await this.testWebRTCSupport();
      await this.testAudioSupport();
      await this.testMicrophoneAccess();
      await this.testWebSocketSupport();
      await this.testPerformanceAPIs();
    } catch (error) {
      console.error('Error running tests:', error);
    }

    console.groupEnd();
    return this.testResults;
  }

  // Get test results summary
  getTestSummary(): {
    browser: BrowserInfo;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    compatibilityScore: number;
    criticalIssues: string[];
    recommendations: string[];
  } {
    const browser = BrowserCompatibilityTester.detectBrowser();
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const compatibilityScore = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    // Analyze critical issues
    this.testResults.forEach(result => {
      if (!result.passed) {
        if (result.testName === 'WebRTC Support') {
          criticalIssues.push('WebRTC not fully supported - voice conversations may not work');
          recommendations.push('Update to a modern browser version or enable WebRTC features');
        }
        if (result.testName === 'Audio Processing Support') {
          criticalIssues.push('Audio processing limited - may affect voice quality');
          recommendations.push('Check browser audio settings and permissions');
        }
        if (result.testName === 'Microphone Access') {
          criticalIssues.push('Microphone access failed - voice input unavailable');
          recommendations.push('Grant microphone permissions and check device connectivity');
        }
      }
    });

    // Browser-specific recommendations
    if (browser.name === 'Safari' && browser.isMobile) {
      recommendations.push('iOS Safari: Ensure iOS 14.3+ for best WebRTC support');
    }
    if (browser.name === 'Firefox') {
      recommendations.push('Firefox: Check about:config for media.navigator.enabled');
    }

    return {
      browser,
      totalTests,
      passedTests,
      failedTests,
      compatibilityScore,
      criticalIssues,
      recommendations
    };
  }

  // Get browser-specific feature support
  static getFeatureSupport(): BrowserFeatureSupport {
    return {
      webrtc: {
        supported: 'RTCPeerConnection' in window,
        details: {
          peerConnection: 'RTCPeerConnection' in window,
          dataChannel: 'RTCDataChannel' in window,
          mediaStream: 'MediaStream' in window,
          getUserMedia: navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices
        }
      },
      audio: {
        supported: 'AudioContext' in window || 'webkitAudioContext' in window,
        details: {
          audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
          webAudio: true, // Assume true if AudioContext exists
          mediaRecorder: 'MediaRecorder' in window,
          audioWorklet: 'AudioWorklet' in window
        }
      },
      websockets: {
        supported: 'WebSocket' in window,
        details: {
          websocket: 'WebSocket' in window,
          binaryType: true // Modern browsers support this
        }
      },
      permissions: {
        supported: 'permissions' in navigator,
        details: {
          navigator: 'permissions' in navigator,
          query: navigator.permissions && 'query' in navigator.permissions
        }
      }
    };
  }

  // Export test results for documentation
  exportResults(): string {
    const summary = this.getTestSummary();
    const timestamp = new Date().toISOString();

    let report = `# Browser Compatibility Test Report\n\n`;
    report += `**Generated:** ${timestamp}\n`;
    report += `**Browser:** ${summary.browser.name} ${summary.browser.version} (${summary.browser.engine})\n`;
    report += `**Platform:** ${summary.browser.platform}${summary.browser.isMobile ? ' (Mobile)' : ''}\n`;
    report += `**Compatibility Score:** ${summary.compatibilityScore}%\n\n`;

    report += `## Test Results Summary\n`;
    report += `- **Total Tests:** ${summary.totalTests}\n`;
    report += `- **Passed:** ${summary.passedTests}\n`;
    report += `- **Failed:** ${summary.failedTests}\n\n`;

    if (summary.criticalIssues.length > 0) {
      report += `## Critical Issues\n`;
      summary.criticalIssues.forEach(issue => {
        report += `- ⚠️ ${issue}\n`;
      });
      report += `\n`;
    }

    if (summary.recommendations.length > 0) {
      report += `## Recommendations\n`;
      summary.recommendations.forEach(rec => {
        report += `- 💡 ${rec}\n`;
      });
      report += `\n`;
    }

    report += `## Detailed Test Results\n\n`;
    this.testResults.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      report += `### ${result.testName} ${status}\n`;
      if (result.error) {
        report += `**Error:** ${result.error}\n`;
      }
      if (result.details) {
        report += `**Details:**\n`;
        Object.entries(result.details).forEach(([key, value]) => {
          report += `- ${key}: ${JSON.stringify(value)}\n`;
        });
      }
      report += `\n`;
    });

    return report;
  }
}

// Expose testing utilities for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as Record<string, unknown>).browserTester = new BrowserCompatibilityTester();
  console.log('🧪 Browser compatibility tester available at window.browserTester');
}