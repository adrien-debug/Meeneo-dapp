'use client'

import { exportAsCSV, exportAsJSON } from '@/lib/sim-utils'

interface SimTableProps {
  columns: { key: string; label: string; format?: (v: number) => string }[]
  rows: Record<string, unknown>[]
  title?: string
  maxHeight?: string
  exportName?: string
}

export default function SimTable({ columns, rows, title, maxHeight = '400px', exportName = 'export' }: SimTableProps) {
  return (
    <div className="rounded-xl border border-[#9EB3A8]/20 overflow-hidden bg-white">
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#9EB3A8]/10">
          <span className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider">{title}</span>
          <div className="flex gap-3">
            <button className="text-[11px] text-[#9EB3A8] hover:text-[#96EA7A] transition-colors font-medium" onClick={() => exportAsCSV(rows as Record<string, unknown>[], `${exportName}.csv`)}>CSV</button>
            <button className="text-[11px] text-[#9EB3A8] hover:text-[#96EA7A] transition-colors font-medium" onClick={() => exportAsJSON(rows, `${exportName}.json`)}>JSON</button>
          </div>
        </div>
      )}
      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#F2F2F2]">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider whitespace-nowrap">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#9EB3A8]/5">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-[#F2F2F2]/50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-3 py-1.5 text-[#0E0F0F] font-medium whitespace-nowrap">
                    {col.format ? col.format(row[col.key] as number) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
