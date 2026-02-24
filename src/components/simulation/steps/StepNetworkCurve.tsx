'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import SimInput from '@/components/simulation/SimInput'
import SimSelect from '@/components/simulation/SimSelect'
import SimToggle from '@/components/simulation/SimToggle'
import SimMetric from '@/components/simulation/SimMetric'
import SimTable from '@/components/simulation/SimTable'
import { CARD } from '@/components/ui/constants'
import { formatNumber } from '@/lib/sim-utils'

interface StepNetworkCurveProps {
  onComplete: (curveId: string) => void
  completedCurveId?: string
}

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

export default function StepNetworkCurve({ onComplete, completedCurveId }: StepNetworkCurveProps) {
  // ── Common state ──
  const [name, setName] = useState('')
  const nextNumber = useRef(1)

  // ── Saved simulations state ──
  const [savedCurves, setSavedCurves] = useState<any[]>([])
  const [selectedCurveId, setSelectedCurveId] = useState(completedCurveId || '')
  const [loadingCurve, setLoadingCurve] = useState(false)

  // Fetch existing curves list
  const fetchSavedCurves = useCallback(async () => {
    try {
      const curves = await api<any[]>('/network-curve/list')
      setSavedCurves(curves)
      return curves
    } catch {
      return []
    }
  }, [])

  // Fetch existing curves to determine next increment number
  useEffect(() => {
    fetchSavedCurves()
      .then((curves) => {
        let maxNum = 0
        curves.forEach((c: any) => {
          const match = c.name?.match(/^Network Curve #(\d+)$/)
          if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10))
        })
        const next = Math.max(maxNum + 1, curves.length + 1)
        nextNumber.current = next
        setName(`Network Curve #${next}`)
      })
      .catch(() => {
        setName('Network Curve #1')
      })
  }, [fetchSavedCurves])

  // Load a saved simulation by ID
  const loadSavedCurve = useCallback(
    async (id: string) => {
      if (!id) {
        setSelectedCurveId('')
        setResult(null)
        return
      }
      setSelectedCurveId(id)
      setLoadingCurve(true)
      setError('')
      try {
        const curve = await api<any>(`/network-curve/${id}`)
        setResult(curve)
        onComplete(id)
      } catch (e: any) {
        setError(`Failed to load curve: ${e.message}`)
      }
      setLoadingCurve(false)
    },
    [onComplete],
  )
  const [deleting, setDeleting] = useState(false)

  // Delete a saved curve by ID
  const deleteCurve = useCallback(
    async (id: string) => {
      if (!id) return
      const curveName = savedCurves.find((c) => c.id === id)?.name || id
      if (!window.confirm(`Delete "${curveName}"? This action cannot be undone.`)) return
      setDeleting(true)
      setError('')
      try {
        await api(`/network-curve/${id}`, { method: 'DELETE' })
        // Clear selection if the deleted curve was selected
        if (selectedCurveId === id) {
          setSelectedCurveId('')
          setResult(null)
        }
        // Refresh the list
        await fetchSavedCurves()
      } catch (e: any) {
        setError(`Failed to delete curve: ${e.message}`)
      }
      setDeleting(false)
    },
    [savedCurves, selectedCurveId, fetchSavedCurves],
  )

  const [scenario, setScenario] = useState('base')
  const [halvingEnabled, setHalvingEnabled] = useState(true)
  const [monthsToNextHalving, setMonthsToNextHalving] = useState(26)
  const [mode, setMode] = useState<'deterministic' | 'ml_forecast'>('deterministic')

  // ── Deterministic mode state ──
  const [startHashrateEH, setStartHashrateEH] = useState(800)
  const [monthlyGrowth, setMonthlyGrowth] = useState(0.02)
  const [feeRegime, setFeeRegime] = useState('base')
  const [startingFees, setStartingFees] = useState(0.5)
  const [confidenceBandPct, setConfidenceBandPct] = useState(20)

  // ── ML mode state ──
  const [modelType, setModelType] = useState('auto_arima')
  const [confidenceInterval, setConfidenceInterval] = useState(0.95)

  // ── Result state ──
  const [result, setResult] = useState<any>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  const runSimulation = async () => {
    if (!name.trim()) {
      setError('Please enter a curve name before running the simulation.')
      return
    }
    setRunning(true)
    setError('')
    try {
      const payload: any = {
        name: name.trim(),
        scenario,
        months: 120,
        halving_enabled: halvingEnabled,
        months_to_next_halving: monthsToNextHalving,
        mode,
      }

      if (mode === 'ml_forecast') {
        payload.model_type = modelType
        payload.confidence_interval = confidenceInterval
      } else {
        payload.starting_network_hashrate_eh = startHashrateEH
        payload.monthly_difficulty_growth_rate = monthlyGrowth
        payload.fee_regime = feeRegime
        payload.starting_fees_per_block_btc = startingFees
        payload.confidence_band_pct = confidenceBandPct
      }

      const res = await api<any>('/network-curve/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setResult(res)
      setSelectedCurveId(res.id || '')
      if (res.id) onComplete(res.id)

      // Auto-increment name for the next run
      nextNumber.current += 1
      setName(`Network Curve #${nextNumber.current}`)

      // Refresh saved curves list
      fetchSavedCurves()
    } catch (e: any) {
      setError(e.message)
    }
    setRunning(false)
  }

  const isML = result?.mode === 'ml_forecast'
  const bands = result?.confidence_bands

  // ── Hashprice chart data ──
  const hashpriceChartData = result
    ? result.hashprice_btc_per_ph_day.map((hp: number, i: number) => {
        const point: any = { month: i, hashprice: hp }
        if (bands?.hashprice) {
          point.hp_band = [bands.hashprice.lower[i], bands.hashprice.upper[i]]
        }
        return point
      })
    : []

  // ── Hashrate chart data ──
  const hashrateChartData = result
    ? result.network_hashrate_eh.map((hr: number, i: number) => {
        const point: any = { month: i, hashrate_eh: hr }
        if (bands?.hashrate) {
          point.hr_band = [bands.hashrate.lower[i], bands.hashrate.upper[i]]
        }
        return point
      })
    : []

  // ── Fees chart data ──
  const feesChartData = result
    ? result.fees_per_block_btc.map((fee: number, i: number) => {
        const point: any = { month: i, fees: fee }
        if (bands?.fees) {
          point.fee_band = [bands.fees.lower[i], bands.fees.upper[i]]
        }
        return point
      })
    : []

  // ── Table data ──
  const tableRows = result
    ? result.hashprice_btc_per_ph_day.map((hp: number, i: number) => ({
        month: i,
        year: Math.floor(i / 12),
        hashprice_btc_ph_day: hp.toFixed(8),
        hashrate_eh: formatNumber(result.network_hashrate_eh[i], 1),
        fees_btc: result.fees_per_block_btc[i].toFixed(6),
        difficulty: result.difficulty[i].toExponential(2),
      }))
    : []

  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  const bandLabel = isML
    ? ` (${(confidenceInterval * 100).toFixed(0)}% CI)`
    : bands
      ? ` (±${confidenceBandPct}%)`
      : ''

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-[#0E0F0F]">Step 2 — Network Curve</h2>
          <p className="text-xs text-[#9EB3A8]">
            10-year difficulty, hashprice, and fee regime simulation
          </p>
        </div>
        <button
          onClick={runSimulation}
          disabled={running}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            running
              ? 'bg-[#F2F2F2] text-[#9EB3A8]'
              : 'bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] active:scale-[0.98] animate-pulse'
          }`}
        >
          {running ? (
            'Running...'
          ) : (
            <>
              <span>▶</span> Run Simulation
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
          {error}
        </div>
      )}

      {/* ── Settings (horizontal) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-stretch">
        <div className={`${CARD} p-4 space-y-2.5`}>
          <h3 className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider mb-3">
            Saved Simulations
          </h3>
          {savedCurves.length === 0 ? (
            <p className="text-[10px] text-[#9EB3A8]">No saved simulations yet.</p>
          ) : (
            <>
              <SimSelect
                label="Load Curve"
                value={selectedCurveId}
                onChange={loadSavedCurve}
                options={savedCurves.map((c: any) => ({
                  value: c.id,
                  label: `${c.name || c.id} — ${c.scenario || ''}`,
                }))}
              />
              {selectedCurveId && result && (
                <div className="p-2.5 rounded-xl bg-[#F2F2F2] space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-[#9EB3A8]">Mode</span>
                    <span className="text-[#0E0F0F] font-medium capitalize">
                      {result.mode?.replace('_', ' ') || 'deterministic'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9EB3A8]">Start HP</span>
                    <span className="text-[#0E0F0F] font-medium">
                      {result.hashprice_btc_per_ph_day?.[0]?.toFixed(6) ?? '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9EB3A8]">End HP</span>
                    <span className="text-[#0E0F0F] font-medium">
                      {result.hashprice_btc_per_ph_day?.[
                        result.hashprice_btc_per_ph_day.length - 1
                      ]?.toFixed(6) ?? '—'}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteCurve(selectedCurveId)}
                    disabled={deleting}
                    className="w-full mt-2 py-1.5 text-[10px] font-medium rounded-lg border border-red-300 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className={`${CARD} p-4 space-y-2.5`}>
          <h3 className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider mb-3">
            Mode & Settings
          </h3>
          <div className="flex rounded-xl overflow-hidden border border-[#9EB3A8]/20">
            <button
              className={`flex-1 py-2 text-xs font-bold transition-all ${mode === 'deterministic' ? 'bg-[#96EA7A] text-[#0E0F0F]' : 'bg-white text-[#9EB3A8] hover:bg-[#F2F2F2]'}`}
              onClick={() => {
                setMode('deterministic')
                setResult(null)
              }}
            >
              Deterministic
            </button>
            <button
              className={`flex-1 py-2 text-xs font-bold transition-all ${mode === 'ml_forecast' ? 'bg-[#96EA7A] text-[#0E0F0F]' : 'bg-white text-[#9EB3A8] hover:bg-[#F2F2F2]'}`}
              onClick={() => {
                setMode('ml_forecast')
                setResult(null)
              }}
            >
              ML Forecast
            </button>
          </div>
          <SimInput label="Curve Name" value={name} onChange={setName} />
          <SimToggle
            label="Scenario"
            value={scenario}
            onChange={setScenario}
            options={[
              { value: 'bear', label: 'Bear' },
              { value: 'base', label: 'Base' },
              { value: 'bull', label: 'Bull' },
            ]}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={halvingEnabled}
              onChange={(e) => setHalvingEnabled(e.target.checked)}
              className="rounded border-[#9EB3A8]/20"
            />
            <label className="text-xs text-[#9EB3A8]">Halving Schedule</label>
          </div>
          {halvingEnabled && (
            <SimInput
              label="Months to Next Halving"
              value={monthsToNextHalving}
              onChange={(v) => setMonthsToNextHalving(Number(v))}
              type="number"
              min={0}
              max={120}
            />
          )}
        </div>

        {mode === 'deterministic' && (
          <div className={`${CARD} p-4 space-y-2.5 lg:col-span-2`}>
            <h3 className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider mb-3">
              Deterministic Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SimInput
                label="Start Hashrate (EH/s)"
                value={startHashrateEH}
                onChange={(v) => setStartHashrateEH(Number(v))}
                type="number"
                min={1}
                step={50}
              />
              <SimInput
                label="Monthly Growth Rate"
                value={monthlyGrowth}
                onChange={(v) => setMonthlyGrowth(Number(v))}
                type="number"
                min={0}
                max={0.2}
                step={0.005}
                hint="e.g. 0.02 = 2%/mo"
              />
              <SimToggle
                label="Fee Regime"
                value={feeRegime}
                onChange={setFeeRegime}
                options={[
                  { value: 'low', label: 'Low (0.5x)' },
                  { value: 'base', label: 'Base (1.0x)' },
                  { value: 'high', label: 'High (2.0x)' },
                ]}
              />
              <SimInput
                label="Start Fees/Block (BTC)"
                value={startingFees}
                onChange={(v) => setStartingFees(Number(v))}
                type="number"
                min={0}
                step={0.1}
              />
              <SimInput
                label="Confidence Band (±%)"
                value={confidenceBandPct}
                onChange={(v) => setConfidenceBandPct(Number(v))}
                type="number"
                min={0}
                max={100}
                step={5}
                hint="0 = off"
              />
            </div>
          </div>
        )}

        {mode === 'ml_forecast' && (
          <div className={`${CARD} p-4 space-y-2.5 border-[#96EA7A]/30 lg:col-span-2`}>
            <h3 className="text-[11px] font-semibold text-[#96EA7A] uppercase tracking-wider mb-3">
              ML Model Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SimSelect
                label="Model Type"
                value={modelType}
                onChange={setModelType}
                options={[
                  { value: 'auto_arima', label: 'Auto ARIMA' },
                  { value: 'holt_winters', label: 'Holt-Winters' },
                  { value: 'sarimax', label: 'SARIMAX' },
                ]}
              />
              <SimToggle
                label="Confidence Interval"
                value={String(confidenceInterval)}
                onChange={(v) => setConfidenceInterval(Number(v))}
                options={[
                  { value: '0.80', label: '80%' },
                  { value: '0.90', label: '90%' },
                  { value: '0.95', label: '95%' },
                ]}
              />
            </div>
            <p className="text-[10px] text-[#9EB3A8] leading-snug">
              Hashrate & fees forecasted independently. Difficulty derived from hashrate. Hashprice
              derived from hashrate + fees + halving.
            </p>
          </div>
        )}
      </div>

      {/* ── Results (full width) ── */}
      <div ref={resultsRef} className="space-y-4 min-w-0">
        {result && (
          <>
            {/* Top Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-stretch">
              <SimMetric
                label="Start Hashprice"
                value={`${result.hashprice_btc_per_ph_day[0].toFixed(6)}`}
                sub="BTC/PH/day"
              />
              <SimMetric
                label="End Hashprice"
                value={`${result.hashprice_btc_per_ph_day[result.hashprice_btc_per_ph_day.length - 1].toFixed(6)}`}
                sub="BTC/PH/day"
              />
              <SimMetric
                label="Start Hashrate"
                value={`${formatNumber(result.network_hashrate_eh[0], 0)} EH/s`}
              />
              <SimMetric
                label="End Hashrate"
                value={`${formatNumber(result.network_hashrate_eh[result.network_hashrate_eh.length - 1], 0)} EH/s`}
              />
            </div>

            {/* Model Info (ML only) */}
            {isML && result.model_info && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
                <SimMetric label="Model" value={modelType.replace(/_/g, ' ').toUpperCase()} />
                <SimMetric
                  label="Training Data"
                  value={`${result.model_info.training_months} months`}
                  sub={`${result.model_info.training_start} → ${result.model_info.training_end}`}
                />
                <SimMetric
                  label="Confidence"
                  value={`${(result.model_info.confidence_interval * 100).toFixed(0)}%`}
                  sub="prediction interval"
                />
              </div>
            )}

            {/* Hashprice Chart */}
            <div className={`${CARD} p-4`}>
              <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3">
                Hashprice (BTC/PH/day){bandLabel}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={hashpriceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#9EB3A8" strokeOpacity={0.15} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: '#9EB3A8' }}
                    tickFormatter={(v) => `Y${Math.floor(v / 12)}`}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#9EB3A8' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #9EB3A8',
                      borderRadius: 4,
                      fontSize: 11,
                    }}
                    formatter={(v: any, name?: string) => {
                      if (Array.isArray(v))
                        return [
                          `${v[0].toFixed(8)} — ${v[1].toFixed(8)}`,
                          isML ? 'CI' : 'Bear / Bull',
                        ]
                      return [typeof v === 'number' ? v.toFixed(8) : v, name]
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {bands?.hashprice && (
                    <Area
                      type="monotone"
                      dataKey="hp_band"
                      fill="#f59e0b"
                      fillOpacity={0.12}
                      stroke="#f59e0b40"
                      name={isML ? 'CI Band' : 'Bear / Bull'}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="hashprice"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    dot={false}
                    name="Hashprice"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Network Hashrate Chart */}
            <div className={`${CARD} p-4`}>
              <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3">
                Network Hashrate (EH/s){bandLabel}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={hashrateChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#9EB3A8" strokeOpacity={0.15} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: '#9EB3A8' }}
                    tickFormatter={(v) => `Y${Math.floor(v / 12)}`}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#9EB3A8' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #9EB3A8',
                      borderRadius: 4,
                      fontSize: 11,
                    }}
                    formatter={(v: any, name?: string) => {
                      if (Array.isArray(v))
                        return [
                          `${v[0].toFixed(1)} — ${v[1].toFixed(1)}`,
                          isML ? 'CI' : 'Bear / Bull',
                        ]
                      return [typeof v === 'number' ? formatNumber(v, 1) : v, name]
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {bands?.hashrate && (
                    <Area
                      type="monotone"
                      dataKey="hr_band"
                      fill="#22c55e"
                      fillOpacity={0.12}
                      stroke="#22c55e40"
                      name={isML ? 'CI Band' : 'Bear / Bull'}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="hashrate_eh"
                    stroke="#22c55e"
                    strokeWidth={1.5}
                    dot={false}
                    name="Hashrate"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Fees Chart — shows when bands exist (ML or deterministic with confidence %) */}
            {bands?.fees && (
              <div className={`${CARD} p-4`}>
                <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3">
                  Fees per Block (BTC){bandLabel}
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={feesChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#9EB3A8" strokeOpacity={0.15} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: '#9EB3A8' }}
                      tickFormatter={(v) => `Y${Math.floor(v / 12)}`}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#9EB3A8' }} />
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #9EB3A8',
                        borderRadius: 4,
                        fontSize: 11,
                      }}
                      formatter={(v: any, name?: string) => {
                        if (Array.isArray(v))
                          return [
                            `${v[0].toFixed(6)} — ${v[1].toFixed(6)}`,
                            isML ? 'CI' : 'Bear / Bull',
                          ]
                        return [typeof v === 'number' ? v.toFixed(6) : v, name]
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area
                      type="monotone"
                      dataKey="fee_band"
                      fill="#8b5cf6"
                      fillOpacity={0.12}
                      stroke="#8b5cf640"
                      name={isML ? 'CI Band' : 'Bear / Bull'}
                    />
                    <Line
                      type="monotone"
                      dataKey="fees"
                      stroke="#8b5cf6"
                      strokeWidth={1.5}
                      dot={false}
                      name="Fees/Block"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Data Table */}
            <SimTable
              title="Monthly Network Data"
              columns={[
                { key: 'month', label: 'Month' },
                { key: 'year', label: 'Year' },
                { key: 'hashprice_btc_ph_day', label: 'HP (BTC/PH/d)' },
                { key: 'hashrate_eh', label: 'Hashrate (EH/s)' },
                { key: 'fees_btc', label: 'Fees/Block (BTC)' },
                { key: 'difficulty', label: 'Difficulty' },
              ]}
              rows={tableRows}
              exportName={`network-curve-${result.id}`}
              maxHeight="300px"
            />
          </>
        )}

        {!result && !running && !loadingCurve && (
          <div
            className={`${CARD} flex flex-col items-center justify-center h-48 text-sm text-[#9EB3A8] gap-3`}
          >
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
            Configure inputs above and click &quot;Run Simulation&quot;
          </div>
        )}
        {loadingCurve && (
          <div className={`${CARD} flex items-center justify-center h-48 text-sm text-[#9EB3A8]`}>
            Loading simulation data...
          </div>
        )}
      </div>
    </div>
  )
}
