'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Device } from '@/lib/types';
import { getDeviceById } from '@/lib/api';
import { TrustScoreGauge } from './trust-score-gauge';

interface DeviceDetailProps {
  deviceId: string;
}

interface ChartDataPoint {
  time: string;
  value: number;
}

interface Anomaly {
  icon: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
}

export function DeviceDetail({ deviceId }: DeviceDetailProps) {
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trafficData, setTrafficData] = useState<ChartDataPoint[]>([]);
  const [dnsData, setDnsData] = useState<ChartDataPoint[]>([]);
  const [ipConnectionsData, setIpConnectionsData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDeviceById(deviceId);
        setDevice(data);
      } catch (err) {
        console.error('Error fetching device:', err);
        setError('Failed to load device details');
      } finally {
        setLoading(false);
      }
    };

    fetchDevice();
  }, [deviceId]);

  // Generate chart data when device is loaded
  useEffect(() => {
    if (!device) return;

    // Generate traffic volume data
    const traffic: ChartDataPoint[] = Array.from({ length: 24 }, (_, i) => ({
      time: `${String(i).padStart(2, '0')}:00`,
      value: Math.floor(Math.random() * 8000) + 2000,
    }));

    // Generate DNS queries data
    const dns: ChartDataPoint[] = Array.from({ length: 24 }, (_, i) => ({
      time: `${String(i).padStart(2, '0')}:00`,
      value: Math.floor(Math.random() * 300) + 50,
    }));

    // Generate unique IP connections data
    const ipConnections: ChartDataPoint[] = Array.from({ length: 24 }, (_, i) => ({
      time: `${String(i).padStart(2, '0')}:00`,
      value: Math.floor(Math.random() * 40) + 5,
    }));

    setTrafficData(traffic);
    setDnsData(dns);
    setIpConnectionsData(ipConnections);
  }, [device]);

  // Generate anomalies based on device state
  const getAnomalies = (device: Device): Anomaly[] => {
    const anomalies: Anomaly[] = [];

    if (device.dnsQueries > 300) {
      anomalies.push({
        icon: '🔍',
        title: 'DNS Spike Detected',
        description: `Unusual DNS query activity detected: ${device.dnsQueries} queries recorded`,
        severity: device.trustScore < 50 ? 'critical' : 'warning',
      });
    }

    if (device.uniqueIpConnections > 20) {
      anomalies.push({
        icon: '🌐',
        title: 'Contacted New IPs',
        description: `Device connected to ${device.uniqueIpConnections} unique IP addresses`,
        severity: device.trustScore < 40 ? 'critical' : 'info',
      });
    }

    if (device.trafficVolume > 8000) {
      anomalies.push({
        icon: '📊',
        title: 'Unusual Traffic Volume',
        description: `High network traffic detected: ${device.trafficVolume} bytes in monitoring window`,
        severity: device.trustScore < 50 ? 'critical' : 'warning',
      });
    }

    if (device.trustScore < 50) {
      anomalies.push({
        icon: '🕐',
        title: 'Off-Hour Activity',
        description: 'Device activity detected outside normal operating hours',
        severity: 'critical',
      });
    }

    return anomalies.length > 0
      ? anomalies
      : [
          {
            icon: '✓',
            title: 'No Anomalies',
            description: 'Device behavior is within normal parameters',
            severity: 'info',
          },
        ];
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-32 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error || 'Device not found'}
          </p>
        </div>
      </div>
    );
  }

  const anomalies = getAnomalies(device);

  return (
    <div className="space-y-8 p-6">
      {/* Device Information */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
          Device Information
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Device ID
            </p>
            <p className="mt-1 font-mono text-sm text-slate-900 dark:text-slate-100">
              {device.deviceId}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Device Type
            </p>
            <p className="mt-1 text-slate-900 dark:text-slate-100">
              {device.deviceType}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              IP Address
            </p>
            <p className="mt-1 font-mono text-sm text-slate-900 dark:text-slate-100">
              {device.ipAddress}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Location
            </p>
            <p className="mt-1 text-slate-900 dark:text-slate-100">
              {device.location}
            </p>
          </div>

          <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Last Activity
            </p>
            <p className="mt-1 text-slate-900 dark:text-slate-100">
              {new Date(device.lastActivity).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </p>
          </div>
        </div>
      </section>

      {/* Trust Score Gauge */}
      <section>
        <h2 className="mb-6 text-lg font-bold text-slate-900 dark:text-slate-100">
          Trust Score Assessment
        </h2>
        <div className="flex justify-center rounded-lg border border-slate-200 bg-slate-50 p-8 dark:border-slate-700 dark:bg-slate-800">
          <TrustScoreGauge score={device.trustScore} size="lg" />
        </div>
      </section>

      {/* Behavior Charts */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
          Behavior Analysis
        </h2>

        {/* Traffic Volume Chart */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Traffic Volume Over Time (24h)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trafficData}>
              <defs>
                <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} interval={2} />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                fill="url(#trafficGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* DNS Queries Chart */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            DNS Queries Per Hour (24h)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dnsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} interval={2} />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Unique IP Connections Chart */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Unique IP Connections (24h)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ipConnectionsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} interval={2} />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#f59e0b"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Anomaly Explanations */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
          Anomaly Analysis
        </h2>
        <div className="space-y-3">
          {anomalies.map((anomaly, idx) => {
            const severityStyles = {
              info: 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20',
              warning:
                'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20',
              critical:
                'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20',
            };

            const severityTextStyles = {
              info: 'text-blue-700 dark:text-blue-300',
              warning: 'text-yellow-700 dark:text-yellow-300',
              critical: 'text-red-700 dark:text-red-300',
            };

            return (
              <div
                key={idx}
                className={`rounded-lg border p-4 ${severityStyles[anomaly.severity]}`}
              >
                <div className="flex gap-3">
                  <span className="text-2xl">{anomaly.icon}</span>
                  <div className="flex-1">
                    <h3
                      className={`font-semibold ${severityTextStyles[anomaly.severity]}`}
                    >
                      {anomaly.title}
                    </h3>
                    <p
                      className={`mt-1 text-sm ${severityTextStyles[anomaly.severity]}`}
                    >
                      {anomaly.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Network Metrics Summary */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
          Network Metrics
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Traffic Volume
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {(device.trafficVolume / 1024).toFixed(1)}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">KB</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              DNS Queries
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {device.dnsQueries}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">queries</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Unique IPs
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {device.uniqueIpConnections}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">connections</p>
          </div>
        </div>
      </section>
    </div>
  );
}
