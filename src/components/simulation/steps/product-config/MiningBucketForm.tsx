import SimInput from '@/components/simulation/SimInput'
import SimSelect from '@/components/simulation/SimSelect'
import { formatUSD } from '@/lib/sim-utils'
import type { HostingSite, Miner, TakeProfitEntry } from './types'

interface MiningBucketFormProps {
  miningAllocated: number
  selectedMiner: string
  onSelectedMinerChange: (v: string) => void
  miners: Miner[]
  selectedSite: string
  onSelectedSiteChange: (v: string) => void
  sites: HostingSite[]
  minerCount: number
  onMinerCountChange: (v: number) => void
  takeProfitLadder: TakeProfitEntry[]
  onAddTakeProfitEntry: () => void
  onUpdateTakeProfitEntry: (idx: number, field: keyof TakeProfitEntry, value: number) => void
  onRemoveTakeProfitEntry: (idx: number) => void
}

export function MiningBucketForm({
  miningAllocated,
  selectedMiner,
  onSelectedMinerChange,
  miners,
  selectedSite,
  onSelectedSiteChange,
  sites,
  minerCount,
  onMinerCountChange,
  takeProfitLadder,
  onAddTakeProfitEntry,
  onUpdateTakeProfitEntry,
  onRemoveTakeProfitEntry,
}: MiningBucketFormProps) {
  return (
    <div className="border border-lime-500/20 rounded-xl p-4 space-y-3 bg-lime-50/50">
      <h4 className="text-xs font-semibold text-lime-600 uppercase">c. BTC Mining</h4>
      <div className="px-3 py-2 rounded-xl bg-[#F2F2F2] text-sm text-[#0E0F0F] tabular-nums">
        {formatUSD(miningAllocated)}
      </div>
      <SimSelect
        label="Miner"
        value={selectedMiner}
        onChange={onSelectedMinerChange}
        options={miners.map((m) => ({
          value: m.id,
          label: `${m.name} (${m.hashrate_th} TH/s, ${formatUSD(m.price_usd)})`,
        }))}
      />
      <SimSelect
        label="Hosting Site"
        value={selectedSite}
        onChange={onSelectedSiteChange}
        options={sites.map((s) => ({
          value: s.id,
          label: `${s.name} ($${s.electricity_price_usd_per_kwh}/kWh)`,
        }))}
      />
      <SimInput
        label="Miner Count"
        value={minerCount}
        onChange={(v) => onMinerCountChange(Number(v))}
        type="number"
        min={1}
        hint="Auto-calculated from allocation / miner price"
      />

      {/* Take-Profit Ladder */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#9EB3A8] uppercase">Take-Profit Ladder</span>
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F2F2F2] text-[#9EB3A8] hover:bg-[#E6F1E7]"
            onClick={onAddTakeProfitEntry}
          >
            + Add
          </button>
        </div>
        {takeProfitLadder.map((tp, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span className="text-[#9EB3A8] w-16">Trigger $</span>
            <input
              type="number"
              value={tp.price_trigger}
              onChange={(e) =>
                onUpdateTakeProfitEntry(idx, 'price_trigger', Number(e.target.value))
              }
              className="w-24 h-7 px-2 rounded-lg border border-[#9EB3A8]/20 bg-[#F2F2F2] text-[#0E0F0F] text-xs"
            />
            <span className="text-[#9EB3A8] w-12">Sell %</span>
            <input
              type="number"
              value={tp.sell_pct}
              onChange={(e) => onUpdateTakeProfitEntry(idx, 'sell_pct', Number(e.target.value))}
              className="w-16 h-7 px-2 rounded-lg border border-[#9EB3A8]/20 bg-[#F2F2F2] text-[#0E0F0F] text-xs"
              step={0.05}
            />
            <button
              className="text-red-400/60 hover:text-red-500"
              onClick={() => onRemoveTakeProfitEntry(idx)}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
