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
      {/* Left - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0E0F0F]">
        <Image
          src="/assets/hero/vault-hero.png"
          alt="HearstVault Infrastructure"
          fill
          className="object-cover opacity-30"
          priority
        />

        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#96EA7A]/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#96EA7A]/3 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10 flex flex-col justify-center items-center h-full w-full px-12 xl:px-16">
        </div>
      </div>

      {/* Right - Login */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center min-h-screen px-6 sm:px-10 lg:px-16">
        <div className="w-full max-w-[380px]">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center mb-5">
              <Image src="/assets/tokens/hearst-logo.png" alt="Hearst" width={240} height={72} className="object-contain" style={{ mixBlendMode: 'multiply', backgroundColor: 'transparent' }} />
            </div>
            <p className="text-[#0E0F0F] text-sm font-semibold leading-relaxed">
              Real World Assets powered by Bitcoin Mining
            </p>
          </div>

          <button
            onClick={() => open()}
            className="w-2/3 mx-auto h-[38px] bg-[#96EA7A] text-[#0E0F0F] font-semibold text-sm rounded-full hover:bg-[#96EA7A]/90 shadow-md shadow-[#96EA7A]/25 transition-all flex items-center justify-center gap-2"
          >
            Connect Wallet
          </button>

          {/* Supported Wallets */}
          <div className="mt-10">
            <p className="text-xs text-[#0E0F0F] font-semibold uppercase tracking-widest text-center mb-4">Supported Wallets</p>
            <div className="grid grid-cols-4 gap-3">
              {WALLETS.map((wallet) => (
                <div key={wallet.name} className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 bg-[#F2F2F2] rounded-xl border border-[#9EB3A8]/15 flex items-center justify-center">
                    <Image src={wallet.icon} alt={wallet.name} width={28} height={28} className="rounded-sm" />
                  </div>
                  <span className="text-[11px] text-[#0E0F0F] font-medium">{wallet.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-[#0E0F0F]/60 font-medium mt-10">
            <a href="#" className="hover:text-[#0E0F0F] transition-colors">Privacy</a>
            <span>·</span>
            <a href="#" className="hover:text-[#0E0F0F] transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </div>
  )
}
