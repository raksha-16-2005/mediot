export type DeviceType = 'Infusion Pump' | 'Patient Monitor' | 'MRI Controller' | 'HVAC Controller' | 'Nurse Station Terminal' | 'IoT Device';

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
  ifScore?: number;
  xgbScore?: number;
  isMalicious?: boolean;
  connectionCount?: number;
  packetCount?: number;
  bytesSent?: number;
  bytesReceived?: number;
  failedConnectionRatio?: number;
  externalIpRatio?: number;
  avgConnectionDuration?: number;
  cusumShift?: boolean;
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
  flaggedBy?: string[];
  metrics?: {
    if_score: number;
    xgb_score: number;
    cusum_shift: boolean;
  };
  deviatingFeatures?: string[];
}

export interface NetworkMetrics {
  totalDevices: number;
  healthyDevices: number;
  suspiciousDevices: number;
  criticalAlerts: number;
  networkTraffic: number;
  totalConnections?: number;
  maliciousConnections?: number;
  maliciousPct?: number;
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

// ── Attack Overview types ───────────────────────────────

export interface AttackTypeEntry {
  attack_type: string;
  readable_name: string;
  count: number;
  percentage: number;
}

export interface AttackWhat {
  total_connections: number;
  total_malicious: number;
  malicious_pct: number;
  attack_types: AttackTypeEntry[];
}

export interface AttackHowEntry {
  attack_type: string;
  readable_name: string;
  category: string;
  narrative: string;
  stats: {
    count: number;
    avg_duration: number;
    avg_bytes_sent: number;
    avg_bytes_received: number;
    top_ports: Record<string, number>;
    top_conn_states: Record<string, number>;
  };
}

export interface AttackWhere {
  compromised_sources: string[];
  num_compromised: number;
  top_destinations: Record<string, number>;
  top_dst_ports: Record<string, number>;
  external_destinations: number;
  internal_destinations: number;
}

export interface AttackWhen {
  first_malicious_ts: number | null;
  first_malicious_readable: string;
  last_malicious_ts: number | null;
  last_malicious_readable: string;
  attack_duration_seconds: number;
  cusum_change_points: string[];
  total_malicious_connections: number;
}

export interface AttackOverview {
  what: AttackWhat;
  how: AttackHowEntry[];
  where: AttackWhere;
  when: AttackWhen;
}

export interface TimelineEntry {
  hour: string;
  label?: string;
  attack_label?: string;
  count: number;
}

export interface BytesTimelineEntry {
  hour: string;
  bytes_out: number;
  bytes_in: number;
}

export interface TimelineData {
  traffic: TimelineEntry[];
  attacks: TimelineEntry[];
  bytes: BytesTimelineEntry[];
}

export interface TrustScoreEntry {
  deviceId: string;
  sourceIp: string;
  trustScore: number;
  status: string;
  ifScore: number;
  xgbScore: number;
  label: string;
  isMalicious: boolean;
}

export interface TestCase {
  testCaseId: string;
  scenario: string;
  expected: string;
  pipelinePrediction: string;
  correct: boolean;
  trustScore: number;
  ifScore: number;
  xgbScore: number;
  xgbProb: number;
  status: string;
  label: string;
  attackType: string;
  duration: number;
  origBytes: number;
  respBytes: number;
  packetCount: number;
  bytesSent: number;
  bytesReceived: number;
  failedConnectionRatio: number;
  externalIpRatio: number;
}

export interface FeatureEntry {
  deviceId: string;
  sourceIp: string;
  bytesSent: number;
  bytesReceived: number;
  packetCount: number;
  avgConnectionDuration: number;
  uniqueDstIps: number;
  uniqueDstPorts: number;
  connectionCount: number;
  failedConnectionRatio: number;
  externalIpRatio: number;
  label: string;
  isMalicious: boolean;
}
