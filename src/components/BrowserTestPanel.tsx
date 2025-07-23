"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Play, 
  Download,
  Monitor,
  Smartphone,
  Globe,
  Headphones,
  Wifi
} from 'lucide-react';
import { BrowserCompatibilityTester, CompatibilityTestResult, BrowserInfo } from '@/lib/browser-compatibility';

interface BrowserTestPanelProps {
  onTestComplete?: (results: CompatibilityTestResult[]) => void;
}

export function BrowserTestPanel({ onTestComplete }: BrowserTestPanelProps) {
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<CompatibilityTestResult[]>([]);
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [tester] = useState(() => new BrowserCompatibilityTester());

  useEffect(() => {
    setBrowserInfo(BrowserCompatibilityTester.detectBrowser());
  }, []);

  const runTests = async () => {
    setIsTestRunning(true);
    try {
      const results = await tester.runAllTests();
      setTestResults(results);
      onTestComplete?.(results);
    } catch (error) {
      console.error('Failed to run browser tests:', error);
    } finally {
      setIsTestRunning(false);
    }
  };

  const exportResults = () => {
    const report = tester.exportResults();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `browser-compatibility-${browserInfo?.name?.toLowerCase()}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTestIcon = (result: CompatibilityTestResult) => {
    if (result.passed) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (result.testName.includes('Microphone') || result.testName.includes('WebRTC')) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getBrowserIcon = () => {
    if (!browserInfo) return <Globe className="h-6 w-6" />;
    
    switch (browserInfo.name.toLowerCase()) {
      case 'chrome':
        return <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">C</div>;
      case 'firefox':
        return <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">F</div>;
      case 'safari':
        return <div className="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-bold">S</div>;
      case 'edge':
        return <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">E</div>;
      default:
        return <Globe className="h-6 w-6" />;
    }
  };

  const compatibilityScore = testResults.length > 0 
    ? Math.round((testResults.filter(r => r.passed).length / testResults.length) * 100)
    : 0;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Monitor className="h-5 w-5" />
          Browser Compatibility Testing
          {process.env.NODE_ENV === 'development' && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              DEV MODE
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Browser Information */}
        {browserInfo && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            {getBrowserIcon()}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{browserInfo.name} {browserInfo.version}</h3>
                {browserInfo.isMobile && (
                  <Smartphone className="h-4 w-4 text-gray-500" />
                )}
              </div>
              <p className="text-sm text-gray-600">
                {browserInfo.engine} • {browserInfo.platform}
              </p>
            </div>
            
            {testResults.length > 0 && (
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  compatibilityScore >= 80 ? 'text-green-600' : 
                  compatibilityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {compatibilityScore}%
                </div>
                <p className="text-sm text-gray-600">Compatible</p>
              </div>
            )}
          </div>
        )}

        {/* Test Controls */}
        <div className="flex gap-3">
          <Button
            onClick={runTests}
            disabled={isTestRunning}
            className="flex items-center gap-2"
          >
            <Play className={`h-4 w-4 ${isTestRunning ? 'animate-spin' : ''}`} />
            {isTestRunning ? 'Running Tests...' : 'Run Compatibility Tests'}
          </Button>
          
          {testResults.length > 0 && (
            <Button
              variant="outline"
              onClick={exportResults}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          )}
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Test Results</h3>
            
            <div className="grid gap-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    result.passed 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getTestIcon(result)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{result.testName}</h4>
                        {result.testName.includes('WebRTC') && (
                          <Wifi className="h-4 w-4 text-gray-500" />
                        )}
                        {result.testName.includes('Audio') && (
                          <Headphones className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      
                      {result.error && (
                        <p className="text-sm text-red-700 mb-2">
                          <strong>Error:</strong> {result.error}
                        </p>
                      )}
                      
                      {result.details && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            View Details
                          </summary>
                          <div className="mt-2 p-2 bg-white rounded border text-xs">
                            <pre className="whitespace-pre-wrap overflow-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </div>
                        </details>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {result.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary and Recommendations */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Summary & Recommendations</h4>
              
              {compatibilityScore >= 80 ? (
                <p className="text-sm text-blue-700">
                  ✅ Excellent compatibility! This browser should work well with the voice AI application.
                </p>
              ) : compatibilityScore >= 60 ? (
                <p className="text-sm text-blue-700">
                  ⚠️ Good compatibility with some limitations. Some advanced features may not work optimally.
                </p>
              ) : (
                <p className="text-sm text-blue-700">
                  ❌ Limited compatibility. Consider using a different browser for the best experience.
                </p>
              )}

              <div className="mt-3 text-xs text-blue-600">
                <p><strong>Best supported browsers:</strong> Chrome 90+, Firefox 88+, Safari 14+, Edge 90+</p>
                <p><strong>Required features:</strong> WebRTC, Web Audio API, MediaDevices API</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Feature Check */}
        {browserInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className={`p-3 rounded-lg text-center ${
              browserInfo.supportsWebRTC ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <Wifi className="h-5 w-5 mx-auto mb-1" />
              <div className="text-xs font-medium">WebRTC</div>
              <div className="text-xs">{browserInfo.supportsWebRTC ? '✓' : '✗'}</div>
            </div>
            
            <div className={`p-3 rounded-lg text-center ${
              browserInfo.supportsAudioContext ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <Headphones className="h-5 w-5 mx-auto mb-1" />
              <div className="text-xs font-medium">Audio API</div>
              <div className="text-xs">{browserInfo.supportsAudioContext ? '✓' : '✗'}</div>
            </div>
            
            <div className={`p-3 rounded-lg text-center ${
              browserInfo.supportsGetUserMedia ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <Monitor className="h-5 w-5 mx-auto mb-1" />
              <div className="text-xs font-medium">Media Access</div>
              <div className="text-xs">{browserInfo.supportsGetUserMedia ? '✓' : '✗'}</div>
            </div>
            
            <div className={`p-3 rounded-lg text-center ${
              browserInfo.supportsES2020 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <Globe className="h-5 w-5 mx-auto mb-1" />
              <div className="text-xs font-medium">Modern JS</div>
              <div className="text-xs">{browserInfo.supportsES2020 ? '✓' : '✗'}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component for displaying browser compatibility warnings
export function BrowserCompatibilityWarning() {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const info = BrowserCompatibilityTester.detectBrowser();
    setBrowserInfo(info);
    
    // Show warning for known incompatible browsers
    const isIncompatible = !info.supportsWebRTC || !info.supportsAudioContext || !info.supportsGetUserMedia;
    const isOldBrowser = (
      (info.name === 'Chrome' && parseInt(info.version) < 90) ||
      (info.name === 'Firefox' && parseInt(info.version) < 88) ||
      (info.name === 'Safari' && parseInt(info.version) < 14) ||
      (info.name === 'Edge' && parseInt(info.version) < 90)
    );
    
    setShowWarning(isIncompatible || isOldBrowser);
  }, []);

  if (!showWarning || !browserInfo) {
    return null;
  }

  return (
    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-800 mb-1">
            Browser Compatibility Notice
          </h3>
          <p className="text-sm text-yellow-700 mb-2">
            Your browser ({browserInfo.name} {browserInfo.version}) may have limited support for voice features.
          </p>
          <p className="text-xs text-yellow-600">
            For the best experience, please use Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+.
          </p>
        </div>
        <button
          onClick={() => setShowWarning(false)}
          className="text-yellow-400 hover:text-yellow-600"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}