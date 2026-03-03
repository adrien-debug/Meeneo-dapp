import { getStore, newId } from '@/lib/sim-store'
import { NextResponse } from 'next/server'

export async function GET() {
  const sites = Array.from(getStore().sites.values())
  return NextResponse.json(sites)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = newId()
    const site = {
      id,
      name: body.name,
      electricity_price_usd_per_kwh: body.electricity_price_usd_per_kwh ?? 0.065,
      hosting_fee_usd_per_kw_month: body.hosting_fee_usd_per_kw_month ?? 5,
      uptime_expectation: body.uptime_expectation ?? 0.97,
      curtailment_pct: body.curtailment_pct ?? 0,
      capacity_mw_available: body.capacity_mw_available ?? 10,
      lockup_months: body.lockup_months ?? 12,
      notice_period_days: body.notice_period_days ?? 30,
    }
    getStore().sites.set(id, site)
    return NextResponse.json(site, { status: 201 })
  } catch (e) {
    console.error('[sim] hosting POST', e)
    return NextResponse.json({ detail: 'Invalid payload' }, { status: 400 })
  }
}
