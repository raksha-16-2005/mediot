'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, Legend,
} from 'recharts';
import { useFilters } from '@/contexts/filter-context';

const SCENARIO_COLORS: Record<string, string> = {
  'Normal IoT communication': '#22c55e',
  'DoS packet flood': '#ef4444',
  'Data exfiltration': '#a855f7',
  'Port scanning': '#f59e0b',
  'Gradual traffic drift': '#3b82f6',
  'Boundary extreme': '#64748b',
  'Adversarial balanced traffic': '#ec4899',
};

const RESULT_COLORS = { correct: '#22c55e', incorrect: '#ef4444' };

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #475569',
  borderRadius: '0.5rem',
  color: '#e2e8f0',
};

export default function DashboardPage() {
  const { testCases, loading } = useFilters();
  const [selectedScenario, setSelectedScenario] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'id' | 'trust' | 'xgb'>('id');

  // Filtered test cases
  const filtered = useMemo(() => {
    let tc = testCases;
    if (selectedScenario !== 'All') tc = tc.filter((t) => t.scenario === selectedScenario);
    if (sortBy === 'trust') tc = [...tc].sort((a, b) => a.trustScore - b.trustScore);
    else if (sortBy === 'xgb') tc = [...tc].sort((a, b) => b.xgbProb - a.xgbProb);
    return tc;
  }, [testCases, selectedScenario, sortBy]);

  // Scenarios list
  const scenarios = useMemo(() => {
    const set = new Set(testCases.map((t) => t.scenario));
    return Array.from(set).sort();
  }, [testCases]);

  // Per-scenario accuracy
  const scenarioStats = useMemo(() => {
    const map: Record<string, { total: number; correct: number; avgTrust: number }> = {};
    testCases.forEach((t) => {
      if (!map[t.scenario]) map[t.scenario] = { total: 0, correct: 0, avgTrust: 0 };
      map[t.scenario].total++;
      if (t.correct) map[t.scenario].correct++;
      map[t.scenario].avgTrust += t.trustScore;
    });
    return Object.entries(map)
      .map(([scenario, v]) => ({
        scenario,
        total: v.total,
        correct: v.correct,
        incorrect: v.total - v.correct,
        accuracy: v.total > 0 ? (v.correct / v.total * 100) : 0,
        avgTrust: v.total > 0 ? v.avgTrust / v.total : 0,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);
  }, [testCases]);

  // Overall stats
  const overall = useMemo(() => {
    const total = testCases.length;
    const correct = testCases.filter((t) => t.correct).length;
    return {
      total,
      correct,
      incorrect: total - correct,
      accuracy: total > 0 ? (correct / total * 100) : 0,
    };
  }, [testCases]);

  // Pie data
  const pieData = useMemo(() => [
    { name: 'Correct', value: overall.correct },
    { name: 'Incorrect', value: overall.incorrect },
  ], [overall]);

  // Trust score scatter data
  const scatterData = useMemo(() => {
    return testCases.map((t) => ({
      ...t,
      x: t.ifScore,
      y: t.xgbScore,
    }));
  }, [testCases]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-r-transparent" />
          <p className="mt-4 text-slate-400">Loading test case results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-100">ML Pipeline Test Validation</h1>
          <p className="mt-1 text-sm text-slate-400">
            {overall.total} test cases from strong_test_cases.csv — Pipeline accuracy: {overall.accuracy.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-5 text-center">
            <p className="text-3xl font-bold text-blue-400">{overall.total}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Total Tests</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-5 text-center">
            <p className="text-3xl font-bold text-green-400">{overall.correct}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Correct</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-5 text-center">
            <p className="text-3xl font-bold text-red-400">{overall.incorrect}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Incorrect</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-5 text-center">
            <p className={`text-3xl font-bold ${overall.accuracy >= 70 ? 'text-green-400' : overall.accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {overall.accuracy.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Accuracy</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Overall Pie */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Overall Results</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}>
                  <Cell fill={RESULT_COLORS.correct} />
                  <Cell fill={RESULT_COLORS.incorrect} />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Per-Scenario Accuracy */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Accuracy by Scenario</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={scenarioStats} layout="vertical" margin={{ left: 180 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="scenario" type="category" width={170} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, 'Accuracy']} />
                <Bar dataKey="accuracy" radius={[0, 6, 6, 0]}>
                  {scenarioStats.map((s) => (
                    <Cell key={s.scenario} fill={SCENARIO_COLORS[s.scenario] || '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-scenario breakdown cards */}
        <div>
          <h2 className="text-lg font-semibold text-slate-100 border-b border-blue-500/30 pb-2 mb-4">
            Scenario Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarioStats.map((s) => (
              <div key={s.scenario}
                className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 cursor-pointer hover:border-blue-500/50 transition-colors"
                onClick={() => setSelectedScenario(selectedScenario === s.scenario ? 'All' : s.scenario)}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: SCENARIO_COLORS[s.scenario] || '#64748b' }} />
                  <h4 className="text-sm font-medium text-slate-200 truncate">{s.scenario}</h4>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-slate-100">{s.total}</p>
                    <p className="text-[10px] text-slate-500">Tests</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${s.accuracy >= 70 ? 'text-green-400' : s.accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {s.accuracy.toFixed(0)}%
                    </p>
                    <p className="text-[10px] text-slate-500">Accuracy</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-400">{s.avgTrust.toFixed(1)}</p>
                    <p className="text-[10px] text-slate-500">Avg Trust</p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${s.accuracy}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* IF vs XGB Scatter */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Isolation Forest vs XGBoost Score</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="x" type="number" domain={[0, 100]} name="IF Score"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                label={{ value: 'IF Score', position: 'insideBottomRight', offset: -5, fill: '#64748b' }} />
              <YAxis dataKey="y" type="number" domain={[0, 100]} name="XGB Score"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                label={{ value: 'XGB Score', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
              <Tooltip contentStyle={tooltipStyle}
                content={({ active, payload }) => {
                  if (active && payload?.[0]) {
                    const d = payload[0].payload;
                    return (
                      <div className="rounded border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100">
                        <p className="font-semibold">{d.testCaseId}</p>
                        <p>Scenario: {d.scenario}</p>
                        <p>Expected: {d.expected} | Got: {d.pipelinePrediction}</p>
                        <p>Trust: {d.trustScore} | IF: {d.ifScore} | XGB: {d.xgbScore}</p>
                        <p className={d.correct ? 'text-green-400' : 'text-red-400'}>
                          {d.correct ? 'CORRECT' : 'INCORRECT'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }} />
              <Scatter name="Correct" data={scatterData.filter((d) => d.correct)} fill="#22c55e" />
              <Scatter name="Incorrect" data={scatterData.filter((d) => !d.correct)} fill="#ef4444" />
              <Legend />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Test Case Table */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">
              Test Cases {selectedScenario !== 'All' && `— ${selectedScenario}`}
            </h3>
            <div className="flex gap-2">
              <select value={selectedScenario} onChange={(e) => setSelectedScenario(e.target.value)}
                className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200">
                <option value="All">All Scenarios</option>
                {scenarios.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'id' | 'trust' | 'xgb')}
                className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200">
                <option value="id">Sort: ID</option>
                <option value="trust">Sort: Trust Score</option>
                <option value="xgb">Sort: XGB Probability</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-3">ID</th>
                  <th className="pb-3 pr-3">Scenario</th>
                  <th className="pb-3 pr-3">Expected</th>
                  <th className="pb-3 pr-3">Prediction</th>
                  <th className="pb-3 pr-3 text-center">Result</th>
                  <th className="pb-3 pr-3 text-right">Trust</th>
                  <th className="pb-3 pr-3 text-right">IF Score</th>
                  <th className="pb-3 pr-3 text-right">XGB Score</th>
                  <th className="pb-3 text-right">XGB P(mal)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.testCaseId}
                    className={`border-b border-slate-800/50 hover:bg-slate-800/30 ${!t.correct ? 'bg-red-500/5' : ''}`}>
                    <td className="py-2 pr-3 font-mono text-slate-300 text-xs">{t.testCaseId}</td>
                    <td className="py-2 pr-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: SCENARIO_COLORS[t.scenario] || '#64748b' }} />
                        <span className="text-slate-300 truncate max-w-[160px]">{t.scenario}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-400">{t.expected}</td>
                    <td className="py-2 pr-3 text-xs">
                      <span className={t.pipelinePrediction === 'Malicious' ? 'text-red-400' : 'text-green-400'}>
                        {t.pipelinePrediction}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        t.correct ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {t.correct ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right font-mono text-xs">
                      <span className={t.trustScore < 50 ? 'text-red-400' : t.trustScore < 80 ? 'text-yellow-400' : 'text-green-400'}>
                        {t.trustScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right font-mono text-xs text-slate-400">{t.ifScore.toFixed(1)}</td>
                    <td className="py-2 pr-3 text-right font-mono text-xs text-slate-400">{t.xgbScore.toFixed(1)}</td>
                    <td className="py-2 text-right font-mono text-xs">
                      <span className={t.xgbProb >= 0.5 ? 'text-red-400' : 'text-slate-400'}>
                        {(t.xgbProb * 100).toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
