'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  cyberMode: boolean;
  toggleCyberMode: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [cyberMode, setCyberMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cyberMode');
    if (saved !== null) {
      setCyberMode(JSON.parse(saved));
    }
    setIsMounted(true);
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('cyberMode', JSON.stringify(cyberMode));
    }
  }, [cyberMode, isMounted]);

  const value = {
    cyberMode,
    toggleCyberMode: () => setCyberMode((prev) => !prev),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
