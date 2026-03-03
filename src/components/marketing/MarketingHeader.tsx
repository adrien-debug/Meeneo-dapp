'use client'

import { useAppKitSafe } from '@/hooks/useAppKitSafe'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'

const NAV_LINKS = [
  { label: 'About', id: 'about' },
  { label: 'Products', id: 'products' },
  { label: 'How it Works', id: 'how-it-works' },
  { label: 'Security', id: 'security' },
  { label: 'FAQ', id: 'faq' },
  { label: 'Contact', id: 'contact' },
] as const

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const { scrollY } = useScroll()
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()
  const { open } = useAppKitSafe()

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 60))

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          const sorted = visible.sort(
            (a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top),
          )
          setActiveSection(sorted[0].target.id)
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    )
    NAV_LINKS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top, behavior: 'smooth' })
      setMobileOpen(false)
    }
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.04)]' : 'bg-white'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center shrink-0 cursor-pointer"
            >
              <Image
                src="/Logo1.png"
                alt="Hearst"
                width={130}
                height={40}
                className="object-contain"
                priority
              />
            </button>

            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-full cursor-pointer ${
                    activeSection === link.id
                      ? 'text-foreground'
                      : 'text-foreground/45 hover:text-foreground'
                  }`}
                >
                  {link.label}
                  {activeSection === link.id && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-full bg-hearst-green/10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {isConnected && (
                <span className="hidden lg:block px-3 py-1.5 bg-surface-alt rounded-full text-xs font-mono text-foreground/50">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              )}

              <button
                onClick={() => (isConnected ? disconnect() : open())}
                className={`hidden lg:flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                  isConnected
                    ? 'bg-surface-alt text-foreground/60 hover:bg-foreground/[0.06]'
                    : 'bg-hearst-green text-foreground hover:bg-hearst-green-dark'
                }`}
              >
                {isConnected ? 'Disconnect' : 'Launch App'}
              </button>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2"
                aria-label="Menu"
              >
                <div className="w-6 h-5 flex flex-col justify-between">
                  <motion.span
                    animate={mobileOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                    className="block h-0.5 w-full bg-foreground origin-left"
                  />
                  <motion.span
                    animate={mobileOpen ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
                    className="block h-0.5 w-full bg-foreground"
                  />
                  <motion.span
                    animate={mobileOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                    className="block h-0.5 w-full bg-foreground origin-left"
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile */}
      <motion.div
        initial={false}
        animate={mobileOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-0 z-40 bg-white lg:hidden"
        style={{ pointerEvents: mobileOpen ? 'auto' : 'none' }}
      >
        <div className="flex flex-col items-center justify-center h-full gap-6 pt-20">
          {NAV_LINKS.map((link, i) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: 20 }}
              animate={mobileOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: i * 0.05 + 0.1 }}
            >
              <button
                onClick={() => scrollTo(link.id)}
                className={`text-2xl font-semibold ${activeSection === link.id ? 'text-hearst-green' : 'text-foreground'}`}
              >
                {link.label}
              </button>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={mobileOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <button
              onClick={() => {
                isConnected ? disconnect() : open()
                setMobileOpen(false)
              }}
              className="px-8 py-3 bg-hearst-green text-foreground rounded-full text-base font-semibold"
            >
              {isConnected ? 'Disconnect' : 'Launch App'}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </>
  )
}
