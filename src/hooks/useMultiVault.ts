import { PRODUCTS } from '@/config/products'
import EpochVaultABI from '@/contracts/EpochVault.json'
import { useVaultReads } from '@/hooks/useVaultReads'
import { useMemo } from 'react'
import { parseUnits } from 'viem'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

const abi = EpochVaultABI.abi

export function useVaultsList() {
  const vaults = useMemo(
    () =>
      PRODUCTS.filter(
        (p) =>
          p.status === 'active' &&
          p.contractAddress &&
          p.contractAddress !== '0x0000000000000000000000000000000000000000',
      ).map((p) => ({
        address: p.contractAddress as `0x${string}`,
        name: p.name,
        slug: p.slug,
        token: p.token,
        icon: p.icon,
        color: p.color,
        apr: p.apr,
      })),
    [],
  )

  return { vaults }
}

export function useVaultInfoByAddress(vaultAddress: `0x${string}` | undefined) {
  const reads = useVaultReads(vaultAddress)

  const getTimeUntilNextEpoch = () => {
    if (!reads.epochStartTime || !reads.epochDuration) return null
    const now = Math.floor(Date.now() / 1000)
    const epochEndTime = reads.epochStartTime + reads.epochDuration
    const timeRemaining = epochEndTime - now
    return timeRemaining > 0 ? timeRemaining : 0
  }

  return {
    ...reads,
    timeUntilNextEpoch: getTimeUntilNextEpoch(),
  }
}

// Hook for vault actions with dynamic address
export function useVaultActions(vaultAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const distributeRewards = (amount: string) => {
    if (!vaultAddress || !amount || amount === '0') return
    writeContract({
      address: vaultAddress,
      abi,
      functionName: 'distributeRewards',
      args: [parseUnits(amount, 6)],
    })
  }

  const advanceEpoch = () => {
    if (!vaultAddress) return
    writeContract({
      address: vaultAddress,
      abi,
      functionName: 'advanceEpoch',
    })
  }

  const adminWithdraw = (amount: string) => {
    if (!vaultAddress || !amount || amount === '0') return
    writeContract({
      address: vaultAddress,
      abi,
      functionName: 'adminWithdraw',
      args: [parseUnits(amount, 6)],
    })
  }

  const adminDeposit = (amount: string) => {
    if (!vaultAddress || !amount || amount === '0') return
    writeContract({
      address: vaultAddress,
      abi,
      functionName: 'adminDeposit',
      args: [parseUnits(amount, 6)],
    })
  }

  return {
    distributeRewards,
    advanceEpoch,
    adminWithdraw,
    adminDeposit,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    reset,
  }
}

// Aggregate stats across all vaults
export function useAggregateStats() {
  const { vaults } = useVaultsList()

  // For now, we'll compute this on demand
  // In production, you'd want to batch these calls
  return {
    totalVaults: vaults.length,
    vaults,
  }
}
