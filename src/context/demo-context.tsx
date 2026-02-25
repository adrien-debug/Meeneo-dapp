'use client'

import {
  addDeposit,
  addVault,
  advanceTime,
  claimYield,
  demoNow,
  isDemoModeActive,
  loadDemo,
  removeDeposit,
  removeVault,
  resetDemo,
  saveDemo,
  setDemoModeActive,
  subscribeToProduct,
  type DemoState,
} from '@/lib/demo-store'
import type { UserDeposit, VaultConfig } from '@/types/product'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

interface DemoContextValue {
  state: DemoState
  vaults: VaultConfig[]
  deposits: UserDeposit[]
  now: number
  isDemoMode: boolean
  enterDemoMode: () => void
  exitDemoMode: () => void
  createVault: (params: Parameters<typeof addVault>[1]) => void
  deleteVault: (slug: string) => void
  subscribe: (product: VaultConfig, amount: number) => string | null
  deposit: (vaultSlug: string, amount: number) => void
  withdraw: (depositId: number) => void
  claim: (depositId: number) => void
  skipTime: (seconds: number) => void
  reset: () => void
  getDepositsForVault: (slug: string) => UserDeposit[]
  getVaultBySlug: (slug: string) => VaultConfig | undefined
}

const DemoContext = createContext<DemoContextValue | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState | null>(null)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    setState(loadDemo())
    setDemoMode(isDemoModeActive())
  }, [])

  const enterDemoMode = useCallback(() => {
    setDemoModeActive(true)
    setDemoMode(true)
  }, [])

  const exitDemoMode = useCallback(() => {
    setDemoModeActive(false)
    setDemoMode(false)
  }, [])

  const persist = useCallback((next: DemoState) => {
    setState(next)
    saveDemo(next)
  }, [])

  const createVaultFn = useCallback(
    (params: Parameters<typeof addVault>[1]) => {
      if (!state) return
      persist(addVault(state, params))
    },
    [state, persist],
  )

  const deleteVaultFn = useCallback(
    (slug: string) => {
      if (!state) return
      persist(removeVault(state, slug))
    },
    [state, persist],
  )

  const subscribeFn = useCallback(
    (product: VaultConfig, amount: number): string | null => {
      if (!state) return null
      const result = subscribeToProduct(state, product, amount)
      persist(result.state)
      return result.vaultSlug
    },
    [state, persist],
  )

  const depositFn = useCallback(
    (vaultSlug: string, amount: number) => {
      if (!state) return
      persist(addDeposit(state, vaultSlug, amount))
    },
    [state, persist],
  )

  const withdrawFn = useCallback(
    (depositId: number) => {
      if (!state) return
      persist(removeDeposit(state, depositId))
    },
    [state, persist],
  )

  const claimFn = useCallback(
    (depositId: number) => {
      if (!state) return
      persist(claimYield(state, depositId))
    },
    [state, persist],
  )

  const skipTimeFn = useCallback(
    (seconds: number) => {
      if (!state) return
      persist(advanceTime(state, seconds))
    },
    [state, persist],
  )

  const resetFn = useCallback(() => {
    setDemoMode(false)
    persist(resetDemo())
  }, [persist])

  const getDepositsForVaultFn = useCallback(
    (slug: string) => (state ? state.deposits.filter((d) => d.vaultSlug === slug) : []),
    [state],
  )

  const getVaultBySlugFn = useCallback(
    (slug: string) => (state ? state.vaults.find((v) => v.slug === slug) : undefined),
    [state],
  )

  if (!state) return null

  const value: DemoContextValue = {
    state,
    vaults: state.vaults,
    deposits: state.deposits,
    now: demoNow(state),
    isDemoMode: demoMode,
    enterDemoMode,
    exitDemoMode,
    createVault: createVaultFn,
    deleteVault: deleteVaultFn,
    subscribe: subscribeFn,
    deposit: depositFn,
    withdraw: withdrawFn,
    claim: claimFn,
    skipTime: skipTimeFn,
    reset: resetFn,
    getDepositsForVault: getDepositsForVaultFn,
    getVaultBySlug: getVaultBySlugFn,
  }

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used within DemoProvider')
  return ctx
}
