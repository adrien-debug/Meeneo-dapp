import { CARD } from '@/components/ui/constants'
import {
  exportAsCSV,
  exportAsJSON,
  formatBTC,
  formatNumber,
  formatPercent,
  formatUSD,
} from '@/lib/sim-utils'
import { SCENARIO_LABELS } from './constants'

interface WaterfallMonthlyTableProps {
  waterfall: any[]
  activeScenario: string
  selectedRunId: string
}

export default function WaterfallMonthlyTable({
  waterfall,
  activeScenario,
  selectedRunId,
}: WaterfallMonthlyTableProps) {
  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#F2F2F2] border-b border-[#9EB3A8]/10">
        <span className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider">
          Month-by-Month Waterfall — {SCENARIO_LABELS[activeScenario] || activeScenario}
        </span>
        <div className="flex gap-3">
          <button
            className="text-[11px] text-[#9EB3A8] hover:text-[#96EA7A] transition-colors font-medium"
            onClick={() =>
              exportAsCSV(waterfall, `waterfall-${activeScenario}-${selectedRunId.slice(0, 8)}.csv`)
            }
          >
            CSV
          </button>
          <button
            className="text-[11px] text-[#9EB3A8] hover:text-[#96EA7A] transition-colors font-medium"
            onClick={() =>
              exportAsJSON(
                waterfall,
                `waterfall-${activeScenario}-${selectedRunId.slice(0, 8)}.json`,
              )
            }
          >
            JSON
          </button>
        </div>
      </div>
      <div className="overflow-auto" style={{ maxHeight: '600px' }}>
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-[#F2F2F2] shadow-sm">
            <tr>
              <th className="sticky left-0 z-10 bg-[#F2F2F2] px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
                Mo
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
                Flag
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
                BTC Price
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="Total BTC produced by mining fleet"
              >
                BTC Produced
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="BTC sold to cover OPEX"
              >
                BTC→OPEX
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="BTC sold/distributed as yield"
              >
                BTC→Yield
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="BTC sent to capitalization bucket"
              >
                BTC→Cap
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="Total operating expenses in USD"
              >
                OPEX (USD)
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="Yield distributed to investors this month"
              >
                Yield (USD)
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="Applied yield APR for this month"
              >
                APR
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="Take-profit ladder sales from capitalization"
              >
                TP Sold
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="Cumulative capitalization bucket in BTC"
              >
                Cap BTC
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="Capitalization bucket mark-to-market value"
              >
                Cap USD
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="OPEX coverage ratio"
              >
                OPEX Cov.
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="Yield fulfillment ratio"
              >
                Yield Fill
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="Portfolio health score (0-100)"
              >
                Health
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#9EB3A8]/5">
            {waterfall.map((m: any) => {
              const isDeficit = m.flag === 'RED'
              const isBonusApr = (m.yield_apr_applied || 0) > 0.09
              const rowClass = isDeficit ? 'bg-red-50' : ''
              return (
                <tr key={m.month} className={`${rowClass} hover:bg-[#F2F2F2]/50 transition-colors`}>
                  <td
                    className={`sticky left-0 z-10 px-3 py-1.5 font-semibold text-[#0E0F0F] ${isDeficit ? 'bg-red-50' : 'bg-white'}`}
                  >
                    {m.month}
                  </td>
                  <td className="px-3 py-1.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-1 ${isDeficit ? 'bg-red-500' : 'bg-green-500'}`}
                    />
                    <span
                      className={`font-semibold ${isDeficit ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {m.flag}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[#0E0F0F]">
                    {formatUSD(m.btc_price_usd)}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[#0E0F0F] font-semibold">
                    {formatBTC(m.btc_produced)}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-orange-600">
                    {formatBTC(m.btc_sell_opex)}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-green-600">
                    {formatBTC(m.btc_for_yield || 0)}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-cyan-600">
                    {formatBTC(m.btc_to_capitalization || 0)}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[#0E0F0F]">{formatUSD(m.opex_usd)}</td>
                  <td
                    className={`px-3 py-1.5 font-mono ${m.yield_paid_usd > 0 ? 'text-green-600' : 'text-[#9EB3A8]'}`}
                  >
                    {formatUSD(m.yield_paid_usd)}
                  </td>
                  <td
                    className={`px-3 py-1.5 font-mono ${isBonusApr ? 'text-[#96EA7A] font-semibold' : 'text-[#9EB3A8]'}`}
                  >
                    {formatPercent(m.yield_apr_applied || 0)}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[#0E0F0F]">
                    {formatUSD(m.take_profit_sold_usd)}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-cyan-600">
                    {formatBTC(m.capitalization_btc || 0)}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[#0E0F0F]">
                    {formatUSD(m.capitalization_usd || 0)}
                  </td>
                  <td
                    className={`px-3 py-1.5 font-mono ${(m.opex_coverage_ratio || 0) >= 1.5 ? 'text-green-600' : (m.opex_coverage_ratio || 0) >= 1.0 ? 'text-[#E8A838]' : 'text-red-600'}`}
                  >
                    {formatNumber(m.opex_coverage_ratio || 0, 2)}x
                  </td>
                  <td
                    className={`px-3 py-1.5 font-mono ${(m.yield_fulfillment || 0) >= 1.0 ? 'text-green-600' : (m.yield_fulfillment || 0) >= 0.5 ? 'text-[#E8A838]' : 'text-red-600'}`}
                  >
                    {formatPercent(m.yield_fulfillment || 0)}
                  </td>
                  <td
                    className={`px-3 py-1.5 font-mono font-semibold ${m.health_score >= 60 ? 'text-green-600' : m.health_score >= 40 ? 'text-[#E8A838]' : 'text-red-600'}`}
                  >
                    {formatNumber(m.health_score, 1)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-[#F2F2F2] border-t border-[#9EB3A8]/10 text-[10px] text-[#9EB3A8]">
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1 align-middle" /> RED =
        Deficit month (BTC produced {'<'} 95% of OPEX) &nbsp;
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 align-middle" /> GREEN
        = OPEX covered, yield + capitalization distributed &nbsp;|&nbsp; Threshold: {'>'} 20% RED
        months → BLOCKED &nbsp;|&nbsp;
        <span className="text-[#96EA7A] font-medium">Green APR</span> = bonus yield active (BTC
        holding target hit)
      </div>
    </div>
  )
}
