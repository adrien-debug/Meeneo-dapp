'use client'

import { projectId } from '@/config/wagmi'
import { useAppKit } from '@reown/appkit/react'

const noopOpen = () => {
  console.warn('[AppKit] Cannot open — NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID not set')
}

const NOOP = { open: noopOpen } as ReturnType<typeof useAppKit>

/**
 * Safe wrapper around useAppKit.
 *
 * When projectId is absent createAppKit was never called, so the
 * real hook would throw. The branch condition is a module-level
 * constant — the same branch always executes for the lifetime of
 * the app, so Rules of Hooks are satisfied at the call-site level.
 */
export function useAppKitSafe() {
  if (!projectId) return NOOP

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useAppKit()
}
