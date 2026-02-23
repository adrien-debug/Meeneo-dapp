'use client'

import { Header } from '@/components/Header'
import {
  ALL_VAULTS,
  MOCK_MONTHLY_PERFORMANCE,
  MOCK_RECENT_TRANSACTIONS,
  MOCK_USER_DEPOSITS,
  TOTAL_USER_DEPOSITED,
  TOTAL_USER_PENDING,
  TOTAL_USER_YIELD,
  fmtPercent,
  fmtUsd,
  getLockStatusColor,
  getLockStatusLabel,
  getVaultUserStats,
  timeAgo
} from '@/config/mock-data'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
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

const VAULT_COLORS = ['#96EA7A', '#9EB3A8', '#0E0F0F'] as const
const STRATEGY_COLORS: Record<string, string> = { rwa_mining: '#96EA7A', usdc_yield: '#9EB3A8', btc_hedged: '#0E0F0F' }
const STRATEGY_ICONS: Record<string, string> = { rwa_mining: '/assets/tokens/hearst-logo.png', usdc_yield: '/assets/tokens/usdc.svg', btc_hedged: '/assets/tokens/btc.svg' }

function MiniSparkline({ data, color = '#96EA7A' }: { data: readonly number[]; color?: string }) {
  const sparkData = data.map((v, i) => ({ v, i }))
  const gradientId = `spark-${color.replace('#', '')}-${Math.random().toString(36).slice(2, 6)}`
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

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#F2F2F2] border border-[#9EB3A8] text-[#0E0F0F] px-3 py-2 rounded-2xl shadow-xl text-[10px]">
      <p className="font-medium text-[#9EB3A8] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: {fmtPercent(p.value)}
        </p>
      ))}
    </div>
  )
}

function CumulativeTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#F2F2F2] border border-[#9EB3A8] text-[#0E0F0F] px-3 py-2 rounded-2xl shadow-xl text-[10px]">
      <p className="font-medium text-[#9EB3A8] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: {fmtPercent(p.value)} cumul.
        </p>
      ))}
    </div>
  )
}


