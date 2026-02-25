import { CARD } from '@/components/ui/constants'
import { AllocationSlider } from './AllocationSlider'

interface CapitalAllocationSectionProps {
  yieldPct: number
  holdingPct: number
  miningPct: number
  yieldAllocated: number
  holdingAllocated: number
  miningAllocated: number
  yieldLocked: boolean
  holdingLocked: boolean
  miningLocked: boolean
  allocationValid: boolean
  totalPct: number
  onSliderChange: (bucket: 'yield' | 'holding' | 'mining', newPct: number) => void
  onToggleYieldLock: () => void
  onToggleHoldingLock: () => void
  onToggleMiningLock: () => void
  children: React.ReactNode
}

export function CapitalAllocationSection({
  yieldPct,
  holdingPct,
  miningPct,
  yieldAllocated,
  holdingAllocated,
  miningAllocated,
  yieldLocked,
  holdingLocked,
  miningLocked,
  allocationValid,
  totalPct,
  onSliderChange,
  onToggleYieldLock,
  onToggleHoldingLock,
  onToggleMiningLock,
  children,
}: CapitalAllocationSectionProps) {
  return (
    <div className={`${CARD} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider">
          Capital Allocation
        </h3>
        <div className="text-xs">
          {allocationValid ? (
            <span className="text-green-600">Allocations balanced</span>
          ) : (
            <span className="text-[#96EA7A]">Total: {totalPct.toFixed(1)}% — adjusting...</span>
          )}
        </div>
      </div>

      {/* Visual Allocation Bar */}
      <div className="h-6 rounded-full overflow-hidden flex mb-2 bg-[#F2F2F2]">
        <div
          className="bg-green-400 transition-all duration-150"
          style={{ width: `${yieldPct}%` }}
        />
        <div
          className="bg-cyan-400 transition-all duration-150"
          style={{ width: `${holdingPct}%` }}
        />
        <div
          className="bg-lime-400 transition-all duration-150"
          style={{ width: `${miningPct}%` }}
        />
      </div>
      <div className="flex gap-4 text-[10px] text-[#9EB3A8] mb-6">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-green-400" />
          Yield Liquidity ({yieldPct.toFixed(1)}%)
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-cyan-400" />
          BTC Holding ({holdingPct.toFixed(1)}%)
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-lime-400" />
          BTC Mining ({miningPct.toFixed(1)}%)
        </div>
      </div>

      {/* Allocation Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="slider-yield">
          <AllocationSlider
            label="Yield Liquidity"
            pct={yieldPct}
            onPctChange={(v) => onSliderChange('yield', v)}
            amountUsd={yieldAllocated}
            color="text-[#96EA7A]"
            trackColor="slider-yield"
            locked={yieldLocked}
            onToggleLock={onToggleYieldLock}
          />
        </div>
        <div className="slider-holding">
          <AllocationSlider
            label="BTC Holding"
            pct={holdingPct}
            onPctChange={(v) => onSliderChange('holding', v)}
            amountUsd={holdingAllocated}
            color="text-cyan-500"
            trackColor="slider-holding"
            locked={holdingLocked}
            onToggleLock={onToggleHoldingLock}
          />
        </div>
        <div className="slider-mining">
          <AllocationSlider
            label="BTC Mining"
            pct={miningPct}
            onPctChange={(v) => onSliderChange('mining', v)}
            amountUsd={miningAllocated}
            color="text-lime-600"
            trackColor="slider-mining"
            locked={miningLocked}
            onToggleLock={onToggleMiningLock}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>
    </div>
  )
}
