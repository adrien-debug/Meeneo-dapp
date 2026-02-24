'use client'

export function ProgressRing({ percent, color, size = 48 }: { percent: number; color: string; size?: number }) {
  const strokeWidth = 3.5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#F2F2F2" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-700"
      />
    </svg>
  )
}
