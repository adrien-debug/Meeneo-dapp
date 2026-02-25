'use client'

import SimSelect from '@/components/simulation/SimSelect'
import { exportAsCSV, exportAsJSON, formatUSD } from '@/lib/sim-utils'
import type { RunData, RunSummary } from '@/types/simulation'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ResultsBtcManagement,
  ResultsCommercial,
  ResultsDecisionBanners,
  ResultsHoldingBucket,
  ResultsMetricsTable,
  ResultsMiningBucket,
  ResultsOverview,
  ResultsWaterfall,
  ResultsYieldBucket,
} from './results'

const API = '/api/simulation'
async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.detail || res.statusText)
  }
  return res.json()
}

type ViewTab = 'overview' | 'yield' | 'holding' | 'mining' | 'btc_mgmt' | 'commercial' | 'waterfall'

interface StepResultsProps {
  runId: string
  onReset: () => void
}

export default function StepResults({ runId, onReset }: StepResultsProps) {
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [selectedRunId, setSelectedRunId] = useState(runId || '')
  const [runData, setRunData] = useState<RunData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [viewTab, setViewTab] = useState<ViewTab>('overview')
  const [waterfallScenario, setWaterfallScenario] = useState<string>('base')

  useEffect(() => {
    loadRuns()
  }, [])

  useEffect(() => {
    if (selectedRunId) loadRunData(selectedRunId)
  }, [selectedRunId]) // loadRunData is intentionally excluded

  useEffect(() => {
    if (runId && runId !== selectedRunId) {
      setSelectedRunId(runId)
      loadRunData(runId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  const loadRuns = async () => {
    try {
      const data: any = await api('/product/results')
      setRuns(data)
      if (!selectedRunId && data.length > 0) {
        setSelectedRunId(data[0].id)
      }
    } catch {
      /* API not available */
    }
  }

  const loadRunData = async (id: string) => {
    setLoading(true)
    setError('')
    try {
      const data: any = await api(`/product/results/${id}`)
      setRunData(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
    setLoading(false)
  }

  const scenarios = useMemo(
    () => (runData?.scenario_results ? Object.keys(runData.scenario_results) : []),
    [runData],
  )
  const hasData = runData && scenarios.length > 0

  const portfolioChartData = React.useMemo(() => {
    if (!hasData) return []
    const baseScenario = runData.scenario_results['base'] || runData.scenario_results[scenarios[0]]
    const months = baseScenario?.aggregated?.monthly_portfolio?.length || 0

    return Array.from({ length: months }, (_, t) => {
      const row: any = { month: t }
      for (const s of scenarios) {
        const portfolio = runData.scenario_results[s]?.aggregated?.monthly_portfolio
        row[`${s}_total`] = portfolio?.[t]?.total_portfolio_usd || 0
        row[`${s}_yield`] = portfolio?.[t]?.yield_value_usd || 0
        row[`${s}_holding`] = portfolio?.[t]?.holding_value_usd || 0
        row[`${s}_mining`] = portfolio?.[t]?.mining_value_usd || 0
      }
      return row
    })
  }, [runData, hasData, scenarios])

  const activeScenario = scenarios.includes(waterfallScenario)
    ? waterfallScenario
    : (scenarios[0] ?? 'base')

  const VIEW_TABS: { key: ViewTab; label: string }[] = [
    { key: 'overview', label: 'Portfolio Overview' },
    { key: 'yield', label: 'Yield Liquidity' },
    { key: 'holding', label: 'BTC Holding' },
    { key: 'mining', label: 'BTC Mining' },
    { key: 'btc_mgmt', label: 'BTC Under Management' },
    { key: 'commercial', label: 'Commercial' },
    { key: 'waterfall', label: 'Waterfall Detail' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#0E0F0F]">Step 5 — Results</h2>
          <p className="text-xs text-[#9EB3A8]">Multi-scenario product performance comparison</p>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F2F2F2] text-[#9EB3A8] hover:bg-[#E6F1E7] transition-all"
        >
          New Simulation
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
          {error}
        </div>
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
              onClick={() =>
                exportAsJSON(runData, `product-results-${selectedRunId.slice(0, 8)}.json`)
              }
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
                }))
                exportAsCSV(rows, `portfolio-comparison-${selectedRunId.slice(0, 8)}.csv`)
              }}
            >
              Export CSV
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64 text-sm text-[#9EB3A8]">
          Loading results...
        </div>
      )}

      {!loading && !hasData && (
        <div className="flex flex-col items-center justify-center h-64 text-sm text-[#9EB3A8] gap-3">
          <svg
            className="w-10 h-10 text-[#9EB3A8]/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
          No results yet. Run a simulation from the Product Config page.
        </div>
      )}

      {hasData && (
        <div className="space-y-6">
          {/* Decision Banners */}
          <ResultsDecisionBanners
            scenarios={scenarios}
            scenarioResults={runData.scenario_results}
          />

          {/* Key Metrics Comparison */}
          <ResultsMetricsTable scenarios={scenarios} scenarioResults={runData.scenario_results} />

          {/* View Tabs */}
          <div className="flex gap-1 flex-wrap">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
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

          {viewTab === 'overview' && (
            <ResultsOverview scenarios={scenarios} portfolioChartData={portfolioChartData} />
          )}

          {viewTab === 'yield' && (
            <ResultsYieldBucket scenarios={scenarios} scenarioResults={runData.scenario_results} />
          )}

          {viewTab === 'holding' && (
            <ResultsHoldingBucket
              scenarios={scenarios}
              scenarioResults={runData.scenario_results}
            />
          )}

          {viewTab === 'mining' && (
            <ResultsMiningBucket scenarios={scenarios} scenarioResults={runData.scenario_results} />
          )}

          {viewTab === 'btc_mgmt' && (
            <ResultsBtcManagement
              scenarios={scenarios}
              scenarioResults={runData.scenario_results}
              activeScenario={activeScenario}
              selectedRunId={selectedRunId}
              onScenarioChange={setWaterfallScenario}
            />
          )}

          {viewTab === 'commercial' && (
            <ResultsCommercial scenarios={scenarios} scenarioResults={runData.scenario_results} />
          )}

          {viewTab === 'waterfall' && (
            <ResultsWaterfall
              scenarios={scenarios}
              scenarioResults={runData.scenario_results}
              activeScenario={activeScenario}
              selectedRunId={selectedRunId}
              onScenarioChange={setWaterfallScenario}
            />
          )}
        </div>
      )}
    </div>
  )
}
