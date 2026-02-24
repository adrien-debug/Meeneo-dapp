import type {
  MonthlyPerformance,
  ProtocolStats,
  RecentTransaction,
  UserDeposit,
  VaultConfig,
} from '@/types/product'

// ─── Vault Definitions ───────────────────────────────────────────

export const HEARST_VAULT: VaultConfig = {
  slug: 'hearst-vault',
  name: 'Hearst 01',
  description: 'Multi-strategy balanced vault — RWA Mining, USDC Yield, BTC Hedged. ~8–15% annual yield distributed monthly. Withdraw at 36% target or 3 years.',
  contractAddress: '0xd8d294714F5b1A1104CFE75C0Bb4ceF547a05124',
  strategies: [
    {
      type: 'rwa_mining', label: 'RWA Mining', allocation: 40,
      protocols: ['Hearst Mining', 'Marathon Digital', 'CleanSpark'],
      apyRange: [10, 18], riskLevel: 'medium-high', color: '#96EA7A',
      description: 'Industrial-grade Bitcoin and altcoin mining through tokenized real-world mining infrastructure.',
    },
    {
      type: 'usdc_yield', label: 'USDC Yield', allocation: 30,
      protocols: ['Moonwell', 'Steakhouse Finance', 'Gauntlet'],
      apyRange: [5, 8], riskLevel: 'low', color: '#9EB3A8',
      description: 'Institutional USDC lending across audited DeFi protocols on Base for stable, predictable returns.',
    },
    {
      type: 'btc_hedged', label: 'BTC Hedged', allocation: 30,
      protocols: ['Derive', 'Morpho', 'Ethena'],
      apyRange: [8, 14], riskLevel: 'medium', color: '#5B7A6E',
      description: 'Delta-neutral BTC exposure with options hedging for asymmetric upside and capital protection.',
    },
  ],
  lockPeriodMonths: 36, yieldCliffMonths: 12,
  fees: { management: 1.5, performance: 10, exit: 0.1, earlyExit: 5 },
  tvlCap: 50_000_000, currentTvl: 12_480_000, totalShares: 12_150_000,
  depositToken: 'USDC', chainId: 8453,
  status: 'active', minDeposit: 500_000, compositeApy: [8, 15],
}

export const CONSERVATIVE_VAULT: VaultConfig = {
  slug: 'conservative-vault',
  name: 'Hearst 02',
  description: 'Capital preservation focus — 60% USDC Yield, 25% BTC Hedged, 15% RWA Mining. ~5–9% annual yield distributed monthly. Withdraw at 36% target or 3 years.',
  contractAddress: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
  strategies: [
    {
      type: 'usdc_yield', label: 'USDC Yield', allocation: 60,
      protocols: ['Moonwell', 'Steakhouse Finance', 'Aave'],
      apyRange: [4, 7], riskLevel: 'low', color: '#9EB3A8',
      description: 'Heavy USDC allocation for maximum capital safety with institutional lending protocols.',
    },
    {
      type: 'btc_hedged', label: 'BTC Hedged', allocation: 25,
      protocols: ['Derive', 'Morpho'],
      apyRange: [6, 10], riskLevel: 'medium', color: '#5B7A6E',
      description: 'Hedged BTC exposure providing moderate upside with strong downside protection.',
    },
    {
      type: 'rwa_mining', label: 'RWA Mining', allocation: 15,
      protocols: ['Hearst Mining'],
      apyRange: [8, 12], riskLevel: 'medium-high', color: '#96EA7A',
      description: 'Minimal mining exposure for yield boost while keeping overall risk profile low.',
    },
  ],
  lockPeriodMonths: 36, yieldCliffMonths: 12,
  fees: { management: 1.0, performance: 8, exit: 0.1, earlyExit: 3 },
  tvlCap: 30_000_000, currentTvl: 8_200_000, totalShares: 8_050_000,
  depositToken: 'USDC', chainId: 8453,
  status: 'active', minDeposit: 250, compositeApy: [5, 9],
}

