'use client';

import React, { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Device } from '@/lib/types';

interface TrustRadarProps {
  device: Device;
}

export function TrustRadar({ device }: TrustRadarProps) {
  const radarData = useMemo(() => {
    // Calculate trust factor scores (0-100) based on device metrics

    // 1. Traffic Volume: Lower traffic = healthier (inverted score)
    // Normalize to 0-100 range (0 bytes = 100, 1M+ bytes = 0)
    const maxTraffic = 1000000; // 1MB threshold
    const trafficScore = Math.max(0, 100 - (device.trafficVolume / maxTraffic) * 100);

    // 2. DNS Activity: Fewer DNS queries = healthier (inverted score)
    // Normalize to 0-100 range (0 queries = 100, 500+ queries = 0)
    const maxDnsQueries = 500;
    const dnsScore = Math.max(0, 100 - (device.dnsQueries / maxDnsQueries) * 100);

    // 3. IP Diversity: Fewer unique IPs = healthier (less scanning/lateral movement)
    // Normalize to 0-100 range (0 IPs = 100, 50+ IPs = 0)
    const maxIpConnections = 50;
    const ipDiversityScore = Math.max(0, 100 - (device.uniqueIpConnections / maxIpConnections) * 100);

    // 4. Off-hour Behavior: Score based on last activity time
    // Devices active during off-hours get lower scores
    const lastActivity = new Date(device.lastActivity);
    const hour = lastActivity.getHours();
    const isOffHours = hour < 6 || hour > 18; // Outside 6 AM - 6 PM
    const offHourScore = isOffHours ? 30 : 85; // Risk during off-hours

    // 5. Packet Entropy: Simulated from trust score and traffic patterns
    // Higher trust score = lower entropy (more predictable patterns)
    const packetEntropyScore = device.trustScore * 1.1; // Scale trust score slightly

    return [
      {
        factor: 'Traffic Volume',
        value: Math.round(trafficScore),
        description: `${device.trafficVolume.toLocaleString()} bytes`,
      },
      {
        factor: 'DNS Activity',
        value: Math.round(dnsScore),
        description: `${device.dnsQueries} queries`,
      },
      {
        factor: 'IP Diversity',
        value: Math.round(ipDiversityScore),
        description: `${device.uniqueIpConnections} unique IPs`,
      },
      {
        factor: 'Off-hour Behavior',
        value: Math.round(offHourScore),
        description: `Active at ${hour}:00 ${isOffHours ? '(off-hours)' : '(business hours)'}`,
      },
      {
        factor: 'Packet Entropy',
        value: Math.round(Math.min(100, packetEntropyScore)),
        description: 'Pattern predictability',
      },
    ];
  }, [device]);

  const getTrustColor = (value: number): string => {
    if (value >= 80) return '#22c55e'; // Green - Secure
    if (value >= 60) return '#eab308'; // Yellow - Caution
    if (value >= 40) return '#f59e0b'; // Orange - Warning
    return '#ef4444'; // Red - Critical
  };

  const getFactorStatus = (value: number): string => {
    if (value >= 80) return 'Secure';
    if (value >= 60) return 'Normal';
    if (value >= 40) return 'Caution';
    return 'Risk';
  };

  return (
    <div className="w-full space-y-4">
      {/* Radar Chart */}
      <div className="flex justify-center">
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="rgb(71, 85, 105)" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="factor"
              tick={{ fill: 'rgb(148, 163, 184)', fontSize: 11 }}
            />
            <PolarRadiusAxis
              domain={[0, 100]}
              tick={{ fill: 'rgb(100, 116, 139)', fontSize: 10 }}
              label={{ value: 'Trust Score', angle: 90, position: 'insideBottomLeft', offset: 5 }}
            />
            <Radar
              name="Trust Factors"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.4}
              animationDuration={800}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(15, 23, 42)',
                border: '1px solid rgb(71, 85, 105)',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: 'rgb(226, 232, 240)' }}
              formatter={(value: number) => [
                `${value}/100`,
                'Trust Score',
              ]}
              labelFormatter={(label) => `${label}`}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Factor Details */}
      <div className="border-t border-slate-700 pt-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Trust Factor Breakdown
        </h4>
        <div className="space-y-2">
          {radarData.map((factor) => (
            <div
              key={factor.factor}
              className="flex items-center justify-between rounded-lg bg-slate-800 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getTrustColor(factor.value) }}
                  />
                  <p className="text-sm font-medium text-slate-100">{factor.factor}</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">{factor.description}</p>
              </div>
              <div className="ml-2 flex-shrink-0 text-right">
                <div className="text-lg font-bold" style={{ color: getTrustColor(factor.value) }}>
                  {factor.value}
                </div>
                <p className="text-xs text-slate-500">{getFactorStatus(factor.value)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="border-t border-slate-700 pt-4">
        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: getTrustColor(device.trustScore) + '15',
            borderColor: getTrustColor(device.trustScore) + '40',
            borderWidth: '1px',
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Overall Device Trust
          </p>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold" style={{ color: getTrustColor(device.trustScore) }}>
              {device.trustScore.toFixed(1)}
            </div>
            <div className="flex-1">
              <div className="w-full overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-2 transition-all"
                  style={{
                    width: `${device.trustScore}%`,
                    backgroundColor: getTrustColor(device.trustScore),
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {getFactorStatus(device.trustScore)} - {device.status}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
