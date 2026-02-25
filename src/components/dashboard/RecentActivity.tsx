'use client'

import { useState } from 'react'
import { timeAgo } from '@/config/mock-data'
import { CARD } from '@/components/ui/constants'
import type { VaultActivity } from '@/config/mock-data'

interface RecentActivityProps {
  activity: VaultActivity[]
  visibleCount?: number
}

const STYLES: Record<string, { bg: string; color: string; label: string }> = {
  rebalance: { bg: 'bg-[#EEF2FF]', color: 'text-[#6366F1]', label: 'Rebalance' },
  distribute: { bg: 'bg-[#ECFDF5]', color: 'text-[#059669]', label: 'Distribution' },
  deposit: { bg: 'bg-[#FFF7ED]', color: 'text-[#F7931A]', label: 'Deposit' },
}

function ActivityIcon({ type }: { type: string }) {
  const cls = 'w-4 h-4'
  if (type === 'rebalance')
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.49 9A9 9 0 005.64 5.64L4 4m16 16l-1.64-1.64A9 9 0 019 20.49"
        />
      </svg>
    )
  if (type === 'distribute')
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
        />
      </svg>
    )
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  )
}

export function RecentActivity({ activity, visibleCount = 3 }: RecentActivityProps) {
  const [expanded, setExpanded] = useState(false)
  const hasMore = activity.length > visibleCount
  const items = expanded ? activity : activity.slice(0, visibleCount)

  return (
    <div className={`${CARD} overflow-hidden flex flex-col h-full`}>
      <div className="px-5 py-4 border-b border-[#F2F2F2] flex items-center justify-between">
        <h3 className="card-title">Recent Activity</h3>
        <span className="text-caption font-bold text-[#9EB3A8] bg-[#F2F2F2] px-3 py-1 rounded-full">
          {activity.length} events
        </span>
      </div>

      <div className="flex-1">
        {items.map((a, i) => {
          const style = STYLES[a.type] ?? STYLES.deposit
          return (
            <div
              key={a.id}
              className={`px-5 py-3 flex items-center gap-3 hover:bg-[#FAFAFA] transition-colors ${
                i < items.length - 1 ? 'border-b border-[#F2F2F2]/60' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl ${style.bg} ${style.color} flex items-center justify-center shrink-0`}
              >
                <ActivityIcon type={a.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#0E0F0F] leading-tight mb-0.5">
                  {style.label}
                </p>
                <p className="text-xs text-[var(--muted)] leading-relaxed truncate">
                  {a.description}
                </p>
              </div>
              <span className="text-xs text-[var(--muted)] font-medium shrink-0 tabular-nums">
                {timeAgo(a.timestamp)}
              </span>
            </div>
          )
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full px-5 py-2.5 border-t border-[#F2F2F2] flex items-center justify-center gap-1.5 text-caption font-semibold text-[var(--muted)] hover:text-[#0E0F0F] transition-colors"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? 'Show less' : `Show all ${activity.length} events`}
        </button>
      )}
    </div>
  )
}
