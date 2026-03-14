'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  AttackOverview, TrustScoreEntry, FeatureEntry,
  Alert, Device, NetworkMetrics, TestCase,
} from '@/lib/types';
import {
  getAttackOverview, getTrustScores, getFeatures,
  getAlerts, getDevices, getNetworkMetrics, getTestCases,
} from '@/lib/api';

// Raw timeseries row type
export interface RawRow {
  ts: number;
  device_id: string;
  orig_bytes: number;
  resp_bytes: number;
  duration: number;
  'id.resp_h': string;
  'id.resp_p': number;
  conn_state: string;
  label: string;
  attack_type: string;
  attack_label: string;
  datetime: string;
}

interface FilterState {
  // Filter values
  dateStart: string;
  dateEnd: string;
  selectedIps: string[];
  selectedAttackTypes: string[];
  trafficType: 'All' | 'Malicious' | 'Benign';
  selectedSeverity: string[];
  trustRange: [number, number];
  granularity: string;

  // Setters
  setDateStart: (v: string) => void;
  setDateEnd: (v: string) => void;
  setSelectedIps: (v: string[]) => void;
  setSelectedAttackTypes: (v: string[]) => void;
  setTrafficType: (v: 'All' | 'Malicious' | 'Benign') => void;
  setSelectedSeverity: (v: string[]) => void;
  setTrustRange: (v: [number, number]) => void;
  setGranularity: (v: string) => void;

  // Available options (derived from data)
  allIps: string[];
  allAttackTypes: string[];

  // Raw + filtered data
  rawTs: RawRow[];
  filteredRows: RawRow[];
  overview: AttackOverview | null;
  trustScores: TrustScoreEntry[];
  features: FeatureEntry[];
  alerts: Alert[];
  devices: Device[];
  metrics: NetworkMetrics | null;

  // Filtered subsets
  filteredDevices: Device[];
  filteredAlerts: Alert[];
  filteredTrustScores: TrustScoreEntry[];
  filteredFeatures: FeatureEntry[];

  // Test cases
  testCases: TestCase[];

  // Loading state
  loading: boolean;

