import { getStore, newId } from '@/lib/sim-store'
import { NextResponse } from 'next/server'

export async function GET() {
  const miners = Array.from(getStore().miners.values())
  return NextResponse.json(miners)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = newId()
    const miner = {
      id,
      name: body.name,
      hashrate_th: body.hashrate_th,
      power_w: body.power_w,
      price_usd: body.price_usd,
      lifetime_months: body.lifetime_months ?? 36,
      maintenance_pct: body.maintenance_pct ?? 0.02,
      efficiency_j_th: body.power_w / body.hashrate_th,
    }
    getStore().miners.set(id, miner)
    return NextResponse.json(miner, { status: 201 })
  } catch (e) {
    console.error('[sim] miners POST', e)
    return NextResponse.json({ detail: 'Invalid payload' }, { status: 400 })
  }
}
