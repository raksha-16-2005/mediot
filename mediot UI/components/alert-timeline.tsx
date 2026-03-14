'use client';

import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Alert } from '@/lib/types';

interface AlertTimelineProps {
  alerts: Alert[];
  isLoading?: boolean;
}

interface TimelineDataPoint {
  time: string;
  critical: number;
  warning: number;
  info: number;
  total: number;
}

export function AlertTimeline({ alerts, isLoading = false }: AlertTimelineProps) {
  // Generate timeline data from alerts
  const generateTimelineData = (): TimelineDataPoint[] => {
    const timelineMap = new Map<string, { critical: number; warning: number; info: number }>();

    alerts.forEach((alert) => {
      const date = new Date(alert.timestamp);
      const hour = `${String(date.getHours()).padStart(2, '0')}:00`;

      if (!timelineMap.has(hour)) {
        timelineMap.set(hour, { critical: 0, warning: 0, info: 0 });
      }

      const data = timelineMap.get(hour)!;
      if (alert.severity === 'Critical') data.critical++;
      else if (alert.severity === 'Warning' || alert.severity === 'Alert') data.warning++;
      else data.info++;
    });

    // Fill in all hours for consistent timeline
    const timeline: TimelineDataPoint[] = [];
    for (let i = 0; i < 24; i++) {
      const hour = `${String(i).padStart(2, '0')}:00`;
      const data = timelineMap.get(hour) || { critical: 0, warning: 0, info: 0 };
      timeline.push({
        time: hour,
        critical: data.critical,
        warning: data.warning,
        info: data.info,
        total: data.critical + data.warning + data.info,
      });
    }

    return timeline;
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-80 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  const timelineData = generateTimelineData();

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Alert Timeline (24h)
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={timelineData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12 }}
            interval={2}
          />
          <YAxis />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '0.5rem',
            }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                critical: 'Critical',
                warning: 'Warning',
                info: 'Info',
                total: 'Total Alerts',
              };
              return [value, labels[name] || name];
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar
            dataKey="critical"
            fill="#ef4444"
            name="Critical"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="warning"
            fill="#eab308"
            name="Warning"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="info"
            fill="#0284c7"
            name="Info"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#64748b"
            strokeWidth={2}
            dot={false}
            name="Total"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
