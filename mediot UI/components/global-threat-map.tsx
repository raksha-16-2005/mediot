'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { AlertCircle, Play, Pause } from 'lucide-react';

interface AttackOrigin {
  id: string;
  name: string;
  x: number; // SVG x coordinate on world map
  y: number; // SVG y coordinate on world map
  color: string;
}

interface Attack {
  id: string;
  originId: string;
  originName: string;
  severity: 'critical' | 'alert' | 'warning';
  status: 'active' | 'completed';
  startTime: Date;
  duration: number;
}

const ATTACK_ORIGINS: AttackOrigin[] = [
  { id: 'russia', name: 'Russia', x: 680, y: 120, color: '#ef4444' },
  { id: 'china', name: 'China', x: 750, y: 200, color: '#f59e0b' },
  { id: 'brazil', name: 'Brazil', x: 310, y: 340, color: '#a855f7' },
  { id: 'iran', name: 'Iran', x: 620, y: 210, color: '#ec4899' },
  { id: 'nkorea', name: 'N. Korea', x: 790, y: 185, color: '#f97316' },
];

const HOSPITAL = { x: 220, y: 175, name: 'Hospital Network' };

export function GlobalThreatMap() {
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [attackHistory, setAttackHistory] = useState<Attack[]>([]);

  const generateRandomAttack = useCallback(() => {
    const origins = ['russia', 'china', 'brazil', 'iran', 'nkorea'];
    const originId = origins[Math.floor(Math.random() * origins.length)];
    const origin = ATTACK_ORIGINS.find((o) => o.id === originId)!;

    const rand = Math.random();
    const severity: 'critical' | 'alert' | 'warning' =
      rand < 0.5 ? 'critical' : rand < 0.8 ? 'alert' : 'warning';

    return {
      id: `attack-${Date.now()}-${Math.random()}`,
      originId,
      originName: origin.name,
      severity,
      status: 'active' as const,
      startTime: new Date(),
      duration: 5000,
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const newAttack = generateRandomAttack();
      setAttacks((prev) => [...prev, newAttack]);
      setAttackHistory((prev) => [newAttack, ...prev].slice(0, 20));

      setTimeout(() => {
        setAttacks((prev) => prev.filter((a) => a.id !== newAttack.id));
      }, newAttack.duration);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [isPlaying, generateRandomAttack]);

  const stats = useMemo(() => ({
    activeFlows: attacks.length,
    totalAttacked: new Set(attackHistory.map((a) => a.originId)).size,
    historyCount: attackHistory.length,
    criticalCount: attackHistory.filter((a) => a.severity === 'critical').length,
    alertCount: attackHistory.filter((a) => a.severity === 'alert').length,
    warningCount: attackHistory.filter((a) => a.severity === 'warning').length,
  }), [attacks, attackHistory]);

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return '#ef4444';
    if (severity === 'alert') return '#f59e0b';
    return '#eab308';
  };

  const getSeverityLabel = (severity: string) => severity.toUpperCase();

  return (
    <div className="w-full space-y-4">
      {/* Legend and Controls */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Global Threat Origins</h3>
            <p className="text-xs text-slate-400 mt-1">Live attack flows to hospital network</p>
          </div>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-slate-800 border border-slate-600 hover:bg-slate-700 transition text-slate-100"
            title={isPlaying ? 'Pause' : 'Resume'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
          <div className="bg-slate-800 rounded p-3">
            <p className="text-xs text-slate-400">Active Flows</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{stats.activeFlows}</p>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <p className="text-xs text-slate-400">Origins</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{stats.totalAttacked}</p>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <p className="text-xs text-slate-400">Critical</p>
            <p className="text-2xl font-bold text-red-500 mt-1">{stats.criticalCount}</p>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <p className="text-xs text-slate-400">Alert</p>
            <p className="text-2xl font-bold text-orange-500 mt-1">{stats.alertCount}</p>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <p className="text-xs text-slate-400">Warning</p>
            <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.warningCount}</p>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <p className="text-xs text-slate-400">History</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{stats.historyCount}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          {ATTACK_ORIGINS.map((o) => (
            <div key={o.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: o.color }} />
              <span className="text-slate-300">{o.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-300">Hospital Network</span>
          </div>
        </div>
      </div>

      {/* SVG Map */}
      <div className="relative rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
        <svg viewBox="0 0 960 500" className="w-full" style={{ minHeight: '400px' }}>
          {/* Background */}
          <rect width="960" height="500" fill="#0f172a" />

          {/* Simplified world map continents */}
          {/* North America */}
          <path d="M120,80 L280,80 L300,120 L280,160 L300,200 L260,240 L220,220 L180,240 L140,200 L100,180 L80,120 Z"
            fill="#1e293b" stroke="#334155" strokeWidth="1" />
          {/* South America */}
          <path d="M240,260 L300,260 L330,300 L340,360 L320,420 L280,440 L250,400 L230,340 L220,300 Z"
            fill="#1e293b" stroke="#334155" strokeWidth="1" />
          {/* Europe */}
          <path d="M440,80 L520,70 L560,90 L540,130 L560,150 L520,160 L480,140 L440,150 L430,120 Z"
            fill="#1e293b" stroke="#334155" strokeWidth="1" />
          {/* Africa */}
          <path d="M460,180 L540,180 L560,220 L570,300 L540,380 L500,400 L460,370 L440,300 L430,240 L440,200 Z"
            fill="#1e293b" stroke="#334155" strokeWidth="1" />
          {/* Asia */}
          <path d="M560,60 L750,50 L820,80 L850,120 L830,180 L800,200 L750,220 L700,230 L650,220 L600,200 L570,170 L560,130 Z"
            fill="#1e293b" stroke="#334155" strokeWidth="1" />
          {/* Australia */}
          <path d="M780,320 L860,310 L880,340 L870,380 L840,390 L800,380 L780,350 Z"
            fill="#1e293b" stroke="#334155" strokeWidth="1" />

          {/* Grid lines */}
          {[100, 200, 300, 400].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="960" y2={y} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
          ))}
          {[200, 400, 600, 800].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="500" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
          ))}

          {/* Attack lines (animated) */}
          {attacks.map((attack) => {
            const origin = ATTACK_ORIGINS.find((o) => o.id === attack.originId);
            if (!origin) return null;
            const color = getSeverityColor(attack.severity);
            return (
              <g key={attack.id}>
                <line
                  x1={origin.x} y1={origin.y}
                  x2={HOSPITAL.x} y2={HOSPITAL.y}
                  stroke={color} strokeWidth="2" opacity="0.6"
                  strokeDasharray="8 4"
                >
                  <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="0.8s" repeatCount="indefinite" />
                </line>
                {/* Glow effect */}
                <line
                  x1={origin.x} y1={origin.y}
                  x2={HOSPITAL.x} y2={HOSPITAL.y}
                  stroke={color} strokeWidth="4" opacity="0.15"
                />
              </g>
            );
          })}

          {/* Hospital marker */}
          <circle cx={HOSPITAL.x} cy={HOSPITAL.y} r="12" fill="#3b82f6" opacity="0.3">
            <animate attributeName="r" values="12;18;12" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={HOSPITAL.x} cy={HOSPITAL.y} r="8" fill="#3b82f6" stroke="#60a5fa" strokeWidth="2" />
          <text x={HOSPITAL.x} y={HOSPITAL.y + 22} textAnchor="middle" fontSize="10" fill="#60a5fa" fontWeight="bold">
            Hospital
          </text>

          {/* Attack origin markers */}
          {ATTACK_ORIGINS.map((origin) => {
            const hasActiveAttack = attacks.some((a) => a.originId === origin.id);
            return (
              <g key={origin.id}>
                {hasActiveAttack && (
                  <circle cx={origin.x} cy={origin.y} r="14" fill={origin.color} opacity="0.2">
                    <animate attributeName="r" values="14;22;14" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.2;0.05;0.2" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={origin.x} cy={origin.y} r="6" fill={origin.color} stroke="#f8f8f8" strokeWidth="1.5" opacity="0.9" />
                <text x={origin.x} y={origin.y - 12} textAnchor="middle" fontSize="10" fill={origin.color} fontWeight="bold">
                  {origin.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Attack History */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
        <h3 className="text-sm font-semibold text-slate-100 mb-4">Attack History</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {attackHistory.length === 0 ? (
            <p className="text-xs text-slate-500">No attacks recorded yet. Wait for auto-generation.</p>
          ) : (
            attackHistory.map((attack) => (
              <div
                key={attack.id}
                className={`flex items-center justify-between p-2 rounded border text-xs ${
                  attack.severity === 'critical'
                    ? 'border-red-700 bg-red-900/20 text-red-200'
                    : attack.severity === 'alert'
                      ? 'border-orange-700 bg-orange-900/20 text-orange-200'
                      : 'border-yellow-700 bg-yellow-900/20 text-yellow-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  <div>
                    <p className="font-semibold">{attack.originName}</p>
                    <p className="text-xs opacity-75">{attack.startTime.toLocaleTimeString()}</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded font-bold text-xs">{getSeverityLabel(attack.severity)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
