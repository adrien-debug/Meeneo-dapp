'use client'

import { projectId } from '@/config/wagmi'
import { useAppKit } from '@reown/appkit/react'

/**
 * Wrapper around useAppKit that returns a no-op `open` when
 * WalletConnect Project ID is not configured (dev/demo mode).
 */
export function useAppKitSafe() {
  if (!projectId) {
    return {
      open: () => {
        console.warn('[AppKit] Cannot open — NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID not set')
      },
    }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useAppKit()
}
