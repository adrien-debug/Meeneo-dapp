const IS_DEV = process.env.NODE_ENV !== 'production'

export const ENV_CONFIG = {
  WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',

  HEARST_VAULT_PROXY:
    process.env.NEXT_PUBLIC_HEARST_VAULT_PROXY || '0xd8d294714F5b1A1104CFE75C0Bb4ceF547a05124',
  HEARST_VAULT_IMPL:
    process.env.NEXT_PUBLIC_HEARST_VAULT_IMPL || '0xEa7975C2fec1ae9e3058bb5f99d8e26dbC816811',

  EPOCH_VAULT_ADDRESS:
    process.env.NEXT_PUBLIC_EPOCH_VAULT_ADDRESS || '0xd8d294714F5b1A1104CFE75C0Bb4ceF547a05124',

  USDC_ADDRESS:
    process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',

  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '8453',
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org',
} as const

export function validateEnvConfig() {
  const errors: string[] = []

  if (!ENV_CONFIG.WALLETCONNECT_PROJECT_ID || ENV_CONFIG.WALLETCONNECT_PROJECT_ID.length < 10) {
    errors.push('WalletConnect Project ID is not configured - using fallback mode')
  }

  if (ENV_CONFIG.HEARST_VAULT_PROXY === '0x0000000000000000000000000000000000000000') {
    errors.push('HearstVault proxy address is not configured')
  }

  if (IS_DEV && !process.env.NEXT_PUBLIC_HEARST_VAULT_PROXY) {
    console.warn(
      '[env] Using hardcoded mainnet addresses in dev — set NEXT_PUBLIC_HEARST_VAULT_PROXY in .env.local to override',
    )
  }

  return errors
}
