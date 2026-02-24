import type { UserDeposit, VaultConfig } from '@/types/product'
import { ALL_VAULTS, MOCK_USER_DEPOSITS } from '@/config/mock-data'

const STORAGE_KEY = 'meeneo-demo'

export interface DemoState {
  vaults: VaultConfig[]
  deposits: UserDeposit[]
  timeOffsetSeconds: number // simulated time offset from real time
  nextDepositId: number
  nextVaultIndex: number
}

function defaultState(): DemoState {
  return {
    vaults: structuredClone(ALL_VAULTS),
    deposits: structuredClone(MOCK_USER_DEPOSITS),
    timeOffsetSeconds: 0,
    nextDepositId: 100,
    nextVaultIndex: 4,
  }
}

export function loadDemo(): DemoState {
  if (typeof window === 'undefined') return defaultState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    return JSON.parse(raw) as DemoState
  } catch {
    return defaultState()
  }
}

export function saveDemo(state: DemoState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resetDemo(): DemoState {
  if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
  return defaultState()
}

export function demoNow(state: DemoState): number {
  return Math.floor(Date.now() / 1000) + state.timeOffsetSeconds
}

const DAY = 86400
const MONTH = 30 * DAY
const YEAR = 365 * DAY

export function addVault(
  state: DemoState,
  partial: {
    name: string
    description: string
    rwaAlloc: number
    usdcAlloc: number
    btcAlloc: number
    lockMonths: number
    cliffMonths: number
    tvlCap: number
    minDeposit: number
    apyMin: number
    apyMax: number
  },
): DemoState {
  const idx = state.nextVaultIndex
  const slug = `vault-${idx}`
  const vault: VaultConfig = {
    slug,
    name: partial.name || `Hearst ${String(idx).padStart(2, '0')}`,
    description: partial.description || 'Custom vault',
    contractAddress: `0x${idx.toString(16).padStart(40, '0')}` as `0x${string}`,
    strategies: [
      {
        type: 'rwa_mining',
        label: 'RWA Mining',
        allocation: partial.rwaAlloc,
        protocols: ['Hearst Mining'],
        apyRange: [partial.apyMin * 0.8, partial.apyMax * 1.2],
        riskLevel: 'medium-high',
        color: '#96EA7A',
        description: 'RWA Mining strategy',
      },
      {
        type: 'usdc_yield',
        label: 'USDC Yield',
        allocation: partial.usdcAlloc,
        protocols: ['Moonwell'],
        apyRange: [partial.apyMin * 0.5, partial.apyMax * 0.6],
        riskLevel: 'low',
        color: '#9EB3A8',
        description: 'USDC Yield strategy',
      },
      {
        type: 'btc_hedged',
        label: 'BTC Hedged',
        allocation: partial.btcAlloc,
        protocols: ['Derive'],
        apyRange: [partial.apyMin * 0.7, partial.apyMax * 0.9],
        riskLevel: 'medium',
        color: '#5B7A6E',
        description: 'BTC Hedged strategy',
      },
    ],
    lockPeriodMonths: partial.lockMonths,
    yieldCliffMonths: partial.cliffMonths,
    fees: { management: 1.5, performance: 10, exit: 0.1, earlyExit: 5 },
    tvlCap: partial.tvlCap,
    currentTvl: 0,
    totalShares: 0,
    depositToken: 'USDC',
    chainId: 8453,
    status: 'active',
    minDeposit: partial.minDeposit,
    compositeApy: [partial.apyMin, partial.apyMax],
  }
  return {
    ...state,
    vaults: [...state.vaults, vault],
    nextVaultIndex: idx + 1,
  }
}

export function removeVault(state: DemoState, slug: string): DemoState {
  return {
    ...state,
    vaults: state.vaults.filter((v) => v.slug !== slug),
    deposits: state.deposits.filter((d) => d.vaultSlug !== slug),
  }
}

export function addDeposit(state: DemoState, vaultSlug: string, amount: number): DemoState {
  const now = demoNow(state)
  const vault = state.vaults.find((v) => v.slug === vaultSlug)
  if (!vault) return state
  const id = state.nextDepositId
  const deposit: UserDeposit = {
    id,
    vaultSlug,
    amount,
    depositTimestamp: now,
    maturityTimestamp: now + vault.lockPeriodMonths * MONTH,
    yieldCliffTimestamp: now + vault.yieldCliffMonths * MONTH,
    claimedYield: 0,
    pendingYield: 0,
    lockStatus: 'active',
    progressPercent: 0,
  }
  const updatedVaults = state.vaults.map((v) =>
    v.slug === vaultSlug
      ? { ...v, currentTvl: v.currentTvl + amount, totalShares: v.totalShares + amount }
      : v,
  )
  return {
    ...state,
    deposits: [...state.deposits, deposit],
    vaults: updatedVaults,
    nextDepositId: id + 1,
  }
}

export function removeDeposit(state: DemoState, depositId: number): DemoState {
  const dep = state.deposits.find((d) => d.id === depositId)
  if (!dep) return state
  const updatedVaults = state.vaults.map((v) =>
    v.slug === dep.vaultSlug ? { ...v, currentTvl: Math.max(0, v.currentTvl - dep.amount) } : v,
  )
  return {
    ...state,
    deposits: state.deposits.filter((d) => d.id !== depositId),
    vaults: updatedVaults,
  }
}

export function claimYield(state: DemoState, depositId: number): DemoState {
  return {
    ...state,
    deposits: state.deposits.map((d) =>
      d.id === depositId
        ? { ...d, claimedYield: d.claimedYield + d.pendingYield, pendingYield: 0 }
        : d,
    ),
  }
}

export function advanceTime(state: DemoState, seconds: number): DemoState {
  const newOffset = state.timeOffsetSeconds + seconds
  const now = Math.floor(Date.now() / 1000) + newOffset
  const updated = state.deposits.map((d) => {
    const elapsed = now - d.depositTimestamp
    const lockDuration = d.maturityTimestamp - d.depositTimestamp
    const progress = Math.min(100, Math.round((elapsed / lockDuration) * 100))
    const matured = now >= d.maturityTimestamp
    const cliffPassed = now >= d.yieldCliffTimestamp
    const vault = state.vaults.find((v) => v.slug === d.vaultSlug)
    const avgApy = vault ? (vault.compositeApy[0] + vault.compositeApy[1]) / 2 / 100 : 0.1
    const monthsElapsed = elapsed / MONTH
    const monthsClaimable = cliffPassed ? Math.max(0, monthsElapsed - vault!.yieldCliffMonths) : 0
    const totalYieldEarned = d.amount * avgApy * (monthsElapsed / 12)
    const pending = cliffPassed ? Math.max(0, totalYieldEarned - d.claimedYield) : 0
    return {
      ...d,
      progressPercent: progress,
      lockStatus: matured ? ('matured' as const) : ('active' as const),
      pendingYield: Math.round(pending),
    }
  })
  return { ...state, timeOffsetSeconds: newOffset, deposits: updated }
}
