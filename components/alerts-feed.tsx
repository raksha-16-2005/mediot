'use client';

import React from 'react';
import { Alert, AlertSeverity } from '@/lib/types';
import { useTheme } from '@/contexts/theme-context';

interface AlertsFeedProps {
  alerts: Alert[];
  isLoading?: boolean;
}

function getSeverityColor(
  severity: AlertSeverity
): {
  badge: string;
  text: string;
} {
  switch (severity) {
    case 'Critical':
      return {
        badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300',
        text: 'text-red-700 dark:text-red-400',
      };
    case 'Alert':
      return {
        badge: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300',
        text: 'text-orange-700 dark:text-orange-400',
      };
    case 'Warning':
      return {
        badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300',
        text: 'text-yellow-700 dark:text-yellow-400',
      };
    case 'Info':
    default:
      return {
        badge: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300',
        text: 'text-blue-700 dark:text-blue-400',
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

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AlertsFeed({ alerts, isLoading = false }: AlertsFeedProps) {
  const { cyberMode } = useTheme();
  if (isLoading) {
    return (
      <div className="rounded-lg glass-effect-dark p-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-2 h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg glass-effect-dark p-6">
        <p className="text-center text-slate-500 dark:text-slate-400">
          No alerts at this time
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg glass-effect-dark p-6 space-y-3">
      {alerts.map((alert) => {
        const severityColor = getSeverityColor(alert.severity);
        const getAlertGradient = () => {
          switch (alert.severity) {
            case 'Critical':
              return 'bg-gradient-to-r from-red-500/15 to-orange-500/15';
            case 'Alert':
              return 'bg-gradient-to-r from-orange-500/15 to-yellow-500/15';
            case 'Warning':
              return 'bg-gradient-to-r from-yellow-500/15 to-amber-500/15';
            default:
              return 'bg-gradient-to-r from-blue-500/15 to-cyan-500/15';
          }
        };

        return (
          <div
            key={alert.id}
            className={`card-hover-effect border-l-4 border-l-transparent rounded-lg p-4 transition-all ${getAlertGradient()} ${
              alert.severity === 'Critical' ? 'hover:scale-[1.02]' : ''
            } ${
              cyberMode && alert.severity === 'Critical' ? 'cyber-neon-alert' : ''
            }`}
            style={{
              borderLeftColor:
                alert.severity === 'Critical'
                  ? '#dc2626'
                  : alert.severity === 'Alert'
                    ? '#ea580c'
                    : alert.severity === 'Warning'
                      ? '#eab308'
                      : '#0284c7',
            }}
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {alert.deviceName}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {alert.alertReason}
                </p>
              </div>
              <span
                className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${severityColor.badge}`}
              >
                {alert.severity}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Trust Score:{' '}
                  <span
                    className={`font-bold ${
                      alert.trustScore > 70
                        ? 'text-green-600 dark:text-green-400'
                        : alert.trustScore > 40
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {alert.trustScore.toFixed(1)}
                  </span>
                </span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {formatTimestamp(alert.timestamp)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
