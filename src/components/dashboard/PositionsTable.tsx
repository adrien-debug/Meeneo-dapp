import { fmtPercent, fmtUsd } from '@/config/mock-data'
import { CARD } from '@/components/ui/constants'
import type { UserDeposit, VaultConfig } from './types'

interface PositionsTableProps {
  deposits: UserDeposit[]
  vaults: VaultConfig[]
  vaultColors: Record<string, string>
  demoNow: number
  onRowClick: (slug: string) => void
}

export function PositionsTable({
  deposits,
  vaults,
  vaultColors,
  demoNow,
  onRowClick,
}: PositionsTableProps) {
  return (
    <div className={`${CARD} overflow-hidden h-full flex flex-col`}>
      <div className="flex items-center justify-between px-6 pt-6 pb-5">
        <h2 className="card-title">Positions</h2>
        <span className="text-caption font-bold text-[#9EB3A8] bg-[#F2F2F2] px-3 py-1 rounded-full">
          {deposits.length} active
        </span>
      </div>
      <div className="flex-1 divide-y divide-[#9EB3A8]/5">
        {deposits.map((dep, idx) => {
          const matchedVault = vaults.find((v) => v.slug === dep.vaultSlug)
          const yieldEarned = dep.claimedYield + dep.pendingYield
          const roiPct = dep.amount > 0 ? (yieldEarned / dep.amount) * 100 : 0
          const elapsedDays = Math.max(1, (demoNow - dep.depositTimestamp) / 86400)
          const annualizedRoi = (roiPct / elapsedDays) * 365
          const dailyPnl = yieldEarned / elapsedDays
          const progress = dep.progressPercent
          const statusLabel =
            dep.lockStatus === 'matured'
              ? 'Matured'
              : dep.lockStatus === 'target_reached'
                ? 'Target'
                : 'Active'

          const iconColor = vaultColors[dep.vaultSlug] ?? '#96EA7A'

          return (
            <div
              key={dep.id}
              className="px-6 py-4 cursor-pointer hover:bg-[#F2F2F2]/40 transition-colors group"
              onClick={() => onRowClick(dep.vaultSlug)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${iconColor}20` }}
                  >
                    <svg width="24" height="24" viewBox="0 0 64 64" aria-hidden="true">
                      <circle cx="32" cy="32" r="32" fill={iconColor} />
                      <g transform="translate(12, 10) scale(0.259) translate(-560, -455)">
                        <polygon
                          fill="#fff"
                          points="601.74 466.87 572.6 466.87 572.6 609.73 601.74 609.73 601.74 549.07 633.11 579.43 665.76 579.43 601.74 517.46 601.74 466.87"
                        />
                        <polygon
                          fill="#fff"
                          points="672.72 466.87 672.72 528.12 644.63 500.93 611.98 500.93 672.72 559.72 672.72 609.73 701.86 609.73 701.86 466.87 672.72 466.87"
                        />
                      </g>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0E0F0F] leading-tight">
                      {matchedVault?.name ?? 'Vault'}{' '}
                      {matchedVault?.refNumber && (
                        <span className="text-caption font-mono font-bold text-[#9EB3A8]">
                          {matchedVault.refNumber}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[#0E0F0F]/50 mt-0.5">
                      {new Date(dep.depositTimestamp * 1000).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-caption font-bold px-3 py-1 rounded-full shrink-0 ${
                      statusLabel === 'Active'
                        ? 'bg-[#96EA7A]/20 text-[#96EA7A] border border-[#96EA7A]/30'
                        : 'bg-[#0E0F0F]/8 text-[#0E0F0F]'
                    }`}
                  >
                    {statusLabel}
                  </span>
                  <svg
                    className="w-4 h-4 text-[#9EB3A8] group-hover:text-[#96EA7A] group-hover:translate-x-0.5 transition-all shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <p className="kpi-label mb-0.5">Deposited</p>
                  <p className="text-base font-black text-[#0E0F0F]">{fmtUsd(dep.amount)}</p>
                </div>
                <div>
                  <p className="kpi-label mb-0.5">Yield</p>
                  <p className="text-base font-black text-[#96EA7A]">+{fmtUsd(yieldEarned)}</p>
                </div>
                <div>
                  <p className="kpi-label mb-0.5">Ann. ROI</p>
                  <p className="text-base font-black text-[#0E0F0F]">{fmtPercent(annualizedRoi)}</p>
                </div>
                <div>
                  <p className="kpi-label mb-0.5">Daily</p>
                  <p className="text-base font-black text-[#0E0F0F]">+{fmtUsd(dailyPnl)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-1 rounded-full bg-[#F2F2F2] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#96EA7A] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-caption font-bold text-[var(--muted)] w-7 text-right">
                  {progress}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
