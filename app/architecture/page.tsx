'use client';

import React from 'react';

interface StageInfo {
  title: string;
  icon: string;
  description: string;
  details: string[];
  color: string;
  bgColor: string;
}

const stages: StageInfo[] = [
  {
    title: 'IoT Devices',
    icon: '🏥',
    description: 'Hospital medical IoT devices connected to the network',
    details: [
      'Infusion Pumps',
      'Patient Monitors',
      'MRI Controllers',
      'HVAC Systems',
      'Nurse Stations',
    ],
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    title: 'Network Telemetry',
    icon: '📡',
    description: 'Real-time collection of network traffic and device metrics',
    details: [
      'Network packet capture',
      'DNS query logging',
      'IP connection tracking',
      'Traffic volume analysis',
      'Off-hour activity detection',
    ],
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
  },
  {
    title: 'Feature Extraction',
    icon: '🔍',
    description: 'Convert raw telemetry into normalized ML features',
    details: [
      'DNS query normalization',
      'Traffic pattern features',
      'Connection behavior analysis',
      'Temporal feature extraction',
      'Behavioral signature generation',
    ],
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    title: 'Anomaly Detection Model',
    icon: '🤖',
    description: 'ML model identifying unusual device behavior',
    details: [
      'Isolation Forest algorithm',
      'K-Means clustering',
      'Real-time scoring',
      '92%+ accuracy',
      'Sub-second inference',
    ],
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
  },
  {
    title: 'Trust Score Engine',
    icon: '⚖️',
    description: 'Calculate comprehensive device trustworthiness score',
    details: [
      'Multi-factor trust calculation',
      'Behavioral pattern scoring',
      'Risk level assignment',
      'Threat prioritization',
      'Real-time score updates',
    ],
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    title: 'Security Dashboard',
    icon: '📊',
    description: 'Comprehensive SOC monitoring and incident response',
    details: [
      'Real-time device monitoring',
      'Alert management system',
      'Incident investigation tools',
      'Behavioral analytics',
      'SOC operator interface',
    ],
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
];

function Arrow({ direction = 'vertical' }: { direction?: 'vertical' | 'horizontal' }) {
  if (direction === 'vertical') {
    return (
      <div className="flex justify-center py-4">
        <div className="relative h-8 w-1 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600">
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 transform text-slate-400 dark:text-slate-500">
            ▼
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-center px-0 sm:px-2">
      <div className="relative h-1 w-8 bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600">
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 transform text-slate-400 dark:text-slate-500">
          ▶
        </div>
      </div>
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
            System Architecture
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            MedIoT Shield: Intelligent IoT Security Pipeline
          </p>
          <p className="mt-4 max-w-3xl text-slate-700 dark:text-slate-300">
            A comprehensive security platform for hospital IoT networks using machine learning to detect
            anomalies, calculate trust scores, and enable SOC teams to respond to threats in real-time.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* System Overview Statistics */}
        <div className="mb-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Devices Monitored
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
              50+
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Hospital IoT endpoints in real-time
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Detection Accuracy
            </p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              92%+
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              ML-based anomaly detection
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Response Time
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
              &lt;1s
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              From detection to alert
            </p>
          </div>
        </div>

        {/* Architecture Pipeline - Desktop */}
        <div className="mb-12 hidden lg:block">
          <div className="rounded-lg border-2 border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-8 text-2xl font-bold text-slate-900 dark:text-slate-100">
              Data Flow Pipeline
            </h2>

            {/* Desktop Layout - Horizontal */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {stages.map((stage, index) => (
                <React.Fragment key={stage.title}>
                  {/* Stage Card */}
                  <div className="flex-1 min-w-fit">
                    <div
                      className={`rounded-lg border border-slate-200 ${stage.bgColor} p-4 dark:border-slate-700 transition-all hover:shadow-lg`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{stage.icon}</span>
                        <h3 className={`font-bold ${stage.color}`}>
                          {stage.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  {index < stages.length - 1 && (
                    <div className="px-2">
                      <Arrow direction="horizontal" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Architecture Pipeline - Mobile/Tablet */}
        <div className="mb-12 lg:hidden">
          <div className="rounded-lg border-2 border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-8 text-2xl font-bold text-slate-900 dark:text-slate-100">
              Data Flow Pipeline
            </h2>

            {/* Vertical Layout */}
            <div className="space-y-0">
              {stages.map((stage, index) => (
                <React.Fragment key={stage.title}>
                  {/* Stage Card */}
                  <div
                    className={`rounded-lg border border-slate-200 ${stage.bgColor} p-4 dark:border-slate-700 transition-all hover:shadow-lg`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{stage.icon}</span>
                      <h3 className={`font-bold ${stage.color}`}>
                        {stage.title}
                      </h3>
                    </div>
                  </div>

                  {/* Arrow */}
                  {index < stages.length - 1 && <Arrow direction="vertical" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Stage Explanations */}
        <div className="mb-12">
          <h2 className="mb-8 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Pipeline Stages
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {stages.map((stage) => (
              <div
                key={stage.title}
                className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-lg"
              >
                {/* Header */}
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-4xl">{stage.icon}</span>
                  <div>
                    <h3 className={`text-xl font-bold ${stage.color}`}>
                      {stage.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">
                  {stage.description}
                </p>

                {/* Details List */}
                <div className={`rounded-lg ${stage.bgColor} p-4 dark:border-slate-700`}>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Key Components
                  </h4>
                  <ul className="space-y-1">
                    {stage.details.map((detail) => (
                      <li
                        key={detail}
                        className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="mb-12">
          <h2 className="mb-8 text-2xl font-bold text-slate-900 dark:text-slate-100">
            System Capabilities
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
              <h3 className="font-bold text-green-900 dark:text-green-100">
                🔒 Real-Time Monitoring
              </h3>
              <p className="mt-2 text-sm text-green-800 dark:text-green-200">
                Continuous device telemetry collection and analysis with sub-second processing
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
              <h3 className="font-bold text-blue-900 dark:text-blue-100">
                🤖 ML Anomaly Detection
              </h3>
              <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                Advanced machine learning models with 92%+ accuracy for identifying behavioral anomalies
              </p>
            </div>

            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-900/20">
              <h3 className="font-bold text-purple-900 dark:text-purple-100">
                📊 Trust Scoring
              </h3>
              <p className="mt-2 text-sm text-purple-800 dark:text-purple-200">
                Multi-factor trust engine assigning confidence scores to each device
              </p>
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-900/20">
              <h3 className="font-bold text-orange-900 dark:text-orange-100">
                🎯 Threat Prioritization
              </h3>
              <p className="mt-2 text-sm text-orange-800 dark:text-orange-200">
                Intelligent alert prioritization based on severity and impact assessment
              </p>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
              <h3 className="font-bold text-red-900 dark:text-red-100">
                🚨 Incident Response
              </h3>
              <p className="mt-2 text-sm text-red-800 dark:text-red-200">
                Comprehensive tools for SOC teams to investigate and respond to incidents
              </p>
            </div>

            <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-900 dark:bg-cyan-900/20">
              <h3 className="font-bold text-cyan-900 dark:text-cyan-100">
                📈 Analytics Dashboards
              </h3>
              <p className="mt-2 text-sm text-cyan-800 dark:text-cyan-200">
                Advanced behavioral analytics and ML-driven security insights
              </p>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mb-12">
          <h2 className="mb-8 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Technology Stack
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">
                Frontend & UI
              </h3>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>• Next.js 14 - React framework with server components</li>
                <li>• TypeScript - Full static type checking</li>
                <li>• Tailwind CSS - Responsive UI styling</li>
                <li>• Recharts - Interactive data visualizations</li>
              </ul>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">
                ML & Analytics
              </h3>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>• Isolation Forest - Anomaly detection algorithm</li>
                <li>• K-Means Clustering - Device behavior clustering</li>
                <li>• Real-time Scoring - Sub-second inference</li>
                <li>• Feature Normalization - ML-ready data processing</li>
              </ul>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">
                Data & APIs
              </h3>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>• RESTful APIs - Device and alert endpoints</li>
                <li>• Real-time Data - Network telemetry streaming</li>
                <li>• Mock Data Generation - Realistic test data</li>
                <li>• Type-Safe Interfaces - TypeScript types</li>
              </ul>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">
                Architecture
              </h3>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>• Modular Components - Reusable UI components</li>
                <li>• Client-Side Rendering - Interactive dashboards</li>
                <li>• Responsive Design - Mobile to desktop</li>
                <li>• Dark Mode - System-wide theme support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Flow Explanation */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
            How It Works
          </h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Device Connection
                </h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">
                  Hospital IoT devices (pumps, monitors, controllers) connect to the network. The system
                  automatically discovers and registers these devices.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cyan-600 text-white font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Telemetry Collection
                </h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">
                  Real-time network packet capture, DNS query logging, and traffic analysis provides a
                  complete picture of device behavior.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 text-white font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Feature Engineering
                </h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">
                  Raw telemetry is transformed into normalized ML features including DNS patterns,
                  traffic signatures, and behavioral fingerprints.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-600 text-white font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Anomaly Detection
                </h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">
                  ML models (Isolation Forest + K-Means) analyze features and assign anomaly scores.
                  Unusual behavior patterns are flagged for analysis.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-white font-bold">
                5
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Trust Scoring
                </h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">
                  Multi-factor trust engine combines anomaly scores with behavioral analysis to assign a
                  comprehensive device trustworthiness score (0-100).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-white font-bold">
                6
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Security Response
                </h3>
                <p className="mt-1 text-slate-700 dark:text-slate-300">
                  SOC operators use comprehensive dashboards to monitor devices, investigate incidents,
                  view analytics, and respond to threats in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              MedIoT Shield • Intelligent Hospital IoT Security Platform
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
              Protecting healthcare networks through machine learning and real-time monitoring
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
