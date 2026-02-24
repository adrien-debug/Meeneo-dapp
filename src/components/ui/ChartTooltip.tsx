'use client'

import { fmtPercent, fmtUsd } from '@/config/mock-data'

export function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#9EB3A8]/20 text-[#0E0F0F] px-4 py-3 rounded-xl shadow-xl text-xs backdrop-blur-sm">
      <p className="font-semibold text-[#9EB3A8] mb-2 pb-1.5 border-b border-[#9EB3A8]/10">{label}</p>
      <div className="space-y-1">
        {payload.map((p, i) => (
          <p key={i} className="font-bold flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="font-medium text-[#9EB3A8]">{p.name}</span>
            </span>
            <span>{fmtPercent(p.value)}</span>
          </p>
        ))}
      </div>
    </div>
  )
}

export function AdminTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#9EB3A8]/20 text-[#0E0F0F] px-4 py-3 rounded-xl shadow-xl text-xs backdrop-blur-sm">
      <p className="font-semibold text-[#9EB3A8] mb-1">{label}</p>
      <p className="font-black text-sm">{fmtUsd(payload[0].value)}</p>
    </div>
  )
}
