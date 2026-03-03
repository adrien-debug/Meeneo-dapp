'use client'

import { useDemo } from '@/context/demo-context'
import { base } from '@reown/appkit/networks'
import { useAppKitSafe } from '@/hooks/useAppKitSafe'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'My Vaults', href: '/my-vaults' },
  { label: 'Invest', href: '/subscribe' },
] as const

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { open } = useAppKitSafe()
  const { isDemoMode } = useDemo()
  const pathname = usePathname()

  const authed = isConnected || isDemoMode
  const isOnBase = chain?.id === base.id

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-foreground/[0.04]">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          <Link href={authed ? '/dashboard' : '/login'} className="flex items-center shrink-0">
            <Image
              src="/Logo1.png"
              alt="Hearst"
              width={120}
              height={36}
              className="object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={authed ? item.href : '/login'}
                className={`px-5 py-2 rounded-full text-sm font-medium tracking-wide transition-all ${pathname === item.href ? 'bg-hearst-green text-foreground' : 'text-muted hover:text-foreground hover:bg-surface-alt'}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {isConnected && (
              <div className="hidden sm:flex items-center gap-2">
                <div
                  className={`px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${isOnBase ? 'bg-muted/15 text-muted' : 'bg-foreground/15 text-foreground'}`}
                >
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnBase ? 'bg-muted' : 'bg-foreground'}`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${isOnBase ? 'bg-muted' : 'bg-foreground'}`}
                    />
                  </span>
                  {isOnBase ? 'Base' : 'Wrong'}
                </div>
                <div className="px-2.5 py-1.5 bg-surface-alt rounded-full text-xs font-mono text-muted">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
              </div>
            )}

            <button
              onClick={() => (isConnected ? disconnect() : open())}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${authed ? 'bg-surface-alt text-muted hover:bg-hearst-green-light hover:text-foreground border border-muted/30' : 'bg-hearst-green text-foreground hover:bg-hearst-green-dark'}`}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-surface-alt transition-colors"
              aria-label="Menu"
            >
              <svg
                className="w-5 h-5 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-2 border-t border-muted/20">
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={authed ? item.href : '/login'}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors ${pathname === item.href ? 'bg-hearst-green text-foreground' : 'text-muted hover:text-foreground hover:bg-surface-alt'}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
