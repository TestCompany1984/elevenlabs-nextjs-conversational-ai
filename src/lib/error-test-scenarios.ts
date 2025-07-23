// Error test scenarios for development and QA testing
export interface TestScenario {
  id: string;
  name: string;
  description: string;
  category: 'connection' | 'permission' | 'audio' | 'session' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  simulate: () => void;
  expectedBehavior: string;
  recoverySteps: string[];
}

export class ErrorTestScenarios {
  private static scenarios: TestScenario[] = [
    {
      id: 'network_disconnect',
      name: 'Network Disconnection',
      description: 'Simulates network connectivity loss during conversation',
      category: 'network',
      severity: 'high',
      simulate: () => {
        // Simulate network disconnection
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false
        });
        window.dispatchEvent(new Event('offline'));
      },
      expectedBehavior: 'Show network status fallback, retry when back online',
      recoverySteps: [
        'Display offline indicator',
        'Pause conversation gracefully',
        'Show reconnection UI when back online',
        'Automatically retry connection'
      ]
    },
    
    {
      id: 'connection_timeout',
      name: 'Connection Timeout',
      description: 'Simulates connection timeout during session start',
      category: 'connection',
      severity: 'medium',
      simulate: () => {
        throw new Error('Connection timeout');
      },
      expectedBehavior: 'Show timeout error with retry option',
      recoverySteps: [
        'Display user-friendly timeout message',
        'Provide retry button',
        'Implement exponential backoff',
        'Clear error state on successful retry'
      ]
    },
    
    {
      id: 'permission_denied',
      name: 'Microphone Permission Denied',
      description: 'Simulates user denying microphone permissions',
      category: 'permission',
      severity: 'high',
      simulate: () => {
        throw new DOMException('Permission denied', 'NotAllowedError');
      },
      expectedBehavior: 'Show permission instructions and modal',
      recoverySteps: [
        'Display permission denied message',
        'Show browser-specific instructions',
        'Open permission modal',
        'Guide user to browser settings'
      ]
    },
    
    {
      id: 'audio_device_error',
      name: 'Audio Device Unavailable',
      description: 'Simulates no microphone or audio device error',
      category: 'audio',
      severity: 'high',
      simulate: () => {
        throw new DOMException('No audio devices found', 'NotFoundError');
      },
      expectedBehavior: 'Show audio device error with troubleshooting',
      recoverySteps: [
        'Display device not found message',
        'Provide troubleshooting steps',
        'Suggest checking device connections',
        'Offer refresh/retry option'
      ]
    },
    
    {
      id: 'authentication_failed',
      name: 'Authentication Failure',
      description: 'Simulates API authentication failure',
      category: 'session',
      severity: 'critical',
      simulate: () => {
        throw new Error('Authentication failed');
      },
      expectedBehavior: 'Show critical error, no retry for auth issues',
      recoverySteps: [
        'Display authentication error',
        'Suggest checking API credentials',
        'Do not auto-retry (not retryable)',
        'Provide support contact information'
      ]
    },
    
    {
      id: 'session_expired',
      name: 'Session Expiration',
      description: 'Simulates session expiring during conversation',
      category: 'session',
      severity: 'medium',
      simulate: () => {
        throw new Error('Session expired');
      },
      expectedBehavior: 'Automatically start new session',
      recoverySteps: [
        'Detect session expiration',
        'Clear existing session state',
        'Automatically start new session',
        'Notify user of session renewal'
      ]
    },
    
    {
      id: 'websocket_error',
      name: 'WebSocket Connection Failed',
      description: 'Simulates WebSocket connection failure',
      category: 'connection',
      severity: 'high',
      simulate: () => {
        throw new Error('WebSocket connection failed');
      },
      expectedBehavior: 'Retry connection with backoff',
      recoverySteps: [
        'Show connection failed message',
        'Implement retry with exponential backoff',
        'Provide manual retry option',
        'Fall back to alternative connection method if available'
      ]
    },
    
    {
      id: 'audio_processing_error',
      name: 'Audio Processing Failure',
      description: 'Simulates audio processing pipeline error',
      category: 'audio',
      severity: 'medium',
      simulate: () => {
        throw new Error('Audio processing failed');
      },
      expectedBehavior: 'Reset audio pipeline and retry',
      recoverySteps: [
        'Detect audio processing failure',
        'Reset audio context and pipeline',
        'Restart audio capture',
        'Notify user of audio reset'
      ]
    }
  ];

  static getAllScenarios(): TestScenario[] {
    return this.scenarios;
  }

  static getScenariosByCategory(category: TestScenario['category']): TestScenario[] {
    return this.scenarios.filter(scenario => scenario.category === category);
  }

  static getScenariosBySeverity(severity: TestScenario['severity']): TestScenario[] {
    return this.scenarios.filter(scenario => scenario.severity === severity);
  }

  static runScenario(scenarioId: string): TestScenario | null {
    const scenario = this.scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      console.group(`🧪 Testing Error Scenario: ${scenario.name}`);
      console.log('Description:', scenario.description);
      console.log('Expected Behavior:', scenario.expectedBehavior);
      console.log('Recovery Steps:', scenario.recoverySteps);
      
      try {
        scenario.simulate();
        console.log('✅ Scenario simulated successfully');
      } catch (error) {
        console.log('⚠️ Scenario triggered error:', error);
      }
      
      console.groupEnd();
      return scenario;
    }
    return null;
  }

  static createTestSuite(): {
    runAllScenarios: () => void;
    runCategory: (category: TestScenario['category']) => void;
    runSeverity: (severity: TestScenario['severity']) => void;
  } {
    return {
      runAllScenarios: () => {
        console.group('🧪 Running All Error Test Scenarios');
        this.scenarios.forEach(scenario => {
          this.runScenario(scenario.id);
        });
        console.groupEnd();
      },
      
      runCategory: (category: TestScenario['category']) => {
        console.group(`🧪 Running ${category.toUpperCase()} Error Scenarios`);
        this.getScenariosByCategory(category).forEach(scenario => {
          this.runScenario(scenario.id);
        });
        console.groupEnd();
      },
      
      runSeverity: (severity: TestScenario['severity']) => {
        console.group(`🧪 Running ${severity.toUpperCase()} Severity Error Scenarios`);
        this.getScenariosBySeverity(severity).forEach(scenario => {
          this.runScenario(scenario.id);
        });
        console.groupEnd();
      }
    };
  }

  // Development helper to add scenarios to window for manual testing
  static exposeForTesting(): void {
    if (process.env.NODE_ENV === 'development') {
      (window as Record<string, unknown>).errorTestScenarios = {
        run: this.runScenario.bind(this),
        list: this.getAllScenarios.bind(this),
        suite: this.createTestSuite()
      };
      
      console.log('🧪 Error test scenarios exposed to window.errorTestScenarios');
      console.log('Available commands:');
      console.log('- window.errorTestScenarios.list() - List all scenarios');
      console.log('- window.errorTestScenarios.run("scenario_id") - Run specific scenario');
      console.log('- window.errorTestScenarios.suite.runAllScenarios() - Run all scenarios');
      console.log('- window.errorTestScenarios.suite.runCategory("network") - Run category');
    }
  }
}

// Auto-expose in development
if (typeof window !== 'undefined') {
  ErrorTestScenarios.exposeForTesting();
}