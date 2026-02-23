# HearstVault — Multi-Strategy USDC Vault on Base

A Next.js application for institutional-grade multi-strategy USDC vaults on Base L2. Diversified capital allocation across RWA Mining (40%), USDC Yield (30%), and BTC Hedged (30%) strategies with a 3-year lock period and yield claimable after 1 year.

## Architecture

### Pages

- `/login` — Wallet connection, product overview, strategy allocation visual
- `/dashboard` — Portfolio overview: allocation donut, strategy cards, lock timeline, deposits table, performance charts, activity feed
- `/vault/[slug]` — Vault detail: strategy deep-dive, protocol breakdown, user position, deposit/claim/withdraw actions, performance chart
- `/admin` — Operational cockpit: TVL by strategy, epoch management, reward distribution, rebalancing, system health, live transactions

### Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Charts**: Recharts (AreaChart, PieChart, BarChart)
- **Web3**: Wagmi, AppKit (WalletConnect), Base L2 (chain ID 8453)
- **Data**: Mock-first architecture, ready for on-chain connection

### Key Config Files

- `src/config/wagmi.ts` — Wagmi adapter config (Base + Base Sepolia)
- `src/config/env.ts` — Environment variables and contract addresses
- `src/config/contracts.ts` — Contract addresses, network config, fee constants
- `src/config/mock-data.ts` — Realistic mock data (vault, deposits, performance, transactions)
- `src/types/product.ts` — Type definitions (VaultConfig, VaultStrategy, UserDeposit, etc.)

### Components

- `Header` — Dark navbar with Portfolio/Vaults/Admin nav, Base network badge
- `NetworkValidator` — Modal to switch to Base when on wrong network

### Hooks (kept for on-chain integration)

- `useEpochVault` — Single vault contract interactions
- `useMultiVault` — Multi-vault contract interactions

## Getting Started

### Prerequisites

- Node.js 18+
- WalletConnect Project ID

### Installation

```bash
npm install
```

### Environment

Create `.env.local`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_HEARST_VAULT_PROXY=0xd8d294714F5b1A1104CFE75C0Bb4ceF547a05124
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
```

### Development

```bash
npm run dev        # Start dev server (default port 3000)
npm run build      # Production build
npm run lint       # Lint check
```

## Vault Specifications

| Parameter | Value |
|-----------|-------|
| Network | Base (8453) |
| Deposit Token | USDC |
| Lock Period | 3 years |
| Yield Cliff | 1 year |
| Composite APY | 8-15% |
| Management Fee | 1.5% |
| Performance Fee | 10% |
| Exit Fee | 0.1% |
| Early Exit Penalty | 5% |
| TVL Cap | $50M |

### Strategy Allocation

| Strategy | Allocation | APY Range | Risk | Protocols |
|----------|-----------|-----------|------|-----------|
| RWA Mining | 40% | 10-18% | Medium-High | Hearst Mining, Marathon, CleanSpark |
| USDC Yield | 30% | 5-8% | Low | Moonwell, Steakhouse, Gauntlet |
| BTC Hedged | 30% | 8-14% | Medium | Derive, Morpho, Ethena |

## Admin Roles

- **Reward Depositor** (`0x3F73...988D`) — Distribute epoch rewards
- **Authorized Withdrawal** (`0x51a9...c88b`) — Emergency withdrawals
- **Admin Depositor** (`0x2d20...69C2`) — Admin deposits

## Security

- Non-custodial (user signs all transactions locally)
- Audited smart contracts
- Base L2 for lower gas costs
- MiCA-ready compliance framework

## Supported Wallets

MetaMask, WalletConnect, Coinbase Wallet, Ledger, and 300+ wallets via AppKit.

## License

MIT
