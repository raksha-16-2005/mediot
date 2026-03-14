'use client';

import React, { useMemo } from 'react';
import { useFilters, RawRow } from '@/contexts/filter-context';

interface DeviceDetailPanelProps {
  deviceId: string;
  isOpen: boolean;
  onClose: () => void;
}

/* ── helpers ───────────────────────────────────────────────── */
function fmtBytes(b: number) {
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(2)} MB`;
  if (b >= 1e3) return `${(b / 1e3).toFixed(2)} KB`;
  return `${b} B`;
}

function fmtDuration(s: number) {
  if (s >= 3600) return `${(s / 3600).toFixed(1)}h`;
  if (s >= 60) return `${(s / 60).toFixed(1)}m`;
  return `${s.toFixed(3)}s`;
}

function scoreColor(score: number) {
  if (score > 80) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function scoreBg(score: number) {
  if (score > 80) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

function statusBadge(status: string) {
  const m: Record<string, string> = {
    Online: 'bg-green-500/20 text-green-400 border-green-500/30',
    Healthy: 'bg-green-500/20 text-green-400 border-green-500/30',
    Suspicious: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    ALERT: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return m[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}

/* top-N from an array of values */
function topN(arr: string[], n: number): [string, number][] {
  const counts: Record<string, number> = {};
  arr.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

/* ── component ─────────────────────────────────────────────── */
export function DeviceDetailPanel({ deviceId, isOpen, onClose }: DeviceDetailPanelProps) {
  const {
    devices, alerts, trustScores, features,
    rawTs, filteredRows,
  } = useFilters();

  // All data for this device
  const device = useMemo(() => devices.find((d) => d.deviceId === deviceId) || null, [devices, deviceId]);

  const deviceAlerts = useMemo(
    () => alerts.filter((a) => a.deviceId === deviceId),
    [alerts, deviceId],
  );

  const deviceTrust = useMemo(
    () => trustScores.find((t) => t.deviceId === deviceId) || null,
    [trustScores, deviceId],
  );

  const deviceFeature = useMemo(
    () => features.find((f) => f.deviceId === deviceId) || null,
    [features, deviceId],
  );

  // Raw connections for this device (use ipAddress or deviceId)
  const deviceConnections = useMemo(() => {
    const ip = device?.ipAddress || deviceId;
    return rawTs.filter((r) => r.device_id === ip || r.device_id === deviceId);
  }, [rawTs, device, deviceId]);

  // Attack breakdown from raw connections
  const attackBreakdown = useMemo(() => {
    const mal = deviceConnections.filter((r) => r.label === 'Malicious');
    if (mal.length === 0) return [];
    return topN(
      mal.map((r) => r.attack_label || r.attack_type || 'Unknown'),
      10,
    );
  }, [deviceConnections]);

  // Top destination IPs
  const topDstIps = useMemo(
    () => topN(deviceConnections.map((r) => r['id.resp_h']).filter(Boolean), 5),
    [deviceConnections],
  );

  // Top destination ports
  const topDstPorts = useMemo(
    () => topN(deviceConnections.map((r) => String(r['id.resp_p'])).filter((p) => p !== '0'), 5),
    [deviceConnections],
  );

  // Connection state breakdown
  const connStates = useMemo(
    () => topN(deviceConnections.map((r) => r.conn_state).filter(Boolean), 6),
    [deviceConnections],
  );

  // Traffic stats
  const trafficStats = useMemo(() => {
    if (deviceConnections.length === 0) return null;
    const totalOut = deviceConnections.reduce((s, r) => s + (r.orig_bytes || 0), 0);
    const totalIn = deviceConnections.reduce((s, r) => s + (r.resp_bytes || 0), 0);
    const totalDuration = deviceConnections.reduce((s, r) => s + (r.duration || 0), 0);
    const avgDuration = totalDuration / deviceConnections.length;
    const malCount = deviceConnections.filter((r) => r.label === 'Malicious').length;
    const benignCount = deviceConnections.filter((r) => r.label === 'Benign').length;
    const uniqueDst = new Set(deviceConnections.map((r) => r['id.resp_h'])).size;
    const uniquePorts = new Set(deviceConnections.map((r) => r['id.resp_p'])).size;
    const failedStates = ['S0', 'REJ', 'RSTO', 'RSTR'];
    const failedCount = deviceConnections.filter((r) => failedStates.includes(r.conn_state)).length;

    return {
      totalConnections: deviceConnections.length,
      totalOut, totalIn,
      avgDuration, totalDuration,
      malCount, benignCount,
      malPct: deviceConnections.length > 0 ? (malCount / deviceConnections.length * 100) : 0,
      uniqueDst, uniquePorts,
      failedCount,
      failedRatio: deviceConnections.length > 0 ? (failedCount / deviceConnections.length * 100) : 0,
    };
  }, [deviceConnections]);

  // Timeline: first & last activity
  const timeline = useMemo(() => {
    if (deviceConnections.length === 0) return null;
    const sorted = [...deviceConnections].sort((a, b) => a.ts - b.ts);
    return {
      first: sorted[0].datetime,
      last: sorted[sorted.length - 1].datetime,
      firstMal: sorted.find((r) => r.label === 'Malicious')?.datetime || null,
    };
  }, [deviceConnections]);

  if (!isOpen) return null;

  const sectionCls = 'border-t border-slate-700/50 pt-5 mt-5';
  const labelCls = 'text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1';
  const valueCls = 'text-sm text-slate-100 font-mono';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel — wide, full-height */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto bg-slate-900 shadow-2xl border-l border-slate-700">

        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-100">IP Deep Dive</h2>
              <p className="font-mono text-blue-400 text-sm mt-0.5">{device?.ipAddress || deviceId}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-0">

          {/* ═══ TRUST SCORE HERO ═══ */}
          {device && (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <p className={`text-4xl font-black ${scoreColor(device.trustScore)}`}>
                    {device.trustScore.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Trust Score</p>
                </div>
                <div className="flex-1">
                  <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${scoreBg(device.trustScore)}`}
                      style={{ width: `${device.trustScore}%` }} />
                  </div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusBadge(device.status)}`}>
                  {device.status}
                </span>
              </div>
            </div>
          )}

          {/* ═══ ALGORITHM SCORES ═══ */}
          <div className={sectionCls}>
            <h3 className="text-sm font-bold text-slate-200 mb-3">Algorithm Scores</h3>
            <div className="grid grid-cols-3 gap-3">
              {/* Isolation Forest */}
              <div className="rounded-lg bg-slate-800/80 border border-slate-700 p-3 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Isolation Forest</p>
                <p className={`text-2xl font-bold ${scoreColor(device?.ifScore ?? deviceTrust?.ifScore ?? 0)}`}>
                  {(device?.ifScore ?? deviceTrust?.ifScore ?? 0).toFixed(1)}
                </p>
                <p className="text-[10px] text-slate-600 mt-1">Unsupervised</p>
              </div>
              {/* XGBoost */}
              <div className="rounded-lg bg-slate-800/80 border border-slate-700 p-3 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">XGBoost</p>
                <p className={`text-2xl font-bold ${scoreColor(device?.xgbScore ?? deviceTrust?.xgbScore ?? 0)}`}>
                  {(device?.xgbScore ?? deviceTrust?.xgbScore ?? 0).toFixed(1)}
                </p>
                <p className="text-[10px] text-slate-600 mt-1">Supervised</p>
              </div>
              {/* CUSUM */}
              <div className="rounded-lg bg-slate-800/80 border border-slate-700 p-3 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">CUSUM</p>
                {device?.cusumShift === undefined || device?.cusumShift === null ? (
                  <>
                    <p className="text-2xl font-bold text-slate-500">N/A</p>
                    <p className="text-[10px] text-slate-600 mt-1">Not Analyzed</p>
                  </>
                ) : (
                  <>
                    <p className={`text-2xl font-bold ${device.cusumShift ? 'text-red-400' : 'text-green-400'}`}>
                      {device.cusumShift ? 'SHIFT' : 'STABLE'}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">Temporal</p>
                  </>
                )}
              </div>
            </div>
            {/* Score formula */}
            <div className="mt-3 rounded bg-slate-800/50 border border-slate-700/50 px-3 py-2 text-[11px] text-slate-400 font-mono">
              Trust = 0.4 x IF({(device?.ifScore ?? 0).toFixed(1)}) + 0.5 x XGB({(device?.xgbScore ?? 0).toFixed(1)}) - CUSUM({device?.cusumShift ? '10' : '0'}) = <span className={`font-bold ${scoreColor(device?.trustScore ?? 0)}`}>{(device?.trustScore ?? 0).toFixed(1)}</span>
            </div>
          </div>

          {/* ═══ ATTACK TYPES ═══ */}
          {attackBreakdown.length > 0 && (
            <div className={sectionCls}>
              <h3 className="text-sm font-bold text-slate-200 mb-3">Attack Types Detected</h3>
              <div className="space-y-2">
                {attackBreakdown.map(([type, count]) => {
                  const pct = trafficStats ? (count / trafficStats.malCount * 100) : 0;
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-red-300 font-medium">{type}</span>
                        <span className="text-slate-400">{count.toLocaleString()} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-red-500/70" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ TRAFFIC STATISTICS ═══ */}
          {trafficStats && (
            <div className={sectionCls}>
              <h3 className="text-sm font-bold text-slate-200 mb-3">Traffic Statistics</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div><p className={labelCls}>Total Connections</p><p className={valueCls}>{trafficStats.totalConnections.toLocaleString()}</p></div>
                <div><p className={labelCls}>Malicious / Benign</p><p className={valueCls}><span className="text-red-400">{trafficStats.malCount.toLocaleString()}</span> / <span className="text-green-400">{trafficStats.benignCount.toLocaleString()}</span></p></div>
                <div><p className={labelCls}>Bytes Sent (Out)</p><p className={valueCls}>{fmtBytes(trafficStats.totalOut)}</p></div>
                <div><p className={labelCls}>Bytes Received (In)</p><p className={valueCls}>{fmtBytes(trafficStats.totalIn)}</p></div>
                <div><p className={labelCls}>Avg Connection Duration</p><p className={valueCls}>{fmtDuration(trafficStats.avgDuration)}</p></div>
                <div><p className={labelCls}>Total Duration</p><p className={valueCls}>{fmtDuration(trafficStats.totalDuration)}</p></div>
                <div><p className={labelCls}>Unique Dest IPs</p><p className={valueCls}>{trafficStats.uniqueDst}</p></div>
                <div><p className={labelCls}>Unique Dest Ports</p><p className={valueCls}>{trafficStats.uniquePorts}</p></div>
                <div><p className={labelCls}>Failed Connections</p><p className={valueCls}>{trafficStats.failedCount.toLocaleString()} ({trafficStats.failedRatio.toFixed(1)}%)</p></div>
                <div><p className={labelCls}>Malicious Ratio</p><p className={`${valueCls} ${trafficStats.malPct > 50 ? 'text-red-400' : 'text-green-400'}`}>{trafficStats.malPct.toFixed(1)}%</p></div>
              </div>
            </div>
          )}

          {/* ═══ BEHAVIORAL FEATURES ═══ */}
          {deviceFeature && (
            <div className={sectionCls}>
              <h3 className="text-sm font-bold text-slate-200 mb-3">Behavioral Features (ML Input)</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div><p className={labelCls}>Bytes Sent</p><p className={valueCls}>{fmtBytes(deviceFeature.bytesSent)}</p></div>
                <div><p className={labelCls}>Bytes Received</p><p className={valueCls}>{fmtBytes(deviceFeature.bytesReceived)}</p></div>
                <div><p className={labelCls}>Packet Count</p><p className={valueCls}>{deviceFeature.packetCount.toLocaleString()}</p></div>
                <div><p className={labelCls}>Avg Conn Duration</p><p className={valueCls}>{fmtDuration(deviceFeature.avgConnectionDuration)}</p></div>
                <div><p className={labelCls}>Unique Dst IPs</p><p className={valueCls}>{deviceFeature.uniqueDstIps}</p></div>
                <div><p className={labelCls}>Unique Dst Ports</p><p className={valueCls}>{deviceFeature.uniqueDstPorts}</p></div>
                <div><p className={labelCls}>Connection Count</p><p className={valueCls}>{deviceFeature.connectionCount}</p></div>
                <div><p className={labelCls}>Failed Conn Ratio</p><p className={valueCls}>{(deviceFeature.failedConnectionRatio * 100).toFixed(1)}%</p></div>
                <div><p className={labelCls}>External IP Ratio</p><p className={valueCls}>{(deviceFeature.externalIpRatio * 100).toFixed(1)}%</p></div>
                <div><p className={labelCls}>Ground Truth</p><p className={`${valueCls} ${deviceFeature.isMalicious ? 'text-red-400' : 'text-green-400'}`}>{deviceFeature.label}</p></div>
              </div>
            </div>
          )}

          {/* ═══ NETWORK TARGETS ═══ */}
          {(topDstIps.length > 0 || topDstPorts.length > 0) && (
            <div className={sectionCls}>
              <h3 className="text-sm font-bold text-slate-200 mb-3">Network Targets</h3>
              <div className="grid grid-cols-2 gap-6">
                {/* Top Dest IPs */}
                <div>
                  <p className={labelCls}>Top Destination IPs</p>
                  <div className="space-y-1.5">
                    {topDstIps.map(([ip, cnt]) => (
                      <div key={ip} className="flex justify-between text-xs">
                        <span className="font-mono text-slate-300 truncate mr-2">{ip}</span>
                        <span className="text-slate-500 flex-shrink-0">{cnt.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Top Dest Ports */}
                <div>
                  <p className={labelCls}>Top Destination Ports</p>
                  <div className="space-y-1.5">
                    {topDstPorts.map(([port, cnt]) => (
                      <div key={port} className="flex justify-between text-xs">
                        <span className="font-mono text-slate-300">{port}</span>
                        <span className="text-slate-500">{cnt.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ CONNECTION STATES ═══ */}
          {connStates.length > 0 && (
            <div className={sectionCls}>
              <h3 className="text-sm font-bold text-slate-200 mb-3">Connection States</h3>
              <div className="flex flex-wrap gap-2">
                {connStates.map(([state, cnt]) => {
                  const failed = ['S0', 'REJ', 'RSTO', 'RSTR'].includes(state);
                  return (
                    <span key={state} className={`rounded-full border px-3 py-1 text-xs font-mono ${failed ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-green-500/30 bg-green-500/10 text-green-400'}`}>
                      {state}: {cnt.toLocaleString()}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ TIMELINE ═══ */}
          {timeline && (
            <div className={sectionCls}>
              <h3 className="text-sm font-bold text-slate-200 mb-3">Timeline</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div><p className={labelCls}>First Activity</p><p className="text-xs text-slate-300 font-mono">{timeline.first}</p></div>
                <div><p className={labelCls}>Last Activity</p><p className="text-xs text-slate-300 font-mono">{timeline.last}</p></div>
                {timeline.firstMal && (
                  <div className="col-span-2"><p className={labelCls}>First Malicious Activity</p><p className="text-xs text-red-400 font-mono">{timeline.firstMal}</p></div>
                )}
              </div>
            </div>
          )}

          {/* ═══ ALERTS ═══ */}
          {deviceAlerts.length > 0 && (
            <div className={sectionCls}>
              <h3 className="text-sm font-bold text-slate-200 mb-3">Alerts ({deviceAlerts.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {deviceAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${alert.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-slate-500">{alert.trustScore.toFixed(1)} trust</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{alert.alertReason}</p>
                    {alert.flaggedBy && alert.flaggedBy.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {alert.flaggedBy.map((alg) => (
                          <span key={alg} className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300">{alg}</span>
                        ))}
                      </div>
                    )}
                    {alert.recommendedAction && (
                      <p className="text-[10px] text-slate-500 mt-2 italic">{alert.recommendedAction}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ RAW CONNECTIONS SAMPLE ═══ */}
          {deviceConnections.length > 0 && (
            <div className={sectionCls}>
              <h3 className="text-sm font-bold text-slate-200 mb-3">
                Raw Connections <span className="text-slate-500 font-normal">(latest 20 of {deviceConnections.length.toLocaleString()})</span>
              </h3>
              <div className="overflow-x-auto max-h-64 overflow-y-auto rounded border border-slate-700">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-slate-800">
                    <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="px-2 py-1.5">Time</th>
                      <th className="px-2 py-1.5">Dst IP</th>
                      <th className="px-2 py-1.5">Port</th>
                      <th className="px-2 py-1.5">State</th>
                      <th className="px-2 py-1.5 text-right">Out</th>
                      <th className="px-2 py-1.5 text-right">In</th>
                      <th className="px-2 py-1.5">Label</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deviceConnections.slice(-20).reverse().map((r, i) => (
                      <tr key={i} className={`border-t border-slate-800/50 ${r.label === 'Malicious' ? 'bg-red-500/5' : ''}`}>
                        <td className="px-2 py-1 text-slate-400 font-mono whitespace-nowrap">{r.datetime?.slice(11) || ''}</td>
                        <td className="px-2 py-1 text-slate-300 font-mono">{r['id.resp_h']}</td>
                        <td className="px-2 py-1 text-slate-400 font-mono">{r['id.resp_p']}</td>
                        <td className="px-2 py-1">
                          <span className={`${['S0','REJ','RSTO','RSTR'].includes(r.conn_state) ? 'text-red-400' : 'text-green-400'}`}>
                            {r.conn_state}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-right text-slate-400 font-mono">{(r.orig_bytes || 0).toLocaleString()}</td>
                        <td className="px-2 py-1 text-right text-slate-400 font-mono">{(r.resp_bytes || 0).toLocaleString()}</td>
                        <td className="px-2 py-1">
                          <span className={r.label === 'Malicious' ? 'text-red-400' : 'text-green-400'}>{r.label}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No data state */}
          {!device && deviceConnections.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No data found for this device.</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
