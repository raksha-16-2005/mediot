'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line,
} from 'recharts';
import {
  AttackOverview, TrustScoreEntry, FeatureEntry,
  Alert, Device, NetworkMetrics,
} from '@/lib/types';
import { useFilters, RawRow } from '@/contexts/filter-context';

const ATTACK_COLORS: Record<string, string> = {
  'Command & Control': '#a855f7',
  'DDoS Attack': '#ef4444',
  'Horizontal Port Scan': '#f59e0b',
  'C&C File Download': '#3b82f6',
  'Malicious File Download': '#06d6a0',
};

const STATUS_COLORS: Record<string, string> = {
  Healthy: '#22c55e',
  Suspicious: '#f59e0b',
  ALERT: '#ef4444',
};

const PIE_COLORS = ['#ef4444', '#a855f7', '#f59e0b', '#3b82f6', '#06d6a0', '#ec4899'];

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #475569',
  borderRadius: '0.5rem',
  color: '#e2e8f0',
};

type TabId = 'overview' | 'timeline' | 'network' | 'trust' | 'alerts' | 'explorer';

export default function AttackOverviewPage() {
  const {
    rawTs, filteredRows, overview, trustScores, features, alerts: allAlerts,
    filteredAlerts, filteredTrustScores, filteredFeatures,
    selectedIps, selectedAttackTypes, trafficType, selectedSeverity,
    trustRange, granularity, setGranularity,
    loading, allIps, allAttackTypes, metrics, devices,
  } = useFilters();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  // Alerts tab state
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [compareAlertId, setCompareAlertId] = useState<string | null>(null);

  // Feature explorer
  const [xAxis, setXAxis] = useState('bytesSent');
  const [yAxis, setYAxis] = useState('uniqueDstIps');
  const [sizeAxis, setSizeAxis] = useState('none');

  const malFiltered = useMemo(
    () => filteredRows.filter((r) => r.label === 'Malicious'),
    [filteredRows]
  );
  const benignFiltered = useMemo(
    () => filteredRows.filter((r) => r.label === 'Benign'),
    [filteredRows]
  );

  // ── Timeline aggregation ──────────────────────────
  const timelineBinned = useMemo(() => {
    const binMap: Record<string, { Malicious: number; Benign: number }> = {};
    filteredRows.forEach((r) => {
      const bin = floorDate(r.datetime, granularity);
      if (!binMap[bin]) binMap[bin] = { Malicious: 0, Benign: 0 };
      if (r.label === 'Malicious') binMap[bin].Malicious++;
      else binMap[bin].Benign++;
    });
    return Object.entries(binMap)
      .map(([time, v]) => ({ time, ...v }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredRows, granularity]);

  const attackTimeline = useMemo(() => {
    const types = new Set<string>();
    const binMap: Record<string, Record<string, number>> = {};
    malFiltered.forEach((r) => {
      const bin = floorDate(r.datetime, granularity);
      const t = r.attack_label || 'Unknown';
      types.add(t);
      if (!binMap[bin]) binMap[bin] = {};
      binMap[bin][t] = (binMap[bin][t] || 0) + 1;
    });
    const typeList = [...types].sort();
    const data = Object.entries(binMap)
      .map(([time, counts]) => {
        const entry: Record<string, string | number> = { time };
        typeList.forEach((t) => (entry[t] = counts[t] || 0));
        return entry;
      })
      .sort((a, b) => (a.time as string).localeCompare(b.time as string));
    return { data, types: typeList };
  }, [malFiltered, granularity]);

  const bytesTimeline = useMemo(() => {
    const binMap: Record<string, { out: number; in_: number }> = {};
    filteredRows.forEach((r) => {
      const bin = floorDate(r.datetime, granularity);
      if (!binMap[bin]) binMap[bin] = { out: 0, in_: 0 };
      binMap[bin].out += r.orig_bytes;
      binMap[bin].in_ += r.resp_bytes;
    });
    return Object.entries(binMap)
      .map(([time, v]) => ({ time, bytes_out: v.out, bytes_in: v.in_ }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredRows, granularity]);

  // Top 5 devices timeline
  const top5DeviceTimeline = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRows.forEach((r) => { counts[r.device_id] = (counts[r.device_id] || 0) + 1; });
    const top5 = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);

    const binMap: Record<string, Record<string, number>> = {};
    filteredRows.filter((r) => top5.includes(r.device_id)).forEach((r) => {
      const bin = floorDate(r.datetime, granularity);
      if (!binMap[bin]) binMap[bin] = {};
      binMap[bin][r.device_id] = (binMap[bin][r.device_id] || 0) + 1;
    });
    const data = Object.entries(binMap)
      .map(([time, dev]) => ({ time, ...dev }))
      .sort((a, b) => a.time.localeCompare(b.time));
    return { data, devices: top5 };
  }, [filteredRows, granularity]);

  // Network: source stats, dest stats, port stats, conn states
  const srcStats = useMemo(() => {
    const map: Record<string, { connections: number; bytes_out: number; targets: Set<string> }> = {};
    malFiltered.forEach((r) => {
      if (!map[r.device_id]) map[r.device_id] = { connections: 0, bytes_out: 0, targets: new Set() };
      map[r.device_id].connections++;
      map[r.device_id].bytes_out += r.orig_bytes;
      map[r.device_id].targets.add(r['id.resp_h']);
    });
    return Object.entries(map)
      .map(([ip, v]) => ({ ip, connections: v.connections, bytes_out: v.bytes_out, targets: v.targets.size }))
      .sort((a, b) => b.connections - a.connections);
  }, [malFiltered]);

  const dstStats = useMemo(() => {
    const map: Record<string, { connections: number; bytes_in: number; sources: Set<string> }> = {};
    malFiltered.forEach((r) => {
      const dst = r['id.resp_h'];
      if (!map[dst]) map[dst] = { connections: 0, bytes_in: 0, sources: new Set() };
      map[dst].connections++;
      map[dst].bytes_in += r.resp_bytes;
      map[dst].sources.add(r.device_id);
    });
    return Object.entries(map)
      .map(([ip, v]) => ({ ip, connections: v.connections, bytes_in: v.bytes_in, sources: v.sources.size }))
      .sort((a, b) => b.connections - a.connections);
  }, [malFiltered]);

  const portStats = useMemo(() => {
    const map: Record<number, number> = {};
    malFiltered.forEach((r) => { map[r['id.resp_p']] = (map[r['id.resp_p']] || 0) + 1; });
    return Object.entries(map)
      .map(([port, count]) => ({ port: `:${port}`, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [malFiltered]);

  const connStateComparison = useMemo(() => {
    const malMap: Record<string, number> = {};
    const benMap: Record<string, number> = {};
    malFiltered.forEach((r) => { malMap[r.conn_state] = (malMap[r.conn_state] || 0) + 1; });
    benignFiltered.forEach((r) => { benMap[r.conn_state] = (benMap[r.conn_state] || 0) + 1; });
    const allStates = [...new Set([...Object.keys(malMap), ...Object.keys(benMap)])];
    return allStates.map((state) => ({
      state,
      Malicious: malMap[state] || 0,
      Benign: benMap[state] || 0,
    }));
  }, [malFiltered, benignFiltered]);

  // Attack type stats for overview
  const attackTypeStats = useMemo(() => {
    const map: Record<string, { count: number; bytes: number; duration: number; targets: Set<string> }> = {};
    malFiltered.forEach((r) => {
      const t = r.attack_label || 'Unknown';
      if (!map[t]) map[t] = { count: 0, bytes: 0, duration: 0, targets: new Set() };
      map[t].count++;
      map[t].bytes += r.orig_bytes;
      map[t].duration += r.duration;
      map[t].targets.add(r['id.resp_h']);
    });
    return Object.entries(map)
      .map(([name, v]) => ({
        name,
        count: v.count,
        avg_bytes: v.count > 0 ? v.bytes / v.count : 0,
        avg_duration: v.count > 0 ? v.duration / v.count : 0,
        targets: v.targets.size,
        percentage: filteredRows.length > 0 ? (v.count / filteredRows.length * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [malFiltered, filteredRows]);

  const featureOptions = [
    { key: 'bytesSent', label: 'Bytes Sent' },
    { key: 'bytesReceived', label: 'Bytes Received' },
    { key: 'packetCount', label: 'Packet Count' },
    { key: 'avgConnectionDuration', label: 'Avg Duration' },
    { key: 'uniqueDstIps', label: 'Unique Dst IPs' },
    { key: 'uniqueDstPorts', label: 'Unique Dst Ports' },
    { key: 'connectionCount', label: 'Connection Count' },
    { key: 'failedConnectionRatio', label: 'Failed Conn Ratio' },
    { key: 'externalIpRatio', label: 'External IP Ratio' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-r-transparent" />
          <p className="mt-4 text-slate-400">Loading attack data...</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-red-400">Failed to load attack overview data.</p>
      </div>
    );
  }

  const wh = overview.where;
  const wn = overview.when;

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Attack Overview', icon: '🎯' },
    { id: 'timeline', label: 'Timeline', icon: '📈' },
    { id: 'network', label: 'Network', icon: '🌐' },
    { id: 'trust', label: 'Trust Scores', icon: '🛡️' },
    { id: 'alerts', label: 'Alerts', icon: '🚨' },
    { id: 'explorer', label: 'Feature Explorer', icon: '🔬' },
  ];

  const malPct = filteredRows.length > 0 ? (malFiltered.length / filteredRows.length * 100) : 0;
  const avgTrust = filteredTrustScores.length > 0 ? filteredTrustScores.reduce((s, t) => s + t.trustScore, 0) / filteredTrustScores.length : 0;
  const compromisedIps = new Set(malFiltered.map((r) => r.device_id)).size;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-100">Attack Intelligence Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Interactive analysis of IoT-23 attack data — {filteredRows.length.toLocaleString()} connections loaded
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Connections" value={filteredRows.length.toLocaleString()} color="#3b82f6" />
          <KpiCard label="Malicious" value={malFiltered.length.toLocaleString()} sub={`${malPct.toFixed(1)}%`} color="#ef4444" />
          <KpiCard label="Devices" value={String(new Set(filteredRows.map((r) => r.device_id)).size)} color="#a855f7" />
          <KpiCard label="Alerts" value={String(filteredAlerts.length)} color="#f59e0b" />
          <KpiCard label="Compromised" value={String(compromisedIps)} color="#ff6b81" />
          <KpiCard label="Avg Trust" value={avgTrust.toFixed(1)} color="#06d6a0" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-slate-800">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* ═══ TAB: OVERVIEW ═══ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <SectionHeader title="Attack Breakdown" />
            <div className="grid md:grid-cols-2 gap-6">
              <Card title="Attack Type Distribution">
                {attackTypeStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie data={attackTypeStats} dataKey="count" nameKey="name" cx="50%" cy="50%"
                        innerRadius={60} outerRadius={120}
                        label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}>
                        {attackTypeStats.map((e, i) => (
                          <Cell key={i} fill={ATTACK_COLORS[e.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toLocaleString(), 'Connections']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-400 text-sm py-8 text-center">No malicious connections match filters.</p>}
              </Card>

              <Card title="Connections by Attack Type">
                {attackTypeStats.length > 0 && (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={[...attackTypeStats].reverse()} layout="vertical" margin={{ left: 140 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" width={130} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle}
                        formatter={(v: number, name: string, props: { payload?: { avg_bytes?: number; avg_duration?: number } }) => {
                          if (name === 'count' && props.payload) {
                            return [`${v.toLocaleString()} connections | Avg bytes: ${(props.payload.avg_bytes ?? 0).toFixed(0)} | Avg dur: ${(props.payload.avg_duration ?? 0).toFixed(3)}s`, 'Details'];
                          }
                          return [v, name];
                        }} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {[...attackTypeStats].reverse().map((e, i) => (
                          <Cell key={i} fill={ATTACK_COLORS[e.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            {/* Technique Details */}
            <SectionHeader title="Attack Technique Details" />
            {overview.how.map((entry) => {
              // Get live stats from filtered data
              const liveData = malFiltered.filter((r) => r.attack_label === entry.readable_name);
              if (liveData.length === 0) return null;
              const portCounts: Record<string, number> = {};
              const stateCounts: Record<string, number> = {};
              liveData.forEach((r) => {
                const p = String(r['id.resp_p']);
                portCounts[p] = (portCounts[p] || 0) + 1;
                stateCounts[r.conn_state] = (stateCounts[r.conn_state] || 0) + 1;
              });
              const topPorts = Object.entries(portCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
              const topStates = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
              const avgDur = liveData.reduce((s, r) => s + r.duration, 0) / liveData.length;
              const avgBytesOut = liveData.reduce((s, r) => s + r.orig_bytes, 0) / liveData.length;
              const avgBytesIn = liveData.reduce((s, r) => s + r.resp_bytes, 0) / liveData.length;
              const uniqueTargets = new Set(liveData.map((r) => r['id.resp_h'])).size;

              return <AttackTechniqueCard key={entry.attack_type} entry={entry}
                liveCount={liveData.length} avgDur={avgDur} avgBytesOut={avgBytesOut}
                avgBytesIn={avgBytesIn} uniqueTargets={uniqueTargets}
                topPorts={topPorts} topStates={topStates} />;
            })}

            {/* When snapshot */}
            <SectionHeader title="When — Timeline" />
            <Card>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">First Activity</p>
                  <p className="mt-1 text-sm text-slate-200 font-mono">{wn.first_malicious_readable}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Last Activity</p>
                  <p className="mt-1 text-sm text-slate-200 font-mono">{wn.last_malicious_readable}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Duration</p>
                  <p className="mt-1 text-lg font-bold text-orange-400">
                    {wn.attack_duration_seconds > 3600
                      ? `${(wn.attack_duration_seconds / 3600).toFixed(1)} hours`
                      : `${(wn.attack_duration_seconds / 60).toFixed(1)} min`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">CUSUM Change Points</p>
                  <p className="mt-1 text-lg font-bold text-purple-400">{wn.cusum_change_points.length}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ═══ TAB: TIMELINE ═══ */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <SectionHeader title="Traffic Timeline" />
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-400">Granularity:</span>
              {['10min', '30min', '1h', '6h', '1D'].map((g) => (
                <button key={g} onClick={() => setGranularity(g)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    granularity === g ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}>{g}</button>
              ))}
            </div>

            <Card title="All Traffic Over Time">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={timelineBinned}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => v.slice(5, 16)} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => String(v)} />
                  <Area type="monotone" dataKey="Benign" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="Malicious" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {malFiltered.length > 0 && (
              <Card title="Malicious Traffic by Attack Type">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={attackTimeline.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => v.slice(5, 16)} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    {attackTimeline.types.map((type, i) => (
                      <Area key={type} type="monotone" dataKey={type} stackId="1"
                        stroke={ATTACK_COLORS[type] || PIE_COLORS[i % PIE_COLORS.length]}
                        fill={ATTACK_COLORS[type] || PIE_COLORS[i % PIE_COLORS.length]}
                        fillOpacity={0.25} />
                    ))}
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <Card title="Data Volume Over Time">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={bytesTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => v.slice(5, 16)} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [(v / 1e6).toFixed(2) + ' MB', '']} />
                    <Area type="monotone" dataKey="bytes_out" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} name="Bytes Out" />
                    <Area type="monotone" dataKey="bytes_in" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} name="Bytes In" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Top 5 Devices Activity">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={top5DeviceTimeline.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => v.slice(5, 16)} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    {top5DeviceTimeline.devices.map((dev, i) => (
                      <Line key={dev} type="monotone" dataKey={dev} stroke={PIE_COLORS[i % PIE_COLORS.length]}
                        dot={false} strokeWidth={2} />
                    ))}
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        )}

        {/* ═══ TAB: NETWORK ═══ */}
        {activeTab === 'network' && (
          <div className="space-y-6">
            <SectionHeader title="Network Topology" />
            <div className="grid md:grid-cols-2 gap-6">
              <Card title="Compromised Source IPs">
                <ResponsiveContainer width="100%" height={Math.max(200, srcStats.length * 40)}>
                  <BarChart data={srcStats.slice(0, 15)} layout="vertical" margin={{ left: 120 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis dataKey="ip" type="category" width={110} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle}
                      content={({ active, payload }) => {
                        if (active && payload?.[0]) {
                          const d = payload[0].payload;
                          return (<div className="rounded border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100">
                            <p className="font-semibold">{d.ip}</p>
                            <p>Connections: {d.connections.toLocaleString()}</p>
                            <p>Bytes out: {d.bytes_out.toLocaleString()}</p>
                            <p>Unique targets: {d.targets}</p>
                          </div>);
                        }
                        return null;
                      }} />
                    <Bar dataKey="connections" fill="#ef4444" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Top Targeted Destinations">
                <ResponsiveContainer width="100%" height={Math.max(200, Math.min(dstStats.length, 15) * 40)}>
                  <BarChart data={dstStats.slice(0, 15)} layout="vertical" margin={{ left: 130 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis dataKey="ip" type="category" width={120} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle}
                      content={({ active, payload }) => {
                        if (active && payload?.[0]) {
                          const d = payload[0].payload;
                          return (<div className="rounded border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100">
                            <p className="font-semibold">{d.ip}</p>
                            <p>Connections: {d.connections.toLocaleString()}</p>
                            <p>Bytes in: {d.bytes_in.toLocaleString()}</p>
                            <p>Unique sources: {d.sources}</p>
                          </div>);
                        }
                        return null;
                      }} />
                    <Bar dataKey="connections" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <SectionHeader title="Port Analysis" />
            <div className="grid md:grid-cols-2 gap-6">
              <Card title="Most Targeted Ports (Malicious)">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={portStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="port" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Connection States: Malicious vs Benign">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={connStateComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="state" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="Malicious" fill="#ef4444" />
                    <Bar dataKey="Benign" fill="#22c55e" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Attack Flow Table (replacing Sankey since Recharts doesn't have it) */}
            {malFiltered.length > 0 && (
              <>
                <SectionHeader title="Attack Flow (Source → Destination)" />
                <Card>
                  {(() => {
                    const flowMap: Record<string, number> = {};
                    malFiltered.forEach((r) => {
                      const key = `${r.device_id}||${r['id.resp_h']}`;
                      flowMap[key] = (flowMap[key] || 0) + 1;
                    });
                    const flows = Object.entries(flowMap)
                      .map(([key, count]) => {
                        const [src, dst] = key.split('||');
                        return { src, dst, count };
                      })
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 20);
                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wider text-slate-400">
                              <th className="pb-3 pr-4">Source</th>
                              <th className="pb-3 pr-4 text-center">→</th>
                              <th className="pb-3 pr-4">Destination</th>
                              <th className="pb-3 text-right">Connections</th>
                              <th className="pb-3 pl-4">Volume</th>
                            </tr>
                          </thead>
                          <tbody>
                            {flows.map((f, i) => {
                              const maxCount = flows[0].count;
                              const pct = (f.count / maxCount) * 100;
                              return (
                                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                  <td className="py-2 pr-4 font-mono text-red-400 text-xs">{f.src}</td>
                                  <td className="py-2 pr-4 text-center text-slate-500">→</td>
                                  <td className="py-2 pr-4 font-mono text-blue-400 text-xs">{f.dst}</td>
                                  <td className="py-2 text-right text-slate-200">{f.count.toLocaleString()}</td>
                                  <td className="py-2 pl-4 w-32">
                                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                                      <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-purple-500"
                                        style={{ width: `${pct}%` }} />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </Card>
              </>
            )}
          </div>
        )}

        {/* ═══ TAB: TRUST SCORES ═══ */}
        {activeTab === 'trust' && (
          <div className="space-y-6">
            <SectionHeader title="Trust Score Analysis" />
            <div className="grid md:grid-cols-2 gap-6">
              <Card title="Status Distribution">
                {(() => {
                  const counts: Record<string, number> = {};
                  filteredTrustScores.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });
                  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
                  return (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={110}
                          label={({ name, value }) => `${name}: ${value}`}>
                          {data.map((d) => <Cell key={d.name} fill={STATUS_COLORS[d.name] || '#64748b'} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </Card>

              <Card title="Trust Score Histogram">
                {(() => {
                  const buckets = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${(i + 1) * 10}`, count: 0 }));
                  filteredTrustScores.forEach((t) => { buckets[Math.min(Math.floor(t.trustScore / 10), 9)].count++; });
                  return (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={buckets}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {buckets.map((_, i) => {
                            const mid = i * 10 + 5;
                            return <Cell key={i} fill={mid < 30 ? '#ef4444' : mid < 60 ? '#f59e0b' : '#22c55e'} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </Card>
            </div>

            <SectionHeader title="Algorithm Comparison" />
            <div className="grid md:grid-cols-2 gap-6">
              <Card title="Isolation Forest vs XGBoost Score">
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="ifScore" type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }}
                      label={{ value: 'IF Score', position: 'insideBottomRight', offset: -5, fill: '#64748b' }} />
                    <YAxis dataKey="xgbScore" type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }}
                      label={{ value: 'XGB Score', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                    <Tooltip contentStyle={tooltipStyle}
                      content={({ active, payload }) => {
                        if (active && payload?.[0]) {
                          const d = payload[0].payload as TrustScoreEntry;
                          return (<div className="rounded border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100">
                            <p className="font-semibold">{d.deviceId}</p>
                            <p>Trust: {d.trustScore.toFixed(1)} | IF: {d.ifScore.toFixed(1)} | XGB: {d.xgbScore.toFixed(1)}</p>
                          </div>);
                        }
                        return null;
                      }} />
                    <Scatter name="Benign" data={filteredTrustScores.filter((t) => !t.isMalicious)} fill="#22c55e" />
                    <Scatter name="Malicious" data={filteredTrustScores.filter((t) => t.isMalicious)} fill="#ef4444" />
                    <Legend />
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Trust Score by Actual Label">
                {(() => {
                  const benign = filteredTrustScores.filter((t) => !t.isMalicious).map((t) => t.trustScore);
                  const malicious = filteredTrustScores.filter((t) => t.isMalicious).map((t) => t.trustScore);
                  const calcStats = (arr: number[]) => {
                    if (arr.length === 0) return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
                    const sorted = [...arr].sort((a, b) => a - b);
                    return {
                      min: sorted[0],
                      q1: sorted[Math.floor(sorted.length * 0.25)],
                      median: sorted[Math.floor(sorted.length * 0.5)],
                      q3: sorted[Math.floor(sorted.length * 0.75)],
                      max: sorted[sorted.length - 1],
                    };
                  };
                  const bStats = calcStats(benign);
                  const mStats = calcStats(malicious);
                  const data = [
                    { label: 'Benign', ...bStats, count: benign.length },
                    { label: 'Malicious', ...mStats, count: malicious.length },
                  ];
                  return (
                    <div className="space-y-4 pt-4">
                      {data.map((d) => (
                        <div key={d.label} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className={d.label === 'Benign' ? 'text-green-400' : 'text-red-400'}>{d.label} ({d.count})</span>
                          </div>
                          <div className="relative h-8 rounded bg-slate-800">
                            {/* IQR box */}
                            <div className="absolute top-1 bottom-1 rounded"
                              style={{
                                left: `${d.q1}%`, width: `${d.q3 - d.q1}%`,
                                backgroundColor: d.label === 'Benign' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,87,0.3)',
                                border: `1px solid ${d.label === 'Benign' ? '#22c55e' : '#ef4444'}`,
                              }} />
                            {/* Median line */}
                            <div className="absolute top-0 bottom-0 w-0.5"
                              style={{ left: `${d.median}%`, backgroundColor: d.label === 'Benign' ? '#22c55e' : '#ef4444' }} />
                            {/* Min/Max whiskers */}
                            <div className="absolute top-3 h-0.5 bg-slate-500" style={{ left: `${d.min}%`, width: `${d.q1 - d.min}%` }} />
                            <div className="absolute top-3 h-0.5 bg-slate-500" style={{ left: `${d.q3}%`, width: `${d.max - d.q3}%` }} />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Min: {d.min.toFixed(1)}</span>
                            <span>Q1: {d.q1.toFixed(1)}</span>
                            <span>Median: {d.median.toFixed(1)}</span>
                            <span>Q3: {d.q3.toFixed(1)}</span>
                            <span>Max: {d.max.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </Card>
            </div>

            {/* Device Drill-Down */}
            <SectionHeader title="Device Drill-Down" />
            <Card>
              <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
                <option value="">Select a device...</option>
                {[...filteredTrustScores].sort((a, b) => a.trustScore - b.trustScore).map((t) => (
                  <option key={t.deviceId} value={t.deviceId}>
                    {t.deviceId} — Trust: {t.trustScore.toFixed(1)} ({t.status})
                  </option>
                ))}
              </select>
              {selectedDevice && (() => {
                const dev = filteredTrustScores.find((t) => t.deviceId === selectedDevice);
                const feat = features.find((f) => f.deviceId === selectedDevice);
                if (!dev) return null;
                return (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <MiniMetric label="Trust Score" value={dev.trustScore.toFixed(1)} />
                      <MiniMetric label="Status" value={dev.status} />
                      <MiniMetric label="IF Score" value={dev.ifScore.toFixed(1)} />
                      <MiniMetric label="XGB Score" value={dev.xgbScore.toFixed(1)} />
                      <MiniMetric label="Label" value={dev.label} />
                    </div>
                    {feat && (() => {
                      const maxVals: Record<string, number> = {};
                      features.forEach((f) => {
                        featureOptions.forEach(({ key }) => {
                          maxVals[key] = Math.max(maxVals[key] || 0, f[key as keyof FeatureEntry] as number);
                        });
                      });
                      const radarData = featureOptions.map(({ key, label }) => ({
                        feature: label,
                        value: maxVals[key] > 0 ? (feat[key as keyof FeatureEntry] as number) / maxVals[key] : 0,
                      }));
                      return (
                        <ResponsiveContainer width="100%" height={350}>
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="#1e293b" />
                            <PolarAngleAxis dataKey="feature" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 1]} />
                            <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                          </RadarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </div>
                );
              })()}
            </Card>
          </div>
        )}

        {/* ═══ TAB: ALERTS ═══ */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <SectionHeader title="Alert Dashboard" />
            <div className="grid grid-cols-3 gap-4">
              <KpiCard label="Total Alerts" value={String(filteredAlerts.length)} color="#f59e0b" />
              <KpiCard label="Critical" value={String(filteredAlerts.filter((a) => a.severity === 'Critical').length)} color="#ef4444" />
              <KpiCard label="Warning" value={String(filteredAlerts.filter((a) => a.severity === 'Warning').length)} color="#f59e0b" />
            </div>

            {/* Lollipop: Alert devices by trust score */}
            {filteredAlerts.length > 0 && (
              <Card title="Alert Devices by Trust Score">
                <ResponsiveContainer width="100%" height={Math.max(200, filteredAlerts.length * 22)}>
                  <BarChart data={[...filteredAlerts].sort((a, b) => a.trustScore - b.trustScore)} layout="vertical" margin={{ left: 160 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis dataKey="deviceId" type="category" width={150} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="trustScore" radius={[0, 6, 6, 0]}>
                      {[...filteredAlerts].sort((a, b) => a.trustScore - b.trustScore).map((a, i) => (
                        <Cell key={i} fill={a.severity === 'Critical' ? '#ef4444' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Alert Table with Expandable Reasons */}
            <SectionHeader title="Alert Details" />
            <Card>
              <div className="space-y-2">
                {/* Compare mode */}
                {compareAlertId && (() => {
                  const a = filteredAlerts.find((al) => al.id === compareAlertId);
                  const b = filteredAlerts.find((al) => al.id === expandedAlertId);
                  if (!a || !b) return null;
                  return (
                    <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-semibold text-blue-400">Comparing Alerts</h4>
                        <button onClick={() => setCompareAlertId(null)}
                          className="text-xs text-slate-400 hover:text-white">Close comparison</button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <AlertDetailCard alert={a} label="Alert A" />
                        <AlertDetailCard alert={b} label="Alert B" />
                      </div>
                    </div>
                  );
                })()}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wider text-slate-400">
                        <th className="pb-3 pr-3 w-8"></th>
                        <th className="pb-3 pr-3">Device</th>
                        <th className="pb-3 pr-3">Trust</th>
                        <th className="pb-3 pr-3">Severity</th>
                        <th className="pb-3 pr-3">IF</th>
                        <th className="pb-3 pr-3">XGB</th>
                        <th className="pb-3 pr-3">CUSUM</th>
                        <th className="pb-3 pr-3">Flagged By</th>
                        <th className="pb-3">Reasons</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAlerts.map((a) => {
                        const isExpanded = expandedAlertId === a.id;
                        return (
                          <React.Fragment key={a.id}>
                            <tr className={`border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-800/20' : ''}`}
                              onClick={() => setExpandedAlertId(isExpanded ? null : a.id)}>
                              <td className="py-2 pr-3 text-slate-500">{isExpanded ? '▼' : '▶'}</td>
                              <td className="py-2 pr-3 font-mono text-slate-300 text-xs">{a.deviceId}</td>
                              <td className="py-2 pr-3">
                                <span className={`font-bold ${a.trustScore < 25 ? 'text-red-400' : a.trustScore < 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                                  {a.trustScore.toFixed(1)}
                                </span>
                              </td>
                              <td className="py-2 pr-3">
                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  a.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                }`}>{a.severity}</span>
                              </td>
                              <td className="py-2 pr-3 text-slate-400 text-xs">{a.metrics?.if_score.toFixed(1) ?? '-'}</td>
                              <td className="py-2 pr-3 text-slate-400 text-xs">{a.metrics?.xgb_score.toFixed(1) ?? '-'}</td>
                              <td className="py-2 pr-3 text-xs">{a.metrics?.cusum_shift ? <span className="text-red-400">Yes</span> : <span className="text-slate-500">No</span>}</td>
                              <td className="py-2 pr-3 text-slate-400 text-xs">{a.flaggedBy?.join(', ') || '-'}</td>
                              <td className="py-2 text-slate-400 text-xs max-w-[200px] truncate">{a.alertReason.split(';')[0]}...</td>
                            </tr>
                            {/* Expanded row: full reasons dropdown */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={9} className="py-0">
                                  <div className="border-l-2 border-blue-500 ml-4 pl-4 py-3 bg-slate-800/30 mb-1">
                                    <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Full Reasons</h4>
                                    <div className="space-y-1">
                                      {a.alertReason.split(';').map((reason, i) => (
                                        <p key={i} className="text-sm text-slate-300">
                                          <span className="text-slate-500 mr-2">{i + 1}.</span>
                                          {reason.trim()}
                                        </p>
                                      ))}
                                    </div>
                                    <div className="mt-3 flex gap-4 text-xs">
                                      <span className="text-slate-400">
                                        <strong className="text-slate-300">Recommended:</strong> {a.recommendedAction}
                                      </span>
                                    </div>
                                    {a.deviatingFeatures && a.deviatingFeatures.length > 0 && (
                                      <div className="mt-2">
                                        <span className="text-xs text-slate-400">Deviating features: </span>
                                        {a.deviatingFeatures.map((f) => (
                                          <span key={f} className="inline-block rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300 mr-1">{f}</span>
                                        ))}
                                      </div>
                                    )}
                                    {/* Compare button */}
                                    <div className="mt-3 pt-2 border-t border-slate-700">
                                      <label className="text-xs text-slate-400 font-medium">Compare with another alert:</label>
                                      <select
                                        value={compareAlertId || ''}
                                        onChange={(e) => setCompareAlertId(e.target.value || null)}
                                        className="ml-2 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200"
                                      >
                                        <option value="">Select alert to compare...</option>
                                        {filteredAlerts.filter((al) => al.id !== a.id).map((al) => (
                                          <option key={al.id} value={al.id}>
                                            {al.deviceId} — Trust: {al.trustScore.toFixed(1)} ({al.severity})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ═══ TAB: FEATURE EXPLORER ═══ */}
        {activeTab === 'explorer' && (
          <div className="space-y-6">
            <SectionHeader title="Interactive Feature Explorer" />
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-medium">X Axis</label>
                <select value={xAxis} onChange={(e) => setXAxis(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
                  {featureOptions.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Y Axis</label>
                <select value={yAxis} onChange={(e) => setYAxis(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
                  {featureOptions.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Bubble Size</label>
                <select value={sizeAxis} onChange={(e) => setSizeAxis(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
                  <option value="none">None</option>
                  {featureOptions.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              </div>
            </div>

            <Card title={`${featureOptions.find((f) => f.key === xAxis)?.label} vs ${featureOptions.find((f) => f.key === yAxis)?.label}`}>
              <ResponsiveContainer width="100%" height={450}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey={xAxis} type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} name={featureOptions.find((f) => f.key === xAxis)?.label} />
                  <YAxis dataKey={yAxis} type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} name={featureOptions.find((f) => f.key === yAxis)?.label} />
                  <Tooltip contentStyle={tooltipStyle}
                    content={({ active, payload }) => {
                      if (active && payload?.[0]) {
                        const d = payload[0].payload as FeatureEntry;
                        return (<div className="rounded border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100">
                          <p className="font-semibold">{d.deviceId}</p>
                          <p>{xAxis}: {(d[xAxis as keyof FeatureEntry] as number).toFixed(2)}</p>
                          <p>{yAxis}: {(d[yAxis as keyof FeatureEntry] as number).toFixed(2)}</p>
                          <p>Label: {d.label}</p>
                        </div>);
                      }
                      return null;
                    }} />
                  <Scatter name="Benign" data={filteredFeatures.filter((f) => !f.isMalicious)} fill="#22c55e" />
                  <Scatter name="Malicious" data={filteredFeatures.filter((f) => f.isMalicious)} fill="#ef4444" />
                  <Legend />
                </ScatterChart>
              </ResponsiveContainer>
            </Card>

            {/* Feature comparison table */}
            <SectionHeader title="Benign vs Malicious Feature Comparison" />
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wider text-slate-400">
                      <th className="pb-3 pr-4">Feature</th>
                      <th className="pb-3 pr-4">Benign Avg</th>
                      <th className="pb-3 pr-4">Malicious Avg</th>
                      <th className="pb-3">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureOptions.map(({ key, label }) => {
                      const benign = filteredFeatures.filter((f) => !f.isMalicious);
                      const malicious = filteredFeatures.filter((f) => f.isMalicious);
                      const avg = (arr: FeatureEntry[]) => arr.length > 0 ? arr.reduce((s, f) => s + (f[key as keyof FeatureEntry] as number), 0) / arr.length : 0;
                      const bAvg = avg(benign);
                      const mAvg = avg(malicious);
                      const diff = bAvg > 0 ? ((mAvg - bAvg) / bAvg * 100) : 0;
                      return (
                        <tr key={key} className="border-b border-slate-800/50">
                          <td className="py-2 pr-4 text-slate-300">{label}</td>
                          <td className="py-2 pr-4 text-green-400 font-mono">{bAvg.toFixed(1)}</td>
                          <td className="py-2 pr-4 text-red-400 font-mono">{mAvg.toFixed(1)}</td>
                          <td className={`py-2 font-mono font-bold ${diff > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(0)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Correlation heatmap (table-based) */}
            <SectionHeader title="Feature Correlations" />
            <Card>
              {(() => {
                const cols = featureOptions.map((f) => f.key);
                const labels = featureOptions.map((f) => f.label);
                const data = filteredFeatures;
                const means: Record<string, number> = {};
                const stds: Record<string, number> = {};
                cols.forEach((c) => {
                  const vals = data.map((d) => d[c as keyof FeatureEntry] as number);
                  means[c] = vals.reduce((s, v) => s + v, 0) / (vals.length || 1);
                  stds[c] = Math.sqrt(vals.reduce((s, v) => s + (v - means[c]) ** 2, 0) / (vals.length || 1));
                });
                const corr = (a: string, b: string) => {
                  if (stds[a] === 0 || stds[b] === 0) return 0;
                  const n = data.length || 1;
                  const sum = data.reduce((s, d) => s + ((d[a as keyof FeatureEntry] as number) - means[a]) * ((d[b as keyof FeatureEntry] as number) - means[b]), 0);
                  return sum / (n * stds[a] * stds[b]);
                };
                const getColor = (v: number) => {
                  if (v > 0.7) return 'bg-red-500/60 text-white';
                  if (v > 0.3) return 'bg-red-500/30 text-red-300';
                  if (v < -0.7) return 'bg-blue-500/60 text-white';
                  if (v < -0.3) return 'bg-blue-500/30 text-blue-300';
                  return 'bg-slate-800 text-slate-400';
                };
                return (
                  <div className="overflow-x-auto">
                    <table className="text-[10px]">
                      <thead>
                        <tr>
                          <th className="p-1"></th>
                          {labels.map((l) => <th key={l} className="p-1 text-slate-400 font-normal -rotate-45 origin-bottom-left whitespace-nowrap">{l}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {cols.map((row, i) => (
                          <tr key={row}>
                            <td className="p-1 text-slate-400 whitespace-nowrap pr-2">{labels[i]}</td>
                            {cols.map((col) => {
                              const v = corr(row, col);
                              return (
                                <td key={col} className={`p-1 text-center rounded ${getColor(v)}`} title={`${labels[i]} × ${labels[cols.indexOf(col)]}: ${v.toFixed(2)}`}>
                                  {v.toFixed(2)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Utility: floor datetime string to granularity ───────
function floorDate(dt: string, gran: string): string {
  const d = new Date(dt);
  if (gran === '10min') { d.setMinutes(Math.floor(d.getMinutes() / 10) * 10, 0, 0); }
  else if (gran === '30min') { d.setMinutes(Math.floor(d.getMinutes() / 30) * 30, 0, 0); }
  else if (gran === '1h') { d.setMinutes(0, 0, 0); }
  else if (gran === '6h') { d.setHours(Math.floor(d.getHours() / 6) * 6, 0, 0, 0); }
  else if (gran === '1D') { d.setHours(0, 0, 0, 0); }
  return d.toISOString().slice(0, 16);
}

// ── Sub-components ──────────────────────────────────────
function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-center">
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color }}>{sub}</p>}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-lg font-semibold text-slate-100 border-b border-blue-500/30 pb-2 mt-2">{title}</h2>;
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
      {title && <h3 className="text-sm font-semibold text-slate-200 mb-4">{title}</h3>}
      {children}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-800/50 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-lg font-bold text-slate-100 mt-1">{value}</p>
    </div>
  );
}

function AlertDetailCard({ alert, label }: { alert: Alert; label: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 space-y-2">
      <h5 className="text-xs font-semibold text-blue-400">{label}: {alert.deviceId}</h5>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><span className="text-slate-400">Trust: </span><span className="text-slate-200 font-bold">{alert.trustScore.toFixed(1)}</span></div>
        <div><span className="text-slate-400">Severity: </span><span className={alert.severity === 'Critical' ? 'text-red-400' : 'text-yellow-400'}>{alert.severity}</span></div>
        <div><span className="text-slate-400">IF: </span><span className="text-slate-200">{alert.metrics?.if_score.toFixed(1)}</span></div>
        <div><span className="text-slate-400">XGB: </span><span className="text-slate-200">{alert.metrics?.xgb_score.toFixed(1)}</span></div>
      </div>
      <div>
        <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Reasons:</p>
        {alert.alertReason.split(';').map((r, i) => (
          <p key={i} className="text-xs text-slate-300 pl-2 border-l border-slate-600 mb-1">{r.trim()}</p>
        ))}
      </div>
      <div><span className="text-[10px] text-slate-400">Flagged by: </span><span className="text-xs text-slate-300">{alert.flaggedBy?.join(', ')}</span></div>
    </div>
  );
}

function AttackTechniqueCard({ entry, liveCount, avgDur, avgBytesOut, avgBytesIn, uniqueTargets, topPorts, topStates }: {
  entry: { attack_type: string; readable_name: string; narrative: string };
  liveCount: number; avgDur: number; avgBytesOut: number; avgBytesIn: number; uniqueTargets: number;
  topPorts: [string, number][]; topStates: [string, number][];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/40 transition-colors">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ATTACK_COLORS[entry.readable_name] || '#64748b' }} />
          <span className="font-medium text-slate-200">{entry.readable_name}</span>
          <span className="text-sm text-slate-400">— {liveCount.toLocaleString()} connections</span>
        </div>
        <span className="text-slate-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="border-t border-slate-800 p-4 space-y-3">
          <p className="text-sm text-slate-400 italic">{entry.narrative}</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MiniMetric label="Connections" value={liveCount.toLocaleString()} />
            <MiniMetric label="Avg Duration" value={`${avgDur.toFixed(3)}s`} />
            <MiniMetric label="Avg Bytes Out" value={avgBytesOut.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
            <MiniMetric label="Avg Bytes In" value={avgBytesIn.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
            <MiniMetric label="Unique Targets" value={String(uniqueTargets)} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 font-medium mb-2">Top Ports</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={topPorts.map(([port, count]) => ({ port: `:${port}`, count }))}>
                  <XAxis dataKey="port" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-2">Connection States</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={topStates.map(([state, count]) => ({ state, count }))}>
                  <XAxis dataKey="state" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
