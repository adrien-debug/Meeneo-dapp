import { ENV_CONFIG } from './env'

export const CONTRACT_ADDRESSES = {
  HEARST_VAULT_PROXY: ENV_CONFIG.HEARST_VAULT_PROXY,
  HEARST_VAULT_IMPL: ENV_CONFIG.HEARST_VAULT_IMPL,
  EPOCH_VAULT: ENV_CONFIG.EPOCH_VAULT_ADDRESS,
  USDC: ENV_CONFIG.USDC_ADDRESS,
} as const

export const NETWORKS = {
  base: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
  },
  baseSepolia: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
  },
} as const

export const HARDCODED_ADDRESSES = {
  REWARD_DEPOSITOR: '0x3F73DF516a501835F3BB46AF3cA669945597988D',
  AUTHORIZED_WITHDRAWAL: '0x51a99B1C95269065a545a2A8E5aF68438804c88b',
  ADMIN_DEPOSITOR: '0x2d206F87528aed3a09f0F172d404DE7B5dC669C2',
} as const

export const CONTRACT_CONFIG = {
  LOCK_PERIOD: 3 * 365 * 24 * 60 * 60,      // 3 years
  YIELD_CLIFF: 1 * 365 * 24 * 60 * 60,       // 1 year
  EPOCH_DURATION: 30 * 24 * 60 * 60,          // 30 days
  BASIS_POINTS: 10000,
  MANAGEMENT_FEE_BPS: 150,                     // 1.5%
  PERFORMANCE_FEE_BPS: 1000,                   // 10%
  EXIT_FEE_BPS: 10,                            // 0.1%
  EARLY_EXIT_PENALTY_BPS: 500,                 // 5%
} as const
