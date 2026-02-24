'use client'

import { Header } from '@/components/Header'
import {
  HEARST_VAULT,
  MOCK_MONTHLY_PERFORMANCE,
  MOCK_PROTOCOL_STATS,
  MOCK_RECENT_TRANSACTIONS,
  fmtPercent,
  fmtUsd
} from '@/config/mock-data'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  XAxis, YAxis,
} from 'recharts'
import { useAccount } from 'wagmi'

import { AdminTooltip, ChartTooltip } from '@/components/ui/ChartTooltip'
import { CARD, STRATEGY_ICONS } from '@/components/ui/constants'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

const SYSTEM_HEALTH = [
  { name: 'Smart Contracts', status: 'Online', latency: 12 },
  { name: 'Oracle Feed', status: 'Online', latency: 45 },
  { name: 'Base RPC', status: 'Online', latency: 22 },
  { name: 'Rebalancer', status: 'Online', latency: 38 },
] as const

const PAST_DISTRIBUTIONS = [
  { period: 8, amount: 52000, label: 'P8' },
  { period: 7, amount: 48000, label: 'P7' },
  { period: 6, amount: 55000, label: 'P6' },
  { period: 5, amount: 42000, label: 'P5' },
  { period: 4, amount: 38000, label: 'P4' },
  { period: 3, amount: 61000, label: 'P3' },
] as const

