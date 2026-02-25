import { CARD } from '@/components/ui/constants'
import { fmtPercent, fmtUsd } from '@/config/mock-data'
import Image from 'next/image'

interface DashboardHeroProps {
  totalPortfolio: number
  totalDeposited: number
  totalYield: number
  totalPending: number
  avgMonthly: number
  activeVaultCount: number
  onPendingClick: () => void
}

export function DashboardHero({
  totalPortfolio,
  totalDeposited,
  totalYield,
  totalPending,
  avgMonthly,
  activeVaultCount,
  onPendingClick,
}: DashboardHeroProps) {
  return (
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
            <p className="kpi-label mb-2">Total Portfolio Value</p>
            <div className="flex items-baseline gap-3">
              <h1 className="text-display font-black text-[var(--foreground)] tracking-tight">
                {fmtUsd(totalPortfolio)}
              </h1>
              {totalDeposited > 0 && (
                <span className="text-sm font-bold text-[#96EA7A] bg-[#96EA7A]/10 px-3 py-1 rounded-full">
                  +{fmtPercent((totalYield / totalDeposited) * 100)}
                </span>
              )}
            </div>
          </div>

          {totalPending > 0 && (
            <button
              onClick={onPendingClick}
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
                <p className="text-heading-sm font-black text-[#96EA7A]">{fmtUsd(totalPending)}</p>
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
            { label: 'Deposited', value: fmtUsd(totalDeposited) },
            { label: 'Yield Earned', value: fmtUsd(totalYield), accent: true },
            { label: 'Active Vaults', value: `${activeVaultCount}` },
            { label: 'Avg Monthly', value: fmtPercent(avgMonthly) },
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
  )
}
