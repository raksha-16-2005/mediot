'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AttackSimulationResult } from '@/hooks/use-attack-simulation';

interface AttackEvent {
  deviceId: string;
  deviceName: string;
  timestamp: Date;
  trafficIncrease: number;
  dnsIncrease: number;
  trustScoreDrop: number;
}

interface AttackSimulationContextType {
  lastAttack: AttackSimulationResult | null;
  simulationCount: number;
  triggerRefresh: () => void;
  setLastAttack: (attack: AttackSimulationResult | null) => void;
  lastAttackedDeviceId: string | null;
  isAttackActive: boolean;
  attackEvent: AttackEvent | null;
  setAttackEvent: (event: AttackEvent | null) => void;
}

const AttackSimulationContext = createContext<AttackSimulationContextType | undefined>(undefined);

export function AttackSimulationProvider({ children }: { children: React.ReactNode }) {
  const [lastAttack, setLastAttack] = useState<AttackSimulationResult | null>(null);
  const [simulationCount, setSimulationCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastAttackedDeviceId, setLastAttackedDeviceId] = useState<string | null>(null);
  const [isAttackActive, setIsAttackActive] = useState(false);
  const [attackEvent, setAttackEventState] = useState<AttackEvent | null>(null);

  // Auto-clear attack state after 8 seconds
  useEffect(() => {
    if (isAttackActive) {
      const timer = setTimeout(() => {
        setIsAttackActive(false);
        setLastAttackedDeviceId(null);
        setAttackEventState(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isAttackActive]);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleSetLastAttack = useCallback((attack: AttackSimulationResult | null) => {
    setLastAttack(attack);
    if (attack) {
      setSimulationCount((prev) => prev + 1);
      triggerRefresh();
    }
  }, [triggerRefresh]);

  const handleSetAttackEvent = useCallback((event: AttackEvent | null) => {
    setAttackEventState(event);
    if (event) {
      setLastAttackedDeviceId(event.deviceId);
      setIsAttackActive(true);
    }
  }, []);

  return (
    <AttackSimulationContext.Provider
      value={{
        lastAttack,
        simulationCount,
        triggerRefresh,
        setLastAttack: handleSetLastAttack,
        lastAttackedDeviceId,
        isAttackActive,
        attackEvent,
        setAttackEvent: handleSetAttackEvent,
      }}
    >
      {children}
    </AttackSimulationContext.Provider>
  );
}

export function useAttackSimulationContext() {
  const context = useContext(AttackSimulationContext);
  if (!context) {
    throw new Error(
      'useAttackSimulationContext must be used within AttackSimulationProvider'
    );
  }
  return context;
}
