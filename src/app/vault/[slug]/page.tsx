'use client'

import { Header } from '@/components/Header'
import {
  ALL_VAULTS,
  MOCK_MONTHLY_PERFORMANCE,
  MOCK_PROTOCOL_STATS,
  fmt,
  fmtApy,
  fmtPercent,
  fmtUsd,
  getActivityForVault,
  getLockStatusColor,
  getLockStatusLabel,
  timeAgo,
} from '@/config/mock-data'
import { useDemo } from '@/context/demo-context'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useClaimRewards, useWithdraw } from '@/hooks/useEpochVault'
import type { StrategyType, VaultStrategy } from '@/types/product'
import Image from 'next/image'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAccount } from 'wagmi'

import { ChartTooltip } from '@/components/ui/ChartTooltip'
import { CARD, RISK_BG, STRATEGY_ICONS } from '@/components/ui/constants'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { TransactionProgress } from '@/components/ui/TransactionProgress'
import { useSimulatedTransaction } from '@/hooks/useSimulatedTransaction'

export default function VaultDetail() {
  const authed = useAuthGuard()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const {
    claimRewards,
    isPending: isClaimPending,
    isConfirming: isClaimConfirming,
    isConfirmed: isClaimConfirmed,
  } = useClaimRewards()
  const {
    withdraw,
    isPending: isWithdrawPending,
    isConfirming: isWithdrawConfirming,
    isConfirmed: isWithdrawConfirmed,
  } = useWithdraw()

  const slug = params.slug as string
  const demo = useDemo()

  const vault =
    demo.vaults.find((v) => v.slug === slug) ?? ALL_VAULTS.find((v) => v.slug === slug) ?? null
  const deposits = demo.deposits.filter((d) => d.vaultSlug === slug)
  const vaultUserStats = useMemo(() => {
    const deps = deposits
    return {
      deposited: deps.reduce((s, d) => s + d.amount, 0),
      yieldEarned: deps.reduce((s, d) => s + d.claimedYield + d.pendingYield, 0),
      pending: deps.reduce((s, d) => s + d.pendingYield, 0),
      activeCount: deps.filter((d) => d.lockStatus !== 'matured').length,
      count: deps.length,
    }
  }, [deposits])
  const { isConnected } = useAccount()
  const vaultActivity = getActivityForVault(slug)
  const txSim = useSimulatedTransaction()

  const handleClaim = useCallback(
    (depositId: number) => {
      if (isConnected) {
        claimRewards()
        demo.claim(depositId)
        return
      }
      txSim.execute(['claim'], () => {
        demo.claim(depositId)
        setTimeout(() => txSim.reset(), 1200)
      })
    },
    [isConnected, claimRewards, demo, txSim],
  )

  const handleWithdraw = useCallback(
    (depositId: number, amount: number) => {
      if (isConnected) {
        withdraw(String(amount))
        demo.withdraw(depositId)
        return
      }
      txSim.execute(['withdraw'], () => {
        demo.withdraw(depositId)
        setTimeout(() => txSim.reset(), 1200)
      })
    },
    [isConnected, withdraw, demo, txSim],
  )

  const highlightedStrategy = searchParams.get('strategy') as StrategyType | null
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType | null>(highlightedStrategy)

  const strategy: VaultStrategy | undefined = selectedStrategy
    ? vault?.strategies.find((s) => s.type === selectedStrategy)
    : undefined

  const chartData = MOCK_MONTHLY_PERFORMANCE

  const protocolBreakdown = useMemo(() => {
    if (!strategy) return []
    const breakdowns: Record<StrategyType, Array<{ name: string; pct: number; color: string }>> = {
      rwa_mining: [
        { name: 'Hearst Mining', pct: 50, color: '#96EA7A' },
        { name: 'Marathon Digital', pct: 30, color: '#7ED066' },
        { name: 'CleanSpark', pct: 20, color: '#96EA7A' },
      ],
      usdc_yield: [
        { name: 'Moonwell', pct: 40, color: '#9EB3A8' },
        { name: 'Steakhouse Finance', pct: 30, color: '#9EB3A8' },
        { name: 'Gauntlet', pct: 30, color: '#E6F1E7' },
      ],
      btc_hedged: [
        { name: 'Derive', pct: 40, color: '#5B7A6E' },
        { name: 'Morpho', pct: 35, color: '#9EB3A8' },
        { name: 'Ethena', pct: 25, color: '#E6F1E7' },
      ],
      btc_spot: [
        { name: 'Coinbase Prime', pct: 60, color: '#F7931A' },
        { name: 'Fireblocks', pct: 40, color: '#E8A838' },
      ],
      btc_collateral_mining: [
        { name: 'Hearst Mining', pct: 40, color: '#D4A017' },
        { name: 'Aave', pct: 35, color: '#B07A1A' },
        { name: 'Morpho', pct: 25, color: '#9EB3A8' },
      ],
    }
    return breakdowns[strategy.type] ?? []
  }, [strategy])

  const userPosition = useMemo(
    () => ({
      totalAmount: vaultUserStats.deposited,
      totalPending: vaultUserStats.pending,
      totalClaimed: vaultUserStats.yieldEarned - vaultUserStats.pending,
      count: vaultUserStats.activeCount,
    }),
    [vaultUserStats],
  )

  if (!authed) return <LoadingScreen />

  if (!vault) {
    return (
      <div className="min-h-screen bg-[#F2F2F2]">
        <Header />
        <main className="pt-20 pb-10">
          <div className="page-container">
            <div className="mt-10 text-center">
              <p className="text-lg font-bold text-[#0E0F0F] mb-2">Vault not found</p>
              <p className="text-sm text-[#9EB3A8] mb-6">No vault matches &quot;{slug}&quot;</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 rounded-2xl text-sm font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const allocationData = vault.strategies.map((s) => ({
    name: s.label,
    value: s.allocation,
    color: s.color,
  }))

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Header />
      <TransactionProgress state={txSim.state} />

      <main className="pt-20 pb-10">
        <div className="page-container">
          {/* ─── Hero ─── */}
          <div className="rounded-3xl overflow-hidden shadow-md mt-6 mb-5">
            <div className="bg-[#E6F1E7] p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <Image
                  src={
                    vault?.name === 'Hearst Hedge'
                      ? '/assets/backgrounds/vault-card-1-bg.png'
                      : '/assets/backgrounds/vault-card-2-bg.png'
                  }
                  alt=""
                  fill
                  className="object-cover opacity-30 mix-blend-multiply"
                  sizes="100vw"
                />
              </div>
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: `radial-gradient(circle at 80% 20%, ${vault.strategies[0]?.color ?? '#96EA7A'}33, transparent 60%)`,
                }}
              />

              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                  <button
                    onClick={() => router.back()}
                    className="w-8 h-8 rounded-xl bg-[#F2F2F2] flex items-center justify-center hover:bg-[#E6F1E7] transition-colors shrink-0 self-start"
                    aria-label="Go back"
                  >
                    <svg
                      className="w-4 h-4 text-[#9EB3A8]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-[#96EA7A]/10 flex items-center justify-center shrink-0">
                      <Image
                        src="/assets/tokens/hearst.svg"
                        alt={vault.name}
                        width={28}
                        height={28}
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <h1 className="text-[2rem] sm:text-[2.5rem] font-black text-[#0E0F0F] tracking-tight leading-none">
                        {vault.name}
                      </h1>
                      <div className="flex items-center gap-2 mt-0.5">
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
                    </div>
                  </div>
                  {userPosition.totalPending > 0 && (
                    <button
                      onClick={() =>
                        deposits.filter((d) => d.pendingYield > 0).forEach((d) => handleClaim(d.id))
                      }
                      disabled={isClaimPending || isClaimConfirming}
                      className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#96EA7A]/5 border border-[#96EA7A]/20 hover:border-[#96EA7A]/50 hover:bg-[#96EA7A]/10 transition-all group self-start sm:self-auto disabled:opacity-50"
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
                        <p className="text-xs text-[#9EB3A8] font-medium">
                          {isClaimConfirmed ? 'Claimed!' : 'Pending Yield'}
                        </p>
                        <p className="text-lg font-black text-[#96EA7A]">
                          {fmtUsd(userPosition.totalPending)}
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
              </div>
            </div>

            {/* Body — white */}
            <div className="bg-white p-6 sm:p-8 rounded-b-3xl">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-[#9EB3A8]/10 rounded-xl overflow-hidden">
                {[
                  {
                    label: 'Your Deposit',
                    value: userPosition.totalAmount > 0 ? fmtUsd(userPosition.totalAmount) : '—',
                  },
                  {
                    label: 'Composite APY',
                    value: fmtApy(vault.compositeApy),
                    accent: true,
                  },
                  {
                    label: 'Yield Earned',
                    value:
                      userPosition.totalClaimed + userPosition.totalPending > 0
                        ? fmtUsd(userPosition.totalClaimed + userPosition.totalPending)
                        : '—',
                  },
                  { label: 'Lock Period', value: `${vault.lockPeriodMonths / 12} Years` },
                  {
                    label: 'ROI',
                    value:
                      userPosition.totalAmount > 0
                        ? `+${fmtPercent(((userPosition.totalClaimed + userPosition.totalPending) / userPosition.totalAmount) * 100)}`
                        : '—',
                    accent: userPosition.totalAmount > 0,
                  },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white px-5 py-4">
                    <p className="kpi-label mb-1">{kpi.label}</p>
                    <p
                      className={`text-lg font-black ${'accent' in kpi && kpi.accent ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}
                    >
                      {kpi.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Strategy Tabs ─── */}
          <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setSelectedStrategy(null)}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-all whitespace-nowrap shrink-0 ${!selectedStrategy ? 'bg-[#0E0F0F] text-white' : 'bg-white text-[#9EB3A8] hover:text-[#0E0F0F] border border-[#9EB3A8]/20'}`}
            >
              Overview
            </button>
            {vault.strategies.map((s) => (
              <button
                key={s.type}
                onClick={() => setSelectedStrategy(s.type)}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${selectedStrategy === s.type ? 'text-[#0E0F0F] border-2 shadow-sm' : 'bg-white text-[#9EB3A8] hover:text-[#0E0F0F] border border-[#9EB3A8]/20'}`}
                style={
                  selectedStrategy === s.type
                    ? { borderColor: s.color, backgroundColor: `${s.color}10` }
                    : undefined
                }
              >
                <Image
                  src={STRATEGY_ICONS[s.type] ?? ''}
                  alt={s.label}
                  width={16}
                  height={16}
                  className="rounded-full"
                />
                {s.label}
                <span className="text-xs font-bold opacity-50">{s.allocation}%</span>
              </button>
            ))}
          </div>

          <div className="space-y-4 mb-6">
            {/* ─── OVERVIEW TAB ─── */}
            {!strategy && (
              <>
                {/* Section: Strategy Allocation */}
                <h2 className="section-title mt-2">Strategy Allocation</h2>
                <div className="grid grid-cols-12 gap-4">
                  <div className={`col-span-12 lg:col-span-4 ${CARD} p-6 flex flex-col`}>
                    <h3 className="card-title mb-5">Allocation</h3>
                    <div className="flex flex-col items-center flex-1 justify-center">
                      <div className="w-32 h-32 mb-5 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={allocationData}
                              innerRadius={40}
                              outerRadius={60}
                              paddingAngle={3}
                              dataKey="value"
                              stroke="none"
                            >
                              {allocationData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Image
                            src="/assets/tokens/hearst-logo.svg"
                            alt="Hearst logo"
                            width={20}
                            height={20}
                          />
                        </div>
                      </div>
                      <div className="w-full space-y-3">
                        {vault.strategies.map((s) => (
                          <button
                            key={s.type}
                            onClick={() => setSelectedStrategy(s.type)}
                            className="flex items-center justify-between w-full hover:bg-[#F2F2F2] rounded-xl px-3 py-2.5 -mx-1 transition-colors group"
                          >
                            <div className="flex items-center gap-2.5">
                              <Image
                                src={STRATEGY_ICONS[s.type] ?? ''}
                                alt={s.label}
                                width={18}
                                height={18}
                                className="rounded-full"
                              />
                              <span className="text-sm text-[#0E0F0F] font-medium">{s.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-[#0E0F0F]">
                                {s.allocation}%
                              </span>
                              <svg
                                className="w-3 h-3 text-[#9EB3A8] opacity-0 group-hover:opacity-100 transition-opacity"
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
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-12 lg:col-span-8 space-y-3">
                    {vault.strategies.map((s) => (
                      <button
                        key={s.type}
                        onClick={() => setSelectedStrategy(s.type)}
                        className={`${CARD} p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all w-full flex items-start gap-4 group`}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${s.color}15` }}
                        >
                          <Image
                            src={STRATEGY_ICONS[s.type] ?? ''}
                            alt={s.label}
                            width={22}
                            height={22}
                            className="rounded-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-[#0E0F0F]">{s.label}</span>
                            <span
                              className={`text-caption font-bold px-3 py-1 rounded-full ${RISK_BG[s.riskLevel]}`}
                            >
                              {s.riskLevel}
                            </span>
                            <span className="text-xs font-black text-[#0E0F0F] bg-[#F2F2F2] px-2 py-0.5 rounded-full">
                              {s.allocation}%
                            </span>
                          </div>
                          <p className="text-xs text-[#9EB3A8] leading-relaxed mb-2">
                            {s.description}
                          </p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm font-black" style={{ color: s.color }}>
                              {s.apyRange[0]}–{s.apyRange[1]}% APY
                            </span>
                            <div className="h-4 w-px bg-[#9EB3A8]/15" />
                            <span className="text-sm font-bold text-[#0E0F0F]">
                              {fmtUsd((userPosition.totalAmount * s.allocation) / 100)}
                            </span>
                          </div>
                        </div>
                        <svg
                          className="w-4 h-4 text-[#9EB3A8] group-hover:text-[#96EA7A] group-hover:translate-x-0.5 transition-all shrink-0 self-center"
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
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section: Performance & Activity */}
                <h2 className="section-title mt-2">Performance & Activity</h2>
                <div className="grid grid-cols-12 gap-4">
                  <div className={`col-span-12 lg:col-span-8 ${CARD} overflow-hidden`}>
                    <div className="px-6 py-4 border-b border-[#9EB3A8]/10">
                      <h3 className="card-title">Monthly Performance</h3>
                    </div>
                    <div className="p-6 pb-3 bg-gradient-to-b from-white to-[#FAFBFA]">
                      <div className="h-56 lg:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={chartData}
                            margin={{ top: 5, right: 5, bottom: 0, left: -15 }}
                          >
                            <defs>
                              {vault.strategies.map((s) => (
                                <linearGradient
                                  key={s.type}
                                  id={`vgrad-ov-${s.type}`}
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                                  <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                                </linearGradient>
                              ))}
                            </defs>
                            <XAxis
                              dataKey="month"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#9EB3A8' }}
                              dy={6}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#9EB3A8' }}
                              tickFormatter={(v: number) => `${v}%`}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            {vault.strategies.map((s) => (
                              <Area
                                key={s.type}
                                type="monotone"
                                dataKey={s.type}
                                stroke={s.color}
                                strokeWidth={2}
                                fill={`url(#vgrad-ov-${s.type})`}
                                dot={false}
                                activeDot={{ r: 4, fill: s.color, stroke: '#fff', strokeWidth: 2 }}
                                name={s.label}
                              />
                            ))}
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-6 px-6 py-3 border-t border-[#9EB3A8]/10">
                      {vault.strategies.map((s) => (
                        <div key={s.type} className="flex items-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="text-xs text-[#9EB3A8] font-medium">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`col-span-12 lg:col-span-4 ${CARD} overflow-hidden flex flex-col`}
                  >
                    <div className="px-6 py-4 border-b border-[#9EB3A8]/10">
                      <h3 className="card-title">Activity</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[320px]">
                      {vaultActivity.map((a, i) => (
                        <div
                          key={a.id}
                          className={`px-5 py-4 flex items-start gap-3 ${i < vaultActivity.length - 1 ? 'border-b border-[#9EB3A8]/5' : ''}`}
                        >
                          <div
                            className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              a.type === 'rebalance'
                                ? 'bg-[#9EB3A8]/15'
                                : a.type === 'distribute'
                                  ? 'bg-[#96EA7A]/15'
                                  : 'bg-[#5B7A6E]/15'
                            }`}
                          >
                            <svg
                              className={`w-3.5 h-3.5 ${
                                a.type === 'rebalance'
                                  ? 'text-[#9EB3A8]'
                                  : a.type === 'distribute'
                                    ? 'text-[#96EA7A]'
                                    : 'text-[#5B7A6E]'
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              {a.type === 'rebalance' && (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.32-4.32M20 15a9 9 0 01-14.32 4.32"
                                />
                              )}
                              {a.type === 'distribute' && (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v8m-4-4h8"
                                />
                              )}
                              {a.type === 'deposit' && (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m0-16l-4 4m4-4l4 4"
                                />
                              )}
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0E0F0F] capitalize">
                              {a.type}
                            </p>
                            <p className="text-xs text-[#9EB3A8] truncate">{a.description}</p>
                          </div>
                          <span className="text-caption text-[#9EB3A8] whitespace-nowrap shrink-0">
                            {timeAgo(a.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section: Your Position */}
                {deposits.length > 0 && <h2 className="section-title mt-2">Your Position</h2>}
                {deposits.length > 0 && (
                  <div className={`${CARD} overflow-hidden`}>
                    <div className="px-6 py-4 border-b border-[#9EB3A8]/10 flex items-center justify-between">
                      <h3 className="card-title">Your Position</h3>
                      <span className="text-xs font-semibold text-[#9EB3A8] bg-[#F2F2F2] px-3 py-1.5 rounded-full">
                        {deposits.length} deposit{deposits.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="divide-y divide-[#9EB3A8]/5">
                      {deposits.map((dep, idx) => {
                        const totalYield = dep.claimedYield + dep.pendingYield
                        const daysRemaining = Math.max(
                          0,
                          Math.ceil((dep.maturityTimestamp - Date.now() / 1000) / 86400),
                        )
                        const statusColor = '#96EA7A'
                        const statusBg: Record<string, string> = {
                          active: 'bg-[#96EA7A]/15',
                          target_reached: 'bg-[#96EA7A]/15',
                          matured: 'bg-[#0E0F0F]/8',
                        }

                        const isEvenRow = idx % 2 === 1
                        return (
                          <div key={dep.id} className={`p-6 ${isEvenRow ? 'bg-[#F2F2F2]/50' : ''}`}>
                            <div className="flex items-center justify-between mb-4">
                              <span
                                className={`text-caption font-semibold px-2.5 py-1 rounded-full ${statusBg[dep.lockStatus] ?? ''} ${getLockStatusColor(dep.lockStatus)}`}
                              >
                                {getLockStatusLabel(dep.lockStatus)}
                              </span>
                              <span className="text-xs text-[#9EB3A8] font-medium">
                                {dep.lockStatus === 'matured' || dep.lockStatus === 'target_reached'
                                  ? 'Withdraw available'
                                  : `${daysRemaining}d to unlock`}
                              </span>
                            </div>

                            <div className="flex items-center gap-5 mb-5">
                              <div className="relative shrink-0">
                                <ProgressRing percent={dep.progressPercent} color={statusColor} />
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-[#0E0F0F]">
                                  {dep.progressPercent}%
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 flex-1">
                                <div>
                                  <p className="kpi-label mb-0.5">Deposited</p>
                                  <p className="text-base font-black text-[#0E0F0F]">
                                    {fmtUsd(dep.amount)}
                                  </p>
                                </div>
                                <div>
                                  <p className="kpi-label mb-0.5">Yield Earned</p>
                                  <p className="text-base font-black text-[#96EA7A]">
                                    +{fmtUsd(totalYield)}
                                  </p>
                                </div>
                                <div>
                                  <p className="kpi-label mb-0.5">Pending</p>
                                  <p className="text-base font-black text-[#0E0F0F]">
                                    {fmtUsd(dep.pendingYield)}
                                  </p>
                                </div>
                                <div>
                                  <p className="kpi-label mb-0.5">Target</p>
                                  <p className="text-base font-black text-[#0E0F0F]">
                                    {fmtPercent((totalYield / dep.amount) * 100)} / 36%
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="mb-4">
                              <div className="h-2 bg-[#F2F2F2] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${dep.progressPercent}%`,
                                    backgroundColor: statusColor,
                                  }}
                                />
                              </div>
                            </div>

                            {dep.lockStatus === 'matured' || dep.lockStatus === 'target_reached' ? (
                              <div className="p-5 bg-[#96EA7A]/5 rounded-xl border border-[#96EA7A]/15 space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-7 h-7 rounded-lg bg-[#96EA7A]/15 flex items-center justify-center">
                                    <svg
                                      className="w-3.5 h-3.5 text-[#96EA7A]"
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
                                  </div>
                                  <span className="text-sm font-bold text-[#0E0F0F]">
                                    Withdraw Available
                                  </span>
                                </div>

                                {(() => {
                                  const exitFee = (dep.amount * vault.fees.exit) / 100
                                  const netReceive = dep.amount + dep.pendingYield - exitFee
                                  return (
                                    <>
                                      <div className="space-y-0">
                                        <div className="flex justify-between py-2 border-b border-[#9EB3A8]/8">
                                          <span className="text-xs text-[#9EB3A8]">Principal</span>
                                          <span className="text-sm font-bold text-[#0E0F0F]">
                                            {fmtUsd(dep.amount)}
                                          </span>
                                        </div>
                                        {dep.pendingYield > 0 && (
                                          <div className="flex justify-between py-2 border-b border-[#9EB3A8]/8">
                                            <span className="text-xs text-[#9EB3A8]">
                                              Unclaimed Yield
                                            </span>
                                            <span className="text-sm font-bold text-[#96EA7A]">
                                              +{fmtUsd(dep.pendingYield)}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex justify-between py-2 border-b border-[#9EB3A8]/8">
                                          <span className="text-xs text-[#9EB3A8]">
                                            Exit Fee ({vault.fees.exit}%)
                                          </span>
                                          <span className="text-sm font-bold text-[#0E0F0F]">
                                            −{fmtUsd(exitFee)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3">
                                          <span className="text-sm font-semibold text-[#0E0F0F]">
                                            You Receive
                                          </span>
                                          <span className="text-lg font-black text-[#0E0F0F]">
                                            {fmtUsd(netReceive)}
                                          </span>
                                        </div>
                                      </div>

                                      <button
                                        onClick={() => handleWithdraw(dep.id, dep.amount)}
                                        disabled={isWithdrawPending || isWithdrawConfirming}
                                        className="w-full h-12 rounded-full text-sm font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] shadow-lg shadow-[#96EA7A]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
                                      >
                                        {isWithdrawPending
                                          ? 'Confirm in wallet...'
                                          : isWithdrawConfirming
                                            ? 'Processing...'
                                            : isWithdrawConfirmed
                                              ? 'Withdrawn ✓'
                                              : `Withdraw ${fmtUsd(netReceive)}`}
                                      </button>
                                    </>
                                  )
                                })()}
                              </div>
                            ) : (
                              dep.pendingYield > 0 && (
                                <div className="flex items-center justify-between p-4 bg-[#96EA7A]/5 rounded-xl border border-[#96EA7A]/15">
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
                                      <p className="text-sm font-bold text-[#0E0F0F]">
                                        {isClaimConfirmed ? 'Claimed!' : fmtUsd(dep.pendingYield)}
                                      </p>
                                      <p className="text-xs text-[#9EB3A8]">
                                        monthly yield to claim
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleClaim(dep.id)}
                                    disabled={isClaimPending || isClaimConfirming}
                                    className="px-5 py-2.5 rounded-full text-sm font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
                                  >
                                    {isClaimPending
                                      ? 'Confirm in wallet...'
                                      : isClaimConfirming
                                        ? 'Processing...'
                                        : isClaimConfirmed
                                          ? 'Done'
                                          : 'Claim'}
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Section: Vault Info */}
                <h2 className="section-title mt-2">Vault Info</h2>
                <div className={`${CARD} overflow-hidden`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 p-6 gap-6">
                    <div className="space-y-0">
                      {[
                        { label: 'Management', value: `${vault.fees.management}%`, sub: 'Annual' },
                        {
                          label: 'Performance',
                          value: `${vault.fees.performance}%`,
                          sub: 'On yield',
                        },
                        { label: 'Exit', value: `${vault.fees.exit}%`, sub: 'On principal' },
                        {
                          label: 'Early Exit',
                          value: `${vault.fees.earlyExit}%`,
                          sub: 'Penalty',
                          warn: true,
                        },
                      ].map((fee, idx) => (
                        <div
                          key={fee.label}
                          className={`flex items-center justify-between py-3 border-b border-[#9EB3A8]/8 last:border-0 px-3 rounded-lg transition-colors ${idx % 2 === 1 ? 'bg-[#F2F2F2]/50 hover:bg-white' : 'hover:bg-[#F2F2F2]/50'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[#0E0F0F]">{fee.label}</span>
                            <span className="text-caption text-[#9EB3A8]">({fee.sub})</span>
                          </div>
                          <span
                            className={`text-sm font-bold ${'warn' in fee && fee.warn ? 'text-[#E8A838]' : 'text-[#0E0F0F]'}`}
                          >
                            {fee.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-0">
                      {[
                        {
                          label: 'Contract',
                          value: `${vault.contractAddress.slice(0, 6)}...${vault.contractAddress.slice(-4)}`,
                          mono: true,
                        },
                        { label: 'Network', value: 'Base (8453)' },
                        { label: 'Deposit Token', value: vault.depositToken },
                        { label: 'Total Shares', value: fmt(vault.totalShares), mono: true },
                      ].map((p, idx) => (
                        <div
                          key={p.label}
                          className={`flex items-center justify-between py-3 border-b border-[#9EB3A8]/8 last:border-0 px-3 rounded-lg transition-colors ${idx % 2 === 1 ? 'bg-[#F2F2F2]/50 hover:bg-white' : 'hover:bg-[#F2F2F2]/50'}`}
                        >
                          <span className="text-sm text-[#0E0F0F]">{p.label}</span>
                          <span
                            className={`text-sm font-bold text-[#0E0F0F] ${'mono' in p && p.mono ? 'font-mono' : ''}`}
                          >
                            {p.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ─── STRATEGY TAB ─── */}
            {strategy && (
              <>
                <div className={`${CARD} p-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${strategy.color}15` }}
                    >
                      <Image
                        src={STRATEGY_ICONS[strategy.type] ?? ''}
                        alt={strategy.label}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="section-title">{strategy.label}</h2>
                        <span
                          className={`text-caption font-bold px-3 py-1 rounded-full ${RISK_BG[strategy.riskLevel]}`}
                        >
                          {strategy.riskLevel} risk
                        </span>
                      </div>
                      <p className="text-xs text-[#9EB3A8] mt-0.5">{strategy.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-px bg-[#9EB3A8]/10 rounded-xl overflow-hidden mb-4">
                    <div className="bg-white px-5 py-4">
                      <p className="kpi-label mb-1">Allocation</p>
                      <p className="text-lg font-black text-[#0E0F0F]">{strategy.allocation}%</p>
                    </div>
                    <div className="bg-white px-5 py-4">
                      <p className="kpi-label mb-1">APY Range</p>
                      <p className="text-lg font-black" style={{ color: strategy.color }}>
                        {strategy.apyRange[0]}–{strategy.apyRange[1]}%
                      </p>
                    </div>
                    <div className="bg-white px-5 py-4">
                      <p className="kpi-label mb-1">TVL Allocated</p>
                      <p className="text-lg font-black text-[#0E0F0F]">
                        {fmtUsd(MOCK_PROTOCOL_STATS.tvlByStrategy[strategy.type])}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {strategy.protocols.map((p) => (
                      <span
                        key={p}
                        className="text-xs text-[#9EB3A8] bg-[#F2F2F2] px-3 py-1.5 rounded-full font-medium"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {protocolBreakdown.length > 0 && (
                  <div className={`${CARD} p-6`}>
                    <h3 className="card-title mb-5">Protocol Breakdown</h3>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={protocolBreakdown}
                              innerRadius={28}
                              outerRadius={42}
                              paddingAngle={2}
                              dataKey="pct"
                              stroke="none"
                            >
                              {protocolBreakdown.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-3">
                        {protocolBreakdown.map((p) => (
                          <div key={p.name}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: p.color }}
                                />
                                <span className="text-sm text-[#0E0F0F] font-medium">{p.name}</span>
                              </div>
                              <span className="text-sm font-bold text-[#0E0F0F]">{p.pct}%</span>
                            </div>
                            <div className="h-1.5 bg-[#F2F2F2] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${p.pct}%`, backgroundColor: p.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className={`${CARD} overflow-hidden`}>
                  <div className="px-6 py-4 border-b border-[#9EB3A8]/10">
                    <h3 className="card-title">{strategy.label} Performance</h3>
                    <p className="text-xs text-[#9EB3A8] mt-0.5">Monthly yield %</p>
                  </div>
                  <div className="p-6 pb-3 bg-gradient-to-b from-white to-[#FAFBFA]">
                    <div className="h-56 lg:h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData}
                          margin={{ top: 5, right: 5, bottom: 0, left: -15 }}
                        >
                          <defs>
                            <linearGradient
                              id={`vgrad-st-${strategy.type}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor={strategy.color} stopOpacity={0.25} />
                              <stop offset="100%" stopColor={strategy.color} stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#9EB3A8' }}
                            dy={6}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#9EB3A8' }}
                            tickFormatter={(v: number) => `${v}%`}
                          />
                          <Tooltip content={<ChartTooltip />} />
                          <Area
                            type="monotone"
                            dataKey={strategy.type}
                            stroke={strategy.color}
                            strokeWidth={2.5}
                            fill={`url(#vgrad-st-${strategy.type})`}
                            dot={false}
                            activeDot={{
                              r: 5,
                              fill: strategy.color,
                              stroke: '#fff',
                              strokeWidth: 2,
                            }}
                            name={strategy.label}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
