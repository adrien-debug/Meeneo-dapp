'use client'

import { CARD } from '@/components/ui/constants'
import { formatBTC, formatUSD } from '@/lib/sim-utils'
import type { ScenarioResult } from '@/types/simulation'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import BtcMgmtMonthlyTable from './BtcMgmtMonthlyTable'
import { AXIS_TICK, GRID_PROPS, SCENARIO_COLORS, SCENARIO_LABELS, TOOLTIP_STYLE } from './constants'

interface ResultsBtcManagementProps {
  scenarios: string[]
  scenarioResults: Record<string, ScenarioResult>
  activeScenario: string
  selectedRunId: string
  onScenarioChange: (s: string) => void
}

export default function ResultsBtcManagement({
  scenarios,
  scenarioResults,
  activeScenario,
  selectedRunId,
  onScenarioChange,
}: ResultsBtcManagementProps) {
  const btcMgmt: any[] = scenarioResults[activeScenario]?.aggregated?.btc_under_management || []
  const btcMgmtMetrics: any =
    scenarioResults[activeScenario]?.aggregated?.btc_under_management_metrics || {}
  const holdingMetrics: any = scenarioResults[activeScenario]?.btc_holding_bucket?.metrics || {}

  const strikeMonth = btcMgmtMetrics.holding_strike_month

  const btcQtyChartData = btcMgmt.map((m: any) => ({
    month: m.month,
    'Holding BTC': m.holding_btc,
    'Mining Cap BTC': m.mining_cap_btc,
    'Total BTC': m.total_btc,
    'Strike Event': m.holding_strike_this_month ? m.total_btc : null,
  }))

  const btcValueChartData = btcMgmt.map((m: any) => ({
    month: m.month,
    'Holding Value': m.holding_value_usd,
    'Mining Cap Value': m.mining_cap_value_usd,
    'Total Value': m.total_value_usd,
    'BTC Price': m.btc_price_usd,
  }))

  const appreciationChartData = btcMgmt.map((m: any) => ({
    month: m.month,
    'Appreciation ($)': m.holding_appreciation_usd,
    'Appreciation (%)': m.holding_appreciation_pct,
  }))

  return (
    <div className="space-y-5">
      {/* Scenario Picker */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex gap-1">
          {scenarios.map((s) => (
            <button
              key={s}
              onClick={() => onScenarioChange(s)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors uppercase ${
                activeScenario === s
                  ? 'bg-[#96EA7A] text-[#0E0F0F]'
                  : 'bg-white text-[#9EB3A8] hover:bg-[#E6F1E7]'
              }`}
              style={
                activeScenario === s
                  ? {
                      borderBottom: `2px solid ${SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS]}`,
                    }
                  : undefined
              }
            >
              {SCENARIO_LABELS[s] || s}
            </button>
          ))}
        </div>
        <div className="text-xs text-[#9EB3A8]">
          BTC held across all buckets appreciates in $ value as BTC price increases
        </div>
      </div>

      {/* Explainer Box */}
      <div className={`${CARD} p-4`}>
        <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-2 tracking-wider">
          How BTC Under Management Works
        </h3>
        <div className="text-[11px] text-[#9EB3A8] space-y-1 leading-relaxed">
          <p>
            This view tracks all BTC held across the product, showing how its $ value appreciates
            over time:
          </p>
          <ol className="list-decimal list-inside space-y-0.5 pl-2">
            <li>
              <span className="text-cyan-600 font-medium">BTC Holding Bucket</span> — BTC purchased
              for capital reconstitution (held until target price is struck)
            </li>
            <li>
              <span className="text-[#E8A838] font-medium">Mining Capitalization</span> — Surplus
              BTC accumulated from mining after OPEX and yield
            </li>
          </ol>
          <p className="mt-2">
            When the target price is <span className="text-green-600 font-medium">struck</span>, BTC
            from the Holding bucket is sold for capital reconstitution. The remaining BTC (mining
            capitalization) continues to appreciate.
          </p>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-cyan-400/30 rounded-xl p-4 bg-cyan-50">
          <div className="text-[10px] text-[#9EB3A8] uppercase mb-1 tracking-wider">
            Total BTC Under Management
          </div>
          <div className="text-lg font-bold text-[#0E0F0F]">
            {formatBTC(btcMgmtMetrics.final_total_btc || 0)}
          </div>
          <div className="text-xs text-[#9EB3A8]">
            {formatUSD(btcMgmtMetrics.final_total_value_usd || 0)}
          </div>
        </div>
        <div className="border border-cyan-400/30 rounded-xl p-4 bg-cyan-50">
          <div className="text-[10px] text-[#9EB3A8] uppercase mb-1 tracking-wider">
            Peak BTC Value
          </div>
          <div className="text-lg font-bold text-green-600">
            {formatUSD(btcMgmtMetrics.peak_btc_value_usd || 0)}
          </div>
          <div className="text-xs text-[#9EB3A8]">
            {formatBTC(btcMgmtMetrics.peak_btc_qty || 0)} BTC
          </div>
        </div>
        <div className="border border-cyan-400/30 rounded-xl p-4 bg-cyan-50">
          <div className="text-[10px] text-[#9EB3A8] uppercase mb-1 tracking-wider">
            Holding Target
          </div>
          {btcMgmtMetrics.holding_target_struck ? (
            <>
              <div className="text-lg font-bold text-green-600">Struck</div>
              <div className="text-xs text-[#9EB3A8]">
                Month {btcMgmtMetrics.holding_strike_month} @{' '}
                {formatUSD(btcMgmtMetrics.holding_strike_price_usd || 0)}
              </div>
            </>
          ) : (
            <>
              <div className="text-lg font-bold text-[#E8A838]">Pending</div>
              <div className="text-xs text-[#9EB3A8]">
                Target: {formatUSD(holdingMetrics.target_sell_price_usd || 0)}
              </div>
            </>
          )}
        </div>
        <div className="border border-[#E8A838]/30 rounded-xl p-4 bg-amber-50">
          <div className="text-[10px] text-[#9EB3A8] uppercase mb-1 tracking-wider">
            Mining BTC Accumulated
          </div>
          <div className="text-lg font-bold text-[#E8A838]">
            {formatBTC(btcMgmtMetrics.mining_total_btc_accumulated || 0)}
          </div>
          <div className="text-xs text-[#9EB3A8]">From capitalization</div>
        </div>
      </div>

      {/* BTC Quantity Over Time */}
      <div className={`${CARD} p-4`}>
        <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">
          BTC Quantity Under Management Over Time
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={btcQtyChartData}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_TICK} />
            <YAxis
              tick={AXIS_TICK}
              tickFormatter={(v) => v.toFixed(2)}
              label={{
                value: 'BTC',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 10, fill: '#9EB3A8' },
              }}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v?: number, name?: string) => [formatBTC(v ?? 0), name ?? '']}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Area
              type="monotone"
              dataKey="Holding BTC"
              stackId="1"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.3}
              name="Holding Bucket"
            />
            <Area
              type="monotone"
              dataKey="Mining Cap BTC"
              stackId="1"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.3}
              name="Mining Capitalization"
            />
            <Line
              type="monotone"
              dataKey="Total BTC"
              stroke="#0E0F0F"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              name="Total BTC"
            />
            {strikeMonth !== null && strikeMonth !== undefined && (
              <Line
                type="monotone"
                dataKey="Strike Event"
                stroke="#22c55e"
                strokeWidth={0}
                dot={{ r: 8, fill: '#22c55e', stroke: '#ffffff', strokeWidth: 2 }}
                name="Price Strike"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-[#9EB3A8] mt-1">
          Stacked areas show BTC held in each bucket.{' '}
          {strikeMonth !== null && strikeMonth !== undefined && (
            <span className="text-green-600">
              Green dot marks when the holding target was struck and BTC sold.
            </span>
          )}
        </p>
      </div>

      {/* USD Value Over Time */}
      <div className={`${CARD} p-4`}>
        <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">
          $ Value Appreciation Over Time
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={btcValueChartData}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_TICK} />
            <YAxis
              yAxisId="usd"
              tick={AXIS_TICK}
              tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              tick={AXIS_TICK}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v?: number, name?: string) => [
                (name ?? '').includes('Price') ? formatUSD(v ?? 0) : formatUSD(v ?? 0),
                name ?? '',
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Area
              yAxisId="usd"
              type="monotone"
              dataKey="Holding Value"
              stackId="1"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.3}
              name="Holding Value ($)"
            />
            <Area
              yAxisId="usd"
              type="monotone"
              dataKey="Mining Cap Value"
              stackId="1"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.3}
              name="Mining Cap Value ($)"
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="BTC Price"
              stroke="#a855f7"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              name="BTC Price (right axis)"
            />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-[#9EB3A8] mt-1">
          As BTC price (purple line) increases, the $ value of BTC held appreciates. This creates
          yield-generating capability beyond the initial investment.
        </p>
      </div>

      {/* Holding Bucket Appreciation */}
      {holdingMetrics.btc_quantity > 0 && (
        <div className={`${CARD} p-4`}>
          <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">
            Holding Bucket Appreciation (vs Purchase Price)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={appreciationChartData}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="month" tick={AXIS_TICK} />
              <YAxis
                yAxisId="usd"
                tick={AXIS_TICK}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="pct"
                orientation="right"
                tick={AXIS_TICK}
                tickFormatter={(v) => `${v.toFixed(0)}%`}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v?: number, name?: string) => [
                  (name ?? '').includes('%') ? `${(v ?? 0).toFixed(1)}%` : formatUSD(v ?? 0),
                  name ?? '',
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar
                yAxisId="usd"
                dataKey="Appreciation ($)"
                fill="#22c55e"
                opacity={0.7}
                name="Unrealized Gain ($)"
              />
              <Line
                yAxisId="pct"
                type="monotone"
                dataKey="Appreciation (%)"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                name="Gain (%)"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-[#9EB3A8] mt-1">
            Shows how much the holding bucket BTC has appreciated compared to the purchase price of{' '}
            {formatUSD(holdingMetrics.buying_price_usd || 0)}/BTC.
          </p>
        </div>
      )}

      {/* Monthly Detail Table */}
      <BtcMgmtMonthlyTable
        btcMgmt={btcMgmt}
        activeScenario={activeScenario}
        selectedRunId={selectedRunId}
      />
    </div>
  )
}
