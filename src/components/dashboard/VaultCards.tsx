import { CARD, STRATEGY_ICONS } from '@/components/ui/constants'
import type { UserDeposit, VaultStatEntry } from './types'
import Image from 'next/image'

interface VaultCardsProps {
  vaultStats: VaultStatEntry[]
  deposits: UserDeposit[]
  demoNow: number
  onVaultClick: (slug: string) => void
  onSubscribeClick: () => void
  onDeleteVault: (slug: string) => void
}

export function VaultCards({
  vaultStats,
  deposits,
  demoNow,
  onVaultClick,
  onSubscribeClick,
  onDeleteVault,
}: VaultCardsProps) {
  return (
    <div className="section-gap">
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title">My Vaults</h2>
        <button
          onClick={onSubscribeClick}
          className="text-sm font-semibold text-[#0E0F0F] bg-white border border-[#9EB3A8]/20 hover:border-[#96EA7A] px-4 py-2 rounded-full transition-all flex items-center gap-1.5 hover:shadow-sm"
        >
          <svg
            className="w-4 h-4 text-[#96EA7A]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Subscribe
        </button>
      </div>

      {deposits.length === 0 && (
        <div className={`${CARD} p-12 text-center mb-4`}>
          <div className="w-16 h-16 rounded-2xl bg-[#96EA7A]/10 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8 text-[#96EA7A]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <p className="text-heading-sm font-bold text-[#0E0F0F] mb-2">No active position</p>
          <p className="text-sm text-[var(--muted)] mb-6 max-w-xs mx-auto">
            Subscribe to start earning yield on your assets
          </p>
          <button
            onClick={onSubscribeClick}
            className="px-6 py-3 rounded-2xl text-sm font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] shadow-lg shadow-[#96EA7A]/20 transition-all active:scale-[0.98]"
          >
            Subscribe to Vault
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vaultStats
          .filter((vs) => vs.stats.count > 0)
          .map((vs) => {
            const { vault, stats, color } = vs
            const roiPct = stats.deposited > 0 ? (stats.yieldEarned / stats.deposited) * 100 : 0
            const deposit = deposits.find((d) => d.vaultSlug === vault.slug)
            const statusLabel =
              deposit?.lockStatus === 'matured'
                ? 'Matured'
                : deposit?.lockStatus === 'target_reached'
                  ? 'Target'
                  : 'Active'

            return (
              <div
                key={vault.slug}
                role="button"
                tabIndex={0}
                onClick={() => onVaultClick(vault.slug)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onVaultClick(vault.slug)
                }}
                aria-label={`View ${vault.name} vault details`}
                className="text-left hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden cursor-pointer rounded-3xl shadow-md flex flex-col"
              >
                {/* Header */}
                <div className="bg-white px-5 pt-4 pb-3 rounded-t-3xl relative overflow-hidden">
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <svg width="24" height="24" viewBox="0 0 64 64" aria-hidden="true">
                            <circle cx="32" cy="32" r="32" fill={color} />
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
                            {vault.name}{' '}
                            <span className="text-caption font-mono font-bold text-[#9EB3A8]">
                              {vault.refNumber}
                            </span>
                          </p>
                          <p className="text-xs text-[#0E0F0F]/50 mt-0.5">
                            {deposit
                              ? `Since ${new Date(deposit.depositTimestamp * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                              : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {statusLabel && (
                          <span
                            className={`text-caption font-bold px-3 py-1 rounded-full shrink-0 ${
                              statusLabel === 'Matured'
                                ? 'bg-[#0E0F0F]/8 text-[#0E0F0F]'
                                : 'bg-[#96EA7A]/20 text-[#96EA7A] border border-[#96EA7A]/30'
                            }`}
                          >
                            {statusLabel}
                          </span>
                        )}
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
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            onDeleteVault(vault.slug)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.stopPropagation()
                              onDeleteVault(vault.slug)
                            }
                          }}
                          aria-label={`Delete ${vault.name} vault`}
                          className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Delete vault"
                        >
                          <svg
                            className="w-3 h-3 text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {vault.strategies.map((s) => (
                        <div
                          key={s.type}
                          className="flex items-center gap-1 bg-white/50 rounded-full px-2 py-0.5"
                        >
                          <Image
                            src={STRATEGY_ICONS[s.type] ?? ''}
                            alt={s.label}
                            width={10}
                            height={10}
                            className="rounded-full"
                          />
                          <span className="text-caption text-[#0E0F0F]/60 font-medium">
                            {s.allocation}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Body — white */}
                <div className="bg-white px-5 pt-4 pb-5 flex-1">
                  {deposit &&
                    (() => {
                      const subscriptionDate = new Date(
                        deposit.depositTimestamp * 1000,
                      ).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                      const remainingDays = Math.max(
                        0,
                        Math.ceil((deposit.maturityTimestamp - demoNow) / 86400),
                      )

                      return (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="kpi-label mb-0.5">Subscribed</p>
                              <p className="text-base font-black text-[#0E0F0F]">
                                {subscriptionDate}
                              </p>
                            </div>
                            <div>
                              <p className="kpi-label mb-0.5">Remaining</p>
                              <p
                                className={`text-base font-black ${remainingDays <= 30 ? 'text-[#F7931A]' : 'text-[#0E0F0F]'}`}
                              >
                                {remainingDays}d
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-[#F2F2F2] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${deposit.progressPercent}%`,
                                  backgroundColor: color,
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold text-[#0E0F0F] w-8 text-right">
                              {deposit.progressPercent}%
                            </span>
                          </div>
                        </>
                      )
                    })()}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
