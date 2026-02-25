import { formatUSD } from '@/lib/sim-utils'

interface AllocationSliderProps {
  label: string
  pct: number
  onPctChange: (newPct: number) => void
  amountUsd: number
  color: string
  trackColor: string
  locked: boolean
  onToggleLock: () => void
}

export function AllocationSlider({
  label,
  pct,
  onPctChange,
  amountUsd,
  color,
  trackColor,
  locked,
  onToggleLock,
}: AllocationSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${color}`}>{label}</span>
          <button
            onClick={onToggleLock}
            className={`flex items-center justify-center w-5 h-5 rounded transition-all ${
              locked
                ? 'bg-[#0E0F0F] text-white shadow-inner'
                : 'bg-[#F2F2F2] text-[#9EB3A8] hover:text-[#0E0F0F] hover:bg-[#E6F1E7]'
            }`}
            title={locked ? 'Unlock — allow this value to change' : 'Lock — freeze this value'}
          >
            {locked ? (
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            ) : (
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
            )}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#9EB3A8] tabular-nums">{formatUSD(amountUsd)}</span>
          <span className={`text-sm font-bold tabular-nums ${color}`}>{pct.toFixed(1)}%</span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={pct}
          onChange={(e) => onPctChange(Number(e.target.value))}
          disabled={locked}
          className={`w-full h-2 rounded-full appearance-none ${locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${trackColor}`}
          style={{
            background: `linear-gradient(to right, var(--slider-fill) ${pct}%, #E5E7EB ${pct}%)`,
          }}
        />
      </div>
    </div>
  )
}
