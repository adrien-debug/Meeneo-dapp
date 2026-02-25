'use client'

import { useDemo } from '@/context/demo-context'
import { fmtUsd } from '@/config/mock-data'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'

const DAY = 86400
const MONTH = 30 * DAY
const YEAR = 365 * DAY

const TIME_STEPS = [
  { label: '1D', seconds: DAY },
  { label: '1W', seconds: 7 * DAY },
  { label: '1M', seconds: MONTH },
  { label: '6M', seconds: 6 * MONTH },
  { label: '1Y', seconds: YEAR },
  { label: '2Y', seconds: 2 * YEAR },
  { label: '3Y', seconds: 3 * YEAR },
] as const

export function DemoPanel() {
  const { state, vaults, deposits, skipTime, reset, isDemoMode, exitDemoMode } = useDemo()
  const [collapsed, setCollapsed] = useState(true)
  const pathname = usePathname()

  const totalDeposited = useMemo(() => deposits.reduce((s, d) => s + d.amount, 0), [deposits])
  const totalYield = useMemo(
    () => deposits.reduce((s, d) => s + d.claimedYield + d.pendingYield, 0),
    [deposits],
  )

  if (pathname === '/login' || pathname === '/') return null

  const offsetDays = Math.round(state.timeOffsetSeconds / DAY)
  const offsetLabel =
    offsetDays >= 365
      ? `${(offsetDays / 365).toFixed(1)}y`
      : offsetDays >= 30
        ? `${Math.round(offsetDays / 30)}mo`
        : `${offsetDays}d`

  const roi = totalDeposited > 0 ? ((totalYield / totalDeposited) * 100).toFixed(1) : '0.0'

  // Collapsed: tiny pill bottom-right
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-[9999] flex items-center gap-1.5 bg-white/90 backdrop-blur-md text-[#0E0F0F] pl-2.5 pr-3 py-1.5 rounded-full text-[11px] font-semibold shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[#9EB3A8]/15 hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-200 group"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#96EA7A] group-hover:animate-pulse" />
        Demo
        {state.timeOffsetSeconds > 0 && (
          <span className="font-mono text-[#9EB3A8] text-[10px]">+{offsetLabel}</span>
        )}
      </button>
    )
  }

  // Expanded: slim bottom bar
  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999]">
      <div className="mx-auto max-w-5xl px-4 pb-3">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_-2px_24px_rgba(0,0,0,0.08)] border border-[#9EB3A8]/15 px-4 py-2.5 flex items-center gap-3">
          {/* Indicator + collapse */}
          <button
            onClick={() => setCollapsed(true)}
            className="flex items-center gap-1.5 shrink-0 group"
            aria-label="Collapse demo bar"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#96EA7A]" />
            <span className="text-[11px] font-bold text-[#9EB3A8] group-hover:text-[#5B7A6E] transition-colors">
              Demo
            </span>
            <svg
              className="w-3 h-3 text-[#9EB3A8]/40 group-hover:text-[#9EB3A8] transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <div className="w-px h-5 bg-[#9EB3A8]/15" />

          {/* Stats (inline) */}
          <div className="flex items-center gap-3 text-[11px] shrink-0">
            <Stat label="Vaults" value={String(vaults.length)} />
            <Stat label="Time" value={state.timeOffsetSeconds > 0 ? `+${offsetLabel}` : '0d'} />
            {totalDeposited > 0 && (
              <>
                <Stat label="Value" value={fmtUsd(totalDeposited + totalYield)} />
                <Stat label="ROI" value={`+${roi}%`} accent />
              </>
            )}
          </div>

          <div className="w-px h-5 bg-[#9EB3A8]/15" />

          {/* Time controls */}
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar">
            {TIME_STEPS.map((btn) => (
              <button
                key={btn.label}
                onClick={() => skipTime(btn.seconds)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#9EB3A8] hover:text-[#5B7A6E] hover:bg-[#F2F2F2] active:bg-[#E6F1E7] active:scale-95 transition-all duration-100 whitespace-nowrap"
              >
                +{btn.label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-[#9EB3A8]/15" />

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={reset}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#9EB3A8] hover:text-[#E8A838] hover:bg-[#E8A838]/8 transition-all"
            >
              Reset
            </button>
            {isDemoMode && (
              <button
                onClick={exitDemoMode}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#9EB3A8] hover:text-[#5B7A6E] hover:bg-[#F2F2F2] transition-all"
              >
                Exit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[#9EB3A8] font-medium">{label}</span>
      <span className={`font-bold tabular-nums ${accent ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}>
        {value}
      </span>
    </div>
  )
}
