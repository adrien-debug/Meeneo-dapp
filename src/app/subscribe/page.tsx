'use client'

import { Header } from '@/components/Header'
import { ALL_VAULTS, fmtApy, fmtUsd } from '@/config/mock-data'
import type { VaultConfig } from '@/types/product'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { useAccount } from 'wagmi'

import { CARD, STRATEGY_ICONS } from '@/components/ui/constants'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { TransactionProgress } from '@/components/ui/TransactionProgress'
import { useDemo } from '@/context/demo-context'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useDeposit, useUSDCAllowance, useUSDCApproval } from '@/hooks/useEpochVault'
import { useSimulatedTransaction } from '@/hooks/useSimulatedTransaction'

type Step = 'select' | 'overview' | 'deposit' | 'success'

export default function ProductPage() {
  const authed = useAuthGuard()
  const router = useRouter()
  const demo = useDemo()
  const { isConnected } = useAccount()

  const [step, setStep] = useState<Step>('select')
  const [selectedVault, setSelectedVault] = useState<VaultConfig>(ALL_VAULTS[0])
  const [amount, setAmount] = useState('')

  const vault = selectedVault

  const { allowance } = useUSDCAllowance()
  const {
    approve,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isConfirmed: isApproveConfirmed,
  } = useUSDCApproval()
  const {
    deposit: onChainDeposit,
    isPending: isDepositPending,
    isConfirming: isDepositConfirming,
    isConfirmed: isDepositConfirmed,
  } = useDeposit()

  const allocationData = useMemo(
    () => vault.strategies.map((s) => ({ name: s.label, value: s.allocation, color: s.color })),
    [vault],
  )

  const parsedAmount = parseFloat(amount) || 0
  const isValidAmount = parsedAmount >= vault.minDeposit
  const needsApproval = isConnected && parseFloat(allowance) < parsedAmount

  const [txPhase, setTxPhase] = useState<'idle' | 'approving' | 'depositing'>('idle')
  const txSim = useSimulatedTransaction()

  useEffect(() => {
    if (isApproveConfirmed && txPhase === 'approving') {
      setTxPhase('depositing')
      onChainDeposit(amount)
    }
  }, [isApproveConfirmed, txPhase, onChainDeposit, amount])

  useEffect(() => {
    if (isDepositConfirmed && txPhase === 'depositing') {
      demo.subscribe(vault, parsedAmount)
      setTxPhase('idle')
      setStep('success')
    }
  }, [isDepositConfirmed, txPhase, demo, vault, parsedAmount])

  const selectProduct = (v: VaultConfig) => {
    setSelectedVault(v)
    setAmount('')
    setStep('overview')
  }

  const handleDeposit = () => {
    if (!isConnected) {
      txSim.execute(['approve', 'deposit'], () => {
        demo.subscribe(vault, parsedAmount)
        setTimeout(() => {
          txSim.reset()
          setStep('success')
        }, 1200)
      })
      return
    }

    if (needsApproval) {
      setTxPhase('approving')
      approve(amount)
    } else {
      setTxPhase('depositing')
      onChainDeposit(amount)
    }
  }

  const isTxInProgress =
    isApprovePending ||
    isApproveConfirming ||
    isDepositPending ||
    isDepositConfirming ||
    txSim.state.status !== 'idle'

  const depositButtonLabel = () => {
    if (txSim.state.status !== 'idle') return 'Processing...'
    if (!isConnected) return 'Confirm Deposit'
    if (isApprovePending) return 'Approve in wallet...'
    if (isApproveConfirming) return 'Approving...'
    if (isDepositPending) return 'Confirm in wallet...'
    if (isDepositConfirming) return 'Depositing...'
    if (needsApproval) return 'Approve & Deposit'
    return 'Confirm Deposit'
  }

  if (!authed) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Header />
      <TransactionProgress state={txSim.state} amount={amount} />

      <main className="pt-20 pb-10">
        <div className="page-container">
          {/* ════════════════════════════════════════════════════════════
             STEP 0 — Product Selection
             ════════════════════════════════════════════════════════════ */}
          {step === 'select' && (
            <div className={`${CARD} p-6 sm:p-8 relative overflow-hidden mt-6 mb-6`}>
              <div className="absolute inset-0 pointer-events-none">
                <Image
                  src="/assets/backgrounds/dashboard-hero-bg.png"
                  alt=""
                  fill
                  className="object-cover opacity-20 mix-blend-multiply"
                  sizes="100vw"
                />
              </div>
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-[#96EA7A]/6 to-transparent rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-[#9EB3A8]/4 to-transparent rounded-full blur-2xl pointer-events-none" />

              <div className="relative">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:min-h-[74px] mb-8">
                  <div>
                    <p className="kpi-label mb-2">Vault Selection</p>
                    <h1 className="text-display font-black text-[var(--foreground)] tracking-tight">
                      Invest in Institutional Vaults
                    </h1>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#9EB3A8]/10 rounded-xl overflow-hidden">
                  {[
                    { label: 'Products', value: `${ALL_VAULTS.length}` },
                    {
                      label: 'Best APY',
                      value: fmtApy(
                        ALL_VAULTS.reduce(
                          (best, v) => (v.compositeApy[1] > best[1] ? v.compositeApy : best),
                          ALL_VAULTS[0].compositeApy,
                        ),
                      ),
                    },
                    {
                      label: 'Min Entry',
                      value: fmtUsd(Math.min(...ALL_VAULTS.map((v) => v.minDeposit))),
                    },
                    { label: 'Network', value: 'Base' },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="bg-white px-5 py-4 hover:bg-[#F2F2F2]/60 transition-colors"
                    >
                      <p className="kpi-label mb-1">{kpi.label}</p>
                      <p className="text-base font-black text-[#0E0F0F] truncate">{kpi.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Stepper ─── */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8 px-2">
            {(['select', 'overview', 'deposit', 'success'] as Step[]).map((s, i) => {
              const labels = ['Select', 'Product', 'Deposit', 'Confirmed']
              const current = ['select', 'overview', 'deposit', 'success'].indexOf(step)
              const idx = i
              const isActive = idx === current
              const isDone = idx < current

              return (
                <div key={s} className="flex items-center gap-2 sm:gap-3">
                  {i > 0 && (
                    <div
                      className={`w-6 sm:w-12 h-0.5 rounded-full ${isDone ? 'bg-[#96EA7A]' : 'bg-[#9EB3A8]/20'}`}
                    />
                  )}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all shrink-0 ${
                        isActive
                          ? 'bg-[#96EA7A] text-[#0E0F0F] shadow-md shadow-[#96EA7A]/25'
                          : isDone
                            ? 'bg-[#96EA7A]/20 text-[#96EA7A]'
                            : 'bg-[#9EB3A8]/10 text-[#9EB3A8]'
                      }`}
                    >
                      {isDone ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-semibold ${
                        isActive ? 'text-[#0E0F0F]' : 'text-[#9EB3A8]'
                      } ${isActive ? '' : 'hidden sm:block'}`}
                    >
                      {labels[i]}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {step === 'select' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {ALL_VAULTS.map((v) => (
                  <button
                    key={v.slug}
                    onClick={() => selectProduct(v)}
                    className="text-left hover:-translate-y-1.5 transition-all duration-300 group relative overflow-hidden cursor-pointer flex flex-col rounded-3xl shadow-md hover:shadow-2xl border border-transparent hover:border-[#96EA7A]/30"
                  >
                    {/* Header */}
                    <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-6 rounded-t-3xl relative overflow-hidden">
                      <div className="absolute inset-0 pointer-events-none">
                        <Image
                          src={
                            v.name === 'Hearst Hedge'
                              ? '/assets/backgrounds/vault-card-1-bg.png'
                              : '/assets/backgrounds/vault-card-2-bg.png'
                          }
                          alt=""
                          fill
                          className="object-cover"
                          sizes="50vw"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white pointer-events-none" />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-small font-bold px-3 py-1 rounded-full bg-[#0E0F0F]/10 text-[#0E0F0F] border border-[#0E0F0F]/15 uppercase tracking-widest">
                              {v.status === 'active' ? 'Live' : v.status}
                            </span>
                            <span className="text-small text-[#0E0F0F] font-medium uppercase tracking-wide">
                              {v.strategies.map((s) => s.label).join(' · ')}
                            </span>
                          </div>
                          <span className="text-body font-mono font-bold text-[#0E0F0F]">
                            {v.refNumber}
                          </span>
                        </div>
                        <h3 className="text-heading-sm sm:text-heading font-black text-[#0E0F0F] mb-5">
                          {v.name}
                        </h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-display sm:text-[3.5rem] font-black text-[#0E0F0F] tracking-tighter leading-none">
                            {v.compositeApy[0] === v.compositeApy[1]
                              ? v.compositeApy[0]
                              : `${v.compositeApy[0]}–${v.compositeApy[1]}`}
                          </span>
                          <span className="text-base font-bold text-[#0E0F0F]">% APY</span>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="bg-white px-6 sm:px-8 py-6 flex-1 flex flex-col">
                      {/* Intro */}
                      <p className="text-base text-[var(--foreground)]/80 leading-relaxed mb-5">
                        {v.description}
                      </p>

                      {/* Features */}
                      <div className="mb-6 grid grid-cols-2 gap-x-4 gap-y-4">
                        {[
                          {
                            icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                            title: 'Multi-Strategy',
                            desc: v.strategies.map((s: { label: string }) => s.label).join(', '),
                          },
                          {
                            icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
                            title: 'Target Yield',
                            desc: `${v.compositeApy[0]}–${v.compositeApy[1]}% APY, monthly`,
                          },
                          {
                            icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
                            title: `${v.lockPeriodMonths / 12} Years Lock`,
                            desc: 'Withdraw at 36% or maturity',
                          },
                          {
                            icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
                            title: 'Audited',
                            desc: 'Base network, institutional custody',
                          },
                        ].map((f) => (
                          <div key={f.title} className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#96EA7A]/10 flex items-center justify-center shrink-0 mt-0.5">
                              <svg
                                className="w-3.5 h-3.5 text-[#96EA7A]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d={f.icon}
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-body font-bold text-[var(--foreground)] leading-tight">
                                {f.title}
                              </p>
                              <p className="text-small text-[var(--muted)] leading-snug mt-0.5">
                                {f.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Separator */}
                      <div className="border-t border-[var(--card-border)] mb-5" />

                      {/* Strategy allocation bar */}
                      <div className="flex w-full h-2.5 rounded-full overflow-hidden mb-2.5">
                        {v.strategies.map((s) => (
                          <div
                            key={s.type}
                            className="h-full first:rounded-l-full last:rounded-r-full"
                            style={{ width: `${s.allocation}%`, backgroundColor: s.color }}
                          />
                        ))}
                      </div>

                      {/* Strategy pills */}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {v.strategies.map((s) => (
                          <div key={s.type} className="flex items-center gap-1.5">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: s.color }}
                            />
                            <span className="text-small text-[var(--foreground)] font-semibold">
                              {s.label}
                            </span>
                            <span className="text-small text-[var(--muted)]">{s.allocation}%</span>
                          </div>
                        ))}
                      </div>

                      {/* Key metrics */}
                      <div className="grid grid-cols-3 gap-px bg-[var(--card-border)] rounded-xl overflow-hidden mt-auto">
                        {[
                          { label: 'Lock', value: `${v.lockPeriodMonths / 12} Years` },
                          { label: 'Min Deposit', value: fmtUsd(v.minDeposit) },
                          {
                            label: 'Fees',
                            value: `${v.fees.management}% + ${v.fees.performance}%`,
                          },
                        ].map((m) => (
                          <div key={m.label} className="bg-white px-3 py-2.5 text-center">
                            <p className="text-body font-black text-[var(--foreground)]">
                              {m.value}
                            </p>
                            <p className="kpi-label mt-0.5">{m.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-white px-6 sm:px-8 pb-5 sm:pb-6 pt-2 rounded-b-3xl flex justify-center">
                      <div className="h-10 w-full max-w-[200px] rounded-full bg-[#96EA7A] text-[#0E0F0F] font-bold text-small flex items-center justify-center gap-1.5 group-hover:bg-[#7ED066] transition-all duration-200 group-hover:shadow-lg group-hover:shadow-[#96EA7A]/20">
                        Subscribe Now
                        <svg
                          className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════
             STEP 1 — Overview
             ════════════════════════════════════════════════════════════ */}
          {step === 'overview' && (
            <>
              {/* Hero */}
              <div className={`${CARD} p-4 sm:p-6 md:p-8 relative overflow-hidden mb-4 sm:mb-6`}>
                <div className="absolute inset-0 pointer-events-none">
                  <Image
                    src={
                      vault.name === 'Hearst Hedge'
                        ? '/assets/backgrounds/vault-card-1-bg.png'
                        : '/assets/backgrounds/vault-card-2-bg.png'
                    }
                    alt=""
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white pointer-events-none" />

                <div className="relative">
                  <div className="mb-4 sm:mb-6">
                    <button
                      onClick={() => setStep('select')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#9EB3A8]/20 text-sm font-semibold text-[#0E0F0F] hover:border-[#96EA7A]/40 hover:shadow-md transition-all mb-4 active:scale-[0.97]"
                      aria-label="Back to all products"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Back
                    </button>
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                      <h1 className="text-2xl sm:text-[2.75rem] md:text-[3.25rem] font-black text-[#0E0F0F] tracking-tight leading-none">
                        {vault.name}{' '}
                        <span className="text-base font-mono font-bold text-[#0E0F0F]">
                          {vault.refNumber}
                        </span>
                      </h1>
                      <span className="text-caption font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#96EA7A]/20 text-[#96EA7A] border border-[#96EA7A]/30">
                        Active
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#0E0F0F] mt-1 max-w-lg">
                      {vault.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#9EB3A8]/10 rounded-xl overflow-hidden">
                    {[
                      {
                        label: 'Target APY',
                        value: fmtApy(vault.compositeApy),
                        accent: true,
                      },
                      { label: 'Lock Period', value: `${vault.lockPeriodMonths / 12} Years` },
                      { label: 'Min Deposit', value: fmtUsd(vault.minDeposit) },
                      { label: 'Deposit Token', value: vault.depositToken },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-white px-3 sm:px-5 py-3 sm:py-4">
                        <p className="kpi-label mb-0.5 sm:mb-1">{kpi.label}</p>
                        <p
                          className={`text-base sm:text-lg font-black ${'accent' in kpi && kpi.accent ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}
                        >
                          {kpi.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strategies + Allocation */}
              <h2 className="section-title mb-3 sm:mb-4">Strategy Breakdown</h2>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch mb-4">
                <div className="lg:col-span-8">
                  <div className={`${CARD} overflow-hidden h-full`}>
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[#9EB3A8]/10">
                      <h3 className="text-heading-sm font-bold text-[#0E0F0F]">
                        {vault.strategies.length} Strategy Pockets
                      </h3>
                    </div>
                    <div className="divide-y divide-[#9EB3A8]/5">
                      {vault.strategies.map((s, idx) => (
                        <div
                          key={s.type}
                          className={`px-4 sm:px-6 py-4 sm:py-5 flex items-start gap-3 sm:gap-4 transition-colors ${idx % 2 === 1 ? 'bg-[#F2F2F2]/50 hover:bg-white' : 'hover:bg-[#F2F2F2]/40'}`}
                        >
                          <div
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: `${s.color}15` }}
                          >
                            <Image
                              src={STRATEGY_ICONS[s.type] ?? ''}
                              alt={s.label}
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-[#0E0F0F]">
                                {s.label}
                              </span>
                              <span
                                className="text-caption font-semibold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: `${s.color}15`, color: s.color }}
                              >
                                {s.allocation}%
                              </span>
                            </div>
                            <p className="text-xs text-[#9EB3A8] leading-relaxed mb-2 sm:mb-3">
                              {s.description}
                            </p>
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                <span className="kpi-label">APY</span>
                                <span
                                  className="text-xs sm:text-sm font-black"
                                  style={{ color: s.color }}
                                >
                                  {s.apyRange[0]}–{s.apyRange[1]}%
                                </span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                <span className="kpi-label">Risk</span>
                                <span className="text-xs font-semibold text-[#0E0F0F] capitalize">
                                  {s.riskLevel}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <div className={`${CARD} p-4 sm:p-6 h-full flex flex-col`}>
                    <h3 className="card-title mb-5">Allocation</h3>
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="w-36 h-36 mb-5 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={allocationData}
                              innerRadius={44}
                              outerRadius={66}
                              paddingAngle={3}
                              dataKey="value"
                              stroke="none"
                            >
                              {allocationData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Image
                            src="/assets/tokens/hearst-logo.svg"
                            alt="Hearst logo"
                            width={24}
                            height={24}
                          />
                        </div>
                      </div>
                      <div className="w-full space-y-3">
                        {vault.strategies.map((s) => (
                          <div key={s.type} className="flex items-center gap-3">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: s.color }}
                            />
                            <span className="text-sm text-[#0E0F0F] flex-1 font-medium">
                              {s.label}
                            </span>
                            <div className="w-12 h-1.5 rounded-full bg-[#F2F2F2] overflow-hidden hidden sm:block">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${s.allocation}%`, backgroundColor: s.color }}
                              />
                            </div>
                            <span className="text-sm font-bold text-[#0E0F0F] w-10 text-right">
                              {s.allocation}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulation + Subscribe */}
              <h2 className="section-title mb-3 sm:mb-4 mt-2">Simulation & Subscription</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 sm:mb-6">
                {/* Simulation */}
                <div className={`${CARD} p-6 flex flex-col`}>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-[#96EA7A]/10 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-[#96EA7A]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                        />
                      </svg>
                    </div>
                    <h3 className="card-title">Simulation</h3>
                  </div>

                  <p className="text-xs text-[#9EB3A8] leading-relaxed mb-4">
                    Model your investment across{' '}
                    <span className="text-[#0E0F0F] font-semibold">bear, base & bull</span>{' '}
                    scenarios over 36 months with our advanced analytics engine.
                  </p>

                  <div className="space-y-0 rounded-xl bg-[#F2F2F2] overflow-hidden divide-y divide-[#9EB3A8]/10 mb-4">
                    {[
                      {
                        icon: '₿',
                        label: 'BTC Price Curves',
                        desc: 'Deterministic & ML forecasts',
                      },
                      {
                        icon: '⛏',
                        label: 'Network & Mining',
                        desc: 'Hashrate, difficulty, hosting',
                      },
                      { icon: '⚙', label: 'Product Config', desc: '3-bucket capital allocation' },
                      { icon: '📊', label: 'Results', desc: 'Multi-scenario comparison' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3 px-3 py-2.5">
                        <span className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-xs">
                          {item.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#0E0F0F]">{item.label}</p>
                          <p className="text-caption text-[#9EB3A8]">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <Link
                      href="/simulation"
                      className="group flex items-center justify-center gap-2 w-full h-14 rounded-2xl text-sm font-bold bg-[#F2F2F2] text-[#0E0F0F] hover:bg-[#E6F1E7] transition-all"
                    >
                      Open Simulation
                      <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </Link>
                  </div>
                </div>

                {/* Subscribe CTA */}
                <div className={`${CARD} p-6 flex flex-col`}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-[#96EA7A]/10 flex items-center justify-center">
                      <Image
                        src="/assets/tokens/hearst.svg"
                        alt={vault.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <p className="card-title">
                        {vault.name}{' '}
                        <span className="text-xs font-mono font-bold text-[#9EB3A8]">
                          {vault.refNumber}
                        </span>
                      </p>
                      <p className="text-xs text-[#9EB3A8] mt-0.5">Multi-strategy vault</p>
                    </div>
                  </div>

                  <div className="space-y-0 mb-5 flex-1">
                    {[
                      {
                        label: 'Target APY',
                        value: fmtApy(vault.compositeApy),
                        accent: true,
                      },
                      { label: 'Lock Period', value: `${vault.lockPeriodMonths} months` },
                      { label: 'Yield Cliff', value: `${vault.yieldCliffMonths} months` },
                      { label: 'Yield Distribution', value: 'Monthly' },
                      { label: 'Withdraw Condition', value: '36% target or 3Y' },
                      { label: 'Network', value: 'Base' },
                    ].map((row, idx) => (
                      <div
                        key={row.label}
                        className={`flex items-center justify-between py-2.5 border-b border-[#9EB3A8]/8 last:border-0 px-2 rounded-lg transition-colors ${idx % 2 === 1 ? 'bg-[#F2F2F2]/50 hover:bg-white' : 'hover:bg-[#F2F2F2]/50'}`}
                      >
                        <span className="text-xs text-[#9EB3A8]">{row.label}</span>
                        <span
                          className={`text-sm font-bold ${'accent' in row && row.accent ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setStep('deposit')}
                    className="w-full h-14 rounded-2xl text-base font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] shadow-lg shadow-[#96EA7A]/20 hover:shadow-xl active:scale-[0.98] transition-all"
                  >
                    Subscribe to Vault
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════
             STEP 2 — Deposit
             ════════════════════════════════════════════════════════════ */}
          {step === 'deposit' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left — Deposit form */}
              <div className="lg:col-span-7">
                <div className={`${CARD} overflow-hidden`}>
                  {/* Header with vault bg */}
                  <div className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-4 relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                      <Image
                        src={
                          vault.name === 'Hearst Hedge'
                            ? '/assets/backgrounds/vault-card-1-bg.png'
                            : '/assets/backgrounds/vault-card-2-bg.png'
                        }
                        alt=""
                        fill
                        className="object-cover"
                        sizes="100vw"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white pointer-events-none" />
                    <div className="relative">
                      <button
                        onClick={() => setStep('overview')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-[#9EB3A8]/20 text-sm font-semibold text-[#0E0F0F] hover:border-[#96EA7A]/40 hover:shadow-md transition-all mb-3 active:scale-[0.97]"
                        aria-label="Back to product overview"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                        Back
                      </button>
                      <h2 className="text-heading-sm font-bold text-[#0E0F0F]">
                        Deposit into {vault.name}{' '}
                        <span className="text-sm font-mono font-bold text-[#9EB3A8]">
                          {vault.refNumber}
                        </span>
                      </h2>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6 md:p-8">
                    {/* Vault summary */}
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-[#F2F2F2] rounded-xl mb-4 sm:mb-6 flex-wrap sm:flex-nowrap">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#96EA7A]/10 flex items-center justify-center shrink-0">
                        <Image
                          src="/assets/tokens/hearst.svg"
                          alt={vault.name}
                          width={22}
                          height={22}
                          className="rounded-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#0E0F0F] truncate">
                          {vault.name}{' '}
                          <span className="text-caption font-mono font-bold text-[#9EB3A8]">
                            {vault.refNumber}
                          </span>
                        </p>
                        <p className="text-xs text-[#9EB3A8]">{fmtApy(vault.compositeApy)} APY</p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                        {vault.strategies.map((s) => (
                          <div
                            key={s.type}
                            className="flex items-center gap-1 bg-white rounded-full px-1.5 sm:px-2 py-0.5"
                          >
                            <Image
                              src={STRATEGY_ICONS[s.type] ?? ''}
                              alt={s.label}
                              width={10}
                              height={10}
                              className="rounded-full"
                            />
                            <span className="text-caption text-[#9EB3A8] font-medium">
                              {s.allocation}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Amount input */}
                    <div className="mb-4 sm:mb-6">
                      <label className="block kpi-label mb-2">Amount (USDC)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder={`Min ${fmtUsd(vault.minDeposit)}`}
                          className="w-full h-14 sm:h-16 px-4 sm:px-5 pr-16 sm:pr-20 rounded-2xl border border-[#9EB3A8]/20 bg-[#F2F2F2] text-[#0E0F0F] font-black text-xl sm:text-2xl focus:outline-none focus:ring-2 focus:ring-[#96EA7A] focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          <Image
                            src="/assets/tokens/usdc.svg"
                            alt="USDC"
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                          <span className="text-sm font-bold text-[#9EB3A8]">USDC</span>
                        </div>
                      </div>
                      {parsedAmount > 0 && parsedAmount < vault.minDeposit && (
                        <p className="text-xs text-[#E8A838] mt-2 flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
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
                          Minimum: {fmtUsd(vault.minDeposit)}
                        </p>
                      )}
                    </div>

                    {/* Deposit summary */}
                    <div className="space-y-0 mb-4 sm:mb-6">
                      {[
                        {
                          label: 'Withdraw Available',
                          value: `At 36% yield or ${new Date(Date.now() + vault.lockPeriodMonths * 30 * 86400 * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
                        },
                        {
                          label: 'Yield Claim',
                          value: `Monthly after ${vault.yieldCliffMonths}-month cliff`,
                          accent: true,
                        },
                        { label: 'Management Fee', value: `${vault.fees.management}%` },
                        { label: 'Performance Fee', value: `${vault.fees.performance}%` },
                      ].map((row, idx) => (
                        <div
                          key={row.label}
                          className={`flex items-center justify-between py-2.5 border-b border-[#9EB3A8]/8 last:border-0 px-2 rounded-lg transition-colors ${idx % 2 === 1 ? 'bg-[#F2F2F2]/50 hover:bg-white' : 'hover:bg-[#F2F2F2]/50'}`}
                        >
                          <span className="text-xs text-[#9EB3A8]">{row.label}</span>
                          <span
                            className={`text-sm font-bold ${'accent' in row && row.accent ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}
                          >
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Early exit warning */}
                    <div className="p-3 sm:p-3.5 bg-[#E8A838]/8 rounded-xl mb-4 sm:mb-6 flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-[#E8A838] shrink-0 mt-0.5"
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
                      <p className="text-xs text-[#E8A838] font-medium leading-relaxed">
                        Early withdrawal before maturity incurs a {vault.fees.earlyExit}% penalty on
                        principal.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={() => setStep('overview')}
                        className="sm:flex-1 h-12 sm:h-14 rounded-2xl text-sm font-bold bg-[#F2F2F2] text-[#9EB3A8] hover:bg-[#E6F1E7] hover:text-[#0E0F0F] transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleDeposit}
                        disabled={!isValidAmount || isTxInProgress}
                        className={`sm:flex-[2] h-12 sm:h-14 rounded-2xl text-sm sm:text-base font-bold transition-all ${
                          isValidAmount && !isTxInProgress
                            ? 'bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] shadow-lg shadow-[#96EA7A]/20 hover:shadow-xl active:scale-[0.98]'
                            : 'bg-[#F2F2F2] text-[#9EB3A8] cursor-not-allowed'
                        }`}
                      >
                        {depositButtonLabel()}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — How it works + Fees */}
              <div className="lg:col-span-5 space-y-4">
                <div className={`${CARD} p-4 sm:p-6`}>
                  <h3 className="card-title mb-4">How it works</h3>
                  <div className="space-y-4">
                    {[
                      {
                        n: '1',
                        title: 'Deposit USDC',
                        desc: `Capital split across ${vault.strategies.length} pockets automatically.`,
                      },
                      {
                        n: '2',
                        title: 'Earn Monthly',
                        desc: `~${fmtApy(vault.compositeApy)} annual yield, claimable after ${vault.yieldCliffMonths}-month cliff.`,
                      },
                      {
                        n: '3',
                        title: 'Withdraw',
                        desc: `At 36% cumulative yield or after ${vault.lockPeriodMonths / 12} years.`,
                      },
                    ].map((s) => (
                      <div key={s.n} className="flex gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#96EA7A]/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-black text-[#96EA7A]">{s.n}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0E0F0F] leading-tight mb-0.5">
                            {s.title}
                          </p>
                          <p className="text-xs text-[#9EB3A8] leading-relaxed">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${CARD} p-4 sm:p-6`}>
                  <h3 className="card-title mb-4">Fees</h3>
                  <div className="space-y-2">
                    {[
                      {
                        label: 'Management',
                        value: `${vault.fees.management}%`,
                        sub: 'annual',
                        icon: '◇',
                      },
                      {
                        label: 'Performance',
                        value: `${vault.fees.performance}%`,
                        sub: 'on yield',
                        icon: '△',
                      },
                      {
                        label: 'Exit',
                        value: `${vault.fees.exit}%`,
                        sub: 'on principal',
                        icon: '○',
                      },
                      {
                        label: 'Early Exit',
                        value: `${vault.fees.earlyExit}%`,
                        sub: 'penalty',
                        icon: '⚠',
                        warn: true,
                      },
                    ].map((fee, idx) => (
                      <div
                        key={fee.label}
                        className={`flex items-center justify-between py-2 border-b border-[#9EB3A8]/8 last:border-0 px-2 rounded-lg transition-colors ${idx % 2 === 1 ? 'bg-[#F2F2F2]/50 hover:bg-white' : 'hover:bg-[#F2F2F2]/50'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#9EB3A8] w-4 text-center">{fee.icon}</span>
                          <span className="text-sm text-[#0E0F0F] font-medium">{fee.label}</span>
                          <span className="text-caption text-[#9EB3A8]">({fee.sub})</span>
                        </div>
                        <span
                          className={`text-sm font-bold ${'warn' in fee && fee.warn ? 'text-[#E8A838]' : 'text-[#0E0F0F]'}`}
                        >
                          {fee.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
             STEP 3 — Success
             ════════════════════════════════════════════════════════════ */}
          {step === 'success' && (
            <div className="max-w-xl mx-auto">
              <div className={`${CARD} overflow-hidden text-center`}>
                {/* Header with vault bg */}
                <div className="px-5 sm:px-8 pt-8 pb-6 relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none">
                    <Image
                      src={
                        vault.name === 'Hearst Hedge'
                          ? '/assets/backgrounds/vault-card-1-bg.png'
                          : '/assets/backgrounds/vault-card-2-bg.png'
                      }
                      alt=""
                      fill
                      className="object-cover"
                      sizes="100vw"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white pointer-events-none" />
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-white/70 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <svg
                        className="w-8 h-8 text-[#96EA7A]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h2 className="section-title mb-1">Deposit Confirmed</h2>
                  </div>
                </div>
                <div className="p-5 sm:p-8 md:p-10">
                  <p className="text-xs sm:text-sm text-[#9EB3A8] mb-5 sm:mb-8">
                    Your position in {vault.name} {vault.refNumber} is now active
                  </p>

                  {/* Deposit recap */}
                  <div className="bg-[#F2F2F2] rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-5 sm:mb-8 text-left">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#96EA7A]/10 flex items-center justify-center">
                        <Image
                          src="/assets/tokens/hearst.svg"
                          alt={vault.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#0E0F0F]">
                          {vault.name}{' '}
                          <span className="text-caption font-mono font-bold text-[#9EB3A8]">
                            {vault.refNumber}
                          </span>
                        </p>
                        <p className="text-xs text-[#9EB3A8]">{fmtApy(vault.compositeApy)} APY</p>
                      </div>
                      <p className="text-lg sm:text-xl font-black text-[#0E0F0F]">
                        {fmtUsd(parsedAmount)}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-[#9EB3A8]/10">
                      <div>
                        <p className="kpi-label mb-0.5">Lock</p>
                        <p className="text-sm font-bold text-[#0E0F0F]">
                          {vault.lockPeriodMonths / 12} Years
                        </p>
                      </div>
                      <div>
                        <p className="kpi-label mb-0.5">Cliff</p>
                        <p className="text-sm font-bold text-[#0E0F0F]">
                          {vault.yieldCliffMonths}mo
                        </p>
                      </div>
                      <div>
                        <p className="kpi-label mb-0.5">Status</p>
                        <p className="text-sm font-bold text-[#96EA7A]">Active</p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      onClick={() => router.push('/my-vaults')}
                      className="flex-1 h-11 sm:h-12 rounded-2xl text-sm font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] transition-colors"
                    >
                      View My Vaults
                    </button>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="flex-1 h-11 sm:h-12 rounded-2xl text-sm font-bold bg-[#F2F2F2] text-[#0E0F0F] hover:bg-[#E6F1E7] transition-colors"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
