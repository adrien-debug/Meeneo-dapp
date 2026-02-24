'use client'

import { Header } from '@/components/Header'
import Link from 'next/link'
import { HEARST_VAULT, fmtUsd } from '@/config/mock-data'
import { useDeposit, useUSDCAllowance, useUSDCApproval } from '@/hooks/useEpochVault'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useAccount } from 'wagmi'

import { CARD, RISK_BG, STRATEGY_ICONS } from '@/components/ui/constants'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

const vault = HEARST_VAULT

const allocationData = vault.strategies.map(s => ({
  name: s.label, value: s.allocation, color: s.color,
}))

export default function ProductPage() {
  const { isConnected } = useAccount()
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<'deposit' | 'confirm'>('deposit')

  const { deposit, isPending: isDepositPending, isConfirming: isDepositConfirming, isConfirmed: isDepositConfirmed } = useDeposit()
  const { approve, isPending: isApprovePending, isConfirming: isApproveConfirming, isConfirmed: isApproveConfirmed } = useUSDCApproval()
  const { allowance } = useUSDCAllowance()

  useEffect(() => {
    if (!isConnected) router.replace('/login')
  }, [isConnected, router])

  const parsedAmount = parseFloat(amount) || 0
  const isValidAmount = parsedAmount >= vault.minDeposit
  const needsApproval = parsedAmount > parseFloat(allowance)

  const handleDeposit = () => {
    if (needsApproval && !isApproveConfirmed) {
      approve(amount)
    } else {
      deposit(amount)
    }
  }

  const isProcessing = isDepositPending || isDepositConfirming || isApprovePending || isApproveConfirming

  if (!isConnected) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Header />

      <main className="pt-20 pb-10">
        <div className="page-container">

          {/* ─── Hero ─── */}
          <div className={`${CARD} p-6 sm:p-8 relative overflow-hidden mt-6 mb-6`}>
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-[#96EA7A]/6 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-[#9EB3A8]/4 to-transparent rounded-full blur-2xl pointer-events-none" />

            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="w-8 h-8 rounded-xl bg-[#F2F2F2] flex items-center justify-center hover:bg-[#E6F1E7] transition-colors shrink-0 self-start">
                  <svg className="w-4 h-4 text-[#9EB3A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#96EA7A]/10 flex items-center justify-center">
                    <Image src="/assets/tokens/hearst.svg" alt={vault.name} width={28} height={28} className="rounded-full" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-black text-[#0E0F0F] tracking-tight">{vault.name}</h1>
                      <span className="text-caption font-semibold px-2 py-0.5 rounded-full bg-[#96EA7A]/15 text-[#96EA7A]">Active</span>
                    </div>
                    <p className="text-sm text-[#9EB3A8] mt-0.5">{vault.description}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#9EB3A8]/10 rounded-xl overflow-hidden">
                {[
                  { label: 'Target APY', value: `${vault.compositeApy[0]}–${vault.compositeApy[1]}%`, accent: true },
                  { label: 'Lock Period', value: `${vault.lockPeriodMonths / 12} Years` },
                  { label: 'Min Deposit', value: fmtUsd(vault.minDeposit) },
                  { label: 'Deposit Token', value: vault.depositToken },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white px-5 py-4">
                    <p className="kpi-label mb-1">{kpi.label}</p>
                    <p className={`text-lg font-black ${'accent' in kpi && kpi.accent ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Strategies + Allocation ─── */}
          <div className="grid grid-cols-12 gap-4 items-stretch mb-4">
            <div className="col-span-12 lg:col-span-8">
              <div className={`${CARD} overflow-hidden h-full`}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#9EB3A8]/10">
                  <h3 className="card-title">3 Strategy Pockets</h3>
                  <div className="flex items-center gap-1.5">
                    {vault.strategies.map(s => (
                      <div key={s.type} className="flex items-center gap-1 bg-[#F2F2F2] rounded-full px-2.5 py-1">
                        <Image src={STRATEGY_ICONS[s.type] ?? ''} alt={s.label} width={12} height={12} className="rounded-full" />
                        <span className="text-caption text-[#9EB3A8] font-semibold">{s.allocation}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="divide-y divide-[#9EB3A8]/5">
                  {vault.strategies.map(s => (
                    <div key={s.type} className="px-6 py-5 flex items-start gap-4 hover:bg-[#F2F2F2]/40 transition-colors">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${s.color}15` }}>
                        <Image src={STRATEGY_ICONS[s.type] ?? ''} alt={s.label} width={24} height={24} className="rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-bold text-[#0E0F0F]">{s.label}</span>
                          <span className="text-xs font-black text-[#0E0F0F] bg-[#F2F2F2] px-2 py-0.5 rounded-full">{s.allocation}%</span>
                          <span className={`text-caption font-semibold px-2 py-0.5 rounded-full ${RISK_BG[s.riskLevel]}`}>
                            {s.riskLevel}
                          </span>
                        </div>
                        <p className="text-xs text-[#9EB3A8] leading-relaxed mb-3">{s.description}</p>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="kpi-label">APY</span>
                            <span className="text-sm font-black" style={{ color: s.color }}>{s.apyRange[0]}–{s.apyRange[1]}%</span>
                          </div>
                          <div className="h-4 w-px bg-[#9EB3A8]/15" />
                          <div className="flex flex-wrap gap-1">
                            {s.protocols.map(p => (
                              <span key={p} className="text-caption text-[#9EB3A8] bg-[#F2F2F2] px-2 py-0.5 rounded-full font-medium">{p}</span>
                            ))}
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
                <h3 className="kpi-label mb-5">Allocation</h3>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-36 h-36 mb-5 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={allocationData} innerRadius={44} outerRadius={66} paddingAngle={3} dataKey="value" stroke="none">
                          {allocationData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Image src="/assets/tokens/hearst-logo.svg" alt="H" width={24} height={24} />
                    </div>
                  </div>
                  <div className="w-full space-y-3">
                    {vault.strategies.map(s => (
                      <div key={s.type} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-sm text-[#0E0F0F] flex-1 font-medium">{s.label}</span>
                        <div className="w-12 h-1.5 rounded-full bg-[#F2F2F2] overflow-hidden hidden sm:block">
                          <div className="h-full rounded-full" style={{ width: `${s.allocation}%`, backgroundColor: s.color }} />
                        </div>
                        <span className="text-sm font-bold text-[#0E0F0F] w-10 text-right">{s.allocation}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Box 1: Fees & How it works | Box 2: Simulation | Box 3: Deposit ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">

            {/* Box 1 — How it works & Fees */}
            <div className={`${CARD} p-6`}>
              <h3 className="kpi-label mb-4">How it works</h3>
              <div className="space-y-4 mb-6">
                {[
                  { n: '1', title: 'Deposit USDC', desc: 'Capital split across 3 pockets automatically.' },
                  { n: '2', title: 'Earn Monthly', desc: `~${vault.compositeApy[0]}–${vault.compositeApy[1]}% annual yield, claimable after 12-month cliff.` },
                  { n: '3', title: 'Withdraw', desc: 'At 36% cumulative yield or after 3 years.' },
                ].map((s) => (
                  <div key={s.n} className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#96EA7A]/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-[#96EA7A]">{s.n}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0E0F0F] leading-tight mb-0.5">{s.title}</p>
                      <p className="text-xs text-[#9EB3A8] leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#9EB3A8]/10 pt-5">
                <h3 className="kpi-label mb-4">Fees</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Management', value: `${vault.fees.management}%`, sub: 'annual', icon: '◇' },
                    { label: 'Performance', value: `${vault.fees.performance}%`, sub: 'on yield', icon: '△' },
                    { label: 'Exit', value: `${vault.fees.exit}%`, sub: 'on principal', icon: '○' },
                    { label: 'Early Exit', value: `${vault.fees.earlyExit}%`, sub: 'penalty', icon: '⚠', warn: true },
                  ].map((fee) => (
                    <div key={fee.label} className="flex items-center justify-between py-1.5 border-b border-[#9EB3A8]/8 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-caption text-[#9EB3A8] w-4 text-center">{fee.icon}</span>
                        <span className="text-sm text-[#0E0F0F]">{fee.label}</span>
                        <span className="text-caption text-[#9EB3A8]">({fee.sub})</span>
                      </div>
                      <span className={`text-sm font-bold ${'warn' in fee && fee.warn ? 'text-[#E8A838]' : 'text-[#0E0F0F]'}`}>{fee.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Box 2 — Simulation */}
            <div className={`${CARD} p-6 flex flex-col`}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#96EA7A]/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#96EA7A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <h3 className="text-sm font-black text-[#0E0F0F]">Simulation</h3>
              </div>

              <p className="text-xs text-[#9EB3A8] leading-relaxed mb-4">
                Model your investment across <span className="text-[#0E0F0F] font-semibold">bear, base & bull</span> scenarios over 36 months with our advanced analytics engine.
              </p>

              <div className="space-y-0 rounded-xl bg-[#F2F2F2] overflow-hidden divide-y divide-[#9EB3A8]/10 mb-4">
                {[
                  { icon: '₿', label: 'BTC Price Curves', desc: 'Deterministic & ML forecasts' },
                  { icon: '⛏', label: 'Network & Mining', desc: 'Hashrate, difficulty, hosting' },
                  { icon: '⚙', label: 'Product Config', desc: '3-bucket capital allocation' },
                  { icon: '📊', label: 'Results', desc: 'Multi-scenario comparison' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-xs">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-[#0E0F0F]">{item.label}</p>
                      <p className="text-[10px] text-[#9EB3A8]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                <Link href="/simulation"
                  className="group flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] active:scale-[0.97] transition-all shadow-sm shadow-[#96EA7A]/20">
                  Open Simulation
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>
              </div>
            </div>

            {/* Box 3 — Deposit */}
            <div className={`${CARD} p-6`}>
              {step === 'deposit' && (
                <>
                  <h2 className="card-title mb-5">Deposit</h2>

                  <div className="mb-5">
                    <label className="block kpi-label mb-2">Amount (USDC)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`Min ${fmtUsd(vault.minDeposit)}`}
                        className="w-full h-14 px-4 pr-16 rounded-2xl border border-[#9EB3A8]/20 bg-[#F2F2F2] text-[#0E0F0F] font-black text-xl focus:outline-none focus:ring-2 focus:ring-[#96EA7A] focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <Image src="/assets/tokens/usdc.svg" alt="USDC" width={16} height={16} className="rounded-full" />
                        <span className="text-sm font-bold text-[#9EB3A8]">USDC</span>
                      </div>
                    </div>
                    {parsedAmount > 0 && parsedAmount < vault.minDeposit && (
                      <p className="text-xs text-[#E8A838] mt-1.5 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Minimum: {fmtUsd(vault.minDeposit)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-0 mb-6">
                    {[
                      { label: 'Target APY', value: `${vault.compositeApy[0]}–${vault.compositeApy[1]}%` },
                      { label: 'Yield Distribution', value: 'Monthly' },
                      { label: 'Withdraw Condition', value: '36% target or 3Y' },
                      { label: 'Network', value: 'Base' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-[#9EB3A8]/8 last:border-0">
                        <span className="text-xs text-[#9EB3A8]">{row.label}</span>
                        <span className="text-sm font-bold text-[#0E0F0F]">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setStep('confirm')}
                    disabled={!isValidAmount}
                    className={`w-full h-14 rounded-2xl text-base font-bold transition-all ${
                      isValidAmount
                        ? 'bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] shadow-lg shadow-[#96EA7A]/20 hover:shadow-xl active:scale-[0.98]'
                        : 'bg-[#F2F2F2] text-[#9EB3A8] cursor-not-allowed'
                    }`}
                  >
                    Review Deposit
                  </button>
                </>
              )}

              {step === 'confirm' && (
                <>
                  <h2 className="card-title mb-5">Confirm Deposit</h2>

                  <div className="flex items-center gap-3 p-4 bg-[#F2F2F2] rounded-xl mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#96EA7A]/10 flex items-center justify-center">
                      <Image src="/assets/tokens/hearst.svg" alt={vault.name} width={24} height={24} className="rounded-full" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0E0F0F]">{vault.name}</p>
                      <p className="text-xs text-[#9EB3A8]">{vault.compositeApy[0]}–{vault.compositeApy[1]}% APY</p>
                    </div>
                    <p className="ml-auto text-xl font-black text-[#0E0F0F]">{fmtUsd(parsedAmount)}</p>
                  </div>

                  <div className="space-y-0 mb-5">
                    {[
                      { label: 'Withdraw Available', value: `At 36% yield or ${new Date(Date.now() + 3 * 365 * 86400 * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` },
                      { label: 'Yield Claim', value: 'Monthly after 12-month cliff', accent: true },
                      { label: 'Management Fee', value: `${vault.fees.management}%` },
                      { label: 'Performance Fee', value: `${vault.fees.performance}%` },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-[#9EB3A8]/8 last:border-0">
                        <span className="text-xs text-[#9EB3A8]">{row.label}</span>
                        <span className={`text-sm font-bold ${'accent' in row && row.accent ? 'text-[#96EA7A]' : 'text-[#0E0F0F]'}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 bg-[#E8A838]/8 rounded-xl mb-6 flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-[#E8A838] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-xs text-[#E8A838] font-medium leading-relaxed">
                      Early withdrawal before maturity incurs a {vault.fees.earlyExit}% penalty on principal.
                    </p>
                  </div>

                  {isDepositConfirmed ? (
                    <div className="text-center py-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#96EA7A]/15 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-[#96EA7A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-base font-bold text-[#0E0F0F] mb-1">Deposit Confirmed</p>
                      <p className="text-sm text-[#9EB3A8] mb-5">Your position is now active</p>
                      <button
                        onClick={() => router.push('/my-vaults')}
                        className="w-full h-12 rounded-2xl text-sm font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] transition-colors"
                      >
                        View My Vaults
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep('deposit')}
                        disabled={isProcessing}
                        className="flex-1 h-14 rounded-2xl text-sm font-bold bg-[#F2F2F2] text-[#9EB3A8] hover:bg-[#E6F1E7] hover:text-[#0E0F0F] transition-all disabled:opacity-50"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleDeposit}
                        disabled={isProcessing}
                        className="flex-[2] h-14 rounded-2xl text-base font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] shadow-lg shadow-[#96EA7A]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                      >
                        {isApprovePending ? 'Approve in wallet...'
                          : isApproveConfirming ? 'Approving...'
                          : needsApproval && !isApproveConfirmed ? 'Approve USDC'
                          : isDepositPending ? 'Confirm in wallet...'
                          : isDepositConfirming ? 'Processing...'
                          : 'Deposit'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  )
}
