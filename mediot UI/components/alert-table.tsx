'use client';

import React from 'react';
import { Alert, AlertSeverity } from '@/lib/types';
import { useTheme } from '@/contexts/theme-context';

interface AlertTableProps {
  alerts: Alert[];
  onRowClick: (alert: Alert) => void;
  isLoading?: boolean;
  currentPage: number;
  itemsPerPage: number;
}

function getSeverityStyles(severity: AlertSeverity) {
  switch (severity) {
    case 'Critical':
      return {
        badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-l-red-500',
        dot: 'bg-red-500',
      };
    case 'Alert':
    case 'Warning':
      return {
        badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-l-yellow-500',
        dot: 'bg-yellow-500',
      };
    case 'Info':
    default:
      return {
        badge: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-l-blue-500',
        dot: 'bg-blue-500',
      };
  }
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function AlertTable({
  alerts,
  onRowClick,
  isLoading = false,
  currentPage,
  itemsPerPage,
}: AlertTableProps) {
  const { cyberMode } = useTheme();
  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAlerts = alerts.slice(startIndex, endIndex);

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

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">No alerts found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              Timestamp
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              Device
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              Severity
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              Trust Score
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
              Alert Reason
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedAlerts.map((alert) => {
            const severityStyle = getSeverityStyles(alert.severity);
            const trustScoreColor =
              alert.trustScore > 70
                ? 'text-green-600 dark:text-green-400'
                : alert.trustScore > 40
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400';

            return (
              <tr
                key={alert.id}
                onClick={() => onRowClick(alert)}
                className={`cursor-pointer border-b border-l-4 border-b-slate-200 transition-colors hover:bg-slate-50 ${severityStyle.border} dark:border-b-slate-800 dark:hover:bg-slate-800 ${
                  cyberMode && alert.severity === 'Critical' ? 'cyber-neon-alert' : ''
                }`}
              >
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                  {formatTimestamp(alert.timestamp)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                  <div className="font-medium">{alert.deviceName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    ID: {alert.deviceId}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${severityStyle.badge}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${severityStyle.dot}`} />
                    {alert.severity}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-xs overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={`h-2 transition-all ${trustScoreColor.replace('text-', 'bg-')}`}
                        style={{ width: `${alert.trustScore}%` }}
                      />
                    </div>
                    <span className={`font-semibold ${trustScoreColor}`}>
                      {alert.trustScore.toFixed(1)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {alert.alertReason}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination Info */}
      <div className="border-t border-slate-200 px-6 py-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
        Showing {startIndex + 1} to {Math.min(endIndex, alerts.length)} of{' '}
        {alerts.length} alerts
      </div>
    </div>
  );
}
