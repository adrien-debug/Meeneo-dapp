'use client'

import { Header } from '@/components/Header'
import { CARD } from '@/components/ui/constants'
import SimStepper from '@/components/simulation/SimStepper'
import Image from 'next/image'
import StepBtcCurve from '@/components/simulation/steps/StepBtcCurve'
import StepNetworkCurve from '@/components/simulation/steps/StepNetworkCurve'
import StepMinersHosting from '@/components/simulation/steps/StepMinersHosting'
import StepProductConfig from '@/components/simulation/steps/StepProductConfig'
import StepResults from '@/components/simulation/steps/StepResults'
import { useCallback, useMemo, useState } from 'react'

type WizardStep = 0 | 1 | 2 | 3 | 4

export default function SimulationWizard() {
  const [step, setStep] = useState<WizardStep>(0)
  const [btcCurveId, setBtcCurveId] = useState('')
  const [networkCurveId, setNetworkCurveId] = useState('')
  const [minerIds, setMinerIds] = useState<string[]>([])
  const [siteIds, setSiteIds] = useState<string[]>([])
  const [runId, setRunId] = useState('')

  const completed = useMemo(
    () => [
      !!btcCurveId,
      !!networkCurveId,
      minerIds.length > 0 && siteIds.length > 0,
      !!runId,
      false,
    ],
    [btcCurveId, networkCurveId, minerIds.length, siteIds.length, runId],
  )

  const canGoNext = completed[step]

  const goNext = useCallback(() => {
    if (step < 4 && canGoNext) setStep((step + 1) as WizardStep)
  }, [step, canGoNext])

  const goBack = useCallback(() => {
    if (step > 0) setStep((step - 1) as WizardStep)
  }, [step])

  const handleStepClick = useCallback(
    (s: number) => {
      if (s <= step || completed[s] || (s > 0 && completed[s - 1])) {
        setStep(s as WizardStep)
      }
    },
    [step, completed],
  )

  const resetWizard = useCallback(() => {
    setStep(0)
    setBtcCurveId('')
    setNetworkCurveId('')
    setMinerIds([])
    setSiteIds([])
    setRunId('')
  }, [])

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Header />
      <main className="pt-20 pb-10">
        <div className="page-container">
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
                  <p className="kpi-label mb-2">Advanced Analytics</p>
                  <h1 className="text-display font-black text-[var(--foreground)] tracking-tight">
                    Simulation Engine
                  </h1>
                  <p className="text-sm text-[#9EB3A8] mt-2 max-w-xl">
                    Model your investment across bear, base & bull scenarios with our multi-factor
                    engine.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#9EB3A8]/10 rounded-xl overflow-hidden">
                {[
                  { label: 'BTC Curves', value: '3' },
                  { label: 'Network Models', value: '2' },
                  { label: 'Scenarios', value: 'Bear · Base · Bull' },
                  { label: 'Horizon', value: '36 months' },
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

          <SimStepper current={step} completed={completed} onStepClick={handleStepClick} />
        </div>

        <div className="page-container py-6">
          {step === 0 && (
            <StepBtcCurve onComplete={(id) => setBtcCurveId(id)} completedCurveId={btcCurveId} />
          )}
          {step === 1 && (
            <StepNetworkCurve
              onComplete={(id) => setNetworkCurveId(id)}
              completedCurveId={networkCurveId}
            />
          )}
          {step === 2 && (
            <StepMinersHosting
              onComplete={({ minerIds: m, siteIds: s }) => {
                setMinerIds(m)
                setSiteIds(s)
              }}
            />
          )}
          {step === 3 && (
            <StepProductConfig
              btcCurveId={btcCurveId}
              networkCurveId={networkCurveId}
              minerIds={minerIds}
              siteIds={siteIds}
              onComplete={(id) => {
                setRunId(id)
                setStep(4)
              }}
            />
          )}
          {step === 4 && <StepResults runId={runId} onReset={resetWizard} />}

          {/* Navigation buttons */}
          {step < 4 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#9EB3A8]/10">
              <button
                onClick={goBack}
                disabled={step === 0}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  step === 0
                    ? 'bg-[#F2F2F2] text-[#9EB3A8]/40 cursor-not-allowed'
                    : 'bg-white border border-[#9EB3A8]/20 text-[#9EB3A8] hover:text-[#0E0F0F] hover:border-[#9EB3A8]/40'
                }`}
              >
                ← Back
              </button>

              <div className="flex items-center gap-3">
                {!canGoNext && (
                  <span className="text-xs text-[#9EB3A8] font-medium">
                    {step === 0 && 'Run or load a BTC curve to continue'}
                    {step === 1 && 'Run or load a network curve to continue'}
                    {step === 2 && 'Need at least 1 miner and 1 site'}
                    {step === 3 && 'Run a simulation to see results'}
                  </span>
                )}
                <button
                  onClick={goNext}
                  disabled={!canGoNext}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    canGoNext
                      ? 'bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] active:scale-[0.97] shadow-sm shadow-[#96EA7A]/20'
                      : 'bg-[#F2F2F2] text-[#9EB3A8] cursor-not-allowed'
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
