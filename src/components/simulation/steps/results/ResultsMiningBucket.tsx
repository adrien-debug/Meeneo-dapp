'use client'

import SimMetric from '@/components/simulation/SimMetric'
import { CARD } from '@/components/ui/constants'
import { formatNumber, formatPercent, formatUSD } from '@/lib/sim-utils'
import type { ScenarioResult } from '@/types/simulation'
import {
  Bar,
  BarChart,
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

interface ResultsMiningBucketProps {
  scenarios: string[]
  scenarioResults: Record<string, ScenarioResult>
}

export default function ResultsMiningBucket({
  scenarios,
  scenarioResults,
}: ResultsMiningBucketProps) {
  const healthChartData = (() => {
    const baseWaterfall = scenarioResults[scenarios[0]]?.mining_bucket?.monthly_waterfall || []
    return baseWaterfall.map((_: any, t: number) => {
      const row: any = { month: t }
      for (const s of scenarios) {
        row[s] = scenarioResults[s]?.mining_bucket?.monthly_waterfall?.[t]?.health_score || 0
      }
      return row
    })
  })()

  const yieldChartData = (() => {
    const baseWaterfall = scenarioResults[scenarios[0]]?.mining_bucket?.monthly_waterfall || []
    return baseWaterfall.map((_: any, t: number) => {
      const row: any = { month: t }
      for (const s of scenarios) {
        row[s] = scenarioResults[s]?.mining_bucket?.monthly_waterfall?.[t]?.yield_paid_usd || 0
      }
      return row
    })
  })()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((s) => {
          const mb = scenarioResults[s]?.mining_bucket?.metrics
          const holdingHit = scenarioResults[s]?.btc_holding_bucket?.metrics?.target_hit
          return (
            <div key={s} className="space-y-3">
              <h4
                className="text-xs font-semibold uppercase"
                style={{ color: SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS] }}
              >
                {SCENARIO_LABELS[s]}
              </h4>
              <SimMetric
                label="Health Score"
                value={`${mb?.final_health_score || 0}/100`}
                status={
                  mb?.final_health_score >= 60
                    ? 'green'
                    : mb?.final_health_score >= 40
                      ? 'yellow'
                      : 'red'
                }
              />
              <SimMetric label="Effective APR" value={formatPercent(mb?.effective_apr || 0)} />
              <SimMetric
                label="OPEX Coverage"
                value={`${formatNumber(mb?.avg_opex_coverage_ratio || 0, 2)}x`}
                status={
                  (mb?.avg_opex_coverage_ratio || 0) >= 1.5
                    ? 'green'
                    : (mb?.avg_opex_coverage_ratio || 0) >= 1.0
                      ? 'yellow'
                      : 'red'
                }
              />
              <SimMetric
                label="Capitalization"
                value={formatUSD(mb?.capitalization_usd_final || 0)}
                status={(mb?.capitalization_usd_final || 0) > 0 ? 'green' : 'neutral'}
              />
              <SimMetric
                label="Yield Cap Bump"
                value={holdingHit ? 'Active (12%)' : 'Base (8%)'}
                status={holdingHit ? 'green' : 'neutral'}
              />
              <SimMetric
                label="Deficit Months"
                value={`${mb?.red_flag_months || 0}`}
                status={(mb?.red_flag_months || 0) === 0 ? 'green' : 'red'}
              />
            </div>
          )
        })}
      </div>

      <div className={`${CARD} p-4`}>
        <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">
          Mining Health Score Over Time
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={healthChartData}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_TICK} />
            <YAxis domain={[0, 100]} tick={AXIS_TICK} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
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

      <div className={`${CARD} p-4`}>
        <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">
          Monthly Mining Yield (USD)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={yieldChartData}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v?: number) => formatUSD(v ?? 0)} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {scenarios.map((s) => (
              <Bar
                key={s}
                dataKey={s}
                fill={SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS]}
                opacity={0.7}
                name={SCENARIO_LABELS[s]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
