'use client'

import SimMetric from '@/components/simulation/SimMetric'
import { CARD } from '@/components/ui/constants'
import { formatPercent, formatUSD } from '@/lib/sim-utils'
import type { ScenarioResult } from '@/types/simulation'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AXIS_TICK, GRID_PROPS, SCENARIO_COLORS, SCENARIO_LABELS, TOOLTIP_STYLE } from './constants'

interface ResultsCommercialProps {
  scenarios: string[]
  scenarioResults: Record<string, ScenarioResult>
}

export default function ResultsCommercial({ scenarios, scenarioResults }: ResultsCommercialProps) {
  const hasCommercial = scenarios.some((s) => scenarioResults[s]?.commercial)

  if (!hasCommercial) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[#9EB3A8]">
        No commercial fees configured for this simulation run.
      </div>
    )
  }

  const mgmtFeesChartData = (() => {
    const baseCommercial = scenarioResults[scenarios[0]]?.commercial
    if (!baseCommercial?.management_fees_monthly?.length) return []

    return baseCommercial.management_fees_monthly.map((_: number, t: number) => {
      const row: any = { month: t }
      for (const s of scenarios) {
        const fees = scenarioResults[s]?.commercial?.management_fees_monthly || []
        row[s] = fees[t] || 0
      }
      return row
    })
  })()

  return (
    <div className="space-y-6">
      {/* Commercial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((s) => {
          const comm: any = scenarioResults[s]?.commercial
          const agg = scenarioResults[s]?.aggregated?.metrics
          return (
            <div
              key={s}
              className="border border-[#E8A838]/20 rounded-xl p-4 bg-amber-50 space-y-4"
            >
              <h4
                className="text-xs font-semibold uppercase"
                style={{ color: SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS] }}
              >
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
                      <p className="text-[10px] text-[#9EB3A8] uppercase font-semibold tracking-wider">
                        Impact on Investor Returns
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[#9EB3A8]">Gross Return:</span>
                          <span
                            className={`ml-1 font-mono ${(agg.gross_total_return_pct || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {formatPercent(agg.gross_total_return_pct || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#9EB3A8]">Net Return:</span>
                          <span
                            className={`ml-1 font-mono ${(agg.total_return_pct || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
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
          )
        })}
      </div>

      {/* Upfront Fee Breakdown */}
      {(() => {
        const baseComm: any = scenarioResults[scenarios[0]]?.commercial
        if (!baseComm || baseComm.upfront_fee_usd <= 0) return null

        return (
          <div className={`${CARD} p-4`}>
            <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">
              Upfront Fee Allocation (Deducted from Buckets)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#96EA7A] font-medium">Yield Bucket</span>
                <span className="font-mono text-[#0E0F0F]">
                  {formatUSD(baseComm.upfront_fee_breakdown?.yield_deduction_usd || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-cyan-600 font-medium">Holding Bucket</span>
                <span className="font-mono text-[#0E0F0F]">
                  {formatUSD(baseComm.upfront_fee_breakdown?.holding_deduction_usd || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lime-600 font-medium">Mining Bucket</span>
                <span className="font-mono text-[#0E0F0F]">
                  {formatUSD(baseComm.upfront_fee_breakdown?.mining_deduction_usd || 0)}
                </span>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Management Fees Over Time Chart */}
      {mgmtFeesChartData.length > 0 && (
        <div className={`${CARD} p-4`}>
          <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">
            Monthly Management Fees
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mgmtFeesChartData}>
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
      )}

      {/* Performance Fee Details */}
      {(() => {
        const hasPerformanceFee = scenarios.some(
          (s) => (scenarioResults[s]?.commercial?.performance_fee_usd || 0) > 0,
        )
        if (!hasPerformanceFee) return null

        return (
          <div className={`${CARD} p-4`}>
            <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">
              Performance Fee Calculation
            </h3>
            <p className="text-[10px] text-[#9EB3A8] mb-4">
              Performance fee is calculated on the capitalization overhead (value above initial
              mining investment)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarios.map((s) => {
                const comm: any = scenarioResults[s]?.commercial
                return (
                  <div key={s} className="space-y-1 text-xs">
                    <span
                      className="font-semibold"
                      style={{
                        color: SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS],
                      }}
                    >
                      {SCENARIO_LABELS[s]}
                    </span>
                    <div className="text-[#9EB3A8]">
                      Overhead (Base):{' '}
                      <span className="font-mono text-[#0E0F0F]">
                        {formatUSD(comm?.performance_fee_base_usd || 0)}
                      </span>
                    </div>
                    <div className="text-[#9EB3A8]">
                      Performance Fee:{' '}
                      <span className="font-mono text-[#E8A838]">
                        {formatUSD(comm?.performance_fee_usd || 0)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Commercial Value Summary Table */}
      <div className={`${CARD} overflow-hidden`}>
        <table className="w-full text-xs">
          <thead className="bg-[#F2F2F2]">
            <tr>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
                Fee Type
              </th>
              {scenarios.map((s) => (
                <th
                  key={s}
                  className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS] }}
                >
                  {SCENARIO_LABELS[s] || s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#9EB3A8]/10">
            <tr>
              <td className="px-3 py-2 font-medium text-[#9EB3A8]">Upfront Commercial</td>
              {scenarios.map((s) => (
                <td key={s} className="px-3 py-2 font-mono text-[#0E0F0F]">
                  {formatUSD(scenarioResults[s]?.commercial?.upfront_fee_usd || 0)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-2 font-medium text-[#9EB3A8]">Management Fees</td>
              {scenarios.map((s) => (
                <td key={s} className="px-3 py-2 font-mono text-[#0E0F0F]">
                  {formatUSD(
                    (scenarioResults[s]?.commercial as any)?.management_fees_total_usd || 0,
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-2 font-medium text-[#9EB3A8]">Performance Fees</td>
              {scenarios.map((s) => (
                <td key={s} className="px-3 py-2 font-mono text-[#0E0F0F]">
                  {formatUSD(scenarioResults[s]?.commercial?.performance_fee_usd || 0)}
                </td>
              ))}
            </tr>
            <tr className="bg-amber-50">
              <td className="px-3 py-2 font-semibold text-[#E8A838]">Total Commercial Value</td>
              {scenarios.map((s) => (
                <td key={s} className="px-3 py-2 font-mono font-semibold text-[#E8A838]">
                  {formatUSD(scenarioResults[s]?.commercial?.total_commercial_value_usd || 0)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
