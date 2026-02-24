'use client'

interface SimToggleProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  hint?: string
  disabled?: boolean
}

export default function SimToggle({
  label,
  value,
  onChange,
  options,
  hint,
  disabled,
}: SimToggleProps) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
        {label}
      </label>
      <div className="inline-flex gap-1 w-full">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
              value === opt.value
                ? 'bg-[#96EA7A] text-[#0E0F0F]'
                : 'bg-white text-[#9EB3A8] border border-[#9EB3A8]/20 hover:bg-[#F2F2F2]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {hint && <p className="text-[10px] text-[#9EB3A8]">{hint}</p>}
    </div>
  )
}
