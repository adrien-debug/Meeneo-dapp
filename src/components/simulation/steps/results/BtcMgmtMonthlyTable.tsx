import { CARD } from '@/components/ui/constants'
import { exportAsCSV, formatBTC, formatUSD } from '@/lib/sim-utils'
import { SCENARIO_LABELS } from './constants'

interface BtcMgmtMonthlyTableProps {
  btcMgmt: any[]
  activeScenario: string
  selectedRunId: string
}

export default function BtcMgmtMonthlyTable({
  btcMgmt,
  activeScenario,
  selectedRunId,
}: BtcMgmtMonthlyTableProps) {
  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#F2F2F2] border-b border-[#9EB3A8]/10">
        <span className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider">
          Monthly BTC Under Management — {SCENARIO_LABELS[activeScenario] || activeScenario}
        </span>
        <div className="flex gap-3">
          <button
            className="text-[11px] text-[#9EB3A8] hover:text-[#96EA7A] transition-colors font-medium"
            onClick={() =>
              exportAsCSV(
                btcMgmt,
                `btc-under-management-${activeScenario}-${selectedRunId.slice(0, 8)}.csv`,
              )
            }
          >
            CSV
          </button>
        </div>
      </div>
      <div className="overflow-auto" style={{ maxHeight: '400px' }}>
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-[#F2F2F2] shadow-sm">
            <tr>
              <th className="sticky left-0 z-10 bg-[#F2F2F2] px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
                Mo
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
                BTC Price
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="BTC in holding bucket (for capital reconstitution)"
              >
                Holding BTC
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="USD value of holding bucket BTC"
              >
                Holding $
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="BTC accumulated from mining capitalization"
              >
                Mining BTC
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="USD value of mining capitalization"
              >
                Mining $
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="Total BTC under management"
              >
                Total BTC
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="Total USD value"
              >
                Total $
              </th>
              <th
                className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"
                title="Holding bucket status"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#9EB3A8]/5">
            {btcMgmt.map((m: any) => {
              const isStrikeMonth = m.holding_strike_this_month
              const isSold = m.holding_sold
              const rowClass = isStrikeMonth ? 'bg-green-50' : ''
              return (
                <tr key={m.month} className={`${rowClass} hover:bg-[#F2F2F2]/50 transition-colors`}>
                  <td
                    className={`sticky left-0 z-10 px-3 py-1.5 font-semibold ${isStrikeMonth ? 'bg-green-50' : 'bg-white'}`}
                  >
                    {m.month}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[#0E0F0F]">
                    {formatUSD(m.btc_price_usd)}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-cyan-600">
                    {formatBTC(m.holding_btc)}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[#0E0F0F]">
                    {formatUSD(m.holding_value_usd)}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[#E8A838]">
                    {formatBTC(m.mining_cap_btc)}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[#0E0F0F]">
                    {formatUSD(m.mining_cap_value_usd)}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-[#0E0F0F] font-semibold">
                    {formatBTC(m.total_btc)}
                  </td>
                  <td className="px-3 py-1.5 font-mono font-semibold text-[#0E0F0F]">
                    {formatUSD(m.total_value_usd)}
                  </td>
                  <td className="px-3 py-1.5">
                    {isStrikeMonth ? (
                      <span className="text-green-600 font-semibold">STRUCK</span>
                    ) : isSold ? (
                      <span className="text-[#9EB3A8]">Sold</span>
                    ) : (
                      <span className="text-cyan-600">Active</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-[#F2F2F2] border-t border-[#9EB3A8]/10 text-[10px] text-[#9EB3A8]">
        <span className="text-cyan-600">Holding BTC</span> = BTC for capital reconstitution
        &nbsp;|&nbsp;
        <span className="text-[#E8A838]">Mining BTC</span> = Capitalization from mining surplus
        &nbsp;|&nbsp;
        <span className="text-green-600">STRUCK</span> = Target price hit, BTC sold
      </div>
    </div>
  )
}
