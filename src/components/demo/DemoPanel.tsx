'use client'

import { useDemo } from '@/context/demo-context'
import { useState } from 'react'

const DAY = 86400
const MONTH = 30 * DAY
const YEAR = 365 * DAY

export function DemoPanel() {
  const { state, vaults, deposits, skipTime, reset } = useDemo()
  const [open, setOpen] = useState(false)

  const offsetDays = Math.round(state.timeOffsetSeconds / DAY)
  const offsetMonths = Math.round(state.timeOffsetSeconds / MONTH)

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="bg-[#96EA7A] text-black px-4 py-2 rounded-full text-sm font-semibold shadow-lg hover:bg-[#7ed066] transition-colors"
        >
          Demo Mode
        </button>
      )}

      {open && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 w-[340px] shadow-2xl text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#96EA7A] uppercase tracking-wider">
              Demo Controls
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="text-[#666] hover:text-white text-lg leading-none"
            >
              x
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-[#222] rounded-lg p-2 text-center">
              <div className="text-xs text-[#888]">Vaults</div>
              <div className="text-lg font-bold">{vaults.length}</div>
            </div>
            <div className="bg-[#222] rounded-lg p-2 text-center">
              <div className="text-xs text-[#888]">Deposits</div>
              <div className="text-lg font-bold">{deposits.length}</div>
            </div>
            <div className="bg-[#222] rounded-lg p-2 text-center">
              <div className="text-xs text-[#888]">Time Offset</div>
              <div className="text-lg font-bold">
                {offsetMonths > 0 ? `+${offsetMonths}mo` : `${offsetDays}d`}
              </div>
            </div>
          </div>

          {/* Time Controls */}
          <div className="mb-4">
            <div className="text-xs text-[#888] mb-2 uppercase tracking-wider">Advance Time</div>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => skipTime(DAY)}
                className="bg-[#333] hover:bg-[#444] text-white text-xs py-2 rounded-lg transition-colors"
              >
                +1 Day
              </button>
              <button
                onClick={() => skipTime(7 * DAY)}
                className="bg-[#333] hover:bg-[#444] text-white text-xs py-2 rounded-lg transition-colors"
              >
                +1 Week
              </button>
              <button
                onClick={() => skipTime(MONTH)}
                className="bg-[#333] hover:bg-[#444] text-white text-xs py-2 rounded-lg transition-colors"
              >
                +1 Month
              </button>
              <button
                onClick={() => skipTime(6 * MONTH)}
                className="bg-[#333] hover:bg-[#444] text-white text-xs py-2 rounded-lg transition-colors"
              >
                +6 Months
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                onClick={() => skipTime(YEAR)}
                className="bg-[#333] hover:bg-[#444] text-white text-xs py-2 rounded-lg transition-colors"
              >
                +1 Year
              </button>
              <button
                onClick={() => skipTime(2 * YEAR)}
                className="bg-[#333] hover:bg-[#444] text-white text-xs py-2 rounded-lg transition-colors"
              >
                +2 Years
              </button>
              <button
                onClick={() => skipTime(3 * YEAR)}
                className="bg-[#333] hover:bg-[#444] text-white text-xs py-2 rounded-lg transition-colors"
              >
                +3 Years
              </button>
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={reset}
            className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs py-2 rounded-lg transition-colors border border-red-900/30"
          >
            Reset Demo (restore defaults)
          </button>
        </div>
      )}
    </div>
  )
}
