'use client'

import { Header } from '@/components/Header'
import SimStepper from '@/components/simulation/SimStepper'
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
      <div className="pt-16">
        <SimStepper current={step} completed={completed} onStepClick={handleStepClick} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
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
                  <span className="text-[11px] text-[#9EB3A8] font-medium">
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
      </div>
    </div>
  )
}
