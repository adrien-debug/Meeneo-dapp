'use client'

import SimInput from '@/components/simulation/SimInput'
import SimMetric from '@/components/simulation/SimMetric'
import SimSelect from '@/components/simulation/SimSelect'
import SimTable from '@/components/simulation/SimTable'
import SimToggle from '@/components/simulation/SimToggle'
import { CARD } from '@/components/ui/constants'
import { exportAsJSON, formatUSD } from '@/lib/sim-utils'
import type { BtcPriceCurvePayload, BtcPriceCurveResult, SavedCurve } from '@/types/simulation'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const API = '/api/simulation'
const DEFAULT_ANCHORS: Record<number, number> = {
  0: 97000,
  1: 120000,
  2: 150000,
  3: 180000,
  4: 200000,
  5: 220000,
  6: 250000,
  7: 280000,
  8: 300000,
  9: 320000,
  10: 350000,
}

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

interface StepBtcCurveProps {
  onComplete: (curveId: string) => void
  completedCurveId?: string
}

export default function StepBtcCurve({ onComplete, completedCurveId }: StepBtcCurveProps) {
  const [name, setName] = useState('')
  const nextNumber = useRef(1)
  const [savedCurves, setSavedCurves] = useState<SavedCurve[]>([])
  const [selectedCurveId, setSelectedCurveId] = useState(completedCurveId || '')
  const [loadingCurve, setLoadingCurve] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchSaved = useCallback(async () => {
    try {
      const c = await api<SavedCurve[]>('/btc-price-curve/list')
      setSavedCurves(c)
      return c
    } catch {
      return []
    }
  }, [])

  useEffect(() => {
    fetchSaved()
      .then((curves) => {
        let maxNum = 0
        curves.forEach((c: SavedCurve) => {
          const m = c.name?.match(/^BTC Curve #(\d+)$/)
          if (m) maxNum = Math.max(maxNum, parseInt(m[1]))
        })
        nextNumber.current = Math.max(maxNum + 1, curves.length + 1)
        setName(`BTC Curve #${nextNumber.current}`)
      })
      .catch(() => setName('BTC Curve #1'))
  }, [fetchSaved])

  const loadCurve = useCallback(
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
        const data = await api<BtcPriceCurveResult>(`/btc-price-curve/${id}`)
        setResult(data)
        onComplete(id)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Operation failed')
      }
      setLoadingCurve(false)
    },
    [onComplete],
  )

  const deleteCurve = useCallback(
    async (id: string) => {
      if (!id || !window.confirm('Delete this curve?')) return
      setDeleting(true)
      try {
        await api(`/btc-price-curve/${id}`, { method: 'DELETE' })
        if (selectedCurveId === id) {
          setSelectedCurveId('')
          setResult(null)
        }
        await fetchSaved()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Operation failed')
      }
      setDeleting(false)
    },
    [selectedCurveId, fetchSaved],
  )

  const [scenario, setScenario] = useState('base')
  const [mode, setMode] = useState<'deterministic' | 'ml_forecast'>('deterministic')
  const [liveBtcPrice, setLiveBtcPrice] = useState<number | null>(null)
  const [btcPriceLoading, setBtcPriceLoading] = useState(false)
  const [startPrice, setStartPrice] = useState(97000)
  const [interpolation, setInterpolation] = useState('linear')
  const [volatilityEnabled, setVolatilityEnabled] = useState(false)
  const [volatilitySeed, setVolatilitySeed] = useState(42)
  const [confidenceBandPct, setConfidenceBandPct] = useState(20)
  const [anchors, setAnchors] = useState<Record<number, number>>({ ...DEFAULT_ANCHORS })
  const [modelType, setModelType] = useState('auto_arima')
  const [confidenceInterval, setConfidenceInterval] = useState(0.95)
  const [result, setResult] = useState<BtcPriceCurveResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  const fetchLiveBtcPrice = useCallback(async (setAsDefault = false) => {
    setBtcPriceLoading(true)
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      )
      const data = await res.json()
      const price = Math.round(data.bitcoin.usd)
      setLiveBtcPrice(price)
      if (setAsDefault) setStartPrice(price)
    } catch {
      /* keep manual default */
    }
    setBtcPriceLoading(false)
  }, [])

  useEffect(() => {
    fetchLiveBtcPrice(true)
  }, [fetchLiveBtcPrice])

  const runSimulation = async () => {
    if (!name.trim()) {
      setError('Enter a curve name')
      return
    }
    setRunning(true)
    setError('')
    try {
      const payload: BtcPriceCurvePayload = { name: name.trim(), scenario, months: 120, mode }
      if (mode === 'ml_forecast') {
        payload.model_type = modelType
        payload.confidence_interval = confidenceInterval
      } else {
        payload.start_price = startPrice
        payload.anchor_points = anchors
        payload.interpolation_type = interpolation
        payload.volatility_enabled = volatilityEnabled
        payload.volatility_seed = volatilitySeed
        payload.confidence_band_pct = confidenceBandPct
      }
      const res = await api<BtcPriceCurveResult>('/btc-price-curve/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setResult(res)
      setSelectedCurveId(res.id || '')
      nextNumber.current += 1
      setName(`BTC Curve #${nextNumber.current}`)
      fetchSaved()
      if (res.id) onComplete(res.id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Operation failed')
    }
    setRunning(false)
  }

  const isML = result?.mode === 'ml_forecast'
  const hasBands = result?.upper_bound && result?.lower_bound
  const chartData =
    result?.monthly_prices?.map((price: number, i: number) => {
      const pt: { month: number; price: number; confidence?: [number, number] } = {
        month: i,
        price,
      }
      if (hasBands && result.lower_bound && result.upper_bound) {
        pt.confidence = [result.lower_bound[i], result.upper_bound[i]]
      }
      return pt
    }) || []

  const tableRows: Record<string, string>[] = []
  if (result?.monthly_prices) {
    for (let y = 0; y < 10; y++) {
      const row: Record<string, string> = { year: `Y${y}` }
      for (let m = 0; m < 12; m++) {
        const idx = y * 12 + m
        row[`m${m}`] =
          idx < result.monthly_prices.length ? formatUSD(result.monthly_prices[idx]) : '-'
      }
      tableRows.push(row)
    }
  }

  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  // Suppress unused var warnings
  void btcPriceLoading

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-[#0E0F0F]">Step 1 — BTC Price Curve</h2>
          <p className="text-xs text-[#9EB3A8]">
            Generate a 10-year monthly BTC price path (120 months)
          </p>
        </div>
        <button
          onClick={runSimulation}
          disabled={running}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${running ? 'bg-[#F2F2F2] text-[#9EB3A8]' : 'bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] active:scale-[0.98] animate-pulse'}`}
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
                onChange={loadCurve}
                options={[
                  { value: '', label: '-- Select --' },
                  ...savedCurves.map((c: SavedCurve) => ({
                    value: c.id,
                    label: `${c.name} — ${c.scenario}`,
                  })),
                ]}
              />
              {selectedCurveId && result && (
                <div className="p-2.5 rounded-xl bg-[#F2F2F2] space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-[#9EB3A8]">Mode</span>
                    <span className="text-[#0E0F0F] font-medium capitalize">
                      {result.mode?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9EB3A8]">Start</span>
                    <span className="text-[#0E0F0F] font-medium">
                      {formatUSD(result.monthly_prices?.[0] ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9EB3A8]">End</span>
                    <span className="text-[#0E0F0F] font-medium">
                      {formatUSD(result.monthly_prices?.[result.monthly_prices.length - 1] ?? 0)}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteCurve(selectedCurveId)}
                    disabled={deleting}
                    className="w-full mt-2 py-1.5 text-[10px] font-medium rounded-lg border border-red-300 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className={`${CARD} p-4 space-y-2.5`}>
          <h3 className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider mb-3">
            Mode
          </h3>
          <div className="flex rounded-xl overflow-hidden border border-[#9EB3A8]/20">
            {(['deterministic', 'ml_forecast'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m)
                  setResult(null)
                }}
                className={`flex-1 py-2 text-xs font-bold transition-all ${mode === m ? 'bg-[#96EA7A] text-[#0E0F0F]' : 'bg-white text-[#9EB3A8] hover:bg-[#F2F2F2]'}`}
              >
                {m === 'deterministic' ? 'Deterministic' : 'ML Forecast'}
              </button>
            ))}
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
        </div>

        {mode === 'deterministic' && (
          <div className={`${CARD} p-4 space-y-2.5`}>
            <h3 className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider mb-3">
              Deterministic Settings
            </h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
                  Start Price
                </label>
                {liveBtcPrice && (
                  <button
                    onClick={() => setStartPrice(liveBtcPrice)}
                    className="text-[10px] text-[#96EA7A] font-medium hover:underline"
                  >
                    Use live: {formatUSD(liveBtcPrice)}
                  </button>
                )}
              </div>
              <input
                type="number"
                value={startPrice}
                onChange={(e) => setStartPrice(Number(e.target.value))}
                step={1000}
                className="w-full h-9 px-3 rounded-xl border border-[#9EB3A8]/20 bg-[#F2F2F2] text-[#0E0F0F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#96EA7A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <SimSelect
              label="Interpolation"
              value={interpolation}
              onChange={setInterpolation}
              options={[
                { value: 'linear', label: 'Linear' },
                { value: 'step', label: 'Step' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={volatilityEnabled}
                onChange={(e) => setVolatilityEnabled(e.target.checked)}
                className="rounded"
              />
              <label className="text-xs text-[#9EB3A8]">Volatility Overlay</label>
            </div>
            {volatilityEnabled && (
              <SimInput
                label="Seed"
                value={volatilitySeed}
                onChange={(v) => setVolatilitySeed(Number(v))}
                type="number"
              />
            )}
            <SimInput
              label="Confidence Band (±%)"
              value={confidenceBandPct}
              onChange={(v) => setConfidenceBandPct(Number(v))}
              type="number"
              hint="Bear/Bull envelope (0 = off)"
            />
          </div>
        )}

        {mode === 'deterministic' && (
          <div className={`${CARD} p-4 space-y-2.5`}>
            <h3 className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider mb-3">
              Yearly Anchors
            </h3>
            <div className="space-y-2 max-h-[320px] overflow-auto">
              {Array.from({ length: 11 }, (_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-[#9EB3A8] w-8 font-medium">Y{i}</span>
                  <input
                    type="number"
                    value={anchors[i] || 0}
                    onChange={(e) => setAnchors((p) => ({ ...p, [i]: Number(e.target.value) }))}
                    step={1000}
                    className="flex-1 h-8 px-2 rounded-lg border border-[#9EB3A8]/20 bg-[#F2F2F2] text-sm text-[#0E0F0F] font-medium focus:outline-none focus:ring-2 focus:ring-[#96EA7A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === 'ml_forecast' && (
          <div className={`${CARD} p-4 space-y-2.5 border-[#96EA7A]/30 lg:col-span-2`}>
            <h3 className="text-[11px] font-semibold text-[#96EA7A] uppercase tracking-wider mb-3">
              ML Model Settings
            </h3>
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
        )}
      </div>

      {/* ── Results (full width) ── */}
      <div ref={resultsRef} className="space-y-4 min-w-0">
        {result && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-stretch">
              <SimMetric label="Start" value={formatUSD(result.monthly_prices[0])} />
              <SimMetric
                label="End"
                value={formatUSD(result.monthly_prices[result.monthly_prices.length - 1])}
              />
              <SimMetric
                label="Max"
                value={formatUSD(Math.max(...result.monthly_prices))}
                status="green"
              />
              <SimMetric
                label="Min"
                value={formatUSD(Math.min(...result.monthly_prices))}
                status="yellow"
              />
            </div>

            <div className={`${CARD} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase">
                  Monthly Price {isML ? 'Forecast' : 'Chart'}
                </h3>
                <button
                  onClick={() => exportAsJSON(result.monthly_prices, `btc-curve-${result.id}.json`)}
                  className="text-[10px] text-[#9EB3A8] hover:text-[#96EA7A] font-medium"
                >
                  Export JSON
                </button>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#9EB3A8" strokeOpacity={0.15} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: '#9EB3A8' }}
                    tickFormatter={(v: number) => `Y${Math.floor(v / 12)}`}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9EB3A8' }}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #9EB3A8',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={(v: unknown, n?: string) => {
                      if (Array.isArray(v))
                        return [`${formatUSD(v[0])} — ${formatUSD(v[1])}`, 'Range']
                      return [formatUSD(v as number), n ?? '']
                    }}
                    labelFormatter={(v) => `Month ${v}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {hasBands && (
                    <Area
                      type="monotone"
                      dataKey="confidence"
                      fill="#96EA7A"
                      fillOpacity={0.12}
                      stroke="#96EA7A"
                      strokeOpacity={0.3}
                      strokeWidth={0.5}
                      name="Band"
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#96EA7A"
                    strokeWidth={2}
                    dot={false}
                    name="BTC Price"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <SimTable
              title="Monthly Prices (Year x Month)"
              columns={[
                { key: 'year', label: 'Year' },
                ...Array.from({ length: 12 }, (_, i) => ({ key: `m${i}`, label: `M${i + 1}` })),
              ]}
              rows={tableRows}
              exportName={`btc-price-${result.id}`}
              maxHeight="280px"
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
            Configure inputs and click &quot;Run Simulation&quot;
          </div>
        )}
        {(running || loadingCurve) && (
          <div className={`${CARD} flex items-center justify-center h-48`}>
            <div className="w-6 h-6 border-2 border-[#96EA7A] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}
