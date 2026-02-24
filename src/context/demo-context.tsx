'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  type DemoState,
  loadDemo,
  saveDemo,
  resetDemo,
  addVault,
  removeVault,
  addDeposit,
  removeDeposit,
  claimYield,
  advanceTime,
  demoNow,
} from '@/lib/demo-store'
import type { VaultConfig, UserDeposit } from '@/types/product'

interface DemoContextValue {
  state: DemoState
  vaults: VaultConfig[]
  deposits: UserDeposit[]
  now: number
  createVault: (params: Parameters<typeof addVault>[1]) => void
  deleteVault: (slug: string) => void
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

  useEffect(() => {
    setState(loadDemo())
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
    createVault: createVaultFn,
    deleteVault: deleteVaultFn,
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
