'use client';

import React, { useState, useCallback } from 'react';
import { simulateAttack, getDevices } from '@/lib/api';
import { Device } from '@/lib/types';
import { useAttackSimulationContext } from '@/contexts/attack-simulation-context';

interface AttackSimulatorProps {
  onAttackTriggered?: (data: AttackSimulationResult) => void;
  devices?: Device[];
}

export interface AttackSimulationResult {
  success: boolean;
  message: string;
  targetDevice?: string;
  timestamp: string;
  simulatedEffects?: {
    trafficIncrease: number;
    dnsIncrease: number;
    trustScoreDecrease: number;
  };
}

export function AttackSimulator({ onAttackTriggered, devices }: AttackSimulatorProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastAttack, setLastAttack] = useState<AttackSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const { setAttackEvent } = useAttackSimulationContext();

  const handleSimulateAttack = useCallback(async () => {
    try {
      setIsSimulating(true);
      setError(null);

      // Get devices list if not provided
      let deviceList = devices;
      if (!deviceList || deviceList.length === 0) {
        deviceList = await getDevices();
      }

      // Select random device
      if (!deviceList || deviceList.length === 0) {
        throw new Error('No devices available for simulation');
      }

      const randomDevice = deviceList[Math.floor(Math.random() * deviceList.length)];
      const attackTypes = [
        'DNS Spike Attack',
        'Traffic Flood',
        'Unauthorized Connection',
        'Protocol Violation',
        'Ransomware Signature',
      ];
      const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];

      // Call the simulation API
      const result = await simulateAttack(attackType, randomDevice.deviceId);

      // Simulate the effects
      const simulatedEffects = {
        trafficIncrease: Math.floor(Math.random() * 8000) + 2000,
        dnsIncrease: Math.floor(Math.random() * 200) + 50,
        trustScoreDecrease: Math.floor(Math.random() * 40) + 20,
      };

      const simulationResult: AttackSimulationResult = {
        success: result.success,
        message: `${attackType} simulated on ${randomDevice.deviceType} at ${randomDevice.location}`,
        targetDevice: randomDevice.deviceId,
        timestamp: new Date().toISOString(),
        simulatedEffects,
      };

      setLastAttack(simulationResult);
      setShowNotification(true);

      // Trigger parent callback
      if (onAttackTriggered) {
        onAttackTriggered(simulationResult);
      }

      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    } catch (err) {
      console.error('Error simulating attack:', err);
      setError(err instanceof Error ? err.message : 'Failed to simulate attack');
    } finally {
      setIsSimulating(false);
    }
  }, [devices, onAttackTriggered]);

  return (
    <div className="relative">
      {/* Attack Simulator Button */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleSimulateAttack}
          disabled={isSimulating}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-700 dark:hover:bg-red-600"
        >
          {isSimulating ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Simulating...
            </>
          ) : (
            <>
              <span>🎯</span>
              Simulate Attack
            </>
          )}
        </button>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Notification */}
      {showNotification && lastAttack && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-lg dark:border-red-900 dark:bg-red-900/20">
            <div className="mb-2 flex items-start gap-3">
              <span className="text-2xl">🚨</span>
              <div className="flex-1">
                <h3 className="font-bold text-red-900 dark:text-red-100">
                  Attack Simulation Triggered
                </h3>
                <p className="mt-1 text-sm text-red-800 dark:text-red-300">
                  {lastAttack.message}
                </p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-red-700 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
              >
                ✕
              </button>
            </div>

            {/* Simulated Effects */}
            {lastAttack.simulatedEffects && (
              <div className="mt-3 space-y-2 border-t border-red-200 pt-3 dark:border-red-900">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded bg-red-100 p-2 dark:bg-red-900/40">
                    <p className="font-semibold text-red-900 dark:text-red-100">
                      📊 Traffic
                    </p>
                    <p className="text-red-800 dark:text-red-300">
                      +{lastAttack.simulatedEffects.trafficIncrease} bytes
                    </p>
                  </div>
                  <div className="rounded bg-red-100 p-2 dark:bg-red-900/40">
                    <p className="font-semibold text-red-900 dark:text-red-100">
                      🔍 DNS
                    </p>
                    <p className="text-red-800 dark:text-red-300">
                      +{lastAttack.simulatedEffects.dnsIncrease} queries
                    </p>
                  </div>
                  <div className="rounded bg-red-100 p-2 dark:bg-red-900/40">
                    <p className="font-semibold text-red-900 dark:text-red-100">
                      ⚖️ Trust
                    </p>
                    <p className="text-red-800 dark:text-red-300">
                      -{lastAttack.simulatedEffects.trustScoreDecrease}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-red-700 dark:text-red-400">
                  💡 Tip: Check the dashboard, device explorer, and alerts center for the impact!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
