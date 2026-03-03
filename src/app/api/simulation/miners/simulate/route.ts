import { simulateMiner } from '@/lib/sim-engine'
import { getStore, newId } from '@/lib/sim-store'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const store = getStore()

    const miner = store.miners.get(body.miner_id)
    if (!miner) return NextResponse.json({ detail: 'Miner not found' }, { status: 404 })

    const btcCurve = store.btcCurves.get(body.btc_price_curve_id)
    if (!btcCurve) return NextResponse.json({ detail: 'BTC curve not found' }, { status: 404 })

    const netCurve = store.networkCurves.get(body.network_curve_id)
    if (!netCurve) return NextResponse.json({ detail: 'Network curve not found' }, { status: 404 })

    // Use custom site params if provided (overriding seed sites)
    const site = store.sites.get('seed-site-texas')!
    const customSite = {
      ...site,
      electricity_price_usd_per_kwh: body.electricity_rate ?? site.electricity_price_usd_per_kwh,
      uptime_expectation: body.uptime ?? site.uptime_expectation,
    }

    const result = simulateMiner(
      miner,
      customSite,
      btcCurve.monthly_prices,
      netCurve.hashprice_btc_per_ph_day,
      body.months ?? 36,
    )

    const id = newId()
    return NextResponse.json({ ...result, id })
  } catch (e) {
    console.error('[sim] miners/simulate', e)
    return NextResponse.json({ detail: 'Simulation failed' }, { status: 500 })
  }
}
