'use client'

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#9EB3A8]/20 border-t-[#96EA7A] rounded-full animate-spin" />
        <p className="text-sm text-[#9EB3A8] font-medium">Loading...</p>
      </div>
    </div>
  )
}
