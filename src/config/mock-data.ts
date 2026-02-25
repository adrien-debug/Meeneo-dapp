import type {
  MonthlyPerformance,
  ProtocolStats,
  RecentTransaction,
  UserDeposit,
  VaultConfig,
} from '@/types/product'

// ─── Vault Definitions ───────────────────────────────────────────

export const HEARST_VAULT: VaultConfig = {
  slug: 'hearst-hedge',
  refNumber: '#01',
  name: 'Hearst Hedge',
  description:
    'Multi-strategy balanced vault — RWA Mining, USDC Yield, BTC Hedged. ~8–15% annual yield distributed monthly. Withdraw at 36% target or 3 years.',
  contractAddress: '0xd8d294714F5b1A1104CFE75C0Bb4ceF547a05124',
  strategies: [
    {
      type: 'rwa_mining',
      label: 'RWA Mining',
      allocation: 40,
      protocols: ['Hearst Mining', 'Marathon Digital', 'CleanSpark'],
      apyRange: [10, 18],
      riskLevel: 'medium-high',
      color: '#96EA7A',
      description:
        'Industrial-grade Bitcoin and altcoin mining through tokenized real-world mining infrastructure.',
    },
    {
      type: 'usdc_yield',
      label: 'USDC Yield',
      allocation: 30,
      protocols: ['Moonwell', 'Steakhouse Finance', 'Gauntlet'],
      apyRange: [5, 8],
      riskLevel: 'low',
      color: '#9EB3A8',
      description:
        'Institutional USDC lending across audited DeFi protocols on Base for stable, predictable returns.',
    },
    {
      type: 'btc_hedged',
      label: 'BTC Hedged',
      allocation: 30,
      protocols: ['Derive', 'Morpho', 'Ethena'],
      apyRange: [8, 14],
      riskLevel: 'medium',
      color: '#5B7A6E',
      description:
        'Delta-neutral BTC exposure with options hedging for asymmetric upside and capital protection.',
    },
  ],
  lockPeriodMonths: 36,
  yieldCliffMonths: 12,
  fees: { management: 1.5, performance: 10, exit: 0.1, earlyExit: 5 },
  tvlCap: 50_000_000,
  currentTvl: 12_480_000,
  totalShares: 12_150_000,
  depositToken: 'USDC',
  chainId: 8453,
  status: 'active',
  minDeposit: 500_000,
  compositeApy: [12, 12],
}

export const HEARST_BTC_LEVERAGE: VaultConfig = {
  slug: 'hearst-alpha',
  refNumber: '#02',
  name: 'Hearst Alpha',
  description:
    '100% BTC spot acquisition with 30% collateral borrowing deployed to mining infrastructure. ~15% annual yield. Higher risk, higher reward.',
  contractAddress: '0xa1b2c3d4e5f60718293a4b5c6d7e8f9001234567',
  strategies: [
    {
      type: 'btc_spot',
      label: 'BTC Spot',
      allocation: 70,
      protocols: ['Coinbase Prime', 'Fireblocks'],
      apyRange: [8, 12],
      riskLevel: 'medium',
      color: '#F7931A',
      description:
        'Direct BTC acquisition held in institutional custody. Price appreciation captured fully by the vault.',
    },
    {
      type: 'btc_collateral_mining',
      label: 'Collateral Mining',
      allocation: 30,
      protocols: ['Hearst Mining', 'Aave', 'Morpho'],
      apyRange: [18, 25],
      riskLevel: 'medium-high',
      color: '#D4A017',
      description:
        'BTC used as collateral to borrow stablecoins deployed into mining operations. Leveraged yield on top of spot exposure.',
    },
  ],
  lockPeriodMonths: 24,
  yieldCliffMonths: 6,
  fees: { management: 2, performance: 15, exit: 0.15, earlyExit: 8 },
  tvlCap: 30_000_000,
  currentTvl: 0,
  totalShares: 0,
  depositToken: 'USDC',
  chainId: 8453,
  status: 'active',
  minDeposit: 250_000,
  compositeApy: [15, 15],
}

export const ALL_VAULTS: VaultConfig[] = [HEARST_VAULT, HEARST_BTC_LEVERAGE]

// ─── Time Constants ──────────────────────────────────────────────

const NOW = Math.floor(Date.now() / 1000)
const DAY = 86400
const MONTH = 30 * DAY
const YEAR = 365 * DAY

// ─── User Deposits (across multiple vaults) ──────────────────────

