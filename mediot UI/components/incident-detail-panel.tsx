'use client';

import React from 'react';
import { Alert } from '@/lib/types';

interface IncidentDetailPanelProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
}

function getAttackTypeFromReason(reason: string): string {
  const reasonLower = reason.toLowerCase();

  if (reasonLower.includes('dns')) return 'DNS Manipulation';
  if (reasonLower.includes('ransomware')) return 'Ransomware Detection';
  if (reasonLower.includes('authentication')) return 'Brute Force Attack';
  if (reasonLower.includes('traffic')) return 'Traffic Anomaly';
  if (reasonLower.includes('connection')) return 'Unauthorized Connection';
  if (reasonLower.includes('protocol')) return 'Protocol Violation';
  if (reasonLower.includes('firmware')) return 'Firmware Tampering';
  if (reasonLower.includes('port')) return 'Suspicious Port Activity';

  return 'Unknown Threat';
}

function getSeverityStyles(severity: string) {
  switch (severity) {
    case 'Critical':
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
        icon: '🔴',
      };
    case 'Alert':
    case 'Warning':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
        icon: '🟡',
      };
    case 'Info':
    default:
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        badge: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
        icon: '🔵',
      };
  }
}

export function IncidentDetailPanel({
  alert,
  isOpen,
  onClose,
}: IncidentDetailPanelProps) {
  if (!isOpen || !alert) return null;

  const severityStyle = getSeverityStyles(alert.severity);
  const attackType = getAttackTypeFromReason(alert.alertReason);

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
        <div
          className={`border-b ${severityStyle.border} ${severityStyle.bg} px-6 py-6`}
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{severityStyle.icon}</span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Incident Analysis
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Alert ID: {alert.id}
                </p>
              </div>
            </div>
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

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded px-3 py-2 bg-white/50 dark:bg-slate-800/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Timestamp
              </p>
              <p className="mt-1 text-sm font-mono text-slate-900 dark:text-slate-100">
                {new Date(alert.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>
            <div className="rounded px-3 py-2 bg-white/50 dark:bg-slate-800/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Severity
              </p>
              <p className={`mt-1 text-sm font-bold ${severityStyle.badge.replace('bg-', 'text-').replace('dark:', '')}`}>
                {alert.severity}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Attack Type */}
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Attack Type
            </h3>
            <div className={`rounded-lg border ${severityStyle.border} ${severityStyle.bg} p-4`}>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {attackType}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {alert.alertReason}
              </p>
            </div>
          </section>

          {/* Affected Device */}
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Affected Device
            </h3>
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Device Name
                </p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {alert.deviceName}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Device ID
                </p>
                <p className="mt-1 font-mono text-sm text-slate-900 dark:text-slate-100">
                  {alert.deviceId}
                </p>
              </div>
            </div>
          </section>

          {/* Trust Score */}
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Trust Score
            </h3>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Current Score
                </span>
                <span
                  className={`text-2xl font-bold ${
                    alert.trustScore > 70
                      ? 'text-green-600 dark:text-green-400'
                      : alert.trustScore > 40
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {alert.trustScore.toFixed(1)}
                </span>
              </div>

              {/* Trust Score Bar */}
              <div className="mt-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-3 transition-all ${
                    alert.trustScore > 70
                      ? 'bg-green-500'
                      : alert.trustScore > 40
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${alert.trustScore}%` }}
                />
              </div>

              {alert.trustScore < 50 && (
                <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                  ⚠️ Critical trust score - immediate action recommended
                </p>
              )}
            </div>
          </section>

          {/* Recommended Action */}
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Recommended Action
            </h3>
            <div className="space-y-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="flex items-start gap-2 text-sm text-slate-900 dark:text-slate-100">
                  <span className="mt-0.5 text-lg">→</span>
                  <span>{alert.recommendedAction}</span>
                </p>
              </div>
            </div>
          </section>

          {/* Additional Information */}
          <section className="border-t border-slate-200 pt-6 dark:border-slate-700">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Response Guidelines
            </h3>
            <ul className="space-y-2 text-sm">
              {alert.severity === 'Critical' && (
                <>
                  <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                    <span>1.</span>
                    <span>Immediately isolate the device from the network</span>
                  </li>
                  <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                    <span>2.</span>
                    <span>Initiate incident response protocol</span>
                  </li>
                  <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                    <span>3.</span>
                    <span>Collect device logs and forensic data</span>
                  </li>
                  <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                    <span>4.</span>
                    <span>Notify security team immediately</span>
                  </li>
                </>
              )}
              {alert.severity === 'Warning' && (
                <>
                  <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                    <span>1.</span>
                    <span>Increase monitoring of this device</span>
                  </li>
                  <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                    <span>2.</span>
                    <span>Review recent device activity logs</span>
                  </li>
                  <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                    <span>3.</span>
                    <span>Prepare for potential escalation</span>
                  </li>
                </>
              )}
              {alert.severity === 'Info' && (
                <>
                  <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                    <span>1.</span>
                    <span>Log and document the event</span>
                  </li>
                  <li className="flex gap-2 text-slate-700 dark:text-slate-300">
                    <span>2.</span>
                    <span>Monitor for similar patterns</span>
                  </li>
                </>
              )}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
