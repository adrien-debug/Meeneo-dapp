'use client'

import { fmtPercent } from '@/config/mock-data'
import { CARD } from '@/components/ui/constants'
import { ChartTooltip } from '@/components/ui/ChartTooltip'
import type { QuantMetrics } from './types'
import { useMemo } from 'react'
import {
  Bar,
  Cell,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface MonthlyDistributionProps {
  chartData: Record<string, number | string>[]
  quantMetrics: QuantMetrics
}

export function MonthlyDistribution({ chartData, quantMetrics }: MonthlyDistributionProps) {
  const avg = quantMetrics.avgMonthly

  const composedData = useMemo(() => {
    let cumul = 0
    const all = chartData.map((m) => {
      const val = (m.composite as number) ?? 0
      cumul += val
      return { month: m.month as string, composite: val, cumulative: +cumul.toFixed(2) }
    })
    return all.slice(-6)
  }, [chartData])

  const barDomain = useMemo(() => {
    const vals = composedData.map((d) => d.composite)
    const max = Math.max(...vals, 0)
    const ceiling = Math.ceil(max * 2) / 2 + 0.5
    return [0, ceiling]
  }, [composedData])

  const spread = quantMetrics.bestMonth - quantMetrics.worstMonth
  const consistency =
    chartData.length > 0
      ? (chartData.filter((m) => ((m.composite as number) ?? 0) >= avg).length / chartData.length) *
        100
      : 0

  return (
    <div className={`${CARD} flex flex-col overflow-hidden h-full`}>
      <div className="px-5 pt-5 pb-0 flex items-start justify-between">
        <div>
          <h3 className="card-title mb-0.5">Monthly Returns</h3>
          <p className="text-xs text-[var(--muted)]">Composite monthly yield</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-[#96EA7A] leading-none">
            {fmtPercent(quantMetrics.totalYield)}
          </p>
          <p className="text-xs text-[var(--muted)] mt-0.5">Last 6 months</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-3 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={composedData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#748C82' }}
              interval={0}
            />
            <YAxis
              yAxisId="bar"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#748C82' }}
              tickFormatter={(v: number) => `${v}%`}
              domain={barDomain}
            />
            <Tooltip content={<ChartTooltip />} cursor={false} />
            <ReferenceLine
              yAxisId="bar"
              y={avg}
              stroke="#9EB3A8"
              strokeDasharray="2 3"
              strokeOpacity={0.4}
            />
            <Bar
              yAxisId="bar"
              dataKey="composite"
              name="Monthly"
              radius={[3, 3, 0, 0]}
              maxBarSize={40}
            >
              {composedData.map((_, i) => {
                const isLast = i === composedData.length - 1
                return <Cell key={i} fill="#96EA7A" fillOpacity={isLast ? 1 : 0.55} />
              })}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 border-t border-[#9EB3A8]/10 mt-1">
        {[
          { label: 'Best', value: fmtPercent(quantMetrics.bestMonth), green: true },
          { label: 'Worst', value: fmtPercent(quantMetrics.worstMonth), green: false },
          { label: 'μ Avg', value: fmtPercent(avg), green: false },
          { label: 'Spread', value: fmtPercent(spread), green: false },
        ].map((s) => (
          <div
            key={s.label}
            className="px-3 py-2.5 border-r border-[#9EB3A8]/5 last:border-r-0 text-center"
          >
            <p className="kpi-label mb-0.5">{s.label}</p>
            <p className={`text-base font-black ${s.green ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-[#9EB3A8]/5 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="kpi-label">Consistency</span>
            <span className="text-base font-black text-[#0E0F0F]">{consistency.toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#F2F2F2] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#96EA7A] transition-all"
              style={{ width: `${consistency}%` }}
            />
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">months above average</p>
        </div>
      </div>
    </div>
  )
}
