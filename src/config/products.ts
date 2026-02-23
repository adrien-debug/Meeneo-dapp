import type { ProductStatus, VaultConfig } from '@/types/product'
import { HEARST_VAULT } from './mock-data'

/**
 * Legacy compatibility layer — the active vault is now HEARST_VAULT.
 * This file is kept so that AdminCockpit, VaultManagement, and useMultiVault
 * continue to compile until they are fully migrated.
 */

export interface LegacyProduct {
  category: string
  slug: string
  name: string
  description: string
  token: string
  depositToken: string
  apr: number
  lockPeriod: number
  minDeposit: number
  maxDeposit?: number
  contractAddress: `0x${string}`
  status: ProductStatus
  icon: string
  color: string
  chainId: number
  features: string[]
  riskLevel: 'low' | 'medium' | 'high'
  launchDate?: string
  tvl?: number
}

export const PRODUCTS: LegacyProduct[] = [
  {
    category: 'product',
    slug: HEARST_VAULT.slug,
    name: HEARST_VAULT.name,
    description: HEARST_VAULT.description,
    token: 'USDC',
    depositToken: 'USDC',
    apr: 12,
    lockPeriod: 3,
    minDeposit: HEARST_VAULT.minDeposit,
    contractAddress: HEARST_VAULT.contractAddress,
    status: HEARST_VAULT.status,
    icon: '',
    color: '#96EA7A',
    chainId: 8453,
    features: [
      'Multi-strategy allocation (RWA, USDC, BTC)',
      '3-year lock, yield after 1 year',
      'Audited smart contracts on Base',
      'Institutional-grade custody',
    ],
    riskLevel: 'medium',
    launchDate: '2025-03-01',
    tvl: HEARST_VAULT.currentTvl,
  },
]

export const getProductBySlug = (slug: string): LegacyProduct | undefined =>
  PRODUCTS.find((p) => p.slug === slug)

export const getActiveProducts = (): LegacyProduct[] =>
  PRODUCTS.filter((p) => p.status === 'active')

export const getProductsByStatus = (status: ProductStatus): LegacyProduct[] =>
  PRODUCTS.filter((p) => p.status === status)

export const getProductsByChain = (chainId: number): LegacyProduct[] =>
  PRODUCTS.filter((p) => p.chainId === chainId)

export { HEARST_VAULT }
export type { VaultConfig }
