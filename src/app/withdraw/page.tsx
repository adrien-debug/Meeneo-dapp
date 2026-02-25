'use client'

import { Header } from '@/components/Header'
import { CARD } from '@/components/ui/constants'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { TransactionProgress } from '@/components/ui/TransactionProgress'
import { fmtUsd, getLockStatusColor, getLockStatusLabel } from '@/config/mock-data'
import { useDemo } from '@/context/demo-context'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useWithdraw } from '@/hooks/useEpochVault'
import { useSimulatedTransaction } from '@/hooks/useSimulatedTransaction'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import { useAccount } from 'wagmi'

export default function WithdrawPage() {
  const authed = useAuthGuard()
  const router = useRouter()
  const { isConnected } = useAccount()
  const demo = useDemo()
  const { withdraw: onChainWithdraw, isPending, isConfirming, isConfirmed } = useWithdraw()
  const txSim = useSimulatedTransaction()
  const pendingAmountRef = useRef('')

  const [withdrawnIds, setWithdrawnIds] = useState<Set<number>>(new Set())

  const maturedDeposits = useMemo(
    () =>
      demo.deposits.filter((d) => d.lockStatus === 'matured' || d.lockStatus === 'target_reached'),
    [demo.deposits],
  )

  const handleWithdraw = (depositId: number, amount: number) => {
    if (isConnected) {
      onChainWithdraw(String(amount))
      demo.withdraw(depositId)
      setWithdrawnIds((prev) => new Set(prev).add(depositId))
      return
    }

    pendingAmountRef.current = String(amount)
    txSim.execute(['withdraw'], () => {
      demo.withdraw(depositId)
      setWithdrawnIds((prev) => new Set(prev).add(depositId))
      setTimeout(() => txSim.reset(), 1200)
    })
  }

  if (!authed) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Header />
      <TransactionProgress state={txSim.state} amount={pendingAmountRef.current} />

      <main className="pt-20 pb-10">
        <div className="page-container">
          <div className="mt-6 mb-6 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-xl bg-white flex items-center justify-center hover:bg-[#E6F1E7] transition-colors shrink-0"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="section-title">Withdraw</h1>
          </div>

          {maturedDeposits.length === 0 && (
            <div className={`${CARD} p-16 text-center`}>
              <p className="text-lg font-bold text-[#0E0F0F] mb-2">No withdrawable positions</p>
              <p className="text-sm text-[#9EB3A8] mb-6">
                Positions become withdrawable at 36% target yield or after 3 years.
              </p>
              <button
                onClick={() => router.push('/my-vaults')}
                className="px-6 py-3 rounded-2xl text-sm font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] transition-all"
              >
                View My Vaults
              </button>
            </div>
          )}

          {maturedDeposits.length > 0 && (
            <div className="space-y-4">
              {maturedDeposits.map((dep) => {
                const vault = demo.getVaultBySlug(dep.vaultSlug)
                if (!vault) return null
                const exitFee = (dep.amount * vault.fees.exit) / 100
                const netReceive = dep.amount + dep.pendingYield - exitFee
                const wasWithdrawn = withdrawnIds.has(dep.id)

                return (
                  <div key={dep.id} className={`${CARD} p-6`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-bold text-[#0E0F0F]">{vault.name}</p>
                        <span
                          className={`text-caption font-bold ${getLockStatusColor(dep.lockStatus)}`}
                        >
                          {getLockStatusLabel(dep.lockStatus)}
                        </span>
                      </div>
                      <p className="text-xl font-black text-[#0E0F0F]">{fmtUsd(dep.amount)}</p>
                    </div>

                    <div className="space-y-0 mb-5">
                      <div className="flex justify-between py-2 border-b border-[#9EB3A8]/8">
                        <span className="text-xs text-[#9EB3A8]">Principal</span>
                        <span className="text-sm font-bold text-[#0E0F0F]">
                          {fmtUsd(dep.amount)}
                        </span>
                      </div>
                      {dep.pendingYield > 0 && (
                        <div className="flex justify-between py-2 border-b border-[#9EB3A8]/8">
                          <span className="text-xs text-[#9EB3A8]">Unclaimed Yield</span>
                          <span className="text-sm font-bold text-[#96EA7A]">
                            +{fmtUsd(dep.pendingYield)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 border-b border-[#9EB3A8]/8">
                        <span className="text-xs text-[#9EB3A8]">
                          Exit Fee ({vault.fees.exit}%)
                        </span>
                        <span className="text-sm font-bold text-[#0E0F0F]">−{fmtUsd(exitFee)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-sm font-semibold text-[#0E0F0F]">You Receive</span>
                        <span className="text-lg font-black text-[#0E0F0F]">
                          {fmtUsd(netReceive)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleWithdraw(dep.id, dep.amount)}
                      disabled={
                        wasWithdrawn || isPending || isConfirming || txSim.state.status !== 'idle'
                      }
                      className="w-full h-12 rounded-full text-sm font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] shadow-lg shadow-[#96EA7A]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
                    >
                      {wasWithdrawn
                        ? 'Withdrawn ✓'
                        : txSim.state.status !== 'idle'
                          ? 'Processing...'
                          : isPending
                            ? 'Confirm in wallet...'
                            : isConfirming
                              ? 'Processing...'
                              : `Withdraw ${fmtUsd(netReceive)}`}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
