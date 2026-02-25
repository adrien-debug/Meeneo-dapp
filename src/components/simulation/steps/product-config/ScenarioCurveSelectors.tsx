import { CARD } from '@/components/ui/constants'
import type { CurveFamily } from './types'

interface ScenarioCurveSelectorsProps {
  btcFamilies: Record<string, CurveFamily>
  netFamilies: Record<string, CurveFamily>
  selectedBtcFamily: string
  onSelectedBtcFamilyChange: (v: string) => void
  selectedNetFamily: string
  onSelectedNetFamilyChange: (v: string) => void
  btcFamily: CurveFamily | undefined
  netFamily: CurveFamily | undefined
}

function ScenarioBadges({ family }: { family: CurveFamily }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] ${family.bear ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-[#F2F2F2] text-[#9EB3A8] border border-[#9EB3A8]/20'}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        Bear {family.bear ? `— ${family.bear.name}` : '(fallback)'}
      </span>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] ${family.base ? 'bg-[#F2F2F2] text-[#0E0F0F] border border-[#9EB3A8]/20' : 'bg-[#F2F2F2] text-[#9EB3A8] border border-[#9EB3A8]/20'}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        Base {family.base ? `— ${family.base.name}` : '(fallback)'}
      </span>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] ${family.bull ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-[#F2F2F2] text-[#9EB3A8] border border-[#9EB3A8]/20'}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        Bull {family.bull ? `— ${family.bull.name}` : '(fallback)'}
      </span>
    </div>
  )
}

export function ScenarioCurveSelectors({
  btcFamilies,
  netFamilies,
  selectedBtcFamily,
  onSelectedBtcFamilyChange,
  selectedNetFamily,
  onSelectedNetFamilyChange,
  btcFamily,
  netFamily,
}: ScenarioCurveSelectorsProps) {
  return (
    <div className={`${CARD} p-4`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider">
            Scenario Curves
          </h3>
          <p className="text-[10px] text-[#9EB3A8] mt-1">
            Select a curve set — bear, base, and bull scenarios are automatically mapped
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BTC Price Selector */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
              BTC Price Curve
            </label>
            <select
              value={selectedBtcFamily}
              onChange={(e) => onSelectedBtcFamilyChange(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[#9EB3A8]/20 bg-[#F2F2F2] text-[#0E0F0F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#96EA7A] focus:border-transparent transition-all appearance-none"
            >
              <option value="" disabled>
                — Select BTC Curve Set —
              </option>
              {Object.entries(btcFamilies).map(([key, family]) => (
                <option key={key} value={key}>
                  {family.name}
                </option>
              ))}
            </select>
          </div>
          {btcFamily && <ScenarioBadges family={btcFamily} />}
        </div>

        {/* Network Selector */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
              Network Curve
            </label>
            <select
              value={selectedNetFamily}
              onChange={(e) => onSelectedNetFamilyChange(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[#9EB3A8]/20 bg-[#F2F2F2] text-[#0E0F0F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#96EA7A] focus:border-transparent transition-all appearance-none"
            >
              <option value="" disabled>
                — Select Network Curve Set —
              </option>
              {Object.entries(netFamilies).map(([key, family]) => (
                <option key={key} value={key}>
                  {family.name}
                </option>
              ))}
            </select>
          </div>
          {netFamily && <ScenarioBadges family={netFamily} />}
        </div>
      </div>
    </div>
  )
}
