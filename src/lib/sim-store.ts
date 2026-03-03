/**
 * In-memory store for simulation data.
 * Uses a global singleton so data persists across API route calls in dev.
 */

import type {
  BtcPriceCurveResult,
  HostingSite,
  Miner,
  NetworkCurveResult,
  RunData,
  SavedCurve,
} from '@/types/simulation'

interface StoredBtcCurve extends BtcPriceCurveResult {
  id: string
  name: string
  scenario: string
  created_at: string
}

interface StoredNetworkCurve extends NetworkCurveResult {
  id: string
  name: string
  scenario: string
  created_at: string
}

interface SimStore {
  btcCurves: Map<string, StoredBtcCurve>
  networkCurves: Map<string, StoredNetworkCurve>
  miners: Map<string, Miner>
  sites: Map<string, HostingSite>
  runs: Map<string, RunData & { id: string; created_at: string; capital_raised_usd: number }>
}

declare global {
  var __simStore: SimStore | undefined
}

function createStore(): SimStore {
  const store: SimStore = {
    btcCurves: new Map(),
    networkCurves: new Map(),
    miners: new Map(),
    sites: new Map(),
    runs: new Map(),
  }

  // Seed default miners
  const s21: Miner = {
    id: 'seed-miner-s21',
    name: 'Antminer S21',
    hashrate_th: 200,
    power_w: 3500,
    price_usd: 5800,
    lifetime_months: 36,
    maintenance_pct: 0.02,
    efficiency_j_th: 17.5,
  }
  const s21xp: Miner = {
    id: 'seed-miner-s21xp',
    name: 'Antminer S21 XP',
    hashrate_th: 270,
    power_w: 3645,
    price_usd: 7200,
    lifetime_months: 36,
    maintenance_pct: 0.02,
    efficiency_j_th: 13.5,
  }
  store.miners.set(s21.id, s21)
  store.miners.set(s21xp.id, s21xp)

  // Seed default hosting sites
  const texas: HostingSite = {
    id: 'seed-site-texas',
    name: 'Texas Facility',
    electricity_price_usd_per_kwh: 0.065,
    hosting_fee_usd_per_kw_month: 5,
    uptime_expectation: 0.97,
    curtailment_pct: 0.03,
    capacity_mw_available: 50,
    lockup_months: 12,
    notice_period_days: 30,
  }
  const wyoming: HostingSite = {
    id: 'seed-site-wyoming',
    name: 'Wyoming Facility',
    electricity_price_usd_per_kwh: 0.045,
    hosting_fee_usd_per_kw_month: 6,
    uptime_expectation: 0.98,
    curtailment_pct: 0.01,
    capacity_mw_available: 30,
    lockup_months: 24,
    notice_period_days: 60,
  }
  store.sites.set(texas.id, texas)
  store.sites.set(wyoming.id, wyoming)

  return store
}

export function getStore(): SimStore {
  if (!global.__simStore) {
    global.__simStore = createStore()
  }
  return global.__simStore
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function toSavedCurve(c: StoredBtcCurve | StoredNetworkCurve): SavedCurve {
  return { id: c.id, name: c.name, scenario: c.scenario }
}
