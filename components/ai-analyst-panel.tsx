'use client';

import React, { useState, useEffect } from 'react';

interface Anomaly {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
}

interface RecommendedAction {
  priority: number;
  action: string;
  urgency: 'immediate' | 'soon' | 'investigate';
}

interface SecurityAnalysis {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  location: string;
  riskScore: number;
  anomalies: Anomaly[];
  recommendedActions: RecommendedAction[];
  confidence: number;
  timestamp: Date;
}

// Mock data for demonstration
const MOCK_ANALYSES: SecurityAnalysis[] = [
  {
    deviceId: 'pump-23',
    deviceName: 'Infusion Pump #23',
    deviceType: 'Infusion Pump',
    location: 'Ward 3B',
    riskScore: 87,
    anomalies: [
      {
        id: 'anom-1',
        type: 'DNS Spike',
        description: 'Unusual DNS query rate detected (450+ queries/min)',
        severity: 'high',
        indicators: ['DNS_QUERIES', 'PROTOCOL_ANOMALY', 'EXTERNAL_COMMS'],
      },
      {
        id: 'anom-2',
        type: 'IP Connections',
        description: '15 new unique IP connections in last 30 minutes',
        severity: 'critical',
        indicators: ['NETWORK_SWEEP', 'C2_COMMUNICATION'],
      },
      {
        id: 'anom-3',
        type: 'Traffic Volume',
        description: '340MB data transfer exceeds baseline by 8500%',
        severity: 'critical',
        indicators: ['DATA_EXFILTRATION', 'UNUSUAL_TRAFFIC'],
      },
    ],
    recommendedActions: [
      {
        priority: 1,
        action: 'Isolate device from network immediately',
        urgency: 'immediate',
      },
      {
        priority: 2,
        action: 'Run integrity and malware scan',
        urgency: 'immediate',
      },
      {
        priority: 3,
        action: 'Notify security operations center',
        urgency: 'immediate',
      },
      { priority: 4, action: 'Preserve device logs for analysis', urgency: 'immediate' },
      { priority: 5, action: 'Check for lateral movement to adjacent devices', urgency: 'soon' },
    ],
    confidence: 0.94,
    timestamp: new Date(),
  },
  {
    deviceId: 'monitor-7',
    deviceName: 'Patient Monitor #7',
    deviceType: 'Patient Monitor',
    location: 'ICU',
    riskScore: 45,
    anomalies: [
      {
        id: 'anom-4',
        type: 'Off-Hours Activity',
        description: 'Device accessed during non-business hours',
        severity: 'medium',
        indicators: ['SUSPICIOUS_TIMING', 'AFTER_HOURS_ACCESS'],
      },
    ],
    recommendedActions: [
      { priority: 1, action: 'Review access logs for this time period', urgency: 'soon' },
      { priority: 2, action: 'Verify authorized personnel access', urgency: 'soon' },
      { priority: 3, action: 'Monitor device closely for next 48 hours', urgency: 'investigate' },
    ],
    confidence: 0.72,
    timestamp: new Date(Date.now() - 1800000), // 30 min ago
  },
];

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-900/30 text-red-200 border-red-700';
    case 'high':
      return 'bg-orange-900/30 text-orange-200 border-orange-700';
    case 'medium':
      return 'bg-yellow-900/30 text-yellow-200 border-yellow-700';
    case 'low':
      return 'bg-blue-900/30 text-blue-200 border-blue-700';
    default:
      return 'bg-slate-700/30 text-slate-200 border-slate-600';
  }
};

const getSeverityBadgeColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-600 text-red-50';
    case 'high':
      return 'bg-orange-600 text-orange-50';
    case 'medium':
      return 'bg-yellow-600 text-yellow-50';
    case 'low':
      return 'bg-blue-600 text-blue-50';
    default:
      return 'bg-slate-600 text-slate-50';
  }
};

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'immediate':
      return 'text-red-400 border-red-700/30';
    case 'soon':
      return 'text-yellow-400 border-yellow-700/30';
    case 'investigate':
      return 'text-blue-400 border-blue-700/30';
    default:
      return 'text-slate-400 border-slate-700/30';
  }
};

const getRiskScoreColor = (score: number) => {
  if (score >= 80) return 'text-red-400';
  if (score >= 60) return 'text-orange-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-green-400';
};

const getRiskScoreBgColor = (score: number) => {
  if (score >= 80) return 'bg-red-900/20';
  if (score >= 60) return 'bg-orange-900/20';
  if (score >= 40) return 'bg-yellow-900/20';
  return 'bg-green-900/20';
};

