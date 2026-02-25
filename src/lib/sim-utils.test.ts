import { describe, it, expect } from 'vitest'
import { formatUSD, formatBTC, formatPercent, formatNumber } from './sim-utils'

describe('formatUSD', () => {
  it('formats whole numbers with dollar sign', () => {
    expect(formatUSD(1000)).toBe('$1,000')
    expect(formatUSD(0)).toBe('$0')
  })

  it('rounds to whole dollars', () => {
    expect(formatUSD(1234.56)).toBe('$1,235')
  })

  it('handles negative values', () => {
    expect(formatUSD(-500)).toBe('-$500')
  })
})

describe('formatBTC', () => {
  it('returns 8-decimal string', () => {
    expect(formatBTC(1.5)).toBe('1.50000000')
  })

  it('handles zero', () => {
    expect(formatBTC(0)).toBe('0.00000000')
  })

  it('returns ~0 for dust amounts', () => {
    expect(formatBTC(0.000000001)).toBe('~0')
  })
})

describe('formatPercent', () => {
  it('converts decimal to percent string', () => {
    expect(formatPercent(0.125)).toBe('12.5%')
  })

  it('respects custom decimals', () => {
    expect(formatPercent(0.12345, 2)).toBe('12.35%')
  })
})

describe('formatNumber', () => {
  it('formats with default 2 decimals', () => {
    expect(formatNumber(1234.5)).toBe('1,234.50')
  })

  it('respects custom decimals', () => {
    expect(formatNumber(1234.5, 0)).toBe('1,235')
  })
})
