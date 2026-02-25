'use client'

import { CARD } from '@/components/ui/constants'
import { fmtUsd } from '@/config/mock-data'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { StrategyAllocationEntry } from './types'

interface StrategyBreakdownProps {
  data: StrategyAllocationEntry[]
}

export function StrategyBreakdown({ data }: StrategyBreakdownProps) {
  return (
    <div className={`${CARD} flex flex-col overflow-hidden`}>
      <div className="px-5 pt-5 pb-0">
        <h3 className="card-title mb-0.5">Strategy Breakdown</h3>
        <p className="text-caption text-[var(--muted)]">Allocation by strategy</p>
      </div>

      <div className="flex items-center justify-center py-4">
        <div className="w-[120px] h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={36}
                outerRadius={56}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="px-5 pb-5 flex-1">
        <div className="space-y-2.5">
          {data.map((s) => (
            <div key={s.type} className="flex items-center gap-2.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-xs text-[#0E0F0F] font-medium flex-1 truncate">{s.name}</span>
              <span className="text-xs font-bold text-[#0E0F0F] tabular-nums">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
