import { CARD } from '@/components/ui/constants'
import { formatUSD } from '@/lib/sim-utils'
import { Tooltip } from './Tooltip'

interface CommercialFormProps {
  capitalRaised: number
  miningAllocated: number
  upfrontCommercialPct: number
  onUpfrontCommercialPctChange: (v: number) => void
  managementFeesPct: number
  onManagementFeesPctChange: (v: number) => void
  performanceFeesPct: number
  onPerformanceFeesPctChange: (v: number) => void
}

export function CommercialForm({
  capitalRaised,
  miningAllocated,
  upfrontCommercialPct,
  onUpfrontCommercialPctChange,
  managementFeesPct,
  onManagementFeesPctChange,
  performanceFeesPct,
  onPerformanceFeesPctChange,
}: CommercialFormProps) {
  return (
    <div className={`${CARD} p-4`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider">
            Commercial
          </h3>
          <p className="text-[10px] text-[#9EB3A8] mt-1">Configure fee structure for the product</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Upfront Commercial */}
        <div className="border border-amber-300/30 rounded-xl p-4 space-y-3 bg-amber-50/50">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-amber-600 uppercase">
              1. Upfront Commercial
            </h4>
            <Tooltip text="Percentage of total investment deducted upfront. This amount is removed proportionally from all three buckets at inception and is not invested." />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
              Fee (%)
            </label>
            <input
              type="number"
              value={upfrontCommercialPct}
              onChange={(e) =>
                onUpfrontCommercialPctChange(Math.max(0, Math.min(100, Number(e.target.value))))
              }
              className="w-full h-9 px-3 rounded-xl border border-[#9EB3A8]/20 bg-[#F2F2F2] text-[#0E0F0F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#96EA7A] focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              step={0.1}
              min={0}
              max={100}
            />
            <p className="text-[10px] text-[#9EB3A8]">
              {upfrontCommercialPct > 0
                ? `${formatUSD((capitalRaised * upfrontCommercialPct) / 100)} deducted at start`
                : 'No upfront deduction'}
            </p>
          </div>
        </div>

        {/* Management Fees */}
        <div className="border border-amber-300/30 rounded-xl p-4 space-y-3 bg-amber-50/50">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-amber-600 uppercase">2. Management Fees</h4>
            <Tooltip text="Annual percentage fee based on the dollar value investment. Captured monthly from the capitalization bucket (reduces investor returns)." />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
              Annual Fee (%)
            </label>
            <input
              type="number"
              value={managementFeesPct}
              onChange={(e) =>
                onManagementFeesPctChange(Math.max(0, Math.min(10, Number(e.target.value))))
              }
              className="w-full h-9 px-3 rounded-xl border border-[#9EB3A8]/20 bg-[#F2F2F2] text-[#0E0F0F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#96EA7A] focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              step={0.1}
              min={0}
              max={10}
            />
            <p className="text-[10px] text-[#9EB3A8]">
              {managementFeesPct > 0
                ? `~${formatUSD((capitalRaised * managementFeesPct) / 100 / 12)}/mo from capitalization`
                : 'No management fee'}
            </p>
          </div>
        </div>

        {/* Performance Fees */}
        <div className="border border-amber-300/30 rounded-xl p-4 space-y-3 bg-amber-50/50">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-amber-600 uppercase">3. Performance Fees</h4>
            <Tooltip text="Percentage captured from the capitalization overhead (value above initial mining investment). Only charged if positive returns are delivered." />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
              Fee on Overhead (%)
            </label>
            <input
              type="number"
              value={performanceFeesPct}
              onChange={(e) =>
                onPerformanceFeesPctChange(Math.max(0, Math.min(50, Number(e.target.value))))
              }
              className="w-full h-9 px-3 rounded-xl border border-[#9EB3A8]/20 bg-[#F2F2F2] text-[#0E0F0F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#96EA7A] focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              step={1}
              min={0}
              max={50}
            />
            <p className="text-[10px] text-[#9EB3A8]">
              {performanceFeesPct > 0
                ? `${performanceFeesPct}% of capitalization above ${formatUSD(miningAllocated)}`
                : 'No performance fee'}
            </p>
          </div>
        </div>
      </div>

      {(upfrontCommercialPct > 0 || managementFeesPct > 0 || performanceFeesPct > 0) && (
        <div className="mt-4 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
          <span className="font-semibold">Commercial fees configured:</span>{' '}
          {upfrontCommercialPct > 0 && <span>{upfrontCommercialPct}% upfront</span>}
          {upfrontCommercialPct > 0 && (managementFeesPct > 0 || performanceFeesPct > 0) && (
            <span> + </span>
          )}
          {managementFeesPct > 0 && <span>{managementFeesPct}% annual management</span>}
          {managementFeesPct > 0 && performanceFeesPct > 0 && <span> + </span>}
          {performanceFeesPct > 0 && <span>{performanceFeesPct}% performance</span>}
          <span className="text-amber-500 ml-2">— Fees will be deducted from product returns</span>
        </div>
      )}
    </div>
  )
}
