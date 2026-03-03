'use client'

import { AnimatedCounter } from '@/components/marketing/AnimatedCounter'
import { FAQItem } from '@/components/marketing/FAQAccordion'
import { FeatureCardCanvas } from '@/components/marketing/FeatureCardCanvas'
import { MagneticButton } from '@/components/marketing/MagneticButton'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { ScrollReveal } from '@/components/marketing/ScrollReveal'
import { StepFlowCanvas } from '@/components/marketing/StepFlowCanvas'
import { useAppKitSafe } from '@/hooks/useAppKitSafe'
import { motion, useScroll, useTransform } from 'framer-motion'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useAccount } from 'wagmi'

const EnergyGlobeDynamic = dynamic(
  () => import('@/components/marketing/EnergyGlobe').then((m) => m.EnergyGlobe),
  { ssr: false },
)

const SecurityShieldDynamic = dynamic(
  () => import('@/components/marketing/SecurityShieldCanvas').then((m) => m.SecurityShieldCanvas),
  { ssr: false },
)

function SecurityVideoBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/assets/hero/security-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-white/40" />
    </div>
  )
}

const FAQWaveDynamic = dynamic(
  () => import('@/components/marketing/FAQWaveCanvas').then((m) => m.FAQWaveCanvas),
  { ssr: false },
)

const ContactMeshDynamic = dynamic(
  () => import('@/components/marketing/ContactMeshCanvas').then((m) => m.ContactMeshCanvas),
  { ssr: false },
)

function ContactVideoBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/assets/hero/contact-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-white/40" />
    </div>
  )
}

/* ═══════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════ */

const STATS = [
  { value: 26.3, prefix: '$', suffix: 'M+', label: 'Total Value Locked', decimals: 1 },
  { value: 15, suffix: '%', label: 'Average APY', decimals: 0 },
  { value: 2, suffix: '', label: 'Active Vaults', decimals: 0 },
  { value: 100, suffix: '%', label: 'On-Chain Transparent', decimals: 0 },
]

const FEATURES = [
  {
    title: 'Real World Assets',
    description:
      'Institutional-grade Bitcoin mining infrastructure tokenized on-chain. Real hashrate, real energy, real yield.',
    icon: 'M16 8v16M8 16h16',
  },
  {
    title: 'Sustainable Yield',
    description:
      'Green energy-powered mining farms generating consistent returns. No speculation, no leverage — pure operational yield.',
    icon: 'M10 22l4-8 4 4 4-10',
  },
  {
    title: 'Monthly Yield',
    description:
      'Earn monthly yield from day one. Capital is returned when the cumulative target is reached or at 3-year maturity.',
    icon: 'M16 10v4l3 3M24 16a8 8 0 11-16 0 8 8 0 0116 0z',
  },
  {
    title: 'On-Chain Transparency',
    description:
      'Every transaction, every yield distribution — verified and visible on Base network.',
    icon: 'M12 16l3 3 5-6M24 16a8 8 0 11-16 0 8 8 0 0116 0z',
  },
]

const VAULTS = [
  {
    name: 'RWA Mining Vault',
    tag: 'Flagship',
    apy: '12–15%',
    tvl: 18.5,
    risk: 'Medium',
    description:
      'Direct exposure to tokenized Bitcoin mining hashrate. Real machines, real energy, real BTC rewards.',
    features: [
      'Tokenized hashrate',
      'Green energy powered',
      'Monthly yield distribution',
      '$250K minimum deposit',
    ],
    color: '#96EA7A',
  },

  {
    name: 'BTC Hedged Vault',
    tag: 'Advanced',
    apy: '10–13%',
    tvl: 2.6,
    risk: 'Medium-High',
    description:
      'Mining yield with integrated BTC price hedging. Captures mining upside while managing volatility.',
    features: ['Price hedging', 'Mining exposure', 'Risk-adjusted returns', 'Dynamic rebalancing'],
    color: '#F7931A',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Connect Your Wallet',
    description:
      'Use WalletConnect, MetaMask, Coinbase Wallet, or Ledger. One click, instant connection.',
  },
  {
    n: '02',
    title: 'Choose Your Strategy',
    description: 'Browse two institutional-grade vaults, each with different risk-return profiles.',
  },
  {
    n: '03',
    title: 'Deposit USDC',
    description:
      'Deposit USDC on Base network. Institutional minimums apply depending on the selected vault.',
  },
  {
    n: '04',
    title: 'Earn Real Yield',
    description:
      'Your USDC is deployed into real Bitcoin mining operations. Monthly yield, withdrawable at maturity or when the target return is reached.',
  },
]

