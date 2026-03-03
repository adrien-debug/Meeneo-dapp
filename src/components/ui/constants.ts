export const CARD = 'bg-white rounded-2xl border border-foreground/[0.04]'

export const STRATEGY_ICONS: Record<string, string> = {
  rwa_mining: '/assets/tokens/hearst.svg',
  usdc_yield: '/assets/tokens/usdc.svg',
  btc_hedged: '/assets/tokens/btc.svg',
  btc_spot: '/assets/tokens/btc.svg',
  btc_collateral_mining: '/assets/tokens/hearst.svg',
}

export const RISK_BG: Record<string, string> = {
  low: 'bg-hearst-green/10 text-hearst-green border border-hearst-green/20',
  medium: 'bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20',
  'medium-high': 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20',
}
