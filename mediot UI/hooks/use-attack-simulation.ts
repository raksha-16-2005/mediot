import { useCallback, useState } from 'react';
import { simulateAttack, getDevices } from '@/lib/api';
import { Device } from '@/lib/types';

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

interface CreateAlertParams {
  deviceId: string;
  deviceName: string;
  reason: string;
}

export function useAttackSimulation() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastAttack, setLastAttack] = useState<AttackSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulationCount, setSimulationCount] = useState(0);

  const triggerAttack = useCallback(async (devices?: Device[]) => {
    try {
      setIsSimulating(true);
      setError(null);

      // Get devices list if not provided
      let deviceList = devices;
      if (!deviceList || deviceList.length === 0) {
        deviceList = await getDevices();
      }

      if (!deviceList || deviceList.length === 0) {
        throw new Error('No devices available for simulation');
      }

      // Select random device
      const randomDevice = deviceList[Math.floor(Math.random() * deviceList.length)];

      // Select random attack type
      const attackTypes = [
        'DNS Spike Attack',
        'Traffic Flood',
        'Unauthorized Connection',
        'Protocol Violation',
        'Ransomware Signature',
        'Brute Force Attempt',
        'Suspicious Port Scan',
      ];
      const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];

      // Call simulation API
      const result = await simulateAttack(attackType, randomDevice.deviceId);

      // Generate simulated effects
      const trafficIncrease = Math.floor(Math.random() * 8000) + 2000;
      const dnsIncrease = Math.floor(Math.random() * 200) + 50;
      const trustScoreDecrease = Math.floor(Math.random() * 40) + 20;

      const simulationResult: AttackSimulationResult = {
        success: result.success,
        message: `${attackType} simulated on ${randomDevice.deviceType} at ${randomDevice.location}`,
        targetDevice: randomDevice.deviceId,
        timestamp: new Date().toISOString(),
        simulatedEffects: {
          trafficIncrease,
          dnsIncrease,
          trustScoreDecrease,
        },
      };

      setLastAttack(simulationResult);
      setSimulationCount((prev) => prev + 1);

      return simulationResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to simulate attack';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSimulating(false);
    }
  }, []);

  const resetSimulation = useCallback(() => {
    setLastAttack(null);
    setError(null);
    setSimulationCount(0);
  }, []);

  return {
    isSimulating,
    lastAttack,
    error,
    simulationCount,
    triggerAttack,
    resetSimulation,
  };
}
