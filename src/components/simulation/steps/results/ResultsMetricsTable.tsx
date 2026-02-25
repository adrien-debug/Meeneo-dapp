import { CARD } from '@/components/ui/constants'
import { formatNumber, formatPercent, formatUSD } from '@/lib/sim-utils'
import type { ScenarioResult } from '@/types/simulation'
import { SCENARIO_COLORS, SCENARIO_LABELS } from './constants'

interface ResultsMetricsTableProps {
  scenarios: string[]
  scenarioResults: Record<string, ScenarioResult>
}

export default function ResultsMetricsTable({
  scenarios,
  scenarioResults,
}: ResultsMetricsTableProps) {
  const hasCommercial = scenarios.some(
    (s) => (scenarioResults[s]?.commercial?.total_commercial_value_usd ?? 0) > 0,
  )

  return (
    <div className={`${CARD} overflow-hidden`}>
      <table className="w-full text-xs">
        <thead className="bg-[#F2F2F2]">
          <tr>
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
              Metric
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
            <td className="px-3 py-2 font-medium text-[#9EB3A8]">
              Final Portfolio Value{' '}
              {hasCommercial && <span className="text-[10px] text-[#E8A838]">(Net)</span>}
            </td>
            {scenarios.map((s) => (
              <td key={s} className="px-3 py-2 font-mono text-[#0E0F0F]">
                {formatUSD(scenarioResults[s]?.aggregated?.metrics?.final_portfolio_usd || 0)}
              </td>
            ))}
          </tr>
          {hasCommercial && (
            <tr className="bg-[#F2F2F2]/50">
              <td className="px-3 py-2 font-medium text-[#9EB3A8]">
                Final Portfolio Value <span className="text-[10px]">(Gross)</span>
              </td>
              {scenarios.map((s) => (
                <td key={s} className="px-3 py-2 font-mono text-[#9EB3A8]">
                  {formatUSD(
                    scenarioResults[s]?.aggregated?.metrics?.gross_final_portfolio_usd || 0,
                  )}
                </td>
              ))}
            </tr>
          )}
          <tr>
            <td className="px-3 py-2 font-medium text-[#9EB3A8]">
              Total Return{' '}
              {hasCommercial && <span className="text-[10px] text-[#E8A838]">(Net)</span>}
            </td>
            {scenarios.map((s) => {
              const pct = scenarioResults[s]?.aggregated?.metrics?.total_return_pct || 0
              return (
                <td
                  key={s}
                  className={`px-3 py-2 font-mono ${pct >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatPercent(pct)}
                </td>
              )
            })}
          </tr>
          {hasCommercial && (
            <tr className="bg-[#F2F2F2]/50">
              <td className="px-3 py-2 font-medium text-[#9EB3A8]">
                Total Return <span className="text-[10px]">(Gross)</span>
              </td>
              {scenarios.map((s) => {
                const pct = scenarioResults[s]?.aggregated?.metrics?.gross_total_return_pct || 0
                return (
                  <td key={s} className="px-3 py-2 font-mono text-[#9EB3A8]">
                    {formatPercent(pct)}
                  </td>
                )
              })}
            </tr>
          )}
          <tr>
            <td className="px-3 py-2 font-medium text-[#9EB3A8]">Capital Preservation</td>
            {scenarios.map((s) => {
              const ratio = scenarioResults[s]?.aggregated?.metrics?.capital_preservation_ratio || 0
              return (
                <td
                  key={s}
                  className={`px-3 py-2 font-mono ${ratio >= 1 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatNumber(ratio, 2)}x
                </td>
              )
            })}
          </tr>
          <tr>
            <td className="px-3 py-2 font-medium text-[#9EB3A8]">Effective APR</td>
            {scenarios.map((s) => (
              <td key={s} className="px-3 py-2 font-mono text-[#0E0F0F]">
                {formatPercent(scenarioResults[s]?.aggregated?.metrics?.effective_apr || 0)}
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-3 py-2 font-medium text-[#9EB3A8]">Total Yield Paid</td>
            {scenarios.map((s) => (
              <td key={s} className="px-3 py-2 font-mono text-[#0E0F0F]">
                {formatUSD(scenarioResults[s]?.aggregated?.metrics?.total_yield_paid_usd || 0)}
              </td>
            ))}
          </tr>
          {hasCommercial && (
            <tr className="bg-amber-50">
              <td className="px-3 py-2 font-medium text-[#E8A838]">Commercial Fees (Total)</td>
              {scenarios.map((s) => (
                <td key={s} className="px-3 py-2 font-mono text-[#E8A838]">
                  {formatUSD(scenarioResults[s]?.commercial?.total_commercial_value_usd || 0)}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
