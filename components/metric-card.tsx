import React from 'react';
import { useTheme } from '@/contexts/theme-context';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function MetricCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  variant = 'default',
}: MetricCardProps) {
  const { cyberMode } = useTheme();

  const getTextColor = () => {
    switch (variant) {
      case 'success':
        return 'text-green-700 dark:text-green-300';
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-300';
      case 'danger':
        return 'text-red-700 dark:text-red-300';
      default:
        return 'text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div
      className={`rounded-lg p-8 glass-effect-medium card-hover-effect ${
        cyberMode ? 'cyber-border' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {title}
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <p className={`text-4xl font-bold ${getTextColor()}`}>
              {value}
            </p>
            {trendValue && (
              <span
                className={`text-sm font-semibold ${
                  trend === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : trend === 'down'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {trend === 'up' && '↑'} {trend === 'down' && '↓'}{' '}
                {trendValue}
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-md glass-effect-light`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
