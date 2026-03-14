'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, AlertOctagon, Zap, Activity, ShieldAlert } from 'lucide-react';

export type ThreatLevel = 'critical' | 'alert' | 'warning';

interface Threat {
  id: string;
  level: ThreatLevel;
  message: string;
  timestamp: Date;
  icon?: React.ReactNode;
}

const MOCK_THREATS: Threat[] = [
  {
    id: '1',
    level: 'critical',
    message: 'CRITICAL: Device #32 abnormal DNS activity detected - 450+ queries/min',
    timestamp: new Date(Date.now() - 2000),
    icon: <AlertOctagon className="w-4 h-4" />,
  },
  {
    id: '2',
    level: 'alert',
    message: 'ALERT: HVAC controller contacted unknown IP 192.168.100.245',
    timestamp: new Date(Date.now() - 5000),
    icon: <ShieldAlert className="w-4 h-4" />,
  },
  {
    id: '3',
    level: 'warning',
    message: 'WARNING: Traffic spike detected on Nurse Station - 340MB in 5 mins',
    timestamp: new Date(Date.now() - 8000),
    icon: <Zap className="w-4 h-4" />,
  },
  {
    id: '4',
    level: 'critical',
    message: 'CRITICAL: Patient Monitor #7 attempting lateral movement to network segment C',
    timestamp: new Date(Date.now() - 11000),
    icon: <AlertOctagon className="w-4 h-4" />,
  },
  {
    id: '5',
    level: 'alert',
    message: 'ALERT: Infusion Pump #23 - Unauthorized protocol detected on port 9001',
    timestamp: new Date(Date.now() - 14000),
    icon: <ShieldAlert className="w-4 h-4" />,
  },
  {
    id: '6',
    level: 'warning',
    message: 'WARNING: MRI Controller - Off-hours access attempt from unknown location',
    timestamp: new Date(Date.now() - 17000),
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  {
    id: '7',
    level: 'critical',
    message: 'CRITICAL: Network-wide port scan detected from internal device',
    timestamp: new Date(Date.now() - 20000),
    icon: <AlertOctagon className="w-4 h-4" />,
  },
  {
    id: '8',
    level: 'warning',
    message: 'WARNING: Unusual batch file execution on HVAC management station',
    timestamp: new Date(Date.now() - 23000),
    icon: <Activity className="w-4 h-4" />,
  },
];

const getThreatColors = (level: ThreatLevel) => {
  switch (level) {
    case 'critical':
      return {
        bg: 'bg-red-900/20',
        border: 'border-red-700',
        text: 'text-red-100',
        badge: 'bg-red-600 text-red-50',
        pulse: 'animate-pulse',
      };
    case 'alert':
      return {
        bg: 'bg-orange-900/20',
        border: 'border-orange-700',
        text: 'text-orange-100',
        badge: 'bg-orange-600 text-orange-50',
        pulse: '',
      };
    case 'warning':
      return {
        bg: 'bg-yellow-900/20',
        border: 'border-yellow-700',
        text: 'text-yellow-100',
        badge: 'bg-yellow-600 text-yellow-50',
        pulse: '',
      };
    default:
      return {
        bg: 'bg-slate-700/20',
        border: 'border-slate-600',
        text: 'text-slate-100',
        badge: 'bg-slate-600 text-slate-50',
        pulse: '',
      };
  }
};

export function ThreatTicker() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    setThreats(MOCK_THREATS);

    // Simulate new threats arriving
    const threatInterval = setInterval(() => {
      const newThreats = [
        {
          id: Date.now().toString(),
          level: (['critical', 'alert', 'warning'] as ThreatLevel[])[
            Math.floor(Math.random() * 3)
          ],
          message: `New threat detected: Device ${Math.floor(Math.random() * 50)} showing anomalous behavior`,
          timestamp: new Date(),
          icon: <AlertCircle className="w-4 h-4" />,
        },
      ];

      setThreats((prev) => [...newThreats, ...prev].slice(0, 15)); // Keep last 15 threats
    }, 8000);

    return () => clearInterval(threatInterval);
  }, []);

  return (
    <div className="relative w-full bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900 border-b border-slate-700 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-900/5 via-transparent to-orange-900/5 pointer-events-none" />

      {/* Threat ticker */}
      <div className="relative px-4 py-3">
        {/* Controls */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-slate-300 uppercase">Live Threats</span>
          </div>
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {isAnimating ? '⏸ Pause' : '▶ Play'}
          </button>
        </div>

        {/* Scrolling container */}
        <div className="relative overflow-hidden">
          {/* Gradient overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

          {/* Scrolling threats */}
          <div
            className={`flex gap-3 ${isAnimating ? 'animate-scroll' : ''}`}
            style={
              isAnimating
                ? {
                    animation: `scroll 50s linear infinite`,
                  }
                : {}
            }
          >
            {/* Display threats twice for seamless looping */}
            {[...threats, ...threats].map((threat, index) => (
              <div
                key={`${threat.id}-${index}`}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border ${getThreatColors(threat.level).bg} ${getThreatColors(threat.level).border} ${getThreatColors(threat.level).text} whitespace-nowrap ${getThreatColors(threat.level).pulse}`}
              >
                {threat.icon && (
                  <div className="flex-shrink-0 flex items-center justify-center w-4 h-4">
                    {threat.icon}
                  </div>
                )}
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${getThreatColors(threat.level).badge}`}>
                  {threat.level.toUpperCase()}
                </span>
                <span className="text-xs truncate">{threat.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Threat stats */}
        <div className="flex gap-4 mt-3 text-xs text-slate-400">
          <div>
            Critical:{' '}
            <span className="text-red-400 font-semibold">
              {threats.filter((t) => t.level === 'critical').length}
            </span>
          </div>
          <div>
            Alerts:{' '}
            <span className="text-orange-400 font-semibold">
              {threats.filter((t) => t.level === 'alert').length}
            </span>
          </div>
          <div>
            Warnings:{' '}
            <span className="text-yellow-400 font-semibold">
              {threats.filter((t) => t.level === 'warning').length}
            </span>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 50s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-scroll {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
