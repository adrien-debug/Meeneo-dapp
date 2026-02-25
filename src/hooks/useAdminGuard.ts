'use client'

import { HARDCODED_ADDRESSES } from '@/config/contracts'
import { useDemo } from '@/context/demo-context'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'

const ADMIN_ADDRESSES: readonly string[] = [
  HARDCODED_ADDRESSES.REWARD_DEPOSITOR.toLowerCase(),
  HARDCODED_ADDRESSES.AUTHORIZED_WITHDRAWAL.toLowerCase(),
  HARDCODED_ADDRESSES.ADMIN_DEPOSITOR.toLowerCase(),
]

/**
 * Returns `true` when the wallet is an authorized admin or in demo mode.
 * Redirects non-admin to /dashboard.
 */
export function useAdminGuard(): boolean {
  const { address, isConnected } = useAccount()
  const { isDemoMode } = useDemo()
  const router = useRouter()

  const isAdmin = useMemo(() => {
    if (isDemoMode) return true
    if (!isConnected || !address) return false
    return ADMIN_ADDRESSES.includes(address.toLowerCase())
  }, [address, isConnected, isDemoMode])

  useEffect(() => {
    if (!isAdmin && !isDemoMode) {
      router.replace('/dashboard')
    }
  }, [isAdmin, isDemoMode, router])

  return isAdmin
}