export function AIAnalystPanel() {
  const [analyses, setAnalyses] = useState<SecurityAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SecurityAnalysis | null>(null);

  useEffect(() => {
    setAnalyses(MOCK_ANALYSES);
    if (MOCK_ANALYSES.length > 0) {
      setSelectedAnalysis(MOCK_ANALYSES[0]);
    }
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* Panel Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🤖</span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            AI Security Analyst
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Automated threat analysis with recommended actions
        </p>
      </div>

      {/* Analysis Selector Tabs */}
      {analyses.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {analyses.map((analysis) => (
            <button
              key={analysis.deviceId}
              onClick={() => setSelectedAnalysis(analysis)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg border transition-colors text-sm whitespace-nowrap ${
                selectedAnalysis?.deviceId === analysis.deviceId
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="mr-1">
                {analysis.riskScore >= 80
                  ? '🔴'
                  : analysis.riskScore >= 60
                    ? '🟠'
                    : analysis.riskScore >= 40
                      ? '🟡'
                      : '🟢'}
              </span>
              {analysis.deviceName}
            </button>
          ))}
        </div>
      )}

      {/* Main Analysis Panel */}
      {selectedAnalysis && (
        <div className="border border-slate-700 rounded-lg bg-slate-900/50 backdrop-blur-sm p-6 space-y-6">
          {/* Device Header */}
          <div className="border-b border-slate-700 pb-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-100">
                  {selectedAnalysis.deviceName}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedAnalysis.deviceType} • {selectedAnalysis.location}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getRiskScoreColor(selectedAnalysis.riskScore)}`}>
                  {selectedAnalysis.riskScore}
                </div>
                <p className="text-xs text-slate-400">Risk Score</p>
              </div>
            </div>

            {/* Confidence and Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-slate-400">
                  Analysis Confidence: {Math.round(selectedAnalysis.confidence * 100)}%
                </span>
              </div>
              <span className="text-xs text-slate-500">
                Updated {formatTime(selectedAnalysis.timestamp)}
              </span>
            </div>
          </div>

          {/* Detected Anomalies */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <h4 className="font-semibold text-slate-100">Detected Anomalies</h4>
              <span className="ml-auto text-xs bg-red-600 text-red-50 px-2 py-1 rounded">
                {selectedAnalysis.anomalies.length} anomalies
              </span>
            </div>

            <div className="space-y-2">
              {selectedAnalysis.anomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className={`rounded-lg border p-3 ${getSeverityColor(anomaly.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-slate-100">{anomaly.type}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${getSeverityBadgeColor(anomaly.severity)}`}
                    >
                      {anomaly.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{anomaly.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {anomaly.indicators.map((indicator) => (
                      <span
                        key={indicator}
                        className="text-xs bg-slate-800/50 text-slate-300 px-2 py-1 rounded"
                      >
                        {indicator}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <h4 className="font-semibold text-slate-100">Recommended Actions</h4>
              <span className="ml-auto text-xs bg-blue-600 text-blue-50 px-2 py-1 rounded">
                {selectedAnalysis.recommendedActions.length} actions
              </span>
            </div>

            <div className="space-y-2">
              {selectedAnalysis.recommendedActions.map((action) => (
                <div
                  key={action.priority}
                  className={`border rounded-lg p-3 bg-slate-800/30 border-slate-700 flex items-start gap-3 ${getUrgencyColor(action.urgency)}`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {action.urgency === 'immediate' ? (
                      <span className="text-lg">🔴</span>
                    ) : action.urgency === 'soon' ? (
                      <span className="text-lg">🟡</span>
                    ) : (
                      <span className="text-lg">🔵</span>
                    )}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-slate-100">{action.action}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Priority: #{action.priority} • {action.urgency.toUpperCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Assessment Summary */}
          <div className={`rounded-lg border p-4 ${getRiskScoreBgColor(selectedAnalysis.riskScore)}`}>
            <h5 className="font-semibold text-slate-100 mb-2">Risk Assessment Summary</h5>
            <div className="space-y-2 text-sm text-slate-300">
              <p>
                🔍 <strong>Analysis:</strong> This device exhibits multiple indicators of compromise
                with a high confidence level.
              </p>
              <p>
                ⚡ <strong>Threat Level:</strong>{' '}
                {selectedAnalysis.riskScore >= 80
                  ? 'CRITICAL - Immediate action required'
                  : selectedAnalysis.riskScore >= 60
                    ? 'HIGH - Urgent investigation needed'
                    : selectedAnalysis.riskScore >= 40
                      ? 'MEDIUM - Monitor closely'
                      : 'LOW - Routine monitoring'}
              </p>
              <p>
                💡 <strong>Insight:</strong> The combination of DNS queries and IP connections suggests
                potential lateral movement or data exfiltration attempt.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors">
              🚨 Isolate Device
            </button>
            <button className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium text-sm transition-colors">
              📋 Run Scan
            </button>
            <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors">
              📢 Notify Team
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {analyses.length === 0 && (
        <div className="border border-slate-700 rounded-lg bg-slate-900/30 p-8 text-center">
          <p className="text-slate-400">No security anomalies detected</p>
          <p className="text-sm text-slate-500 mt-2">All monitored devices are operating normally</p>
        </div>
      )}
    </div>
  );
}

// Helper function to format time
function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
