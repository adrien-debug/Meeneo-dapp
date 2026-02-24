'use client'

import { Header } from '@/components/Header'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SIM_NAV = [
  { href: '/simulation', label: 'Overview', icon: '◎', short: '0' },
  { href: '/simulation/btc-price-curve', label: 'BTC Price Curve', icon: '₿', short: '1' },
  { href: '/simulation/network-curve', label: 'Network Curve', icon: '⛏', short: '2' },
  { href: '/simulation/miners-hosting', label: 'Miners & Hosting', icon: '⚡', short: '3' },
  { href: '/simulation/product-config', label: 'Product Config', icon: '⚙', short: '4' },
  { href: '/simulation/results', label: 'Results', icon: '📊', short: '5' },
] as const

export default function SimulationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Header />
      <div className="flex pt-16">
        {/* Sidebar */}
        <nav className="hidden lg:flex w-56 flex-shrink-0 flex-col fixed top-16 bottom-0 bg-white border-r border-[#9EB3A8]/20 z-40">
          <div className="px-4 py-4 border-b border-[#9EB3A8]/10">
            <h2 className="text-sm font-black text-[#0E0F0F] tracking-wide">HEARST CONNECT</h2>
            <p className="text-[10px] text-[#9EB3A8] mt-0.5">Mining Analytics Platform</p>
          </div>
          <div className="flex-1 py-2 overflow-auto">
            {SIM_NAV.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#96EA7A]/10 text-[#0E0F0F] border-r-2 border-[#96EA7A]'
                      : 'text-[#9EB3A8] hover:text-[#0E0F0F] hover:bg-[#F2F2F2]'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-[#96EA7A] text-[#0E0F0F]' : 'bg-[#F2F2F2] text-[#9EB3A8]'
                  }`}>
                    {item.short}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </div>
          <div className="px-4 py-3 border-t border-[#9EB3A8]/10 text-[10px] text-[#9EB3A8]">
            <div>Powered by Hearst Connect API</div>
            <div>v1.0.0</div>
          </div>
        </nav>

        {/* Mobile nav */}
        <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-white border-b border-[#9EB3A8]/20 overflow-x-auto">
          <div className="flex gap-1 px-4 py-2">
            {SIM_NAV.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive ? 'bg-[#96EA7A] text-[#0E0F0F]' : 'text-[#9EB3A8] hover:bg-[#F2F2F2]'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 lg:ml-56 pt-0 lg:pt-0 mt-12 lg:mt-0">
          {children}
        </main>
      </div>
    </div>
  )
}
