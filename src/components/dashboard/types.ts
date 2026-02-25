import type { StrategyType, UserDeposit, VaultConfig } from '@/types/product'

export interface VaultStatEntry {
  vault: VaultConfig
  stats: {
    deposited: number
    yieldEarned: number
    pending: number
    count: number
  }
  color: string
}

export interface ActiveStrategy {
  type: StrategyType
  label: string
  weight: number
  color: string
}

export interface StrategyAllocationEntry {
  name: string
  type: string
  value: number
  pct: number
  color: string
}

export interface QuantMetrics {
  totalYield: number
  bestMonth: number
  worstMonth: number
  avgMonthly: number
  volatility: number
  sharpe: number
  winRate: number
  maxDrawdown: number
  sortino: number
  calmar: number
  downsideDev: number
  annualizedReturn: number
}

export type ChartStrategyFilter = 'composite' | StrategyType
export type ChartMode = 'monthly' | 'cumulative'

export type { UserDeposit, VaultConfig }
