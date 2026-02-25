'use client'

import { fmtPercent } from '@/config/mock-data'
import { CARD } from '@/components/ui/constants'
import { ToggleGroup } from './ToggleGroup'
import type { ActiveStrategy, ChartMode, ChartStrategyFilter, QuantMetrics } from './types'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const STRATEGY_COLORS: Record<string, string> = {
  rwa_mining: '#96EA7A',
  usdc_yield: '#9EB3A8',
  btc_hedged: '#5B7A6E',
  btc_spot: '#F7931A',
  btc_collateral_mining: '#96EA7A',
}

interface PerformanceChartProps {
  activeChartData: Record<string, number | string>[]
  composedChartData: Record<string, number | string>[]
  activeStrategies: ActiveStrategy[]
  chartStrategy: ChartStrategyFilter
  chartMode: ChartMode
  timeRange: string
  quantMetrics: QuantMetrics
  onChartStrategyChange: (v: ChartStrategyFilter) => void
  onChartModeChange: (v: ChartMode) => void
  onTimeRangeChange: (v: string) => void
}

function catmullRom(
  points: { month: string; value: number }[],
  subdivisions: number,
): { month: string; value: number; _orig: boolean }[] {
  if (points.length < 3) return points.map((p) => ({ ...p, _orig: true }))
  const result: { month: string; value: number; _orig: boolean }[] = []

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    for (let t = 0; t < subdivisions; t++) {
      const s = t / subdivisions
      const s2 = s * s
      const s3 = s2 * s
      const v =
        0.5 *
        (2 * p1.value +
          (-p0.value + p2.value) * s +
          (2 * p0.value - 5 * p1.value + 4 * p2.value - p3.value) * s2 +
          (-p0.value + 3 * p1.value - 3 * p2.value + p3.value) * s3)

      result.push({
        month: t === 0 ? p1.month : '',
        value: Math.max(0, +v.toFixed(4)),
        _orig: t === 0,
      })
    }
  }
  const last = points[points.length - 1]
  result.push({ month: last.month, value: last.value, _orig: true })
  return result
}

