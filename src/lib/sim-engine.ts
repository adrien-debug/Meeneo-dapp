/**
 * Pure simulation engine — runs entirely server-side in Next.js API routes.
 * No external dependencies required.
 */

import type {
  BtcPriceCurvePayload,
  BtcPriceCurveResult,
  HostingSite,
  Miner,
  MinerMonthlyCashflow,
  MinerSimResult,
  NetworkCurvePayload,
  NetworkCurveResult,
  ProductSimPayload,
  RunData,
  ScenarioResult,
} from '@/types/simulation'

// ── Helpers ──────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Simple seeded pseudo-random (LCG) for reproducible volatility */
function seededRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return ((s >>> 0) / 0xffffffff) * 2 - 1 // -1..1
  }
}

// ── BTC Price Curve ───────────────────────────────────────────────────────────

export function generateBtcCurve(payload: BtcPriceCurvePayload): BtcPriceCurveResult {
  const months = payload.months ?? 120

  if (payload.mode === 'ml_forecast') {
    return generateMlBtcCurve(payload, months)
  }
  return generateDeterministicBtcCurve(payload, months)
}

function generateDeterministicBtcCurve(
  payload: BtcPriceCurvePayload,
  months: number,
): BtcPriceCurveResult {
  const anchors: Record<number, number> = payload.anchor_points ?? {
    0: payload.start_price ?? 97000,
    10: 350000,
  }

  const years = Math.ceil(months / 12)
  const yearPrices: number[] = []
  for (let y = 0; y <= years; y++) {
    yearPrices[y] = anchors[y] ?? anchors[years] ?? Object.values(anchors).at(-1) ?? 100000
  }

  const monthly_prices: number[] = []
  const rng = seededRng(payload.volatility_seed ?? 42)
  const volEnabled = payload.volatility_enabled ?? false

  for (let m = 0; m < months; m++) {
    const y = Math.floor(m / 12)
    const frac = (m % 12) / 12
    let price = lerp(yearPrices[y] ?? yearPrices[0], yearPrices[y + 1] ?? yearPrices[y], frac)
    if (volEnabled) {
      price *= 1 + rng() * 0.08
    }
    monthly_prices.push(Math.round(Math.max(1000, price)))
  }

  const bandPct = (payload.confidence_band_pct ?? 0) / 100
  if (bandPct > 0) {
    const upper_bound = monthly_prices.map((p) => Math.round(p * (1 + bandPct)))
    const lower_bound = monthly_prices.map((p) => Math.round(p * (1 - bandPct)))
    return { mode: 'deterministic', monthly_prices, upper_bound, lower_bound }
  }

  return { mode: 'deterministic', monthly_prices }
}

function generateMlBtcCurve(payload: BtcPriceCurvePayload, months: number): BtcPriceCurveResult {
  const scenarioMultipliers: Record<string, number> = { bear: 0.6, base: 1.0, bull: 1.8 }
  const mult = scenarioMultipliers[payload.scenario] ?? 1.0
  const startPrice = 97000
  const endPrice = startPrice * mult * (1 + months / 120)

  const ci = payload.confidence_interval ?? 0.95
  const bandPct = (1 - ci) * 0.5 + 0.1

  const monthly_prices: number[] = []
  const rng = seededRng(99)
  for (let m = 0; m < months; m++) {
    const t = m / (months - 1)
    const base = lerp(startPrice, endPrice, t)
    const noise = 1 + rng() * 0.04
    monthly_prices.push(Math.round(Math.max(1000, base * noise)))
  }

  const upper_bound = monthly_prices.map((p) => Math.round(p * (1 + bandPct)))
  const lower_bound = monthly_prices.map((p) => Math.round(p * (1 - bandPct)))

  return { mode: 'ml_forecast', monthly_prices, upper_bound, lower_bound }
}

// ── Network Curve ─────────────────────────────────────────────────────────────

