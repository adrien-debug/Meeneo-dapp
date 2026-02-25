'use client'

import { fmtPercent } from '@/config/mock-data'
import { CARD } from '@/components/ui/constants'
import type { ActiveStrategy } from './types'
import { useMemo, useState } from 'react'

interface PerformanceTableProps {
  chartData: Record<string, number | string>[]
  activeStrategies: ActiveStrategy[]
}

const COLLAPSED_ROWS = 4

export function PerformanceTable({ chartData, activeStrategies }: PerformanceTableProps) {
  const [expanded, setExpanded] = useState(false)

  const { columns, colAvgs } = useMemo(() => {
    const cols = activeStrategies.map((s) => s.type)
    const cAvgs = cols.map((col) => {
      const vals = chartData.map((r) => (r[col] as number) ?? 0)
      return vals.reduce((s, v) => s + v, 0) / (vals.length || 1)
    })
    return { columns: cols, colAvgs: cAvgs }
  }, [chartData, activeStrategies])

  if (chartData.length === 0 || activeStrategies.length === 0) return null

  const showExpand = chartData.length > COLLAPSED_ROWS
  const visibleData = expanded ? chartData : chartData.slice(-COLLAPSED_ROWS)
  const startIdx = expanded ? 0 : chartData.length - COLLAPSED_ROWS

  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#9EB3A8]/10">
        <h3 className="card-title">Monthly Returns</h3>
        <span className="text-caption font-bold text-[#9EB3A8] bg-[#F2F2F2] px-3 py-1 rounded-full">
          {chartData.length} months
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] table-fixed">
          <colgroup>
            <col className="w-[72px]" />
            {activeStrategies.map((s) => (
              <col key={s.type} />
            ))}
            <col className="w-[68px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-[#9EB3A8]/10 bg-[#FAFBFA]">
              <th className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] text-left px-4 py-3 sticky left-0 bg-[#FAFBFA] z-10">
                Month
              </th>
              {activeStrategies.map((s) => (
                <th
                  key={s.type}
                  className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] text-center px-1 py-3"
                >
                  <div className="flex items-center justify-center gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="truncate">{s.label}</span>
                  </div>
                </th>
              ))}
              <th className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground)] text-center px-1 py-3">
                Comp.
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleData.map((row, i) => {
              const rowIdx = expanded ? i : startIdx + i
              const compositeVal = (row.composite as number) ?? 0
              const isLast = rowIdx === chartData.length - 1
              const isOdd = i % 2 === 1
              const rowBg = isLast ? 'bg-[#F8FAF9]' : isOdd ? 'bg-[#FAFBFA]/60' : ''
              const cellBg = isLast ? 'bg-[#F8FAF9]' : isOdd ? 'bg-[#FAFBFA]/60' : 'bg-white'
              return (
                <tr
                  key={rowIdx}
                  className={`border-b border-[#9EB3A8]/4 transition-colors hover:bg-[#96EA7A]/5 ${rowBg}`}
                >
                  <td
                    className={`px-4 py-2.5 text-xs font-semibold text-[#0E0F0F] sticky left-0 z-10 whitespace-nowrap ${cellBg}`}
                  >
                    {isLast && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#96EA7A] mr-1.5 animate-pulse align-middle" />
                    )}
                    {row.month as string}
                  </td>
                  {columns.map((col) => {
                    const val = (row[col] as number) ?? 0
                    return (
                      <td
                        key={col}
                        className="px-1 py-2.5 text-center text-xs font-semibold text-[#0E0F0F] tabular-nums"
                      >
                        {val >= 0 ? '+' : ''}
                        {fmtPercent(val)}
                      </td>
                    )
                  })}
                  <td className="px-1 py-2.5 text-center text-xs font-black text-[#96EA7A] tabular-nums">
                    {compositeVal >= 0 ? '+' : ''}
                    {fmtPercent(compositeVal)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#9EB3A8]/15 bg-[#F2F4F3]">
              <td className="px-4 py-3 text-xs font-black text-[#0E0F0F] sticky left-0 bg-[#F2F4F3] z-10 uppercase">
                Avg
              </td>
              {colAvgs.map((avg, i) => (
                <td
                  key={i}
                  className="px-1 py-3 text-center text-xs font-black text-[#0E0F0F] tabular-nums"
                >
                  {avg >= 0 ? '+' : ''}
                  {fmtPercent(avg)}
                </td>
              ))}
              <td className="px-1 py-3 text-center">
                <span className="text-xs font-black text-[#96EA7A] tabular-nums">
                  +
                  {fmtPercent(
                    chartData.map((r) => (r.composite as number) ?? 0).reduce((s, v) => s + v, 0) /
                      (chartData.length || 1),
                  )}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {showExpand && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2.5 border-t border-[#9EB3A8]/8 text-caption font-bold text-[#9EB3A8] hover:text-[#0E0F0F] hover:bg-[#F2F2F2]/40 transition-colors flex items-center justify-center gap-1.5"
        >
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? 'Recent only' : `All ${chartData.length} months`}
        </button>
      )}
    </div>
  )
}
