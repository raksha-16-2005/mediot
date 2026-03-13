'use client';

import React from 'react';
import { Power } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';

export function CyberModeToggle() {
  const { cyberMode, toggleCyberMode } = useTheme();

  return (
    <button
      onClick={toggleCyberMode}
      className={`relative p-2 rounded-lg transition-all duration-300 ${
        cyberMode
          ? 'bg-red-900/30 border border-red-500/60 text-red-400'
          : 'bg-slate-800/50 border border-slate-600 text-slate-400 hover:text-slate-300'
      }`}
      style={
        cyberMode
          ? {
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.5), inset 0 0 10px rgba(239, 68, 68, 0.1)',
            }
          : {}
      }
      title="Toggle Cyber Defense Mode"
      aria-label="Toggle Cyber Defense Mode"
    >
      <Power className="w-5 h-5" strokeWidth={2} />

      {/* Glow indicator when active */}
      {cyberMode && (
        <div className="absolute inset-0 rounded-lg animate-pulse opacity-30" style={{ boxShadow: 'inset 0 0 15px rgba(239, 68, 68, 0.6)' }} />
      )}
    </button>
  );
}
