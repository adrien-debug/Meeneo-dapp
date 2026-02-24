import { describe, it, expect } from 'vitest'
import { ENV_CONFIG, validateEnvConfig } from './env'

describe('ENV_CONFIG', () => {
  it('should have default values for all required fields', () => {
    expect(ENV_CONFIG.CHAIN_ID).toBe('8453')
    expect(ENV_CONFIG.RPC_URL).toBe('https://mainnet.base.org')
    expect(ENV_CONFIG.USDC_ADDRESS).toMatch(/^0x/)
    expect(ENV_CONFIG.HEARST_VAULT_PROXY).toMatch(/^0x/)
  })
})

describe('validateEnvConfig', () => {
  it('should return an array', () => {
    const errors = validateEnvConfig()
    expect(Array.isArray(errors)).toBe(true)
  })
})