// Yield: ~12%/year distributed monthly (1%/mo) → claim available anytime
// Withdraw: when cumulative yield reaches 36% target OR 3 years elapsed (whichever first)
// progressPercent = months elapsed / 36 months × 100 (capped at 100)
export const MOCK_USER_DEPOSITS: UserDeposit[] = [
  // Hearst Hedge — 18mo in, cliff passed (12mo), yield claimable since 6mo
  // $1,100,000 × ~11.5% APY / 12 × 6mo claimable = ~$63,250 realistic
  {
    id: 1,
    vaultSlug: 'hearst-hedge',
    amount: 1_100_000,
    depositTimestamp: NOW - 18 * MONTH,
    maturityTimestamp: NOW - 18 * MONTH + 3 * YEAR,
    yieldCliffTimestamp: NOW - 18 * MONTH + YEAR,
    claimedYield: 56_000,
    pendingYield: 11_000,
    lockStatus: 'active',
    progressPercent: 50,
  },
]

// ─── Performance Data ────────────────────────────────────────────

// Composite = weighted by Hearst Hedge allocation (40% RWA, 30% USDC, 30% BTC)
function computeComposite(rwa: number, usdc: number, btc: number): number {
  return +(rwa * 0.4 + usdc * 0.3 + btc * 0.3).toFixed(2)
}

export const MOCK_MONTHLY_PERFORMANCE: MonthlyPerformance[] = [
  {
    month: 'Mar 25',
    rwa_mining: 1.2,
    usdc_yield: 0.5,
    btc_hedged: 0.9,
    btc_spot: 0.8,
    btc_collateral_mining: 1.6,
    composite: computeComposite(1.2, 0.5, 0.9),
  },
  {
    month: 'Apr 25',
    rwa_mining: 1.4,
    usdc_yield: 0.48,
    btc_hedged: 1.1,
    btc_spot: 1.5,
    btc_collateral_mining: 2.1,
    composite: computeComposite(1.4, 0.48, 1.1),
  },
  {
    month: 'May 25',
    rwa_mining: 1.1,
    usdc_yield: 0.52,
    btc_hedged: 0.7,
    btc_spot: -0.3,
    btc_collateral_mining: 1.4,
    composite: computeComposite(1.1, 0.52, 0.7),
  },
  {
    month: 'Jun 25',
    rwa_mining: 1.5,
    usdc_yield: 0.55,
    btc_hedged: 1.3,
    btc_spot: 2.1,
    btc_collateral_mining: 1.9,
    composite: computeComposite(1.5, 0.55, 1.3),
  },
  {
    month: 'Jul 25',
    rwa_mining: 1.3,
    usdc_yield: 0.5,
    btc_hedged: 0.8,
    btc_spot: 0.4,
    btc_collateral_mining: 1.7,
    composite: computeComposite(1.3, 0.5, 0.8),
  },
  {
    month: 'Aug 25',
    rwa_mining: 0.9,
    usdc_yield: 0.47,
    btc_hedged: 0.6,
    btc_spot: -1.2,
    btc_collateral_mining: 1.3,
    composite: computeComposite(0.9, 0.47, 0.6),
  },
  {
    month: 'Sep 25',
    rwa_mining: 1.6,
    usdc_yield: 0.53,
    btc_hedged: 1.2,
    btc_spot: 1.8,
    btc_collateral_mining: 2.0,
    composite: computeComposite(1.6, 0.53, 1.2),
  },
  {
    month: 'Oct 25',
    rwa_mining: 1.4,
    usdc_yield: 0.51,
    btc_hedged: 1.0,
    btc_spot: 0.9,
    btc_collateral_mining: 1.8,
    composite: computeComposite(1.4, 0.51, 1.0),
  },
  {
    month: 'Nov 25',
    rwa_mining: 1.7,
    usdc_yield: 0.56,
    btc_hedged: 1.4,
    btc_spot: 2.5,
    btc_collateral_mining: 2.3,
    composite: computeComposite(1.7, 0.56, 1.4),
  },
  {
    month: 'Dec 25',
    rwa_mining: 1.2,
    usdc_yield: 0.49,
    btc_hedged: 0.9,
    btc_spot: 0.6,
    btc_collateral_mining: 1.5,
    composite: computeComposite(1.2, 0.49, 0.9),
  },
  {
    month: 'Jan 26',
    rwa_mining: 1.5,
    usdc_yield: 0.54,
    btc_hedged: 1.1,
    btc_spot: 1.3,
    btc_collateral_mining: 1.9,
    composite: computeComposite(1.5, 0.54, 1.1),
  },
  {
    month: 'Feb 26',
    rwa_mining: 1.3,
    usdc_yield: 0.52,
    btc_hedged: 1.0,
    btc_spot: 1.0,
    btc_collateral_mining: 1.7,
    composite: computeComposite(1.3, 0.52, 1.0),
  },
]

