'use client'

import { Header } from '@/components/Header'
import { fmtUsd, getLockStatusColor, getLockStatusLabel } from '@/config/mock-data'
import { useDemo } from '@/context/demo-context'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import type { UserDeposit } from '@/types/product'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

import { CARD, STRATEGY_ICONS } from '@/components/ui/constants'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { ProgressRing } from '@/components/ui/ProgressRing'

const STATUS_BG: Record<string, string> = {
  active: 'bg-[#96EA7A]/15 border border-[#96EA7A]/30',
  target_reached: 'bg-[#96EA7A]/15 border border-[#96EA7A]/30',
  matured: 'bg-[#0E0F0F]/8 border border-[#0E0F0F]/15',
}

function VaultPositionCard({
  deposit,
  onNavigate,
}: {
  deposit: UserDeposit
  onNavigate: (slug: string) => void
}) {
  const { vaults } = useDemo()
  const vault = vaults.find((v) => v.slug === deposit.vaultSlug)
  if (!vault) return null

  const totalYield = deposit.claimedYield + deposit.pendingYield
  const roi = deposit.amount > 0 ? (totalYield / deposit.amount) * 100 : 0
  const daysRemaining = Math.max(
    0,
    Math.ceil((deposit.maturityTimestamp - Date.now() / 1000) / 86400),
  )
  const depositDate = new Date(deposit.depositTimestamp * 1000)
  const statusColor = '#96EA7A'

  const bgImage =
    vault.name === 'Hearst Prime Yield'
      ? '/assets/backgrounds/vault-card-1-bg.png'
      : '/assets/backgrounds/vault-card-2-bg.png'

  return (
    <div
      className="overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group rounded-3xl shadow-md flex flex-col"
      onClick={() => onNavigate(vault.slug)}
    >
      {/* Header — same style as product cards */}
      <div className="px-6 pt-6 pb-5 rounded-t-3xl relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src={bgImage}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#0E0F0F]/8 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Image
                  src="/assets/tokens/hearst.svg"
                  alt={vault.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0E0F0F]">
                  {vault.name}{' '}
                  <span className="text-caption font-mono font-bold text-[#0E0F0F]">
                    {vault.refNumber}
                  </span>
                </p>
                <p className="text-xs text-[#0E0F0F] mt-0.5">
                  Since{' '}
                  {depositDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-caption font-bold px-3 py-1 rounded-full ${STATUS_BG[deposit.lockStatus]} ${getLockStatusColor(deposit.lockStatus)}`}
              >
                {getLockStatusLabel(deposit.lockStatus)}
              </span>
              <svg
                className="w-4 h-4 text-[#0E0F0F] group-hover:text-[#96EA7A] group-hover:translate-x-0.5 transition-all"
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

          {/* Strategy pockets */}
          <div className="flex items-center gap-1.5">
            {vault.strategies.map((s) => (
              <div
                key={s.type}
                className="flex items-center gap-1 bg-[#0E0F0F]/10 rounded-full px-2 py-0.5"
              >
                <Image
                  src={STRATEGY_ICONS[s.type] ?? ''}
                  alt={s.label}
                  width={10}
                  height={10}
                  className="rounded-full"
                />
                <span className="text-caption text-[#0E0F0F] font-medium">{s.allocation}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body — white */}
      <div className="bg-white px-6 py-5 flex-1">
        {/* Metrics left + Ring right */}
        <div className="flex items-center gap-5 mb-5">
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <p className="kpi-label mb-0.5">Deposited</p>
              <p className="text-base font-black text-[#0E0F0F]">{fmtUsd(deposit.amount)}</p>
            </div>
            <div>
              <p className="kpi-label mb-0.5">Total Yield</p>
              <p className="text-base font-black text-[#96EA7A]">+{fmtUsd(totalYield)}</p>
            </div>
            <div>
              <p className="kpi-label mb-0.5">ROI</p>
              <p className="text-sm font-bold text-[#0E0F0F]">+{roi.toFixed(1)}%</p>
            </div>
            <div>
              <p className="kpi-label mb-0.5">
                {deposit.lockStatus === 'matured' ? 'Withdraw' : 'Unlock in'}
              </p>
              <p className="text-sm font-bold text-[#0E0F0F]">
                {deposit.lockStatus === 'matured' ? 'Available' : `${daysRemaining}d`}
              </p>
            </div>
          </div>
          <div className="relative shrink-0">
            <ProgressRing percent={deposit.progressPercent} color={statusColor} size={96} />
            <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-[#0E0F0F]">
              {deposit.progressPercent}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="kpi-label">Maturity Progress</span>
            <span className="text-xs font-bold text-[#0E0F0F]">{deposit.progressPercent}%</span>
          </div>
          <div className="h-2 bg-[#F2F2F2] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${deposit.progressPercent}%`, backgroundColor: statusColor }}
            />
          </div>
        </div>

        {/* Pending yield CTA */}
        {deposit.pendingYield > 0 && (
          <div className="flex items-center justify-between p-4 bg-[#96EA7A]/5 rounded-xl border border-[#96EA7A]/15 mt-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#96EA7A]/15 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-[#96EA7A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-[#0E0F0F]">{fmtUsd(deposit.pendingYield)}</p>
                <p className="text-xs text-[#9EB3A8]">pending yield</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onNavigate(vault.slug)
              }}
              className="px-4 py-2 rounded-full text-xs font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] transition-colors active:scale-[0.97]"
            >
              Claim
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MyVaults() {
  const authed = useAuthGuard()
  const router = useRouter()
  const demo = useDemo()

  const allDeposits = demo.deposits

  const totalDeposited = useMemo(() => allDeposits.reduce((s, d) => s + d.amount, 0), [allDeposits])
  const totalYield = useMemo(
    () => allDeposits.reduce((s, d) => s + d.claimedYield + d.pendingYield, 0),
    [allDeposits],
  )
  const totalPending = useMemo(
    () => allDeposits.reduce((s, d) => s + d.pendingYield, 0),
    [allDeposits],
  )

  const activeDeposits = useMemo(
    () => allDeposits.filter((d) => d.lockStatus !== 'matured'),
    [allDeposits],
  )
  const maturedDeposits = useMemo(
    () => allDeposits.filter((d) => d.lockStatus === 'matured'),
    [allDeposits],
  )

  if (!authed) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Header />

      <main className="pt-20 pb-10">
        <div className="page-container">
          {/* ─── Hero ─── */}
          <div className={`${CARD} p-6 sm:p-8 relative overflow-hidden mt-6 mb-6`}>
            <div className="absolute inset-0 pointer-events-none">
              <Image
                src="/assets/backgrounds/dashboard-hero-bg.png"
                alt=""
                fill
                unoptimized
                className="object-cover"
                sizes="100vw"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent pointer-events-none" />

            <div className="relative">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
                <div>
                  <p className="kpi-label mb-2">My Positions</p>
                  <h1 className="text-display font-black text-[var(--foreground)] tracking-tight">
                    My Vaults
                  </h1>
                </div>
                {totalPending > 0 && (
                  <button
                    onClick={() => router.push('/withdraw')}
                    className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#96EA7A]/5 border border-[#96EA7A]/20 hover:border-[#96EA7A]/50 hover:bg-[#96EA7A]/10 transition-all group self-start lg:self-auto"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#96EA7A]/15 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-[#96EA7A]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-[var(--muted)] font-medium">Pending Yield</p>
                      <p className="text-heading-sm font-black text-[#96EA7A]">
                        {fmtUsd(totalPending)}
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 text-[#9EB3A8] group-hover:text-[#96EA7A] group-hover:translate-x-0.5 transition-all ml-1"
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
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#9EB3A8]/10 rounded-xl overflow-hidden">
                {[
                  { label: 'Active', value: String(activeDeposits.length) },
                  { label: 'Deposited', value: fmtUsd(totalDeposited) },
                  { label: 'Yield Earned', value: fmtUsd(totalYield), accent: true },
                  { label: 'Matured', value: String(maturedDeposits.length) },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-white py-6 sm:py-9 flex flex-col items-center justify-center hover:bg-[#F2F2F2]/60 transition-colors"
                  >
                    <p className="kpi-label mb-2">{kpi.label}</p>
                    <p
                      className={`text-[0.625rem] sm:text-[1.275rem] font-black leading-none truncate ${'accent' in kpi && kpi.accent ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}
                    >
                      {kpi.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Active Positions ─── */}
          {activeDeposits.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Active</h2>
                <span className="text-xs font-semibold text-[#9EB3A8] bg-[#F2F2F2] px-3 py-1.5 rounded-full">
                  {activeDeposits.length} position{activeDeposits.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeDeposits.map((d) => (
                  <VaultPositionCard
                    key={d.id}
                    deposit={d}
                    onNavigate={(slug) => router.push(`/vault/${slug}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ─── Matured Positions ─── */}
          {maturedDeposits.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Matured — Ready to Withdraw</h2>
                <button
                  onClick={() => router.push('/withdraw')}
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
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                  Withdraw All
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {maturedDeposits.map((d) => (
                  <VaultPositionCard
                    key={d.id}
                    deposit={d}
                    onNavigate={(slug) => router.push(`/vault/${slug}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ─── Empty state ─── */}
          {allDeposits.length === 0 && (
            <div className={`${CARD} p-16 text-center`}>
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
              <p className="text-heading-sm font-bold text-[#0E0F0F] mb-2">No positions yet</p>
              <p className="text-sm text-[#9EB3A8] mb-6 max-w-xs mx-auto">
                Subscribe to a vault to start earning yield on your assets
              </p>
              <button
                onClick={() => router.push('/subscribe')}
                className="px-6 py-3 rounded-2xl text-sm font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] shadow-lg shadow-[#96EA7A]/20 transition-all active:scale-[0.98]"
              >
                Browse Vaults
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