export default function Dashboard() {
  const { isConnected } = useAccount()
  const router = useRouter()
  const [chartStrategy, setChartStrategy] = useState<'composite' | 'rwa_mining' | 'usdc_yield' | 'btc_hedged'>('composite')
  const [chartMode, setChartMode] = useState<'monthly' | 'cumulative'>('cumulative')
  const [timeRange, setTimeRange] = useState('1Y')
  const [vaultFilter, setVaultFilter] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected) router.replace('/login')
  }, [isConnected, router])

  const vaults = ALL_VAULTS
  const totalPortfolio = TOTAL_USER_DEPOSITED + TOTAL_USER_YIELD

  const vaultStats = useMemo(() =>
    vaults.map((v, i) => ({ vault: v, stats: getVaultUserStats(v.slug), color: VAULT_COLORS[i % VAULT_COLORS.length] })),
    [vaults])

  const globalAllocationData = useMemo(() =>
    vaultStats
      .filter(vs => vs.stats.deposited > 0)
      .map(vs => ({ name: vs.vault.name.replace('HearstVault ', ''), value: vs.stats.deposited, color: vs.color })),
    [vaultStats])

  const filteredDeposits = useMemo(() =>
    vaultFilter ? MOCK_USER_DEPOSITS.filter(d => d.vaultSlug === vaultFilter) : MOCK_USER_DEPOSITS,
    [vaultFilter])

  const chartData = useMemo(() => {
    const rangeMap: Record<string, number> = { '3M': 3, '6M': 6, '1Y': 12, 'ALL': 12 }
    return MOCK_MONTHLY_PERFORMANCE.slice(-(rangeMap[timeRange] ?? 12))
  }, [timeRange])

  const cumulativeData = useMemo(() => {
    let cRwa = 0, cUsdc = 0, cBtc = 0, cComp = 0
    return chartData.map(m => {
      cRwa += m.rwa_mining; cUsdc += m.usdc_yield; cBtc += m.btc_hedged; cComp += m.composite
      return { month: m.month, rwa_mining: +cRwa.toFixed(2), usdc_yield: +cUsdc.toFixed(2), btc_hedged: +cBtc.toFixed(2), composite: +cComp.toFixed(2) }
    })
  }, [chartData])

  const quantMetrics = useMemo(() => {
    const composites = chartData.map(m => m.composite)
    const mean = composites.reduce((s, v) => s + v, 0) / composites.length
    const variance = composites.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / composites.length
    const stdDev = Math.sqrt(variance)
    const sharpe = stdDev > 0 ? (mean / stdDev) : 0
    const maxVal = Math.max(...composites)
    const minVal = Math.min(...composites)
    const winRate = (composites.filter(v => v > mean).length / composites.length) * 100
    const totalCumulative = composites.reduce((s, v) => s + v, 0)

    return {
      totalYield: totalCumulative,
      bestMonth: maxVal,
      worstMonth: minVal,
      avgMonthly: mean,
      volatility: stdDev,
      sharpe,
      winRate,
      maxDrawdown: maxVal - minVal,
    }
  }, [chartData])

  const depositTotals = useMemo(() => ({
    amount: filteredDeposits.reduce((s, d) => s + d.amount, 0),
    yield: filteredDeposits.reduce((s, d) => s + d.claimedYield, 0),
    pending: filteredDeposits.reduce((s, d) => s + d.pendingYield, 0),
  }), [filteredDeposits])

  const activitySummary = useMemo(() => {
    const counts: Record<string, number> = {}
    MOCK_RECENT_TRANSACTIONS.forEach(tx => { counts[tx.type] = (counts[tx.type] ?? 0) + 1 })
    return counts
  }, [])

  const kpis = useMemo(() => [
    { label: 'Total Deposited', value: fmtUsd(TOTAL_USER_DEPOSITED), color: 'text-[#0E0F0F]' },
    { label: 'Yield Earned', value: fmtUsd(TOTAL_USER_YIELD), color: 'text-[#96EA7A]', delta: `+${fmtPercent(TOTAL_USER_YIELD / TOTAL_USER_DEPOSITED * 100)}` },
    { label: 'Pending Yield', value: fmtUsd(TOTAL_USER_PENDING), color: 'text-[#9EB3A8]' },
    { label: 'Active Vaults', value: String(vaultStats.filter(v => v.stats.count > 0).length), color: 'text-[#0E0F0F]' },
    { label: 'Positions', value: String(MOCK_USER_DEPOSITS.length), color: 'text-[#0E0F0F]' },
    { label: 'Avg APY', value: '8-15%', color: 'text-[#96EA7A]' },
  ], [vaultStats])

  if (!isConnected) return null

  const activeChartData = chartMode === 'cumulative' ? cumulativeData : chartData

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Header />

      <main className="pt-16 pb-8">
        <div className="w-full px-4 sm:px-5 lg:px-8 xl:px-12">

          {/* Hero */}
          <div className="mb-6 pt-3">
            <h1 className="text-xl font-bold text-[#0E0F0F] tracking-tight">My Portfolio</h1>
          </div>

          {/* ─── Portfolio Summary + KPIs ────────────────────────── */}
          <div className="grid grid-cols-12 gap-3 mb-5">
            <div className={`col-span-12 lg:col-span-4 ${CARD} p-4 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#96EA7A]/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="relative">
                <p className="text-xs text-[#9EB3A8] uppercase tracking-wider mb-1">Total Portfolio Value</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-black text-[#0E0F0F] tracking-tight">{fmtUsd(totalPortfolio)}</span>
                  {TOTAL_USER_DEPOSITED > 0 && (
                    <span className="text-xs font-bold text-[#96EA7A]">+{fmtPercent(TOTAL_USER_YIELD / TOTAL_USER_DEPOSITED * 100)}</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={globalAllocationData} innerRadius={22} outerRadius={30} paddingAngle={3} dataKey="value" stroke="none">
                          {globalAllocationData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {vaultStats.map(vs => {
                      if (vs.stats.deposited === 0) return null
                      const pct = TOTAL_USER_DEPOSITED > 0 ? (vs.stats.deposited / TOTAL_USER_DEPOSITED * 100) : 0
                      return (
                        <div key={vs.vault.slug} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: vs.color }} />
                            <span className="text-xs text-[#9EB3A8] truncate max-w-[80px]">{vs.vault.name.replace('HearstVault ', '')}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#0E0F0F]">{pct.toFixed(0)}%</span>
                            <span className="text-[11px] text-[#9EB3A8]">{fmtUsd(vs.stats.deposited)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {kpis.map((kpi) => (
                <div key={kpi.label} className={`${CARD} p-4 flex flex-col justify-between`}>
                  <div>
                    <p className="text-[11px] text-[#9EB3A8] uppercase tracking-wider">{kpi.label}</p>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <p className={`text-lg font-black ${kpi.color}`}>{kpi.value}</p>
                    {'delta' in kpi && kpi.delta && (
                      <span className="text-[11px] font-semibold text-[#96EA7A]">{kpi.delta}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Vault Cards ────────────────────────────────────── */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#0E0F0F]">My Vaults</h2>
              <span className="text-xs text-[#9EB3A8]">{vaultStats.filter(v => v.stats.count > 0).length} active</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {vaultStats.map((vs) => {
                const { vault, stats, color } = vs
                const hasPositions = stats.count > 0
                return (
                  <button
                    key={vault.slug}
                    onClick={() => router.push(`/vault/${vault.slug}`)}
                    className="bg-[#D4E8D6] rounded-2xl border border-[#96EA7A]/30 p-4 text-left hover:border-[#96EA7A] transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/3 opacity-10" style={{ backgroundColor: color }} />
                    <div className="relative">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Image src="/assets/tokens/hearst-logo.png" alt="Hearst" width={32} height={32} className="rounded-lg" />
                          <div>
                            <p className="text-sm font-bold text-[#0E0F0F] group-hover:text-[#96EA7A] transition-colors">{vault.name.replace('HearstVault ', '')}</p>
                            <p className="text-xs text-[#0E0F0F]">{vault.lockPeriodMonths / 12}Y lock · {vault.yieldCliffMonths}mo cliff</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-[#0E0F0F] bg-[#0E0F0F]/10">
                          {vault.compositeApy[0]}-{vault.compositeApy[1]}%
                        </span>
                      </div>

                      {hasPositions ? (
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-[10px] text-[#0E0F0F]/60 uppercase">Deposited</p>
                            <p className="text-sm font-black text-[#0E0F0F]">{fmtUsd(stats.deposited)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#0E0F0F]/60 uppercase">Yield</p>
                            <p className="text-sm font-black text-[#0E0F0F]">{fmtUsd(stats.yieldEarned)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#0E0F0F]/60 uppercase">Positions</p>
                            <p className="text-sm font-black text-[#0E0F0F]">{stats.count}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#0E0F0F]">Not subscribed</span>
                          <span className="text-xs font-semibold text-[#0E0F0F] group-hover:underline">Subscribe →</span>
                        </div>
                      )}

                      <div className="mt-3 pt-2 border-t border-[#0E0F0F]/10">
                        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden mb-2">
                          {vault.strategies.map(s => (
                            <div key={s.type} style={{ backgroundColor: s.color, width: `${s.allocation}%` }} className="h-full first:rounded-l-full last:rounded-r-full" />
                          ))}
                        </div>
                        <div className="flex items-center justify-between w-full">
                          {vault.strategies.map(s => (
                            <div key={s.type} className="flex items-center justify-center gap-1 flex-1">
                              <Image src={STRATEGY_ICONS[s.type] ?? ''} alt={s.label} width={11} height={11} className="rounded-full" />
                              <span className="text-[10px] text-[#0E0F0F]">{s.label} {s.allocation}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ─── Performance Chart + Activity (ABOVE deposits) ──── */}
          <div className="grid grid-cols-12 gap-3 mb-5">
            <div className={`col-span-12 xl:col-span-8 ${CARD} overflow-hidden`}>
              {/* Chart header with strategy + mode + range selectors */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-[#9EB3A8]/20 bg-[#F2F2F2] rounded-t-2xl gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-[#0E0F0F]">Strategy Performance</h3>
                  <div className="flex items-center gap-0.5 bg-[#F2F2F2] rounded-full p-0.5">
                    {(['composite', 'rwa_mining', 'usdc_yield', 'btc_hedged'] as const).map((key) => {
                      const labelMap = { composite: 'All', rwa_mining: 'RWA', usdc_yield: 'USDC', btc_hedged: 'BTC' }
                      return (
                        <button
                          key={key}
                          onClick={() => setChartStrategy(key)}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-all flex items-center gap-1 ${chartStrategy === key ? 'bg-[#E6F1E7] text-[#0E0F0F]' : 'text-[#9EB3A8] hover:text-[#9EB3A8]'
                            }`}
                        >
                          {key !== 'composite' && STRATEGY_ICONS[key] && (
                            <Image src={STRATEGY_ICONS[key]} alt={labelMap[key]} width={12} height={12} className="rounded-full" />
                          )}
                          {labelMap[key]}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 bg-[#F2F2F2] rounded-full p-0.5">
                    <button onClick={() => setChartMode('cumulative')} className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-all ${chartMode === 'cumulative' ? 'bg-[#96EA7A] text-[#0E0F0F]' : 'text-[#9EB3A8] hover:text-[#9EB3A8]'}`}>
                      Cumul.
                    </button>
                    <button onClick={() => setChartMode('monthly')} className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-all ${chartMode === 'monthly' ? 'bg-[#96EA7A] text-[#0E0F0F]' : 'text-[#9EB3A8] hover:text-[#9EB3A8]'}`}>
                      Monthly
                    </button>
                  </div>
                  <div className="flex items-center gap-0.5 bg-[#F2F2F2] rounded-full p-0.5">
                    {['3M', '6M', '1Y', 'ALL'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-all ${timeRange === range ? 'bg-[#E6F1E7] text-[#0E0F0F]' : 'text-[#9EB3A8] hover:text-[#9EB3A8]'
                          }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 pb-2">
                <div className="h-52 lg:h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeChartData} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                      <defs>
                        <linearGradient id="grad-rwa_mining" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#96EA7A" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#96EA7A" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="grad-usdc_yield" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#9EB3A8" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#9EB3A8" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="grad-btc_hedged" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0E0F0F" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#0E0F0F" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="grad-composite" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#96EA7A" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#96EA7A" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9EB3A8' }} dy={4} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9EB3A8' }} tickFormatter={(v: number) => `${v}%`} />
                      <Tooltip content={chartMode === 'cumulative' ? <CumulativeTooltip /> : <ChartTooltip />} />
                      {chartStrategy === 'composite' ? (
                        <>
                          <Area type="monotone" dataKey="rwa_mining" stroke="#96EA7A" strokeWidth={1.5} fill="url(#grad-rwa_mining)" dot={false} activeDot={{ r: 2, fill: '#96EA7A', stroke: '#0E0F0F', strokeWidth: 2 }} />
                          <Area type="monotone" dataKey="usdc_yield" stroke="#9EB3A8" strokeWidth={1.5} fill="url(#grad-usdc_yield)" dot={false} activeDot={{ r: 2, fill: '#9EB3A8', stroke: '#0E0F0F', strokeWidth: 2 }} />
                          <Area type="monotone" dataKey="btc_hedged" stroke="#0E0F0F" strokeWidth={1.5} fill="url(#grad-btc_hedged)" dot={false} activeDot={{ r: 2, fill: '#0E0F0F', stroke: '#0E0F0F', strokeWidth: 2 }} />
                        </>
                      ) : (
                        <Area
                          type="monotone"
                          dataKey={chartStrategy}
                          stroke={STRATEGY_COLORS[chartStrategy] ?? '#96EA7A'}
                          strokeWidth={2}
                          fill={`url(#grad-${chartStrategy})`}
                          dot={false}
                          activeDot={{ r: 3, fill: STRATEGY_COLORS[chartStrategy] ?? '#96EA7A', stroke: '#0E0F0F', strokeWidth: 2 }}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quant metrics footer */}
              <div className="grid grid-cols-4 lg:grid-cols-8 border-t border-[#9EB3A8]/20">
                {[
                  { label: 'Cumul. Yield', value: fmtPercent(quantMetrics.totalYield), color: 'text-[#96EA7A]' },
                  { label: 'Best Month', value: fmtPercent(quantMetrics.bestMonth), color: 'text-[#96EA7A]' },
                  { label: 'Worst Month', value: fmtPercent(quantMetrics.worstMonth), color: 'text-[#9EB3A8]' },
                  { label: 'Avg Monthly', value: fmtPercent(quantMetrics.avgMonthly), color: 'text-[#0E0F0F]' },
                  { label: 'Volatility', value: fmtPercent(quantMetrics.volatility), color: 'text-[#0E0F0F]' },
                  { label: 'Sharpe', value: quantMetrics.sharpe.toFixed(2), color: quantMetrics.sharpe > 1.5 ? 'text-[#96EA7A]' : 'text-[#9EB3A8]' },
                  { label: 'Win Rate', value: `${quantMetrics.winRate.toFixed(0)}%`, color: quantMetrics.winRate > 50 ? 'text-[#96EA7A]' : 'text-[#9EB3A8]' },
                  { label: 'Spread', value: fmtPercent(quantMetrics.maxDrawdown), color: 'text-[#0E0F0F]' },
                ].map((stat, i, arr) => (
                  <div key={stat.label} className={`px-2.5 py-2.5 text-center ${i < arr.length - 1 ? 'border-r border-[#9EB3A8]/20' : ''}`}>
                    <p className="text-[10px] text-[#9EB3A8] uppercase tracking-wider mb-0.5">{stat.label}</p>
                    <p className={`text-xs font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Bars + Activity Feed */}
            <div className="col-span-12 xl:col-span-4 space-y-3">
              {/* Monthly Distribution Bars */}
              <div className={`${CARD} p-4`}>
                <h3 className="text-sm font-bold text-[#0E0F0F] mb-2">Monthly Yield Distribution</h3>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#9EB3A8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#9EB3A8' }} tickFormatter={(v: number) => `${v}%`} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="composite" name="Composite" radius={[4, 4, 0, 0]} fill="#96EA7A" fillOpacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activity Feed */}
              <div className={`${CARD} overflow-hidden`}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#9EB3A8]/20 bg-[#F2F2F2] rounded-t-2xl">
                  <h3 className="text-sm font-bold text-[#0E0F0F]">Recent Activity</h3>
                  <div className="flex items-center gap-1">
                    {Object.entries(activitySummary).map(([type, count]) => {
                      const colorMap: Record<string, string> = { deposit: 'bg-[#9EB3A8]', claim: 'bg-[#96EA7A]', withdraw: 'bg-[#0E0F0F]', rebalance: 'bg-[#9EB3A8]', distribute: 'bg-[#96EA7A]' }
                      return (
                        <div key={type} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#F2F2F2] rounded-full">
                          <span className={`w-1.5 h-1.5 rounded-full ${colorMap[type] ?? 'bg-[#9EB3A8]'}`} />
                          <span className="text-[10px] text-[#9EB3A8]">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="divide-y divide-[#9EB3A8]/20">
                  {MOCK_RECENT_TRANSACTIONS.slice(0, 5).map((tx) => {
                    const iconMap: Record<string, string> = {
                      deposit: 'M19 14l-7 7m0 0l-7-7m7 7V3',
                      claim: 'M5 10l7-7m0 0l7 7m-7-7v18',
                      withdraw: 'M5 10l7-7m0 0l7 7m-7-7v18',
                      rebalance: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
                      distribute: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
                    }
                    const colorMap: Record<string, string> = {
                      deposit: 'text-[#9EB3A8] bg-[#9EB3A8]/10',
                      claim: 'text-[#96EA7A] bg-[#96EA7A]/10',
                      withdraw: 'text-[#0E0F0F] bg-[#0E0F0F]/10',
                      rebalance: 'text-[#9EB3A8] bg-[#9EB3A8]/10',
                      distribute: 'text-[#96EA7A] bg-[#96EA7A]/10',
                    }
                    const parts = colorMap[tx.type]?.split(' ') ?? ['text-[#9EB3A8]', 'bg-[#9EB3A8]/10']
                    return (
                      <div key={tx.id} className="flex items-center justify-between px-4 py-2 hover:bg-[#E6F1E7] transition-colors">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${parts[1]}`}>
                            <svg className={`w-3.5 h-3.5 ${parts[0]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconMap[tx.type] ?? ''} />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[#0E0F0F] capitalize">{tx.type}</p>
                            <p className="text-[10px] text-[#9EB3A8]">{timeAgo(tx.timestamp)}</p>
                          </div>
                        </div>
                        <p className={`text-xs font-bold ${tx.type === 'claim' || tx.type === 'distribute' ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}>
                          {tx.type === 'claim' || tx.type === 'distribute' ? '+' : ''}{fmtUsd(tx.amount)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Deposits Table (below chart) ────────────────────── */}
          <div className={`${CARD} overflow-hidden`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-[#9EB3A8]/20 bg-[#F2F2F2] rounded-t-2xl gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#0E0F0F]">All Subscriptions</h3>
                <p className="text-xs text-[#9EB3A8]">{filteredDeposits.length} positions{vaultFilter ? ` in ${ALL_VAULTS.find(v => v.slug === vaultFilter)?.name.replace('HearstVault ', '')}` : ''}</p>
              </div>
              <div className="flex items-center gap-0.5 bg-[#F2F2F2] rounded-full p-0.5">
                <button
                  onClick={() => setVaultFilter(null)}
                  className={`px-3 py-1 text-[11px] font-medium rounded-full transition-all ${!vaultFilter ? 'bg-[#E6F1E7] text-[#0E0F0F]' : 'text-[#9EB3A8] hover:text-[#9EB3A8]'}`}
                >
                  All
                </button>
                {vaults.map((v, i) => (
                  <button
                    key={v.slug}
                    onClick={() => setVaultFilter(vaultFilter === v.slug ? null : v.slug)}
                    className={`px-3 py-1 text-[11px] font-medium rounded-full transition-all flex items-center gap-1 ${vaultFilter === v.slug ? 'bg-[#E6F1E7] text-[#0E0F0F]' : 'text-[#9EB3A8] hover:text-[#9EB3A8]'
                      }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: VAULT_COLORS[i] }} />
                    {v.name.replace('HearstVault ', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Table header */}
            <div className="hidden sm:grid grid-cols-7 gap-2 px-4 py-2.5 border-b border-[#9EB3A8]/20 bg-[#F2F2F2] text-[11px] text-[#9EB3A8] uppercase tracking-wider">
              <span>Vault</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Progress</span>
              <span>Yield</span>
              <span>Pending</span>
              <span className="text-right">Action</span>
            </div>

            {filteredDeposits.map((dep) => {
              const vaultIdx = vaults.findIndex(v => v.slug === dep.vaultSlug)
              const vault = vaults[vaultIdx]
              const vColor = VAULT_COLORS[vaultIdx] ?? '#666'
              return (
                <div key={dep.id} className="grid grid-cols-2 sm:grid-cols-7 gap-2 px-4 py-3 border-b border-[#9EB3A8]/20 hover:bg-[#E6F1E7] transition-colors items-center">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: vColor }} />
                    <span className="text-xs font-semibold text-[#0E0F0F] truncate">{vault?.name.replace('HearstVault ', '') ?? dep.vaultSlug}</span>
                  </div>
                  <span className="text-xs font-bold text-[#0E0F0F]">{fmtUsd(dep.amount)}</span>
                  <span className={`text-xs font-semibold ${getLockStatusColor(dep.lockStatus)}`}>
                    {getLockStatusLabel(dep.lockStatus)}
                  </span>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <div className="h-1.5 bg-[#F2F2F2] rounded-full flex-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${dep.progressPercent}%`,
                          background: dep.progressPercent >= 100 ? '#9EB3A8' : dep.progressPercent >= 33 ? '#96EA7A' : '#9EB3A8',
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-[#9EB3A8] w-7 text-right">{dep.progressPercent}%</span>
                  </div>
                  <span className="text-xs font-semibold text-[#96EA7A]">{fmtUsd(dep.claimedYield)}</span>
                  <span className="text-xs font-semibold text-[#9EB3A8]">{dep.pendingYield > 0 ? fmtUsd(dep.pendingYield) : '—'}</span>
                  <div className="text-right">
                    {dep.lockStatus === 'yield_claimable' && (
                      <button className="px-3 py-1 bg-gradient-to-r from-[#96EA7A] to-[#7ED066] text-[#0E0F0F] text-[11px] font-bold rounded-full hover:from-[#7ED066] hover:to-[#7ED066] transition-colors">Claim</button>
                    )}
                    {dep.lockStatus === 'matured' && (
                      <button className="px-3 py-1 bg-[#9EB3A8] text-[#F2F2F2] text-[11px] font-bold rounded-full hover:bg-[#96EA7A] transition-colors">Withdraw</button>
                    )}
                    {dep.lockStatus === 'locked' && (
                      <span className="text-[11px] text-[#9EB3A8]">Locked</span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Totals row */}
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 px-4 py-3 bg-[#E6F1E7] items-center border-t border-[#9EB3A8]/20">
              <span className="text-xs font-bold text-[#9EB3A8] uppercase">Total</span>
              <span className="text-xs font-black text-[#0E0F0F]">{fmtUsd(depositTotals.amount)}</span>
              <span className="text-xs text-[#9EB3A8]">{filteredDeposits.length} pos.</span>
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="h-1.5 bg-[#F2F2F2] rounded-full flex-1 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#96EA7A] to-[#7ED066]" style={{ width: `${filteredDeposits.reduce((s, d) => s + d.progressPercent, 0) / filteredDeposits.length}%` }} />
                </div>
                <span className="text-[11px] text-[#9EB3A8] w-7 text-right">{(filteredDeposits.reduce((s, d) => s + d.progressPercent, 0) / filteredDeposits.length).toFixed(0)}%</span>
              </div>
              <span className="text-xs font-black text-[#96EA7A]">{fmtUsd(depositTotals.yield)}</span>
              <span className="text-xs font-black text-[#9EB3A8]">{depositTotals.pending > 0 ? fmtUsd(depositTotals.pending) : '—'}</span>
              <span />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
