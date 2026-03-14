import React from 'react';

interface TrustScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function TrustScoreGauge({ score, size = 'md' }: TrustScoreGaugeProps) {
  const getColor = (value: number) => {
    if (value >= 80) return { color: '#22c55e', label: 'Secure' };
    if (value >= 50) return { color: '#eab308', label: 'Caution' };
    return { color: '#ef4444', label: 'Critical' };
  };

  const theme = getColor(score);
  const normalizedScore = Math.min(100, Math.max(0, score));
  const rotation = (normalizedScore / 100) * 180 - 90;

  const sizeConfig = {
    sm: { diameter: 120, fontSize: 'text-lg' },
    md: { diameter: 160, fontSize: 'text-2xl' },
    lg: { diameter: 200, fontSize: 'text-3xl' },
  };

  const config = sizeConfig[size];

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Gauge SVG */}
      <div style={{ position: 'relative', width: config.diameter, height: config.diameter / 2 }}>
        <svg
          width={config.diameter}
          height={config.diameter / 2}
          style={{ overflow: 'visible' }}
          viewBox={`0 0 ${config.diameter} ${config.diameter / 2}`}
        >
          {/* Background Arc */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>

          {/* Gauge track */}
          <path
            d={`M ${config.diameter * 0.1} ${config.diameter / 2} A ${config.diameter * 0.4} ${config.diameter * 0.4} 0 0 1 ${config.diameter * 0.9} ${config.diameter / 2}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={config.diameter * 0.08}
            strokeLinecap="round"
          />

          {/* Needle */}
          <g transform={`translate(${config.diameter / 2}, ${config.diameter / 2})`}>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={-config.diameter * 0.35}
              stroke={theme.color}
              strokeWidth={config.diameter * 0.04}
              strokeLinecap="round"
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: '0 0',
                transition: 'transform 0.5s ease-out',
              }}
            />
            {/* Center circle */}
            <circle
              cx="0"
              cy="0"
              r={config.diameter * 0.05}
              fill={theme.color}
            />
          </g>

          {/* Labels */}
          <text
            x={config.diameter * 0.1}
            y={config.diameter / 2 + 20}
            fontSize="12"
            fill="#64748b"
            textAnchor="start"
          >
            Low
          </text>
          <text
            x={config.diameter * 0.5}
            y={config.diameter / 2 + 20}
            fontSize="12"
            fill="#64748b"
            textAnchor="middle"
          >
            Medium
          </text>
          <text
            x={config.diameter * 0.9}
            y={config.diameter / 2 + 20}
            fontSize="12"
            fill="#64748b"
            textAnchor="end"
          >
            High
          </text>
        </svg>
      </div>

      {/* Score Display */}
      <div className="mt-6 text-center">
        <div className={`font-bold ${config.fontSize}`} style={{ color: theme.color }}>
          {score.toFixed(1)}
        </div>
        <div className="mt-1 text-sm font-medium uppercase tracking-wider" style={{ color: theme.color }}>
          {theme.label}
        </div>
      </div>

      {/* Status Bar */}
      <div className="mt-4 w-full max-w-xs">
        <div className="overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-2 transition-all"
            style={{ width: `${normalizedScore}%`, backgroundColor: theme.color }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>0</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}