// ─── Protocol Stats ──────────────────────────────────────────────

// TVL by strategy — Hearst Hedge only (12.48M TVL, 40/30/30 allocation)
export const MOCK_PROTOCOL_STATS: ProtocolStats = {
  tvlByStrategy: {
    rwa_mining: 4_992_000,
    usdc_yield: 3_744_000,
    btc_hedged: 3_744_000,
    btc_spot: 0,
    btc_collateral_mining: 0,
  },
  apyByStrategy: {
    rwa_mining: 14.2,
    usdc_yield: 6.1,
    btc_hedged: 11.3,
    btc_spot: 10.5,
    btc_collateral_mining: 21.0,
  },
  totalFeesCollected: 187_200,
  totalYieldDistributed: 1_248_000,
  activeDepositors: 47,
  totalDeposits: 82,
}

// ─── Transactions ────────────────────────────────────────────────

export const MOCK_RECENT_TRANSACTIONS: RecentTransaction[] = [
  {
    id: 'tx-1',
    type: 'deposit',
    amount: 1_100_000,
    timestamp: NOW - 18 * MONTH,
    address: '0x7a3B...4f2E',
    strategy: 'rwa_mining',
    vaultName: 'Hearst Hedge',
  },
]

// ─── Vault Activity (rebalancing, distributions, claims) ─────────

export interface VaultActivity {
  id: string
  type: 'rebalance' | 'distribute' | 'deposit'
  timestamp: number
  description: string
  vaultSlug: string
}

export const MOCK_VAULT_ACTIVITY: VaultActivity[] = [
  {
    id: 'a-1',
    type: 'rebalance',
    timestamp: NOW - 2 * DAY,
    description: 'RWA Mining 42% → 40%, USDC Yield 28% → 30%',
    vaultSlug: 'hearst-hedge',
  },
  {
    id: 'a-2',
    type: 'distribute',
    timestamp: NOW - 8 * DAY,
    description: 'Yield distributed: $18,000',
    vaultSlug: 'hearst-hedge',
  },
  {
    id: 'a-3',
    type: 'rebalance',
    timestamp: NOW - 15 * DAY,
    description: 'BTC Hedged 32% → 30%, USDC Yield 28% → 30%',
    vaultSlug: 'hearst-hedge',
  },
  {
    id: 'a-4',
    type: 'rebalance',
    timestamp: NOW - 35 * DAY,
    description: 'RWA Mining 38% → 40%, BTC Hedged 32% → 30%',
    vaultSlug: 'hearst-hedge',
  },
  {
    id: 'a-5',
    type: 'distribute',
    timestamp: NOW - 45 * DAY,
    description: 'Yield distributed: $16,500',
    vaultSlug: 'hearst-hedge',
  },
]

export function getActivityForVault(vaultSlug: string): VaultActivity[] {
  const hardcoded = MOCK_VAULT_ACTIVITY.filter((a) => a.vaultSlug === vaultSlug)
  if (hardcoded.length > 0) return hardcoded
  return generateDemoActivity(vaultSlug)
}

function generateDemoActivity(vaultSlug: string): VaultActivity[] {
  const actions: VaultActivity[] = []
  const seed = hashCode(vaultSlug)
  const baseTime = NOW

  actions.push({
    id: `da-${vaultSlug}-1`,
    type: 'deposit',
    timestamp: baseTime - 1 * DAY,
    description: 'Initial deposit placed',
    vaultSlug,
  })
  actions.push({
    id: `da-${vaultSlug}-2`,
    type: 'rebalance',
    timestamp: baseTime - 3 * DAY,
    description: 'Strategy weights normalized to target',
    vaultSlug,
  })
  actions.push({
    id: `da-${vaultSlug}-3`,
    type: 'distribute',
    timestamp: baseTime - 7 * DAY,
    description: `Yield distributed: ${fmtUsd(800 + (seed % 4200))}`,
    vaultSlug,
  })
  actions.push({
    id: `da-${vaultSlug}-4`,
    type: 'rebalance',
    timestamp: baseTime - 18 * DAY,
    description: 'Quarterly rebalance executed',
    vaultSlug,
  })

  return actions.sort((a, b) => b.timestamp - a.timestamp)
}

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/**
 * Generate monthly performance data anchored to a vault's strategies.
 * For demo vaults with no hardcoded perf, this produces realistic-looking data.
 */
