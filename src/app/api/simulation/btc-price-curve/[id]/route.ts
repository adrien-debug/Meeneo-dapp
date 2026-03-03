import { getStore } from '@/lib/sim-store'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const curve = getStore().btcCurves.get(id)
  if (!curve) return NextResponse.json({ detail: 'Not found' }, { status: 404 })
  return NextResponse.json(curve)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const store = getStore()
  if (!store.btcCurves.has(id)) return NextResponse.json({ detail: 'Not found' }, { status: 404 })
  store.btcCurves.delete(id)
  return NextResponse.json({ ok: true })
}
