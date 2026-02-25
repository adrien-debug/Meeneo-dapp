'use client'

import { fmtPercent, fmtUsd } from '@/config/mock-data'

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  const sorted = [...payload].sort((a, b) => b.value - a.value)

  return (
    <div className="bg-white/95 backdrop-blur-md border border-[#9EB3A8]/15 text-[#0E0F0F] px-4 py-3 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] text-xs min-w-[180px]">
      <p className="font-semibold text-[#9EB3A8] mb-2.5 pb-1.5 border-b border-[#9EB3A8]/10 text-[10px] uppercase tracking-wider">
        {label}
      </p>
      <div className="space-y-1.5">
        {sorted.map((p, i) => {
          const isPositive = p.value >= 0
          return (
            <div key={i} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <span className="font-medium text-[#9EB3A8]">{p.name}</span>
              </span>
              <span
                className={`font-black tabular-nums ${isPositive ? 'text-[#0E0F0F]' : 'text-[#E85D5D]'}`}
              >
                {isPositive ? '+' : ''}
                {fmtPercent(p.value)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AdminTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-md border border-[#9EB3A8]/15 text-[#0E0F0F] px-4 py-3 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] text-xs">
      <p className="font-semibold text-[#9EB3A8] mb-1">{label}</p>
      <p className="font-black text-sm">{fmtUsd(payload[0].value)}</p>
    </div>
  )
}
