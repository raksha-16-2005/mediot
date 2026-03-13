export type DeviceType = 'Infusion Pump' | 'Patient Monitor' | 'MRI Controller' | 'HVAC Controller' | 'Nurse Station Terminal';

export type DeviceStatus = 'Online' | 'Offline' | 'Suspicious' | 'Critical';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type AlertSeverity = 'Info' | 'Warning' | 'Alert' | 'Critical';

export interface Device {
  deviceId: string;
  deviceType: DeviceType;
  ipAddress: string;
  location: string;
  trustScore: number;
  status: DeviceStatus;
  trafficVolume: number;
  dnsQueries: number;
  uniqueIpConnections: number;
  lastActivity: string;
  riskLevel: RiskLevel;
}

export interface Alert {
  id: string;
  timestamp: string;
  deviceId: string;
  deviceName: string;
  severity: AlertSeverity;
  trustScore: number;
  alertReason: string;
  recommendedAction: string;
}

export interface NetworkMetrics {
  totalDevices: number;
  healthyDevices: number;
  suspiciousDevices: number;
  criticalAlerts: number;
  networkTraffic: number;
}

export interface DeviceAnalytics {
  deviceId: string;
  deviceName: string;
  trafficTrend: number[];
  anomalies: number;
  lastUpdated: string;
}

export interface TrustScore {
  deviceId: string;
  score: number;
  factors: {
    trafficBehavior: number;
    dnsActivity: number;
    connectionPatterns: number;
    securityViolations: number;
  };
}
