import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base, baseSepolia } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'
import { cookieStorage, createStorage } from '@wagmi/core'
import { ENV_CONFIG } from './env'

export const projectId = ENV_CONFIG.WALLETCONNECT_PROJECT_ID

if (!projectId) {
  console.warn('[wagmi] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set — wallet connect disabled')
}

export const networks = [base, baseSepolia]

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
})

export const config = wagmiAdapter.wagmiConfig

const queryClient = new QueryClient()

export { queryClient }
