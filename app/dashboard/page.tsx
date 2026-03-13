'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Device, Alert, NetworkMetrics } from '@/lib/types';
import { getDevices, getAlerts, getNetworkMetrics } from '@/lib/api';
import { MetricCard } from '@/components/metric-card';
import { AlertsFeed } from '@/components/alerts-feed';

interface ChartData {
  time: string;
  traffic: number;
}

interface TrustScoreBucket {
  range: string;
  count: number;
}

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trustScoreData, setTrustScoreData] = useState<TrustScoreBucket[]>([]);
  const [activityData, setActivityData] = useState<ChartData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [devicesData, alertsData, metricsData] = await Promise.all([
          getDevices(),
          getAlerts(),
          getNetworkMetrics(),
        ]);

        setDevices(devicesData);
        setAlerts(alertsData);
        setMetrics(metricsData);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Generate chart data when devices change
  useEffect(() => {
    if (devices.length === 0) return;

    // Generate trust score distribution
    const buckets: TrustScoreBucket[] = [
      { range: '0-20', count: 0 },
      { range: '20-40', count: 0 },
      { range: '40-60', count: 0 },
      { range: '60-80', count: 0 },
      { range: '80-100', count: 0 },
    ];

    devices.forEach((device) => {
      if (device.trustScore < 20) buckets[0].count++;
      else if (device.trustScore < 40) buckets[1].count++;
      else if (device.trustScore < 60) buckets[2].count++;
      else if (device.trustScore < 80) buckets[3].count++;
      else buckets[4].count++;
    });

    setTrustScoreData(buckets);

    // Generate network activity data
    const activity: ChartData[] = Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      traffic: Math.floor(Math.random() * 50000) + 10000,
    }));

    setActivityData(activity);
  }, [devices]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
            Error
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="glass-effect-light border-b border-slate-700/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-100">
            Security Operations Center
          </h1>
          <p className="mt-2 text-slate-400">
            Real-time monitoring dashboard for hospital IoT devices
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Metrics */}
        <div className="mb-8 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Devices Monitored"
            value={metrics?.totalDevices ?? 0}
            variant="default"
          />
          <MetricCard
            title="Healthy Devices"
            value={metrics?.healthyDevices ?? 0}
            variant="success"
          />
          <MetricCard
            title="Suspicious Devices"
            value={metrics?.suspiciousDevices ?? 0}
            variant="warning"
          />
          <MetricCard
            title="Critical Alerts"
            value={metrics?.criticalAlerts ?? 0}
            variant="danger"
          />
        </div>

        {/* Charts Section */}
        <div className="mb-8 grid gap-8 lg:grid-cols-2">
          {/* Trust Score Distribution */}
          <div className="glass-effect-medium card-hover-effect rounded-lg p-8">
            <h2 className="mb-6 text-lg font-semibold tracking-tight text-slate-100">
              Trust Score Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trustScoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Network Activity Timeline */}
          <div className="glass-effect-medium card-hover-effect rounded-lg p-8">
            <h2 className="mb-6 text-lg font-semibold tracking-tight text-slate-100">
              Network Activity Timeline (24h)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  interval={2}
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value: number) => [
                    `${(value / 1000).toFixed(0)} KB/s`,
                    'Traffic',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="traffic"
                  stroke="#ef4444"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Feed */}
        <div className="mb-8">
          <h2 className="mb-6 text-lg font-semibold tracking-tight text-slate-100">
            Latest Security Alerts
          </h2>
          <AlertsFeed alerts={alerts.slice(0, 10)} isLoading={loading} />
        </div>

        {/* Status Footer */}
        <div className="glass-effect-light card-hover-effect flex items-center justify-between rounded-lg p-6">
          <div className="text-sm text-slate-400">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            System online • Last updated{' '}
            {lastUpdated
              ? lastUpdated.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : 'loading...'}
          </div>
          <div className="text-sm font-medium text-slate-100">
            Monitoring {devices.length} devices
          </div>
        </div>
      </div>
    </div>
  );
}
