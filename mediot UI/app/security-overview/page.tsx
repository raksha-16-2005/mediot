'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import components to prevent SSR issues
const NetworkAttackMap = dynamic(() => import('@/components/network-attack-map').then((mod) => ({ default: mod.NetworkAttackMap })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-700 min-h-[500px]">
      <p className="text-slate-400">Loading network map...</p>
    </div>
  ),
});

const AIAnalystPanel = dynamic(() => import('@/components/ai-analyst-panel').then((mod) => ({ default: mod.AIAnalystPanel })), {
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-700 p-8">
      <p className="text-slate-400">Loading AI Analyst...</p>
    </div>
  ),
});

export default function SecurityOverviewPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Security Overview
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Real-time IoT network attack detection and visualization
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              🔄 Refresh Map
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Connected Devices</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">5</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Network Connections</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">5</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Threat Level</p>
            <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">MEDIUM</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Last Attack</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">2m ago</p>
          </div>
        </div>

        {/* Network Attack Map Card */}
        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              IoT Network Topology
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Live visualization of connected medical IoT devices and network communication
            </p>
          </div>
          <div className="w-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden" style={{ minHeight: '600px' }}>
            <NetworkAttackMap key={refreshKey} />
          </div>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            💡 Tip: Hover over nodes to see device details. Click and drag to interact with the network map.
          </p>
        </div>

        {/* Network Activity Log */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* AI Analyst Panel - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <AIAnalystPanel />
            </div>
          </div>

          {/* Device Status - Takes 1 column */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Device Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-slate-900 dark:text-slate-100">
                    Infusion Pump
                  </span>
                </div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  NORMAL
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-slate-900 dark:text-slate-100">
                    Patient Monitor
                  </span>
                </div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  NORMAL
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-slate-900 dark:text-slate-100">
                    MRI Controller
                  </span>
                </div>
                <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                  SUSPICIOUS
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-slate-900 dark:text-slate-100">
                    HVAC Controller
                  </span>
                </div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  NORMAL
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-slate-900 dark:text-slate-100">
                    Nurse Station
                  </span>
                </div>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                  COMPROMISED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
