'use client'

import { CONTRACT_ADDRESSES, HARDCODED_ADDRESSES } from '@/config/contracts'
import { PRODUCTS } from '@/config/products'
import { useDeployVault } from '@/hooks/useEpochVault'
import { useVaultActions, useVaultInfoByAddress } from '@/hooks/useMultiVault'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

interface VaultManagementProps {
  vaultSlug: string
}

export function VaultManagement({ vaultSlug }: VaultManagementProps) {
  const { address } = useAccount()

  // Find vault from products
  const vault = PRODUCTS.find((p) => p.slug === vaultSlug)
  const vaultAddress = vault?.contractAddress as `0x${string}` | undefined

  // Vault info
  const vaultInfo = useVaultInfoByAddress(vaultAddress)

  // Vault actions
  const actions = useVaultActions(vaultAddress)

  // Form states
  const [rewardAmount, setRewardAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [adminDepositAmount, setAdminDepositAmount] = useState('')

  // Timer for epoch countdown
  const [timeLeft, setTimeLeft] = useState(vaultInfo.timeUntilNextEpoch || 0)

  useEffect(() => {
    if (vaultInfo.timeUntilNextEpoch && vaultInfo.timeUntilNextEpoch > 0) {
      setTimeLeft(vaultInfo.timeUntilNextEpoch)

      const timer = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [vaultInfo.timeUntilNextEpoch])

  // Reset form after success
  useEffect(() => {
    if (actions.isConfirmed) {
      setRewardAmount('')
      setWithdrawAmount('')
      setAdminDepositAmount('')
      vaultInfo.refetchAll()
      // Reset action state after delay
      const timeout = setTimeout(() => {
        actions.reset()
      }, 3000)
      return () => clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions.isConfirmed])

  // Check admin roles
  const isRewardDepositor =
    address?.toLowerCase() === HARDCODED_ADDRESSES.REWARD_DEPOSITOR.toLowerCase()
  const isAuthorizedWithdrawal =
    address?.toLowerCase() === HARDCODED_ADDRESSES.AUTHORIZED_WITHDRAWAL.toLowerCase()
  const isAdminDepositor =
    address?.toLowerCase() === HARDCODED_ADDRESSES.ADMIN_DEPOSITOR.toLowerCase()

  if (!vault) {
    return (
      <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl p-12 text-center">
        <p className="text-[#9EB3A8]">Vault non trouvé</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: `${vault.color}20`, color: vault.color }}
          >
            {vault.icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#0E0F0F]">{vault.name}</h2>
            <p className="text-[#9EB3A8]">{vault.description}</p>
          </div>
        </div>

        {/* Contract Info */}
        <div className="bg-[#F2F2F2] rounded-xl p-4">
          <p className="text-xs text-[#9EB3A8] mb-1">Adresse du contrat</p>
          <p className="font-mono text-sm text-[#0E0F0F] break-all">{vaultAddress}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#9EB3A8]/20 rounded-xl p-4">
          <p className="text-xs text-[#9EB3A8] mb-1">TVL</p>
          <p className="text-2xl font-bold text-[#0E0F0F]">
            ${parseFloat(vaultInfo.totalDeposits).toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-[#9EB3A8]/20 rounded-xl p-4">
          <p className="text-xs text-[#9EB3A8] mb-1">APR Annuel</p>
          <p className="text-2xl font-bold text-[#0E0F0F]">{vaultInfo.annualAPR || vault.apr}%</p>
        </div>
        <div className="bg-white border border-[#9EB3A8]/20 rounded-xl p-4">
          <p className="text-xs text-[#9EB3A8] mb-1">Epoch Actuel</p>
          <p className="text-2xl font-bold text-[#0E0F0F]">#{vaultInfo.currentEpoch}</p>
        </div>
        <div className="bg-white border border-[#9EB3A8]/20 rounded-xl p-4">
          <p className="text-xs text-[#9EB3A8] mb-1">Temps restant</p>
          <p
            className={`text-2xl font-bold ${timeLeft <= 3600 ? 'text-[#0E0F0F]' : 'text-[#0E0F0F]'}`}
          >
            {timeLeft > 0
              ? `${Math.floor(timeLeft / 3600)}h ${Math.floor((timeLeft % 3600) / 60)}m`
              : '0'}
          </p>
        </div>
      </div>

      {/* Epoch Section */}
      {vaultInfo.shouldAdvanceEpoch && (
        <div className="bg-[#E6F1E7] border border-[#9EB3A8]/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9EB3A8] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#9EB3A8]"></span>
              </span>
              <div>
                <p className="font-semibold text-[#0E0F0F]">Epoch prêt à avancer</p>
                <p className="text-sm text-[#9EB3A8]">
                  L&apos;epoch actuel est terminé et peut être avancé
                </p>
              </div>
            </div>
            <button
              onClick={actions.advanceEpoch}
              disabled={actions.isPending || actions.isConfirming}
              className="px-6 py-3 bg-gradient-to-r from-[#96EA7A] to-[#7ED066] text-[#0E0F0F] font-medium rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {actions.isPending ? 'En cours...' : 'Avancer l&apos;epoch'}
            </button>
          </div>
        </div>
      )}

      {/* Admin Actions Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Distribute Rewards */}
        <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#96EA7A]/20 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#0E0F0F]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0E0F0F]">Distribuer les Rewards</h3>
              {isRewardDepositor && (
                <span className="text-xs px-2 py-0.5 bg-[#96EA7A]/20 text-[#0E0F0F] rounded-full">
                  Autorisé
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0E0F0F] mb-2">
                Montant (USDC)
              </label>
              <input
                type="number"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-[#F2F2F2] border border-[#9EB3A8]/20 rounded-xl text-[#0E0F0F] placeholder-[#9EB3A8] focus:outline-none focus:ring-2 focus:ring-[#96EA7A]/30 focus:border-[#96EA7A] transition-all"
              />
            </div>
            <button
              onClick={() => actions.distributeRewards(rewardAmount)}
              disabled={!rewardAmount || actions.isPending || parseFloat(rewardAmount) <= 0}
              className="w-full py-3 bg-[#96EA7A] text-[#0E0F0F] font-semibold rounded-xl hover:bg-[#7ED066] disabled:opacity-50 transition-all"
            >
              {actions.isPending ? 'Distribution...' : 'Distribuer'}
            </button>
          </div>
        </div>

        {/* Admin Withdrawal */}
        <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#E6F1E7] rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#9EB3A8]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0E0F0F]">Retrait Admin</h3>
              {isAuthorizedWithdrawal && (
                <span className="text-xs px-2 py-0.5 bg-[#E6F1E7] text-[#9EB3A8] rounded-full">
                  Autorisé
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0E0F0F] mb-2">
                Montant (USDC)
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-[#F2F2F2] border border-[#9EB3A8]/20 rounded-xl text-[#0E0F0F] placeholder-[#9EB3A8] focus:outline-none focus:ring-2 focus:ring-[#96EA7A]/30 focus:border-[#96EA7A] transition-all"
              />
            </div>
            <button
              onClick={() => actions.adminWithdraw(withdrawAmount)}
              disabled={!withdrawAmount || actions.isPending || parseFloat(withdrawAmount) <= 0}
              className="w-full py-3 bg-[#F2F2F2] text-[#0E0F0F] font-semibold rounded-xl hover:bg-[#E6F1E7] disabled:opacity-50 transition-all"
            >
              {actions.isPending ? 'Retrait...' : 'Retirer'}
            </button>
          </div>
        </div>

        {/* Admin Deposit */}
        <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#E6F1E7] rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#9EB3A8]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0E0F0F]">Dépôt Admin</h3>
              {isAdminDepositor && (
                <span className="text-xs px-2 py-0.5 bg-[#E6F1E7] text-[#9EB3A8] rounded-full">
                  Autorisé
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0E0F0F] mb-2">
                Montant (USDC)
              </label>
              <input
                type="number"
                value={adminDepositAmount}
                onChange={(e) => setAdminDepositAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-[#F2F2F2] border border-[#9EB3A8]/20 rounded-xl text-[#0E0F0F] placeholder-[#9EB3A8] focus:outline-none focus:ring-2 focus:ring-[#96EA7A]/30 focus:border-[#96EA7A] transition-all"
              />
            </div>
            <button
              onClick={() => actions.adminDeposit(adminDepositAmount)}
              disabled={
                !adminDepositAmount || actions.isPending || parseFloat(adminDepositAmount) <= 0
              }
              className="w-full py-3 bg-[#9EB3A8] text-[#0E0F0F] font-semibold rounded-xl hover:bg-[#7ED066] disabled:opacity-50 transition-all"
            >
              {actions.isPending ? 'Dépôt...' : 'Déposer'}
            </button>
          </div>
        </div>

        {/* Contract Info */}
        <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#F2F2F2] rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#9EB3A8]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#0E0F0F]">Informations</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-[#9EB3A8] mb-1">Durée d&apos;epoch</p>
              <p className="font-medium text-[#0E0F0F]">
                {vaultInfo.epochDuration
                  ? `${Math.floor(vaultInfo.epochDuration / 86400)} jours`
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-[#9EB3A8] mb-1">Whitelist</p>
              <p className="font-medium text-[#0E0F0F]">
                {vaultInfo.whitelistEnabled ? 'Activée' : 'Désactivée'}
              </p>
            </div>
            <div>
              <p className="text-[#9EB3A8] mb-1">APR Mensuel</p>
              <p className="font-medium text-[#0E0F0F]">{vaultInfo.monthlyAPR}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {actions.isConfirmed && (
        <div className="bg-[#96EA7A]/10 border border-[#96EA7A]/30 rounded-xl p-4 flex items-center gap-3">
          <svg
            className="w-5 h-5 text-[#0E0F0F]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-[#0E0F0F] font-medium">Transaction confirmée !</span>
        </div>
      )}

      {actions.error && (
        <div className="bg-[#F2F2F2] border border-[#9EB3A8]/20 rounded-xl p-4 flex items-center gap-3">
          <svg
            className="w-5 h-5 text-[#0E0F0F]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span className="text-[#0E0F0F] font-medium">Erreur: {actions.error.message}</span>
        </div>
      )}
    </div>
  )
}

// Interface for constructor parameters from ABI
interface ConstructorParam {
  name: string
  type: string
  value: string
}

// Component for creating a new vault
export function CreateVault() {
  const { address } = useAccount()
  const [vaultName, setVaultName] = useState('')
  const [useCustomABI, setUseCustomABI] = useState(false)
  const [customABI, setCustomABI] = useState('')
  const [customBytecode, setCustomBytecode] = useState('')
  const [constructorParams, setConstructorParams] = useState<ConstructorParam[]>([
    { name: '_asset', type: 'address', value: CONTRACT_ADDRESSES.USDC || '' },
    { name: '_owner', type: 'address', value: '' },
  ])
  const [abiError, setAbiError] = useState<string | null>(null)

  const {
    deployVault,
    deployCustomVault,
    isPending: isDeploying,
    isConfirming: isDeployConfirming,
    isConfirmed: isDeployConfirmed,
    deployedAddress,
    error: deployError,
  } = useDeployVault()

  // Set default owner address when wallet connects
  useEffect(() => {
    if (address && constructorParams[1]?.value === '') {
      setConstructorParams((prev) => prev.map((p, i) => (i === 1 ? { ...p, value: address } : p)))
    }
  }, [address, constructorParams])

  // Parse custom ABI to extract constructor parameters
  const parseCustomABI = (abiJson: string) => {
    try {
      setAbiError(null)
      const parsed = JSON.parse(abiJson)
      const abi = Array.isArray(parsed) ? parsed : parsed.abi
      const bytecode = parsed.bytecode || ''

      if (!abi || !Array.isArray(abi)) {
        setAbiError('ABI invalide: doit être un tableau ou un objet avec une propriété "abi"')
        return
      }

      const constructor = abi.find((item: { type: string }) => item.type === 'constructor')

      if (!constructor) {
        setAbiError("Aucun constructeur trouvé dans l'ABI")
        return
      }

      const params =
        constructor.inputs?.map((input: { name: string; type: string }) => ({
          name: input.name,
          type: input.type,
          value: '',
        })) || []

      setConstructorParams(params)
      setCustomABI(JSON.stringify(abi))
      if (bytecode) {
        setCustomBytecode(bytecode)
      }
    } catch {
      setAbiError("Erreur de parsing JSON: vérifiez le format de l'ABI")
    }
  }

  // Handle file upload for ABI
  const handleABIFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      parseCustomABI(content)
    }
    reader.readAsText(file)
  }

  // Update constructor param value
  const updateParamValue = (index: number, value: string) => {
    setConstructorParams((prev) => prev.map((p, i) => (i === index ? { ...p, value } : p)))
  }

  // Deploy with standard EpochVault
  const handleStandardDeploy = () => {
    const assetAddress = constructorParams.find((p) => p.name === '_asset')?.value || ''
    const ownerAddress = constructorParams.find((p) => p.name === '_owner')?.value || ''
    deployVault(assetAddress, ownerAddress)
  }

  // Deploy with custom ABI
  const handleCustomDeploy = () => {
    if (!customABI || !customBytecode) {
      setAbiError('ABI et Bytecode requis pour le déploiement custom')
      return
    }
    const args = constructorParams.map((p) => p.value)
    deployCustomVault(customABI, customBytecode, args)
  }

  const handleDeploy = useCustomABI ? handleCustomDeploy : handleStandardDeploy
  const isFormValid = useCustomABI
    ? customABI && customBytecode && constructorParams.every((p) => p.value)
    : constructorParams.every((p) => p.value)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#96EA7A] to-[#7ED066] rounded-2xl flex items-center justify-center">
              <svg
                className="w-7 h-7 text-[#0E0F0F]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0E0F0F]">Create Vault</h2>
              <p className="text-[#9EB3A8]">Déployez un nouveau smart contract EpochVault</p>
            </div>
          </div>

          {/* Toggle Custom ABI */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#9EB3A8]">ABI Custom</span>
            <button
              onClick={() => {
                setUseCustomABI(!useCustomABI)
                if (!useCustomABI) {
                  setConstructorParams([])
                  setCustomABI('')
                  setCustomBytecode('')
                } else {
                  setConstructorParams([
                    { name: '_asset', type: 'address', value: CONTRACT_ADDRESSES.USDC || '' },
                    { name: '_owner', type: 'address', value: address || '' },
                  ])
                }
              }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                useCustomABI ? 'bg-[#96EA7A]' : 'bg-[#9EB3A8]'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  useCustomABI ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ABI Parameters Section */}
      <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#E6F1E7] rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-[#9EB3A8]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#0E0F0F]">Constructor Parameters (ABI)</h3>
            <p className="text-sm text-[#9EB3A8]">
              Paramètres requis par le constructeur du smart contract
            </p>
          </div>
        </div>

        {/* Custom ABI Upload */}
        {useCustomABI && (
          <div className="space-y-4 mb-6 p-4 bg-[#F2F2F2] rounded-xl border border-[#9EB3A8]/20">
            <div>
              <label className="block text-sm font-medium text-[#0E0F0F] mb-2">
                Charger ABI/Artifact (JSON)
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleABIFileUpload}
                className="w-full px-4 py-2 bg-white border border-[#9EB3A8]/20 rounded-xl text-[#0E0F0F] text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#E6F1E7] file:text-[#0E0F0F] file:font-medium hover:file:bg-[#96EA7A]/20"
              />
              <p className="text-xs text-[#9EB3A8] mt-1">
                Uploadez le fichier JSON contenant l&apos;ABI et le bytecode
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0E0F0F] mb-2">
                Ou coller l&apos;ABI manuellement
              </label>
              <textarea
                value={customABI ? '✓ ABI chargé' : ''}
                onChange={(e) => {
                  if (e.target.value !== '✓ ABI chargé') {
                    parseCustomABI(e.target.value)
                  }
                }}
                placeholder='{"abi": [...], "bytecode": "0x..."}'
                rows={3}
                className="w-full px-4 py-3 bg-white border border-[#9EB3A8]/20 rounded-xl text-[#0E0F0F] placeholder-[#9EB3A8] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#96EA7A]/30 focus:border-[#96EA7A] transition-all resize-none"
              />
            </div>

            {!customBytecode && customABI && (
              <div>
                <label className="block text-sm font-medium text-[#0E0F0F] mb-2">
                  Bytecode (requis)
                </label>
                <input
                  type="text"
                  value={customBytecode}
                  onChange={(e) => setCustomBytecode(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-white border border-[#9EB3A8]/20 rounded-xl text-[#0E0F0F] placeholder-[#9EB3A8] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#96EA7A]/30 focus:border-[#96EA7A] transition-all"
                />
              </div>
            )}

            {abiError && (
              <div className="bg-[#F2F2F2] border border-[#9EB3A8]/20 rounded-lg p-3">
                <p className="text-sm text-[#0E0F0F] flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  {abiError}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Constructor Parameters */}
        <div className="grid md:grid-cols-2 gap-4">
          {constructorParams.map((param, index) => (
            <div key={index} className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[#0E0F0F]">
                  <span className="text-[#96EA7A] font-mono">{param.name}</span>
                  <span className="text-[#9EB3A8] font-normal ml-2">({param.type})</span>
                </label>
                {useCustomABI && (
                  <button
                    onClick={() =>
                      setConstructorParams((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="text-[#9EB3A8] hover:text-[#0E0F0F] p-1 rounded transition-colors"
                    title="Supprimer ce paramètre"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={param.value}
                onChange={(e) => updateParamValue(index, e.target.value)}
                placeholder={param.type === 'address' ? '0x...' : `Valeur ${param.type}`}
                className="w-full px-4 py-3 bg-[#F2F2F2] border border-[#9EB3A8]/20 rounded-xl text-[#0E0F0F] placeholder-[#9EB3A8] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#96EA7A]/30 focus:border-[#96EA7A] transition-all"
              />
              {param.name === '_asset' && !useCustomABI && (
                <p className="text-xs text-[#9EB3A8] mt-1">
                  Token ERC20 pour les dépôts (ex: USDC)
                </p>
              )}
              {param.name === '_owner' && !useCustomABI && (
                <p className="text-xs text-[#9EB3A8] mt-1">Adresse admin du vault</p>
              )}
            </div>
          ))}
        </div>

        {constructorParams.length === 0 && useCustomABI && (
          <div className="text-center py-8 text-[#9EB3A8]">
            <svg
              className="w-12 h-12 mx-auto mb-3 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>Chargez un fichier ABI ou ajoutez des paramètres manuellement</p>
          </div>
        )}

        {/* Add Parameter Manually (Custom ABI mode) */}
        {useCustomABI && (
          <div className="mt-4 pt-4 border-t border-[#9EB3A8]/20">
            <button
              onClick={() => {
                const name = prompt('Nom du paramètre (ex: _token):')
                const type = prompt('Type Solidity (ex: address, uint256, bool):')
                if (name && type) {
                  setConstructorParams((prev) => [...prev, { name, type, value: '' }])
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[#0E0F0F] bg-[#E6F1E7] hover:bg-[#E6F1E7] rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Ajouter un paramètre manuellement
            </button>

            {constructorParams.length > 0 && (
              <button
                onClick={() => setConstructorParams([])}
                className="ml-3 flex items-center gap-2 px-4 py-2 text-sm text-[#0E0F0F] bg-[#F2F2F2] hover:bg-[#E6F1E7] rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      {/* Form & Info */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left - Deploy Button & Name */}
        <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0E0F0F] mb-2">
              Nom du Vault
              <span className="text-[#9EB3A8] font-normal ml-1">(référence interne)</span>
            </label>
            <input
              type="text"
              value={vaultName}
              onChange={(e) => setVaultName(e.target.value)}
              placeholder="ex: BTC Mining Vault Q1 2026"
              className="w-full px-4 py-3 bg-[#F2F2F2] border border-[#9EB3A8]/20 rounded-xl text-[#0E0F0F] placeholder-[#9EB3A8] focus:outline-none focus:ring-2 focus:ring-[#96EA7A]/30 focus:border-[#96EA7A] transition-all"
            />
          </div>

          <button
            onClick={handleDeploy}
            disabled={!isFormValid || isDeploying || isDeployConfirming}
            className="w-full py-4 bg-gradient-to-r from-[#96EA7A] to-[#7ED066] text-[#0E0F0F] font-semibold rounded-xl hover:shadow-lg hover:shadow-[#96EA7A]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isDeploying || isDeployConfirming ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                {isDeploying ? 'Déploiement en cours...' : 'Confirmation...'}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Déployer le Vault
              </>
            )}
          </button>

          {/* Deploy Status */}
          {deployError && (
            <div className="bg-[#F2F2F2] border border-[#9EB3A8]/20 rounded-xl p-4">
              <p className="text-sm text-[#0E0F0F] flex items-center gap-2">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="break-all">Erreur: {deployError.message}</span>
              </p>
            </div>
          )}

          {isDeployConfirmed && deployedAddress && (
            <div className="bg-[#E6F1E7] border border-[#9EB3A8]/20 rounded-xl p-4">
              <h4 className="text-sm font-medium text-[#0E0F0F] mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Vault déployé avec succès !
              </h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-[#9EB3A8]">Adresse du contrat:</p>
                  <p className="font-mono text-xs text-[#0E0F0F] break-all bg-white rounded px-2 py-1 mt-1">
                    {deployedAddress}
                  </p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(deployedAddress)}
                  className="text-xs text-[#96EA7A] hover:underline flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  Copier l&apos;adresse
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right - Info */}
        <div className="space-y-4">
          <div className="bg-[#F2F2F2] border border-[#9EB3A8]/20 rounded-xl p-4">
            <h4 className="text-sm font-medium text-[#0E0F0F] mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-[#9EB3A8]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Configuration EpochVault
            </h4>
            <ul className="space-y-2 text-sm text-[#9EB3A8]">
              <li className="flex items-start gap-2">
                <span className="text-[#96EA7A] mt-0.5">•</span>
                <span>
                  Durée d&apos;epoch: <span className="font-mono text-[#0E0F0F]">30 jours</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#96EA7A] mt-0.5">•</span>
                <span>
                  Lock période: <span className="font-mono text-[#0E0F0F]">4 ans</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#96EA7A] mt-0.5">•</span>
                <span>
                  Distribution: <span className="font-mono text-[#0E0F0F]">Mensuelle APR</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#96EA7A] mt-0.5">•</span>
                <span>
                  Whitelist: <span className="font-mono text-[#0E0F0F]">Optionnelle</span>
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-[#E6F1E7] border border-[#9EB3A8]/20 rounded-xl p-4">
            <h4 className="text-sm font-medium text-[#0E0F0F] mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Important
            </h4>
            <p className="text-xs text-[#9EB3A8]">
              Le déploiement nécessite des frais de gas. Assurez-vous d&apos;avoir assez d&apos;ETH
              sur le réseau cible.
            </p>
          </div>

          {!useCustomABI && (
            <div className="bg-[#E6F1E7] border border-[#9EB3A8]/20 rounded-xl p-4">
              <h4 className="text-sm font-medium text-[#0E0F0F] mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                ABI du Constructeur
              </h4>
              <pre className="text-xs text-[#9EB3A8] font-mono bg-white/50 rounded p-2 overflow-x-auto">
                {`constructor(
  address _asset,
  address _owner
)`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
