# HearstVault — Multi-Strategy USDC Vault on Base

A Next.js application for institutional-grade multi-strategy USDC vaults on Base L2. Diversified capital allocation across RWA Mining (40%), USDC Yield (30%), and BTC Hedged (30%) strategies with a 3-year lock period and yield claimable after 1 year.

## Architecture

### Pages

- `/login` — Wallet connection, product overview, strategy allocation visual
- `/dashboard` — Portfolio overview: allocation donut, strategy cards, lock timeline, deposits table, performance charts, activity feed
- `/vault/[slug]` — Vault detail: strategy deep-dive, protocol breakdown, user position, deposit/claim/withdraw actions, performance chart
- `/admin` — Operational cockpit (admin-only): TVL by strategy, epoch management, on-chain reward distribution & rebalancing, system health, live transactions

### Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Charts**: Recharts (AreaChart, PieChart, BarChart)
- **Web3**: Wagmi, AppKit (WalletConnect), Base L2 (chain ID 8453)
- **Data**: Mock-first architecture, ready for on-chain connection

### Design System

Tokens centralisés dans `src/app/globals.css` via Tailwind 4 `@theme` :

| Token | Classe Tailwind | Valeur |
|-------|----------------|--------|
| `--color-foreground` | `text-foreground`, `bg-foreground` | `#0E0F0F` |
| `--color-background` | `bg-background` | `#F2F2F2` |
| `--color-surface` | `bg-surface` | `#FFFFFF` |
| `--color-surface-alt` | `bg-surface-alt` | `#FAFAFA` |
| `--color-muted` | `text-muted`, `border-muted` | `#9EB3A8` |
| `--color-hearst-green` | `bg-hearst-green`, `text-hearst-green` | `#96EA7A` |
| `--color-hearst-green-dark` | `bg-hearst-green-dark` | `#7ED066` |
| `--color-hearst-green-light` | `bg-hearst-green-light` | `#E6F1E7` |

Opacités via modificateur Tailwind : `bg-foreground/5`, `text-muted/40`, `border-hearst-green/20`, etc.

### Layout

- Espacements verticaux des sections en responsive via `py-20 sm:py-24 lg:py-32`.

### Key Config Files

- `src/config/wagmi.ts` — Wagmi adapter config (Base + Base Sepolia)
- `src/config/env.ts` — Environment variables and contract addresses
- `src/config/contracts.ts` — Contract addresses, network config, fee constants
- `src/config/mock-data.ts` — Realistic mock data (vault, deposits, performance, transactions)
- `src/types/product.ts` — Type definitions (VaultConfig, VaultStrategy, UserDeposit, etc.)

### Components

- `Header` — Dark navbar with Portfolio/Vaults/Admin nav, Base network badge
- `NetworkValidator` — Modal to switch to Base when on wrong network

### Marketing Components (`src/components/marketing/`)

| Composant | Description |
|-----------|-------------|
| `ScrollReveal` | Wrapper Framer Motion — reveal au scroll (up/down/left/right) |
| `MagneticButton` | Bouton avec effet magnétique au hover |
| `EnergyGlobe` | Globe Three.js (R3F) animé — transition d'entrée section About |
| `FeatureCardCanvas` | Canvas 2D — fond animé des cartes About (cubes wireframe, hover glow) |
| `ProductsSectionBg` | Three.js — réseau blockchain en fond de la section Products |
| `MarketingFooter` | Footer marketing avec liens et branding |

### Hooks

- `useVaultReads` — Shared vault read logic (DRY base for both single & multi-vault hooks)
- `useEpochVault` — Single vault contract interactions (deposit, withdraw, claim, deploy)
- `useMultiVault` — Multi-vault contract interactions (admin actions per vault)
- `useAdminGuard` — Admin role verification (only hardcoded admin wallets or demo mode)
- `useAuthGuard` — General authentication guard (wallet connected or demo mode)
- `useAppKitSafe` — Safe wrapper around AppKit (no-op in dev without WalletConnect ID)

## Getting Started

### Prerequisites

- Node.js 18+
- WalletConnect Project ID

### Installation

```bash
npm install
```

### Environment

Create `.env.local` (see `.env.example`) :

```env
# Web3
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_HEARST_VAULT_PROXY=0xd8d294714F5b1A1104CFE75C0Bb4ceF547a05124
NEXT_PUBLIC_HEARST_VAULT_IMPL=0xEa7975C2fec1ae9e3058bb5f99d8e26dbC816811
NEXT_PUBLIC_EPOCH_VAULT_ADDRESS=0xd8d294714F5b1A1104CFE75C0Bb4ceF547a05124
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
```

