import { getStore, toSavedCurve } from '@/lib/sim-store'
import { NextResponse } from 'next/server'

export async function GET() {
  const store = getStore()
  const curves = Array.from(store.networkCurves.values()).map(toSavedCurve)
  return NextResponse.json(curves)
}
