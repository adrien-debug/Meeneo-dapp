'use client'

import { Header } from '@/components/Header'
import { MOCK_MONTHLY_PERFORMANCE, fmtPercent, fmtUsd } from '@/config/mock-data'
import { useDemo } from '@/context/demo-context'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuthGuard } from '@/hooks/useAuthGuard'

import { ChartTooltip } from '@/components/ui/ChartTooltip'
import { CARD, STRATEGY_ICONS } from '@/components/ui/constants'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { ProgressRing } from '@/components/ui/ProgressRing'

const VAULT_COLORS = ['#96EA7A', '#9EB3A8', '#5B7A6E'] as const
const STRATEGY_COLORS: Record<string, string> = {
  rwa_mining: '#96EA7A',
  usdc_yield: '#9EB3A8',
  btc_hedged: '#5B7A6E',
}

function ToggleGroup({
  items,
  value,
  onChange,
  size = 'sm',
}: {
  items: { key: string; label: string; icon?: string }[]
  value: string
  onChange: (v: string) => void
  size?: 'sm' | 'md'
}) {
  return (
    <div className="flex items-center gap-0.5 bg-[#F2F2F2] rounded-full p-0.5">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`${size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'} font-medium rounded-full transition-all flex items-center gap-1.5 ${
            value === item.key
              ? 'bg-white text-[#0E0F0F] shadow-sm'
              : 'text-[#9EB3A8] hover:text-[#0E0F0F]'
          }`}
        >
          {item.icon && (
            <Image
              src={item.icon}
              alt=""
              width={size === 'md' ? 14 : 12}
              height={size === 'md' ? 14 : 12}
              className="rounded-full"
            />
          )}
          {item.label}
        </button>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const authed = useAuthGuard()
  const router = useRouter()
  const { vaults, deposits, deleteVault } = useDemo()
  const [chartStrategy, setChartStrategy] = useState<
    'composite' | 'rwa_mining' | 'usdc_yield' | 'btc_hedged'
  >('composite')
  const [chartMode, setChartMode] = useState<'monthly' | 'cumulative'>('cumulative')
  const [timeRange, setTimeRange] = useState('1Y')

  const TOTAL_USER_DEPOSITED = useMemo(() => deposits.reduce((s, d) => s + d.amount, 0), [deposits])
  const TOTAL_USER_YIELD = useMemo(
    () => deposits.reduce((s, d) => s + d.claimedYield + d.pendingYield, 0),
    [deposits],
  )
  const TOTAL_USER_PENDING = useMemo(
    () => deposits.reduce((s, d) => s + d.pendingYield, 0),
    [deposits],
  )
  const totalPortfolio = TOTAL_USER_DEPOSITED + TOTAL_USER_YIELD

  const getVaultUserStats = useCallback(
    (slug: string) => {
      const deps = deposits.filter((d) => d.vaultSlug === slug)
      return {
        deposited: deps.reduce((s, d) => s + d.amount, 0),
        yieldEarned: deps.reduce((s, d) => s + d.claimedYield + d.pendingYield, 0),
        pending: deps.reduce((s, d) => s + d.pendingYield, 0),
        count: deps.length,
      }
    },
    [deposits],
  )

  const vaultStats = useMemo(
    () =>
      vaults.map((v, i) => ({
        vault: v,
        stats: getVaultUserStats(v.slug),
        color: VAULT_COLORS[i % VAULT_COLORS.length],
      })),
    [vaults, getVaultUserStats],
  )

  const globalAllocationData = useMemo(
    () =>
      vaultStats
        .filter((vs) => vs.stats.deposited > 0)
        .map((vs) => ({ name: vs.vault.name, value: vs.stats.deposited, color: vs.color })),
    [vaultStats],
  )

  const chartData = useMemo(() => {
    const rangeMap: Record<string, number> = { '3M': 3, '6M': 6, '1Y': 12, ALL: 12 }
    return MOCK_MONTHLY_PERFORMANCE.slice(-(rangeMap[timeRange] ?? 12))
  }, [timeRange])

  const cumulativeData = useMemo(() => {
    let cRwa = 0,
      cUsdc = 0,
      cBtc = 0,
      cComp = 0
    return chartData.map((m) => {
      cRwa += m.rwa_mining
      cUsdc += m.usdc_yield
      cBtc += m.btc_hedged
      cComp += m.composite
      return {
        month: m.month,
        rwa_mining: +cRwa.toFixed(2),
        usdc_yield: +cUsdc.toFixed(2),
        btc_hedged: +cBtc.toFixed(2),
        composite: +cComp.toFixed(2),
      }
    })
  }, [chartData])

  const quantMetrics = useMemo(() => {
    const composites = chartData.map((m) => m.composite)
    const mean = composites.reduce((s, v) => s + v, 0) / composites.length
    const variance = composites.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / composites.length
    const stdDev = Math.sqrt(variance)
    const riskFreeMonthly = 0.42 // ~5% annual / 12
    const sharpe = stdDev > 0 ? (mean - riskFreeMonthly) / stdDev : 0
    const maxVal = Math.max(...composites)
    const minVal = Math.min(...composites)
    const winRate = (composites.filter((v) => v > mean).length / composites.length) * 100
    const totalCumulative = composites.reduce((s, v) => s + v, 0)

    // Peak-to-trough max drawdown on cumulative curve
    let peak = 0
    let maxDd = 0
    let cumul = 0
    for (const v of composites) {
      cumul += v
      if (cumul > peak) peak = cumul
      const dd = peak - cumul
      if (dd > maxDd) maxDd = dd
    }

    return {
      totalYield: totalCumulative,
      bestMonth: maxVal,
      worstMonth: minVal,
      avgMonthly: mean,
      volatility: stdDev,
      sharpe,
      winRate,
      maxDrawdown: maxDd,
    }
  }, [chartData])

  if (!authed) return <LoadingScreen />

  const activeChartData = chartMode === 'cumulative' ? cumulativeData : chartData

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Header />

      <main className="pt-20 pb-10">
        <div className="page-container">
          {/* ─── Hero Block ─── */}
          <div className={`${CARD} p-6 sm:p-8 relative overflow-hidden mt-6 mb-6`}>
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-[#96EA7A]/6 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-[#9EB3A8]/4 to-transparent rounded-full blur-2xl pointer-events-none" />

            <div className="relative">
              {/* Portfolio Value row */}
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
                <div>
                  <p className="kpi-label mb-2">Total Portfolio Value</p>
                  <div className="flex items-baseline gap-3">
                    <h1 className="text-[2.75rem] sm:text-[3.25rem] font-black text-[#0E0F0F] tracking-tight leading-none">
                      {fmtUsd(totalPortfolio)}
                    </h1>
                    {TOTAL_USER_DEPOSITED > 0 && (
                      <span className="text-sm font-bold text-[#96EA7A] bg-[#96EA7A]/10 px-3 py-1 rounded-full">
                        +{fmtPercent((TOTAL_USER_YIELD / TOTAL_USER_DEPOSITED) * 100)}
                      </span>
                    )}
                  </div>
                </div>

                {TOTAL_USER_PENDING > 0 && (
                  <button
                    onClick={() => router.push('/my-vaults')}
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
                      <p className="text-xs text-[#9EB3A8] font-medium">Pending Yield</p>
                      <p className="text-lg font-black text-[#96EA7A]">
                        {fmtUsd(TOTAL_USER_PENDING)}
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

              {/* KPIs inline */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#9EB3A8]/10 rounded-xl overflow-hidden">
                {[
                  { label: 'Deposited', value: fmtUsd(TOTAL_USER_DEPOSITED) },
                  { label: 'Yield Earned', value: fmtUsd(TOTAL_USER_YIELD), accent: true },
                  {
                    label: 'Active Vaults',
                    value: `${vaultStats.filter((v) => v.stats.count > 0).length} / ${vaultStats.length}`,
                  },
                  { label: 'Avg Monthly', value: fmtPercent(quantMetrics.avgMonthly) },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-white px-5 py-4 hover:bg-[#F2F2F2]/60 transition-colors"
                  >
                    <p className="kpi-label mb-1">{kpi.label}</p>
                    <p
                      className={`text-lg font-black truncate ${'accent' in kpi && kpi.accent ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}
                    >
                      {kpi.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Vault Cards ─── */}
          <div className="section-gap">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">My Vaults</h2>
              <button
                onClick={() => router.push('/subscribe')}
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
                <p className="text-lg font-bold text-[#0E0F0F] mb-2">No active position</p>
                <p className="text-sm text-[#9EB3A8] mb-6 max-w-xs mx-auto">
                  Subscribe to start earning yield on your assets
                </p>
                <button
                  onClick={() => router.push('/subscribe')}
                  className="px-6 py-3 rounded-2xl text-sm font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] shadow-lg shadow-[#96EA7A]/20 transition-all active:scale-[0.98]"
                >
                  Subscribe to Vault
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vaultStats.map((vs) => {
                const { vault, stats, color } = vs
                const hasPositions = stats.count > 0
                const roiPct = stats.deposited > 0 ? (stats.yieldEarned / stats.deposited) * 100 : 0
                const deposit = deposits.find((d) => d.vaultSlug === vault.slug)
                const statusLabel =
                  deposit?.lockStatus === 'matured'
                    ? 'Matured'
                    : deposit?.lockStatus === 'target_reached'
                      ? 'Target'
                      : hasPositions
                        ? 'Active'
                        : null

                return (
                  <div
                    key={vault.slug}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/vault/${vault.slug}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') router.push(`/vault/${vault.slug}`)
                    }}
                    className={`${CARD} p-0 text-left hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden cursor-pointer`}
                  >
                    <div
                      className="h-1 w-full"
                      style={{
                        background: `linear-gradient(90deg, ${vault.strategies.map((s) => s.color).join(', ')})`,
                      }}
                    />

                    <div className="px-5 pt-4 pb-5 relative">
                      <div
                        className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-[0.04] blur-2xl"
                        style={{ backgroundColor: color }}
                      />

                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#96EA7A]/10 flex items-center justify-center shrink-0">
                            <Image
                              src="/assets/tokens/hearst.svg"
                              alt={vault.name}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#0E0F0F] leading-tight">
                              {vault.name}
                            </p>
                            <p className="text-xs text-[#9EB3A8] mt-0.5">
                              {hasPositions && deposit
                                ? `Since ${new Date(deposit.depositTimestamp * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                                : 'No position'}
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
                              deleteVault(vault.slug)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.stopPropagation()
                                deleteVault(vault.slug)
                              }
                            }}
                            className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Delete vault"
                          >
                            <svg
                              className="w-3 h-3 text-red-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
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

                      {/* Strategy pockets */}
                      <div className="flex items-center gap-1.5 mb-4">
                        {vault.strategies.map((s) => (
                          <div
                            key={s.type}
                            className="flex items-center gap-1 bg-[#F2F2F2] rounded-full px-2 py-0.5"
                          >
                            <Image
                              src={STRATEGY_ICONS[s.type] ?? ''}
                              alt={s.label}
                              width={10}
                              height={10}
                              className="rounded-full"
                            />
                            <span className="text-caption text-[#9EB3A8] font-medium">
                              {s.allocation}%
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#9EB3A8]/10">
                        <div>
                          <p className="kpi-label mb-0.5">Deposited</p>
                          <p className="text-sm font-black text-[#0E0F0F]">
                            {hasPositions ? fmtUsd(stats.deposited) : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="kpi-label mb-0.5">APY</p>
                          <p className="text-sm font-black text-[#0E0F0F]">
                            {vault.compositeApy[0]}–{vault.compositeApy[1]}%
                          </p>
                        </div>
                        <div>
                          <p className="kpi-label mb-0.5">ROI</p>
                          <p
                            className={`text-sm font-black ${hasPositions ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}
                          >
                            {hasPositions ? `+${fmtPercent(roiPct)}` : '—'}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      {hasPositions && deposit && (
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
                          <span className="text-caption font-bold text-[#0E0F0F] w-8 text-right">
                            {deposit.progressPercent}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ─── Allocation + Yield Progress ─── */}
          <div className="grid grid-cols-12 gap-4 section-gap">
            {/* Allocation */}
            <div className={`col-span-12 lg:col-span-5 ${CARD} p-6 flex flex-col`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="card-title">Allocation</h2>
                <div className="w-[72px] h-[72px] shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={globalAllocationData}
                        innerRadius={22}
                        outerRadius={34}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {globalAllocationData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Image src="/assets/tokens/hearst-logo.svg" alt="H" width={14} height={14} />
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-0">
                {vaultStats.map((vs, idx) => {
                  if (vs.stats.deposited === 0) return null
                  const pct =
                    TOTAL_USER_DEPOSITED > 0 ? (vs.stats.deposited / TOTAL_USER_DEPOSITED) * 100 : 0
                  const isEven = idx % 2 === 1
                  return (
                    <button
                      key={vs.vault.slug}
                      onClick={() => router.push(`/vault/${vs.vault.slug}`)}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 -mx-1 transition-colors group ${isEven ? 'bg-[#F2F2F2]/50 hover:bg-white' : 'hover:bg-[#F2F2F2]'}`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: vs.color }}
                      />
                      <span className="text-sm text-[#0E0F0F] flex-1 text-left font-medium">
                        {vs.vault.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-1.5 rounded-full bg-[#F2F2F2] overflow-hidden hidden sm:block">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: vs.color }}
                          />
                        </div>
                        <span className="text-sm font-bold text-[#0E0F0F] w-10 text-right">
                          {pct.toFixed(0)}%
                        </span>
                        <span className="text-xs text-[#9EB3A8] w-[90px] text-right hidden sm:block">
                          {fmtUsd(vs.stats.deposited)}
                        </span>
                        <svg
                          className="w-3.5 h-3.5 text-[#9EB3A8] group-hover:text-[#96EA7A] group-hover:translate-x-0.5 transition-all"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Yield Progress */}
            <div className={`col-span-12 lg:col-span-7 ${CARD} p-6 flex flex-col`}>
              <h2 className="card-title mb-6">Yield Progress</h2>
              <div className="flex-1 space-y-6">
                {vaultStats.map((vs) => {
                  if (vs.stats.deposited === 0) return null
                  const avgApy = (vs.vault.compositeApy[0] + vs.vault.compositeApy[1]) / 2 / 100
                  const deposit = deposits.find((d) => d.vaultSlug === vs.vault.slug)
                  const monthsElapsed = deposit
                    ? Math.floor((Date.now() / 1000 - deposit.depositTimestamp) / (30 * 86400))
                    : 0
                  const expectedYield = vs.stats.deposited * avgApy * (monthsElapsed / 12)
                  const yieldProgress =
                    expectedYield > 0
                      ? Math.min((vs.stats.yieldEarned / expectedYield) * 100, 100)
                      : 0
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
                              {vs.vault.name}
                            </span>
                            {deposit?.pendingYield && deposit.pendingYield > 0 && (
                              <span className="text-caption font-semibold text-[#96EA7A] bg-[#96EA7A]/10 px-2 py-0.5 rounded-full">
                                {fmtUsd(deposit.pendingYield)} pending
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold" style={{ color: vs.color }}>
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
                          <span className="text-caption text-[#9EB3A8]">
                            {fmtUsd(vs.stats.yieldEarned)} earned
                          </span>
                          <span className="text-caption text-[#9EB3A8]">
                            Target {fmtUsd(Math.round(expectedYield))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ─── Performance ─── */}
          <div className="mb-5 mt-2">
            <h2 className="section-title">Performance</h2>
          </div>

          <div className="grid grid-cols-12 gap-4 section-gap">
            <div className={`col-span-12 lg:col-span-8 ${CARD} overflow-hidden flex flex-col`}>
              {/* Chart controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#9EB3A8]/10">
                <div className="flex items-center gap-3">
                  <h3 className="card-title">Strategy Performance</h3>
                  <ToggleGroup
                    items={[
                      { key: 'cumulative', label: 'Cumulative' },
                      { key: 'monthly', label: 'Monthly' },
                    ]}
                    value={chartMode}
                    onChange={(v) => setChartMode(v as 'monthly' | 'cumulative')}
                  />
                </div>
                <ToggleGroup
                  items={['3M', '6M', '1Y', 'ALL'].map((r) => ({ key: r, label: r }))}
                  value={timeRange}
                  onChange={setTimeRange}
                />
              </div>

              {/* Strategy filter */}
              <div className="px-6 py-3 border-b border-[#9EB3A8]/5">
                <ToggleGroup
                  items={[
                    { key: 'composite', label: 'All Strategies' },
                    { key: 'rwa_mining', label: 'RWA Mining', icon: STRATEGY_ICONS.rwa_mining },
                    { key: 'usdc_yield', label: 'USDC Yield', icon: STRATEGY_ICONS.usdc_yield },
                    { key: 'btc_hedged', label: 'BTC Hedged', icon: STRATEGY_ICONS.btc_hedged },
                  ]}
                  value={chartStrategy}
                  onChange={(v) => setChartStrategy(v as typeof chartStrategy)}
                />
              </div>

              {/* Chart area */}
              <div className="px-6 pt-4 pb-4 flex-1 bg-gradient-to-b from-white to-[#FAFBFA]">
                <div className="h-56 lg:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={activeChartData}
                      margin={{ top: 10, right: 10, bottom: 0, left: -10 }}
                    >
                      <defs>
                        {Object.entries(STRATEGY_COLORS).map(([key, c]) => (
                          <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={c} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={c} stopOpacity={0.02} />
                          </linearGradient>
                        ))}
                        <linearGradient id="grad-composite" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#96EA7A" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#96EA7A" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9EB3A8' }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9EB3A8' }}
                        tickFormatter={(v: number) => `${v}%`}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      {chartStrategy === 'composite' ? (
                        <>
                          <Area
                            type="monotone"
                            dataKey="rwa_mining"
                            stroke="#96EA7A"
                            strokeWidth={2}
                            fill="url(#grad-rwa_mining)"
                            dot={false}
                            activeDot={{ r: 4, fill: '#96EA7A', stroke: '#fff', strokeWidth: 2 }}
                            name="RWA Mining"
                          />
                          <Area
                            type="monotone"
                            dataKey="usdc_yield"
                            stroke="#9EB3A8"
                            strokeWidth={2}
                            fill="url(#grad-usdc_yield)"
                            dot={false}
                            activeDot={{ r: 4, fill: '#9EB3A8', stroke: '#fff', strokeWidth: 2 }}
                            name="USDC Yield"
                          />
                          <Area
                            type="monotone"
                            dataKey="btc_hedged"
                            stroke="#5B7A6E"
                            strokeWidth={2}
                            fill="url(#grad-btc_hedged)"
                            dot={false}
                            activeDot={{ r: 4, fill: '#5B7A6E', stroke: '#fff', strokeWidth: 2 }}
                            name="BTC Hedged"
                          />
                        </>
                      ) : (
                        <Area
                          type="monotone"
                          dataKey={chartStrategy}
                          stroke={STRATEGY_COLORS[chartStrategy] ?? '#96EA7A'}
                          strokeWidth={2.5}
                          fill={`url(#grad-${chartStrategy})`}
                          dot={false}
                          activeDot={{
                            r: 5,
                            fill: STRATEGY_COLORS[chartStrategy] ?? '#96EA7A',
                            stroke: '#fff',
                            strokeWidth: 2,
                          }}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Inline legend when composite */}
              {chartStrategy === 'composite' && (
                <div className="flex items-center justify-center gap-6 px-6 py-3 border-t border-[#9EB3A8]/10">
                  {[
                    { label: 'RWA Mining', color: '#96EA7A' },
                    { label: 'USDC Yield', color: '#9EB3A8' },
                    { label: 'BTC Hedged', color: '#5B7A6E' },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: l.color }}
                      />
                      <span className="text-xs text-[#9EB3A8] font-medium">{l.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quant metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-[#9EB3A8]/10">
                {[
                  {
                    label: 'Cumul. Yield',
                    value: fmtPercent(quantMetrics.totalYield),
                    accent: true,
                  },
                  {
                    label: 'Sharpe Ratio',
                    value: quantMetrics.sharpe.toFixed(2),
                    accent: quantMetrics.sharpe > 1.5,
                  },
                  {
                    label: 'Win Rate',
                    value: `${quantMetrics.winRate.toFixed(0)}%`,
                    accent: quantMetrics.winRate > 50,
                  },
                  {
                    label: 'Volatility',
                    value: fmtPercent(quantMetrics.volatility),
                    accent: false,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="px-6 py-4 border-r border-[#9EB3A8]/10 last:border-r-0"
                  >
                    <p className="kpi-label mb-1">{stat.label}</p>
                    <p
                      className={`text-base font-black ${stat.accent ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Distribution */}
            <div className={`col-span-12 lg:col-span-4 ${CARD} p-6 flex flex-col`}>
              <h3 className="card-title mb-1">Monthly Distribution</h3>
              <p className="text-xs text-[#9EB3A8] mb-5">Composite yield % per month</p>
              <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -15 }}>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#9EB3A8' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#9EB3A8' }}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="composite" name="Composite" radius={[6, 6, 0, 0]} fill="#96EA7A">
                      {chartData.map((_entry, i) => (
                        <Cell
                          key={i}
                          fill="#96EA7A"
                          fillOpacity={i === chartData.length - 1 ? 1 : 0.45}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-[#9EB3A8]/10">
                <div>
                  <p className="kpi-label mb-1">Best Month</p>
                  <p className="text-base font-black text-[#96EA7A]">
                    {fmtPercent(quantMetrics.bestMonth)}
                  </p>
                </div>
                <div>
                  <p className="kpi-label mb-1">Worst Month</p>
                  <p className="text-base font-black text-[#0E0F0F]">
                    {fmtPercent(quantMetrics.worstMonth)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Positions Table ─── */}
          <div className="section-gap">
            <div className={`${CARD} overflow-hidden`}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#9EB3A8]/10">
                <h3 className="card-title">Positions</h3>
                <span className="text-xs font-semibold text-[#9EB3A8] bg-[#F2F2F2] px-3 py-1.5 rounded-full">
                  {deposits.length} active
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[#9EB3A8]/10">
                      <th className="kpi-label text-left px-6 py-3">Vault</th>
                      <th className="kpi-label text-right px-4 py-3">Deposited</th>
                      <th className="kpi-label text-right px-4 py-3">Yield</th>
                      <th className="kpi-label text-right px-4 py-3">ROI</th>
                      <th className="kpi-label text-center px-4 py-3">Maturity</th>
                      <th className="kpi-label text-right px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#9EB3A8]/5">
                    {deposits.map((dep, idx) => {
                      const matchedVault = vaults.find((v) => v.slug === dep.vaultSlug)
                      const yieldEarned = dep.claimedYield + dep.pendingYield
                      const roiPct = dep.amount > 0 ? (yieldEarned / dep.amount) * 100 : 0
                      const statusLabel =
                        dep.lockStatus === 'matured'
                          ? 'Matured'
                          : dep.lockStatus === 'target_reached'
                            ? 'Target'
                            : 'Active'
                      const progress = dep.progressPercent
                      const isEven = idx % 2 === 1
                      return (
                        <tr
                          key={dep.id}
                          className={`transition-colors cursor-pointer group ${isEven ? 'bg-[#F2F2F2]/50 hover:bg-white' : 'hover:bg-[#F2F2F2]/60'}`}
                          onClick={() => router.push(`/vault/${dep.vaultSlug}`)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#96EA7A]/10 shrink-0">
                                <Image
                                  src="/assets/tokens/hearst-logo.svg"
                                  alt="Hearst"
                                  width={18}
                                  height={18}
                                />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-[#0E0F0F] group-hover:text-[#0E0F0F]">
                                  {matchedVault?.name ?? 'Vault'}
                                </p>
                                <p className="text-xs text-[#9EB3A8]">
                                  {new Date(dep.depositTimestamp * 1000).toLocaleDateString(
                                    'en-US',
                                    {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    },
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="text-sm font-bold text-[#0E0F0F] text-right px-4 py-4">
                            {fmtUsd(dep.amount)}
                          </td>
                          <td className="text-sm font-bold text-[#96EA7A] text-right px-4 py-4">
                            +{fmtUsd(yieldEarned)}
                          </td>
                          <td className="text-sm font-bold text-[#0E0F0F] text-right px-4 py-4">
                            +{fmtPercent(roiPct)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-16 h-1.5 rounded-full bg-[#F2F2F2] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#96EA7A] transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-[#0E0F0F] w-8">
                                {progress}%
                              </span>
                            </div>
                          </td>
                          <td className="text-right px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block ${
                                  statusLabel === 'Matured'
                                    ? 'bg-[#0E0F0F]/8 text-[#0E0F0F]'
                                    : statusLabel === 'Target'
                                      ? 'bg-[#96EA7A]/15 text-[#96EA7A]'
                                      : 'bg-[#96EA7A]/10 text-[#96EA7A]'
                                }`}
                              >
                                {statusLabel}
                              </span>
                              <svg
                                className="w-4 h-4 text-[#9EB3A8] group-hover:text-[#96EA7A] group-hover:translate-x-0.5 transition-all"
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
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