export const AGGRESSIVE_VAULT: VaultConfig = {
  slug: 'aggressive-vault',
  name: 'Hearst 03',
  description: 'Maximum yield — 55% RWA Mining, 30% BTC Hedged, 15% USDC Yield. ~12–20% annual yield distributed monthly. Withdraw at 36% target or 3 years.',
  contractAddress: '0xf0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9',
  strategies: [
    {
      type: 'rwa_mining', label: 'RWA Mining', allocation: 55,
      protocols: ['Hearst Mining', 'Marathon Digital', 'CleanSpark', 'Riot Platforms'],
      apyRange: [12, 22], riskLevel: 'medium-high', color: '#96EA7A',
      description: 'Maximum mining allocation with premium ASIC fleet and strategic energy partnerships.',
    },
    {
      type: 'btc_hedged', label: 'BTC Hedged', allocation: 30,
      protocols: ['Derive', 'Ethena', 'Pendle'],
      apyRange: [10, 18], riskLevel: 'medium', color: '#5B7A6E',
      description: 'Aggressive BTC delta strategies with higher leverage and options-based yield amplification.',
    },
    {
      type: 'usdc_yield', label: 'USDC Yield', allocation: 15,
      protocols: ['Moonwell'],
      apyRange: [5, 7], riskLevel: 'low', color: '#9EB3A8',
      description: 'Minimal stablecoin buffer for liquidity and rebalancing cushion.',
    },
  ],
  lockPeriodMonths: 36, yieldCliffMonths: 12,
  fees: { management: 2.0, performance: 15, exit: 0.1, earlyExit: 8 },
  tvlCap: 20_000_000, currentTvl: 5_640_000, totalShares: 5_400_000,
  depositToken: 'USDC', chainId: 8453,
  status: 'active', minDeposit: 1000, compositeApy: [12, 20],
}

export const ALL_VAULTS: VaultConfig[] = [HEARST_VAULT, CONSERVATIVE_VAULT, AGGRESSIVE_VAULT]

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
  // Hearst 01 — 18mo in, cliff passed (12mo), yield claimable since 6mo
  // $1,100,000 × ~11.5% APY / 12 × 6mo claimable = ~$63,250 realistic
  {
    id: 1, vaultSlug: 'hearst-vault', amount: 1_100_000,
    depositTimestamp: NOW - 18 * MONTH, maturityTimestamp: NOW - 18 * MONTH + 3 * YEAR,
    yieldCliffTimestamp: NOW - 18 * MONTH + YEAR,
    claimedYield: 56_000, pendingYield: 11_000,
    lockStatus: 'active', progressPercent: 50,
  },
  // Hearst 02 — 14mo in, cliff passed (12mo), yield claimable since 2mo
  // $800,000 × ~7% APY / 12 × 2mo claimable = ~$9,333
  {
    id: 2, vaultSlug: 'conservative-vault', amount: 800_000,
    depositTimestamp: NOW - 14 * MONTH, maturityTimestamp: NOW - 14 * MONTH + 3 * YEAR,
    yieldCliffTimestamp: NOW - 14 * MONTH + YEAR,
    claimedYield: 4_700, pendingYield: 4_600,
    lockStatus: 'active', progressPercent: 39,
  },
  // Hearst 03 — 38mo in, 3Y elapsed → MATURED, withdraw available
  // Cliff long passed, yield claimed over ~26 claimable months
  {
    id: 3, vaultSlug: 'aggressive-vault', amount: 400_000,
    depositTimestamp: NOW - 38 * MONTH, maturityTimestamp: NOW - 38 * MONTH + 3 * YEAR,
    yieldCliffTimestamp: NOW - 38 * MONTH + YEAR,
    claimedYield: 144_000, pendingYield: 0,
    lockStatus: 'matured', progressPercent: 100,
  },
]

// ─── Performance Data ────────────────────────────────────────────

// Composite = weighted by Hearst 01 allocation (40% RWA, 30% USDC, 30% BTC)
function computeComposite(rwa: number, usdc: number, btc: number): number {
  return +(rwa * 0.4 + usdc * 0.3 + btc * 0.3).toFixed(2)
}