function PerfTooltip({
  active,
  payload,
  label,
  color,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; payload: { _orig: boolean; month: string } }>
  label?: string
  color: string
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const displayLabel = item.payload.month || label
  if (!displayLabel) return null
  const val = item.value
  return (
    <div className="bg-white/95 backdrop-blur-lg border border-[#9EB3A8]/30 px-4 py-3 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.10)] min-w-[150px]">
      <p className="text-caption font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
        {displayLabel}
      </p>
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-heading-sm font-black tabular-nums text-[#0E0F0F] tracking-tight">
          {val >= 0 ? '+' : ''}
          {fmtPercent(val)}
        </span>
      </div>
    </div>
  )
}

export function PerformanceChart({
  activeChartData,
  composedChartData,
  activeStrategies,
  chartStrategy,
  chartMode,
  timeRange,
  quantMetrics,
  onChartStrategyChange,
  onChartModeChange,
  onTimeRangeChange,
}: PerformanceChartProps) {
  const activeColor =
    chartStrategy === 'composite' ? '#96EA7A' : (STRATEGY_COLORS[chartStrategy] ?? '#96EA7A')

  const trendUp = quantMetrics.totalYield > 0

  const dataKey = chartStrategy === 'composite' ? 'composite' : chartStrategy

  const rawData = useMemo(() => {
    return activeChartData.map((m) => ({
      month: m.month as string,
      value: (m[dataKey] as number) ?? 0,
    }))
  }, [activeChartData, dataKey])

  const smoothData = useMemo(() => {
    if (rawData.length < 3) return rawData.map((d) => ({ ...d, _orig: true }))
    return catmullRom(rawData, 8)
  }, [rawData])

  const lastPoint = rawData[rawData.length - 1]

  const xTicks = useMemo(() => rawData.map((d) => d.month), [rawData])

  const yDomain = useMemo(() => {
    const vals = rawData.map((d) => d.value)
    const max = Math.max(...vals)
    const ceiling = Math.ceil(max / 4) * 4 + 4
    return [0, ceiling]
  }, [rawData])

  const gradientId = `perfGrad-${chartStrategy}`

  const kpis = [
    { label: 'Sharpe', value: quantMetrics.sharpe.toFixed(2), accent: quantMetrics.sharpe > 1 },
    {
      label: 'Avg Monthly',
      value: fmtPercent(quantMetrics.avgMonthly),
      accent: quantMetrics.avgMonthly > 0.8,
    },
    {
      label: 'Win Rate',
      value: `${quantMetrics.winRate.toFixed(0)}%`,
      accent: quantMetrics.winRate > 50,
    },
    { label: 'Max DD', value: fmtPercent(quantMetrics.maxDrawdown), accent: false },
    { label: 'Sortino', value: quantMetrics.sortino.toFixed(2), accent: quantMetrics.sortino > 1 },
    { label: 'Volatility', value: fmtPercent(quantMetrics.volatility), accent: false },
  ]

  return (
    <div className={`col-span-12 lg:col-span-8 ${CARD} overflow-hidden flex flex-col`}>
      {/* Header */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <p className="kpi-label mb-1">
              {chartStrategy === 'composite'
                ? 'Composite'
                : (activeStrategies.find((s) => s.type === chartStrategy)?.label ?? '')}{' '}
              Performance
            </p>
            <div className="flex items-baseline gap-2.5">
              <span className="text-display font-black text-[var(--foreground)] tracking-tight">
                {fmtPercent(quantMetrics.totalYield)}
              </span>
              <span
                className={`text-caption font-bold px-2 py-0.5 rounded-md ${trendUp ? 'bg-[#96EA7A]/15 text-[#96EA7A]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}
              >
                {trendUp ? '▲' : '▼'} {fmtPercent(quantMetrics.annualizedReturn)} /yr
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-6 pb-6 flex-1">
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%" debounce={1}>
            <AreaChart data={smoothData} margin={{ top: 20, right: 20, bottom: 8, left: 4 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={activeColor} stopOpacity={0.28} />
                  <stop offset="25%" stopColor={activeColor} stopOpacity={0.18} />
                  <stop offset="55%" stopColor={activeColor} stopOpacity={0.08} />
                  <stop offset="85%" stopColor={activeColor} stopOpacity={0.02} />
                  <stop offset="100%" stopColor={activeColor} stopOpacity={0} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid
                stroke="#9EB3A8"
                strokeOpacity={0.25}
                vertical={false}
                horizontal={true}
              />
              {rawData.map((d) => (
                <ReferenceLine key={d.month} x={d.month} stroke="#9EB3A8" strokeOpacity={0.25} />
              ))}
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#748C82', fontWeight: 500 }}
                dy={10}
                ticks={xTicks}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#748C82', fontWeight: 500 }}
                tickFormatter={(v: number) => `${v}%`}
                width={44}
                domain={yDomain}
              />
              <Tooltip
                content={<PerfTooltip color={activeColor} />}
                cursor={{
                  stroke: activeColor,
                  strokeOpacity: 0.2,
                  strokeWidth: 1,
                  strokeDasharray: '4 3',
                }}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={activeColor}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: '#fff',
                  stroke: activeColor,
                  strokeWidth: 2.5,
                }}
                name="Cumulative"
                animationDuration={1000}
                animationEasing="ease-out"
                filter="url(#glow)"
              />
              {lastPoint && (
                <ReferenceDot
                  x={lastPoint.month}
                  y={lastPoint.value}
                  r={4}
                  fill={activeColor}
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 sm:grid-cols-6 border-t border-[#9EB3A8]/20">
        {kpis.map((stat) => (
          <div
            key={stat.label}
            className="px-3 py-3 border-r border-[#9EB3A8]/20 last:border-r-0 text-center"
          >
            <p className="kpi-label mb-0.5">{stat.label}</p>
            <p
              className={`text-base font-black leading-none tracking-tight ${stat.accent ? 'text-[#96EA7A]' : 'text-[var(--foreground)]'}`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
