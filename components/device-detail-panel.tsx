'use client';

import React, { useEffect, useState } from 'react';
import { Device } from '@/lib/types';
import { getDeviceById } from '@/lib/api';
import { TrustRadar } from './trust-radar';

interface DeviceDetailPanelProps {
  deviceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DeviceDetailPanel({
  deviceId,
  isOpen,
  onClose,
}: DeviceDetailPanelProps) {
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !deviceId) return;

    const fetchDeviceData = async () => {
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

    fetchDeviceData();
  }, [isOpen, deviceId]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-white shadow-xl dark:bg-slate-900 sm:w-96">
        {/* Header */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Device Details
            </h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-6 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {device && !loading && (
            <div className="space-y-6">
              {/* Device ID */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Device ID
                </label>
                <p className="mt-1 font-mono text-sm text-slate-900 dark:text-slate-100">
                  {device.deviceId}
                </p>
              </div>

              {/* Device Type */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Device Type
                </label>
                <p className="mt-1 text-slate-900 dark:text-slate-100">
                  {device.deviceType}
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Location
                </label>
                <p className="mt-1 text-slate-900 dark:text-slate-100">
                  {device.location}
                </p>
              </div>

              {/* IP Address */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  IP Address
                </label>
                <p className="mt-1 font-mono text-sm text-slate-900 dark:text-slate-100">
                  {device.ipAddress}
                </p>
              </div>

              {/* Trust Score */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Trust Score
                </label>
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={`h-2 transition-all ${
                          device.trustScore > 70
                            ? 'bg-green-500'
                            : device.trustScore > 40
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${device.trustScore}%` }}
                      />
                    </div>
                    <span
                      className={`font-bold ${
                        device.trustScore > 70
                          ? 'text-green-600 dark:text-green-400'
                          : device.trustScore > 40
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {device.trustScore.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Status
                </label>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      device.status === 'Online'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : device.status === 'Suspicious'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : device.status === 'Critical'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        device.status === 'Online'
                          ? 'bg-green-500'
                          : device.status === 'Suspicious'
                            ? 'bg-yellow-500'
                            : device.status === 'Critical'
                              ? 'bg-red-500'
                              : 'bg-slate-500'
                      }`}
                    />
                    {device.status}
                  </span>
                </p>
              </div>

              {/* Risk Level */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Risk Level
                </label>
                <p className="mt-1">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      device.riskLevel === 'Low'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : device.riskLevel === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : device.riskLevel === 'High'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {device.riskLevel}
                  </span>
                </p>
              </div>

              {/* Network Metrics */}
              <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Network Metrics
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Traffic Volume
                    </label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100">
                      {device.trafficVolume.toLocaleString()} bytes
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      DNS Queries
                    </label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100">
                      {device.dnsQueries}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Unique IP Connections
                    </label>
                    <p className="mt-1 text-slate-900 dark:text-slate-100">
                      {device.uniqueIpConnections}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust Factors Radar */}
              <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Device Trust Analysis
                </h3>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                  <TrustRadar device={device} />
                </div>
              </div>

              {/* Last Activity */}
              <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Last Activity
                </label>
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
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
          )}
        </div>
      </div>
    </>
  );
}
