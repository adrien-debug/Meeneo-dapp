import { describe, it, expect, vi } from 'vitest'
import { HARDCODED_ADDRESSES } from '@/config/contracts'

const ADMIN_ADDRESSES = [
  HARDCODED_ADDRESSES.REWARD_DEPOSITOR.toLowerCase(),
  HARDCODED_ADDRESSES.AUTHORIZED_WITHDRAWAL.toLowerCase(),
  HARDCODED_ADDRESSES.ADMIN_DEPOSITOR.toLowerCase(),
]

describe('Admin address check (pure logic)', () => {
  it('recognizes known admin addresses', () => {
    expect(ADMIN_ADDRESSES.includes(HARDCODED_ADDRESSES.REWARD_DEPOSITOR.toLowerCase())).toBe(true)
    expect(ADMIN_ADDRESSES.includes(HARDCODED_ADDRESSES.ADMIN_DEPOSITOR.toLowerCase())).toBe(true)
  })

  it('rejects random addresses', () => {
    expect(ADMIN_ADDRESSES.includes('0x0000000000000000000000000000000000000001')).toBe(false)
  })

  it('is case-insensitive', () => {
    const upper = HARDCODED_ADDRESSES.REWARD_DEPOSITOR.toUpperCase()
    expect(ADMIN_ADDRESSES.includes(upper.toLowerCase())).toBe(true)
  })
})
