'use client'

import { Header } from '@/components/Header'
import { HEARST_VAULT, fmtUsd } from '@/config/mock-data'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

import { CARD, STRATEGY_ICONS } from '@/components/ui/constants'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useDemo } from '@/context/demo-context'
import { useAuthGuard } from '@/hooks/useAuthGuard'

type Step = 'overview' | 'deposit' | 'success'

export default function ProductPage() {
  const authed = useAuthGuard()
  const router = useRouter()
  const demo = useDemo()
  const vault = HEARST_VAULT

  const [step, setStep] = useState<Step>('overview')
  const [amount, setAmount] = useState('')
  const [, setDepositId] = useState<number | null>(null)

  const allocationData = useMemo(
    () => vault.strategies.map((s) => ({ name: s.label, value: s.allocation, color: s.color })),
    [vault],
  )

  const parsedAmount = parseFloat(amount) || 0
  const isValidAmount = parsedAmount >= vault.minDeposit

  const handleDeposit = () => {
    demo.deposit(vault.slug, parsedAmount)
    const latestId = demo.state.nextDepositId
    setDepositId(latestId)
    setStep('success')
  }

  if (!authed) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Header />

      <main className="pt-20 pb-10">
        <div className="page-container">
          {/* ─── Stepper ─── */}
          <div className="flex items-center justify-center gap-2 mt-6 mb-6">
            {(['overview', 'deposit', 'success'] as Step[]).map((s, i) => {
              const labels = ['Product', 'Deposit', 'Confirmed']
              const current = ['overview', 'deposit', 'success'].indexOf(step)
              const idx = i
              const isActive = idx === current
              const isDone = idx < current

              return (
                <div key={s} className="flex items-center gap-2">
                  {i > 0 && (
                    <div className={`w-8 h-px ${isDone ? 'bg-[#96EA7A]' : 'bg-[#9EB3A8]/20'}`} />
                  )}
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#96EA7A] text-[#0E0F0F]'
                          : isDone
                            ? 'bg-[#96EA7A]/20 text-[#96EA7A]'
                            : 'bg-[#9EB3A8]/10 text-[#9EB3A8]'
                      }`}
                    >
                      {isDone ? (
                        <svg
                          className="w-3 h-3"
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
                      className={`text-xs font-medium hidden sm:block ${
                        isActive ? 'text-[#0E0F0F]' : 'text-[#9EB3A8]'
                      }`}
                    >
                      {labels[i]}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ════════════════════════════════════════════════════════════
             STEP 1 — Overview
             ════════════════════════════════════════════════════════════ */}
          {step === 'overview' && (
            <>
              {/* Hero */}
              <div className={`${CARD} p-6 sm:p-8 relative overflow-hidden mb-6`}>
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-[#96EA7A]/6 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-[#9EB3A8]/4 to-transparent rounded-full blur-2xl pointer-events-none" />

                <div className="relative">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#96EA7A]/10 flex items-center justify-center">
                        <Image
                          src="/assets/tokens/hearst.svg"
                          alt={vault.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-[2.75rem] sm:text-[3.25rem] font-black text-[#0E0F0F] tracking-tight leading-none">
                            {vault.name}
                          </h1>
                          <span className="text-caption font-bold px-3 py-1 rounded-full bg-[#96EA7A]/20 text-[#96EA7A] border border-[#96EA7A]/30">
                            Active
                          </span>
                        </div>
                        <p className="text-sm text-[#9EB3A8] mt-1 max-w-lg">{vault.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#9EB3A8]/10 rounded-xl overflow-hidden">
                    {[
                      {
                        label: 'Target APY',
                        value: `${vault.compositeApy[0]}–${vault.compositeApy[1]}%`,
                        accent: true,
                      },
                      { label: 'Lock Period', value: `${vault.lockPeriodMonths / 12} Years` },
                      { label: 'Min Deposit', value: fmtUsd(vault.minDeposit) },
                      { label: 'Deposit Token', value: vault.depositToken },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-white px-5 py-4">
                        <p className="kpi-label mb-1">{kpi.label}</p>
                        <p
                          className={`text-lg font-black ${'accent' in kpi && kpi.accent ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}
                        >
                          {kpi.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strategies + Allocation */}
              <h2 className="section-title mb-4">Strategy Breakdown</h2>
              <div className="grid grid-cols-12 gap-4 items-stretch mb-4">
                <div className="col-span-12 lg:col-span-8">
                  <div className={`${CARD} overflow-hidden h-full`}>
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#9EB3A8]/10">
                      <h3 className="text-heading-sm font-bold text-[#0E0F0F]">
                        3 Strategy Pockets
                      </h3>
                    </div>
                    <div className="divide-y divide-[#9EB3A8]/5">
                      {vault.strategies.map((s, idx) => (
                        <div
                          key={s.type}
                          className={`px-6 py-5 flex items-start gap-4 transition-colors ${idx % 2 === 1 ? 'bg-[#F2F2F2]/50 hover:bg-white' : 'hover:bg-[#F2F2F2]/40'}`}
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: `${s.color}15` }}
                          >
                            <Image
                              src={STRATEGY_ICONS[s.type] ?? ''}
                              alt={s.label}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-sm font-bold text-[#0E0F0F]">{s.label}</span>
                              <span
                                className="text-caption font-semibold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: `${s.color}15`, color: s.color }}
                              >
                                {s.allocation}%
                              </span>
                            </div>
                            <p className="text-xs text-[#9EB3A8] leading-relaxed mb-3">
                              {s.description}
                            </p>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <span className="kpi-label">APY</span>
                                <span className="text-sm font-black" style={{ color: s.color }}>
                                  {s.apyRange[0]}–{s.apyRange[1]}%
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
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

                <div className="col-span-12 lg:col-span-4">
                  <div className={`${CARD} p-6 h-full flex flex-col`}>
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
                            alt="H"
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

              {/* How it works + Fees + Simulation */}
              <h2 className="section-title mb-4 mt-2">Details & Subscription</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch mb-6">
                {/* How it works & Fees */}
                <div className={`${CARD} p-6 flex flex-col`}>
                  <h3 className="card-title mb-4">How it works</h3>
                  <div className="space-y-4 mb-6 flex-1">
                    {[
                      {
                        n: '1',
                        title: 'Deposit USDC',
                        desc: 'Capital split across 3 pockets automatically.',
                      },
                      {
                        n: '2',
                        title: 'Earn Monthly',
                        desc: `~${vault.compositeApy[0]}–${vault.compositeApy[1]}% annual yield, claimable after 12-month cliff.`,
                      },
                      {
                        n: '3',
                        title: 'Withdraw',
                        desc: 'At 36% cumulative yield or after 3 years.',
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

                  <div className="border-t border-[#9EB3A8]/10 pt-5">
                    <h3 className="card-title mb-4">Fees</h3>
                    <div className="space-y-3">
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
                          className={`flex items-center justify-between py-1.5 border-b border-[#9EB3A8]/8 last:border-0 px-2 rounded-lg transition-colors ${idx % 2 === 1 ? 'bg-[#F2F2F2]/50 hover:bg-white' : 'hover:bg-[#F2F2F2]/50'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-caption text-[#9EB3A8] w-4 text-center">
                              {fee.icon}
                            </span>
                            <span className="text-sm text-[#0E0F0F]">{fee.label}</span>
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
                          <p className="text-[11px] font-bold text-[#0E0F0F]">{item.label}</p>
                          <p className="text-[10px] text-[#9EB3A8]">{item.desc}</p>
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
                      <p className="card-title">{vault.name}</p>
                      <p className="text-xs text-[#9EB3A8] mt-0.5">Multi-strategy vault</p>
                    </div>
                  </div>

                  <div className="space-y-0 mb-5 flex-1">
                    {[
                      {
                        label: 'Target APY',
                        value: `${vault.compositeApy[0]}–${vault.compositeApy[1]}%`,
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
            <div className="max-w-xl mx-auto">
              <div className={`${CARD} p-6 sm:p-8`}>
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => setStep('overview')}
                    className="w-8 h-8 rounded-xl bg-[#F2F2F2] flex items-center justify-center hover:bg-[#E6F1E7] transition-colors shrink-0"
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
                  <h2 className="section-title">Deposit into {vault.name}</h2>
                </div>

                {/* Vault summary */}
                <div className="flex items-center gap-3 p-4 bg-[#F2F2F2] rounded-xl mb-6">
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
                    <p className="text-sm font-bold text-[#0E0F0F]">{vault.name}</p>
                    <p className="text-xs text-[#9EB3A8]">
                      {vault.compositeApy[0]}–{vault.compositeApy[1]}% APY
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {vault.strategies.map((s) => (
                      <div
                        key={s.type}
                        className="flex items-center gap-1 bg-white rounded-full px-2 py-0.5"
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
                <div className="mb-6">
                  <label className="block kpi-label mb-2">Amount (USDC)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Min ${fmtUsd(vault.minDeposit)}`}
                      className="w-full h-16 px-5 pr-20 rounded-2xl border border-[#9EB3A8]/20 bg-[#F2F2F2] text-[#0E0F0F] font-black text-2xl focus:outline-none focus:ring-2 focus:ring-[#96EA7A] focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
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
                <div className="space-y-0 mb-6">
                  {[
                    {
                      label: 'Withdraw Available',
                      value: `At 36% yield or ${new Date(Date.now() + 3 * 365 * 86400 * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
                    },
                    { label: 'Yield Claim', value: 'Monthly after 12-month cliff', accent: true },
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
                <div className="p-3.5 bg-[#E8A838]/8 rounded-xl mb-6 flex items-start gap-2.5">
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
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('overview')}
                    className="flex-1 h-14 rounded-2xl text-sm font-bold bg-[#F2F2F2] text-[#9EB3A8] hover:bg-[#E6F1E7] hover:text-[#0E0F0F] transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDeposit}
                    disabled={!isValidAmount}
                    className={`flex-[2] h-14 rounded-2xl text-base font-bold transition-all ${
                      isValidAmount
                        ? 'bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] shadow-lg shadow-[#96EA7A]/20 hover:shadow-xl active:scale-[0.98]'
                        : 'bg-[#F2F2F2] text-[#9EB3A8] cursor-not-allowed'
                    }`}
                  >
                    Confirm Deposit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
             STEP 3 — Success
             ════════════════════════════════════════════════════════════ */}
          {step === 'success' && (
            <div className="max-w-lg mx-auto">
              <div className={`${CARD} p-8 sm:p-10 text-center`}>
                <div className="w-20 h-20 rounded-3xl bg-[#96EA7A]/15 flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 text-[#96EA7A]"
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

                <h2 className="section-title mb-2">Deposit Confirmed</h2>
                <p className="text-sm text-[#9EB3A8] mb-8">
                  Your position in {vault.name} is now active
                </p>

                {/* Deposit recap */}
                <div className="bg-[#F2F2F2] rounded-2xl p-5 mb-8 text-left">
                  <div className="flex items-center gap-3 mb-4">
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
                      <p className="text-sm font-bold text-[#0E0F0F]">{vault.name}</p>
                      <p className="text-xs text-[#9EB3A8]">
                        {vault.compositeApy[0]}–{vault.compositeApy[1]}% APY
                      </p>
                    </div>
                    <p className="text-xl font-black text-[#0E0F0F]">{fmtUsd(parsedAmount)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#9EB3A8]/10">
                    <div>
                      <p className="kpi-label mb-0.5">Lock</p>
                      <p className="text-sm font-bold text-[#0E0F0F]">
                        {vault.lockPeriodMonths / 12}Y
                      </p>
                    </div>
                    <div>
                      <p className="kpi-label mb-0.5">Cliff</p>
                      <p className="text-sm font-bold text-[#0E0F0F]">{vault.yieldCliffMonths}mo</p>
                    </div>
                    <div>
                      <p className="kpi-label mb-0.5">Status</p>
                      <p className="text-sm font-bold text-[#96EA7A]">Active</p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push('/my-vaults')}
                    className="flex-1 h-12 rounded-2xl text-sm font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] transition-colors"
                  >
                    View My Vaults
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 h-12 rounded-2xl text-sm font-bold bg-[#F2F2F2] text-[#0E0F0F] hover:bg-[#E6F1E7] transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