export function generateNetworkCurve(payload: NetworkCurvePayload): NetworkCurveResult {
  const months = payload.months ?? 120
  const startHashrate = payload.starting_network_hashrate_eh ?? 700
  const growthRate = payload.monthly_difficulty_growth_rate ?? 0.005
  const startingFees = payload.starting_fees_per_block_btc ?? 0.15
  const halvingEnabled = payload.halving_enabled ?? true
  const monthsToHalving = payload.months_to_next_halving ?? 6

  const hashrate: number[] = []
  const hashprice: number[] = []
  const fees: number[] = []
  const difficulty: number[] = []

  let currentHashrate = startHashrate
  let subsidyBtc = 3.125
  let halvingCountdown = monthsToHalving

  for (let m = 0; m < months; m++) {
    if (halvingEnabled) {
      halvingCountdown--
      if (halvingCountdown <= 0) {
        subsidyBtc /= 2
        halvingCountdown = 48 // ~4 years
      }
    }

    currentHashrate *= 1 + growthRate + (Math.random() - 0.5) * 0.002
    const feeNoise = 1 + (Math.random() - 0.5) * 0.1
    const currentFees = startingFees * feeNoise * Math.max(0.5, 1 - m / (months * 2))
    const totalRewardBtc = subsidyBtc + currentFees
    const hp = (totalRewardBtc * 144 * 30) / (currentHashrate * 1e6) // BTC per PH/day ≈

    hashrate.push(+currentHashrate.toFixed(2))
    hashprice.push(+hp.toFixed(8))
    fees.push(+currentFees.toFixed(6))
    difficulty.push(+(currentHashrate * 7.158e12).toFixed(0))
  }

  const result: NetworkCurveResult = {
    mode: payload.mode ?? 'deterministic',
    hashprice_btc_per_ph_day: hashprice,
    network_hashrate_eh: hashrate,
    fees_per_block_btc: fees,
    difficulty,
  }

  if (payload.mode === 'ml_forecast') {
    const bandPct = (payload.confidence_band_pct ?? 20) / 100
    result.confidence_bands = {
      hashprice: {
        lower: hashprice.map((p) => +(p * (1 - bandPct)).toFixed(8)),
        upper: hashprice.map((p) => +(p * (1 + bandPct)).toFixed(8)),
      },
      hashrate: {
        lower: hashrate.map((h) => +(h * (1 - bandPct / 2)).toFixed(2)),
        upper: hashrate.map((h) => +(h * (1 + bandPct / 2)).toFixed(2)),
      },
    }
  }

  return result
}

// ── Miner Simulation ──────────────────────────────────────────────────────────

export function simulateMiner(
  miner: Miner,
  site: HostingSite,
  btcPrices: number[],
  networkHashprices: number[],
  months: number,
): MinerSimResult {
  const powerKw = miner.power_w / 1000
  const uptimeEff = site.uptime_expectation * (1 - site.curtailment_pct)
  const hoursPerMonth = 720 * uptimeEff
  const elecCostPerMonth =
    powerKw * hoursPerMonth * site.electricity_price_usd_per_kwh +
    powerKw * site.hosting_fee_usd_per_kw_month

  const depreciationMonthly = miner.price_usd / miner.lifetime_months
  const maintenanceRate = miner.maintenance_pct

  const monthly_cashflows: MinerMonthlyCashflow[] = []
  let cumulativeNet = 0
  let cumulativeEbit = 0
  let totalBtcMined = 0
  let totalRevenue = 0
  let totalNet = 0
  let totalEbit = 0

  for (let m = 0; m < months; m++) {
    const btcPrice = btcPrices[m] ?? btcPrices.at(-1) ?? 97000
    const hashprice = networkHashprices[m] ?? networkHashprices.at(-1) ?? 1e-6

    // BTC mined = hashrate (TH/s) * hashprice (BTC/PH/day) * days/month / 1e6
    const btcMined = (miner.hashrate_th / 1e6) * hashprice * 30 * uptimeEff
    const grossRevenue = btcMined * btcPrice
    const maintenanceCost = grossRevenue * maintenanceRate
    const netUsd = grossRevenue - elecCostPerMonth - maintenanceCost
    const ebit = netUsd - depreciationMonthly

    cumulativeNet += netUsd
    cumulativeEbit += ebit
    totalBtcMined += btcMined
    totalRevenue += grossRevenue
    totalNet += netUsd
    totalEbit += ebit

    monthly_cashflows.push({
      month: m + 1,
      btc_mined: +btcMined.toFixed(8),
      btc_price_usd: btcPrice,
      gross_revenue_usd: +grossRevenue.toFixed(2),
      elec_cost_usd: +elecCostPerMonth.toFixed(2),
      maintenance_usd: +maintenanceCost.toFixed(2),
      net_usd: +netUsd.toFixed(2),
      depreciation_usd: +depreciationMonthly.toFixed(2),
      ebit_usd: +ebit.toFixed(2),
      cumulative_net_usd: +cumulativeNet.toFixed(2),
      cumulative_ebit_usd: +cumulativeEbit.toFixed(2),
    })
  }

  return {
    total_btc_mined: +totalBtcMined.toFixed(8),
    total_revenue_usd: +totalRevenue.toFixed(2),
    total_net_usd: +totalNet.toFixed(2),
    total_ebit_usd: +totalEbit.toFixed(2),
    monthly_cashflows,
  }
}