### Development

```bash
npm run dev           # Dev server (port 3000, Turbopack)
npm run build         # Production build (Turbopack)
npm run start         # Serve production build (port 3110)
npm run lint          # ESLint check
npm run format        # Prettier — format all source files
npm run format:check  # Prettier — check formatting (CI)
npm run test          # Vitest — watch mode
npm run test:run      # Vitest — single run
npm run test:coverage # Vitest — coverage report
```

### Dev Tooling

| Tool | Purpose |
|------|---------|
| **Prettier** | Code formatting (`.prettierrc`) |
| **Husky** | Git hooks (pre-commit) |
| **lint-staged** | Run lint+format only on staged files |
| **Vitest** | Unit & component tests (`vitest.config.ts`) |
| **ESLint 9** | Linting with Next.js rules |

---

## Deployment — Railway

Le projet est configuré pour Railway via Next.js `standalone` output.

### Railway Settings

| Setting | Value |
|---------|-------|
| **Builder** | Nixpacks (auto-détecté) |
| **Build Command** | `npm run build` |
| **Start Command** | `node .next/standalone/server.js` |
| **Port** | `3000` (auto via `PORT` env) |
| **Node version** | `18+` |

### Variables d'environnement (Railway Dashboard)

Ajouter dans **Settings → Variables** :

```env
# Required — Web3
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxx
NEXT_PUBLIC_HEARST_VAULT_PROXY=0xd8d294714F5b1A1104CFE75C0Bb4ceF547a05124
NEXT_PUBLIC_HEARST_VAULT_IMPL=0xEa7975C2fec1ae9e3058bb5f99d8e26dbC816811
NEXT_PUBLIC_EPOCH_VAULT_ADDRESS=0xd8d294714F5b1A1104CFE75C0Bb4ceF547a05124
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org

# Railway auto-set
PORT=3000
```

### Notes Railway

- `output: 'standalone'` dans `next.config.ts` produit un serveur Node autonome (pas besoin de `node_modules` en prod)
- Les assets statiques (`public/`, `.next/static/`) doivent être copiés manuellement ou via un `Dockerfile` custom si Railway ne les sert pas correctement
- Pour un custom domain : **Settings → Networking → Custom Domain**
- Health check : Railway ping automatiquement le port configuré

### Dockerfile (optionnel, si Nixpacks ne suffit pas)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## AI Generation Keys

Clés API utilisées pour la génération d'assets visuels (images, vidéos, 3D). **Ne pas commiter** — les stocker en variables d'environnement ou dans un `.env` local.

| Service | Variable d'environnement | Usage |
|---------|--------------------------|-------|
| **Runway ML** | `RUNWAYML_API_SECRET` | Vidéo animée (Gen4 Turbo) — hero bg, products bg |
| **Gemini** (Nano Banana Pro) | `GEMINI_API_KEY` | Génération d'images concept |
| **Hypereal AI** | `HYPEREAL_API_KEY` | 3D models, images, vidéos (30+ modèles) |
| **Meshy AI** | `MESHY_API_KEY` | Text-to-3D, Image-to-3D |

### Assets générés dans le projet

| Asset | Source | Chemin |
|-------|--------|--------|
| Hero background vidéo | Runway Gen4 (image-to-video depuis concept Gemini) | `public/assets/hero/blockchain-bg.mp4` |
| Products section background | Runway Gen4 (image-to-video depuis concept Gemini) | `public/assets/hero/products-bg.mp4` |

---

## Cursor AI Setup

Project rules are in `.cursor/rules/` for AI-assisted development:
- `project-global.mdc` — Stack, architecture, conventions
- `react-components.mdc` — React patterns
- `web3-contracts.mdc` — Smart contract interaction rules
- `testing.mdc` — Testing conventions

MCP servers configured globally (`~/.cursor/mcp.json`):
- **Context7** — Up-to-date library documentation
- **Sequential Thinking** — Structured reasoning for complex tasks
- **Playwright** — Browser automation & E2E testing
- **Memory** — Persistent memory across sessions
- **Vercel** — Deployment management
- **GitHub** — Issues, PRs, code review
- **Figma** — Design-to-code workflow
- **Supabase** (x3) — Database management

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
