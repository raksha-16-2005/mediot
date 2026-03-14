import {
  Device,
  Alert,
  NetworkMetrics,
  DeviceAnalytics,
  TrustScore,
  AttackOverview,
  TimelineData,
  TrustScoreEntry,
  FeatureEntry,
  TestCase,
} from './types';

/**
 * Fetch helper — loads static JSON exported by the pipeline.
 * Files live in public/data/ and are served at /data/*.json.
 */
async function fetchData<T>(filename: string): Promise<T> {
  const res = await fetch(`/data/${filename}`);
  if (!res.ok) throw new Error(`Failed to fetch ${filename}: ${res.status}`);
  return res.json();
}

export async function getDevices(): Promise<Device[]> {
  return fetchData<Device[]>('devices.json');
}

export async function getDeviceById(deviceId: string): Promise<Device | null> {
  const devices = await getDevices();
  return devices.find((d) => d.deviceId === deviceId) || null;
}

export async function getAlerts(): Promise<Alert[]> {
  return fetchData<Alert[]>('alerts.json');
}

export async function getNetworkMetrics(): Promise<NetworkMetrics> {
  return fetchData<NetworkMetrics>('network-metrics.json');
}

export async function getAttackOverview(): Promise<AttackOverview> {
  return fetchData<AttackOverview>('attack-overview.json');
}

export async function getTimeline(): Promise<TimelineData> {
  return fetchData<TimelineData>('timeline.json');
}

export async function getTrustScores(): Promise<TrustScoreEntry[]> {
  return fetchData<TrustScoreEntry[]>('trust-scores.json');
}

export async function getFeatures(): Promise<FeatureEntry[]> {
  return fetchData<FeatureEntry[]>('features.json');
}

export async function getTestCases(): Promise<TestCase[]> {
  return fetchData<TestCase[]>('test-cases.json');
}

export async function getDeviceAnalytics(
  deviceId: string
): Promise<DeviceAnalytics | null> {
  const device = await getDeviceById(deviceId);
  if (!device) return null;

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
}

export async function getTrustScore(deviceId: string): Promise<TrustScore | null> {
  const device = await getDeviceById(deviceId);
  if (!device) return null;

  const score = device.trustScore;
  return {
    deviceId,
    score,
    factors: {
      trafficBehavior: device.ifScore ?? Math.round(score * 0.9),
      dnsActivity: Math.round(score * 0.85),
      connectionPatterns: device.xgbScore ?? Math.round(score * 0.88),
      securityViolations: Math.round(100 - score * 0.7),
    },
  };
}

export async function simulateAttack(
  attackType: string,
  targetDeviceId?: string
): Promise<{ success: boolean; message: string }> {
  console.log(
    `[SIMULATION] ${attackType} attack${targetDeviceId ? ` on device ${targetDeviceId}` : ''}`
  );
  return {
    success: true,
    message: `${attackType} attack simulation initiated successfully`,
  };
}

export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
}
