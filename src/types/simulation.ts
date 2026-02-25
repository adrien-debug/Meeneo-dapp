// ─── Shared ─────────────────────────────────────────────────────

export interface SavedCurve {
  id: string
  name: string
  scenario: string
}

// ─── BTC Price Curve ────────────────────────────────────────────

export interface BtcPriceCurveResult {
  id?: string
  mode: 'deterministic' | 'ml_forecast'
  monthly_prices: number[]
  upper_bound?: number[]
  lower_bound?: number[]
}

export interface BtcPriceCurvePayload {
  name: string
  scenario: string
  months: number
  mode: 'deterministic' | 'ml_forecast'
  start_price?: number
  anchor_points?: Record<number, number>
  interpolation_type?: string
  volatility_enabled?: boolean
  volatility_seed?: number
  confidence_band_pct?: number
  model_type?: string
  confidence_interval?: number
}

// ─── Network Curve ──────────────────────────────────────────────

export interface NetworkCurveConfidenceBands {
  hashprice?: { lower: number[]; upper: number[] }
  hashrate?: { lower: number[]; upper: number[] }
  fees?: { lower: number[]; upper: number[] }
}

export interface NetworkCurveModelInfo {
  training_months: number
  training_start: string
  training_end: string
  confidence_interval: number
}

export interface NetworkCurveResult {
  id?: string
  mode: 'deterministic' | 'ml_forecast'
  hashprice_btc_per_ph_day: number[]
  network_hashrate_eh: number[]
  fees_per_block_btc: number[]
  difficulty: number[]
  confidence_bands?: NetworkCurveConfidenceBands
  model_info?: NetworkCurveModelInfo
}

export interface NetworkCurvePayload {
  name: string
  scenario: string
  months: number
  halving_enabled: boolean
  months_to_next_halving: number
  mode: 'deterministic' | 'ml_forecast'
  starting_network_hashrate_eh?: number
  monthly_difficulty_growth_rate?: number
  fee_regime?: string
  starting_fees_per_block_btc?: number
  confidence_band_pct?: number
  model_type?: string
  confidence_interval?: number
}

// ─── Miners & Hosting ───────────────────────────────────────────

export interface Miner {
  id: string
  name: string
  hashrate_th: number
  power_w: number
  price_usd: number
  lifetime_months: number
  maintenance_pct: number
  efficiency_j_th?: number
}

export interface HostingSite {
  id: string
  name: string
  electricity_price_usd_per_kwh: number
  hosting_fee_usd_per_kw_month: number
  uptime_expectation: number
  curtailment_pct: number
  capacity_mw_available: number
  lockup_months: number
  notice_period_days: number
}

export interface MinerSimPayload {
  miner_id: string
  btc_price_curve_id: string
  network_curve_id: string
  electricity_rate: number
  uptime: number
  months: number
}

export interface MinerMonthlyCashflow {
  [key: string]: unknown
  month: number
  btc_mined: number
  btc_price_usd: number
  gross_revenue_usd: number
  elec_cost_usd: number
  maintenance_usd: number
  net_usd: number
  depreciation_usd: number
  ebit_usd: number
  cumulative_net_usd: number
  cumulative_ebit_usd: number
}

export interface MinerSimResult {
  id?: string
  total_btc_mined: number
  total_revenue_usd: number
  total_net_usd: number
  total_ebit_usd: number
  monthly_cashflows: MinerMonthlyCashflow[]
}

// ─── Product Config / Simulation ────────────────────────────────

export interface ProductSimPayload {
  capital_raised_usd: number
  product_tenor_months: number
  exit_window_frequency: string
  yield_bucket: {
    allocated_usd: number
    base_apr: number
    apr_schedule: Array<{ from_month: number; to_month: number; apr: number }> | null
  }
  btc_holding_bucket: {
    allocated_usd: number
    buying_price_usd: number
    capital_recon_pct: number
    extra_yield_strikes: Array<{ strike_price: number; btc_share_pct: number }>
  }
  mining_bucket: {
    allocated_usd: number
    miner_id: string
    hosting_site_id: string
    miner_count: number
    base_yield_apr: number
    bonus_yield_apr: number
    take_profit_ladder: Array<{ price_trigger: number; sell_pct: number }>
  }
  commercial: {
    upfront_commercial_pct: number
    management_fees_pct: number
    performance_fees_pct: number
  } | null
  btc_price_curve_ids: { bear: string; base: string; bull: string }
  network_curve_ids: { bear: string; base: string; bull: string }
}

// ─── Results ────────────────────────────────────────────────────

export interface RunSummary {
  id: string
  capital_raised_usd: number
  created_at: string
}

export interface MonthlyPortfolio {
  month: number
  total_portfolio_usd: number
  yield_value_usd: number
  holding_value_usd: number
  mining_value_usd: number
}

export interface PortfolioMetrics {
  final_portfolio_usd: number
  gross_final_portfolio_usd?: number
  total_return_pct: number
  gross_total_return_pct?: number
  capital_preservation_ratio: number
  effective_apr: number
  total_yield_paid_usd: number
}

export interface BtcUnderManagement {
  month: number
  holding_btc: number
  mining_cap_btc: number
  total_btc: number
  holding_strike_this_month?: boolean
  holding_value_usd: number
  mining_cap_value_usd: number
  total_value_usd: number
  btc_price_usd: number
  holding_appreciation_usd: number
  holding_appreciation_pct: number
}

export interface BtcManagementMetrics {
  final_total_btc: number
  final_total_value_usd: number
  peak_btc_value_usd: number
  peak_btc_qty: number
  holding_target_struck: boolean
  holding_strike_month?: number
  holding_strike_price_usd?: number
}

export interface ScenarioResult {
  aggregated: {
    monthly_portfolio: MonthlyPortfolio[]
    metrics: PortfolioMetrics
    decision: string
    decision_reasons: string[]
    btc_under_management: BtcUnderManagement[]
    btc_under_management_metrics: BtcManagementMetrics
  }
  yield_bucket: {
    metrics: { final_value_usd: number; total_yield_usd: number; effective_apr: number }
    monthly_data: Array<{ cumulative_yield_usd: number }>
  }
  btc_holding_bucket: {
    metrics: {
      final_value_usd: number
      total_return_pct: number
      target_hit: boolean
      sell_month?: number
      btc_quantity: number
      target_sell_price_usd?: number
    }
    monthly_data: Array<{ bucket_value_usd: number }>
  }
  mining_bucket: {
    metrics: {
      final_health_score: number
      effective_apr: number
      avg_opex_coverage_ratio: number
      capitalization_usd_final: number
      red_flag_months: number
    }
    monthly_waterfall: Array<{ health_score: number; yield_paid_usd: number }>
  }
  commercial?: {
    total_commercial_value_usd: number
    management_fees_monthly: number[]
    upfront_fee_usd: number
    performance_fee_usd: number
  }
}

export interface RunData {
  id?: string
  scenario_results: Record<string, ScenarioResult>
}
