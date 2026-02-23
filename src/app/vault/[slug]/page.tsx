'use client'

import { Header } from '@/components/Header'
import {
  ALL_VAULTS,
  MOCK_MONTHLY_PERFORMANCE,
  MOCK_PROTOCOL_STATS,
  fmt,
  fmtPercent,
  fmtUsd,
  getDepositsForVault,
  getLockStatusColor,
  getLockStatusLabel,
  getVaultUserStats,
} from '@/config/mock-data'
import type { StrategyType, VaultStrategy } from '@/types/product'
import Image from 'next/image'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
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

const RISK_COLOR: Record<string, string> = { low: 'text-[#96EA7A]', medium: 'text-[#9EB3A8]', 'medium-high': 'text-[#E8A838]' }
const RISK_BG: Record<string, string> = { low: 'bg-[#96EA7A]/15 text-[#96EA7A]', medium: 'bg-[#9EB3A8]/15 text-[#9EB3A8]', 'medium-high': 'bg-[#E8A838]/15 text-[#E8A838]' }
const RISK_HEX: Record<string, string> = { low: '#96EA7A', medium: '#9EB3A8', 'medium-high': '#E8A838' }

let sparklineCounter = 0
function MiniSparkline({ data, color = '#96EA7A' }: { data: readonly number[]; color?: string }) {
  const sparkData = data.map((v, i) => ({ v, i }))
  const [id] = useState(() => `vspk-${color.replace('#', '')}-${++sparklineCounter}`)
  return (
    <div className="h-6 w-16">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#F2F2F2] border border-[#9EB3A8] text-[#0E0F0F] px-3 py-2 rounded-2xl shadow-xl text-[10px]">
      <p className="font-medium text-[#9EB3A8] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
          {fmtPercent(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function VaultDetail() {
  const { isConnected } = useAccount()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [subscribeAmount, setSubscribeAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'subscribe' | 'claim' | 'withdraw'>('subscribe')

  useEffect(() => {
    if (!isConnected) router.replace('/login')
  }, [isConnected, router])

  const slug = params.slug as string
  const vault = ALL_VAULTS.find(v => v.slug === slug) ?? ALL_VAULTS[0]
  const deposits = getDepositsForVault(vault.slug)
  const vaultUserStats = getVaultUserStats(vault.slug)

  const highlightedStrategy = searchParams.get('strategy') as StrategyType | null
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType | null>(highlightedStrategy)

  const strategy: VaultStrategy | undefined = selectedStrategy
    ? vault.strategies.find(s => s.type === selectedStrategy)
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
    }
    return breakdowns[strategy.type] ?? []
  }, [strategy?.type])

  const userPosition = useMemo(() => ({
    totalAmount: vaultUserStats.deposited,
    totalPending: vaultUserStats.pending,
    totalClaimed: vaultUserStats.yieldEarned - vaultUserStats.pending,
    count: vaultUserStats.activeCount,
  }), [vaultUserStats])

  const allocationData = vault.strategies.map(s => ({
    name: s.label, value: s.allocation, color: s.color,
  }))

  const tvlPercent = vault.tvlCap > 0 ? (vault.currentTvl / vault.tvlCap * 100) : 0

  const riskScore = useMemo(() => {
    const riskMap = { 'low': 1, 'medium': 2, 'medium-high': 3 }
    const weighted = vault.strategies.reduce((s, st) => s + (riskMap[st.riskLevel] ?? 2) * st.allocation, 0) / 100
    return weighted
  }, [vault.strategies])

  if (!isConnected) return null

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Header />

      <main className="pt-16 pb-8">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">

          {/* ─── Header ──────────────────────────────────────── */}
          <div className="mb-5 pt-2">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-[#9EB3A8] hover:text-[#0E0F0F] transition-colors mb-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-[10px]">Back to Portfolio</span>
            </button>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-[#0E0F0F] tracking-tight">{vault.name}</h1>
              </div>

              {/* TVL capacity */}
              <div className={`${CARD} p-3 min-w-[180px]`}>
                <div className="flex items-center justify-between text-[10px] mb-1.5">
                  <span className="text-[#9EB3A8] uppercase tracking-wider">TVL Capacity</span>
                  <span className="text-[#9EB3A8] font-semibold">{tvlPercent.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-[#F2F2F2] rounded-full overflow-hidden mb-1.5">
                  <div className="h-full bg-[#96EA7A] rounded-full transition-all" style={{ width: `${tvlPercent}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-[#0E0F0F]">{fmtUsd(vault.currentTvl)}</span>
                  <span className="text-[#9EB3A8]">/ {fmtUsd(vault.tvlCap)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Strategy Tabs ───────────────────────────────── */}
          <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedStrategy(null)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-colors whitespace-nowrap ${!selectedStrategy ? 'bg-gradient-to-r from-[#96EA7A] to-[#7ED066] text-[#0E0F0F]' : 'bg-white text-[#9EB3A8] hover:text-[#9EB3A8] border border-[#9EB3A8]/20'
                }`}
            >
              Overview
            </button>
            {vault.strategies.map(s => (
              <button
                key={s.type}
                onClick={() => setSelectedStrategy(s.type)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-colors flex items-center gap-1.5 whitespace-nowrap ${selectedStrategy === s.type ? 'text-[#0E0F0F] border-2' : 'bg-white text-[#9EB3A8] hover:text-[#0E0F0F] border border-[#9EB3A8]/20'
                  }`}
                style={selectedStrategy === s.type ? { borderColor: s.color, backgroundColor: `${s.color}15` } : undefined}
              >
                <Image src={STRATEGY_ICONS[s.type] ?? ''} alt={s.label} width={14} height={14} className="rounded-full" />
                {s.label}
                <span className="text-[10px] opacity-60">{s.allocation}%</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-3 mb-5">
            {/* ─── Left Column ───────────────────────────────── */}
            <div className="col-span-12 lg:col-span-8 space-y-3">

              {/* ── OVERVIEW TAB ─────────────────────────────── */}
              {!strategy && (
                <>
                  {/* Vault KPIs Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {[
                      { label: 'TVL', value: fmtUsd(vault.currentTvl), color: 'text-[#0E0F0F]' },
                      { label: 'Composite APY', value: `${vault.compositeApy[0]}-${vault.compositeApy[1]}%`, color: 'text-[#96EA7A]' },
                      { label: 'Lock', value: `${vault.lockPeriodMonths / 12}Y`, color: 'text-[#0E0F0F]' },
                      { label: 'Yield Cliff', value: `${vault.yieldCliffMonths}mo`, color: 'text-[#9EB3A8]' },
                      { label: 'Epoch', value: String(vault.currentEpoch), color: 'text-[#0E0F0F]' },
                      { label: 'Min Deposit', value: fmtUsd(vault.minDeposit), color: 'text-[#0E0F0F]' },
                    ].map(kpi => (
                      <div key={kpi.label} className={`${CARD} p-2.5`}>
                        <p className="text-[11px] text-[#9EB3A8] uppercase tracking-wider mb-0.5">{kpi.label}</p>
                        <p className={`text-sm font-black ${kpi.color}`}>{kpi.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Allocation Donut + Strategy Cards */}
                  <div className="grid grid-cols-12 gap-3">
                    {/* Donut */}
                    <div className={`col-span-12 sm:col-span-5 ${CARD} p-4`}>
                      <h3 className="text-sm font-bold text-[#0E0F0F] mb-3">Strategy Allocation</h3>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={allocationData} innerRadius={28} outerRadius={38} paddingAngle={3} dataKey="value" stroke="none">
                                {allocationData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 space-y-2">
                          {vault.strategies.map(s => (
                            <button
                              key={s.type}
                              onClick={() => setSelectedStrategy(s.type)}
                              className="flex items-center justify-between w-full hover:bg-[#F2F2F2] rounded px-1 py-0.5 -mx-1 transition-colors"
                            >
                              <div className="flex items-center gap-1.5">
                                <Image src={STRATEGY_ICONS[s.type] ?? ''} alt={s.label} width={14} height={14} className="rounded-full" />
                                <span className="text-[10px] text-[#9EB3A8]">{s.label}</span>
                              </div>
                              <span className="text-[10px] font-bold text-[#0E0F0F]">{s.allocation}%</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Risk gauge */}
                      <div className="mt-4 pt-3 border-t border-[#9EB3A8]/20">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-[#9EB3A8] uppercase tracking-wider">Risk Profile</span>
                          <span className={`text-[10px] font-bold ${riskScore < 1.5 ? 'text-[#96EA7A]' : riskScore < 2.2 ? 'text-[#9EB3A8]' : 'text-[#E8A838]'}`}>
                            {riskScore < 1.5 ? 'Low' : riskScore < 2.2 ? 'Medium' : 'Medium-High'}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#F2F2F2] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(riskScore / 3) * 100}%`,
                              background: riskScore < 1.5 ? '#96EA7A' : riskScore < 2.2 ? '#9EB3A8' : '#E8A838',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Strategy cards */}
                    <div className="col-span-12 sm:col-span-7 grid grid-cols-1 gap-2">
                      {vault.strategies.map(s => {
                        const perfData = MOCK_MONTHLY_PERFORMANCE.map(m => m[s.type])
                        return (
                          <button
                            key={s.type}
                            onClick={() => setSelectedStrategy(s.type)}
                            className={`${CARD} p-3 text-left hover:border-[#9EB3A8] transition-colors flex items-center gap-3`}
                          >
                            <Image src={STRATEGY_ICONS[s.type] ?? ''} alt={s.label} width={18} height={18} className="rounded-full shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[11px] font-bold text-[#0E0F0F]">{s.label}</span>
                                <span className="text-[10px] font-bold" style={{ color: s.color }}>{s.allocation}%</span>
                              </div>
                              <p className="text-[10px] text-[#9EB3A8] truncate">{s.description}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] font-bold text-[#0E0F0F]">{s.apyRange[0]}-{s.apyRange[1]}%</p>
                              <p className={`text-[10px] font-medium ${RISK_COLOR[s.riskLevel]}`}>
                                {s.riskLevel}
                              </p>
                            </div>
                            <MiniSparkline data={perfData} color={s.color} />
                            <svg className="w-3 h-3 text-[#9EB3A8] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Lock Timeline for this vault */}
                  {deposits.length > 0 && (
                    <div className={`${CARD} p-4`}>
                      <h3 className="text-sm font-bold text-[#0E0F0F] mb-3">Your Lock Timeline</h3>
                      <div className="space-y-3">
                        {deposits.map(dep => (
                          <div key={dep.id} className="flex items-center gap-3">
                            <div className="w-16 shrink-0">
                              <p className="text-[10px] font-bold text-[#0E0F0F]">{fmtUsd(dep.amount)}</p>
                              <p className={`text-[10px] font-semibold ${getLockStatusColor(dep.lockStatus)}`}>{getLockStatusLabel(dep.lockStatus)}</p>
                            </div>
                            <div className="flex-1">
                              <div className="relative h-2 bg-[#F2F2F2] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${dep.progressPercent}%`,
                                    backgroundColor: dep.lockStatus === 'matured' ? '#9EB3A8' : dep.lockStatus === 'yield_claimable' ? '#96EA7A' : '#9EB3A8',
                                  }}
                                />
                                <div className="absolute top-0 h-full w-px bg-[#9EB3A8]" style={{ left: `${(vault.yieldCliffMonths / vault.lockPeriodMonths) * 100}%` }} />
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-[#9EB3A8] mt-0.5">
                                <span>Start</span>
                                <span>{vault.yieldCliffMonths}mo Cliff</span>
                                <span>{vault.lockPeriodMonths / 12}Y</span>
                              </div>
                            </div>
                            <div className="w-14 text-right shrink-0">
                              <span className="text-[10px] font-bold text-[#9EB3A8]">{dep.progressPercent}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vault Parameters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={`${CARD} p-4`}>
                      <h3 className="text-sm font-bold text-[#0E0F0F] mb-2">Fee Structure</h3>
                      <div className="space-y-1.5">
                        {[
                          { label: 'Management', value: `${vault.fees.management}%`, sub: 'Annual' },
                          { label: 'Performance', value: `${vault.fees.performance}%`, sub: 'On yield' },
                          { label: 'Exit', value: `${vault.fees.exit}%`, sub: 'On principal' },
                          { label: 'Early Exit', value: `${vault.fees.earlyExit}%`, sub: 'Penalty', warn: true },
                        ].map(fee => (
                          <div key={fee.label} className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-[#9EB3A8]">{fee.label}</span>
                              <span className="text-[10px] text-[#9EB3A8] ml-1">({fee.sub})</span>
                            </div>
                            <span className={`text-[10px] font-bold ${'warn' in fee && fee.warn ? 'text-[#E8A838]' : 'text-[#0E0F0F]'}`}>{fee.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`${CARD} p-4`}>
                      <h3 className="text-sm font-bold text-[#0E0F0F] mb-2">Vault Parameters</h3>
                      <div className="space-y-1.5">
                        {[
                          { label: 'Contract', value: `${vault.contractAddress.slice(0, 6)}...${vault.contractAddress.slice(-4)}` },
                          { label: 'Network', value: 'Base (8453)' },
                          { label: 'Deposit Token', value: vault.depositToken },
                          { label: 'Total Shares', value: fmt(vault.totalShares) },
                          { label: 'Epoch Duration', value: '30 days' },
                          { label: 'Current Epoch', value: String(vault.currentEpoch) },
                        ].map(p => (
                          <div key={p.label} className="flex items-center justify-between">
                            <span className="text-[10px] text-[#9EB3A8]">{p.label}</span>
                            <span className="text-[10px] font-semibold text-[#0E0F0F] font-mono">{p.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── STRATEGY TAB ──────────────────────────────── */}
              {strategy && (
                <>
                  <div className={`${CARD} p-4`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Image src={STRATEGY_ICONS[strategy.type] ?? ''} alt={strategy.label} width={20} height={20} className="rounded-full" />
                      <h2 className="text-sm font-bold text-[#0E0F0F]">{strategy.label}</h2>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${RISK_BG[strategy.riskLevel]}`}>
                        {strategy.riskLevel} risk
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9EB3A8] leading-relaxed mb-3">{strategy.description}</p>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] text-[#9EB3A8] uppercase tracking-wider">Allocation</p>
                        <p className="text-base font-black text-[#0E0F0F]">{strategy.allocation}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#9EB3A8] uppercase tracking-wider">APY Range</p>
                        <p className="text-base font-black" style={{ color: strategy.color }}>{strategy.apyRange[0]}-{strategy.apyRange[1]}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#9EB3A8] uppercase tracking-wider">TVL Allocated</p>
                        <p className="text-base font-black text-[#0E0F0F]">{fmtUsd(MOCK_PROTOCOL_STATS.tvlByStrategy[strategy.type])}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-[#9EB3A8]/20">
                      {strategy.protocols.map(p => (
                        <span key={p} className="text-[10px] text-[#9EB3A8] bg-[#F2F2F2] px-2 py-1 rounded-full font-medium">{p}</span>
                      ))}
                    </div>
                  </div>

                  {protocolBreakdown.length > 0 && (
                    <div className={`${CARD} p-4`}>
                      <h3 className="text-sm font-bold text-[#0E0F0F] mb-3">Protocol Breakdown</h3>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={protocolBreakdown} innerRadius={26} outerRadius={36} paddingAngle={2} dataKey="pct" stroke="none">
                                {protocolBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 space-y-2">
                          {protocolBreakdown.map(p => (
                            <div key={p.name}>
                              <div className="flex items-center justify-between mb-0.5">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                  <span className="text-[10px] text-[#9EB3A8]">{p.name}</span>
                                </div>
                                <span className="text-[10px] font-bold text-[#0E0F0F]">{p.pct}%</span>
                              </div>
                              <div className="h-1 bg-[#F2F2F2] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${p.pct}%`, backgroundColor: p.color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Performance Chart (both tabs) */}
              <div className={`${CARD} overflow-hidden`}>
                <div className="px-4 py-3 border-b border-[#9EB3A8]/20">
                  <h3 className="text-sm font-bold text-[#0E0F0F]">
                    {strategy ? `${strategy.label} Performance` : 'Monthly Performance'}
                  </h3>
                  <p className="text-[10px] text-[#9EB3A8]">Monthly yield % by strategy</p>
                </div>
                <div className="p-4 pb-2 h-44 lg:h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                      <defs>
                        {vault.strategies.map(s => (
                          <linearGradient key={s.type} id={`vgrad-${s.type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                            <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                          </linearGradient>
                        ))}
                      </defs>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9EB3A8' }} dy={4} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9EB3A8' }} tickFormatter={(v: number) => `${v}%`} />
                      <Tooltip content={<ChartTooltip />} />
                      {strategy ? (
                        <Area type="monotone" dataKey={strategy.type} stroke={strategy.color} strokeWidth={2}
                          fill={`url(#vgrad-${strategy.type})`} dot={false}
                          activeDot={{ r: 3, fill: strategy.color, stroke: '#0E0F0F', strokeWidth: 2 }} />
                      ) : (
                        vault.strategies.map(s => (
                          <Area key={s.type} type="monotone" dataKey={s.type} stroke={s.color} strokeWidth={1.5}
                            fill={`url(#vgrad-${s.type})`} dot={false}
                            activeDot={{ r: 2, fill: s.color, stroke: '#0E0F0F', strokeWidth: 2 }} />
                        ))
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ─── Right Column ───────────────────────────────── */}
            <div className="col-span-12 lg:col-span-4 space-y-3">

              {/* User Position */}
              <div className={`${CARD} p-4`}>
                <h3 className="text-sm font-bold text-[#0E0F0F] mb-3">Your Position</h3>
                {deposits.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-[#F2F2F2] rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-[#9EB3A8] uppercase tracking-wider mb-0.5">Deposited</p>
                        <p className="text-sm font-black text-[#0E0F0F]">{fmtUsd(vaultUserStats.deposited)}</p>
                      </div>
                      <div className="bg-[#F2F2F2] rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-[#9EB3A8] uppercase tracking-wider mb-0.5">Yield</p>
                        <p className="text-sm font-black text-[#96EA7A]">{fmtUsd(vaultUserStats.yieldEarned)}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#9EB3A8]">Active Positions</span>
                        <span className="text-[10px] font-bold text-[#0E0F0F]">{userPosition.count}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#9EB3A8]">Pending Yield</span>
                        <span className="text-[10px] font-bold text-[#9EB3A8]">{fmtUsd(userPosition.totalPending)}</span>
                      </div>
                    </div>
                    <div className="border-t border-[#9EB3A8]/20 mt-3 pt-3 space-y-1.5">
                      {deposits.map(dep => (
                        <div key={dep.id} className="flex items-center justify-between py-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-[#9EB3A8] font-mono">#{dep.id}</span>
                            <span className="text-[10px] font-semibold text-[#0E0F0F]">{fmtUsd(dep.amount)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-1 w-10 bg-[#F2F2F2] rounded-full overflow-hidden">
                              <div className="h-full bg-[#96EA7A] rounded-full" style={{ width: `${dep.progressPercent}%` }} />
                            </div>
                            <span className={`text-[10px] font-semibold ${getLockStatusColor(dep.lockStatus)}`}>
                              {getLockStatusLabel(dep.lockStatus)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-10 h-10 bg-[#F2F2F2] rounded-xl flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-[#9EB3A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-[11px] text-[#9EB3A8] mb-0.5">Not subscribed to this vault</p>
                    <p className="text-[10px] text-[#9EB3A8]">Subscribe below to start earning</p>
                  </div>
                )}
              </div>

              {/* Action Panel */}
              <div className={`${CARD} p-4`}>
                <div className="flex items-center gap-0.5 bg-[#F2F2F2] rounded-full p-0.5 mb-3">
                  {(['subscribe', 'claim', 'withdraw'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-2 py-1 text-[11px] font-semibold rounded-full capitalize transition-colors ${activeTab === tab ? 'bg-[#E6F1E7] text-[#0E0F0F]' : 'text-[#9EB3A8] hover:text-[#0E0F0F]'
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeTab === 'subscribe' && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[10px] text-[#9EB3A8] uppercase tracking-wider mb-1 block">Subscription Amount (USDC)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9EB3A8] text-xs">$</span>
                        <input
                          value={subscribeAmount}
                          onChange={(e) => setSubscribeAmount(e.target.value)}
                          className="w-full pl-6 pr-3 py-2 bg-[#F2F2F2] border border-[#9EB3A8] rounded-xl focus:ring-1 focus:ring-[#96EA7A] focus:border-transparent outline-none text-sm font-bold text-[#0E0F0F]"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-[10px] text-[#9EB3A8] mt-1">Min: {fmtUsd(vault.minDeposit)}</p>
                    </div>
                    <div className="bg-[#F2F2F2] rounded-xl p-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#9EB3A8]">Lock Period</span>
                        <span className="text-[#0E0F0F] font-semibold">{vault.lockPeriodMonths / 12} Years</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#9EB3A8]">Yield Cliff</span>
                        <span className="text-[#9EB3A8] font-semibold">{vault.yieldCliffMonths} Months</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#9EB3A8]">Est. APY</span>
                        <span className="text-[#96EA7A] font-semibold">{vault.compositeApy[0]}-{vault.compositeApy[1]}%</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button className="flex-1 py-2 bg-[#F2F2F2] text-[#9EB3A8] font-semibold rounded-full text-[11px] hover:bg-[#E6F1E7] border border-[#9EB3A8] transition-colors">
                        Approve USDC
                      </button>
                      <button className="flex-1 py-2 bg-gradient-to-r from-[#96EA7A] to-[#7ED066] text-[#0E0F0F] font-bold rounded-full text-[11px] hover:from-[#7ED066] hover:to-[#7ED066] shadow-sm shadow-[#96EA7A]/20 transition-colors">
                        Subscribe
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'claim' && (
                  <div className="space-y-2.5">
                    <div className="bg-[#F2F2F2] rounded-xl p-3 text-center">
                      <p className="text-[10px] text-[#9EB3A8] uppercase tracking-wider mb-1">Claimable Yield</p>
                      <p className="text-xl font-black text-[#96EA7A]">{fmtUsd(userPosition.totalPending)}</p>
                    </div>
                    {userPosition.totalPending > 0 ? (
                      <button className="w-full py-2 bg-gradient-to-r from-[#96EA7A] to-[#7ED066] text-[#0E0F0F] font-bold rounded-full text-[11px] hover:from-[#7ED066] hover:to-[#7ED066] shadow-sm shadow-[#96EA7A]/20 transition-colors">
                        Claim All Yield
                      </button>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-[10px] text-[#9EB3A8]">No yield available to claim yet.</p>
                        <p className="text-[10px] text-[#9EB3A8] mt-0.5">Yield becomes claimable after the {vault.yieldCliffMonths}-month cliff.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'withdraw' && (
                  <div className="space-y-2.5">
                    {deposits.filter(d => d.lockStatus === 'matured').length > 0 ? (
                      <>
                        <div className="bg-[#F2F2F2] rounded-xl p-3 text-center">
                          <p className="text-[10px] text-[#9EB3A8] uppercase tracking-wider mb-1">Matured Principal</p>
                          <p className="text-xl font-black text-[#9EB3A8]">
                            {fmtUsd(deposits.filter(d => d.lockStatus === 'matured').reduce((s, d) => s + d.amount, 0))}
                          </p>
                        </div>
                        <button className="w-full py-2 bg-[#9EB3A8] text-[#0E0F0F] font-bold rounded-full text-[11px] hover:bg-[#96EA7A] transition-colors">
                          Withdraw Matured
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-3">
                        <p className="text-[10px] text-[#9EB3A8]">No matured deposits available.</p>
                        <p className="text-[10px] text-[#9EB3A8] mt-0.5">Deposits mature after the {vault.lockPeriodMonths / 12}-year lock period.</p>
                      </div>
                    )}
                    <div className="bg-[#9EB3A8]/10 border border-[#9EB3A8]/20 rounded-2xl p-2.5">
                      <p className="text-[10px] text-[#9EB3A8] font-medium">Early withdrawal incurs a {vault.fees.earlyExit}% penalty fee.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Other Vaults */}
              {ALL_VAULTS.filter(v => v.slug !== vault.slug).length > 0 && (
                <div className={`${CARD} p-4`}>
                  <h3 className="text-sm font-bold text-[#0E0F0F] mb-2">Other Vaults</h3>
                  <div className="space-y-1.5">
                    {ALL_VAULTS.filter(v => v.slug !== vault.slug).map(v => (
                      <button
                        key={v.slug}
                        onClick={() => router.push(`/vault/${v.slug}`)}
                        className="w-full flex items-center justify-between p-2 bg-[#F2F2F2] rounded-xl hover:bg-[#E6F1E7] transition-colors"
                      >
                        <div>
                          <p className="text-[10px] font-semibold text-[#0E0F0F]">{v.name.replace('HearstVault ', '')}</p>
                          <p className="text-[10px] text-[#9EB3A8]">{v.lockPeriodMonths / 12}Y lock · {v.compositeApy[0]}-{v.compositeApy[1]}% APY</p>
                        </div>
                        <svg className="w-3 h-3 text-[#9EB3A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