const SECURITY_ITEMS = [
  {
    title: 'Fireblocks Custody',
    description: 'MPC-CMP key management, SOC 2 Type II certified, $30B+ assets secured.',
    icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z',
  },
  {
    title: 'Audited Smart Contracts',
    description: 'Independent third-party audits, formal verification, and bug bounty program.',
    icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  },
  {
    title: 'Multi-Sig Governance',
    description: '3-of-5 multi-sig, timelock on upgrades, and emergency pause capability.',
    icon: 'M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z',
  },
  {
    title: '24/7 Monitoring',
    description: 'Automated on-chain monitoring, anomaly detection, and instant incident response.',
    icon: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605',
  },
]

const FAQ_DATA = [
  {
    q: 'What is Hearst?',
    a: 'Hearst is a DeFi platform that tokenizes institutional Bitcoin mining operations on the Base network. We provide transparent, sustainable yield backed by real-world infrastructure.',
  },
  {
    q: 'How is the yield generated?',
    a: 'Yield comes from real Bitcoin mining operations. USDC deposited into vaults funds mining infrastructure. The BTC mined is converted and distributed as yield to vault shareholders.',
  },
  {
    q: 'What are the minimum deposit requirements?',
    a: 'Minimum deposit requirements vary by vault — starting from $250,000 USDC for our institutional vaults. Each vault page displays the applicable minimum.',
  },
  {
    q: 'Are there any lock-up periods?',
    a: 'Yes. Vaults have a 3-year lock period. You can withdraw your principal when the cumulative yield target (36%) is reached or at maturity, whichever comes first. Yield is claimable monthly.',
  },
  {
    q: 'How are my assets secured?',
    a: 'Multiple layers: Fireblocks institutional custody with MPC key management, audited smart contracts, multi-signature governance (3-of-5), and 24/7 on-chain monitoring.',
  },
  {
    q: 'Which wallets are supported?',
    a: 'We support all major wallets through WalletConnect protocol, including MetaMask, Coinbase Wallet, Ledger, Trust Wallet, Rainbow, and 300+ others.',
  },
  {
    q: 'What token do I need?',
    a: 'You need USDC (on Base network) for deposits and a small amount of ETH on Base for gas fees. Gas fees are typically under $0.01 per transaction.',
  },
  {
    q: 'Is Hearst non-custodial?',
    a: 'Yes. Hearst is fully non-custodial. Your wallet connects directly to our smart contracts. We never hold your private keys.',
  },
]

const HERO_WORDS = [
  'Sustainable',
  'Efficient',
  'Secure',
  'Profitable',
  'Transparent',
  'Sustainable',
]

const FEATURE_VARIANTS = ['rwa', 'yield', 'monthly', 'transparent'] as const

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

function FeatureCard({ feature, index }: { feature: (typeof FEATURES)[0]; index: number }) {
  const [hovered, setHovered] = useState(false)
  const variant = FEATURE_VARIANTS[index % FEATURE_VARIANTS.length]

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative overflow-hidden rounded-2xl p-6 border transition-all duration-500 cursor-default"
      style={{
        backgroundColor: hovered ? 'rgba(150,234,122,0.03)' : 'rgb(247,247,248)',
        borderColor: hovered ? 'rgba(150,234,122,0.3)' : 'rgba(14,15,15,0.04)',
        boxShadow: hovered
          ? '0 0 32px rgba(150,234,122,0.08), 0 4px 24px rgba(0,0,0,0.04)'
          : 'none',
      }}
    >
      <FeatureCardCanvas hovered={hovered} variant={variant} />
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-hearst-green/10 flex items-center justify-center mb-5">
          <svg
            className="w-6 h-6 text-hearst-green"
            fill="none"
            viewBox="0 0 32 32"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={feature.icon} />
          </svg>
        </div>
        <h3 className="text-[1.2rem] font-medium mb-2">{feature.title}</h3>
        <p className="text-[1rem] text-foreground/40 leading-[1.5]">{feature.description}</p>
      </div>
    </motion.div>
  )
}

