import SimInput from '@/components/simulation/SimInput'
import { formatUSD } from '@/lib/sim-utils'
import type { AprScheduleEntry } from './types'

interface YieldBucketFormProps {
  yieldAllocated: number
  yieldBaseApr: number
  onYieldBaseAprChange: (v: number) => void
  useAprSchedule: boolean
  onUseAprScheduleChange: (v: boolean) => void
  aprSchedule: AprScheduleEntry[]
  onUpdateAprEntry: (idx: number, field: keyof AprScheduleEntry, value: number) => void
  onAddAprEntry: () => void
  onRemoveAprEntry: (idx: number) => void
}

export function YieldBucketForm({
  yieldAllocated,
  yieldBaseApr,
  onYieldBaseAprChange,
  useAprSchedule,
  onUseAprScheduleChange,
  aprSchedule,
  onUpdateAprEntry,
  onAddAprEntry,
  onRemoveAprEntry,
}: YieldBucketFormProps) {
  return (
    <div className="border border-[#96EA7A]/20 rounded-xl p-4 space-y-3 bg-[#96EA7A]/5">
      <h4 className="text-xs font-semibold text-[#96EA7A] uppercase">a. Yield Liquidity Product</h4>
      <div className="px-3 py-2 rounded-xl bg-[#F2F2F2] text-sm text-[#0E0F0F] tabular-nums">
        {formatUSD(yieldAllocated)}
      </div>
      <SimInput
        label="Base Annual APR"
        value={yieldBaseApr}
        onChange={(v) => onYieldBaseAprChange(Number(v))}
        type="number"
        step={0.01}
        hint="e.g. 0.04 = 4%"
      />

      <div className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={useAprSchedule}
          onChange={(e) => onUseAprScheduleChange(e.target.checked)}
          className="rounded"
        />
        <span className="text-[#9EB3A8]">Custom APR schedule</span>
      </div>

      {useAprSchedule && (
        <div className="space-y-2">
          {aprSchedule.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="text-[#9EB3A8] w-8">Mo</span>
              <input
                type="number"
                value={entry.from_month}
                onChange={(e) => onUpdateAprEntry(idx, 'from_month', Number(e.target.value))}
                className="w-14 h-7 px-2 rounded-lg border border-[#9EB3A8]/20 bg-[#F2F2F2] text-[#0E0F0F] text-xs"
                min={0}
              />
              <span className="text-[#9EB3A8]">-</span>
              <input
                type="number"
                value={entry.to_month}
                onChange={(e) => onUpdateAprEntry(idx, 'to_month', Number(e.target.value))}
                className="w-14 h-7 px-2 rounded-lg border border-[#9EB3A8]/20 bg-[#F2F2F2] text-[#0E0F0F] text-xs"
                min={0}
              />
              <span className="text-[#9EB3A8] w-8">APR</span>
              <input
                type="number"
                value={entry.apr}
                onChange={(e) => onUpdateAprEntry(idx, 'apr', Number(e.target.value))}
                className="w-16 h-7 px-2 rounded-lg border border-[#9EB3A8]/20 bg-[#F2F2F2] text-[#0E0F0F] text-xs"
                step={0.01}
              />
              <button
                className="text-red-400/60 hover:text-red-500"
                onClick={() => onRemoveAprEntry(idx)}
              >
                x
              </button>
            </div>
          ))}
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F2F2F2] text-[#9EB3A8] hover:bg-[#E6F1E7]"
            onClick={onAddAprEntry}
          >
            + Add Period
          </button>
        </div>
      )}
    </div>
  )
}
