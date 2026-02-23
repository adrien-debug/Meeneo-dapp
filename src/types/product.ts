export type StrategyType = 'rwa_mining' | 'usdc_yield' | 'btc_hedged'
export type LockStatus = 'locked' | 'yield_claimable' | 'matured'
export type ProductStatus = 'active' | 'coming_soon' | 'paused' | 'closed'

export interface VaultStrategy {
  type: StrategyType
  label: string
  allocation: number
  protocols: string[]
  apyRange: [number, number]
  riskLevel: 'low' | 'medium' | 'medium-high'
  color: string
  description: string
}

export interface UserDeposit {
  id: number
  vaultSlug: string
  amount: number
  depositTimestamp: number
  maturityTimestamp: number
  yieldCliffTimestamp: number
  claimedYield: number
  pendingYield: number
  lockStatus: LockStatus
  progressPercent: number
}

export interface VaultConfig {
  slug: string
  name: string
  description: string
  contractAddress: `0x${string}`
  strategies: VaultStrategy[]
  lockPeriodMonths: number
  yieldCliffMonths: number
  fees: { management: number; performance: number; exit: number; earlyExit: number }
  tvlCap: number
  currentTvl: number
  totalShares: number
  currentEpoch: number
  depositToken: string
  chainId: number
  status: ProductStatus
  minDeposit: number
  compositeApy: [number, number]
}

export interface MonthlyPerformance {
  month: string
  rwa_mining: number
  usdc_yield: number
  btc_hedged: number
  composite: number
}

export interface ProtocolStats {
  tvlByStrategy: Record<StrategyType, number>
  apyByStrategy: Record<StrategyType, number>
  totalFeesCollected: number
  totalYieldDistributed: number
  activeDepositors: number
  totalDeposits: number
}

export interface RecentTransaction {
  id: string
  type: 'deposit' | 'claim' | 'withdraw' | 'rebalance' | 'distribute'
  amount: number
  timestamp: number
  address: string
  strategy?: StrategyType
}