export const MOCK_MONTHLY_PERFORMANCE: MonthlyPerformance[] = [
  { month: 'Mar 25', rwa_mining: 1.2, usdc_yield: 0.5, btc_hedged: 0.9, composite: computeComposite(1.2, 0.5, 0.9) },
  { month: 'Apr 25', rwa_mining: 1.4, usdc_yield: 0.48, btc_hedged: 1.1, composite: computeComposite(1.4, 0.48, 1.1) },
  { month: 'May 25', rwa_mining: 1.1, usdc_yield: 0.52, btc_hedged: 0.7, composite: computeComposite(1.1, 0.52, 0.7) },
  { month: 'Jun 25', rwa_mining: 1.5, usdc_yield: 0.55, btc_hedged: 1.3, composite: computeComposite(1.5, 0.55, 1.3) },
  { month: 'Jul 25', rwa_mining: 1.3, usdc_yield: 0.50, btc_hedged: 0.8, composite: computeComposite(1.3, 0.50, 0.8) },
  { month: 'Aug 25', rwa_mining: 0.9, usdc_yield: 0.47, btc_hedged: 0.6, composite: computeComposite(0.9, 0.47, 0.6) },
  { month: 'Sep 25', rwa_mining: 1.6, usdc_yield: 0.53, btc_hedged: 1.2, composite: computeComposite(1.6, 0.53, 1.2) },
  { month: 'Oct 25', rwa_mining: 1.4, usdc_yield: 0.51, btc_hedged: 1.0, composite: computeComposite(1.4, 0.51, 1.0) },
  { month: 'Nov 25', rwa_mining: 1.7, usdc_yield: 0.56, btc_hedged: 1.4, composite: computeComposite(1.7, 0.56, 1.4) },
  { month: 'Dec 25', rwa_mining: 1.2, usdc_yield: 0.49, btc_hedged: 0.9, composite: computeComposite(1.2, 0.49, 0.9) },
  { month: 'Jan 26', rwa_mining: 1.5, usdc_yield: 0.54, btc_hedged: 1.1, composite: computeComposite(1.5, 0.54, 1.1) },
  { month: 'Feb 26', rwa_mining: 1.3, usdc_yield: 0.52, btc_hedged: 1.0, composite: computeComposite(1.3, 0.52, 1.0) },
]

// ─── Protocol Stats ──────────────────────────────────────────────

// TVL by strategy aggregated across all 3 vaults:
// RWA: 12.48M×40% + 8.2M×15% + 5.64M×55% = 4,992K + 1,230K + 3,102K = 9,324K
// USDC: 12.48M×30% + 8.2M×60% + 5.64M×15% = 3,744K + 4,920K + 846K = 9,510K
// BTC:  12.48M×30% + 8.2M×25% + 5.64M×30% = 3,744K + 2,050K + 1,692K = 7,486K
export const MOCK_PROTOCOL_STATS: ProtocolStats = {
  tvlByStrategy: {
    rwa_mining: 9_324_000,
    usdc_yield: 9_510_000,
    btc_hedged: 7_486_000,
  },
  apyByStrategy: {
    rwa_mining: 14.2,
    usdc_yield: 6.1,
    btc_hedged: 11.3,
  },
  totalFeesCollected: 394_800,
  totalYieldDistributed: 2_632_000,
  activeDepositors: 47,
  totalDeposits: 82,
}

// ─── Transactions ────────────────────────────────────────────────

