import { CONTRACT_ADDRESSES } from '@/config/contracts'
import TestEpochVault24hABI from '@/contracts/TestEpochVault24h.json'
import { formatUnits, keccak256, parseUnits, toHex } from 'viem'
import { useAccount, useContractRead, useDeployContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

// Contract ABI
const abi = TestEpochVault24hABI.abi

// Hook for reading vault information
export function useVaultInfo() {
  const { data: totalDeposits } = useContractRead({
    address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
    abi,
    functionName: 'totalDeposits',
  })

  const { data: currentEpoch } = useContractRead({
    address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
    abi,
    functionName: 'currentEpoch',
  })

  const { data: monthlyAPR } = useContractRead({
    address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
    abi,
    functionName: 'monthlyAPR',
  })

  const { data: annualAPR } = useContractRead({
    address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
    abi,
    functionName: 'getAnnualAPR',
  })

  const { data: whitelistEnabled } = useContractRead({
    address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
    abi,
    functionName: 'whitelistEnabled',
  })

  return {
    totalDeposits: totalDeposits ? formatUnits(totalDeposits as bigint, 6) : '0',
    currentEpoch: currentEpoch?.toString() || '0',
    monthlyAPR: monthlyAPR ? Number(monthlyAPR) / 100 : 0,
    annualAPR: annualAPR ? Number(annualAPR) / 100 : 0,
    whitelistEnabled: whitelistEnabled || false,
  }
}

// Hook for user information
export function useUserInfo() {
  const { address } = useAccount()

  const { data: userInfo } = useContractRead({
    address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
    abi,
    functionName: 'userInfo',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: pendingRewards } = useContractRead({
    address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
    abi,
    functionName: 'pendingRewards',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Note: canWithdraw and getWithdrawalLockInfo functions don't exist in the new ABI
  // We'll calculate withdrawal lock info client-side based on userInfo

  // Calculate withdrawal lock info based on first deposit time
  const withdrawalLockInfo = userInfo ? (() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstDepositTime = Number((userInfo as any)[4])
    const lockPeriod = 4 * 365 * 24 * 60 * 60 // 4 years in seconds
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
  })() : null

  const canWithdraw = withdrawalLockInfo?.canWithdrawNow || false

  return {
    userInfo: userInfo ? {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      depositAmount: formatUnits((userInfo as any)[0], 6),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lastClaimedEpoch: (userInfo as any)[1].toString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pendingRewards: formatUnits((userInfo as any)[2], 6),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lastDepositEpoch: (userInfo as any)[3].toString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      firstDepositTime: (userInfo as any)[4].toString(),
    } : null,
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
        address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
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
        address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
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
        address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
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
        address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
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
    args: address && CONTRACT_ADDRESSES.EPOCH_VAULT ? [address, CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`] : undefined,
    query: { enabled: !!address && !!CONTRACT_ADDRESSES.EPOCH_VAULT },
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
        args: [CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`, parseUnits(amount, 6)],
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
        address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
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

// Hook for epoch tracking and management
export function useEpochTracking() {
  const { data: currentEpoch } = useContractRead({
    address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
    abi,
    functionName: 'currentEpoch',
  })

  const { data: epochStartTime } = useContractRead({
    address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
    abi,
    functionName: 'epochStartTime',
  })

  const { data: shouldAdvanceEpoch } = useContractRead({
    address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
    abi,
    functionName: 'shouldAdvanceEpoch',
  })

  const { data: epochDuration } = useContractRead({
    address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
    abi,
    functionName: 'EPOCH_DURATION',
  })

  // Calculate time until next epoch
  const getTimeUntilNextEpoch = () => {
    if (!epochStartTime || !epochDuration) return null
    
    const now = Math.floor(Date.now() / 1000)
    const epochEndTime = Number(epochStartTime) + Number(epochDuration)
    const timeRemaining = epochEndTime - now
    
    return timeRemaining > 0 ? timeRemaining : 0
  }

  const timeUntilNextEpoch = getTimeUntilNextEpoch()

  // Format time remaining
  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return {
    currentEpoch: currentEpoch ? Number(currentEpoch) : 0,
    epochStartTime: epochStartTime ? Number(epochStartTime) : 0,
    shouldAdvanceEpoch: shouldAdvanceEpoch || false,
    epochDuration: epochDuration ? Number(epochDuration) : 0,
    timeUntilNextEpoch,
    formattedTimeRemaining: timeUntilNextEpoch ? formatTimeRemaining(timeUntilNextEpoch) : '0s',
    isEpochReady: shouldAdvanceEpoch || false,
  }
}

// Hook for advancing epoch
export function useAdvanceEpoch() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const advanceEpoch = async () => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
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
    console.log('🔍 ===== AUTHORIZED WITHDRAW DEBUG START =====')
    console.log('🔍 AuthorizedWithdraw called with amount:', amount)
    console.log('🔍 Contract address:', CONTRACT_ADDRESSES.EPOCH_VAULT)
    
    if (!amount || amount === '0') {
      console.log('❌ Amount is empty or zero, returning early')
      return
    }

    console.log('✅ Proceeding with admin withdrawal, amount:', amount)
    
    try {
      const parsedAmount = parseUnits(amount, 6)
      console.log('🔍 Parsed amount (6 decimals):', parsedAmount.toString())
      
      const contractCall = {
        address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
        abi,
        functionName: 'adminWithdraw',
        args: [parsedAmount],
      }
      
      // Calculate the actual method ID
      const functionSignature = 'adminWithdraw(uint256)'
      const hash = keccak256(toHex(functionSignature))
      const methodId = hash.slice(0, 10) // First 4 bytes (8 hex chars + 0x)
      
      console.log('📝 ===== CONTRACT CALL DETAILS =====')
      console.log('📝 Address:', contractCall.address)
      console.log('📝 Function Name:', contractCall.functionName)
      console.log('📝 Function Signature:', functionSignature)
      console.log('📝 Calculated Method ID:', methodId)
      console.log('📝 Expected Method ID: 0x7c5b4a37 (adminWithdraw(uint256))')
      console.log('📝 Method ID Match:', methodId === '0x7c5b4a37' ? '✅ YES' : '❌ NO')
      console.log('📝 Args:', contractCall.args)
      console.log('📝 ===== END CONTRACT CALL DETAILS =====')
      
      writeContract(contractCall)
      
      console.log('✅ writeContract called successfully')
      console.log('🔍 ===== AUTHORIZED WITHDRAW DEBUG END =====')
    } catch (err) {
      console.error('❌ Authorized withdrawal error:', err)
      console.log('🔍 ===== AUTHORIZED WITHDRAW DEBUG END (ERROR) =====')
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
        address: CONTRACT_ADDRESSES.EPOCH_VAULT as `0x${string}`,
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
    console.log('🚀 ===== DEPLOY VAULT START =====')
    console.log('🚀 Asset Address:', assetAddress)
    console.log('🚀 Owner Address:', ownerAddress)
    
    if (!assetAddress || !ownerAddress) {
      console.error('❌ Missing required addresses')
      return
    }

    try {
      // Import EpochVault dynamically for bytecode
      const EpochVaultABI = await import('@/contracts/EpochVault.json')
      
      deployContract({
        abi: EpochVaultABI.abi,
        bytecode: EpochVaultABI.bytecode as `0x${string}`,
        args: [assetAddress as `0x${string}`, ownerAddress as `0x${string}`],
      })
      console.log('✅ Deploy transaction submitted')
    } catch (err) {
      console.error('❌ Deploy vault error:', err)
    }
  }

  // Deploy with custom ABI and bytecode
  const deployCustomVault = async (abiJson: string, bytecode: string, args: string[]) => {
    console.log('🚀 ===== DEPLOY CUSTOM VAULT START =====')
    console.log('🚀 Args:', args)
    
    if (!abiJson || !bytecode) {
      console.error('❌ Missing ABI or bytecode')
      return
    }

    try {
      const parsedAbi = JSON.parse(abiJson)
      
      // Convert args to proper types based on constructor inputs
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
      console.log('✅ Custom deploy transaction submitted')
    } catch (err) {
      console.error('❌ Deploy custom vault error:', err)
    }
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
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
