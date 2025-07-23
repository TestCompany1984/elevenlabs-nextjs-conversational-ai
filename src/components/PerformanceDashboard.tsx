"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Zap, 
  MemoryStick, 
  Wifi, 
  Battery, 
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Pause,
  Download,
  Settings,
  Target
} from 'lucide-react';
import { PerformanceMonitor, PerformanceMetrics, PerformanceReport } from '@/lib/performance-monitor';
import { PerformanceOptimizer, OptimizationSettings, PerformanceTester } from '@/lib/performance-optimizer';

interface PerformanceDashboardProps {
  onOptimizationChange?: (settings: OptimizationSettings) => void;
}

export function PerformanceDashboard({ onOptimizationChange }: PerformanceDashboardProps) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [optimizer, setOptimizer] = useState<PerformanceOptimizer | null>(null);
  const [isTestingLatency, setIsTestingLatency] = useState(false);
  const [latencyTestResults, setLatencyTestResults] = useState<{
    measurements: number[];
    average: number;
    min: number;
    max: number;
    passes: number;
    failures: number;
  } | null>(null);
  const [currentProfile, setCurrentProfile] = useState<string>('Balanced');
  
  const monitorRef = useRef<PerformanceMonitor | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isMonitoring && !monitorRef.current) {
      monitorRef.current = new PerformanceMonitor();
      const opt = new PerformanceOptimizer(monitorRef.current);
      setOptimizer(opt);
      
      // Update metrics every 2 seconds
      updateIntervalRef.current = setInterval(() => {
        if (monitorRef.current) {
          const newReport = monitorRef.current.generateReport();
          setReport(newReport);
          setMetrics(newReport.metrics);
        }
      }, 2000);
    } else if (!isMonitoring && monitorRef.current) {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      monitorRef.current.destroy();
      monitorRef.current = null;
      setOptimizer(null);
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (monitorRef.current) {
        monitorRef.current.destroy();
      }
    };
  }, [isMonitoring]);

  const startMonitoring = () => {
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setMetrics(null);
    setReport(null);
  };

  const runLatencyTest = async () => {
    setIsTestingLatency(true);
    try {
      const results = await PerformanceTester.testLatency(10);
      setLatencyTestResults(results);
      
      // Start a latency measurement in the monitor if available
      if (monitorRef.current) {
        monitorRef.current.startLatencyMeasurement('test-roundtrip', 'roundtrip');
        setTimeout(() => {
          monitorRef.current?.endLatencyMeasurement('test-roundtrip');
        }, results.average);
      }
    } catch (error) {
      console.error('Latency test failed:', error);
    } finally {
      setIsTestingLatency(false);
    }
  };

  const optimizePerformance = () => {
    if (optimizer) {
      const result = optimizer.analyzeAndOptimize();
      setCurrentProfile(result.suggestedProfile);
      onOptimizationChange?.(optimizer.getCurrentSettings());
      
      console.log('Performance optimization result:', result);
    }
  };

  const exportReport = () => {
    if (report) {
      const data = JSON.stringify(report, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-report-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency <= 200) return 'text-green-600';
    if (latency <= 400) return 'text-yellow-600';
    if (latency <= 500) return 'text-orange-600';
    return 'text-red-600';
  };

  const getLatencyIcon = (latency: number) => {
    if (latency <= 300) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (latency <= 500) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getMemoryStatus = (usage: number) => {
    if (usage < 50) return { color: 'text-green-600', status: 'Good' };
    if (usage < 100) return { color: 'text-yellow-600', status: 'Moderate' };
    return { color: 'text-red-600', status: 'High' };
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Monitor
              {isMonitoring && (
                <div className="flex items-center gap-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">Live</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
                variant={isMonitoring ? "destructive" : "default"}
                size="sm"
              >
                {isMonitoring ? (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Start
                  </>
                )}
              </Button>
              
              <Button
                onClick={runLatencyTest}
                disabled={isTestingLatency}
                variant="outline"
                size="sm"
              >
                <Target className="h-4 w-4 mr-1" />
                {isTestingLatency ? 'Testing...' : 'Test Latency'}
              </Button>
              
              {optimizer && (
                <Button
                  onClick={optimizePerformance}
                  variant="outline"
                  size="sm"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Optimize
                </Button>
              )}
              
              {report && (
                <Button
                  onClick={exportReport}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        {currentProfile && (
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Current Profile:</span>
              <span className="font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                {currentProfile}
              </span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Performance Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Latency Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Latency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Average</span>
                  <div className="flex items-center gap-1">
                    {getLatencyIcon(metrics.latency?.average || 0)}
                    <span className={`font-bold ${getLatencyColor(metrics.latency?.average || 0)}`}>
                      {Math.round(metrics.latency?.average || 0)}ms
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Last</span>
                  <span className="text-sm font-medium">
                    {Math.round(metrics.latency?.roundtrip || 0)}ms
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (metrics.latency?.average || 0) <= 300 ? 'bg-green-500' :
                      (metrics.latency?.average || 0) <= 500 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, ((metrics.latency?.average || 0) / 800) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  Target: &lt;500ms {(metrics.latency?.average || 0) <= 500 ? '✓' : '✗'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Memory Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MemoryStick className="h-4 w-4" />
                Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Heap Used</span>
                  <span className={`font-bold ${getMemoryStatus(metrics.memory?.heapUsed || 0).color}`}>
                    {metrics.memory?.heapUsed || 0}MB
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Status</span>
                  <span className="text-sm font-medium">
                    {getMemoryStatus(metrics.memory?.heapUsed || 0).status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (metrics.memory?.heapUsed || 0) < 50 ? 'bg-green-500' :
                      (metrics.memory?.heapUsed || 0) < 100 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, ((metrics.memory?.heapUsed || 0) / 200) * 100)}%` }}
                  ></div>
                </div>
                {metrics.memory?.leaks > 0 && (
                  <div className="text-xs text-red-500">
                    Potential leak: {metrics.memory.leaks}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Audio Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Audio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Quality</span>
                  <span className="text-sm font-medium capitalize">
                    {metrics.audio?.quality || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Dropouts</span>
                  <span className={`font-bold ${
                    (metrics.audio?.dropouts || 0) === 0 ? 'text-green-600' : 
                    (metrics.audio?.dropouts || 0) < 5 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metrics.audio?.dropouts || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Sample Rate</span>
                  <span className="text-sm font-medium">
                    {((metrics.audio?.sampleRate || 0) / 1000).toFixed(1)}kHz
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Buffer: {metrics.audio?.bufferSize || 0} samples
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network/Battery Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {metrics.battery ? <Battery className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
                {metrics.battery ? 'Battery' : 'Network'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.battery ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Level</span>
                      <span className={`font-bold ${
                        metrics.battery.level > 50 ? 'text-green-600' :
                        metrics.battery.level > 20 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {metrics.battery.level}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Status</span>
                      <span className="text-sm font-medium">
                        {metrics.battery.charging ? 'Charging' : 'Discharging'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          metrics.battery.level > 50 ? 'bg-green-500' :
                          metrics.battery.level > 20 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${metrics.battery.level}%` }}
                      ></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Bandwidth</span>
                      <span className="text-sm font-medium">
                        {metrics.network?.bandwidth?.toFixed(1) || '0.0'} Mbps
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Type</span>
                      <span className="text-sm font-medium capitalize">
                        {metrics.network?.connectionType || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Packet Loss: {metrics.network?.packetLoss || 0}%
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Latency Test Results */}
      {latencyTestResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Latency Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(latencyTestResults.average)}ms
                </div>
                <div className="text-xs text-gray-600">Average</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {latencyTestResults.min}ms
                </div>
                <div className="text-xs text-gray-600">Best</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {latencyTestResults.max}ms
                </div>
                <div className="text-xs text-gray-600">Worst</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {latencyTestResults.passes}
                </div>
                <div className="text-xs text-gray-600">Passed (&lt;500ms)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {latencyTestResults.failures}
                </div>
                <div className="text-xs text-gray-600">Failed (&gt;500ms)</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                latencyTestResults.failures === 0 ? 'bg-green-100 text-green-800' :
                latencyTestResults.failures < 3 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {latencyTestResults.failures === 0 ? '✅ Excellent' :
                 latencyTestResults.failures < 3 ? '⚠️ Good' : '❌ Needs Optimization'}
                Performance
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Issues */}
      {report && report.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.issues.map((issue, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    issue.severity === 'critical' ? 'border-red-500 bg-red-50' :
                    issue.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                    issue.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{issue.message}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Type: {issue.type} • Severity: {issue.severity}
                      </div>
                      {issue.suggestions.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-medium text-gray-700 mb-1">Suggestions:</div>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {issue.suggestions.map((suggestion, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-blue-500">•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 ml-4">
                      {issue.value.toFixed(1)} / {issue.threshold}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {report && report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-500 mt-0.5">💡</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}