'use client'

import { base } from '@reown/appkit/networks'
import { useAppKit } from '@reown/appkit/react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'

const NAVIGATION = [
  { name: 'Portfolio', href: '/dashboard', authRequired: true },
  { name: 'Vaults', href: '/vault/hearst-vault', authRequired: true },
  { name: 'Admin', href: '/admin', authRequired: true },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { open } = useAppKit()
  const pathname = usePathname()

  const navItems = NAVIGATION.map((item) => ({
    ...item,
    href: item.authRequired && !isConnected ? '/login' : item.href,
  }))

  const isOnBase = chain?.id === base.id
  const isActive = (href: string) => {
    if (href.startsWith('/vault')) return pathname.startsWith('/vault')
    return pathname === href
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#9EB3A8]/20">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href={isConnected ? '/dashboard' : '/login'} className="flex items-center">
            <Image src="/assets/tokens/hearst-logo.png" alt="Hearst" width={110} height={34} className="object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-1.5 rounded-full text-sm font-medium tracking-wide transition-all ${isActive(item.href)
                  ? 'bg-[#96EA7A] text-[#0E0F0F]'
                  : 'text-[#9EB3A8] hover:text-[#0E0F0F] hover:bg-[#F2F2F2]'
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {isConnected && (
              <div className="hidden sm:flex items-center gap-2">
                <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${isOnBase
                  ? 'bg-[#9EB3A8]/15 text-[#9EB3A8]'
                  : 'bg-[#0E0F0F]/15 text-[#0E0F0F]'
                  }`}>
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnBase ? 'bg-[#9EB3A8]' : 'bg-[#0E0F0F]'}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnBase ? 'bg-[#9EB3A8]' : 'bg-[#0E0F0F]'}`} />
                  </span>
                  {isOnBase ? 'Base' : 'Wrong'}
                </div>
                <div className="px-3 py-1 bg-[#F2F2F2] rounded-full text-xs font-mono text-[#9EB3A8]">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
              </div>
            )}

            <button
              onClick={() => isConnected ? disconnect() : open()}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${isConnected
                ? 'bg-[#F2F2F2] text-[#9EB3A8] hover:bg-[#E6F1E7] hover:text-[#0E0F0F] border border-[#9EB3A8]'
                : 'bg-gradient-to-r from-[#96EA7A] to-[#7ED066] text-[#0E0F0F] hover:from-[#7ED066] hover:to-[#7ED066] shadow-sm shadow-[#96EA7A]/20'
                }`}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-1.5 rounded-md hover:bg-[#F2F2F2] transition-colors"
              aria-label="Menu"
            >
              <svg className="w-5 h-5 text-[#9EB3A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-2 border-t border-[#9EB3A8]/20">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-3 py-2 rounded-2xl text-sm font-medium transition-colors ${isActive(item.href)
                    ? 'bg-[#96EA7A] text-[#0E0F0F]'
                    : 'text-[#9EB3A8] hover:text-[#0E0F0F] hover:bg-[#F2F2F2]'
                    }`}
                >
                  {item.name}
                </Link>
              ))}

              {isConnected && (
                <>
                  <div className="border-t border-[#9EB3A8]/20 my-1" />
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${isOnBase ? 'bg-[#9EB3A8]/15 text-[#9EB3A8]' : 'bg-[#0E0F0F]/15 text-[#0E0F0F]'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${isOnBase ? 'bg-[#9EB3A8]' : 'bg-[#0E0F0F]'}`} />
                    {isOnBase ? 'Base' : chain?.name || 'Wrong Network'}
                  </div>
                  <div className="px-3 py-1.5 bg-[#F2F2F2] rounded-lg text-xs font-mono text-[#9EB3A8] break-all">
                    {address}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