  // Sidebar visibility
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

const FilterContext = createContext<FilterState | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  // ── Raw data ──────────────────────────────────────────
  const [rawTs, setRawTs] = useState<RawRow[]>([]);
  const [overview, setOverview] = useState<AttackOverview | null>(null);
  const [trustScores, setTrustScores] = useState<TrustScoreEntry[]>([]);
  const [features, setFeatures] = useState<FeatureEntry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Filter state ──────────────────────────────────────
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedIps, setSelectedIps] = useState<string[]>([]);
  const [selectedAttackTypes, setSelectedAttackTypes] = useState<string[]>([]);
  const [trafficType, setTrafficType] = useState<'All' | 'Malicious' | 'Benign'>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>(['Critical', 'Warning']);
  const [trustRange, setTrustRange] = useState<[number, number]>([0, 100]);
  const [granularity, setGranularity] = useState('1h');

  // Sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Load all data once ────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [raw, ov, ts, ft, al, dv, mt, tc] = await Promise.all([
          fetch('/data/timeseries-raw.json').then((r) => r.json()) as Promise<RawRow[]>,
          getAttackOverview(),
          getTrustScores(),
          getFeatures(),
          getAlerts(),
          getDevices(),
          getNetworkMetrics(),
          getTestCases(),
        ]);
        setRawTs(raw);
        setOverview(ov);
        setTrustScores(ts);
        setFeatures(ft);
        setAlerts(al);
        setDevices(dv);
        setMetrics(mt);
        setTestCases(tc);

        // Set date range from data
        if (raw.length > 0) {
          const dates = raw.map((r: RawRow) => r.datetime.slice(0, 10));
          setDateStart(dates.reduce((a: string, b: string) => (a < b ? a : b)));
          setDateEnd(dates.reduce((a: string, b: string) => (a > b ? a : b)));
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Derived: available IPs and attack types ───────────
  const allIps = useMemo(() => {
    const set = new Set(rawTs.map((r) => r.device_id));
    return Array.from(set).sort();
  }, [rawTs]);

  const allAttackTypes = useMemo(() => {
    const set = new Set(
      rawTs
        .filter((r) => r.label === 'Malicious' && r.attack_label && r.attack_label !== 'Benign')
        .map((r) => r.attack_label)
    );
    return Array.from(set).sort();
  }, [rawTs]);

  // ── Filtered timeseries rows ──────────────────────────
  const filteredRows = useMemo(() => {
    let rows = rawTs;
    if (dateStart) rows = rows.filter((r) => r.datetime.slice(0, 10) >= dateStart);
    if (dateEnd) rows = rows.filter((r) => r.datetime.slice(0, 10) <= dateEnd);
    if (selectedIps.length > 0) rows = rows.filter((r) => selectedIps.includes(r.device_id));
    if (selectedAttackTypes.length > 0) {
      rows = rows.filter(
        (r) => r.label === 'Benign' || selectedAttackTypes.includes(r.attack_label)
      );
    }
    if (trafficType === 'Malicious') rows = rows.filter((r) => r.label === 'Malicious');
    else if (trafficType === 'Benign') rows = rows.filter((r) => r.label === 'Benign');
    return rows;
  }, [rawTs, dateStart, dateEnd, selectedIps, selectedAttackTypes, trafficType]);

  // ── Filtered devices ──────────────────────────────────
  const filteredDevices = useMemo(() => {
    let d = devices;
    if (selectedIps.length > 0) d = d.filter((dev) => selectedIps.includes(dev.ipAddress));
    if (trustRange[0] > 0 || trustRange[1] < 100) {
      d = d.filter((dev) => dev.trustScore >= trustRange[0] && dev.trustScore <= trustRange[1]);
    }
    return d;
  }, [devices, selectedIps, trustRange]);

  // ── Filtered alerts ───────────────────────────────────
  const filteredAlerts = useMemo(() => {
    let a = alerts;
    if (selectedIps.length > 0) a = a.filter((al) => selectedIps.includes(al.deviceId));
    if (selectedSeverity.length > 0) a = a.filter((al) => selectedSeverity.includes(al.severity));
    if (trustRange[0] > 0 || trustRange[1] < 100) {
      a = a.filter((al) => al.trustScore >= trustRange[0] && al.trustScore <= trustRange[1]);
    }
    return a;
  }, [alerts, selectedIps, selectedSeverity, trustRange]);

  // ── Filtered trust scores ─────────────────────────────
  const filteredTrustScores = useMemo(() => {
    let t = trustScores;
    if (selectedIps.length > 0) t = t.filter((ts) => selectedIps.includes(ts.sourceIp));
    if (trustRange[0] > 0 || trustRange[1] < 100) {
      t = t.filter((ts) => ts.trustScore >= trustRange[0] && ts.trustScore <= trustRange[1]);
    }
    return t;
  }, [trustScores, selectedIps, trustRange]);

  // ── Filtered features ─────────────────────────────────
  const filteredFeatures = useMemo(() => {
    let f = features;
    if (selectedIps.length > 0) f = f.filter((ft) => selectedIps.includes(ft.sourceIp));
    return f;
  }, [features, selectedIps]);

  const value: FilterState = {
    dateStart, dateEnd, selectedIps, selectedAttackTypes,
    trafficType, selectedSeverity, trustRange, granularity,
    setDateStart, setDateEnd, setSelectedIps, setSelectedAttackTypes,
    setTrafficType, setSelectedSeverity, setTrustRange, setGranularity,
    allIps, allAttackTypes,
    rawTs, filteredRows, overview, trustScores, features, alerts, devices, metrics, testCases,
    filteredDevices, filteredAlerts, filteredTrustScores, filteredFeatures,
    loading,
    sidebarOpen, setSidebarOpen,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within a FilterProvider');
  return ctx;
}
