'use client'

import SimMetric from '@/components/simulation/SimMetric'
import { CARD } from '@/components/ui/constants'
import { formatPercent, formatUSD } from '@/lib/sim-utils'
import type { ScenarioResult } from '@/types/simulation'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AXIS_TICK, GRID_PROPS, SCENARIO_COLORS, SCENARIO_LABELS, TOOLTIP_STYLE } from './constants'

interface ResultsYieldBucketProps {
  scenarios: string[]
  scenarioResults: Record<string, ScenarioResult>
}

export default function ResultsYieldBucket({
  scenarios,
  scenarioResults,
}: ResultsYieldBucketProps) {
  const yieldChartData = (() => {
    const baseYield = scenarioResults[scenarios[0]]?.yield_bucket?.monthly_data || []
    return baseYield.map((_: any, t: number) => {
      const row: any = { month: t }
      for (const s of scenarios) {
        row[s] = scenarioResults[s]?.yield_bucket?.monthly_data?.[t]?.cumulative_yield_usd || 0
      }
      return row
    })
  })()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((s) => {
          const yb = scenarioResults[s]?.yield_bucket?.metrics
          return (
            <div key={s} className="space-y-3">
              <h4
                className="text-xs font-semibold uppercase"
                style={{ color: SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS] }}
              >
                {SCENARIO_LABELS[s]}
              </h4>
              <SimMetric
                label="Final Value"
                value={formatUSD(yb?.final_value_usd || 0)}
                status="green"
              />
              <SimMetric label="Total Yield" value={formatUSD(yb?.total_yield_usd || 0)} />
              <SimMetric label="Effective APR" value={formatPercent(yb?.effective_apr || 0)} />
            </div>
          )
        })}
      </div>

      <div className={`${CARD} p-4`}>
        <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">
          Cumulative Yield (All Scenarios)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={yieldChartData}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v?: number) => formatUSD(v ?? 0)} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {scenarios.map((s) => (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                stroke={SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS]}
                strokeWidth={1.5}
                dot={false}
                name={SCENARIO_LABELS[s]}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