export default function Admin() {
  const { isConnected } = useAccount()
  const router = useRouter()
  const [selectedAction, setSelectedAction] = useState<'distribute' | 'rebalance' | null>(null)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected) router.replace('/login')
  }, [isConnected, router])

  if (!isConnected) return <LoadingScreen />

  const vault = HEARST_VAULT
  const stats = MOCK_PROTOCOL_STATS

  const tvlAllocationData = vault.strategies.map(s => ({
    name: s.label,
    value: stats.tvlByStrategy[s.type],
    color: s.color,
  }))

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Header />

      <main className="pt-20 pb-10">
        <div className="page-container">

          {actionFeedback && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-[#96EA7A] text-[#0E0F0F] font-bold text-sm rounded-2xl shadow-xl animate-pulse">
              {actionFeedback}
            </div>
          )}

          {/* ─── Hero ─── */}
          <div className={`${CARD} p-6 sm:p-8 relative overflow-hidden mt-6 mb-5`}>
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-[#9EB3A8]/6 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-black text-[#0E0F0F] tracking-tight">Operational Cockpit</h1>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#96EA7A]/10 rounded-full">
                      <span className="w-2 h-2 bg-[#96EA7A] rounded-full animate-pulse" />
                      <span className="text-caption text-[#96EA7A] font-bold">Live</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#9EB3A8]">Monitor TVL, distributions, and protocol health</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => setSelectedAction(selectedAction === 'distribute' ? null : 'distribute')}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] shadow-lg shadow-[#96EA7A]/20 transition-all active:scale-[0.98]"
                  >
                    Distribute
                  </button>
                  <button
                    onClick={() => setSelectedAction(selectedAction === 'rebalance' ? null : 'rebalance')}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-[#0E0F0F] border border-[#9EB3A8]/20 hover:border-[#96EA7A] transition-all"
                  >
                    Rebalance
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-[#9EB3A8]/10 rounded-xl overflow-hidden">
                {[
                  { label: 'Total TVL', value: fmtUsd(vault.currentTvl) },
                  { label: 'Depositors', value: String(stats.activeDepositors) },
                  { label: 'Total Deposits', value: String(stats.totalDeposits) },
                  { label: 'Fees Collected', value: fmtUsd(stats.totalFeesCollected), accent: true },
                  { label: 'Yield Distributed', value: fmtUsd(stats.totalYieldDistributed), accent: true },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white px-5 py-4">
                    <p className="kpi-label mb-1">{kpi.label}</p>
                    <p className={`text-lg font-black ${'accent' in kpi && kpi.accent ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Action Panel (conditional) ─── */}
          {selectedAction && (
            <div className={`${CARD} p-6 mb-5`}>
              {selectedAction === 'distribute' && (
                <div>
                  <h3 className="card-title mb-4">Distribute Rewards</h3>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block kpi-label mb-2">Reward Amount (USDC)</label>
                      <input className="w-full h-14 px-4 rounded-2xl bg-[#F2F2F2] border border-[#9EB3A8]/20 text-[#0E0F0F] font-black text-xl focus:ring-2 focus:ring-[#96EA7A] focus:border-transparent outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0.00" type="number" />
                    </div>
                    <button
                      onClick={() => { setActionFeedback('Distribution submitted successfully'); setSelectedAction(null); setTimeout(() => setActionFeedback(null), 4000) }}
                      className="h-14 px-6 rounded-2xl text-base font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] shadow-lg shadow-[#96EA7A]/20 transition-all active:scale-[0.98] shrink-0"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}

              {selectedAction === 'rebalance' && (
                <div>
                  <h3 className="card-title mb-4">Trigger Rebalance</h3>
                  <div className="space-y-3 mb-5">
                    {vault.strategies.map(s => {
                      const target = (vault.currentTvl * s.allocation) / 100
                      const actual = stats.tvlByStrategy[s.type]
                      const drift = ((actual - target) / target * 100)
                      return (
                        <div key={s.type} className="flex items-center justify-between p-3 bg-[#F2F2F2] rounded-xl">
                          <div className="flex items-center gap-2.5">
                            <Image src={STRATEGY_ICONS[s.type] ?? ''} alt={s.label} width={18} height={18} className="rounded-full" />
                            <span className="text-sm font-medium text-[#0E0F0F]">{s.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[#9EB3A8]">{fmtUsd(actual)} / {fmtUsd(target)}</span>
                            <span className={`text-sm font-bold ${Math.abs(drift) < 2 ? 'text-[#96EA7A]' : 'text-[#E8A838]'}`}>
                              {drift > 0 ? '+' : ''}{drift.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => { setActionFeedback('Rebalance executed successfully'); setSelectedAction(null); setTimeout(() => setActionFeedback(null), 4000) }}
                    className="w-full h-12 rounded-2xl text-sm font-bold bg-[#0E0F0F] text-white hover:bg-[#0E0F0F]/90 transition-all active:scale-[0.98]"
                  >
                    Execute Rebalance
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── Strategy Cards ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {vault.strategies.map((strategy) => {
              const tvl = stats.tvlByStrategy[strategy.type]
              const apy = stats.apyByStrategy[strategy.type]
              const targetTvl = (vault.currentTvl * strategy.allocation) / 100
              const drift = ((tvl - targetTvl) / targetTvl * 100)

              return (
                <div key={strategy.type} className={`${CARD} p-5 hover:shadow-md transition-all`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${strategy.color}15` }}>
                        <Image src={STRATEGY_ICONS[strategy.type] ?? ''} alt={strategy.label} width={20} height={20} className="rounded-full" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-[#0E0F0F]">{strategy.label}</span>
                        <p className="text-caption text-[#9EB3A8] font-medium">{strategy.allocation}% allocation</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-px bg-[#9EB3A8]/10 rounded-xl overflow-hidden mb-4">
                    <div className="bg-white px-3 py-2.5">
                      <p className="kpi-label mb-0.5">TVL</p>
                      <p className="text-sm font-black text-[#0E0F0F]">{fmtUsd(tvl)}</p>
                    </div>
                    <div className="bg-white px-3 py-2.5">
                      <p className="kpi-label mb-0.5">APY</p>
                      <p className="text-sm font-black" style={{ color: strategy.color }}>{fmtPercent(apy)}</p>
                    </div>
                    <div className="bg-white px-3 py-2.5">
                      <p className="kpi-label mb-0.5">Drift</p>
                      <p className={`text-sm font-black ${Math.abs(drift) < 2 ? 'text-[#96EA7A]' : 'text-[#E8A838]'}`}>
                        {drift > 0 ? '+' : ''}{drift.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {strategy.protocols.map(p => (
                      <span key={p} className="text-caption text-[#9EB3A8] bg-[#F2F2F2] px-2 py-0.5 rounded-full font-medium">{p}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ─── Charts: Allocation + Performance + Distribution ─── */}
          <div className="grid grid-cols-12 gap-4 mb-5">
            {/* TVL Allocation */}
            <div className={`col-span-12 sm:col-span-6 lg:col-span-4 ${CARD} p-6`}>
              <h3 className="card-title mb-4">TVL Allocation</h3>
              <div className="flex items-center gap-5">
                <div className="w-24 h-24 shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={tvlAllocationData} innerRadius={30} outerRadius={44} paddingAngle={3} dataKey="value" stroke="none">
                        {tvlAllocationData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Image src="/assets/tokens/hearst-logo.svg" alt="H" width={16} height={16} />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  {tvlAllocationData.map(a => (
                    <div key={a.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                          <span className="text-xs text-[#9EB3A8] font-medium">{a.name}</span>
                        </div>
                        <span className="text-xs font-bold text-[#0E0F0F]">{fmtUsd(a.value)}</span>
                      </div>
                      <div className="h-1 bg-[#F2F2F2] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(a.value / vault.currentTvl * 100)}%`, backgroundColor: a.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className={`col-span-12 lg:col-span-4 ${CARD} overflow-hidden`}>
              <div className="px-6 py-4 border-b border-[#9EB3A8]/10">
                <h3 className="card-title">Strategy Performance</h3>
              </div>
              <div className="px-4 pt-4 pb-2 bg-gradient-to-b from-white to-[#FAFBFA]">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_MONTHLY_PERFORMANCE} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <defs>
                        {vault.strategies.map(s => (
                          <linearGradient key={s.type} id={`admgrad-${s.type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={s.color} stopOpacity={0.2} />
                            <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                          </linearGradient>
                        ))}
                      </defs>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9EB3A8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9EB3A8' }} tickFormatter={(v: number) => `${v}%`} />
                      <Tooltip content={<ChartTooltip />} />
                      {vault.strategies.map(s => (
                        <Area key={s.type} type="monotone" dataKey={s.type} stroke={s.color} strokeWidth={1.5}
                          fill={`url(#admgrad-${s.type})`} dot={false}
                          activeDot={{ r: 3, fill: s.color, stroke: '#fff', strokeWidth: 2 }} name={s.label} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 px-4 py-2.5 border-t border-[#9EB3A8]/10">
                {vault.strategies.map(s => (
                  <div key={s.type} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-caption text-[#9EB3A8] font-medium">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribution History */}
            <div className={`col-span-12 sm:col-span-6 lg:col-span-4 ${CARD} p-6 flex flex-col`}>
              <h3 className="card-title mb-1">Distribution History</h3>
              <p className="text-xs text-[#9EB3A8] mb-4">Per-period rewards</p>
              <div className="flex-1 min-h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...PAST_DISTRIBUTIONS].reverse()} margin={{ top: 0, right: 0, bottom: 0, left: -15 }}>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9EB3A8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9EB3A8' }} tickFormatter={(v: number) => `$${v / 1000}k`} />
                    <Tooltip content={<AdminTooltip />} />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="#96EA7A">
                      {[...PAST_DISTRIBUTIONS].reverse().map((_entry, i, arr) => (
                        <Cell key={i} fill="#96EA7A" fillOpacity={i === arr.length - 1 ? 1 : 0.45} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#9EB3A8]/10">
                <span className="text-xs text-[#9EB3A8]">Total distributed</span>
                <span className="text-base font-black text-[#96EA7A]">{fmtUsd(PAST_DISTRIBUTIONS.reduce((s, d) => s + d.amount, 0))}</span>
              </div>
            </div>
          </div>

          {/* ─── System Health + Lock Stats + Fees + Transactions ─── */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 xl:col-span-4 space-y-4">
              {/* System Health */}
              <div className={`${CARD} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="card-title">System Health</h3>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#96EA7A]/10 rounded-full">
                    <span className="w-2 h-2 bg-[#96EA7A] rounded-full animate-pulse" />
                    <span className="text-xs text-[#96EA7A] font-bold">All OK</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {SYSTEM_HEALTH.map((s) => (
                    <div key={s.name} className="flex items-center justify-between p-3 bg-[#F2F2F2] rounded-xl">
                      <span className="text-xs font-medium text-[#0E0F0F]">{s.name}</span>
                      <div className="flex items-center gap-2.5">
                        <div className="w-12 h-1.5 rounded-full bg-white overflow-hidden">
                          <div className={`h-full rounded-full ${s.latency < 30 ? 'bg-[#96EA7A]' : 'bg-[#9EB3A8]'}`}
                            style={{ width: `${Math.min(s.latency * 2, 100)}%` }} />
                        </div>
                        <span className="text-xs font-mono text-[#9EB3A8] w-10 text-right">{s.latency}ms</span>
                        <span className="w-2 h-2 bg-[#96EA7A] rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-px bg-[#9EB3A8]/10 rounded-xl overflow-hidden mt-4">
                  <div className="bg-white px-4 py-3 text-center">
                    <p className="kpi-label mb-0.5">Uptime</p>
                    <p className="text-base font-black text-[#0E0F0F]">99.99%</p>
                  </div>
                  <div className="bg-white px-4 py-3 text-center">
                    <p className="kpi-label mb-0.5">Avg Latency</p>
                    <p className="text-base font-black text-[#0E0F0F]">{Math.round(SYSTEM_HEALTH.reduce((s, h) => s + h.latency, 0) / SYSTEM_HEALTH.length)}ms</p>
                  </div>
                </div>
              </div>

              {/* Lock Stats */}
              <div className={`${CARD} p-6`}>
                <h3 className="card-title mb-4">Lock Statistics</h3>
                <div className="space-y-0">
                  {[
                    { label: 'Users Locked', value: String(stats.activeDepositors) },
                    { label: 'Total Principal', value: fmtUsd(vault.currentTvl) },
                    { label: 'Yield Distributed', value: fmtUsd(stats.totalYieldDistributed), accent: true },
                    { label: 'Avg Lock Duration', value: '2.1Y' },
                    { label: 'Post-Cliff Users', value: '18' },
                    { label: 'Matured Positions', value: '3' },
                  ].map(stat => (
                    <div key={stat.label} className="flex items-center justify-between py-2.5 border-b border-[#9EB3A8]/8 last:border-0">
                      <span className="text-sm text-[#9EB3A8]">{stat.label}</span>
                      <span className={`text-sm font-bold ${'accent' in stat && stat.accent ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fee Config */}
              <div className={`${CARD} p-6`}>
                <h3 className="card-title mb-4">Fee Configuration</h3>
                <div className="space-y-0">
                  {[
                    { label: 'Management', value: `${vault.fees.management}%`, bps: `${vault.fees.management * 100} bps` },
                    { label: 'Performance', value: `${vault.fees.performance}%`, bps: `${vault.fees.performance * 100} bps` },
                    { label: 'Exit', value: `${vault.fees.exit}%`, bps: `${vault.fees.exit * 100} bps` },
                    { label: 'Early Exit', value: `${vault.fees.earlyExit}%`, bps: `${vault.fees.earlyExit * 100} bps`, warn: true },
                  ].map(fee => (
                    <div key={fee.label} className="flex items-center justify-between py-2.5 border-b border-[#9EB3A8]/8 last:border-0">
                      <span className="text-sm text-[#0E0F0F]">{fee.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#9EB3A8] font-mono">{fee.bps}</span>
                        <span className={`text-sm font-bold ${'warn' in fee && fee.warn ? 'text-[#E8A838]' : 'text-[#0E0F0F]'}`}>{fee.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Transactions */}
            <div className={`col-span-12 xl:col-span-8 ${CARD} overflow-hidden flex flex-col`}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#9EB3A8]/10">
                <div>
                  <h3 className="card-title">Live Transactions</h3>
                  <p className="text-xs text-[#9EB3A8] mt-0.5">Real-time protocol activity</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#96EA7A]/10 rounded-full">
                  <span className="w-2 h-2 bg-[#96EA7A] rounded-full animate-pulse" />
                  <span className="text-xs text-[#96EA7A] font-bold">Streaming</span>
                </div>
              </div>
              <div className="divide-y divide-[#9EB3A8]/5 flex-1 overflow-y-auto">
                {MOCK_RECENT_TRANSACTIONS.map((tx) => {
                  const colorMap: Record<string, { icon: string; bg: string; text: string }> = {
                    deposit: { icon: 'M19 14l-7 7m0 0l-7-7m7 7V3', bg: 'bg-[#9EB3A8]/10', text: 'text-[#9EB3A8]' },
                    claim: { icon: 'M5 10l7-7m0 0l7 7m-7-7v18', bg: 'bg-[#96EA7A]/10', text: 'text-[#96EA7A]' },
                    withdraw: { icon: 'M5 10l7-7m0 0l7 7m-7-7v18', bg: 'bg-[#9EB3A8]/10', text: 'text-[#9EB3A8]' },
                    rebalance: { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', bg: 'bg-[#9EB3A8]/10', text: 'text-[#9EB3A8]' },
                    distribute: { icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7', bg: 'bg-[#96EA7A]/10', text: 'text-[#96EA7A]' },
                  }
                  const c = colorMap[tx.type] ?? colorMap.deposit
                  const timeAgoVal = (() => {
                    const now = Math.floor(Date.now() / 1000)
                    const diff = now - tx.timestamp
                    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
                    return `${Math.floor(diff / 86400)}d ago`
                  })()

                  return (
                    <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#F2F2F2]/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.bg}`}>
                          <svg className={`w-4 h-4 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.icon} />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-[#0E0F0F] capitalize">{tx.type}</p>
                            {tx.strategy && (
                              <span className="text-caption text-[#9EB3A8] bg-[#F2F2F2] px-1.5 py-0.5 rounded-full">{vault.strategies.find(s => s.type === tx.strategy)?.label}</span>
                            )}
                          </div>
                          <p className="text-xs text-[#9EB3A8] font-mono truncate">{tx.address}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className={`text-sm font-bold ${tx.type === 'claim' || tx.type === 'distribute' ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}>
                          {tx.type === 'claim' || tx.type === 'distribute' ? '+' : ''}{fmtUsd(tx.amount)}
                        </p>
                        <p className="text-xs text-[#9EB3A8]">{timeAgoVal}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
