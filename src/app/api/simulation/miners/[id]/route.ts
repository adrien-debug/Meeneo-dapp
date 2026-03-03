import { getStore } from '@/lib/sim-store'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const miner = getStore().miners.get(id)
  if (!miner) return NextResponse.json({ detail: 'Not found' }, { status: 404 })
  return NextResponse.json(miner)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const store = getStore()
  const existing = store.miners.get(id)
  if (!existing) return NextResponse.json({ detail: 'Not found' }, { status: 404 })
  const body = await req.json()
  const updated = {
    ...existing,
    ...body,
    id,
    efficiency_j_th:
      (body.power_w ?? existing.power_w) / (body.hashrate_th ?? existing.hashrate_th),
  }
  store.miners.set(id, updated)
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const store = getStore()
  if (!store.miners.has(id)) return NextResponse.json({ detail: 'Not found' }, { status: 404 })
  store.miners.delete(id)
  return NextResponse.json({ ok: true })
}
