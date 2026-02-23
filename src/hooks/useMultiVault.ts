import { PRODUCTS } from '@/config/products'
import TestEpochVault24hABI from '@/contracts/TestEpochVault24h.json'
import { formatUnits, parseUnits } from 'viem'
import { useContractRead, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useMemo } from 'react'

const abi = TestEpochVault24hABI.abi

// Get all active vaults from products
export function useVaultsList() {
  const vaults = useMemo(() => 
    PRODUCTS.filter(p => 
      p.status === 'active' && 
      p.contractAddress && 
      p.contractAddress !== '0x0000000000000000000000000000000000000000'
    ).map(p => ({
      address: p.contractAddress as `0x${string}`,
      name: p.name,
      slug: p.slug,
      token: p.token,
      icon: p.icon,
      color: p.color,
      apr: p.apr,
    }))
  , [])

  return { vaults }
}

// Hook for reading a specific vault's info
export function useVaultInfoByAddress(vaultAddress: `0x${string}` | undefined) {
  const { data: totalDeposits, refetch: refetchDeposits } = useContractRead({
    address: vaultAddress,
    abi,
    functionName: 'totalDeposits',
    query: { enabled: !!vaultAddress },
  })

  const { data: currentEpoch, refetch: refetchEpoch } = useContractRead({
    address: vaultAddress,
    abi,
    functionName: 'currentEpoch',
    query: { enabled: !!vaultAddress },
  })

  const { data: monthlyAPR } = useContractRead({
    address: vaultAddress,
    abi,
    functionName: 'monthlyAPR',
    query: { enabled: !!vaultAddress },
  })

  const { data: annualAPR } = useContractRead({
    address: vaultAddress,
    abi,
    functionName: 'getAnnualAPR',
    query: { enabled: !!vaultAddress },
  })

  const { data: whitelistEnabled } = useContractRead({
    address: vaultAddress,
    abi,
    functionName: 'whitelistEnabled',
    query: { enabled: !!vaultAddress },
  })

  const { data: epochStartTime } = useContractRead({
    address: vaultAddress,
    abi,
    functionName: 'epochStartTime',
    query: { enabled: !!vaultAddress },
  })

  const { data: shouldAdvanceEpoch, refetch: refetchShouldAdvance } = useContractRead({
    address: vaultAddress,
    abi,
    functionName: 'shouldAdvanceEpoch',
    query: { enabled: !!vaultAddress },
  })

  const { data: epochDuration } = useContractRead({
    address: vaultAddress,
    abi,
    functionName: 'EPOCH_DURATION',
    query: { enabled: !!vaultAddress },
  })

  // Calculate time until next epoch
  const getTimeUntilNextEpoch = () => {
    if (!epochStartTime || !epochDuration) return null
    const now = Math.floor(Date.now() / 1000)
    const epochEndTime = Number(epochStartTime) + Number(epochDuration)
    const timeRemaining = epochEndTime - now
    return timeRemaining > 0 ? timeRemaining : 0
  }

  const refetchAll = () => {
    refetchDeposits()
    refetchEpoch()
    refetchShouldAdvance()
  }

  return {
    totalDeposits: totalDeposits ? formatUnits(totalDeposits as bigint, 6) : '0',
    currentEpoch: currentEpoch ? Number(currentEpoch) : 0,
    monthlyAPR: monthlyAPR ? Number(monthlyAPR) / 100 : 0,
    annualAPR: annualAPR ? Number(annualAPR) / 100 : 0,
    whitelistEnabled: whitelistEnabled || false,
    epochStartTime: epochStartTime ? Number(epochStartTime) : 0,
    shouldAdvanceEpoch: shouldAdvanceEpoch || false,
    epochDuration: epochDuration ? Number(epochDuration) : 0,
    timeUntilNextEpoch: getTimeUntilNextEpoch(),
    refetchAll,
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
