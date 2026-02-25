'use client'

import { base, baseSepolia } from '@reown/appkit/networks'
import { useEffect, useState } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'

const ALLOWED_CHAINS = new Set<number>([base.id, baseSepolia.id])

export function NetworkValidator() {
  const { chain } = useAccount()
  const { switchChain } = useSwitchChain()
  const [showNetworkPrompt, setShowNetworkPrompt] = useState(false)

  useEffect(() => {
    if (chain && !ALLOWED_CHAINS.has(chain.id)) {
      setShowNetworkPrompt(true)
    } else {
      setShowNetworkPrompt(false)
    }
  }, [chain])

  const handleSwitchToBase = async () => {
    try {
      await switchChain({ chainId: base.id })
      setShowNetworkPrompt(false)
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }

  if (!showNetworkPrompt) return null

  return (
    <div className="fixed inset-0 bg-[#0E0F0F]/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm mx-4 text-center">
        <div className="w-12 h-12 bg-[#E6F1E7] rounded-lg flex items-center justify-center mx-auto mb-3">
          <svg
            className="w-6 h-6 text-[#9EB3A8]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <h3 className="card-title mb-1">Wrong Network</h3>

        <p className="text-xs text-[#9EB3A8] mb-4">
          Connected to <strong className="text-[#0E0F0F]">{chain?.name}</strong>. HearstVault
          requires <strong className="text-[#0E0F0F]">Base</strong> or{' '}
          <strong className="text-[#0E0F0F]">Base Sepolia</strong>.
        </p>

        <div className="space-y-2">
          <button
            onClick={handleSwitchToBase}
            className="w-full px-4 py-2 bg-[#96EA7A] hover:bg-[#7ED066] text-[#0E0F0F] font-semibold text-xs rounded-md transition-colors"
          >
            Switch to Base
          </button>
          <button
            onClick={() => setShowNetworkPrompt(false)}
            className="w-full px-4 py-2 bg-[#F2F2F2] hover:bg-[#E6F1E7] text-[#9EB3A8] font-medium text-xs rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
