'use client'

import type { TxSimState } from '@/hooks/useSimulatedTransaction'
import Image from 'next/image'
import { CARD } from './constants'

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  return `${seconds}s`
}

function formatAmount(raw: string | undefined): string {
  if (!raw) return ''
  const n = parseFloat(raw)
  if (isNaN(n)) return raw
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

const CIRCUMFERENCE = 2 * Math.PI * 54

export function TransactionProgress({
  state,
  amount,
  onClose,
}: {
  state: TxSimState
  amount?: string
  onClose?: () => void
}) {
  if (state.status === 'idle') return null

  const currentStep = state.steps[state.currentStepIndex]
  const totalSteps = state.steps.length
  const isDone = state.status === 'done'
  const isWallet = state.status === 'wallet-prompt'
  const isConfirming = state.status === 'confirming'

  const strokeOffset = CIRCUMFERENCE - (state.progress / 100) * CIRCUMFERENCE

  return (
    <div className="fixed inset-0 bg-[#0E0F0F]/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div
        className={`${CARD} w-full max-w-sm p-0 overflow-hidden`}
        style={{ animation: 'txModalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both' }}
      >
        <div className="p-8 flex flex-col items-center">
          {/* ─── Circular gauge with H logo ─── */}
          <div className="relative w-32 h-32 mb-6">
            {/* Glow behind on confirming */}
            {(isConfirming || isDone) && (
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: isDone
                    ? 'radial-gradient(circle, rgba(150,234,122,0.3) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(150,234,122,0.15) 0%, transparent 70%)',
                  animation: isDone ? 'none' : 'txPulseGlow 2s ease-in-out infinite',
                }}
              />
            )}

            {/* Track circle */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#F2F2F2" strokeWidth="5" />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={isDone ? '#96EA7A' : '#96EA7A'}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeOffset}
                style={{
                  transition: 'stroke-dashoffset 0.08s linear',
                  filter: isConfirming ? 'drop-shadow(0 0 6px rgba(150,234,122,0.5))' : 'none',
                }}
              />
            </svg>

            {/* Center H logo inside gauge circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg ${
                  isWallet ? 'animate-pulse' : ''
                }`}
                style={
                  isDone
                    ? { animation: 'txBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both' }
                    : undefined
                }
              >
                <Image
                  src="/assets/tokens/hearst-logo.svg"
                  alt="Hearst logo"
                  width={36}
                  height={36}
                />
              </div>
            </div>

            {/* Percentage overlay */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
              <span className="text-xs font-black text-[#0E0F0F] bg-white px-2 py-0.5 rounded-full border border-[#9EB3A8]/20 shadow-sm tabular-nums">
                {Math.round(state.progress)}%
              </span>
            </div>
          </div>

          {/* ─── Status text ─── */}
          <p className="text-base font-bold text-[#0E0F0F] text-center mb-1">
            {isDone ? 'Transaction Confirmed' : (currentStep?.label ?? 'Processing')}
          </p>
          <p className="text-xs text-[#9EB3A8] text-center mb-1">
            {isWallet && 'Confirm in your wallet...'}
            {isConfirming && 'Confirming on Base network...'}
            {isDone && 'Successfully processed'}
            {state.status === 'error' && (state.error ?? 'Transaction failed')}
          </p>

          {/* Amount + timer */}
          <div className="flex items-center gap-3 mt-3 mb-5">
            {amount && (
              <span className="text-xl font-black text-[#0E0F0F]">{formatAmount(amount)}</span>
            )}
            <span className="text-xs text-[#9EB3A8] font-mono tabular-nums bg-[#F2F2F2] px-2 py-1 rounded-lg">
              {formatElapsed(state.elapsedMs)}
            </span>
          </div>

          {/* ─── Step progress ─── */}
          {totalSteps > 1 && (
            <div className="w-full flex items-center gap-0 mb-5">
              {state.steps.map((step, i) => {
                const isComplete = i < state.currentStepIndex || isDone
                const isCurrent = i === state.currentStepIndex && !isDone
                return (
                  <div key={step.id} className="flex-1 flex items-center">
                    {/* Step dot */}
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
                          isComplete
                            ? 'bg-[#96EA7A] text-[#0E0F0F] shadow-md shadow-[#96EA7A]/30'
                            : isCurrent
                              ? 'bg-[#0E0F0F] text-white ring-4 ring-[#96EA7A]/20'
                              : 'bg-[#F2F2F2] text-[#9EB3A8]'
                        }`}
                      >
                        {isComplete ? (
                          <svg
                            className="w-3.5 h-3.5"
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
                        className={`text-caption font-semibold mt-1.5 text-center leading-tight ${
                          isComplete || isCurrent ? 'text-[#0E0F0F]' : 'text-[#9EB3A8]'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {/* Connector line */}
                    {i < totalSteps - 1 && (
                      <div className="h-0.5 flex-1 mx-1 rounded-full overflow-hidden bg-[#F2F2F2] -mt-5">
                        <div
                          className="h-full bg-[#96EA7A] rounded-full transition-all duration-100 ease-linear"
                          style={{
                            width: isComplete ? '100%' : isCurrent ? `${state.progress}%` : '0%',
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ─── Tx hash ─── */}
          <div className="w-full flex items-center gap-2 bg-[#0E0F0F]/[0.03] rounded-xl px-3 py-2.5">
            <div className="w-4 h-4 rounded-full bg-[#96EA7A]/20 flex items-center justify-center shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#96EA7A]" />
            </div>
            <span className="text-caption font-mono text-[#0E0F0F]/60 truncate flex-1">
              0x{Array.from({ length: 16 }, (_, i) => ((i * 7 + 3) % 16).toString(16)).join('')}...
            </span>
            <span className="text-caption font-bold text-[#9EB3A8] bg-white px-1.5 py-0.5 rounded-md border border-[#9EB3A8]/15">
              Base
            </span>
          </div>

          {/* ─── Done button ─── */}
          {isDone && onClose && (
            <button
              onClick={onClose}
              className="w-full h-12 mt-4 rounded-2xl text-sm font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] shadow-lg shadow-[#96EA7A]/20 transition-all active:scale-[0.97]"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
