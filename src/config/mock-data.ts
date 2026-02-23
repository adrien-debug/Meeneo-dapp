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
  name: 'HearstVault Balanced',
  description: 'Multi-strategy balanced vault — RWA Mining, USDC Yield, BTC Hedged. 3-year lock, yield claimable after 1 year.',
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
  currentEpoch: 8, depositToken: 'USDC', chainId: 8453,
  status: 'active', minDeposit: 500, compositeApy: [8, 15],
}

export const CONSERVATIVE_VAULT: VaultConfig = {
  slug: 'conservative-vault',
  name: 'HearstVault Conservative',
  description: 'Capital preservation focus — 60% USDC Yield, 25% BTC Hedged, 15% RWA Mining. Lower risk, stable returns.',
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
  lockPeriodMonths: 24, yieldCliffMonths: 6,
  fees: { management: 1.0, performance: 8, exit: 0.1, earlyExit: 3 },
  tvlCap: 30_000_000, currentTvl: 8_200_000, totalShares: 8_050_000,
  currentEpoch: 12, depositToken: 'USDC', chainId: 8453,
  status: 'active', minDeposit: 250, compositeApy: [5, 9],
}

export const AGGRESSIVE_VAULT: VaultConfig = {
  slug: 'aggressive-vault',
  name: 'HearstVault Alpha',
  description: 'Maximum yield — 55% RWA Mining, 30% BTC Hedged, 15% USDC Yield. Higher risk, higher potential returns.',
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
  lockPeriodMonths: 48, yieldCliffMonths: 12,
  fees: { management: 2.0, performance: 15, exit: 0.15, earlyExit: 8 },
  tvlCap: 20_000_000, currentTvl: 5_640_000, totalShares: 5_400_000,
  currentEpoch: 6, depositToken: 'USDC', chainId: 8453,
  status: 'active', minDeposit: 1000, compositeApy: [12, 20],
}

export const ALL_VAULTS: VaultConfig[] = [HEARST_VAULT, CONSERVATIVE_VAULT, AGGRESSIVE_VAULT]

// ─── Time Constants ──────────────────────────────────────────────

const NOW = Math.floor(Date.now() / 1000)
const DAY = 86400
const MONTH = 30 * DAY
const YEAR = 365 * DAY

// ─── User Deposits (across multiple vaults) ──────────────────────

export const MOCK_USER_DEPOSITS: UserDeposit[] = [
  // HearstVault Balanced
  {
    id: 1, vaultSlug: 'hearst-vault', amount: 25_000,
    depositTimestamp: NOW - 18 * MONTH, maturityTimestamp: NOW - 18 * MONTH + 3 * YEAR,
    yieldCliffTimestamp: NOW - 18 * MONTH + YEAR,
    claimedYield: 1_820, pendingYield: 640,
    lockStatus: 'yield_claimable', progressPercent: 50,
  },
  {
    id: 2, vaultSlug: 'hearst-vault', amount: 10_000,
    depositTimestamp: NOW - 6 * MONTH, maturityTimestamp: NOW - 6 * MONTH + 3 * YEAR,
    yieldCliffTimestamp: NOW - 6 * MONTH + YEAR,
    claimedYield: 0, pendingYield: 0,
    lockStatus: 'locked', progressPercent: 17,
  },
  {
    id: 3, vaultSlug: 'hearst-vault', amount: 50_000,
    depositTimestamp: NOW - 38 * MONTH, maturityTimestamp: NOW - 38 * MONTH + 3 * YEAR,
    yieldCliffTimestamp: NOW - 38 * MONTH + YEAR,
    claimedYield: 12_400, pendingYield: 0,
    lockStatus: 'matured', progressPercent: 100,
  },
  // Conservative Vault
  {
    id: 4, vaultSlug: 'conservative-vault', amount: 40_000,
    depositTimestamp: NOW - 14 * MONTH, maturityTimestamp: NOW - 14 * MONTH + 2 * YEAR,
    yieldCliffTimestamp: NOW - 14 * MONTH + 6 * MONTH,
    claimedYield: 1_960, pendingYield: 380,
    lockStatus: 'yield_claimable', progressPercent: 58,
  },
  {
    id: 5, vaultSlug: 'conservative-vault', amount: 15_000,
    depositTimestamp: NOW - 3 * MONTH, maturityTimestamp: NOW - 3 * MONTH + 2 * YEAR,
    yieldCliffTimestamp: NOW - 3 * MONTH + 6 * MONTH,
    claimedYield: 0, pendingYield: 0,
    lockStatus: 'locked', progressPercent: 12,
  },
  // Aggressive Vault
  {
    id: 6, vaultSlug: 'aggressive-vault', amount: 20_000,
    depositTimestamp: NOW - 10 * MONTH, maturityTimestamp: NOW - 10 * MONTH + 4 * YEAR,
    yieldCliffTimestamp: NOW - 10 * MONTH + YEAR,
    claimedYield: 0, pendingYield: 0,
    lockStatus: 'locked', progressPercent: 21,
  },
  {
    id: 7, vaultSlug: 'aggressive-vault', amount: 30_000,
    depositTimestamp: NOW - 16 * MONTH, maturityTimestamp: NOW - 16 * MONTH + 4 * YEAR,
    yieldCliffTimestamp: NOW - 16 * MONTH + YEAR,
    claimedYield: 3_200, pendingYield: 1_100,
    lockStatus: 'yield_claimable', progressPercent: 33,
  },
]

// ─── Performance Data ────────────────────────────────────────────

