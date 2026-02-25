import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('validateEnvConfig', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('reports missing WalletConnect project ID', async () => {
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = ''
    const { validateEnvConfig } = await import('./env')
    const errors = validateEnvConfig()
    expect(errors.some((e) => e.includes('WalletConnect'))).toBe(true)
  })

  it('reports zero-address vault proxy', async () => {
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = 'abcdefghij12345'
    process.env.NEXT_PUBLIC_HEARST_VAULT_PROXY = '0x0000000000000000000000000000000000000000'
    const { validateEnvConfig } = await import('./env')
    const errors = validateEnvConfig()
    expect(errors.some((e) => e.includes('proxy'))).toBe(true)
  })

  it('returns no errors when all values are set', async () => {
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = 'abcdefghij12345'
    process.env.NEXT_PUBLIC_HEARST_VAULT_PROXY = '0xd8d294714F5b1A1104CFE75C0Bb4ceF547a05124'
    const { validateEnvConfig } = await import('./env')
    const errors = validateEnvConfig()
    expect(errors).toHaveLength(0)
  })
})
