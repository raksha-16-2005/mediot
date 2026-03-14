'use client';

import React from 'react';
import { useFilters } from '@/contexts/filter-context';

export function GlobalFilterSidebar() {
  const {
    sidebarOpen, setSidebarOpen,
    dateStart, setDateStart, dateEnd, setDateEnd,
    selectedIps, setSelectedIps, allIps,
    selectedAttackTypes, setSelectedAttackTypes, allAttackTypes,
    trafficType, setTrafficType,
    selectedSeverity, setSelectedSeverity,
    trustRange, setTrustRange,
    granularity, setGranularity,
    filteredRows, loading,
  } = useFilters();

  if (!sidebarOpen) return null;

  const toggleIp = (ip: string) => {
    setSelectedIps(
      selectedIps.includes(ip) ? selectedIps.filter((i) => i !== ip) : [...selectedIps, ip]
    );
  };

  const toggleAttackType = (t: string) => {
    setSelectedAttackTypes(
      selectedAttackTypes.includes(t)
        ? selectedAttackTypes.filter((x) => x !== t)
        : [...selectedAttackTypes, t]
    );
  };

  const toggleSeverity = (s: string) => {
    setSelectedSeverity(
      selectedSeverity.includes(s) ? selectedSeverity.filter((x) => x !== s) : [...selectedSeverity, s]
    );
  };

  const clearAll = () => {
    setSelectedIps([]);
    setSelectedAttackTypes([]);
    setTrafficType('All');
    setSelectedSeverity(['Critical', 'Warning']);
    setTrustRange([0, 100]);
  };

  const labelCls = 'text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2';
  const checkCls = 'flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className="fixed top-16 right-0 bottom-0 w-72 bg-slate-900 border-l border-slate-700 z-50 overflow-y-auto shadow-2xl">
        <div className="p-4 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">Filters</h3>
            <div className="flex gap-2">
              <button
                onClick={clearAll}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Reset
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-400 hover:text-white text-lg leading-none"
              >
                x
              </button>
            </div>
          </div>

          {/* Active filter count */}
          <div className="text-xs text-slate-500">
            {loading ? 'Loading...' : `${filteredRows.length.toLocaleString()} connections matched`}
          </div>

          {/* Date Range */}
          <div>
            <p className={labelCls}>Date Range</p>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 mb-1"
            />
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200"
            />
          </div>

          {/* Source IPs */}
          <div>
            <div className="flex items-center justify-between">
              <p className={labelCls}>Source IPs</p>
              {selectedIps.length > 0 && (
                <button onClick={() => setSelectedIps([])} className="text-[10px] text-blue-400 hover:text-blue-300">
                  Clear
                </button>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-700 rounded p-2 bg-slate-800/50">
              {allIps.length === 0 && <p className="text-xs text-slate-500">Loading...</p>}
              {allIps.map((ip) => (
                <label key={ip} className={checkCls}>
                  <input
                    type="checkbox"
                    checked={selectedIps.includes(ip)}
                    onChange={() => toggleIp(ip)}
                    className="accent-blue-500"
                  />
                  <span className="truncate">{ip}</span>
                </label>
              ))}
            </div>
            {selectedIps.length > 0 && (
              <p className="text-[10px] text-blue-400 mt-1">
                {selectedIps.length} of {allIps.length} selected
              </p>
            )}
          </div>

          {/* Attack Types */}
          <div>
            <div className="flex items-center justify-between">
              <p className={labelCls}>Attack Types</p>
              {selectedAttackTypes.length > 0 && (
                <button onClick={() => setSelectedAttackTypes([])} className="text-[10px] text-blue-400 hover:text-blue-300">
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-1 border border-slate-700 rounded p-2 bg-slate-800/50">
              {allAttackTypes.length === 0 && <p className="text-xs text-slate-500">Loading...</p>}
              {allAttackTypes.map((t) => (
                <label key={t} className={checkCls}>
                  <input
                    type="checkbox"
                    checked={selectedAttackTypes.includes(t)}
                    onChange={() => toggleAttackType(t)}
                    className="accent-blue-500"
                  />
                  <span className="truncate">{t}</span>
                </label>
              ))}
            </div>
            {selectedAttackTypes.length > 0 && (
              <p className="text-[10px] text-blue-400 mt-1">
                {selectedAttackTypes.length} of {allAttackTypes.length} selected
              </p>
            )}
          </div>

          {/* Traffic Type */}
          <div>
            <p className={labelCls}>Traffic Type</p>
            <div className="flex gap-1">
              {(['All', 'Malicious', 'Benign'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTrafficType(t)}
                  className={`flex-1 text-xs py-1.5 rounded transition-colors ${
                    trafficType === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Alert Severity */}
          <div>
            <p className={labelCls}>Alert Severity</p>
            <div className="space-y-1">
              {['Critical', 'Warning', 'Info'].map((s) => (
                <label key={s} className={checkCls}>
                  <input
                    type="checkbox"
                    checked={selectedSeverity.includes(s)}
                    onChange={() => toggleSeverity(s)}
                    className="accent-blue-500"
                  />
                  <span className={
                    s === 'Critical' ? 'text-red-400' :
                    s === 'Warning' ? 'text-yellow-400' : 'text-blue-400'
                  }>{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Trust Score Range */}
          <div>
            <p className={labelCls}>Trust Score Range</p>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>{trustRange[0]}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={trustRange[0]}
                onChange={(e) => setTrustRange([+e.target.value, trustRange[1]])}
                className="flex-1 accent-blue-500"
              />
              <input
                type="range"
                min={0}
                max={100}
                value={trustRange[1]}
                onChange={(e) => setTrustRange([trustRange[0], +e.target.value])}
                className="flex-1 accent-blue-500"
              />
              <span>{trustRange[1]}</span>
            </div>
          </div>

          {/* Granularity */}
          <div>
            <p className={labelCls}>Time Granularity</p>
            <div className="flex flex-wrap gap-1">
              {['10min', '30min', '1h', '6h', '1D'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    granularity === g
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
