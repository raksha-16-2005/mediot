'use client';

import React from 'react';
import { Device } from '@/lib/types';
import { useTheme } from '@/contexts/theme-context';

interface DeviceTableProps {
  devices: Device[];
  onRowClick: (device: Device) => void;
  isLoading?: boolean;
  currentPage: number;
  itemsPerPage: number;
}

function getStatusColor(
  status: string
): {
  bg: string;
  text: string;
  dot: string;
} {
  switch (status) {
    case 'Online':
      return {
        bg: 'bg-green-100 dark:bg-green-900',
        text: 'text-green-800 dark:text-green-200',
        dot: 'bg-green-500',
      };
    case 'Suspicious':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900',
        text: 'text-yellow-800 dark:text-yellow-200',
        dot: 'bg-yellow-500',
      };
    case 'Critical':
      return {
        bg: 'bg-red-100 dark:bg-red-900',
        text: 'text-red-800 dark:text-red-200',
        dot: 'bg-red-500',
      };
    case 'Offline':
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-800 dark:text-slate-200',
        dot: 'bg-slate-500',
      };
  }
}

function getRiskLevelColor(
  level: string
): {
  bg: string;
  text: string;
} {
  switch (level) {
    case 'Low':
      return {
        bg: 'bg-green-100 dark:bg-green-900',
        text: 'text-green-800 dark:text-green-200',
      };
    case 'Medium':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900',
        text: 'text-yellow-800 dark:text-yellow-200',
      };
    case 'High':
      return {
        bg: 'bg-orange-100 dark:bg-orange-900',
        text: 'text-orange-800 dark:text-orange-200',
      };
    case 'Critical':
    default:
      return {
        bg: 'bg-red-100 dark:bg-red-900',
        text: 'text-red-800 dark:text-red-200',
      };
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function DeviceTable({
  devices,
  onRowClick,
  isLoading = false,
  currentPage,
  itemsPerPage,
}: DeviceTableProps) {
  const { cyberMode } = useTheme();
  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDevices = devices.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-3 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">No devices found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              Device ID
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              Type
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              IP Address
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              Trust Score
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              Status
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              Last Activity
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              Risk Level
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedDevices.map((device) => {
            const statusColor = getStatusColor(device.status);
            const riskColor = getRiskLevelColor(device.riskLevel);
            const trustScoreColor =
              device.trustScore > 70
                ? 'text-green-600 dark:text-green-400'
                : device.trustScore > 40
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400';

            return (
              <tr
                key={device.deviceId}
                onClick={() => onRowClick(device)}
                className={`cursor-pointer border-b border-slate-200 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 ${
                  cyberMode && device.status === 'Critical' ? 'cyber-neon-alert' : ''
                }`}
              >
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                  <code className="rounded bg-slate-100 px-2 py-1 font-mono text-xs dark:bg-slate-800">
                    {device.deviceId}
                  </code>
                </td>
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                  {device.deviceType}
                </td>
                <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-400">
                  {device.ipAddress}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`font-semibold ${trustScoreColor}`}>
                    {device.trustScore.toFixed(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${statusColor.dot}`} />
                    {device.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {formatTimestamp(device.lastActivity)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${riskColor.bg} ${riskColor.text}`}
                  >
                    {device.riskLevel}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination Info */}
      <div className="border-t border-slate-200 px-6 py-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
        Showing {startIndex + 1} to {Math.min(endIndex, devices.length)} of{' '}
        {devices.length} devices
      </div>
    </div>
  );
}
