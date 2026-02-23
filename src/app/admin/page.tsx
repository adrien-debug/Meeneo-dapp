'use client'

import { Header } from '@/components/Header'
import { CONTRACT_CONFIG } from '@/config/contracts'
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

const CARD = 'bg-white rounded-2xl border border-[#9EB3A8]/20'
const STRATEGY_ICONS: Record<string, string> = { rwa_mining: '/assets/tokens/hearst-logo.png', usdc_yield: '/assets/tokens/usdc.svg', btc_hedged: '/assets/tokens/btc.svg' }

const SYSTEM_HEALTH = [
  { name: 'Smart Contracts', status: 'Online', latency: 12 },
  { name: 'Oracle Feed', status: 'Online', latency: 45 },
  { name: 'Base RPC', status: 'Online', latency: 22 },
  { name: 'Rebalancer', status: 'Online', latency: 38 },
] as const

const EPOCH_DISTRIBUTIONS = [
  { epoch: 8, amount: 52000, label: 'E8' },
  { epoch: 7, amount: 48000, label: 'E7' },
  { epoch: 6, amount: 55000, label: 'E6' },
  { epoch: 5, amount: 42000, label: 'E5' },
  { epoch: 4, amount: 38000, label: 'E4' },
  { epoch: 3, amount: 61000, label: 'E3' },
] as const

function AdminTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#F2F2F2] border border-[#9EB3A8] text-[#0E0F0F] px-2.5 py-1.5 rounded-2xl shadow-xl text-[10px]">
      <p className="text-[#9EB3A8] mb-0.5">{label}</p>
      <p className="font-bold">{fmtUsd(payload[0].value)}</p>
    </div>
  )
}

