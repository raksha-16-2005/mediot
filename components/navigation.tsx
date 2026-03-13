'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CyberModeToggle } from './cyber-mode-toggle';

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/devices', label: 'Devices', icon: '🖥️' },
    { href: '/alerts', label: 'Alerts', icon: '🚨' },
    { href: '/analytics', label: 'Analytics', icon: '📈' },
    { href: '/security-overview', label: 'Network Map', icon: '🌐' },
    { href: '/architecture', label: 'Architecture', icon: '🏗️' },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-blue-400 hover:text-blue-300 transition-colors">
            🏥 MedIoT Shield
          </Link>

          {/* Nav Items */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Cyber Defense Mode Toggle - Top Right */}
          <CyberModeToggle />
        </div>
      </div>
    </nav>
  );
}
