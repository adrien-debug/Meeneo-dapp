import type { HostingSite, Miner, SavedCurve } from '@/types/simulation'

export interface AprScheduleEntry {
  from_month: number
  to_month: number
  apr: number
}

export interface TakeProfitEntry {
  price_trigger: number
  sell_pct: number
}

export interface ExtraYieldStrikeEntry {
  strike_price: number
  btc_share_pct: number
}

export interface CurveFamily {
  bear?: SavedCurve
  base?: SavedCurve
  bull?: SavedCurve
  name: string
}

export type CurveIds = { bear: string; base: string; bull: string }

export type { HostingSite, Miner, SavedCurve }
