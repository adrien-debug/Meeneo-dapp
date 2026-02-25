'use client'

import { useDemo } from '@/context/demo-context'
import { useAppKitSafe } from '@/hooks/useAppKitSafe'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'

const WALLETS = [
  { name: 'MetaMask', icon: '/assets/wallets/metamask.svg' },
  { name: 'WalletConnect', icon: '/assets/wallets/walletconnect.svg' },
  { name: 'Coinbase', icon: '/assets/wallets/coinbase.svg' },
  { name: 'Ledger', icon: '/assets/wallets/ledger.svg' },
] as const

export default function Login() {
  const { isConnected } = useAccount()
  const { open } = useAppKitSafe()
  const { isDemoMode, enterDemoMode } = useDemo()
  const router = useRouter()

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard')
    }
  }, [isConnected, router])

  const handleDemoLogin = () => {
    enterDemoMode()
    window.location.href = '/dashboard'
  }

  const handleVideoTimeUpdate = useCallback(() => {
    const vid = videoRef.current
    if (!vid) return
    if (vid.currentTime >= 9.5) {
      vid.playbackRate = Math.max(0.1, 1 - (vid.currentTime - 9.5) * 2)
    }
    if (vid.currentTime >= 10) {
      vid.pause()
      vid.playbackRate = 1
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex flex-col lg:flex-row">
      {/* Left — Video */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0E0F0F]">
        {}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          onTimeUpdate={handleVideoTimeUpdate}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ imageRendering: 'auto' }}
        >
          <source src="/vault-hero.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0F0F] via-[#0E0F0F]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0E0F0F]/40" />

        <div className="relative z-10 flex flex-col justify-end h-full w-full px-12 xl:px-20 pb-16">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#96EA7A] animate-pulse" />
              <span className="text-xs text-white/80 font-medium">Live on Base</span>
            </div>
            <h2 className="text-[2.5rem] xl:text-[3rem] font-black text-white leading-[1.1] tracking-tight mb-4">
              Institutional
              <br />
              <span className="text-[#96EA7A]">yield</span>, accessible
              <br />
              to everyone.
            </h2>
            <p className="text-sm text-white/50 max-w-sm leading-relaxed">
              Access curated RWA-backed strategies with transparent on-chain performance.
            </p>
          </div>

          <div className="flex items-center gap-8">
            {[
              { label: 'TVL', value: '$26.3M+' },
              { label: 'Avg APY', value: '8–15%' },
              { label: 'Strategies', value: '3' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-lg font-black text-white">{stat.value}</p>
                <p className="text-xs text-white/40 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center min-h-screen px-6 sm:px-10 lg:px-16 py-12 relative overflow-hidden">
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
            className="w-full h-11 bg-[#96EA7A] text-[#0E0F0F] font-semibold text-sm rounded-xl hover:bg-[#7ED066] shadow-md shadow-[#96EA7A]/15 hover:shadow-lg hover:shadow-[#96EA7A]/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            Connect Wallet
          </button>

          <p className="text-center text-[10px] text-[#9EB3A8] mt-2">
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

          <div className="flex items-center justify-between text-xs text-[#0E0F0F]/40 font-medium mt-10">
            <div className="flex items-center gap-3">
              <a href="/privacy" className="hover:text-[#0E0F0F] transition-colors">
                Privacy
              </a>
              <span className="text-[#9EB3A8]/30">·</span>
              <a href="/terms" className="hover:text-[#0E0F0F] transition-colors">
                Terms
              </a>
            </div>
            <button
              onClick={handleDemoLogin}
              className="flex items-center gap-1.5 text-[11px] text-[#0E0F0F]/40 hover:text-[#0E0F0F] transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#96EA7A]" />
              Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
