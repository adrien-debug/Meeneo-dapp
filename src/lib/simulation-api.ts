/**
 * Client API for Hearst Connect simulation backend.
 * Requests go through Next.js rewrite proxy: /api/simulation/* -> Railway backend.
 */

const BASE = '/api/simulation';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Simulation API error: ${res.status}`);
  }
  return res.json();
}

// ── Seed data IDs (created by backend seed) ──────────────────
export const SEED_IDS = {
  miners: { s21: 'seed-miner-s21', s21xp: 'seed-miner-s21xp' },
  sites: { texas: 'seed-site-texas', wyoming: 'seed-site-wyoming' },
  btcCurves: { bear: 'seed-btc-bear', base: 'seed-btc-base', bull: 'seed-btc-bull' },
  netCurves: { bear: 'seed-net-bear', base: 'seed-net-base', bull: 'seed-net-bull' },
} as const;

// ── Types ────────────────────────────────────────────────────

export interface SimulationRequest {
  capital_raised_usd: number;
  product_tenor_months: number;
  yield_bucket: { allocated_usd: number; base_apr: number };
  btc_holding_bucket: {
    allocated_usd: number;
    buying_price_usd: number;
    target_sell_price_usd?: number;
    capital_recon_pct?: number;
    extra_yield_strikes?: { strike_price: number; btc_share_pct: number }[];
  };
  mining_bucket: {
    allocated_usd: number;
    miner_id: string;
    hosting_site_id: string;
    miner_count: number;
    base_yield_apr?: number;
    bonus_yield_apr?: number;
    take_profit_ladder?: { price_trigger: number; sell_pct: number }[];
  };
  commercial?: {
    upfront_commercial_pct?: number;
    management_fees_pct?: number;
    performance_fees_pct?: number;
  };
  btc_price_curve_ids: Record<string, string>;
  network_curve_ids: Record<string, string>;
  user?: { user_id: string; role: string };
}

export interface ScenarioMetrics {
  capital_raised_usd: number;
  final_portfolio_usd: number;
  total_return_pct: number;
  total_yield_paid_usd: number;
  effective_apr: number;
  capital_preservation_ratio: number;
  gross_final_portfolio_usd: number;
  gross_total_return_pct: number;
}

export interface ScenarioResult {
  yield_bucket: { metrics: { total_yield_usd: number; effective_apr: number; final_value_usd: number } };
  btc_holding_bucket: { metrics: { target_hit: boolean; sell_month: number | null; final_value_usd: number; total_return_pct: number } };
  mining_bucket: { metrics: Record<string, number>; monthly_waterfall: Record<string, number>[] };
  commercial: Record<string, number> | null;
  aggregated: {
    metrics: ScenarioMetrics;
    decision: string;
    decision_reasons: string[];
    monthly_portfolio: { month: number; yield_value_usd: number; holding_value_usd: number; mining_value_usd: number; total_portfolio_usd: number }[];
  };
}

export interface SimulationResponse {
  id: string;
  scenario_results: Record<'bear' | 'base' | 'bull', ScenarioResult>;
  created_at: string;
}

// ── API calls ────────────────────────────────────────────────

export const simulationApi = {
  health: () => request<{ status: string }>('/health'),

  simulate: (data: SimulationRequest) =>
    request<SimulationResponse>('/product-config/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listRuns: () => request<{ id: string; created_at: string; capital_raised_usd: number }[]>('/product-config/runs'),
};

/**
 * Build a simulation request with sensible defaults from vault config.
 * The user only needs to provide the investment amount.
 */
export function buildSimulationRequest(
  investmentUsd: number,
  btcSpotPrice: number = 97000,
): SimulationRequest {
  const yieldPct = 0.30;
  const holdingPct = 0.30;
  const miningPct = 0.40;

  return {
    capital_raised_usd: investmentUsd,
    product_tenor_months: 36,
    yield_bucket: {
      allocated_usd: investmentUsd * yieldPct,
      base_apr: 0.06,
    },
    btc_holding_bucket: {
      allocated_usd: investmentUsd * holdingPct,
      buying_price_usd: btcSpotPrice,
      capital_recon_pct: 70,
      extra_yield_strikes: [
        { strike_price: btcSpotPrice * 1.4, btc_share_pct: 40 },
        { strike_price: btcSpotPrice * 1.8, btc_share_pct: 60 },
      ],
    },
    mining_bucket: {
      allocated_usd: investmentUsd * miningPct,
      miner_id: SEED_IDS.miners.s21xp,
      hosting_site_id: SEED_IDS.sites.texas,
      miner_count: Math.max(1, Math.round((investmentUsd * miningPct) / 7200)),
      base_yield_apr: 0.08,
      bonus_yield_apr: 0.04,
      take_profit_ladder: [
        { price_trigger: btcSpotPrice * 1.3, sell_pct: 0.15 },
        { price_trigger: btcSpotPrice * 1.5, sell_pct: 0.25 },
        { price_trigger: btcSpotPrice * 1.8, sell_pct: 0.30 },
      ],
    },
    commercial: {
      upfront_commercial_pct: 0,
      management_fees_pct: 1.5,
      performance_fees_pct: 10,
    },
    btc_price_curve_ids: SEED_IDS.btcCurves,
    network_curve_ids: SEED_IDS.netCurves,
    user: { user_id: 'dapp-user', role: 'readonly' },
  };
}
