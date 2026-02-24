'use client'

import { useAppKit } from '@reown/appkit/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAccount } from 'wagmi'

const WALLETS = [
  { name: 'MetaMask', icon: '/assets/wallets/metamask.svg' },
  { name: 'WalletConnect', icon: '/assets/wallets/walletconnect.svg' },
  { name: 'Coinbase', icon: '/assets/wallets/coinbase.svg' },
  { name: 'Ledger', icon: '/assets/wallets/ledger.svg' },
] as const

const FEATURES = [
  { title: 'RWA Mining', desc: 'Institutional-grade Bitcoin mining backed by real-world assets' },
  { title: 'USDC Yield', desc: 'Stable returns through optimized DeFi yield strategies' },
  { title: 'BTC Hedged', desc: 'Delta-neutral positions with downside protection' },
] as const

export default function Login() {
  const { isConnected } = useAccount()
  const { open } = useAppKit()
  const router = useRouter()

  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard')
    }
  }, [isConnected, router])

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex flex-col lg:flex-row">
      {/* Left — Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0E0F0F]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0E0F0F] via-[#1a1f1a] to-[#0E0F0F]" />

        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#96EA7A]/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#96EA7A]/3 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#96EA7A]/[0.02] rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col justify-center h-full w-full px-12 xl:px-20">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
              <div className="w-2 h-2 rounded-full bg-[#96EA7A] animate-pulse" />
              <span className="text-xs text-white/60 font-medium">Live on Base</span>
            </div>
            <h2 className="text-[2.5rem] xl:text-[3rem] font-black text-white leading-[1.1] tracking-tight mb-4">
              Institutional
              <br />
              <span className="text-[#96EA7A]">yield</span>, accessible
              <br />
              to everyone.
            </h2>
            <p className="text-base text-white/40 max-w-sm leading-relaxed">
              Access curated RWA-backed strategies with transparent on-chain performance.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="flex items-start gap-4 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-[#96EA7A]">{i + 1}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">{f.title}</p>
                  <p className="text-xs text-white/35 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 flex items-center gap-6">
            {[
              { label: 'TVL', value: '$26.3M+' },
              { label: 'Avg APY', value: '8–15%' },
              { label: 'Strategies', value: '3' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-lg font-black text-white">{stat.value}</p>
                <p className="text-xs text-white/30 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center min-h-screen px-6 sm:px-10 lg:px-16 py-12">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center mb-6">
              <Image
                src="/Logo1.png"
                alt="Hearst"
                width={240}
                height={72}
                className="object-contain"
                style={{ mixBlendMode: 'multiply', backgroundColor: 'transparent' }}
              />
            </div>
            <p className="text-[#0E0F0F] text-body font-semibold leading-relaxed">
              Real World Assets powered by Bitcoin Mining
            </p>
          </div>

          <button
            onClick={() => open()}
            className="w-full h-14 bg-[#96EA7A] text-[#0E0F0F] font-bold text-base rounded-2xl hover:bg-[#7ED066] shadow-lg shadow-[#96EA7A]/20 hover:shadow-xl hover:shadow-[#96EA7A]/30 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            Connect Wallet
          </button>

          <p className="text-center text-xs text-[#9EB3A8] mt-3">
            Secure connection via WalletConnect protocol
          </p>

          <div className="mt-10">
            <p className="kpi-label tracking-widest text-center mb-5">Supported Wallets</p>
            <div className="grid grid-cols-4 gap-3">
              {WALLETS.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => open()}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-14 h-14 bg-white rounded-2xl border border-[#9EB3A8]/15 flex items-center justify-center group-hover:border-[#96EA7A]/30 group-hover:shadow-md transition-all">
                    <Image
                      src={wallet.icon}
                      alt={wallet.name}
                      width={28}
                      height={28}
                      className="rounded-sm"
                    />
                  </div>
                  <span className="text-xs text-[#0E0F0F]/50 font-medium group-hover:text-[#0E0F0F] transition-colors">
                    {wallet.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile-only feature summary */}
          <div className="lg:hidden mt-10 pt-8 border-t border-[#9EB3A8]/15">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'TVL', value: '$26.3M+' },
                { label: 'Avg APY', value: '8–15%' },
                { label: 'Strategies', value: '3' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-base font-black text-[#0E0F0F]">{stat.value}</p>
                  <p className="text-xs text-[#9EB3A8]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-[#0E0F0F]/40 font-medium mt-10">
            <a href="/privacy" className="hover:text-[#0E0F0F] transition-colors">
              Privacy
            </a>
            <span className="text-[#9EB3A8]/30">·</span>
            <a href="/terms" className="hover:text-[#0E0F0F] transition-colors">
              Terms
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