/* VaultCard — simple, no inner Three.js */

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.75], [1, 0.96])
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80])
  const { isConnected } = useAccount()
  const { open } = useAppKitSafe()
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [contactSent, setContactSent] = useState(false)
  const [globeTrigger, setGlobeTrigger] = useState(false)
  const globeFired = useRef(false)

  useEffect(() => {
    const el = aboutRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !globeFired.current) {
          globeFired.current = true
          setGlobeTrigger(true)
          setTimeout(() => setGlobeTrigger(false), 100)
        }
      },
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setContactSent(true)
    setTimeout(() => setContactSent(false), 3000)
    setContactForm({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden">
      <MarketingHeader />

      {/* ═══════════════════════════════════════
          HERO — White, clean
          ═══════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white"
      >
        {/* Animated DeFi background */}
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="absolute inset-0 pointer-events-none"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.6 }}
          >
            <source src="/assets/hero/blockchain-bg.mp4" type="video/mp4" />
          </video>
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 w-full flex flex-col items-center pt-20 pb-8"
        >
          {/* Live network badge */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-foreground/[0.08] bg-surface-alt mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hearst-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-hearst-green" />
            </span>
            <span className="text-[0.8rem] font-medium text-hearst-green tracking-[0.08em] uppercase">
              Live on Base Network
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.5 }}
            className="text-[2.5rem] md:text-[4rem] lg:text-[6rem] font-normal tracking-[-0.02em] leading-[1.0] text-foreground text-center mb-5 px-4"
          >
            Institutional Yield,
            <br />
            More{' '}
            <span className="text-hearst-green overflow-hidden h-[1.05em] inline-flex flex-col">
              <span className="animate-text-rotate flex flex-col">
                {HERO_WORDS.map((word, i) => (
                  <span key={i} className="h-[1.05em] flex items-center">
                    {word}
                  </span>
                ))}
              </span>
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="text-[1.1rem] md:text-[1.35rem] text-foreground/40 leading-[1.5] mb-10 text-center max-w-2xl px-4"
          >
            Real yield from tokenized Bitcoin mining infrastructure.
            <br className="hidden md:block" />
            No speculation, no leverage — pure operational returns.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="flex items-center gap-4 mb-16 flex-wrap justify-center px-4"
          >
            <MagneticButton
              onClick={() => (isConnected ? undefined : open())}
              className="px-7 py-3 bg-hearst-green text-foreground rounded-full text-[1.2rem] font-medium hover:bg-hearst-green-dark transition-colors cursor-pointer"
            >
              {isConnected ? 'Go to Dashboard' : 'Start Mining →'}
            </MagneticButton>
            <button
              onClick={() => {
                const el = document.getElementById('products')
                if (el) {
                  const top = el.getBoundingClientRect().top + window.scrollY
                  window.scrollTo({ top, behavior: 'smooth' })
                }
              }}
              className="px-7 py-3 rounded-full text-[1.2rem] font-medium text-foreground/40 border border-foreground/[0.1] hover:border-foreground/25 hover:text-foreground/70 transition-all cursor-pointer"
            >
              View Vaults
            </button>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="grid grid-cols-2 gap-4 md:flex md:items-center md:divide-x md:divide-foreground/[0.08] w-full max-w-3xl px-4"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="px-3 md:px-12 text-center">
                <div className="text-[1.4rem] md:text-[2.2rem] font-normal text-foreground tracking-[-0.01em] mb-1">
                  <AnimatedCounter
                    target={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                  />
                </div>
                <p className="text-[0.65rem] md:text-[0.85rem] text-foreground/30 font-normal tracking-wide">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════
          ABOUT — White
          ═══════════════════════════════════════ */}
      <section
        id="about"
        ref={aboutRef}
        className="relative lg:min-h-screen lg:flex lg:flex-col lg:justify-center bg-white overflow-hidden"
      >
        <EnergyGlobeDynamic trigger={globeTrigger} />
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12 md:py-16 lg:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 lg:gap-20 items-center">
            <ScrollReveal direction="left">
              <p className="text-[1rem] md:text-[1.2rem] font-medium text-hearst-green tracking-normal mb-3 md:mb-5">
                About Hearst
              </p>
              <h2 className="text-[1.6rem] md:text-[2.5rem] lg:text-[3rem] font-normal tracking-[-0.01em] leading-[1.2] mb-5 md:mb-8">
                Bridging real
                <br />
                infrastructure
                <br />
                and DeFi
              </h2>
              <p className="text-[0.95rem] md:text-[1.2rem] text-foreground/50 leading-[1.5] mb-4 md:mb-6">
                DeFi promised financial inclusion, but most yield today comes from unsustainable
                mechanisms. Hearst is different — we connect real-world Bitcoin mining operations to
                on-chain vaults.
              </p>
              <p className="text-[0.95rem] md:text-[1.2rem] text-foreground/50 leading-[1.5]">
                No speculation. No leverage. Just real operations generating real returns, powered
                by green energy and secured by institutional-grade infrastructure.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={0.2}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {FEATURES.map((f, i) => (
                  <FeatureCard key={f.title} feature={f} index={i} />
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PRODUCTS — White
          ═══════════════════════════════════════ */}
      <section
        id="products"
        className="relative lg:min-h-screen lg:flex lg:flex-col lg:justify-center bg-white overflow-hidden"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: 0.45 }}
          src="/assets/hero/products-bg.mp4"
        />
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12 md:py-16 lg:pt-24 lg:pb-12 relative z-10">
          <ScrollReveal className="text-center mb-6 sm:mb-8 lg:mb-12">
            <p className="text-[1rem] md:text-[1.2rem] font-medium text-hearst-green tracking-normal mb-3 md:mb-5">
              Products
            </p>
            <h2 className="text-[1.6rem] md:text-[2.5rem] lg:text-[3rem] font-normal tracking-[-0.01em] mb-4 md:mb-6 text-foreground">
              Discover our Vault Strategies
            </h2>
            <p className="text-[0.95rem] md:text-[1.2rem] text-foreground/40 max-w-2xl mx-auto leading-[1.5]">
              Choose the vault that matches your risk profile. All backed by real infrastructure.
            </p>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {VAULTS.map((vault, i) => (
              <ScrollReveal key={vault.name} delay={i * 0.15}>
                <motion.div whileHover={{ y: -6 }} className="group h-full">
                  <div className="relative p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-foreground/[0.06] bg-white/80 backdrop-blur-sm hover:border-hearst-green/20 hover:shadow-lg hover:shadow-hearst-green/[0.04] transition-all duration-500 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: `${vault.color}18`, color: vault.color }}
                      >
                        {vault.tag}
                      </span>
                      <span className="text-xs text-foreground/30 font-medium">
                        {vault.risk} Risk
                      </span>
                    </div>
                    <h3 className="text-[1.25rem] font-medium mb-1 text-foreground">
                      {vault.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-[2rem] font-normal" style={{ color: vault.color }}>
                        {vault.apy}
                      </span>
                      <span className="text-sm text-foreground/30 font-medium">APY</span>
                    </div>
                    <p className="text-sm text-foreground/40 leading-[1.5] mb-4 flex-grow">
                      {vault.description}
                    </p>
                    <div className="space-y-1.5 mb-4">
                      {vault.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <svg
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: vault.color }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-sm text-foreground/40">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-foreground/[0.06]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-foreground/30">TVL</span>
                        <span className="text-sm font-medium text-foreground">
                          <AnimatedCounter target={vault.tvl} prefix="$" suffix="M" decimals={1} />
                        </span>
                      </div>
                      <Link
                        href="/login"
                        className="block w-full py-2.5 rounded-xl text-center text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
                        style={{ backgroundColor: `${vault.color}14`, color: vault.color }}
                      >
                        Deposit Now
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOW IT WORKS — Dark + Bloom Canvas
          ═══════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="relative lg:min-h-screen lg:flex lg:flex-col lg:justify-center bg-white overflow-hidden"
      >
        <StepFlowCanvas />
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12 md:py-16 lg:py-20 relative z-10">
          <ScrollReveal className="text-center mb-8 sm:mb-12 lg:mb-20">
            <p className="text-[1rem] md:text-[1.2rem] font-medium text-hearst-green tracking-normal mb-3 md:mb-5">
              Getting Started
            </p>
            <h2 className="text-[1.6rem] md:text-[2.5rem] lg:text-[3rem] font-normal tracking-[-0.01em] text-foreground">
              Four steps to <span className="text-hearst-green">real yield</span>
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.n} delay={i * 0.12}>
                <motion.div whileHover={{ y: -8, scale: 1.015 }} className="relative group h-full">
                  <div className="relative flex flex-col h-full rounded-3xl border border-foreground/[0.06] bg-white/80 backdrop-blur-sm hover:border-hearst-green/25 hover:shadow-2xl hover:shadow-hearst-green/[0.08] transition-all duration-500 overflow-hidden">
                    {/* Number bar */}
                    <div className="px-7 md:px-8 pt-6 md:pt-7 pb-3 border-b border-foreground/[0.04]">
                      <span className="text-[3rem] md:text-[3.8rem] font-light leading-none text-hearst-green tracking-tight select-none">
                        {step.n}
                      </span>
                    </div>
                    {/* Content — flex-grow aligns titles */}
                    <div className="flex flex-col flex-1 px-7 md:px-8 pt-5 pb-7 md:pb-8">
                      <h3 className="text-[1.05rem] md:text-[1.15rem] font-semibold tracking-[-0.01em] text-foreground mb-2.5">
                        {step.title}
                      </h3>
                      <p className="text-[0.88rem] md:text-[0.92rem] text-foreground/40 leading-[1.7] font-normal mt-auto">
                        {step.description}
                      </p>
                    </div>
                    {/* Bottom accent line on hover */}
                    <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-hearst-green/0 via-hearst-green/30 to-hearst-green/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECURITY — White (transition from dark)
          ═══════════════════════════════════════ */}
      <section
        id="security"
        className="relative lg:min-h-screen lg:flex lg:flex-col lg:justify-center bg-white overflow-hidden"
      >
        <SecurityVideoBg />
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12 md:py-16 lg:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 lg:gap-20 items-center">
            <ScrollReveal direction="left">
              <p className="text-[1rem] md:text-[1.2rem] font-medium text-hearst-green tracking-normal mb-3 md:mb-5">
                Security First
              </p>
              <h2 className="text-[1.6rem] md:text-[2.5rem] lg:text-[3rem] font-normal tracking-[-0.01em] mb-4 md:mb-6 leading-[1.2]">
                Built for
                <br />
                institutional trust
              </h2>
              <p className="text-[0.95rem] md:text-[1.2rem] text-foreground/50 leading-[1.5] mb-6 md:mb-10">
                Multi-layered protection at every level. From institutional custody to audited
                contracts.
              </p>
              <div className="space-y-5">
                {[
                  'Fireblocks institutional custody',
                  'Audited smart contracts',
                  'Multi-signature governance',
                  'Real-time on-chain monitoring',
                ].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-hearst-green/10 flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-hearst-green"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-foreground/65 font-normal text-[0.95rem] md:text-[1.2rem]">
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={0.2}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {SECURITY_ITEMS.map((item) => (
                  <motion.div
                    key={item.title}
                    whileHover={{ y: -5, scale: 1.01 }}
                    className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-foreground/[0.04] hover:border-hearst-green/20 hover:shadow-lg hover:shadow-hearst-green/[0.04] transition-all duration-400"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-hearst-green/10 flex items-center justify-center text-hearst-green mb-5 group-hover:bg-hearst-green/15 transition-colors">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                    </div>
                    <h3 className="text-[1.2rem] font-medium mb-2">{item.title}</h3>
                    <p className="text-[1rem] text-foreground/40 leading-[1.5]">
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FAQ
          ═══════════════════════════════════════ */}
      <section
        id="faq"
        className="relative lg:min-h-screen lg:flex lg:flex-col lg:justify-center bg-white overflow-hidden"
      >
        <FAQWaveDynamic />
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12 md:py-16 lg:py-20 relative z-10">
          <ScrollReveal className="text-center mb-5 sm:mb-8 lg:mb-12">
            <p className="text-[1rem] md:text-[1.2rem] font-medium text-hearst-green tracking-normal mb-3 md:mb-5">
              FAQ
            </p>
            <h2 className="text-[1.6rem] md:text-[2.5rem] lg:text-[3rem] font-normal tracking-[-0.01em]">
              Frequently asked questions
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-sm rounded-2xl md:rounded-3xl border border-foreground/[0.04] px-4 sm:px-6 md:px-8">
              {FAQ_DATA.map((item) => (
                <FAQItem key={item.q} question={item.q} answer={item.a} />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CONTACT
          ═══════════════════════════════════════ */}
      <section
        id="contact"
        className="relative lg:min-h-screen lg:flex lg:flex-col lg:justify-center bg-white overflow-hidden"
      >
        <ContactVideoBg />
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12 md:py-16 lg:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 lg:gap-20 items-start">
            <ScrollReveal direction="left">
              <p className="text-[1rem] md:text-[1.2rem] font-medium text-hearst-green tracking-normal mb-3 md:mb-5">
                Contact
              </p>
              <h2 className="text-[1.6rem] md:text-[2.5rem] lg:text-[3rem] font-normal tracking-[-0.01em] mb-4 md:mb-6 leading-[1.2]">
                Get in touch
              </h2>
              <p className="text-[0.95rem] md:text-[1.2rem] text-foreground/50 leading-[1.5] mb-6 md:mb-10">
                Have a question, feedback, or partnership proposal? We&apos;d love to hear from you.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                {[
                  { label: 'General', email: 'hello@hearstvault.com' },
                  { label: 'Support', email: 'support@hearstvault.com' },
                  { label: 'Security', email: 'security@hearstvault.com' },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-foreground/[0.04] text-center"
                  >
                    <p className="text-xs text-foreground/35 font-medium mb-1">{c.label}</p>
                    <a
                      href={`mailto:${c.email}`}
                      className="text-sm font-semibold text-hearst-green hover:text-hearst-green-dark transition-colors break-all"
                    >
                      {c.email}
                    </a>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Response Time', value: 'Within 24 hours' },
                  { label: 'Languages', value: 'English, French' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-hearst-green/10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-hearst-green" />
                    </div>
                    <div>
                      <p className="text-xs text-foreground/35 font-medium">{item.label}</p>
                      <p className="text-sm font-semibold">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={0.2}>
              <form
                onSubmit={handleContactSubmit}
                className="bg-white/70 backdrop-blur-sm rounded-3xl border border-foreground/[0.04] p-8"
              >
                <div className="grid md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-foreground/35 tracking-wide uppercase mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/60 rounded-xl border border-foreground/[0.06] text-sm focus:outline-none focus:border-hearst-green/50 focus:ring-2 focus:ring-hearst-green/10 transition-all"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground/35 tracking-wide uppercase mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/60 rounded-xl border border-foreground/[0.06] text-sm focus:outline-none focus:border-hearst-green/50 focus:ring-2 focus:ring-hearst-green/10 transition-all"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>
                <div className="mb-5">
                  <label className="block text-xs font-bold text-foreground/35 tracking-wide uppercase mb-2">
                    Subject
                  </label>
                  <select
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-white/60 rounded-xl border border-foreground/[0.06] text-sm focus:outline-none focus:border-hearst-green/50 focus:ring-2 focus:ring-hearst-green/10 transition-all appearance-none"
                    required
                  >
                    <option value="">Select a topic</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="security">Security Report</option>
                  </select>
                </div>
                <div className="mb-8">
                  <label className="block text-xs font-bold text-foreground/35 tracking-wide uppercase mb-2">
                    Message
                  </label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 bg-white/60 rounded-xl border border-foreground/[0.06] text-sm focus:outline-none focus:border-hearst-green/50 focus:ring-2 focus:ring-hearst-green/10 transition-all resize-none"
                    placeholder="Your message..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-hearst-green text-foreground rounded-xl text-[1.2rem] font-medium hover:bg-hearst-green-dark transition-colors cursor-pointer"
                >
                  {contactSent ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Message Sent!
                    </span>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