function MiniSparkline({ data, color = '#96EA7A' }: { data: number[]; color?: string }) {
  const sparkData = data.map((v, i) => ({ v, i }))
  const gradientId = `adminspark-${color.replace('#', '')}-${Math.random().toString(36).slice(2, 6)}`
  return (
    <div className="h-5 w-14">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gradientId})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Admin() {
  const { isConnected } = useAccount()
  const router = useRouter()
  const [selectedAction, setSelectedAction] = useState<'distribute' | 'epoch' | 'rebalance' | null>(null)

  useEffect(() => {
    if (!isConnected) router.replace('/login')
  }, [isConnected, router])

  if (!isConnected) return null

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

      <main className="pt-16 pb-8">
        <div className="w-full px-4 sm:px-5 lg:px-8 xl:px-12">

          {/* Hero */}
          <div className="mb-5 pt-2">
            <h1 className="text-xl font-bold text-[#0E0F0F] tracking-tight">Operational Cockpit</h1>
          </div>

          {/* Top KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-5">
            {[
              { label: 'Total TVL', value: fmtUsd(vault.currentTvl), color: 'text-[#0E0F0F]', spark: [8.2, 9.1, 10.5, 11.2, 11.8, 12.48] },
              { label: 'Depositors', value: String(stats.activeDepositors), color: 'text-[#0E0F0F]', spark: [28, 32, 38, 40, 44, 47] },
              { label: 'Total Deposits', value: String(stats.totalDeposits), color: 'text-[#0E0F0F]' },
              { label: 'Fees Collected', value: fmtUsd(stats.totalFeesCollected), color: 'text-[#96EA7A]' },
              { label: 'Yield Distributed', value: fmtUsd(stats.totalYieldDistributed), color: 'text-[#96EA7A]', spark: [600, 720, 850, 980, 1100, 1248] },
              { label: 'Current Epoch', value: String(vault.currentEpoch), color: 'text-[#9EB3A8]' },
            ].map((kpi) => (
              <div key={kpi.label} className={`${CARD} p-3`}>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-[#9EB3A8] uppercase tracking-wider">{kpi.label}</p>
                  {'spark' in kpi && kpi.spark && <MiniSparkline data={kpi.spark} />}
                </div>
                <p className={`text-sm font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Strategy TVL + APY + Drift */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {vault.strategies.map((strategy) => {
              const tvl = stats.tvlByStrategy[strategy.type]
              const apy = stats.apyByStrategy[strategy.type]
              const targetTvl = (vault.currentTvl * strategy.allocation) / 100
              const drift = ((tvl - targetTvl) / targetTvl * 100)
              const perfData = MOCK_MONTHLY_PERFORMANCE.map(m => m[strategy.type])

              return (
                <div key={strategy.type} className={`${CARD} p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Image src={STRATEGY_ICONS[strategy.type] ?? ''} alt={strategy.label} width={18} height={18} className="rounded-full" />
                      <span className="text-xs font-bold text-[#0E0F0F]">{strategy.label}</span>
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: strategy.color }}>{strategy.allocation}%</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                      <p className="text-[10px] text-[#9EB3A8] uppercase">TVL</p>
                      <p className="text-[11px] font-black text-[#0E0F0F]">{fmtUsd(tvl)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#9EB3A8] uppercase">APY</p>
                      <p className="text-[11px] font-black" style={{ color: strategy.color }}>{fmtPercent(apy)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#9EB3A8] uppercase">Drift</p>
                      <p className={`text-[11px] font-black ${Math.abs(drift) < 2 ? 'text-[#96EA7A]' : 'text-[#9EB3A8]'}`}>
                        {drift > 0 ? '+' : ''}{drift.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <MiniSparkline data={perfData} color={strategy.color} />

                  <div className="flex flex-wrap gap-1 mt-2">
                    {strategy.protocols.map(p => (
                      <span key={p} className="text-[10px] text-[#9EB3A8] bg-[#F2F2F2] px-1.5 py-0.5 rounded-full">{p}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-12 gap-3 mb-5">
            {/* TVL Allocation Donut */}
            <div className={`col-span-12 sm:col-span-6 lg:col-span-4 ${CARD} p-4`}>
              <h3 className="text-sm font-bold text-[#0E0F0F] mb-3">TVL Allocation</h3>
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={tvlAllocationData} innerRadius={26} outerRadius={36} paddingAngle={3} dataKey="value" stroke="none">
                        {tvlAllocationData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {tvlAllocationData.map(a => (
                    <div key={a.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                        <span className="text-[10px] text-[#9EB3A8]">{a.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#0E0F0F]">{fmtUsd(a.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Distribution History Bar Chart */}
            <div className={`col-span-12 sm:col-span-6 lg:col-span-4 ${CARD} p-4`}>
              <h3 className="text-sm font-bold text-[#0E0F0F] mb-3">Distribution History</h3>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...EPOCH_DISTRIBUTIONS].reverse()} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#9EB3A8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#9EB3A8' }} tickFormatter={(v: number) => `$${v / 1000}k`} />
                    <Tooltip content={<AdminTooltip />} />
                    <Bar dataKey="amount" radius={[3, 3, 0, 0]} fill="#96EA7A" fillOpacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#9EB3A8] pt-2 border-t border-[#9EB3A8]/20 mt-2">
                <span>Total distributed</span>
                <span className="font-bold text-[#96EA7A] text-[11px]">{fmtUsd(EPOCH_DISTRIBUTIONS.reduce((s, d) => s + d.amount, 0))}</span>
              </div>
            </div>

            {/* System Health */}
            <div className={`col-span-12 lg:col-span-4 ${CARD} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#0E0F0F]">System Health</h3>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#96EA7A]/10 rounded-full">
                  <span className="w-1.5 h-1.5 bg-[#96EA7A] rounded-full animate-pulse" />
                  <span className="text-[10px] text-[#96EA7A] font-semibold">All OK</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {SYSTEM_HEALTH.map((s) => (
                  <div key={s.name} className="flex items-center justify-between p-2 bg-[#F2F2F2] rounded-xl">
                    <span className="text-[10px] font-medium text-[#9EB3A8]">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <div className={`h-1 rounded-full ${s.latency < 20 ? 'bg-[#96EA7A]' : s.latency < 40 ? 'bg-[#9EB3A8]' : 'bg-[#9EB3A8]'}`}
                        style={{ width: `${Math.min(s.latency, 50)}px` }} />
                      <span className="text-[10px] font-mono text-[#9EB3A8] w-8 text-right">{s.latency}ms</span>
                      <span className="w-1.5 h-1.5 bg-[#96EA7A] rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#9EB3A8]/20 grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-[10px] text-[#9EB3A8] uppercase tracking-wider">Uptime</p>
                  <p className="text-sm font-bold text-[#0E0F0F]">99.99%</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#9EB3A8] uppercase tracking-wider">Avg Latency</p>
                  <p className="text-sm font-bold text-[#0E0F0F]">{Math.round(SYSTEM_HEALTH.reduce((s, h) => s + h.latency, 0) / SYSTEM_HEALTH.length)}ms</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Operations + Transactions */}
          <div className="grid grid-cols-12 gap-3">
            {/* Quick Actions */}
            <div className={`col-span-12 xl:col-span-4 space-y-3`}>
              <div className={`${CARD} p-4`}>
                <h3 className="text-sm font-bold text-[#0E0F0F] mb-3">Vault Operations</h3>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setSelectedAction(selectedAction === 'distribute' ? null : 'distribute')}
                    className="w-full py-2 bg-gradient-to-r from-[#96EA7A] to-[#7ED066] text-[#0E0F0F] font-bold rounded-full hover:from-[#7ED066] hover:to-[#7ED066] shadow-sm shadow-[#96EA7A]/20 transition-all flex items-center justify-center gap-1.5 text-[11px]"
                  >
                    Distribute Rewards
                  </button>
                  <button
                    onClick={() => setSelectedAction(selectedAction === 'epoch' ? null : 'epoch')}
                    className="w-full py-2 bg-[#F2F2F2] text-[#0E0F0F] font-semibold rounded-full hover:bg-[#E6F1E7] border border-[#9EB3A8] transition-colors flex items-center justify-center gap-1.5 text-[11px]"
                  >
                    Advance Epoch ({vault.currentEpoch} → {vault.currentEpoch + 1})
                  </button>
                  <button
                    onClick={() => setSelectedAction(selectedAction === 'rebalance' ? null : 'rebalance')}
                    className="w-full py-2 bg-[#F2F2F2] text-[#0E0F0F] font-semibold rounded-full hover:bg-[#E6F1E7] border border-[#9EB3A8] transition-colors flex items-center justify-center gap-1.5 text-[11px]"
                  >
                    Trigger Rebalance
                  </button>
                </div>

                {selectedAction === 'distribute' && (
                  <div className="mt-3 pt-3 border-t border-[#9EB3A8]/20 space-y-2">
                    <label className="text-[10px] text-[#9EB3A8] uppercase tracking-wider">Reward Amount (USDC)</label>
                    <input className="w-full px-3 py-2 bg-[#F2F2F2] border border-[#9EB3A8] rounded-xl text-sm font-bold text-[#0E0F0F] focus:ring-1 focus:ring-[#96EA7A] outline-none" placeholder="0.00" />
                    <button className="w-full py-2 bg-gradient-to-r from-[#96EA7A] to-[#7ED066] text-[#0E0F0F] font-bold rounded-full text-[11px] hover:from-[#7ED066] hover:to-[#7ED066] transition-colors">
                      Confirm Distribution
                    </button>
                  </div>
                )}

                {selectedAction === 'epoch' && (
                  <div className="mt-3 pt-3 border-t border-[#9EB3A8]/20 space-y-2">
                    <div className="bg-[#F2F2F2] rounded-xl p-2.5 space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[#9EB3A8]">Current Epoch</span>
                        <span className="text-[#0E0F0F] font-semibold">{vault.currentEpoch}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[#9EB3A8]">Epoch Duration</span>
                        <span className="text-[#0E0F0F] font-semibold">{CONTRACT_CONFIG.EPOCH_DURATION / 86400}d</span>
                      </div>
                    </div>
                    <button className="w-full py-2 bg-[#9EB3A8] text-[#0E0F0F] font-bold rounded-full text-[11px] hover:bg-[#96EA7A] transition-colors">
                      Advance to Epoch {vault.currentEpoch + 1}
                    </button>
                  </div>
                )}

                {selectedAction === 'rebalance' && (
                  <div className="mt-3 pt-3 border-t border-[#9EB3A8]/20 space-y-2">
                    {vault.strategies.map(s => {
                      const target = (vault.currentTvl * s.allocation) / 100
                      const actual = stats.tvlByStrategy[s.type]
                      const drift = ((actual - target) / target * 100)
                      return (
                        <div key={s.type} className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="text-[#9EB3A8]">{s.label}</span>
                          </div>
                          <span className={`font-semibold ${Math.abs(drift) < 2 ? 'text-[#96EA7A]' : 'text-[#9EB3A8]'}`}>
                            {drift > 0 ? '+' : ''}{drift.toFixed(1)}%
                          </span>
                        </div>
                      )
                    })}
                    <button className="w-full py-2 bg-[#9EB3A8] text-[#0E0F0F] font-bold rounded-full text-[11px] hover:bg-[#96EA7A] transition-colors">
                      Execute Rebalance
                    </button>
                  </div>
                )}
              </div>

              {/* Lock Stats */}
              <div className={`${CARD} p-4`}>
                <h3 className="text-sm font-bold text-[#0E0F0F] mb-3">Lock Statistics</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Users Locked', value: String(stats.activeDepositors) },
                    { label: 'Total Principal', value: fmtUsd(vault.currentTvl) },
                    { label: 'Yield Distributed', value: fmtUsd(stats.totalYieldDistributed) },
                    { label: 'Avg Lock Duration', value: '2.1Y' },
                    { label: 'Post-Cliff Users', value: '18' },
                    { label: 'Matured Positions', value: '3' },
                  ].map(stat => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <span className="text-[10px] text-[#9EB3A8]">{stat.label}</span>
                      <span className="text-[10px] font-bold text-[#0E0F0F]">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fee Structure */}
              <div className={`${CARD} p-4`}>
                <h3 className="text-sm font-bold text-[#0E0F0F] mb-3">Fee Configuration</h3>
                <div className="space-y-1.5">
                  {[
                    { label: 'Management', value: `${vault.fees.management}%`, bps: `${CONTRACT_CONFIG.MANAGEMENT_FEE_BPS} bps` },
                    { label: 'Performance', value: `${vault.fees.performance}%`, bps: `${CONTRACT_CONFIG.PERFORMANCE_FEE_BPS} bps` },
                    { label: 'Exit', value: `${vault.fees.exit}%`, bps: `${CONTRACT_CONFIG.EXIT_FEE_BPS} bps` },
                    { label: 'Early Exit Penalty', value: `${vault.fees.earlyExit}%`, bps: `${CONTRACT_CONFIG.EARLY_EXIT_PENALTY_BPS} bps` },
                  ].map(fee => (
                    <div key={fee.label} className="flex items-center justify-between">
                      <span className="text-[10px] text-[#9EB3A8]">{fee.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#9EB3A8] font-mono">{fee.bps}</span>
                        <span className="text-[10px] font-bold text-[#0E0F0F]">{fee.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Transactions */}
            <div className={`col-span-12 xl:col-span-8 ${CARD} overflow-hidden`}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#9EB3A8]/20">
                <div>
                  <h3 className="text-sm font-bold text-[#0E0F0F]">Live Transactions</h3>
                  <p className="text-[10px] text-[#9EB3A8]">Real-time protocol activity</p>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#96EA7A]/10 rounded-full">
                  <span className="w-1.5 h-1.5 bg-[#96EA7A] rounded-full animate-pulse" />
                  <span className="text-[10px] text-[#96EA7A] font-semibold">Streaming</span>
                </div>
              </div>
              <div className="divide-y divide-[#9EB3A8]/20">
                {MOCK_RECENT_TRANSACTIONS.map((tx) => {
                  const colorMap: Record<string, { icon: string; bg: string; text: string }> = {
                    deposit: { icon: 'M19 14l-7 7m0 0l-7-7m7 7V3', bg: 'bg-[#9EB3A8]/10', text: 'text-[#9EB3A8]' },
                    claim: { icon: 'M5 10l7-7m0 0l7 7m-7-7v18', bg: 'bg-[#96EA7A]/10', text: 'text-[#96EA7A]' },
                    withdraw: { icon: 'M5 10l7-7m0 0l7 7m-7-7v18', bg: 'bg-[#9EB3A8]/10', text: 'text-[#9EB3A8]' },
                    rebalance: { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', bg: 'bg-[#9EB3A8]/10', text: 'text-[#9EB3A8]' },
                    distribute: { icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7', bg: 'bg-[#9EB3A8]/10', text: 'text-[#9EB3A8]' },
                  }
                  const c = colorMap[tx.type] ?? colorMap.deposit
                  const timeAgoVal = (() => {
                    const now = Math.floor(Date.now() / 1000)
                    const diff = now - tx.timestamp
                    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
                    return `${Math.floor(diff / 86400)}d ago`
                  })()

                  return (
                    <div key={tx.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#E6F1E7] transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${c.bg}`}>
                          <svg className={`w-3.5 h-3.5 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.icon} />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-px">
                            <p className="text-[11px] font-semibold text-[#0E0F0F] capitalize">{tx.type}</p>
                            {tx.strategy && (
                              <>
                                <span className="text-[10px] text-[#9EB3A8]">·</span>
                                <span className="text-[10px] text-[#9EB3A8]">{vault.strategies.find(s => s.type === tx.strategy)?.label}</span>
                              </>
                            )}
                          </div>
                          <p className="text-[10px] text-[#9EB3A8] font-mono">{tx.address}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className={`text-xs font-bold ${tx.type === 'claim' || tx.type === 'distribute' ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}>
                          {tx.type === 'claim' || tx.type === 'distribute' ? '+' : ''}{fmtUsd(tx.amount)}
                        </p>
                        <p className="text-[10px] text-[#9EB3A8]">{timeAgoVal}</p>
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