export function generateVaultPerformance(vault: VaultConfig): MonthlyPerformance[] {
  const seed = hashCode(vault.slug)
  const months = [
    'Mar 25',
    'Apr 25',
    'May 25',
    'Jun 25',
    'Jul 25',
    'Aug 25',
    'Sep 25',
    'Oct 25',
    'Nov 25',
    'Dec 25',
    'Jan 26',
    'Feb 26',
  ]

  const apyByType: Record<string, [number, number]> = {}
  for (const s of vault.strategies) {
    apyByType[s.type] = s.apyRange
  }

  return months.map((month, i) => {
    const noise = (idx: number, base: number) => {
      const v = Math.sin(seed + idx * 13 + i * 7) * 0.4
      return +(base + v).toFixed(2)
    }

    const rwa = apyByType['rwa_mining']
      ? noise(0, (apyByType['rwa_mining'][0] + apyByType['rwa_mining'][1]) / 2 / 12)
      : 0
    const usdc = apyByType['usdc_yield']
      ? noise(1, (apyByType['usdc_yield'][0] + apyByType['usdc_yield'][1]) / 2 / 12)
      : 0
    const btc = apyByType['btc_hedged']
      ? noise(2, (apyByType['btc_hedged'][0] + apyByType['btc_hedged'][1]) / 2 / 12)
      : 0
    const spot = apyByType['btc_spot']
      ? noise(3, (apyByType['btc_spot'][0] + apyByType['btc_spot'][1]) / 2 / 12)
      : 0
    const coll = apyByType['btc_collateral_mining']
      ? noise(
          4,
          (apyByType['btc_collateral_mining'][0] + apyByType['btc_collateral_mining'][1]) / 2 / 12,
        )
      : 0

    const weights = vault.strategies.reduce(
      (acc, s) => {
        acc[s.type] = s.allocation / 100
        return acc
      },
      {} as Record<string, number>,
    )

    const composite = +(
      (weights['rwa_mining'] ?? 0) * rwa +
      (weights['usdc_yield'] ?? 0) * usdc +
      (weights['btc_hedged'] ?? 0) * btc +
      (weights['btc_spot'] ?? 0) * spot +
      (weights['btc_collateral_mining'] ?? 0) * coll
    ).toFixed(2)

    return {
      month,
      rwa_mining: rwa,
      usdc_yield: usdc,
      btc_hedged: btc,
      btc_spot: spot,
      btc_collateral_mining: coll,
      composite,
    }
  })
}

// ─── Utilities ───────────────────────────────────────────────────

export function fmt(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function fmtUsd(n: number): string {
  return `$${fmt(Math.round(n))}`
}

export function fmtPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`
}

export function fmtApy(apy: [number, number]): string {
  return apy[0] === apy[1] ? `${apy[0]}%` : `${apy[0]}–${apy[1]}%`
}

export function timeAgo(timestamp: number): string {
  const diff = NOW - timestamp
  if (diff < DAY) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`
  if (diff < MONTH) return `${Math.floor(diff / (7 * DAY))}w ago`
  return `${Math.floor(diff / MONTH)}mo ago`
}

export function getLockStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'target_reached':
      return 'Target Reached'
    case 'matured':
      return 'Matured'
    default:
      return status
  }
}

export function getLockStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-[#96EA7A]'
    case 'target_reached':
      return 'text-[#96EA7A]'
    case 'matured':
      return 'text-[#96EA7A]'
    default:
      return 'text-[#9EB3A8]'
  }
}

// ─── Computed Aggregates ─────────────────────────────────────────

export function getDepositsForVault(vaultSlug: string): UserDeposit[] {
  return MOCK_USER_DEPOSITS.filter((d) => d.vaultSlug === vaultSlug)
}

export function getVaultUserStats(vaultSlug: string) {
  const deps = getDepositsForVault(vaultSlug)
  const firstDeposit = deps.length > 0 ? Math.min(...deps.map((d) => d.depositTimestamp)) : 0
  return {
    deposited: deps.reduce((s, d) => s + d.amount, 0),
    yieldEarned: deps.reduce((s, d) => s + d.claimedYield + d.pendingYield, 0),
    pending: deps.reduce((s, d) => s + d.pendingYield, 0),
    activeCount: deps.filter((d) => d.lockStatus !== 'matured').length,
    count: deps.length,
    firstDepositTimestamp: firstDeposit,
  }
}

export const TOTAL_USER_DEPOSITED = MOCK_USER_DEPOSITS.reduce((sum, d) => sum + d.amount, 0)
export const TOTAL_USER_YIELD = MOCK_USER_DEPOSITS.reduce(
  (sum, d) => sum + d.claimedYield + d.pendingYield,
  0,
)
export const TOTAL_USER_PENDING = MOCK_USER_DEPOSITS.reduce((sum, d) => sum + d.pendingYield, 0)
