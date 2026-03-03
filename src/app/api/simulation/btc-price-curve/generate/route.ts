import { generateBtcCurve } from '@/lib/sim-engine'
import { getStore, newId } from '@/lib/sim-store'
import type { BtcPriceCurvePayload } from '@/types/simulation'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const payload: BtcPriceCurvePayload = await req.json()
    const result = generateBtcCurve(payload)
    const id = newId()
    const stored = {
      ...result,
      id,
      name: payload.name,
      scenario: payload.scenario,
      created_at: new Date().toISOString(),
    }
    getStore().btcCurves.set(id, stored)
    return NextResponse.json(stored)
  } catch (e) {
    console.error('[sim] btc-price-curve/generate', e)
    return NextResponse.json({ detail: 'Generation failed' }, { status: 500 })
  }
}
