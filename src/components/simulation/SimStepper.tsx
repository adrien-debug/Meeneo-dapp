'use client'

const STEPS = [
  { label: 'BTC Curve', short: '1' },
  { label: 'Network', short: '2' },
  { label: 'Miners', short: '3' },
  { label: 'Config', short: '4' },
  { label: 'Results', short: '5' },
] as const

interface SimStepperProps {
  current: number
  completed: boolean[]
  onStepClick: (step: number) => void
}

export default function SimStepper({ current, completed, onStepClick }: SimStepperProps) {
  return (
    <div className="w-full bg-white border-b border-[#9EB3A8]/20 sticky top-16 z-30">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => {
            const isDone = completed[i]
            const isActive = current === i
            const isClickable = isDone || i <= current

            return (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                {/* Step circle + label */}
                <button
                  onClick={() => isClickable && onStepClick(i)}
                  disabled={!isClickable}
                  className={`flex flex-col items-center gap-1.5 group transition-all ${
                    isClickable ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isDone
                        ? 'bg-[#96EA7A] text-[#0E0F0F] shadow-sm shadow-[#96EA7A]/20'
                        : isActive
                          ? 'bg-[#96EA7A] text-[#0E0F0F] ring-4 ring-[#96EA7A]/20 shadow-sm shadow-[#96EA7A]/20'
                          : 'bg-[#F2F2F2] text-[#9EB3A8]'
                    }`}
                  >
                    {isDone ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.short
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                      isActive ? 'text-[#0E0F0F]' : isDone ? 'text-[#96EA7A]' : 'text-[#9EB3A8]'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>

                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="flex-1 mx-2 mt-[-18px]">
                    <div
                      className={`h-[2px] rounded-full transition-colors ${
                        completed[i] ? 'bg-[#96EA7A]' : 'bg-[#F2F2F2]'
                      }`}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
