'use client'

interface SimInputProps {
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: 'text' | 'number'
  min?: number
  max?: number
  step?: number
  hint?: string
  disabled?: boolean
}

export default function SimInput({ label, value, onChange, type = 'text', min, max, step, hint, disabled }: SimInputProps) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-full h-9 px-3 rounded-xl border border-[#9EB3A8]/20 bg-[#F2F2F2] text-[#0E0F0F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#96EA7A] focus:border-transparent transition-all disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {hint && <p className="text-[10px] text-[#9EB3A8]">{hint}</p>}
    </div>
  )
}
