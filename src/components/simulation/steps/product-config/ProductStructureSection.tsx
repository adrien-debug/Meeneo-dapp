import SimInput from '@/components/simulation/SimInput'
import SimToggle from '@/components/simulation/SimToggle'
import { CARD } from '@/components/ui/constants'
import { Tooltip } from './Tooltip'

interface ProductStructureSectionProps {
  capitalRaised: number
  onCapitalRaisedChange: (v: number) => void
  tenor: number
  tenorYears: string
  selectedMinerName: string | undefined
  exitFreq: string
  onExitFreqChange: (v: string) => void
  miningBaseYield: number
  onMiningBaseYieldChange: (v: number) => void
  miningBonusYield: number
  onMiningBonusYieldChange: (v: number) => void
}

export function ProductStructureSection({
  capitalRaised,
  onCapitalRaisedChange,
  tenor,
  tenorYears,
  selectedMinerName,
  exitFreq,
  onExitFreqChange,
  miningBaseYield,
  onMiningBaseYieldChange,
  miningBonusYield,
  onMiningBonusYieldChange,
}: ProductStructureSectionProps) {
  return (
    <div className={`${CARD} p-4`}>
      <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider mb-3">
        Product Structure
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SimInput
          label="Capital Raised (USD)"
          value={capitalRaised}
          onChange={(v) => onCapitalRaisedChange(Number(v))}
          type="number"
        />
        <div className="space-y-1">
          <div className="flex items-center min-h-[20px]">
            <label className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
              Tenor
            </label>
            <Tooltip text="Auto-set from the selected miner's depreciation lifespan. Change the miner in the Mining bucket to adjust." />
          </div>
          <div className="w-full h-9 px-3 flex items-center rounded-xl bg-[#F2F2F2] border border-[#9EB3A8]/20 text-sm text-[#0E0F0F] tabular-nums">
            {tenor} months{' '}
            <span className="text-[#9EB3A8] ml-1">
              ({tenorYears} yr{Number(tenorYears) !== 1 ? 's' : ''})
            </span>
          </div>
          <p className="text-[10px] text-[#9EB3A8]">
            Linked to {selectedMinerName ?? 'miner'} lifespan
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center min-h-[20px]">
            <span className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
              Exit Windows
            </span>
            <Tooltip text="How often investors can redeem their position. Quarterly = every 3 months, Semi-Annual = every 6 months, Annual = once per year. Used for liquidity coverage ratio (LCR) calculations in the mining waterfall." />
          </div>
          <SimToggle
            label=""
            value={exitFreq}
            onChange={onExitFreqChange}
            options={[
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'semi-annual', label: 'Semi-Annual' },
              { value: 'annual', label: 'Annual' },
            ]}
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#9EB3A8]/20">
        <h4 className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider mb-3">
          Yield Structure
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SimInput
            label="Base Yield APR"
            value={miningBaseYield}
            onChange={(v) => onMiningBaseYieldChange(Number(v))}
            type="number"
            step={0.01}
            hint="8% base yield from mining"
          />
          <SimInput
            label="Bonus Yield APR"
            value={miningBonusYield}
            onChange={(v) => onMiningBonusYieldChange(Number(v))}
            type="number"
            step={0.01}
            hint="+4% when BTC target hit"
          />
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
              Combined APR
            </label>
            <div className="w-full h-9 px-3 flex items-center rounded-xl bg-[#F2F2F2] border border-[#9EB3A8]/20 text-sm text-[#96EA7A] tabular-nums font-semibold">
              {((miningBaseYield + miningBonusYield) * 100).toFixed(0)}%{' '}
              <span className="text-[#9EB3A8] font-normal ml-1">when target hit</span>
            </div>
            <p className="text-[10px] text-[#9EB3A8]">Mining yield cap bumps to combined rate</p>
          </div>
        </div>
      </div>
    </div>
  )
}