// ── Product Simulation ────────────────────────────────────────────────────────

function simulateScenario(
  payload: ProductSimPayload,
  btcPrices: number[],
  networkHashprices: number[],
  scenario: string,
): ScenarioResult {
  const months = payload.product_tenor_months
  const capital = payload.capital_raised_usd

  // Yield bucket
  const yieldAllocated = payload.yield_bucket.allocated_usd
  const yieldApr = payload.yield_bucket.base_apr
  const monthlyYieldRate = yieldApr / 12
  const monthlyYield = yieldAllocated * monthlyYieldRate
  let yieldCumulative = 0
  const yieldMonthly: { cumulative_yield_usd: number }[] = []
  for (let m = 0; m < months; m++) {
    yieldCumulative += monthlyYield
    yieldMonthly.push({ cumulative_yield_usd: +yieldCumulative.toFixed(2) })
  }
  const yieldFinalValue = yieldAllocated + yieldCumulative

  // BTC Holding bucket
  const holdingAllocated = payload.btc_holding_bucket.allocated_usd
  const buyPrice = payload.btc_holding_bucket.buying_price_usd
  const btcQty = holdingAllocated / buyPrice
  let holdingTargetHit = false
  let holdingSellMonth: number | undefined
  const extraStrikes = payload.btc_holding_bucket.extra_yield_strikes ?? []
  const holdingMonthly: { bucket_value_usd: number }[] = []

  for (let m = 0; m < months; m++) {
    const price = btcPrices[m] ?? btcPrices.at(-1) ?? buyPrice
    const val = btcQty * price
    holdingMonthly.push({ bucket_value_usd: +val.toFixed(2) })
    for (const strike of extraStrikes) {
      if (!holdingTargetHit && price >= strike.strike_price) {
        holdingTargetHit = true
        holdingSellMonth = m + 1
      }
    }
  }
  const finalBtcPrice = btcPrices[months - 1] ?? btcPrices.at(-1) ?? buyPrice
  const holdingFinalValue = btcQty * finalBtcPrice
  const holdingReturnPct = ((holdingFinalValue - holdingAllocated) / holdingAllocated) * 100

  // Mining bucket
  const miningAllocated = payload.mining_bucket.allocated_usd
  const miningBaseApr = payload.mining_bucket.base_yield_apr ?? 0.08
  const miningBonusApr = payload.mining_bucket.bonus_yield_apr ?? 0.04
  const totalMiningApr = miningBaseApr + miningBonusApr
  let miningCumYield = 0
  const miningWaterfall: { health_score: number; yield_paid_usd: number }[] = []

  for (let m = 0; m < months; m++) {
    const hp = networkHashprices[m] ?? networkHashprices.at(-1) ?? 1e-6
    const hpNorm = Math.min(1, hp / 2e-6)
    const healthScore = 0.5 + hpNorm * 0.5
    const monthlyMiningYield = (miningAllocated * totalMiningApr) / 12
    miningCumYield += monthlyMiningYield
    miningWaterfall.push({
      health_score: +healthScore.toFixed(3),
      yield_paid_usd: +monthlyMiningYield.toFixed(2),
    })
  }

  // Aggregated portfolio
  const totalYieldPaid = yieldCumulative + miningCumYield
  const finalPortfolio = yieldFinalValue + holdingFinalValue + miningAllocated + miningCumYield
  const totalReturnPct = ((finalPortfolio - capital) / capital) * 100
  const effectiveApr = (totalReturnPct / months) * 12

  const monthlyPortfolio = Array.from({ length: months }, (_, m) => ({
    month: m + 1,
    yield_value_usd: +(yieldAllocated + (yieldMonthly[m]?.cumulative_yield_usd ?? 0)).toFixed(2),
    holding_value_usd: +(holdingMonthly[m]?.bucket_value_usd ?? holdingAllocated).toFixed(2),
    mining_value_usd: +(
      miningAllocated +
      (miningWaterfall[m]?.yield_paid_usd ?? 0) * (m + 1)
    ).toFixed(2),
    total_portfolio_usd: 0,
  })).map((row) => ({
    ...row,
    total_portfolio_usd: +(
      row.yield_value_usd +
      row.holding_value_usd +
      row.mining_value_usd
    ).toFixed(2),
  }))

  // Decision
  const decision =
    totalReturnPct >= 36
      ? 'CLOSE_AT_TARGET'
      : months >= payload.product_tenor_months
        ? 'CLOSE_AT_MATURITY'
        : 'HOLD'

  // Commercial
  const commercial = payload.commercial
    ? {
        total_commercial_value_usd: +(
          capital * (payload.commercial.upfront_commercial_pct ?? 0)
        ).toFixed(2),
        management_fees_monthly: Array(months).fill(
          +((capital * ((payload.commercial.management_fees_pct ?? 1.5) / 100)) / 12).toFixed(2),
        ),
        upfront_fee_usd: +(capital * (payload.commercial.upfront_commercial_pct ?? 0)).toFixed(2),
        performance_fee_usd: +(
          totalYieldPaid *
          ((payload.commercial.performance_fees_pct ?? 15) / 100)
        ).toFixed(2),
      }
    : undefined

  return {
    aggregated: {
      monthly_portfolio: monthlyPortfolio,
      metrics: {
        final_portfolio_usd: +finalPortfolio.toFixed(2),
        total_return_pct: +totalReturnPct.toFixed(2),
        capital_preservation_ratio: +(finalPortfolio / capital).toFixed(4),
        effective_apr: +effectiveApr.toFixed(2),
        total_yield_paid_usd: +totalYieldPaid.toFixed(2),
      },
      decision,
      decision_reasons: [
        `Scenario: ${scenario}`,
        `Total return: ${totalReturnPct.toFixed(1)}%`,
        `Yield bucket contributed ${yieldCumulative.toFixed(0)} USD`,
      ],
      btc_under_management: [],
      btc_under_management_metrics: {
        final_total_btc: +btcQty.toFixed(8),
        final_total_value_usd: +holdingFinalValue.toFixed(2),
        peak_btc_value_usd: +(btcQty * Math.max(...btcPrices.slice(0, months))).toFixed(2),
        peak_btc_qty: +btcQty.toFixed(8),
        holding_target_struck: holdingTargetHit,
        holding_strike_month: holdingSellMonth,
      },
    },
    yield_bucket: {
      metrics: {
        final_value_usd: +yieldFinalValue.toFixed(2),
        total_yield_usd: +yieldCumulative.toFixed(2),
        effective_apr: +((yieldCumulative / yieldAllocated / months) * 12 * 100).toFixed(2),
      },
      monthly_data: yieldMonthly,
    },
    btc_holding_bucket: {
      metrics: {
        final_value_usd: +holdingFinalValue.toFixed(2),
        total_return_pct: +holdingReturnPct.toFixed(2),
        target_hit: holdingTargetHit,
        sell_month: holdingSellMonth,
        btc_quantity: +btcQty.toFixed(8),
        target_sell_price_usd: extraStrikes[0]?.strike_price,
      },
      monthly_data: holdingMonthly,
    },
    mining_bucket: {
      metrics: {
        final_health_score: +(miningWaterfall.at(-1)?.health_score ?? 0.8),
        effective_apr: +((miningCumYield / miningAllocated / months) * 12 * 100).toFixed(2),
        avg_opex_coverage_ratio: 0.9,
        capitalization_usd_final: +(miningAllocated + miningCumYield).toFixed(2),
        red_flag_months: 0,
      },
      monthly_waterfall: miningWaterfall,
    },
    commercial,
  } as ScenarioResult
}

export function runProductSimulation(
  payload: ProductSimPayload,
  btcCurvesById: Record<string, number[]>,
  networkCurvesById: Record<string, number[]>,
): RunData {
  const scenarios = ['bear', 'base', 'bull'] as const
  const scenario_results: Record<string, ScenarioResult> = {}

  for (const s of scenarios) {
    const btcId = payload.btc_price_curve_ids[s]
    const netId = payload.network_curve_ids[s]
    const btcPrices = btcCurvesById[btcId] ?? Object.values(btcCurvesById)[0] ?? []
    const networkHp = networkCurvesById[netId] ?? Object.values(networkCurvesById)[0] ?? []
    scenario_results[s] = simulateScenario(payload, btcPrices, networkHp, s)
  }

  return { scenario_results }
}
