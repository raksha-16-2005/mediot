import {
  Device,
  Alert,
  NetworkMetrics,
  DeviceType,
  DeviceStatus,
  RiskLevel,
  AlertSeverity,
} from './types';

const DEVICE_TYPES: DeviceType[] = [
  'Infusion Pump',
  'Patient Monitor',
  'MRI Controller',
  'HVAC Controller',
  'Nurse Station Terminal',
];

const LOCATIONS = [
  'ICU Wing A',
  'Cardiology Floor 2',
  'Surgery Suite 3',
  'Patient Room 101',
  'Lab Building B',
  'Radiology Department',
  'Emergency Room',
  'Recovery Room',
];

const ALERT_REASONS = [
  'Unusual data traffic pattern detected',
  'Multiple failed authentication attempts',
  'Unexpected external connection initiated',
  'DNS query to suspicious domain',
  'Protocol violation detected',
  'Device firmware mismatch',
  'Unusual port communication',
  'Potential ransomware signature detected',
];

const RECOMMENDATIONS = [
  'Isolate device from network and investigate',
  'Quarantine device and scan for malware',
  'Reset device credentials and update firmware',
  'Block suspicious IPs and monitor activity',
  'Enable enhanced logging for forensic analysis',
  'Contact manufacturing support team',
  'Update firewall rules for this device',
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDecimal(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function getTrustScoreBasedStatus(trustScore: number): DeviceStatus {
  if (trustScore > 80) return 'Online';
  if (trustScore > 60) return 'Suspicious';
  return 'Critical';
}

function getTrustScoreBasedRiskLevel(trustScore: number): RiskLevel {
  if (trustScore > 80) return 'Low';
  if (trustScore > 60) return 'Medium';
  if (trustScore > 40) return 'High';
  return 'Critical';
}

function generateDeviceId(): string {
  return `DEV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

function generateAlertId(): string {
  return `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

function getRandomIpAddress(): string {
  return `192.168.1.${getRandomNumber(1, 254)}`;
}

function getRecentTimestamp(minutesAgo: number = 60): string {
  const now = new Date();
  const past = new Date(now.getTime() - minutesAgo * 60000);
  return past.toISOString();
}

export function generateDevice(): Device {
  const trustScore = getRandomDecimal(20, 95);
  const deviceType = getRandomElement(DEVICE_TYPES);

  return {
    deviceId: generateDeviceId(),
    deviceType,
    ipAddress: getRandomIpAddress(),
    location: getRandomElement(LOCATIONS),
    trustScore: Math.round(trustScore * 100) / 100,
    status: getTrustScoreBasedStatus(trustScore),
    trafficVolume: getRandomNumber(100, 10000),
    dnsQueries: getRandomNumber(10, 500),
    uniqueIpConnections: getRandomNumber(1, 50),
    lastActivity: getRecentTimestamp(getRandomNumber(1, 60)),
    riskLevel: getTrustScoreBasedRiskLevel(trustScore),
  };
}

export function generateDevices(count: number): Device[] {
  return Array.from({ length: count }, () => generateDevice());
}

export function generateAlert(): Alert {
  const severity = getRandomElement<AlertSeverity>(['Info', 'Warning', 'Alert', 'Critical']);
  const device = generateDevice();

  return {
    id: generateAlertId(),
    timestamp: getRecentTimestamp(getRandomNumber(1, 120)),
    deviceId: device.deviceId,
    deviceName: `${device.deviceType} (${device.location})`,
    severity,
    trustScore: device.trustScore,
    alertReason: getRandomElement(ALERT_REASONS),
    recommendedAction: getRandomElement(RECOMMENDATIONS),
  };
}

export function generateAlerts(count: number = 10): Alert[] {
  return Array.from({ length: count }, () => generateAlert());
}

export function generateNetworkMetrics(): NetworkMetrics {
  const totalDevices = 50;
  const healthyDevices = getRandomNumber(30, 40);
  const suspiciousDevices = getRandomNumber(5, 12);
  const criticalAlerts = getRandomNumber(2, 8);

  return {
    totalDevices,
    healthyDevices,
    suspiciousDevices,
    criticalAlerts,
    networkTraffic: getRandomNumber(5000, 50000),
  };
}
