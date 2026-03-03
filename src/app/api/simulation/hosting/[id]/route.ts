import { getStore } from '@/lib/sim-store'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const site = getStore().sites.get(id)
  if (!site) return NextResponse.json({ detail: 'Not found' }, { status: 404 })
  return NextResponse.json(site)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const store = getStore()
  const existing = store.sites.get(id)
  if (!existing) return NextResponse.json({ detail: 'Not found' }, { status: 404 })
  const body = await req.json()
  const updated = { ...existing, ...body, id }
  store.sites.set(id, updated)
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const store = getStore()
  if (!store.sites.has(id)) return NextResponse.json({ detail: 'Not found' }, { status: 404 })
  store.sites.delete(id)
  return NextResponse.json({ ok: true })
}