export const MOCK_RECENT_TRANSACTIONS: RecentTransaction[] = [
  { id: 'tx-1', type: 'deposit', amount: 1_100_000, timestamp: NOW - 18 * MONTH, address: '0x7a3B...4f2E', strategy: 'rwa_mining', vaultName: 'Hearst 01' },
  { id: 'tx-2', type: 'deposit', amount: 800_000, timestamp: NOW - 8 * MONTH, address: '0x51a9...c88b', strategy: 'usdc_yield', vaultName: 'Hearst 02' },
  { id: 'tx-3', type: 'deposit', amount: 400_000, timestamp: NOW - 38 * MONTH, address: '0x2d20...69C2', strategy: 'btc_hedged', vaultName: 'Hearst 03' },
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
  { id: 'a-1', type: 'rebalance', timestamp: NOW - 2 * DAY, description: 'RWA Mining 42% → 40%, USDC Yield 28% → 30%', vaultSlug: 'hearst-vault' },
  { id: 'a-2', type: 'distribute', timestamp: NOW - 8 * DAY, description: 'Yield distributed: $18,000', vaultSlug: 'hearst-vault' },
  { id: 'a-3', type: 'rebalance', timestamp: NOW - 15 * DAY, description: 'BTC Hedged 32% → 30%, USDC Yield 28% → 30%', vaultSlug: 'hearst-vault' },
  { id: 'a-4', type: 'rebalance', timestamp: NOW - 35 * DAY, description: 'RWA Mining 38% → 40%, BTC Hedged 32% → 30%', vaultSlug: 'hearst-vault' },
  { id: 'a-5', type: 'distribute', timestamp: NOW - 45 * DAY, description: 'Yield distributed: $16,500', vaultSlug: 'hearst-vault' },

  { id: 'a-6', type: 'rebalance', timestamp: NOW - 3 * DAY, description: 'USDC Yield 62% → 60%, BTC Hedged 23% → 25%', vaultSlug: 'conservative-vault' },
  { id: 'a-7', type: 'distribute', timestamp: NOW - 12 * DAY, description: 'Yield distributed: $12,000', vaultSlug: 'conservative-vault' },
  { id: 'a-8', type: 'rebalance', timestamp: NOW - 30 * DAY, description: 'RWA Mining 17% → 15%, USDC Yield 58% → 60%', vaultSlug: 'conservative-vault' },
  { id: 'a-9', type: 'distribute', timestamp: NOW - 40 * DAY, description: 'Yield distributed: $8,400', vaultSlug: 'conservative-vault' },

  { id: 'a-10', type: 'rebalance', timestamp: NOW - 4 * DAY, description: 'RWA Mining 53% → 55%, BTC Hedged 32% → 30%', vaultSlug: 'aggressive-vault' },
  { id: 'a-11', type: 'distribute', timestamp: NOW - 10 * DAY, description: 'Yield distributed: $6,000', vaultSlug: 'aggressive-vault' },
  { id: 'a-12', type: 'rebalance', timestamp: NOW - 28 * DAY, description: 'BTC Hedged 28% → 30%, USDC Yield 17% → 15%', vaultSlug: 'aggressive-vault' },
]

export function getActivityForVault(vaultSlug: string): VaultActivity[] {
  return MOCK_VAULT_ACTIVITY.filter(a => a.vaultSlug === vaultSlug)
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

export function timeAgo(timestamp: number): string {
  const diff = NOW - timestamp
  if (diff < DAY) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`
  if (diff < MONTH) return `${Math.floor(diff / (7 * DAY))}w ago`
  return `${Math.floor(diff / MONTH)}mo ago`
}

export function getLockStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Active'
    case 'target_reached': return 'Target Reached'
    case 'matured': return 'Matured'
    default: return status
  }
}

export function getLockStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'text-[#96EA7A]'
    case 'target_reached': return 'text-[#96EA7A]'
    case 'matured': return 'text-[#96EA7A]'
    default: return 'text-[#9EB3A8]'
  }
}

// ─── Computed Aggregates ─────────────────────────────────────────

export function getDepositsForVault(vaultSlug: string): UserDeposit[] {
  return MOCK_USER_DEPOSITS.filter(d => d.vaultSlug === vaultSlug)
}

export function getVaultUserStats(vaultSlug: string) {
  const deps = getDepositsForVault(vaultSlug)
  const firstDeposit = deps.length > 0 ? Math.min(...deps.map(d => d.depositTimestamp)) : 0
  return {
    deposited: deps.reduce((s, d) => s + d.amount, 0),
    yieldEarned: deps.reduce((s, d) => s + d.claimedYield + d.pendingYield, 0),
    pending: deps.reduce((s, d) => s + d.pendingYield, 0),
    activeCount: deps.filter(d => d.lockStatus !== 'matured').length,
    count: deps.length,
    firstDepositTimestamp: firstDeposit,
  }
}

export const TOTAL_USER_DEPOSITED = MOCK_USER_DEPOSITS.reduce((sum, d) => sum + d.amount, 0)
export const TOTAL_USER_YIELD = MOCK_USER_DEPOSITS.reduce((sum, d) => sum + d.claimedYield + d.pendingYield, 0)
export const TOTAL_USER_PENDING = MOCK_USER_DEPOSITS.reduce((sum, d) => sum + d.pendingYield, 0)
