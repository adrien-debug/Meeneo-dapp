'use client'

import { useCallback, useRef, useState } from 'react'

export type TxStepId = 'approve' | 'deposit' | 'withdraw' | 'claim'

export interface TxStep {
  id: TxStepId
  label: string
  durationMs: number
}

export type TxSimStatus = 'idle' | 'wallet-prompt' | 'confirming' | 'done' | 'error'

export interface TxSimState {
  status: TxSimStatus
  currentStepIndex: number
  steps: TxStep[]
  progress: number
  elapsedMs: number
  error: string | null
}

const STEP_PRESETS: Record<TxStepId, { label: string; durationMs: number }> = {
  approve: { label: 'USDC Approval', durationMs: 3200 },
  deposit: { label: 'Deposit Transaction', durationMs: 4800 },
  withdraw: { label: 'Withdraw Transaction', durationMs: 4200 },
  claim: { label: 'Claim Rewards', durationMs: 3600 },
}

const WALLET_PROMPT_MS = 1800

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function useSimulatedTransaction() {
  const [state, setState] = useState<TxSimState>({
    status: 'idle',
    currentStepIndex: 0,
    steps: [],
    progress: 0,
    elapsedMs: 0,
    error: null,
  })

  const animRef = useRef<number | null>(null)
  const abortRef = useRef(false)

  const cleanup = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
  }, [])

  const runStep = useCallback((stepIndex: number, steps: TxStep[], onComplete: () => void) => {
    if (abortRef.current || stepIndex >= steps.length) {
      onComplete()
      return
    }

    const step = steps[stepIndex]

    setState((s) => ({
      ...s,
      status: 'wallet-prompt',
      currentStepIndex: stepIndex,
      progress: 0,
      elapsedMs: 0,
    }))

    const walletStart = performance.now()

    const walletPhase = () => {
      if (abortRef.current) return
      const elapsed = performance.now() - walletStart
      if (elapsed < WALLET_PROMPT_MS) {
        const t = Math.min(1, elapsed / WALLET_PROMPT_MS)
        setState((s) => ({
          ...s,
          progress: easeInOutCubic(t) * 15,
          elapsedMs: Math.round(elapsed),
        }))
        animRef.current = requestAnimationFrame(walletPhase)
      } else {
        runConfirmPhase(stepIndex, steps, step, onComplete)
      }
    }

    animRef.current = requestAnimationFrame(walletPhase)
  }, [])

  const runConfirmPhase = useCallback(
    (stepIndex: number, steps: TxStep[], step: TxStep, onComplete: () => void) => {
      setState((s) => ({ ...s, status: 'confirming' }))

      const confirmStart = performance.now()
      const confirmDuration = step.durationMs

      const tick = () => {
        if (abortRef.current) return
        const elapsed = performance.now() - confirmStart
        const t = Math.min(1, elapsed / confirmDuration)
        const pct = 15 + easeInOutCubic(t) * 85

        setState((s) => ({
          ...s,
          progress: pct,
          elapsedMs: Math.round(elapsed + WALLET_PROMPT_MS),
        }))

        if (elapsed < confirmDuration) {
          animRef.current = requestAnimationFrame(tick)
        } else {
          setState((s) => ({ ...s, progress: 100 }))
          setTimeout(() => {
            if (abortRef.current) return
            if (stepIndex + 1 < steps.length) {
              runStep(stepIndex + 1, steps, onComplete)
            } else {
              setState((s) => ({ ...s, status: 'done', progress: 100 }))
              onComplete()
            }
          }, 400)
        }
      }

      animRef.current = requestAnimationFrame(tick)
    },
    [runStep],
  )

  const execute = useCallback(
    (stepIds: TxStepId[], onComplete: () => void) => {
      cleanup()
      abortRef.current = false

      const steps: TxStep[] = stepIds.map((id) => ({
        id,
        ...STEP_PRESETS[id],
      }))

      setState({
        status: 'wallet-prompt',
        currentStepIndex: 0,
        steps,
        progress: 0,
        elapsedMs: 0,
        error: null,
      })

      runStep(0, steps, onComplete)
    },
    [cleanup, runStep],
  )

  const reset = useCallback(() => {
    cleanup()
    abortRef.current = true
    setState({
      status: 'idle',
      currentStepIndex: 0,
      steps: [],
      progress: 0,
      elapsedMs: 0,
      error: null,
    })
  }, [cleanup])

  return { state, execute, reset }
}
