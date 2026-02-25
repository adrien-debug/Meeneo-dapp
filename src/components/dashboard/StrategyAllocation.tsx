'use client'

import { CARD, STRATEGY_ICONS } from '@/components/ui/constants'
import { fmtUsd } from '@/config/mock-data'
import Image from 'next/image'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { StrategyAllocationEntry } from './types'

interface StrategyAllocationProps {
  data: StrategyAllocationEntry[]
}

export function StrategyAllocation({ data }: StrategyAllocationProps) {
  return (
    <div className={`col-span-12 lg:col-span-5 ${CARD} px-6 pt-6 pb-6 flex flex-col`}>
      <div className="flex items-start justify-between mb-5">
        <h2 className="card-title">Strategy Allocation</h2>
        <div className="w-[72px] h-[72px] shrink-0 relative -mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={22}
                outerRadius={34}
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
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image src="/assets/tokens/hearst-logo.svg" alt="Hearst logo" width={14} height={14} />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-0">
        {data.map((s, idx) => {
          const isEven = idx % 2 === 1
          return (
            <div
              key={s.type}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 -mx-1 ${isEven ? 'bg-[#F2F2F2]/50' : ''}`}
            >
              <Image
                src={STRATEGY_ICONS[s.type] ?? ''}
                alt={s.name}
                width={20}
                height={20}
                className="rounded-full shrink-0"
              />
              <span className="text-sm text-[#0E0F0F] flex-1 text-left font-medium">{s.name}</span>
              <div className="flex items-center gap-3">
                <div className="w-16 h-1.5 rounded-full bg-[#F2F2F2] overflow-hidden hidden sm:block">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                  />
                </div>
                <span className="text-base font-black text-[#0E0F0F] w-12 text-right">
                  {s.pct}%
                </span>
                <span className="text-sm text-[var(--muted)] w-[90px] text-right hidden sm:block">
                  {fmtUsd(s.value)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
