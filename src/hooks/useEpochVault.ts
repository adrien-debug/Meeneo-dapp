import { CONTRACT_ADDRESSES } from '@/config/contracts'
import EpochVaultABI from '@/contracts/EpochVault.json'
import { useVaultReads } from '@/hooks/useVaultReads'
import { formatUnits, parseUnits } from 'viem'
import {
  useAccount,
  useContractRead,
  useDeployContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

const abi = EpochVaultABI.abi
const VAULT_ADDRESS = CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`

type UserInfoTuple = readonly [bigint, bigint, bigint, bigint, bigint]

export function useVaultInfo() {
  const reads = useVaultReads(VAULT_ADDRESS)
  return {
    totalDeposits: reads.totalDeposits,
    currentEpoch: reads.currentEpoch.toString(),
    monthlyAPR: reads.monthlyAPR,
    annualAPR: reads.annualAPR,
    whitelistEnabled: reads.whitelistEnabled,
  }
}

// Hook for user information
export function useUserInfo() {
  const { address } = useAccount()

  const { data: userInfo } = useContractRead({
    address: VAULT_ADDRESS,
    abi,
    functionName: 'userInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: pendingRewards } = useContractRead({
    address: VAULT_ADDRESS,
    abi,
    functionName: 'pendingRewards',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Note: canWithdraw and getWithdrawalLockInfo functions don't exist in the new ABI
  // We'll calculate withdrawal lock info client-side based on userInfo

  const info = userInfo as UserInfoTuple | undefined

  const withdrawalLockInfo = info
    ? (() => {
        const firstDepositTime = Number(info[4])
        const lockPeriod = 3 * 365 * 24 * 60 * 60
        const lockEndTime = firstDepositTime + lockPeriod
        const currentTime = Math.floor(Date.now() / 1000)
        const canWithdrawNow = currentTime >= lockEndTime
        const timeRemaining = Math.max(0, lockEndTime - currentTime)

        return {
          firstDepositTime: firstDepositTime.toString(),
          lockEndTime: lockEndTime.toString(),
          canWithdrawNow,
          timeRemaining: timeRemaining.toString(),
        }
      })()
    : null

  const canWithdraw = withdrawalLockInfo?.canWithdrawNow || false

  return {
    userInfo: info
      ? {
          depositAmount: formatUnits(info[0], 6),
          lastClaimedEpoch: info[1].toString(),
          pendingRewards: formatUnits(info[2], 6),
          lastDepositEpoch: info[3].toString(),
          firstDepositTime: info[4].toString(),
        }
      : null,
    pendingRewards: pendingRewards ? formatUnits(pendingRewards as bigint, 6) : '0',
    canWithdraw,
    withdrawalLockInfo,
  }
}

// Hook for deposit functionality
export function useDeposit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const deposit = async (amount: string) => {
    if (!amount || amount === '0') return

    try {
      writeContract({
        address: VAULT_ADDRESS,
        abi,
        functionName: 'deposit',
        args: [parseUnits(amount, 6)],
      })
    } catch (err) {
      console.error('Deposit error:', err)
    }
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// Hook for withdrawal functionality
export function useWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const withdraw = async (amount: string = '0') => {
    try {
      writeContract({
        address: VAULT_ADDRESS,
        abi,
        functionName: 'withdraw',
        args: [parseUnits(amount, 6)],
      })
    } catch (err) {
      console.error('Withdraw error:', err)
    }
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// Hook for claiming rewards
export function useClaimRewards() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const claimRewards = async () => {
    try {
      writeContract({
        address: VAULT_ADDRESS,
        abi,
        functionName: 'claimRewards',
      })
    } catch (err) {
      console.error('Claim rewards error:', err)
    }
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    claimRewards,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// Hook for redepositing rewards
export function useRedepositRewards() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const redepositRewards = async () => {
    try {
      writeContract({
        address: VAULT_ADDRESS,
        abi,
        functionName: 'redeposit',
      })
    } catch (err) {
      console.error('Redeposit rewards error:', err)
    }
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    redepositRewards,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// Hook for USDC allowance and approval
export function useUSDCAllowance() {
  const { address } = useAccount()

  const { data: allowance } = useContractRead({
    address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
    abi: [
      {
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'allowance',
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address },
  })

  return {
    allowance: allowance ? formatUnits(allowance as bigint, 6) : '0',
  }
}

// Hook for USDC approval
export function useUSDCApproval() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const approve = async (amount: string) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
            name: 'approve',
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'approve',
        args: [VAULT_ADDRESS, parseUnits(amount, 6)],
      })
    } catch (err) {
      console.error('Approval error:', err)
    }
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// Hook for reward distribution (Reward Depositor)
export function useDistributeRewards() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const distributeRewards = async (amount: string) => {
    try {
      writeContract({
        address: VAULT_ADDRESS,
        abi,
        functionName: 'distributeRewards',
        args: [parseUnits(amount, 6)],
      })
    } catch (err) {
      console.error('Distribute rewards error:', err)
    }
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    distributeRewards,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

export function useEpochTracking() {
  const reads = useVaultReads(VAULT_ADDRESS)

  const getTimeUntilNextEpoch = () => {
    if (!reads.epochStartTime || !reads.epochDuration) return null
    const now = Math.floor(Date.now() / 1000)
    const epochEndTime = reads.epochStartTime + reads.epochDuration
    const timeRemaining = epochEndTime - now
    return timeRemaining > 0 ? timeRemaining : 0
  }

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const timeUntilNextEpoch = getTimeUntilNextEpoch()

  return {
    currentEpoch: reads.currentEpoch,
    epochStartTime: reads.epochStartTime,
    shouldAdvanceEpoch: reads.shouldAdvanceEpoch,
    epochDuration: reads.epochDuration,
    timeUntilNextEpoch,
    formattedTimeRemaining: timeUntilNextEpoch ? formatTimeRemaining(timeUntilNextEpoch) : '0s',
    isEpochReady: reads.shouldAdvanceEpoch,
  }
}

// Hook for advancing epoch
export function useAdvanceEpoch() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const advanceEpoch = async () => {
    try {
      writeContract({
        address: VAULT_ADDRESS,
        abi,
        functionName: 'advanceEpoch',
      })
    } catch (err) {
      console.error('Advance epoch error:', err)
    }
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    advanceEpoch,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// Hook for authorized withdrawal (Authorized Withdrawal)
export function useAuthorizedWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const authorizedWithdraw = async (amount: string) => {
    if (!amount || amount === '0') return

    try {
      writeContract({
        address: VAULT_ADDRESS,
        abi,
        functionName: 'adminWithdraw',
        args: [parseUnits(amount, 6)],
      })
    } catch (err) {
      console.error('Authorized withdrawal error:', err)
    }
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    authorizedWithdraw,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// Hook for admin deposits (Admin Depositor)
export function useAdminDeposit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const adminDeposit = async (amount: string) => {
    try {
      writeContract({
        address: VAULT_ADDRESS,
        abi,
        functionName: 'adminDeposit',
        args: [parseUnits(amount, 6)],
      })
    } catch (err) {
      console.error('Admin deposit error:', err)
    }
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    adminDeposit,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// Hook for deploying a new vault
export function useDeployVault() {
  const { deployContract, data: hash, isPending, error } = useDeployContract()

  const deployVault = async (assetAddress: string, ownerAddress: string) => {
    if (!assetAddress || !ownerAddress) {
      console.error('Deploy vault: missing required addresses')
      return
    }

    try {
      const EpochVaultABI = await import('@/contracts/EpochVault.json')

      deployContract({
        abi: EpochVaultABI.abi,
        bytecode: EpochVaultABI.bytecode as `0x${string}`,
        args: [assetAddress as `0x${string}`, ownerAddress as `0x${string}`],
      })
    } catch (err) {
      console.error('Deploy vault error:', err)
    }
  }

  // Deploy with custom ABI and bytecode
  const deployCustomVault = async (abiJson: string, bytecode: string, args: string[]) => {
    if (!abiJson || !bytecode) {
      console.error('Deploy custom vault: missing ABI or bytecode')
      return
    }

    try {
      const parsedAbi = JSON.parse(abiJson)

      const constructor = parsedAbi.find((item: { type: string }) => item.type === 'constructor')
      const typedArgs = args.map((arg, index) => {
        const inputType = constructor?.inputs?.[index]?.type || 'string'

        if (inputType === 'address') {
          return arg as `0x${string}`
        } else if (inputType.startsWith('uint') || inputType.startsWith('int')) {
          return BigInt(arg)
        } else if (inputType === 'bool') {
          return arg === 'true'
        }
        return arg
      })

      deployContract({
        abi: parsedAbi,
        bytecode: bytecode as `0x${string}`,
        args: typedArgs,
      })
    } catch (err) {
      console.error('Deploy custom vault error:', err)
    }
  }

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  })

  // Extract deployed contract address from receipt
  const deployedAddress = receipt?.contractAddress || null

  return {
    deployVault,
    deployCustomVault,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    deployedAddress,
    error,
  }
}
