'use client'

import { useDemo } from '@/context/demo-context'
import { isDemoModeActive } from '@/lib/demo-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAccount } from 'wagmi'

/**
 * Returns `true` when the user is either wallet-connected or in demo mode.
 * Checks both React state and sessionStorage to handle navigation timing.
 * Redirects to /login otherwise.
 */
export function useAuthGuard(): boolean {
  const { isConnected } = useAccount()
  const { isDemoMode } = useDemo()
  const router = useRouter()
  const authed = isConnected || isDemoMode || isDemoModeActive()

  useEffect(() => {
    if (!authed) router.replace('/login')
  }, [authed, router])

  return authed
}
