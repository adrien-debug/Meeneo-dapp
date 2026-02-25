'use client'

import { Header } from '@/components/Header'
import { MOCK_MONTHLY_PERFORMANCE, MOCK_VAULT_ACTIVITY } from '@/config/mock-data'
import { useDemo } from '@/context/demo-context'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import type { StrategyType } from '@/types/product'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { LoadingScreen } from '@/components/ui/LoadingScreen'
import {
  DashboardHero,
  MonthlyDistribution,
  PerformanceChart,
  PerformanceTable,
  PositionsTable,
  RecentActivity,
  StrategyAllocation,
  VaultCards,
} from '@/components/dashboard'
import type { ChartMode, ChartStrategyFilter } from '@/components/dashboard/types'

const VAULT_COLORS = ['#96EA7A', '#9EB3A8', '#5B7A6E'] as const
const STRATEGY_COLORS: Record<string, string> = {
  rwa_mining: '#96EA7A',
  usdc_yield: '#9EB3A8',
  btc_hedged: '#5B7A6E',
  btc_spot: '#F7931A',
  btc_collateral_mining: '#D4A017',
}

export default function Dashboard() {
  const authed = useAuthGuard()
  const router = useRouter()
  const { vaults, deposits, deleteVault, now: demoNow } = useDemo()
  const [chartStrategy, setChartStrategy] = useState<ChartStrategyFilter>('composite')
  const [chartMode, setChartMode] = useState<ChartMode>('cumulative')
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

  const vaultColors = useMemo(
    () => Object.fromEntries(vaults.map((v, i) => [v.slug, VAULT_COLORS[i % VAULT_COLORS.length]])),
    [vaults],
  )

  const hasSubscriptions = deposits.length > 0

  const activeStrategies = useMemo(() => {
    const depositedSlugs = new Set(deposits.map((d) => d.vaultSlug))
    const subscribedVaults = vaults.filter((v) => depositedSlugs.has(v.slug))

    if (subscribedVaults.length === 0) return []

    const stratMap = new Map<StrategyType, { label: string; dollarWeight: number }>()
    for (const v of subscribedVaults) {
      const vaultDeposited = deposits
        .filter((d) => d.vaultSlug === v.slug)
        .reduce((s, d) => s + d.amount, 0)
      for (const s of v.strategies) {
        const weight = (s.allocation / 100) * vaultDeposited
        const existing = stratMap.get(s.type)
        if (existing) {
          existing.dollarWeight += weight
        } else {
          stratMap.set(s.type, { label: s.label, dollarWeight: weight })
        }
      }
    }

    const total = Array.from(stratMap.values()).reduce((acc, v) => acc + v.dollarWeight, 0)
    return Array.from(stratMap.entries()).map(([type, data]) => ({
      type,
      label: data.label,
      weight: total > 0 ? data.dollarWeight / total : 0,
      color: STRATEGY_COLORS[type] ?? '#96EA7A',
    }))
  }, [vaults, deposits])

  const activeStrategyTypes = useMemo(
    () => new Set(activeStrategies.map((s) => s.type)),
    [activeStrategies],
  )

  const strategyAllocationData = useMemo(
    () =>
      activeStrategies.map((s) => ({
        name: s.label,
        type: s.type,
        value: +(s.weight * TOTAL_USER_DEPOSITED).toFixed(2),
        pct: +(s.weight * 100).toFixed(0),
        color: s.color,
      })),
    [activeStrategies, TOTAL_USER_DEPOSITED],
  )

  const earliestDepositTs = useMemo(
    () => (deposits.length > 0 ? Math.min(...deposits.map((d) => d.depositTimestamp)) : null),
    [deposits],
  )

  const chartData = useMemo(() => {
    if (!earliestDepositTs || activeStrategies.length === 0) return []

    const MONTH_NAMES = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    const toLabel = (d: Date) => `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`

    const mockLookup = new Map(MOCK_MONTHLY_PERFORMANCE.map((m) => [m.month, m]))

    const mockAvg: Record<string, number> = {}
    for (const s of activeStrategies) {
      const vals = MOCK_MONTHLY_PERFORMANCE.map((m) => m[s.type])
      mockAvg[s.type] = vals.reduce((a, b) => a + b, 0) / vals.length
    }

    const startDate = new Date(earliestDepositTs * 1000)
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    const endDate = new Date(demoNow * 1000)
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    const allMonths: string[] = []
    const cur = new Date(start)
    while (cur <= end) {
      allMonths.push(toLabel(cur))
      cur.setMonth(cur.getMonth() + 1)
    }

    const rangeMap: Record<string, number> = { '3M': 3, '6M': 6, '1Y': 12, ALL: 999 }
    const months = allMonths.slice(-(rangeMap[timeRange] ?? 12))

    return months.map((month, i) => {
      const mock = mockLookup.get(month)
      const point: Record<string, number | string> = { month }

      for (const s of activeStrategies) {
        if (mock) {
          point[s.type] = mock[s.type]
        } else {
          const seed = month.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
          const variance = 0.75 + 0.5 * Math.abs(Math.sin(seed * (i + 1) * 0.17))
          point[s.type] = +(mockAvg[s.type] * variance).toFixed(2)
        }
      }

      point.composite = +activeStrategies
        .reduce((sum, s) => sum + (point[s.type] as number) * s.weight, 0)
        .toFixed(2)
      return point
    })
  }, [timeRange, activeStrategies, earliestDepositTs, demoNow])

  const cumulativeData = useMemo(() => {
    const accum: Record<string, number> = { composite: 0 }
    activeStrategies.forEach((s) => {
      accum[s.type] = 0
    })
    return chartData.map((m) => {
      const point: Record<string, number | string> = { month: m.month as string }
      for (const s of activeStrategies) {
        accum[s.type] += (m[s.type] as number) ?? 0
        point[s.type] = +accum[s.type].toFixed(2)
      }
      accum.composite += (m.composite as number) ?? 0
      point.composite = +accum.composite.toFixed(2)
      return point
    })
  }, [chartData, activeStrategies])

  const quantMetrics = useMemo(() => {
    const composites = chartData.map((m) => (m.composite as number) ?? 0)
    const zero = {
      totalYield: 0,
      bestMonth: 0,
      worstMonth: 0,
      avgMonthly: 0,
      volatility: 0,
      sharpe: 0,
      winRate: 0,
      maxDrawdown: 0,
      sortino: 0,
      calmar: 0,
      downsideDev: 0,
      annualizedReturn: 0,
    }
    if (composites.length === 0) return zero

    const mean = composites.reduce((s, v) => s + v, 0) / composites.length
    const variance = composites.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / composites.length
    const stdDev = Math.sqrt(variance)
    const riskFreeMonthly = 0.42
    const sharpe = stdDev > 0 ? (mean - riskFreeMonthly) / stdDev : 0
    const maxVal = Math.max(...composites)
    const minVal = Math.min(...composites)
    const winRate = (composites.filter((v) => v > mean).length / composites.length) * 100
    const totalCumulative = composites.reduce((s, v) => s + v, 0)

    let peak = 0
    let maxDd = 0
    let cumul = 0
    for (const v of composites) {
      cumul += v
      if (cumul > peak) peak = cumul
      const dd = peak - cumul
      if (dd > maxDd) maxDd = dd
    }

    const downsideReturns = composites.filter((v) => v < riskFreeMonthly)
    const downsideVariance =
      downsideReturns.length > 0
        ? downsideReturns.reduce((s, v) => s + Math.pow(v - riskFreeMonthly, 2), 0) /
          downsideReturns.length
        : 0
    const downsideDev = Math.sqrt(downsideVariance)
    const sortino = downsideDev > 0 ? (mean - riskFreeMonthly) / downsideDev : 0

    const annualizedReturn = mean * 12
    const calmar = maxDd > 0 ? annualizedReturn / maxDd : 0

    return {
      totalYield: totalCumulative,
      bestMonth: maxVal,
      worstMonth: minVal,
      avgMonthly: mean,
      volatility: stdDev,
      sharpe,
      winRate,
      maxDrawdown: maxDd,
      sortino,
      calmar,
      downsideDev,
      annualizedReturn,
    }
  }, [chartData])

  useEffect(() => {
    if (chartStrategy !== 'composite' && !activeStrategyTypes.has(chartStrategy)) {
      setChartStrategy('composite')
    }
  }, [chartStrategy, activeStrategyTypes])

  const activeChartData = chartMode === 'cumulative' ? cumulativeData : chartData

  const composedChartData = useMemo(() => {
    return chartData.map((m, i) => ({
      ...m,
      _cumComposite: cumulativeData[i]?.composite ?? 0,
    }))
  }, [chartData, cumulativeData])

  if (!authed) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Header />

      <main className="pt-20 pb-10">
        <div className="page-container">
          <DashboardHero
            totalPortfolio={totalPortfolio}
            totalDeposited={TOTAL_USER_DEPOSITED}
            totalYield={TOTAL_USER_YIELD}
            totalPending={TOTAL_USER_PENDING}
            avgMonthly={quantMetrics.avgMonthly}
            activeVaultCount={vaultStats.filter((v) => v.stats.count > 0).length}
            onPendingClick={() => router.push('/my-vaults')}
          />

          <VaultCards
            vaultStats={vaultStats}
            deposits={deposits}
            demoNow={demoNow}
            onVaultClick={(slug) => router.push(`/vault/${slug}`)}
            onSubscribeClick={() => router.push('/subscribe')}
            onDeleteVault={deleteVault}
          />

          {hasSubscriptions && (
            <>
              <div className="grid grid-cols-12 gap-4 section-gap">
                <StrategyAllocation data={strategyAllocationData} />
                <div className="col-span-12 lg:col-span-7">
                  <PositionsTable
                    deposits={deposits}
                    vaults={vaults}
                    vaultColors={vaultColors}
                    demoNow={demoNow}
                    onRowClick={(slug) => router.push(`/vault/${slug}`)}
                  />
                </div>
              </div>

              <div className="mb-4 mt-1">
                <h2 className="section-title">Performance</h2>
              </div>

              {/* 2/3 Performance chart + 1/3 Monthly Returns */}
              <div className="grid grid-cols-12 gap-4 section-gap">
                <PerformanceChart
                  activeChartData={activeChartData}
                  composedChartData={composedChartData}
                  activeStrategies={activeStrategies}
                  chartStrategy={chartStrategy}
                  chartMode={chartMode}
                  timeRange={timeRange}
                  quantMetrics={quantMetrics}
                  onChartStrategyChange={setChartStrategy}
                  onChartModeChange={setChartMode}
                  onTimeRangeChange={setTimeRange}
                />
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
                  <MonthlyDistribution chartData={chartData} quantMetrics={quantMetrics} />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 section-gap">
                <div className="col-span-12 lg:col-span-8">
                  <PerformanceTable chartData={chartData} activeStrategies={activeStrategies} />
                </div>
                <div className="col-span-12 lg:col-span-4">
                  <RecentActivity activity={MOCK_VAULT_ACTIVITY} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
