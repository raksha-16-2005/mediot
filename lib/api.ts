import {
  Device,
  Alert,
  NetworkMetrics,
  DeviceAnalytics,
  TrustScore,
} from './types';
import {
  generateDevices,
  generateAlerts,
  generateNetworkMetrics,
} from './mock-data';

// Configuration for API endpoints - easily updatable for real backend
const API_BASE_URL = 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ApiError extends Error {
  statusCode?: number;
}

/**
 * Fetches all devices from the API or mock data
 * @returns Promise resolving to array of devices
 */
export async function getDevices(): Promise<Device[]> {
  try {
    // TODO: Replace with actual API call when backend is ready
    // const response = await fetch(`${API_BASE_URL}/devices`);
    // const data: ApiResponse<Device[]> = await response.json();
    // if (!data.success) throw new Error(data.error || 'Failed to fetch devices');
    // return data.data || [];

    // For now, return mock data
    return generateDevices(25);
  } catch (error) {
    console.error('Error fetching devices:', error);
    throw error;
  }
}

/**
 * Fetches a specific device by ID
 * @param deviceId - The ID of the device to fetch
 * @returns Promise resolving to a device object
 */
export async function getDeviceById(deviceId: string): Promise<Device | null> {
  try {
    // TODO: Replace with actual API call when backend is ready
    // const response = await fetch(`${API_BASE_URL}/device/${deviceId}`);
    // const data: ApiResponse<Device> = await response.json();
    // if (!data.success) throw new Error(data.error || 'Failed to fetch device');
    // return data.data || null;

    // For now, return mock data
    const devices = await getDevices();
    return devices.find((device) => device.deviceId === deviceId) || null;
  } catch (error) {
    console.error(`Error fetching device ${deviceId}:`, error);
    throw error;
  }
}

/**
 * Fetches all active alerts
 * @returns Promise resolving to array of alerts
 */
export async function getAlerts(): Promise<Alert[]> {
  try {
    // TODO: Replace with actual API call when backend is ready
    // const response = await fetch(`${API_BASE_URL}/alerts`);
    // const data: ApiResponse<Alert[]> = await response.json();
    // if (!data.success) throw new Error(data.error || 'Failed to fetch alerts');
    // return data.data || [];

    // For now, return mock data
    return generateAlerts(15);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
}

/**
 * Fetches network-wide metrics
 * @returns Promise resolving to network metrics object
 */
export async function getNetworkMetrics(): Promise<NetworkMetrics> {
  try {
    // TODO: Replace with actual API call when backend is ready
    // const response = await fetch(`${API_BASE_URL}/network-metrics`);
    // const data: ApiResponse<NetworkMetrics> = await response.json();
    // if (!data.success) throw new Error(data.error || 'Failed to fetch metrics');
    // return data.data || defaultMetrics;

    // For now, return mock data
    return generateNetworkMetrics();
  } catch (error) {
    console.error('Error fetching network metrics:', error);
    throw error;
  }
}

/**
 * Gets analytics data for a specific device
 * @param deviceId - The ID of the device
 * @returns Promise resolving to device analytics
 */
export async function getDeviceAnalytics(
  deviceId: string
): Promise<DeviceAnalytics | null> {
  try {
    // TODO: Replace with actual API call when backend is ready
    // const response = await fetch(`${API_BASE_URL}/device/${deviceId}/analytics`);
    // const data: ApiResponse<DeviceAnalytics> = await response.json();
    // if (!data.success) throw new Error(data.error || 'Failed to fetch analytics');
    // return data.data || null;

    const device = await getDeviceById(deviceId);
    if (!device) return null;

    // Generate mock analytics data
    const trafficTrend = Array.from({ length: 24 }, () =>
      Math.floor(Math.random() * 10000)
    );

    return {
      deviceId,
      deviceName: `${device.deviceType} (${device.location})`,
      trafficTrend,
      anomalies: Math.floor(Math.random() * 5),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching analytics for device ${deviceId}:`, error);
    throw error;
  }
}

/**
 * Gets trust score details for a specific device
 * @param deviceId - The ID of the device
 * @returns Promise resolving to trust score object
 */
export async function getTrustScore(deviceId: string): Promise<TrustScore | null> {
  try {
    // TODO: Replace with actual API call when backend is ready
    // const response = await fetch(`${API_BASE_URL}/device/${deviceId}/trust-score`);
    // const data: ApiResponse<TrustScore> = await response.json();
    // if (!data.success) throw new Error(data.error || 'Failed to fetch trust score');
    // return data.data || null;

    const device = await getDeviceById(deviceId);
    if (!device) return null;

    // Generate mock trust score breakdown
    const score = device.trustScore;

    return {
      deviceId,
      score,
      factors: {
        trafficBehavior: Math.round(score * (0.8 + Math.random() * 0.4)),
        dnsActivity: Math.round(score * (0.7 + Math.random() * 0.5)),
        connectionPatterns: Math.round(score * (0.75 + Math.random() * 0.45)),
        securityViolations: Math.round(100 - score * (0.6 + Math.random() * 0.4)),
      },
    };
  } catch (error) {
    console.error(`Error fetching trust score for device ${deviceId}:`, error);
    throw error;
  }
}

/**
 * Simulates a security attack for testing purposes
 * @param attackType - Type of attack to simulate
 * @param targetDeviceId - Optional target device ID
 * @returns Promise resolving to simulation result
 */
export async function simulateAttack(
  attackType: string,
  targetDeviceId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // TODO: Replace with actual API call when backend is ready
    // const response = await fetch(`${API_BASE_URL}/simulate-attack`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ attackType, targetDeviceId }),
    // });
    // const data: ApiResponse<{ success: boolean; message: string }> = await response.json();
    // if (!data.success) throw new Error(data.error || 'Failed to simulate attack');
    // return data.data || { success: false, message: 'Unknown error' };

    // For now, return mock response
    console.log(
      `[SIMULATION] ${attackType} attack${targetDeviceId ? ` on device ${targetDeviceId}` : ''}`
    );

    return {
      success: true,
      message: `${attackType} attack simulation initiated successfully`,
    };
  } catch (error) {
    console.error('Error simulating attack:', error);
    throw error;
  }
}

/**
 * Health check for API connectivity
 * @returns Promise resolving to health status
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  try {
    // TODO: Replace with actual API call when backend is ready
    // const response = await fetch(`${API_BASE_URL}/health`);
    // const data = await response.json();
    // return data;

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
    };
  }
}
