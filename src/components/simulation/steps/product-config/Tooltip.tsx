export function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 cursor-help inline-flex items-center">
      <svg
        className="w-3.5 h-3.5 text-[#9EB3A8] hover:text-[#0E0F0F] transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl bg-white border border-[#9EB3A8]/20 px-3 py-2 text-[10px] text-[#0E0F0F] leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
        {text}
      </span>
    </span>
  )
}
