'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, Marker, MapProvider } from 'react-simple-maps';
import { AlertCircle, Play, Pause } from 'lucide-react';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface AttackOrigin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  color: string;
  isInteractive: boolean;
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
  {
    id: 'russia',
    name: 'Russia',
    lat: 55.75,
    lng: 37.62,
    color: '#ef4444',
    isInteractive: true,
  },
  {
    id: 'china',
    name: 'China',
    lat: 39.9,
    lng: 116.4,
    color: '#f59e0b',
    isInteractive: true,
  },
  {
    id: 'unknown',
    name: 'Unknown',
    lat: 0,
    lng: 0,
    color: '#eab308',
    isInteractive: false,
  },
];

const HOSPITAL_LOCATION = { lat: 40.7128, lng: -74.006 }; // New York area

export function GlobalThreatMap() {
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [attackHistory, setAttackHistory] = useState<Attack[]>([]);

  // Generate random attack from Unknown origin
  const generateRandomAttack = useCallback(() => {
    const rand = Math.random();
    let severity: 'critical' | 'alert' | 'warning' = 'critical';
    if (rand < 0.6) severity = 'critical';
    else if (rand < 0.9) severity = 'alert';
    else severity = 'warning';

    const randomLat = (Math.random() - 0.5) * 180;
    const randomLng = (Math.random() - 0.5) * 360;

    const originId = ['russia', 'china', 'unknown'][Math.floor(Math.random() * 3)];
    const origin = ATTACK_ORIGINS.find((o) => o.id === originId) || ATTACK_ORIGINS[2];

    let finalName = origin.name;

    if (originId === 'unknown') {
      finalName = `Unknown (${randomLat > 0 ? 'N' : 'S'}, ${randomLng > 0 ? 'E' : 'W'})`;
    }

    const attack: Attack = {
      id: `attack-${Date.now()}-${Math.random()}`,
      originId,
      originName: finalName,
      severity,
      status: 'active',
      startTime: new Date(),
      duration: 5000, // 5 seconds
    };

    return attack;
  }, []);

  // Auto-generate attacks when playing
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const newAttack = generateRandomAttack();
      setAttacks((prev) => [...prev, newAttack]);
      setAttackHistory((prev) => [newAttack, ...prev].slice(0, 20));

      // Remove completed attacks after duration
      setTimeout(() => {
        setAttacks((prev) =>
          prev.filter((a) => a.id !== newAttack.id)
        );
      }, newAttack.duration);
    }, 4000 + Math.random() * 2000); // 4-6 seconds

    return () => clearInterval(interval);
  }, [isPlaying, generateRandomAttack]);

  // Handle country click to create attack
  const handleGeographyClick = (geo: { properties?: Record<string, unknown> }) => {
    const properties = geo.properties;
    if (!properties) return;

    // Find closest attack origin or use random
    const newAttack = generateRandomAttack();
    setAttacks((prev) => [...prev, newAttack]);
    setAttackHistory((prev) => [newAttack, ...prev].slice(0, 20));

    setTimeout(() => {
      setAttacks((prev) =>
        prev.filter((a) => a.id !== newAttack.id)
      );
    }, newAttack.duration);
  };

  const stats = useMemo(() => {
    return {
      totalAttacked: new Set(attackHistory.map((a) => a.originId)).size,
      activeFlows: attacks.length,
      historyCount: attackHistory.length,
      criticalCount: attackHistory.filter((a) => a.severity === 'critical').length,
      alertCount: attackHistory.filter((a) => a.severity === 'alert').length,
      warningCount: attackHistory.filter((a) => a.severity === 'warning').length,
    };
  }, [attacks, attackHistory]);

  const getSeverityColor = (severity: 'critical' | 'alert' | 'warning') => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'alert':
        return '#f59e0b';
      case 'warning':
        return '#eab308';
    }
  };

  const getSeverityLabel = (severity: 'critical' | 'alert' | 'warning') => {
    switch (severity) {
      case 'critical':
        return 'CRITICAL';
      case 'alert':
        return 'ALERT';
      case 'warning':
        return 'WARNING';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Legend and Controls */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Global Threat Origins</h3>
            <p className="text-xs text-slate-400 mt-1">Attack flows to hospital network (click countries to simulate)</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
          <div className="bg-slate-800 rounded p-3">
            <p className="text-xs text-slate-400">Active Flows</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{stats.activeFlows}</p>
          </div>
          <div className="bg-slate-800 rounded p-3">
            <p className="text-xs text-slate-400">Total Attacked</p>
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
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-300">Russia (Critical)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-slate-300">China (Alert)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-slate-300">Unknown (Warning)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-300">Hospital Network</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-lg border border-slate-700 bg-slate-900 overflow-hidden" style={{ minHeight: '500px' }}>
        {/* Pause/Play Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute top-4 left-4 z-10 p-2 rounded-lg bg-slate-800 border border-slate-600 hover:bg-slate-700 transition text-slate-100"
          title={isPlaying ? 'Pause animations' : 'Resume animations'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        {/* Map */}
        <MapProvider>
          <ComposableMap projection="geoMercator">
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => handleGeographyClick(geo)}
                  className="cursor-pointer"
                  style={{
                    default: {
                      fill: 'rgb(15, 23, 42)',
                      stroke: 'rgb(51, 65, 85)',
                      strokeWidth: 0.75,
                      outline: 'none',
                      transition: 'all 250ms',
                    },
                    hover: {
                      fill: 'rgb(30, 41, 59)',
                      stroke: 'rgb(71, 85, 105)',
                      strokeWidth: 0.75,
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 250ms',
                    },
                    pressed: {
                      fill: 'rgb(51, 65, 85)',
                      stroke: 'rgb(100, 116, 139)',
                      strokeWidth: 0.75,
                      outline: 'none',
                    },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Hospital Marker */}
          <Marker coordinates={[HOSPITAL_LOCATION.lng, HOSPITAL_LOCATION.lat]}>
            <circle r={8} fill="rgb(59, 130, 246)" stroke="rgb(30, 144, 255)" strokeWidth={2} filter="url(#glow)" />
            <text y={20} textAnchor="middle" style={{ fontSize: '10px', fill: 'rgb(59, 130, 246)', fontWeight: 'bold' }}>
              Hospital
            </text>
          </Marker>

          {/* Attack Origins */}
          {ATTACK_ORIGINS.map((origin) => (
            <Marker key={origin.id} coordinates={[origin.lng, origin.lat]}>
              <circle r={6} fill={origin.color} opacity={0.8} stroke="rgb(248, 248, 248)" strokeWidth={1.5} />
              <text
                y={16}
                textAnchor="middle"
                style={{
                  fontSize: '10px',
                  fill: origin.color,
                  fontWeight: 'bold',
                }}
              >
                {origin.name}
              </text>
            </Marker>
          ))}

          {/* Attack Lines */}
          {attacks.map((attack) => {
            const origin = ATTACK_ORIGINS.find((o) => o.id === attack.originId);
            if (!origin) return null;

            return (
              <line
                key={attack.id}
                x1={origin.lng}
                y1={origin.lat}
                x2={HOSPITAL_LOCATION.lng}
                y2={HOSPITAL_LOCATION.lat}
                stroke={getSeverityColor(attack.severity)}
                strokeWidth={2}
                opacity={0.7}
                className="attack-line"
                style={{
                  strokeDasharray: '5, 5',
                  animation: isPlaying ? 'animateDash 1s linear infinite' : 'none',
                  filter: `drop-shadow(0 0 4px ${getSeverityColor(attack.severity)})`,
                }}
              />
            );
          })}

          {/* SVG Filter for Glow Effect */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          </ComposableMap>
        </MapProvider>

        {/* Glow CSS Animation */}
        <style>{`
          @keyframes animateDash {
            to {
              stroke-dashoffset: -100;
            }
          }

          .attack-line {
            stroke-dasharray: 5, 5;
            stroke-dashoffset: 0;
          }
        `}</style>
      </div>

      {/* Attack History */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
        <h3 className="text-sm font-semibold text-slate-100 mb-4">Attack History</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {attackHistory.length === 0 ? (
            <p className="text-xs text-slate-500">No attacks recorded yet. Click countries or wait for auto-generation.</p>
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
