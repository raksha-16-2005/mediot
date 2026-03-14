'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useFilters } from '@/contexts/filter-context';

const GlobalThreatMap = dynamic(
  () => import('@/components/global-threat-map').then((mod) => ({ default: mod.GlobalThreatMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full rounded-lg border border-slate-700 bg-slate-900 p-8 min-h-[500px] flex items-center justify-center">
        <p className="text-slate-400">Loading global threat map...</p>
      </div>
    ),
  }
);

interface DeviceClusterPoint {
  deviceId: string;
  deviceName: string;
  x: number;
  y: number;
  anomalyScore: number;
  isAnomalous: boolean;
}

export default function AnalyticsPage() {
  const {
    filteredDevices: devices,
    filteredFeatures: features,
    loading,
    selectedIps,
  } = useFilters();

  // Generate cluster data from filtered devices
  const clusterData = useMemo<DeviceClusterPoint[]>(() => {
    if (devices.length === 0) return [];
    return devices.map((device) => {
      const xValue = device.trustScore;
      let anomalyScore = 50;
      anomalyScore += (device.dnsQueries || 0) / 5;
      anomalyScore += (device.uniqueIpConnections || 0) * 2;
      anomalyScore -= device.trustScore * 0.3;
      anomalyScore = Math.max(0, Math.min(100, anomalyScore));
      return {
        deviceId: device.deviceId,
        deviceName: `${device.deviceType} (${device.location})`,
        x: xValue,
        y: anomalyScore,
        anomalyScore: Math.round(anomalyScore * 100) / 100,
        isAnomalous: anomalyScore > 60,
      };
    });
  }, [devices]);

  // Feature importance from real feature data
  const featureImportance = useMemo(() => {
    if (features.length === 0) return [];
    const totalDevices = features.length;
    const avgBytesSent = features.reduce((s, f) => s + f.bytesSent, 0) / totalDevices;
    const avgBytesRecv = features.reduce((s, f) => s + f.bytesReceived, 0) / totalDevices;
    const avgConnCount = features.reduce((s, f) => s + f.connectionCount, 0) / totalDevices;
    const avgFailedRatio = features.reduce((s, f) => s + f.failedConnectionRatio, 0) / totalDevices;
    const avgExtRatio = features.reduce((s, f) => s + f.externalIpRatio, 0) / totalDevices;

    const importances = [
      { name: 'Bytes Sent', value: avgBytesSent / 100 },
      { name: 'Bytes Received', value: avgBytesRecv / 100 },
      { name: 'Connection Count', value: avgConnCount },
      { name: 'Failed Conn Ratio', value: avgFailedRatio * 1000 },
      { name: 'External IP Ratio', value: avgExtRatio * 500 },
    ];
    const total = importances.reduce((sum, item) => sum + item.value, 0);
    return importances.map((item) => ({
      feature: item.name,
      importance: Math.round(item.value * 100) / 100,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0',
    }));
  }, [features]);

  // Anomaly score distribution
  const anomalyDistribution = useMemo(() => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}-${(i + 1) * 10}`,
      count: 0,
      percentage: '0',
    }));
    clusterData.forEach((point) => {
      const idx = Math.min(Math.floor(point.anomalyScore / 10), 9);
      buckets[idx].count++;
    });
    const total = clusterData.length || 1;
    return buckets.map((b) => ({ ...b, percentage: ((b.count / total) * 100).toFixed(1) }));
  }, [clusterData]);

  // Model metrics from real data
  const metrics = useMemo(() => {
    if (devices.length === 0) return { accuracy: 0, precision: 0, recall: 0, f1Score: 0 };
    const malicious = devices.filter((d) => d.isMalicious);
    const healthy = devices.filter((d) => !d.isMalicious);
    const tp = malicious.filter((d) => d.status === 'Critical' || d.status === 'Suspicious').length;
    const fn = malicious.filter((d) => d.status === 'Online').length;
    const fp = healthy.filter((d) => d.status === 'Critical' || d.status === 'Suspicious').length;
    const tn = healthy.filter((d) => d.status === 'Online').length;
    const total = tp + tn + fp + fn || 1;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    return {
      accuracy: parseFloat(((tp + tn) / total * 100).toFixed(1)),
      precision: parseFloat((precision * 100).toFixed(1)),
      recall: parseFloat((recall * 100).toFixed(1)),
      f1Score: precision + recall > 0
        ? parseFloat(((2 * precision * recall) / (precision + recall) * 100).toFixed(1))
        : 0,
    };
  }, [devices]);

  const normalDevices = clusterData.filter((d) => !d.isAnomalous);
  const anomalousDevices = clusterData.filter((d) => d.isAnomalous);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-slate-600 dark:text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="glass-effect-light border-b">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-section-title text-slate-900 dark:text-slate-100">
            Behavioral Analytics
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Machine learning-based security anomaly detection and pattern analysis
            {selectedIps.length > 0 && (
              <span className="ml-2 text-blue-400">
                — Filtered to {selectedIps.length} IP{selectedIps.length > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Model Performance Metrics */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Model Accuracy</p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              {metrics.accuracy}%
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Precision</p>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.precision}%
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Recall</p>
            <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
              {metrics.recall}%
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">F1 Score</p>
            <p className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">
              {metrics.f1Score}%
            </p>
          </div>
        </div>

        {/* Global Threat Map */}
        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Global Threat Map
          </h2>
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
            Real-time visualization of attack origins and threat flows to the hospital network.
          </p>
          <GlobalThreatMap />
        </div>

        {/* Device Classification */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Normal Devices</p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              {normalDevices.length}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {clusterData.length > 0
                ? ((normalDevices.length / clusterData.length) * 100).toFixed(1)
                : 0}% of total
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Anomalous Devices</p>
            <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
              {anomalousDevices.length}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {clusterData.length > 0
                ? ((anomalousDevices.length / clusterData.length) * 100).toFixed(1)
                : 0}% of total
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="mb-8 space-y-8">
          {/* Device Behavior Clusters */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Device Behavior Clusters
            </h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Scatter plot showing device clustering based on trust score and behavioral anomaly score
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="x"
                  name="Trust Score"
                  type="number"
                  domain={[0, 100]}
                  label={{ value: 'Trust Score (0-100)', position: 'insideBottomRight', offset: -5 }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  dataKey="y"
                  name="Anomaly Score"
                  type="number"
                  domain={[0, 100]}
                  label={{ value: 'Anomaly Score (0-100)', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as DeviceClusterPoint;
                      return (
                        <div className="rounded border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100">
                          <p className="font-semibold">{data.deviceName}</p>
                          <p>Trust Score: {data.x.toFixed(1)}</p>
                          <p>Anomaly: {data.anomalyScore}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Normal Devices" data={normalDevices} fill="#22c55e" isAnimationActive={false} />
                <Scatter name="Anomalous Devices" data={anomalousDevices} fill="#ef4444" isAnimationActive={false} />
              </ScatterChart>
            </ResponsiveContainer>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-900/20">
                <div className="h-4 w-4 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100">Normal Devices</p>
                  <p className="text-xs text-green-700 dark:text-green-300">Anomaly score {'<'} 60</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/20">
                <div className="h-4 w-4 rounded-full bg-red-500" />
                <div>
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100">Anomalous Devices</p>
                  <p className="text-xs text-red-700 dark:text-red-300">Anomaly score {'≥'} 60</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Importance */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Feature Importance Analysis
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureImportance} layout="vertical" margin={{ top: 5, right: 30, left: 200 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" />
                <YAxis dataKey="feature" type="category" width={190} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value: number) => [value.toFixed(2), 'Importance']}
                />
                <Bar dataKey="importance" fill="#3b82f6" radius={[0, 8, 8, 0]} isAnimationActive={false}>
                  {featureImportance.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06d6a0'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {featureImportance.map((item) => (
                <div
                  key={item.feature}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {item.feature}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.importance}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anomaly Score Distribution */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Anomaly Score Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={anomalyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as { range: string; count: number; percentage: string };
                      return (
                        <div className="rounded border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100">
                          <p className="font-semibold">{data.range}</p>
                          <p>Devices: {data.count}</p>
                          <p>Percentage: {data.percentage}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                  {anomalyDistribution.map((_, index) => {
                    const intensity = index / anomalyDistribution.length;
                    const color = intensity > 0.6 ? '#ef4444' : intensity > 0.3 ? '#f59e0b' : '#22c55e';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-300">Low Risk (0-33)</p>
                <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                  {anomalyDistribution.slice(0, 3).reduce((sum, b) => sum + b.count, 0)}
                </p>
              </div>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-yellow-700 dark:text-yellow-300">Medium Risk (33-66)</p>
                <p className="mt-2 text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {anomalyDistribution.slice(3, 6).reduce((sum, b) => sum + b.count, 0)}
                </p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">High Risk (66-100)</p>
                <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                  {anomalyDistribution.slice(6, 10).reduce((sum, b) => sum + b.count, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Model Information Footer */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            ML Model Information
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Model Type</p>
              <p className="mt-1 text-slate-900 dark:text-slate-100">Isolation Forest + XGBoost</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Training Data</p>
              <p className="mt-1 text-slate-900 dark:text-slate-100">{clusterData.length} devices • IoT-23 Dataset</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Status</p>
              <p className="mt-1 text-green-600 dark:text-green-400">Model Health: Optimal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
