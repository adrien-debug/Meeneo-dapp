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
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AXIS_TICK, GRID_PROPS, SCENARIO_COLORS, SCENARIO_LABELS, TOOLTIP_STYLE } from './constants'
import WaterfallMonthlyTable from './WaterfallMonthlyTable'

interface ResultsWaterfallProps {
  scenarios: string[]
  scenarioResults: Record<string, ScenarioResult>
  activeScenario: string
  selectedRunId: string
  onScenarioChange: (s: string) => void
}

export default function ResultsWaterfall({
  scenarios,
  scenarioResults,
  activeScenario,
  selectedRunId,
  onScenarioChange,
}: ResultsWaterfallProps) {
  const waterfall: any[] = scenarioResults[activeScenario]?.mining_bucket?.monthly_waterfall || []
  const decision = scenarioResults[activeScenario]?.aggregated?.decision || 'PENDING'
  const reasons = scenarioResults[activeScenario]?.aggregated?.decision_reasons || []
  const holdingSellMonth = scenarioResults[activeScenario]?.btc_holding_bucket?.metrics?.sell_month
  const totalMonths = waterfall.length
  const redMonths = waterfall.filter((m: any) => m.flag === 'RED').length
  const greenMonths = totalMonths - redMonths

  const btcAllocationData = waterfall.map((m: any) => ({
    month: m.month,
    OPEX: m.btc_sell_opex,
    Yield: m.btc_for_yield || 0,
    Capitalization: m.btc_to_capitalization || 0,
    'Total Produced': m.btc_produced,
  }))

  const capitalizationData = waterfall.map((m: any) => ({
    month: m.month,
    'Capitalization (USD)': m.capitalization_usd || 0,
    'Capitalization (BTC)': m.capitalization_btc || 0,
  }))

  const healthData = waterfall.map((m: any) => ({
    month: m.month,
    'Health Score': m.health_score,
    'OPEX Coverage': Math.min((m.opex_coverage_ratio || 0) * 100, 300),
    'Yield Fulfillment': Math.min((m.yield_fulfillment || 0) * 100, 200),
  }))

  return (
    <div className="space-y-5">
      {/* Scenario Picker + Summary */}
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
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span
            className={`font-bold ${decision === 'APPROVED' ? 'text-green-600' : decision === 'ADJUST' ? 'text-[#E8A838]' : 'text-red-600'}`}
          >
            {decision}
          </span>
          <span className="text-[#9EB3A8]">|</span>
          <span className="text-[#9EB3A8]">
            <span className="text-red-600 font-semibold">{redMonths}</span> deficit /{' '}
            <span className="text-green-600 font-semibold">{greenMonths}</span> healthy out of{' '}
            {totalMonths} months
          </span>
          <span className="text-[#9EB3A8]">|</span>
          <span className="text-[#9EB3A8]">{reasons.join('; ')}</span>
          {holdingSellMonth != null && (
            <>
              <span className="text-[#9EB3A8]">|</span>
              <span className="text-[#96EA7A] font-medium">
                Yield cap bumped to 12% at month {holdingSellMonth}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Waterfall Logic Explainer */}
      <div className={`${CARD} p-4`}>
        <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-2 tracking-wider">
          How the Monthly Waterfall Works
        </h3>
        <div className="text-[11px] text-[#9EB3A8] space-y-1 leading-relaxed">
          <p>
            Each month, BTC is produced by the mining fleet and allocated in strict priority order:
          </p>
          <ol className="list-decimal list-inside space-y-0.5 pl-2">
            <li>
              <span className="text-orange-600 font-medium">OPEX</span> — Sell BTC to cover
              electricity, hosting, and maintenance costs
            </li>
            <li>
              <span className="text-green-600 font-medium">Yield</span> — Distribute surplus as
              yield, capped at <span className="text-[#0E0F0F] font-semibold">8% APR</span> (base)
              or <span className="text-[#0E0F0F] font-semibold">12% APR</span> (once BTC holding
              target is hit)
            </li>
            <li>
              <span className="text-cyan-600 font-medium">Capitalization</span> — Remaining BTC
              builds the capitalization / upside bucket
            </li>
          </ol>
          <p className="mt-2">
            A month is <span className="text-red-600 font-medium">DEFICIT (RED)</span> if BTC
            produced {'<'} 95% of OPEX requirements. If {'>'} 20% of months are deficit, the product
            is <span className="text-red-600 font-medium">BLOCKED</span>.
          </p>
          <p>
            <span className="text-[#96EA7A] font-medium">Capital reconstitution</span> is handled by
            the BTC Holding bucket when the target price is hit, not by mining.
          </p>
        </div>
      </div>

      {/* BTC Allocation Stacked Bar */}
      <div className={`${CARD} p-4`}>
        <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">
          Monthly BTC Allocation Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={btcAllocationData}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_TICK} />
            <YAxis
              tick={AXIS_TICK}
              tickFormatter={(v) => v.toFixed(4)}
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
            <Bar dataKey="OPEX" stackId="alloc" fill="#f97316" opacity={0.8} name="OPEX" />
            <Bar
              dataKey="Yield"
              stackId="alloc"
              fill="#22c55e"
              opacity={0.8}
              name="Yield Distributed"
            />
            <Bar
              dataKey="Capitalization"
              stackId="alloc"
              fill="#06b6d4"
              opacity={0.8}
              name="Capitalization"
            />
            <Line
              type="monotone"
              dataKey="Total Produced"
              stroke="#0E0F0F"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              name="BTC Produced"
            />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-[#9EB3A8] mt-1">
          Dashed line = total BTC produced. Stacked bars = how it was allocated. When bars fall
          short of the line, the month is in deficit.
        </p>
      </div>

      {/* Capitalization Over Time */}
      <div className={`${CARD} p-4`}>
        <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">
          Capitalization Bucket Value
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={capitalizationData}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_TICK} />
            <YAxis
              yAxisId="usd"
              tick={AXIS_TICK}
              tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
            />
            <YAxis
              yAxisId="btc"
              orientation="right"
              tick={AXIS_TICK}
              tickFormatter={(v) => `${v.toFixed(2)} BTC`}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v?: number, name?: string) => [
                (name ?? '').includes('USD') ? formatUSD(v ?? 0) : formatBTC(v ?? 0),
                name ?? '',
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Area
              yAxisId="usd"
              type="monotone"
              dataKey="Capitalization (USD)"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Line
              yAxisId="btc"
              type="monotone"
              dataKey="Capitalization (BTC)"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Health Score & OPEX Coverage */}
      <div className={`${CARD} p-4`}>
        <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">
          Health Score, OPEX Coverage & Yield Fulfillment
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={healthData}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_TICK} />
            <YAxis
              domain={[0, 'auto']}
              tick={AXIS_TICK}
              tickFormatter={(v) => `${v}`}
              label={{
                value: '% / Score',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 10, fill: '#9EB3A8' },
              }}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v?: number, name?: string) => [
                `${(v ?? 0).toFixed(1)}${name === 'Health Score' ? '/100' : '%'}`,
                name ?? '',
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="Health Score"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="OPEX Coverage"
              stroke="#f97316"
              strokeWidth={1.5}
              dot={false}
              name="OPEX Coverage (%)"
            />
            <Line
              type="monotone"
              dataKey="Yield Fulfillment"
              stroke="#22c55e"
              strokeWidth={1.5}
              dot={false}
              name="Yield Fulfillment (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Full Monthly Table */}
      <WaterfallMonthlyTable
        waterfall={waterfall}
        activeScenario={activeScenario}
        selectedRunId={selectedRunId}
      />
    </div>
  )
}
