import { runProductSimulation } from '@/lib/sim-engine'
import { getStore, newId } from '@/lib/sim-store'
import type { ProductSimPayload } from '@/types/simulation'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const payload: ProductSimPayload = await req.json()
    const store = getStore()

    // Build BTC price maps for each scenario curve
    const btcCurvesById: Record<string, number[]> = {}
    for (const [scenario, id] of Object.entries(payload.btc_price_curve_ids)) {
      const curve = store.btcCurves.get(id)
      if (curve) btcCurvesById[id] = curve.monthly_prices
      else {
        // Fallback: use any available curve for that scenario
        const fallback = Array.from(store.btcCurves.values())[0]
        if (fallback) btcCurvesById[id] = fallback.monthly_prices
        else {
          console.warn(`[sim] BTC curve not found for scenario ${scenario}: ${id}`)
          btcCurvesById[id] = Array(120).fill(97000)
        }
      }
    }

    // Build network hashprice maps
    const networkCurvesById: Record<string, number[]> = {}
    for (const [scenario, id] of Object.entries(payload.network_curve_ids)) {
      const curve = store.networkCurves.get(id)
      if (curve) networkCurvesById[id] = curve.hashprice_btc_per_ph_day
      else {
        const fallback = Array.from(store.networkCurves.values())[0]
        if (fallback) networkCurvesById[id] = fallback.hashprice_btc_per_ph_day
        else {
          console.warn(`[sim] Network curve not found for scenario ${scenario}: ${id}`)
          networkCurvesById[id] = Array(120).fill(1.5e-6)
        }
      }
    }

    const runData = runProductSimulation(payload, btcCurvesById, networkCurvesById)
    const id = newId()
    const stored = {
      ...runData,
      id,
      created_at: new Date().toISOString(),
      capital_raised_usd: payload.capital_raised_usd,
    }
    store.runs.set(id, stored)

    return NextResponse.json(stored)
  } catch (e) {
    console.error('[sim] product/simulate', e)
    return NextResponse.json({ detail: 'Simulation failed' }, { status: 500 })
  }
}
