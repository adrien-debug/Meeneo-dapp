'use client'

import SimMetric from '@/components/simulation/SimMetric'
import { CARD } from '@/components/ui/constants'
import { formatNumber, formatPercent, formatUSD } from '@/lib/sim-utils'
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

interface ResultsHoldingBucketProps {
  scenarios: string[]
  scenarioResults: Record<string, ScenarioResult>
}

export default function ResultsHoldingBucket({
  scenarios,
  scenarioResults,
}: ResultsHoldingBucketProps) {
  const holdingChartData = (() => {
    const baseHolding = scenarioResults[scenarios[0]]?.btc_holding_bucket?.monthly_data || []
    return baseHolding.map((_: any, t: number) => {
      const row: any = { month: t }
      for (const s of scenarios) {
        row[s] = scenarioResults[s]?.btc_holding_bucket?.monthly_data?.[t]?.bucket_value_usd || 0
      }
      return row
    })
  })()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((s) => {
          const hb = scenarioResults[s]?.btc_holding_bucket?.metrics
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
                value={formatUSD(hb?.final_value_usd || 0)}
                status={hb?.total_return_pct >= 0 ? 'green' : 'red'}
              />
              <SimMetric
                label="Total Return"
                value={formatPercent(hb?.total_return_pct || 0)}
                status={hb?.total_return_pct >= 0 ? 'green' : 'red'}
              />
              <SimMetric
                label="Target Hit"
                value={hb?.target_hit ? `Yes (Month ${hb.sell_month})` : 'No'}
                status={hb?.target_hit ? 'green' : 'neutral'}
              />
              <SimMetric label="BTC Qty" value={formatNumber(hb?.btc_quantity || 0, 4)} />
            </div>
          )
        })}
      </div>

      <div className={`${CARD} p-4`}>
        <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">
          BTC Holding Value Over Time
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={holdingChartData}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
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
