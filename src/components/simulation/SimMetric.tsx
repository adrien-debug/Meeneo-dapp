'use client'

interface SimMetricProps {
  label: string
  value: string
  sub?: string
  status?: 'green' | 'yellow' | 'red' | 'neutral'
}

const statusStyles = {
  green: 'border-[#96EA7A]/30 bg-[#96EA7A]/5',
  yellow: 'border-[#E8A838]/30 bg-[#E8A838]/5',
  red: 'border-red-400/30 bg-red-50',
  neutral: 'border-[#9EB3A8]/20 bg-white',
}

const dotStyles = {
  green: 'bg-[#96EA7A]',
  yellow: 'bg-[#E8A838]',
  red: 'bg-red-500',
  neutral: 'bg-[#9EB3A8]',
}

export default function SimMetric({ label, value, sub, status = 'neutral' }: SimMetricProps) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 h-full transition-all hover:shadow-sm ${statusStyles[status]}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status]}`} />
        <span className="text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider truncate">
          {label}
        </span>
      </div>
      <div className="text-lg font-black text-[#0E0F0F] truncate">{value}</div>
      {sub && <div className="text-[10px] text-[#9EB3A8] mt-0.5 truncate">{sub}</div>}
    </div>
  )
}
