import EpochVaultABI from '@/contracts/EpochVault.json'
import { formatUnits } from 'viem'
import { useContractRead } from 'wagmi'

const abi = EpochVaultABI.abi

/**
 * Shared vault reads — used by both useEpochVault (fixed address) and
 * useMultiVault (dynamic address) to avoid duplication.
 */
export function useVaultReads(vaultAddress: `0x${string}` | undefined) {
  const enabled = !!vaultAddress

  const { data: totalDeposits, refetch: refetchDeposits } = useContractRead({
    address: vaultAddress,
    abi,
    functionName: 'totalDeposits',
    query: { enabled },
  })

  const { data: currentEpoch, refetch: refetchEpoch } = useContractRead({
    address: vaultAddress,
    abi,
    functionName: 'currentEpoch',
    query: { enabled },
  })

  const { data: monthlyAPR } = useContractRead({
    address: vaultAddress,
    abi,
    functionName: 'monthlyAPR',
    query: { enabled },
  })

  const { data: annualAPR } = useContractRead({
    address: vaultAddress,
    abi,
    functionName: 'getAnnualAPR',
    query: { enabled },
  })

  const { data: whitelistEnabled } = useContractRead({
    address: vaultAddress,
    abi,
    functionName: 'whitelistEnabled',
    query: { enabled },
  })

  const { data: epochStartTime } = useContractRead({
    address: vaultAddress,
    abi,
    functionName: 'epochStartTime',
    query: { enabled },
  })

  const { data: shouldAdvanceEpoch, refetch: refetchShouldAdvance } = useContractRead({
    address: vaultAddress,
    abi,
    functionName: 'shouldAdvanceEpoch',
    query: { enabled },
  })

  const { data: epochDuration } = useContractRead({
    address: vaultAddress,
    abi,
    functionName: 'EPOCH_DURATION',
    query: { enabled },
  })

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
    refetchAll,
  }
}
