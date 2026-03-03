'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback } from 'react'
import { ScrollReveal } from './ScrollReveal'

type FooterLink = { label: string; id?: string; href?: string }

const ANCHOR_LINKS: Record<string, FooterLink[]> = {
  Product: [
    { label: 'RWA Mining Vault', id: 'products' },
    { label: 'BTC Hedged Vault', id: 'products' },
    { label: 'Simulation', href: '/simulation' },
  ],
  Company: [
    { label: 'About', id: 'about' },
    { label: 'Security', id: 'security' },
    { label: 'Contact', id: 'contact' },
    { label: 'FAQ', id: 'faq' },
  ],
  Legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Documentation', href: '/docs' },
  ],
}

export function MarketingFooter() {
  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }, [])

  return (
    <footer className="relative bg-foreground text-white">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        {/* CTA */}
        <ScrollReveal className="py-24 border-b border-white/10">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
              Ready to be part of the future?
            </h2>
            <p className="text-white/40 text-lg mb-10 leading-relaxed">
              Join thousands of investors accessing institutional-grade returns through tokenized
              real-world assets.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-10 py-4 bg-hearst-green text-foreground rounded-full text-base font-bold hover:bg-hearst-green-dark transition-colors"
            >
              Start mining
            </Link>
          </div>
        </ScrollReveal>

        {/* Links */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
          <ScrollReveal delay={0}>
            <Image
              src="/Logo1.png"
              alt="Hearst"
              width={120}
              height={36}
              className="object-contain brightness-0 invert mb-4"
            />
            <p className="text-sm text-white/30 leading-relaxed max-w-xs">
              We make Crypto Mining More Sustainable. Institutional yield, accessible to everyone.
            </p>
          </ScrollReveal>

          {Object.entries(ANCHOR_LINKS).map(([category, links], i) => (
            <ScrollReveal key={category} delay={0.1 * (i + 1)}>
              <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-white/25 mb-5">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <Link
                        href={link.href}
                        className="text-sm text-white/50 hover:text-hearst-green transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : link.id ? (
                      <button
                        onClick={() => scrollTo(link.id!)}
                        className="text-sm text-white/50 hover:text-hearst-green transition-colors cursor-pointer"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <span className="text-sm text-white/50">{link.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom */}
        <div className="py-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} Hearst. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/25">
            <Link href="/terms" className="hover:text-white/50 transition-colors">
              Terms & conditions
            </Link>
            <Link href="/privacy" className="hover:text-white/50 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
