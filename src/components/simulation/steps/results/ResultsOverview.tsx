'use client'

import { CARD } from '@/components/ui/constants'
import { formatUSD } from '@/lib/sim-utils'
import {
  Area,
  AreaChart,
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

interface ResultsOverviewProps {
  scenarios: string[]
  portfolioChartData: any[]
}

export default function ResultsOverview({ scenarios, portfolioChartData }: ResultsOverviewProps) {
  return (
    <div className="space-y-4">
      <div className={`${CARD} p-4`}>
        <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">
          Portfolio Value Comparison
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={portfolioChartData}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v?: number) => formatUSD(v ?? 0)} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {scenarios.map((s) => (
              <Line
                key={s}
                type="monotone"
                dataKey={`${s}_total`}
                stroke={SCENARIO_COLORS[s as keyof typeof SCENARIO_COLORS]}
                strokeWidth={s === 'base' ? 2 : 1.5}
                strokeDasharray={s === 'base' ? undefined : '5 3'}
                dot={false}
                name={`${SCENARIO_LABELS[s]} Total`}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={`${CARD} p-4`}>
        <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3 tracking-wider">
          Bucket Breakdown (Base Scenario)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={portfolioChartData}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v?: number) => formatUSD(v ?? 0)} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Area
              type="monotone"
              dataKey="base_yield"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
              name="Yield Liquidity"
            />
            <Area
              type="monotone"
              dataKey="base_holding"
              stackId="1"
              stroke="#4ade80"
              fill="#4ade80"
              fillOpacity={0.3}
              name="BTC Holding"
            />
            <Area
              type="monotone"
              dataKey="base_mining"
              stackId="1"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.3}
              name="BTC Mining"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
