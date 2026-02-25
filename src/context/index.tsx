'use client'

import { projectId, wagmiAdapter } from '@/config/wagmi'
import { base, baseSepolia } from '@reown/appkit/networks'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

const queryClient = new QueryClient()

const metadata = {
  name: 'HearstVault',
  description: 'Multi-strategy USDC vault on Base — RWA Mining, USDC Yield, BTC Hedged',
  url: 'https://hearstvault.com',
  icons: ['https://hearstvault.com/icon.png'],
}

if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [base, baseSepolia],
    defaultNetwork: base,
    metadata,
    features: {
      analytics: true,
    },
  })
} else {
  console.warn('[AppKit] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID not set — WalletConnect disabled')
}

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider
