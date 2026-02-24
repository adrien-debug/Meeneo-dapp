'use client'

import { CARD } from '@/components/ui/constants'
import { simulationApi } from '@/lib/simulation-api'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const TOOLS = [
  {
    href: '/simulation/btc-price-curve',
    short: '1',
    title: 'BTC Price Curve',
    desc: 'Generate deterministic or ML-forecast BTC price scenarios over 36–120 months.',
    color: '#E8A838',
  },
  {
    href: '/simulation/network-curve',
    short: '2',
    title: 'Network Curve',
    desc: 'Model network difficulty, hashrate, fees, and hashprice evolution.',
    color: '#5B7A6E',
  },
  {
    href: '/simulation/miners-hosting',
    short: '3',
    title: 'Miners & Hosting',
    desc: 'Manage miner catalog (ASIC specs) and hosting sites (electricity, uptime).',
    color: '#9EB3A8',
  },
  {
    href: '/simulation/product-config',
    short: '4',
    title: 'Product Config',
    desc: '3-bucket capital allocation: Yield, BTC Holding, Mining. Run bear/base/bull simulation.',
    color: '#96EA7A',
  },
  {
    href: '/simulation/results',
    short: '5',
    title: 'Results',
    desc: 'View past simulation runs with full scenario comparison, charts, and waterfall detail.',
    color: '#0E0F0F',
  },
]

export default function SimulationOverview() {
  const [apiOk, setApiOk] = useState<boolean | null>(null)

  useEffect(() => {
    simulationApi.health().then(() => setApiOk(true)).catch(() => setApiOk(false))
  }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#0E0F0F] tracking-tight mb-1">Simulation Tools</h1>
        <p className="text-sm text-[#9EB3A8]">
          Full-stack mining analytics — model BTC prices, network economics, and run 36-month product simulations.
        </p>
        <div className="flex items-center gap-2 mt-3">
          <div className={`w-2 h-2 rounded-full ${apiOk === true ? 'bg-[#96EA7A]' : apiOk === false ? 'bg-red-500' : 'bg-[#9EB3A8] animate-pulse'}`} />
          <span className="text-xs text-[#9EB3A8] font-medium">
            {apiOk === true ? 'API Connected' : apiOk === false ? 'API Offline' : 'Checking...'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map(tool => (
          <Link key={tool.href} href={tool.href}>
            <div className={`${CARD} p-5 h-full hover:border-[#96EA7A]/40 hover:shadow-lg hover:shadow-[#96EA7A]/5 transition-all group cursor-pointer`}>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
                  style={{ backgroundColor: tool.color }}
                >
                  {tool.short}
                </span>
                <h3 className="text-sm font-bold text-[#0E0F0F] group-hover:text-[#96EA7A] transition-colors">{tool.title}</h3>
              </div>
              <p className="text-xs text-[#9EB3A8] leading-relaxed">{tool.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className={`${CARD} p-5 mt-6`}>
        <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider mb-3">Workflow</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#0E0F0F]">
          {['BTC Curve', 'Network Curve', 'Miners & Hosting', 'Product Config', 'Results'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-[#F2F2F2] font-bold">{step}</span>
              {i < 4 && <span className="text-[#9EB3A8]">→</span>}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#9EB3A8] mt-2">
          Generate curves first (steps 1-2), configure miners/hosting (step 3), then run the full product simulation (step 4) and analyze results (step 5).
        </p>
      </div>
    </div>
  )
}
