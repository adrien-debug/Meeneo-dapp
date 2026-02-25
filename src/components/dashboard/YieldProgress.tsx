import { CARD } from '@/components/ui/constants'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { fmtPercent, fmtUsd } from '@/config/mock-data'
import type { UserDeposit, VaultStatEntry } from './types'

interface YieldProgressProps {
  vaultStats: VaultStatEntry[]
  deposits: UserDeposit[]
  demoNow: number
}

export function YieldProgress({ vaultStats, deposits, demoNow }: YieldProgressProps) {
  return (
    <div className={`col-span-12 lg:col-span-7 ${CARD} p-6 flex flex-col`}>
      <h2 className="card-title mb-6">Yield Progress</h2>
      <div className="flex-1 space-y-6">
        {vaultStats.map((vs) => {
          if (vs.stats.deposited === 0) return null
          const avgApy = (vs.vault.compositeApy[0] + vs.vault.compositeApy[1]) / 2 / 100
          const deposit = deposits.find((d) => d.vaultSlug === vs.vault.slug)
          const monthsElapsed = deposit
            ? Math.floor((demoNow - deposit.depositTimestamp) / (30 * 86400))
            : 0
          const expectedYield = vs.stats.deposited * avgApy * (monthsElapsed / 12)
          const yieldProgress =
            expectedYield > 0 ? Math.min((vs.stats.yieldEarned / expectedYield) * 100, 100) : 0
          const roiPct =
            vs.stats.deposited > 0 ? (vs.stats.yieldEarned / vs.stats.deposited) * 100 : 0
          return (
            <div key={vs.vault.slug} className="flex items-start gap-4">
              <div className="relative shrink-0 mt-0.5">
                <ProgressRing percent={yieldProgress} color={vs.color} size={48} />
                <span className="absolute inset-0 flex items-center justify-center text-caption font-bold text-[#0E0F0F]">
                  {yieldProgress.toFixed(0)}%
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#0E0F0F]">
                      {vs.vault.name}{' '}
                      <span className="text-caption font-mono font-bold text-[#9EB3A8]">
                        {vs.vault.refNumber}
                      </span>
                    </span>
                    {deposit?.pendingYield && deposit.pendingYield > 0 && (
                      <span className="text-caption font-semibold text-[#96EA7A] bg-[#96EA7A]/10 px-2 py-0.5 rounded-full">
                        {fmtUsd(deposit.pendingYield)} pending
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold" style={{ color: vs.color }}>
                    +{fmtPercent(roiPct)} ROI
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#F2F2F2] overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${yieldProgress}%`, backgroundColor: vs.color }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-caption text-[var(--muted)]">
                    {fmtUsd(vs.stats.yieldEarned)} earned
                  </span>
                  <span className="text-caption text-[var(--muted)]">
                    Target {fmtUsd(Math.round(expectedYield))}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
