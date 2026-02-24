'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area, BarChart, Bar, ComposedChart,
} from 'recharts';
import SimSelect from '@/components/simulation/SimSelect';
import SimMetric from '@/components/simulation/SimMetric';
import { CARD } from '@/components/ui/constants';
import { formatUSD, formatPercent, formatNumber, formatBTC, exportAsJSON, exportAsCSV } from '@/lib/sim-utils';

const API = '/api/simulation';
async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || res.statusText); }
  return res.json();
}

const SCENARIO_COLORS = {
  bear: '#ef4444',
  base: '#94a3b8',
  bull: '#22c55e',
};

const SCENARIO_LABELS: Record<string, string> = {
  bear: 'Bear',
  base: 'Base',
  bull: 'Bull',
};

type ViewTab = 'overview' | 'yield' | 'holding' | 'mining' | 'btc_mgmt' | 'commercial' | 'waterfall';

const TOOLTIP_STYLE = { background: '#fff', border: '1px solid #9EB3A8', borderRadius: 8, fontSize: 11 };
const GRID_PROPS = { strokeDasharray: '3 3', stroke: '#9EB3A8', strokeOpacity: 0.15 };
const AXIS_TICK = { fontSize: 10, fill: '#9EB3A8' };

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const runIdParam = searchParams.get('run');

  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState(runIdParam || '');
  const [runData, setRunData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewTab, setViewTab] = useState<ViewTab>('overview');
  const [waterfallScenario, setWaterfallScenario] = useState<string>('base');

  useEffect(() => { loadRuns(); }, []);

  useEffect(() => {
    if (selectedRunId) loadRunData(selectedRunId);
  }, [selectedRunId]);

  const loadRuns = async () => {
    try {
      const data: any = await api('/product/results');
      setRuns(data);
      if (!selectedRunId && data.length > 0) {
        setSelectedRunId(data[0].id);
      }
    } catch (e) { /* API not available */ }
  };

  const loadRunData = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const data: any = await api(`/product/results/${id}`);
      setRunData(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const scenarios = runData?.scenario_results ? Object.keys(runData.scenario_results) : [];
  const hasData = runData && scenarios.length > 0;

  const portfolioChartData = React.useMemo(() => {
    if (!hasData) return [];
    const baseScenario = runData.scenario_results['base'] || runData.scenario_results[scenarios[0]];
    const months = baseScenario?.aggregated?.monthly_portfolio?.length || 0;

    return Array.from({ length: months }, (_, t) => {
      const row: any = { month: t };
      for (const s of scenarios) {
        const portfolio = runData.scenario_results[s]?.aggregated?.monthly_portfolio;
        row[`${s}_total`] = portfolio?.[t]?.total_portfolio_usd || 0;
        row[`${s}_yield`] = portfolio?.[t]?.yield_value_usd || 0;
        row[`${s}_holding`] = portfolio?.[t]?.holding_value_usd || 0;
        row[`${s}_mining`] = portfolio?.[t]?.mining_value_usd || 0;
      }
      return row;
    });
  }, [runData, hasData, scenarios]);

  const decisionColor = (d: string) => {
    if (d === 'APPROVED') return 'green';
    if (d === 'ADJUST') return 'yellow';
    return 'red';
  };

  const VIEW_TABS: { key: ViewTab; label: string }[] = [
    { key: 'overview', label: 'Portfolio Overview' },
    { key: 'yield', label: 'Yield Liquidity' },
    { key: 'holding', label: 'BTC Holding' },
    { key: 'mining', label: 'BTC Mining' },
    { key: 'btc_mgmt', label: 'BTC Under Management' },
    { key: 'commercial', label: 'Commercial' },
    { key: 'waterfall', label: 'Waterfall Detail' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#0E0F0F]">Results</h1>
      <p className="text-sm text-[#9EB3A8] -mt-4">Multi-scenario product performance comparison</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">{error}</div>
      )}

      {/* Run Selector */}
      <div className="mb-6 flex items-center gap-4">
        <div className="w-80">
          <SimSelect
            label="Select Run"
            value={selectedRunId}
            onChange={setSelectedRunId}
            options={runs.map((r: any) => ({
              value: r.id,
              label: `${r.id.slice(0, 8)}... — ${r.capital_raised_usd ? formatUSD(r.capital_raised_usd) : ''} — ${new Date(r.created_at).toLocaleDateString()}`,
            }))}
          />
        </div>
        {hasData && (
          <div className="flex gap-2 mt-5">
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F2F2F2] text-[#9EB3A8] hover:bg-[#E6F1E7] transition-colors"
              onClick={() => exportAsJSON(runData, `product-results-${selectedRunId.slice(0, 8)}.json`)}
            >
              Export JSON
            </button>
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F2F2F2] text-[#9EB3A8] hover:bg-[#E6F1E7] transition-colors"
              onClick={() => {
                const rows = portfolioChartData.map((r: any) => ({
                  month: r.month,
                  bear_total: r.bear_total,
                  base_total: r.base_total,
                  bull_total: r.bull_total,
                }));
                exportAsCSV(rows, `portfolio-comparison-${selectedRunId.slice(0, 8)}.csv`);
              }}
            >
              Export CSV
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64 text-sm text-[#9EB3A8]">Loading results...</div>
      )}

      {!loading && !hasData && (
        <div className="flex items-center justify-center h-64 text-sm text-[#9EB3A8]">
          No results yet. Run a simulation from the Product Config page.
        </div>
      )}

      {hasData && (
        <div className="space-y-6">
          {/* ═══════════ Decision Banners ═══════════ */}
          <div className="grid grid-cols-3 gap-4">
            {scenarios.map(s => {
              const agg = runData.scenario_results[s]?.aggregated;
              const decision = agg?.decision || 'PENDING';
              const reasons = agg?.decision_reasons || [];
              const color = decisionColor(decision);
              return (
                <div key={s} className={`rounded-xl border px-4 py-3 ${
                  color === 'green' ? 'border-green-400/40 bg-green-50' :
                  color === 'yellow' ? 'border-[#E8A838]/40 bg-amber-50' :
                  'border-red-400/40 bg-red-50'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase" style={{ color: SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS] }}>
                      {SCENARIO_LABELS[s] || s}
                    </span>
                    <span className={`text-xs font-bold ${
                      decision === 'APPROVED' ? 'text-green-600' :
                      decision === 'ADJUST' ? 'text-[#E8A838]' : 'text-red-600'
                    }`}>
                      {decision}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#9EB3A8]">
                    {reasons.map((r: string, i: number) => <div key={i}>{r}</div>)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ═══════════ Key Metrics Comparison ═══════════ */}
          {(() => {
            const hasCommercial = scenarios.some(s => runData.scenario_results[s]?.commercial?.total_commercial_value_usd > 0);

            return (
              <div className={`${CARD} overflow-hidden`}>
                <table className="w-full text-xs">
                  <thead className="bg-[#F2F2F2]">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">Metric</th>
                      {scenarios.map(s => (
                        <th key={s} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS] }}>
                          {SCENARIO_LABELS[s] || s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#9EB3A8]/10">
                    <tr>
                      <td className="px-3 py-2 font-medium text-[#9EB3A8]">Final Portfolio Value {hasCommercial && <span className="text-[10px] text-[#E8A838]">(Net)</span>}</td>
                      {scenarios.map(s => (
                        <td key={s} className="px-3 py-2 font-mono text-[#0E0F0F]">{formatUSD(runData.scenario_results[s]?.aggregated?.metrics?.final_portfolio_usd || 0)}</td>
                      ))}
                    </tr>
                    {hasCommercial && (
                      <tr className="bg-[#F2F2F2]/50">
                        <td className="px-3 py-2 font-medium text-[#9EB3A8]">Final Portfolio Value <span className="text-[10px]">(Gross)</span></td>
                        {scenarios.map(s => (
                          <td key={s} className="px-3 py-2 font-mono text-[#9EB3A8]">{formatUSD(runData.scenario_results[s]?.aggregated?.metrics?.gross_final_portfolio_usd || 0)}</td>
                        ))}
                      </tr>
                    )}
                    <tr>
                      <td className="px-3 py-2 font-medium text-[#9EB3A8]">Total Return {hasCommercial && <span className="text-[10px] text-[#E8A838]">(Net)</span>}</td>
                      {scenarios.map(s => {
                        const pct = runData.scenario_results[s]?.aggregated?.metrics?.total_return_pct || 0;
                        return <td key={s} className={`px-3 py-2 font-mono ${pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatPercent(pct)}</td>;
                      })}
                    </tr>
                    {hasCommercial && (
                      <tr className="bg-[#F2F2F2]/50">
                        <td className="px-3 py-2 font-medium text-[#9EB3A8]">Total Return <span className="text-[10px]">(Gross)</span></td>
                        {scenarios.map(s => {
                          const pct = runData.scenario_results[s]?.aggregated?.metrics?.gross_total_return_pct || 0;
                          return <td key={s} className="px-3 py-2 font-mono text-[#9EB3A8]">{formatPercent(pct)}</td>;
                        })}
                      </tr>
                    )}
                    <tr>
                      <td className="px-3 py-2 font-medium text-[#9EB3A8]">Capital Preservation</td>
                      {scenarios.map(s => {
                        const ratio = runData.scenario_results[s]?.aggregated?.metrics?.capital_preservation_ratio || 0;
                        return <td key={s} className={`px-3 py-2 font-mono ${ratio >= 1 ? 'text-green-600' : 'text-red-600'}`}>{formatNumber(ratio, 2)}x</td>;
                      })}
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium text-[#9EB3A8]">Effective APR</td>
                      {scenarios.map(s => (
                        <td key={s} className="px-3 py-2 font-mono text-[#0E0F0F]">{formatPercent(runData.scenario_results[s]?.aggregated?.metrics?.effective_apr || 0)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium text-[#9EB3A8]">Total Yield Paid</td>
                      {scenarios.map(s => (
                        <td key={s} className="px-3 py-2 font-mono text-[#0E0F0F]">{formatUSD(runData.scenario_results[s]?.aggregated?.metrics?.total_yield_paid_usd || 0)}</td>
                      ))}
                    </tr>
                    {hasCommercial && (
                      <tr className="bg-amber-50">
                        <td className="px-3 py-2 font-medium text-[#E8A838]">Commercial Fees (Total)</td>
                        {scenarios.map(s => (
                          <td key={s} className="px-3 py-2 font-mono text-[#E8A838]">{formatUSD(runData.scenario_results[s]?.commercial?.total_commercial_value_usd || 0)}</td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* ═══════════ View Tabs ═══════════ */}
          <div className="flex gap-1 flex-wrap">
            {VIEW_TABS.map(tab => (
              <button
                key={tab.key}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                  viewTab === tab.key
                    ? 'bg-[#96EA7A] text-[#0E0F0F]'
                    : 'bg-white text-[#9EB3A8] hover:bg-[#E6F1E7]'
                }`}
                onClick={() => setViewTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══════════ OVERVIEW TAB ═══════════ */}
          {viewTab === 'overview' && (
            <div className="space-y-4">
              <div className={`${CARD} p-4`}>
                <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">Portfolio Value Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={portfolioChartData}>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis dataKey="month" tick={AXIS_TICK} />
                    <YAxis tick={AXIS_TICK} tickFormatter={v => `$${(v / 1_000_000).toFixed(1)}M`} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v?: number) => formatUSD(v ?? 0)}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {scenarios.map(s => (
                      <Line
                        key={s}
                        type="monotone"
                        dataKey={`${s}_total`}
                        stroke={SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS]}
                        strokeWidth={s === 'base' ? 2 : 1.5}
                        strokeDasharray={s === 'base' ? undefined : '5 3'}
                        dot={false}
                        name={`${SCENARIO_LABELS[s]} Total`}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className={`${CARD} p-4`}>
                <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">Bucket Breakdown (Base Scenario)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={portfolioChartData}>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis dataKey="month" tick={AXIS_TICK} />
                    <YAxis tick={AXIS_TICK} tickFormatter={v => `$${(v / 1_000_000).toFixed(1)}M`} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v?: number) => formatUSD(v ?? 0)}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="base_yield" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Yield Liquidity" />
                    <Area type="monotone" dataKey="base_holding" stackId="1" stroke="#4ade80" fill="#4ade80" fillOpacity={0.3} name="BTC Holding" />
                    <Area type="monotone" dataKey="base_mining" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="BTC Mining" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ═══════════ YIELD BUCKET TAB ═══════════ */}
          {viewTab === 'yield' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {scenarios.map(s => {
                  const yb = runData.scenario_results[s]?.yield_bucket?.metrics;
                  return (
                    <div key={s} className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase" style={{ color: SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS] }}>
                        {SCENARIO_LABELS[s]}
                      </h4>
                      <SimMetric label="Final Value" value={formatUSD(yb?.final_value_usd || 0)} status="green" />
                      <SimMetric label="Total Yield" value={formatUSD(yb?.total_yield_usd || 0)} />
                      <SimMetric label="Effective APR" value={formatPercent(yb?.effective_apr || 0)} />
                    </div>
                  );
                })}
              </div>

              <div className={`${CARD} p-4`}>
                <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">Cumulative Yield (All Scenarios)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={(() => {
                    const baseYield = runData.scenario_results[scenarios[0]]?.yield_bucket?.monthly_data || [];
                    return baseYield.map((_: any, t: number) => {
                      const row: any = { month: t };
                      for (const s of scenarios) {
                        row[s] = runData.scenario_results[s]?.yield_bucket?.monthly_data?.[t]?.cumulative_yield_usd || 0;
                      }
                      return row;
                    });
                  })()}>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis dataKey="month" tick={AXIS_TICK} />
                    <YAxis tick={AXIS_TICK} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v?: number) => formatUSD(v ?? 0)} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {scenarios.map(s => (
                      <Line key={s} type="monotone" dataKey={s} stroke={SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS]} strokeWidth={1.5} dot={false} name={SCENARIO_LABELS[s]} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ═══════════ BTC HOLDING TAB ═══════════ */}
          {viewTab === 'holding' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {scenarios.map(s => {
                  const hb = runData.scenario_results[s]?.btc_holding_bucket?.metrics;
                  return (
                    <div key={s} className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase" style={{ color: SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS] }}>
                        {SCENARIO_LABELS[s]}
                      </h4>
                      <SimMetric label="Final Value" value={formatUSD(hb?.final_value_usd || 0)} status={hb?.total_return_pct >= 0 ? 'green' : 'red'} />
                      <SimMetric label="Total Return" value={formatPercent(hb?.total_return_pct || 0)} status={hb?.total_return_pct >= 0 ? 'green' : 'red'} />
                      <SimMetric
                        label="Target Hit"
                        value={hb?.target_hit ? `Yes (Month ${hb.sell_month})` : 'No'}
                        status={hb?.target_hit ? 'green' : 'neutral'}
                      />
                      <SimMetric label="BTC Qty" value={formatNumber(hb?.btc_quantity || 0, 4)} />
                    </div>
                  );
                })}
              </div>

              <div className={`${CARD} p-4`}>
                <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">BTC Holding Value Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={(() => {
                    const baseHolding = runData.scenario_results[scenarios[0]]?.btc_holding_bucket?.monthly_data || [];
                    return baseHolding.map((_: any, t: number) => {
                      const row: any = { month: t };
                      for (const s of scenarios) {
                        row[s] = runData.scenario_results[s]?.btc_holding_bucket?.monthly_data?.[t]?.bucket_value_usd || 0;
                      }
                      return row;
                    });
                  })()}>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis dataKey="month" tick={AXIS_TICK} />
                    <YAxis tick={AXIS_TICK} tickFormatter={v => `$${(v / 1_000_000).toFixed(1)}M`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v?: number) => formatUSD(v ?? 0)} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {scenarios.map(s => (
                      <Line key={s} type="monotone" dataKey={s} stroke={SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS]} strokeWidth={1.5} dot={false} name={SCENARIO_LABELS[s]} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ═══════════ BTC MINING TAB ═══════════ */}
          {viewTab === 'mining' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {scenarios.map(s => {
                  const mb = runData.scenario_results[s]?.mining_bucket?.metrics;
                  const holdingHit = runData.scenario_results[s]?.btc_holding_bucket?.metrics?.target_hit;
                  return (
                    <div key={s} className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase" style={{ color: SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS] }}>
                        {SCENARIO_LABELS[s]}
                      </h4>
                      <SimMetric label="Health Score" value={`${mb?.final_health_score || 0}/100`} status={mb?.final_health_score >= 60 ? 'green' : mb?.final_health_score >= 40 ? 'yellow' : 'red'} />
                      <SimMetric label="Effective APR" value={formatPercent(mb?.effective_apr || 0)} />
                      <SimMetric label="OPEX Coverage" value={`${formatNumber(mb?.avg_opex_coverage_ratio || 0, 2)}x`} status={(mb?.avg_opex_coverage_ratio || 0) >= 1.5 ? 'green' : (mb?.avg_opex_coverage_ratio || 0) >= 1.0 ? 'yellow' : 'red'} />
                      <SimMetric label="Capitalization" value={formatUSD(mb?.capitalization_usd_final || 0)} status={(mb?.capitalization_usd_final || 0) > 0 ? 'green' : 'neutral'} />
                      <SimMetric label="Yield Cap Bump" value={holdingHit ? 'Active (12%)' : 'Base (8%)'} status={holdingHit ? 'green' : 'neutral'} />
                      <SimMetric label="Deficit Months" value={`${mb?.red_flag_months || 0}`} status={(mb?.red_flag_months || 0) === 0 ? 'green' : 'red'} />
                    </div>
                  );
                })}
              </div>

              <div className={`${CARD} p-4`}>
                <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">Mining Health Score Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={(() => {
                    const baseWaterfall = runData.scenario_results[scenarios[0]]?.mining_bucket?.monthly_waterfall || [];
                    return baseWaterfall.map((_: any, t: number) => {
                      const row: any = { month: t };
                      for (const s of scenarios) {
                        row[s] = runData.scenario_results[s]?.mining_bucket?.monthly_waterfall?.[t]?.health_score || 0;
                      }
                      return row;
                    });
                  })()}>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis dataKey="month" tick={AXIS_TICK} />
                    <YAxis domain={[0, 100]} tick={AXIS_TICK} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {scenarios.map(s => (
                      <Line key={s} type="monotone" dataKey={s} stroke={SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS]} strokeWidth={1.5} dot={false} name={SCENARIO_LABELS[s]} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className={`${CARD} p-4`}>
                <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">Monthly Mining Yield (USD)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={(() => {
                    const baseWaterfall = runData.scenario_results[scenarios[0]]?.mining_bucket?.monthly_waterfall || [];
                    return baseWaterfall.map((_: any, t: number) => {
                      const row: any = { month: t };
                      for (const s of scenarios) {
                        row[s] = runData.scenario_results[s]?.mining_bucket?.monthly_waterfall?.[t]?.yield_paid_usd || 0;
                      }
                      return row;
                    });
                  })()}>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis dataKey="month" tick={AXIS_TICK} />
                    <YAxis tick={AXIS_TICK} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v?: number) => formatUSD(v ?? 0)} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {scenarios.map(s => (
                      <Bar key={s} dataKey={s} fill={SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS]} opacity={0.7} name={SCENARIO_LABELS[s]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ═══════════ BTC UNDER MANAGEMENT TAB ═══════════ */}
          {viewTab === 'btc_mgmt' && (() => {
            const activeScenario = scenarios.includes(waterfallScenario) ? waterfallScenario : scenarios[0];
            const btcMgmt: any[] = runData.scenario_results[activeScenario]?.aggregated?.btc_under_management || [];
            const btcMgmtMetrics = runData.scenario_results[activeScenario]?.aggregated?.btc_under_management_metrics || {};
            const holdingMetrics = runData.scenario_results[activeScenario]?.btc_holding_bucket?.metrics || {};

            const strikeMonth = btcMgmtMetrics.holding_strike_month;

            const btcQtyChartData = btcMgmt.map((m: any) => ({
              month: m.month,
              'Holding BTC': m.holding_btc,
              'Mining Cap BTC': m.mining_cap_btc,
              'Total BTC': m.total_btc,
              'Strike Event': m.holding_strike_this_month ? m.total_btc : null,
            }));

            const btcValueChartData = btcMgmt.map((m: any) => ({
              month: m.month,
              'Holding Value': m.holding_value_usd,
              'Mining Cap Value': m.mining_cap_value_usd,
              'Total Value': m.total_value_usd,
              'BTC Price': m.btc_price_usd,
            }));

            const appreciationChartData = btcMgmt.map((m: any) => ({
              month: m.month,
              'Appreciation ($)': m.holding_appreciation_usd,
              'Appreciation (%)': m.holding_appreciation_pct,
            }));

            return (
              <div className="space-y-5">
                {/* Scenario Picker */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex gap-1">
                    {scenarios.map(s => (
                      <button
                        key={s}
                        onClick={() => setWaterfallScenario(s)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors uppercase ${
                          activeScenario === s
                            ? 'bg-[#96EA7A] text-[#0E0F0F]'
                            : 'bg-white text-[#9EB3A8] hover:bg-[#E6F1E7]'
                        }`}
                        style={activeScenario === s ? { borderBottom: `2px solid ${SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS]}` } : undefined}
                      >
                        {SCENARIO_LABELS[s] || s}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-[#9EB3A8]">
                    BTC held across all buckets appreciates in $ value as BTC price increases
                  </div>
                </div>

                {/* Explainer Box */}
                <div className={`${CARD} p-4`}>
                  <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-2 tracking-wider">How BTC Under Management Works</h3>
                  <div className="text-[11px] text-[#9EB3A8] space-y-1 leading-relaxed">
                    <p>This view tracks all BTC held across the product, showing how its $ value appreciates over time:</p>
                    <ol className="list-decimal list-inside space-y-0.5 pl-2">
                      <li><span className="text-cyan-600 font-medium">BTC Holding Bucket</span> — BTC purchased for capital reconstitution (held until target price is struck)</li>
                      <li><span className="text-[#E8A838] font-medium">Mining Capitalization</span> — Surplus BTC accumulated from mining after OPEX and yield</li>
                    </ol>
                    <p className="mt-2">
                      When the target price is <span className="text-green-600 font-medium">struck</span>, BTC from the Holding bucket is sold for capital reconstitution.
                      The remaining BTC (mining capitalization) continues to appreciate.
                    </p>
                  </div>
                </div>

                {/* Key Metrics Summary */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="border border-cyan-400/30 rounded-xl p-4 bg-cyan-50">
                    <div className="text-[10px] text-[#9EB3A8] uppercase mb-1 tracking-wider">Total BTC Under Management</div>
                    <div className="text-lg font-bold text-[#0E0F0F]">{formatBTC(btcMgmtMetrics.final_total_btc || 0)}</div>
                    <div className="text-xs text-[#9EB3A8]">{formatUSD(btcMgmtMetrics.final_total_value_usd || 0)}</div>
                  </div>
                  <div className="border border-cyan-400/30 rounded-xl p-4 bg-cyan-50">
                    <div className="text-[10px] text-[#9EB3A8] uppercase mb-1 tracking-wider">Peak BTC Value</div>
                    <div className="text-lg font-bold text-green-600">{formatUSD(btcMgmtMetrics.peak_btc_value_usd || 0)}</div>
                    <div className="text-xs text-[#9EB3A8]">{formatBTC(btcMgmtMetrics.peak_btc_qty || 0)} BTC</div>
                  </div>
                  <div className="border border-cyan-400/30 rounded-xl p-4 bg-cyan-50">
                    <div className="text-[10px] text-[#9EB3A8] uppercase mb-1 tracking-wider">Holding Target</div>
                    {btcMgmtMetrics.holding_target_struck ? (
                      <>
                        <div className="text-lg font-bold text-green-600">Struck</div>
                        <div className="text-xs text-[#9EB3A8]">Month {btcMgmtMetrics.holding_strike_month} @ {formatUSD(btcMgmtMetrics.holding_strike_price_usd || 0)}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-lg font-bold text-[#E8A838]">Pending</div>
                        <div className="text-xs text-[#9EB3A8]">Target: {formatUSD(holdingMetrics.target_sell_price_usd || 0)}</div>
                      </>
                    )}
                  </div>
                  <div className="border border-[#E8A838]/30 rounded-xl p-4 bg-amber-50">
                    <div className="text-[10px] text-[#9EB3A8] uppercase mb-1 tracking-wider">Mining BTC Accumulated</div>
                    <div className="text-lg font-bold text-[#E8A838]">{formatBTC(btcMgmtMetrics.mining_total_btc_accumulated || 0)}</div>
                    <div className="text-xs text-[#9EB3A8]">From capitalization</div>
                  </div>
                </div>

                {/* BTC Quantity Over Time */}
                <div className={`${CARD} p-4`}>
                  <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">BTC Quantity Under Management Over Time</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={btcQtyChartData}>
                      <CartesianGrid {...GRID_PROPS} />
                      <XAxis dataKey="month" tick={AXIS_TICK} />
                      <YAxis tick={AXIS_TICK} tickFormatter={v => v.toFixed(2)} label={{ value: 'BTC', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#9EB3A8' } }} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(v?: number, name?: string) => [formatBTC(v ?? 0), name ?? '']}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Area type="monotone" dataKey="Holding BTC" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} name="Holding Bucket" />
                      <Area type="monotone" dataKey="Mining Cap BTC" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Mining Capitalization" />
                      <Line type="monotone" dataKey="Total BTC" stroke="#0E0F0F" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Total BTC" />
                      {strikeMonth !== null && strikeMonth !== undefined && (
                        <Line type="monotone" dataKey="Strike Event" stroke="#22c55e" strokeWidth={0} dot={{ r: 8, fill: '#22c55e', stroke: '#ffffff', strokeWidth: 2 }} name="Price Strike" />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                  <p className="text-[10px] text-[#9EB3A8] mt-1">
                    Stacked areas show BTC held in each bucket. {strikeMonth !== null && strikeMonth !== undefined && <span className="text-green-600">Green dot marks when the holding target was struck and BTC sold.</span>}
                  </p>
                </div>

                {/* USD Value Over Time */}
                <div className={`${CARD} p-4`}>
                  <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">$ Value Appreciation Over Time</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={btcValueChartData}>
                      <CartesianGrid {...GRID_PROPS} />
                      <XAxis dataKey="month" tick={AXIS_TICK} />
                      <YAxis yAxisId="usd" tick={AXIS_TICK} tickFormatter={v => `$${(v / 1_000_000).toFixed(1)}M`} />
                      <YAxis yAxisId="price" orientation="right" tick={AXIS_TICK} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(v?: number, name?: string) => [(name ?? '').includes('Price') ? formatUSD(v ?? 0) : formatUSD(v ?? 0), name ?? '']}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Area yAxisId="usd" type="monotone" dataKey="Holding Value" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} name="Holding Value ($)" />
                      <Area yAxisId="usd" type="monotone" dataKey="Mining Cap Value" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Mining Cap Value ($)" />
                      <Line yAxisId="price" type="monotone" dataKey="BTC Price" stroke="#a855f7" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="BTC Price (right axis)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <p className="text-[10px] text-[#9EB3A8] mt-1">
                    As BTC price (purple line) increases, the $ value of BTC held appreciates. This creates yield-generating capability beyond the initial investment.
                  </p>
                </div>

                {/* Holding Bucket Appreciation */}
                {holdingMetrics.btc_quantity > 0 && (
                  <div className={`${CARD} p-4`}>
                    <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">Holding Bucket Appreciation (vs Purchase Price)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <ComposedChart data={appreciationChartData}>
                        <CartesianGrid {...GRID_PROPS} />
                        <XAxis dataKey="month" tick={AXIS_TICK} />
                        <YAxis yAxisId="usd" tick={AXIS_TICK} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                        <YAxis yAxisId="pct" orientation="right" tick={AXIS_TICK} tickFormatter={v => `${v.toFixed(0)}%`} />
                        <Tooltip
                          contentStyle={TOOLTIP_STYLE}
                          formatter={(v?: number, name?: string) => [(name ?? '').includes('%') ? `${(v ?? 0).toFixed(1)}%` : formatUSD(v ?? 0), name ?? '']}
                        />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar yAxisId="usd" dataKey="Appreciation ($)" fill="#22c55e" opacity={0.7} name="Unrealized Gain ($)" />
                        <Line yAxisId="pct" type="monotone" dataKey="Appreciation (%)" stroke="#22c55e" strokeWidth={2} dot={false} name="Gain (%)" />
                      </ComposedChart>
                    </ResponsiveContainer>
                    <p className="text-[10px] text-[#9EB3A8] mt-1">
                      Shows how much the holding bucket BTC has appreciated compared to the purchase price of {formatUSD(holdingMetrics.buying_price_usd || 0)}/BTC.
                    </p>
                  </div>
                )}

                {/* Monthly Detail Table */}
                <div className={`${CARD} overflow-hidden`}>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#F2F2F2] border-b border-[#9EB3A8]/10">
                    <span className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider">Monthly BTC Under Management — {SCENARIO_LABELS[activeScenario] || activeScenario}</span>
                    <div className="flex gap-3">
                      <button
                        className="text-[11px] text-[#9EB3A8] hover:text-[#96EA7A] transition-colors font-medium"
                        onClick={() => exportAsCSV(btcMgmt, `btc-under-management-${activeScenario}-${selectedRunId.slice(0, 8)}.csv`)}
                      >
                        CSV
                      </button>
                    </div>
                  </div>
                  <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 bg-[#F2F2F2]">
                        <tr>
                          <th className="sticky left-0 z-10 bg-[#F2F2F2] px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">Mo</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">BTC Price</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="BTC in holding bucket (for capital reconstitution)">Holding BTC</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="USD value of holding bucket BTC">Holding $</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="BTC accumulated from mining capitalization">Mining BTC</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="USD value of mining capitalization">Mining $</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="Total BTC under management">Total BTC</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="Total USD value">Total $</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="Holding bucket status">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#9EB3A8]/5">
                        {btcMgmt.map((m: any) => {
                          const isStrikeMonth = m.holding_strike_this_month;
                          const isSold = m.holding_sold;
                          const rowClass = isStrikeMonth ? 'bg-green-50' : '';
                          return (
                            <tr key={m.month} className={`${rowClass} hover:bg-[#F2F2F2]/50 transition-colors`}>
                              <td className={`sticky left-0 z-10 px-3 py-1.5 font-semibold ${isStrikeMonth ? 'bg-green-50' : 'bg-white'}`}>{m.month}</td>
                              <td className="px-3 py-1.5 font-mono text-[#0E0F0F]">{formatUSD(m.btc_price_usd)}</td>
                              <td className="px-3 py-1.5 font-mono text-cyan-600">{formatBTC(m.holding_btc)}</td>
                              <td className="px-3 py-1.5 font-mono text-[#0E0F0F]">{formatUSD(m.holding_value_usd)}</td>
                              <td className="px-3 py-1.5 font-mono text-[#E8A838]">{formatBTC(m.mining_cap_btc)}</td>
                              <td className="px-3 py-1.5 font-mono text-[#0E0F0F]">{formatUSD(m.mining_cap_value_usd)}</td>
                              <td className="px-3 py-1.5 font-mono text-[#0E0F0F] font-semibold">{formatBTC(m.total_btc)}</td>
                              <td className="px-3 py-1.5 font-mono font-semibold text-[#0E0F0F]">{formatUSD(m.total_value_usd)}</td>
                              <td className="px-3 py-1.5">
                                {isStrikeMonth ? (
                                  <span className="text-green-600 font-semibold">STRUCK</span>
                                ) : isSold ? (
                                  <span className="text-[#9EB3A8]">Sold</span>
                                ) : (
                                  <span className="text-cyan-600">Active</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2 bg-[#F2F2F2] border-t border-[#9EB3A8]/10 text-[10px] text-[#9EB3A8]">
                    <span className="text-cyan-600">Holding BTC</span> = BTC for capital reconstitution &nbsp;|&nbsp;
                    <span className="text-[#E8A838]">Mining BTC</span> = Capitalization from mining surplus &nbsp;|&nbsp;
                    <span className="text-green-600">STRUCK</span> = Target price hit, BTC sold
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ═══════════ COMMERCIAL TAB ═══════════ */}
          {viewTab === 'commercial' && (() => {
            const hasCommercial = scenarios.some(s => runData.scenario_results[s]?.commercial);

            if (!hasCommercial) {
              return (
                <div className="flex items-center justify-center h-64 text-sm text-[#9EB3A8]">
                  No commercial fees configured for this simulation run.
                </div>
              );
            }

            const mgmtFeesChartData = (() => {
              const baseCommercial = runData.scenario_results[scenarios[0]]?.commercial;
              if (!baseCommercial?.management_fees_monthly?.length) return [];

              return baseCommercial.management_fees_monthly.map((_: number, t: number) => {
                const row: any = { month: t };
                for (const s of scenarios) {
                  const fees = runData.scenario_results[s]?.commercial?.management_fees_monthly || [];
                  row[s] = fees[t] || 0;
                }
                return row;
              });
            })();

            return (
              <div className="space-y-6">
                {/* Commercial Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  {scenarios.map(s => {
                    const comm = runData.scenario_results[s]?.commercial;
                    const agg = runData.scenario_results[s]?.aggregated?.metrics;
                    return (
                      <div key={s} className="border border-[#E8A838]/20 rounded-xl p-4 bg-amber-50 space-y-4">
                        <h4 className="text-xs font-semibold uppercase" style={{ color: SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS] }}>
                          {SCENARIO_LABELS[s]}
                        </h4>

                        {comm ? (
                          <>
                            <div className="space-y-2">
                              <SimMetric
                                label="Upfront Fee"
                                value={formatUSD(comm.upfront_fee_usd || 0)}
                                status={comm.upfront_fee_usd > 0 ? 'neutral' : 'green'}
                              />
                              <SimMetric
                                label="Management Fees (Total)"
                                value={formatUSD(comm.management_fees_total_usd || 0)}
                                status={comm.management_fees_total_usd > 0 ? 'neutral' : 'green'}
                              />
                              <SimMetric
                                label="Performance Fee"
                                value={formatUSD(comm.performance_fee_usd || 0)}
                                status={comm.performance_fee_usd > 0 ? 'neutral' : 'green'}
                              />
                              <div className="pt-2 border-t border-[#E8A838]/20">
                                <SimMetric
                                  label="Total Commercial Value"
                                  value={formatUSD(comm.total_commercial_value_usd || 0)}
                                  status="neutral"
                                />
                              </div>
                            </div>

                            {agg && (
                              <div className="pt-2 border-t border-[#E8A838]/20 space-y-1">
                                <p className="text-[10px] text-[#9EB3A8] uppercase font-semibold tracking-wider">Impact on Investor Returns</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-[#9EB3A8]">Gross Return:</span>
                                    <span className={`ml-1 font-mono ${(agg.gross_total_return_pct || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatPercent(agg.gross_total_return_pct || 0)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[#9EB3A8]">Net Return:</span>
                                    <span className={`ml-1 font-mono ${(agg.total_return_pct || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatPercent(agg.total_return_pct || 0)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-[#9EB3A8]">No commercial fees</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Upfront Fee Breakdown */}
                {(() => {
                  const baseComm = runData.scenario_results[scenarios[0]]?.commercial;
                  if (!baseComm || baseComm.upfront_fee_usd <= 0) return null;

                  return (
                    <div className={`${CARD} p-4`}>
                      <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">Upfront Fee Allocation (Deducted from Buckets)</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[#96EA7A] font-medium">Yield Bucket</span>
                          <span className="font-mono text-[#0E0F0F]">{formatUSD(baseComm.upfront_fee_breakdown?.yield_deduction_usd || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-cyan-600 font-medium">Holding Bucket</span>
                          <span className="font-mono text-[#0E0F0F]">{formatUSD(baseComm.upfront_fee_breakdown?.holding_deduction_usd || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lime-600 font-medium">Mining Bucket</span>
                          <span className="font-mono text-[#0E0F0F]">{formatUSD(baseComm.upfront_fee_breakdown?.mining_deduction_usd || 0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Management Fees Over Time Chart */}
                {mgmtFeesChartData.length > 0 && (
                  <div className={`${CARD} p-4`}>
                    <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">Monthly Management Fees</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={mgmtFeesChartData}>
                        <CartesianGrid {...GRID_PROPS} />
                        <XAxis dataKey="month" tick={AXIS_TICK} />
                        <YAxis tick={AXIS_TICK} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={TOOLTIP_STYLE}
                          formatter={(v?: number) => formatUSD(v ?? 0)}
                        />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        {scenarios.map(s => (
                          <Bar key={s} dataKey={s} fill={SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS]} opacity={0.7} name={SCENARIO_LABELS[s]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Performance Fee Details */}
                {(() => {
                  const hasPerformanceFee = scenarios.some(s => (runData.scenario_results[s]?.commercial?.performance_fee_usd || 0) > 0);
                  if (!hasPerformanceFee) return null;

                  return (
                    <div className={`${CARD} p-4`}>
                      <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">Performance Fee Calculation</h3>
                      <p className="text-[10px] text-[#9EB3A8] mb-4">Performance fee is calculated on the capitalization overhead (value above initial mining investment)</p>
                      <div className="grid grid-cols-3 gap-4">
                        {scenarios.map(s => {
                          const comm = runData.scenario_results[s]?.commercial;
                          return (
                            <div key={s} className="space-y-1 text-xs">
                              <span className="font-semibold" style={{ color: SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS] }}>
                                {SCENARIO_LABELS[s]}
                              </span>
                              <div className="text-[#9EB3A8]">
                                Overhead (Base): <span className="font-mono text-[#0E0F0F]">{formatUSD(comm?.performance_fee_base_usd || 0)}</span>
                              </div>
                              <div className="text-[#9EB3A8]">
                                Performance Fee: <span className="font-mono text-[#E8A838]">{formatUSD(comm?.performance_fee_usd || 0)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Commercial Value Summary Table */}
                <div className={`${CARD} overflow-hidden`}>
                  <table className="w-full text-xs">
                    <thead className="bg-[#F2F2F2]">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">Fee Type</th>
                        {scenarios.map(s => (
                          <th key={s} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS] }}>
                            {SCENARIO_LABELS[s] || s}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#9EB3A8]/10">
                      <tr>
                        <td className="px-3 py-2 font-medium text-[#9EB3A8]">Upfront Commercial</td>
                        {scenarios.map(s => (
                          <td key={s} className="px-3 py-2 font-mono text-[#0E0F0F]">{formatUSD(runData.scenario_results[s]?.commercial?.upfront_fee_usd || 0)}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-medium text-[#9EB3A8]">Management Fees</td>
                        {scenarios.map(s => (
                          <td key={s} className="px-3 py-2 font-mono text-[#0E0F0F]">{formatUSD(runData.scenario_results[s]?.commercial?.management_fees_total_usd || 0)}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-medium text-[#9EB3A8]">Performance Fees</td>
                        {scenarios.map(s => (
                          <td key={s} className="px-3 py-2 font-mono text-[#0E0F0F]">{formatUSD(runData.scenario_results[s]?.commercial?.performance_fee_usd || 0)}</td>
                        ))}
                      </tr>
                      <tr className="bg-amber-50">
                        <td className="px-3 py-2 font-semibold text-[#E8A838]">Total Commercial Value</td>
                        {scenarios.map(s => (
                          <td key={s} className="px-3 py-2 font-mono font-semibold text-[#E8A838]">{formatUSD(runData.scenario_results[s]?.commercial?.total_commercial_value_usd || 0)}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ═══════════ WATERFALL DETAIL TAB ═══════════ */}
          {viewTab === 'waterfall' && (() => {
            const activeScenario = scenarios.includes(waterfallScenario) ? waterfallScenario : scenarios[0];
            const waterfall: any[] = runData.scenario_results[activeScenario]?.mining_bucket?.monthly_waterfall || [];
            const miningMetrics = runData.scenario_results[activeScenario]?.mining_bucket?.metrics || {};
            const decision = runData.scenario_results[activeScenario]?.aggregated?.decision || 'PENDING';
            const reasons = runData.scenario_results[activeScenario]?.aggregated?.decision_reasons || [];
            const holdingSellMonth = runData.scenario_results[activeScenario]?.btc_holding_bucket?.metrics?.sell_month;
            const totalMonths = waterfall.length;
            const redMonths = waterfall.filter((m: any) => m.flag === 'RED').length;
            const greenMonths = totalMonths - redMonths;

            const btcAllocationData = waterfall.map((m: any) => ({
              month: m.month,
              'OPEX': m.btc_sell_opex,
              'Yield': m.btc_for_yield || 0,
              'Capitalization': m.btc_to_capitalization || 0,
              'Total Produced': m.btc_produced,
            }));

            const capitalizationData = waterfall.map((m: any) => ({
              month: m.month,
              'Capitalization (USD)': m.capitalization_usd || 0,
              'Capitalization (BTC)': m.capitalization_btc || 0,
            }));

            const healthData = waterfall.map((m: any) => ({
              month: m.month,
              'Health Score': m.health_score,
              'OPEX Coverage': Math.min((m.opex_coverage_ratio || 0) * 100, 300),
              'Yield Fulfillment': Math.min((m.yield_fulfillment || 0) * 100, 200),
            }));

            return (
              <div className="space-y-5">
                {/* Scenario Picker + Summary */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex gap-1">
                    {scenarios.map(s => (
                      <button
                        key={s}
                        onClick={() => setWaterfallScenario(s)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors uppercase ${
                          activeScenario === s
                            ? 'bg-[#96EA7A] text-[#0E0F0F]'
                            : 'bg-white text-[#9EB3A8] hover:bg-[#E6F1E7]'
                        }`}
                        style={activeScenario === s ? { borderBottom: `2px solid ${SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS]}` } : undefined}
                      >
                        {SCENARIO_LABELS[s] || s}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs flex-wrap">
                    <span className={`font-bold ${decision === 'APPROVED' ? 'text-green-600' : decision === 'ADJUST' ? 'text-[#E8A838]' : 'text-red-600'}`}>
                      {decision}
                    </span>
                    <span className="text-[#9EB3A8]">|</span>
                    <span className="text-[#9EB3A8]">
                      <span className="text-red-600 font-semibold">{redMonths}</span> deficit / <span className="text-green-600 font-semibold">{greenMonths}</span> healthy out of {totalMonths} months
                    </span>
                    <span className="text-[#9EB3A8]">|</span>
                    <span className="text-[#9EB3A8]">{reasons.join('; ')}</span>
                    {holdingSellMonth != null && (
                      <>
                        <span className="text-[#9EB3A8]">|</span>
                        <span className="text-[#96EA7A] font-medium">Yield cap bumped to 12% at month {holdingSellMonth}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Waterfall Logic Explainer */}
                <div className={`${CARD} p-4`}>
                  <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-2 tracking-wider">How the Monthly Waterfall Works</h3>
                  <div className="text-[11px] text-[#9EB3A8] space-y-1 leading-relaxed">
                    <p>Each month, BTC is produced by the mining fleet and allocated in strict priority order:</p>
                    <ol className="list-decimal list-inside space-y-0.5 pl-2">
                      <li><span className="text-orange-600 font-medium">OPEX</span> — Sell BTC to cover electricity, hosting, and maintenance costs</li>
                      <li><span className="text-green-600 font-medium">Yield</span> — Distribute surplus as yield, capped at <span className="text-[#0E0F0F] font-semibold">8% APR</span> (base) or <span className="text-[#0E0F0F] font-semibold">12% APR</span> (once BTC holding target is hit)</li>
                      <li><span className="text-cyan-600 font-medium">Capitalization</span> — Remaining BTC builds the capitalization / upside bucket</li>
                    </ol>
                    <p className="mt-2">
                      A month is <span className="text-red-600 font-medium">DEFICIT (RED)</span> if BTC produced {'<'} 95% of OPEX requirements.
                      If {'>'} 20% of months are deficit, the product is <span className="text-red-600 font-medium">BLOCKED</span>.
                    </p>
                    <p>
                      <span className="text-[#96EA7A] font-medium">Capital reconstitution</span> is handled by the BTC Holding bucket when the target price is hit, not by mining.
                    </p>
                  </div>
                </div>

                {/* BTC Allocation Stacked Bar */}
                <div className={`${CARD} p-4`}>
                  <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">Monthly BTC Allocation Breakdown</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={btcAllocationData}>
                      <CartesianGrid {...GRID_PROPS} />
                      <XAxis dataKey="month" tick={AXIS_TICK} />
                      <YAxis tick={AXIS_TICK} tickFormatter={v => v.toFixed(4)} label={{ value: 'BTC', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#9EB3A8' } }} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(v?: number, name?: string) => [formatBTC(v ?? 0), name ?? '']}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="OPEX" stackId="alloc" fill="#f97316" opacity={0.8} name="OPEX" />
                      <Bar dataKey="Yield" stackId="alloc" fill="#22c55e" opacity={0.8} name="Yield Distributed" />
                      <Bar dataKey="Capitalization" stackId="alloc" fill="#06b6d4" opacity={0.8} name="Capitalization" />
                      <Line type="monotone" dataKey="Total Produced" stroke="#0E0F0F" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="BTC Produced" />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <p className="text-[10px] text-[#9EB3A8] mt-1">Dashed line = total BTC produced. Stacked bars = how it was allocated. When bars fall short of the line, the month is in deficit.</p>
                </div>

                {/* Capitalization Over Time */}
                <div className={`${CARD} p-4`}>
                  <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">Capitalization Bucket Value</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={capitalizationData}>
                      <CartesianGrid {...GRID_PROPS} />
                      <XAxis dataKey="month" tick={AXIS_TICK} />
                      <YAxis yAxisId="usd" tick={AXIS_TICK} tickFormatter={v => `$${(v / 1_000_000).toFixed(1)}M`} />
                      <YAxis yAxisId="btc" orientation="right" tick={AXIS_TICK} tickFormatter={v => `${v.toFixed(2)} BTC`} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(v?: number, name?: string) => [(name ?? '').includes('USD') ? formatUSD(v ?? 0) : formatBTC(v ?? 0), name ?? '']}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Area yAxisId="usd" type="monotone" dataKey="Capitalization (USD)" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} strokeWidth={2} />
                      <Line yAxisId="btc" type="monotone" dataKey="Capitalization (BTC)" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Health Score & OPEX Coverage */}
                <div className={`${CARD} p-4`}>
                  <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">Health Score, OPEX Coverage & Yield Fulfillment</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={healthData}>
                      <CartesianGrid {...GRID_PROPS} />
                      <XAxis dataKey="month" tick={AXIS_TICK} />
                      <YAxis domain={[0, 'auto']} tick={AXIS_TICK} tickFormatter={v => `${v}`} label={{ value: '% / Score', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#9EB3A8' } }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v?: number, name?: string) => [`${(v ?? 0).toFixed(1)}${name === 'Health Score' ? '/100' : '%'}`, name ?? '']} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="Health Score" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="OPEX Coverage" stroke="#f97316" strokeWidth={1.5} dot={false} name="OPEX Coverage (%)" />
                      <Line type="monotone" dataKey="Yield Fulfillment" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Yield Fulfillment (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Full Monthly Table */}
                <div className={`${CARD} overflow-hidden`}>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#F2F2F2] border-b border-[#9EB3A8]/10">
                    <span className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider">Month-by-Month Waterfall — {SCENARIO_LABELS[activeScenario] || activeScenario}</span>
                    <div className="flex gap-3">
                      <button
                        className="text-[11px] text-[#9EB3A8] hover:text-[#96EA7A] transition-colors font-medium"
                        onClick={() => exportAsCSV(waterfall, `waterfall-${activeScenario}-${selectedRunId.slice(0, 8)}.csv`)}
                      >
                        CSV
                      </button>
                      <button
                        className="text-[11px] text-[#9EB3A8] hover:text-[#96EA7A] transition-colors font-medium"
                        onClick={() => exportAsJSON(waterfall, `waterfall-${activeScenario}-${selectedRunId.slice(0, 8)}.json`)}
                      >
                        JSON
                      </button>
                    </div>
                  </div>
                  <div className="overflow-auto" style={{ maxHeight: '600px' }}>
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 bg-[#F2F2F2]">
                        <tr>
                          <th className="sticky left-0 z-10 bg-[#F2F2F2] px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">Mo</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">Flag</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">BTC Price</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="Total BTC produced by mining fleet">BTC Produced</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="BTC sold to cover OPEX">BTC→OPEX</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="BTC sold/distributed as yield">BTC→Yield</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="BTC sent to capitalization bucket">BTC→Cap</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="Total operating expenses in USD">OPEX (USD)</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="Yield distributed to investors this month">Yield (USD)</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="Applied yield APR for this month">APR</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="Take-profit ladder sales from capitalization">TP Sold</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="Cumulative capitalization bucket in BTC">Cap BTC</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="Capitalization bucket mark-to-market value">Cap USD</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="OPEX coverage ratio">OPEX Cov.</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="Yield fulfillment ratio">Yield Fill</th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider" title="Portfolio health score (0-100)">Health</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#9EB3A8]/5">
                        {waterfall.map((m: any) => {
                          const isDeficit = m.flag === 'RED';
                          const isBonusApr = (m.yield_apr_applied || 0) > 0.09;
                          const rowClass = isDeficit ? 'bg-red-50' : '';
                          return (
                            <tr key={m.month} className={`${rowClass} hover:bg-[#F2F2F2]/50 transition-colors`}>
                              <td className={`sticky left-0 z-10 px-3 py-1.5 font-semibold text-[#0E0F0F] ${isDeficit ? 'bg-red-50' : 'bg-white'}`}>{m.month}</td>
                              <td className="px-3 py-1.5">
                                <span className={`inline-block w-2 h-2 rounded-full mr-1 ${isDeficit ? 'bg-red-500' : 'bg-green-500'}`} />
                                <span className={`font-semibold ${isDeficit ? 'text-red-600' : 'text-green-600'}`}>
                                  {m.flag}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 font-mono text-[#0E0F0F]">{formatUSD(m.btc_price_usd)}</td>
                              <td className="px-3 py-1.5 font-mono text-[#0E0F0F] font-semibold">{formatBTC(m.btc_produced)}</td>
                              <td className="px-3 py-1.5 font-mono text-orange-600">{formatBTC(m.btc_sell_opex)}</td>
                              <td className="px-3 py-1.5 font-mono text-green-600">{formatBTC(m.btc_for_yield || 0)}</td>
                              <td className="px-3 py-1.5 font-mono text-cyan-600">{formatBTC(m.btc_to_capitalization || 0)}</td>
                              <td className="px-3 py-1.5 font-mono text-[#0E0F0F]">{formatUSD(m.opex_usd)}</td>
                              <td className={`px-3 py-1.5 font-mono ${m.yield_paid_usd > 0 ? 'text-green-600' : 'text-[#9EB3A8]'}`}>{formatUSD(m.yield_paid_usd)}</td>
                              <td className={`px-3 py-1.5 font-mono ${isBonusApr ? 'text-[#96EA7A] font-semibold' : 'text-[#9EB3A8]'}`}>{formatPercent(m.yield_apr_applied || 0)}</td>
                              <td className="px-3 py-1.5 font-mono text-[#0E0F0F]">{formatUSD(m.take_profit_sold_usd)}</td>
                              <td className="px-3 py-1.5 font-mono text-cyan-600">{formatBTC(m.capitalization_btc || 0)}</td>
                              <td className="px-3 py-1.5 font-mono text-[#0E0F0F]">{formatUSD(m.capitalization_usd || 0)}</td>
                              <td className={`px-3 py-1.5 font-mono ${(m.opex_coverage_ratio || 0) >= 1.5 ? 'text-green-600' : (m.opex_coverage_ratio || 0) >= 1.0 ? 'text-[#E8A838]' : 'text-red-600'}`}>{formatNumber(m.opex_coverage_ratio || 0, 2)}x</td>
                              <td className={`px-3 py-1.5 font-mono ${(m.yield_fulfillment || 0) >= 1.0 ? 'text-green-600' : (m.yield_fulfillment || 0) >= 0.5 ? 'text-[#E8A838]' : 'text-red-600'}`}>{formatPercent(m.yield_fulfillment || 0)}</td>
                              <td className={`px-3 py-1.5 font-mono font-semibold ${m.health_score >= 60 ? 'text-green-600' : m.health_score >= 40 ? 'text-[#E8A838]' : 'text-red-600'}`}>{formatNumber(m.health_score, 1)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2 bg-[#F2F2F2] border-t border-[#9EB3A8]/10 text-[10px] text-[#9EB3A8]">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1 align-middle" /> RED = Deficit month (BTC produced {'<'} 95% of OPEX) &nbsp;
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 align-middle" /> GREEN = OPEX covered, yield + capitalization distributed &nbsp;|&nbsp;
                    Threshold: {'>'} 20% RED months → BLOCKED &nbsp;|&nbsp;
                    <span className="text-[#96EA7A] font-medium">Green APR</span> = bonus yield active (BTC holding target hit)
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