export const MOCK_MONTHLY_PERFORMANCE: MonthlyPerformance[] = [
  { month: 'Mar 25', rwa_mining: 1.2, usdc_yield: 0.5, btc_hedged: 0.9, composite: 0.88 },
  { month: 'Apr 25', rwa_mining: 1.4, usdc_yield: 0.48, btc_hedged: 1.1, composite: 1.01 },
  { month: 'May 25', rwa_mining: 1.1, usdc_yield: 0.52, btc_hedged: 0.7, composite: 0.78 },
  { month: 'Jun 25', rwa_mining: 1.5, usdc_yield: 0.55, btc_hedged: 1.3, composite: 1.12 },
  { month: 'Jul 25', rwa_mining: 1.3, usdc_yield: 0.50, btc_hedged: 0.8, composite: 0.87 },
  { month: 'Aug 25', rwa_mining: 0.9, usdc_yield: 0.47, btc_hedged: 0.6, composite: 0.66 },
  { month: 'Sep 25', rwa_mining: 1.6, usdc_yield: 0.53, btc_hedged: 1.2, composite: 1.11 },
  { month: 'Oct 25', rwa_mining: 1.4, usdc_yield: 0.51, btc_hedged: 1.0, composite: 0.97 },
  { month: 'Nov 25', rwa_mining: 1.7, usdc_yield: 0.56, btc_hedged: 1.4, composite: 1.22 },
  { month: 'Dec 25', rwa_mining: 1.2, usdc_yield: 0.49, btc_hedged: 0.9, composite: 0.87 },
  { month: 'Jan 26', rwa_mining: 1.5, usdc_yield: 0.54, btc_hedged: 1.1, composite: 1.05 },
  { month: 'Feb 26', rwa_mining: 1.3, usdc_yield: 0.52, btc_hedged: 1.0, composite: 0.94 },
]

// ─── Protocol Stats ──────────────────────────────────────────────

export const MOCK_PROTOCOL_STATS: ProtocolStats = {
  tvlByStrategy: {
    rwa_mining: 4_992_000,
    usdc_yield: 3_744_000,
    btc_hedged: 3_744_000,
  },
  apyByStrategy: {
    rwa_mining: 14.2,
    usdc_yield: 6.1,
    btc_hedged: 11.3,
  },
  totalFeesCollected: 186_400,
  totalYieldDistributed: 1_248_000,
  activeDepositors: 47,
  totalDeposits: 82,
}

// ─── Transactions ────────────────────────────────────────────────

export const MOCK_RECENT_TRANSACTIONS: RecentTransaction[] = [
  { id: 'tx-1', type: 'deposit', amount: 15_000, timestamp: NOW - 2 * DAY, address: '0x7a3B...4f2E', strategy: 'rwa_mining' },
  { id: 'tx-2', type: 'claim', amount: 420, timestamp: NOW - 3 * DAY, address: '0x51a9...c88b' },
  { id: 'tx-3', type: 'rebalance', amount: 312_000, timestamp: NOW - 5 * DAY, address: '0x3F73...988D', strategy: 'usdc_yield' },
  { id: 'tx-4', type: 'distribute', amount: 52_000, timestamp: NOW - 7 * DAY, address: '0x3F73...988D' },
  { id: 'tx-5', type: 'deposit', amount: 50_000, timestamp: NOW - 10 * DAY, address: '0x2d20...69C2', strategy: 'btc_hedged' },
  { id: 'tx-6', type: 'withdraw', amount: 25_000, timestamp: NOW - 12 * DAY, address: '0xaB32...1f7C' },
  { id: 'tx-7', type: 'claim', amount: 1_200, timestamp: NOW - 15 * DAY, address: '0xCd44...9e3A' },
  { id: 'tx-8', type: 'deposit', amount: 8_000, timestamp: NOW - 18 * DAY, address: '0xEf56...b82D', strategy: 'rwa_mining' },
]

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
    case 'locked': return 'Locked'
    case 'yield_claimable': return 'Yield Claimable'
    case 'matured': return 'Matured'
    default: return status
  }
}

export function getLockStatusColor(status: string): string {
  switch (status) {
    case 'locked': return 'text-[#9EB3A8]'
    case 'yield_claimable': return 'text-[#96EA7A]'
    case 'matured': return 'text-[#0E0F0F]'
    default: return 'text-[#9EB3A8]'
  }
}

// ─── Computed Aggregates ─────────────────────────────────────────

export function getDepositsForVault(vaultSlug: string): UserDeposit[] {
  return MOCK_USER_DEPOSITS.filter(d => d.vaultSlug === vaultSlug)
}

export function getVaultUserStats(vaultSlug: string) {
  const deps = getDepositsForVault(vaultSlug)
  return {
    deposited: deps.reduce((s, d) => s + d.amount, 0),
    yieldEarned: deps.reduce((s, d) => s + d.claimedYield + d.pendingYield, 0),
    pending: deps.reduce((s, d) => s + d.pendingYield, 0),
    activeCount: deps.filter(d => d.lockStatus !== 'matured').length,
    count: deps.length,
  }
}

export const TOTAL_USER_DEPOSITED = MOCK_USER_DEPOSITS.reduce((sum, d) => sum + d.amount, 0)
export const TOTAL_USER_YIELD = MOCK_USER_DEPOSITS.reduce((sum, d) => sum + d.claimedYield + d.pendingYield, 0)
export const TOTAL_USER_PENDING = MOCK_USER_DEPOSITS.reduce((sum, d) => sum + d.pendingYield, 0)
