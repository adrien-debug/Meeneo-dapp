'use client'

import { useCallback, useEffect, useRef } from 'react'

const COLS = 28
const ROWS = 16
const SPACING = 52
const DOT_R = 2.2
const HUB_R = 3.5
const PULSE_R = 4.5
const PULSE_TRAIL = 8

const BG = 'transparent'
const LINE_COLOR = 'rgba(0,0,0,0.06)'
const LINE_ACTIVE = 'rgba(150,234,122,0.35)'
const DOT_COLOR = 'rgba(0,0,0,0.10)'
const DOT_ACTIVE = 'rgba(150,234,122,0.8)'
const PULSE_COLOR = '#96EA7A'
const PULSE_GLOW = 'rgba(150,234,122,0.25)'
const HUB_FILL = 'rgba(150,234,122,0.15)'
const HUB_STROKE = 'rgba(150,234,122,0.4)'

interface GridNode {
  x: number
  y: number
  col: number
  row: number
  isHub: boolean
  glow: number
  neighbors: number[]
}

interface Pulse {
  path: number[]
  step: number
  t: number
  speed: number
  alive: boolean
}

export function BlockchainParticles({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const scrollRef = useRef(scrollProgress)
  const mouseRef = useRef({ x: 0.5, y: 0.5, sx: 0.5, sy: 0.5 })
  scrollRef.current = scrollProgress

  const nodesRef = useRef<GridNode[]>([])
  const pulsesRef = useRef<Pulse[]>([])
  const timeRef = useRef(0)

  const buildGrid = useCallback((w: number, h: number) => {
    const nodes: GridNode[] = []
    const ox = (w - (COLS - 1) * SPACING) / 2
    const oy = (h - (ROWS - 1) * SPACING * 0.866) / 2

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const isOddRow = r % 2 === 1
        const x = ox + c * SPACING + (isOddRow ? SPACING * 0.5 : 0)
        const y = oy + r * SPACING * 0.866
        const isHub =
          (r === Math.floor(ROWS / 2) && c === Math.floor(COLS / 2)) ||
          (r === Math.floor(ROWS / 3) && c === Math.floor(COLS / 3)) ||
          (r === Math.floor(ROWS / 3) * 2 && c === Math.floor(COLS / 3) * 2) ||
          (r === Math.floor(ROWS / 2) && c === Math.floor(COLS / 4)) ||
          (r === Math.floor(ROWS / 2) && c === Math.floor((COLS / 4) * 3)) ||
          (r === 3 && c === Math.floor(COLS / 2)) ||
          (r === ROWS - 4 && c === Math.floor(COLS / 2))

        nodes.push({ x, y, col: c, row: r, isHub, glow: 0, neighbors: [] })
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]
      for (let j = i + 1; j < nodes.length; j++) {
        const m = nodes[j]
        const dx = n.x - m.x
        const dy = n.y - m.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < SPACING * 1.15) {
          n.neighbors.push(j)
          m.neighbors.push(i)
        }
      }
    }

    nodesRef.current = nodes
    pulsesRef.current = []
  }, [])

  const spawnPulse = useCallback(() => {
    const nodes = nodesRef.current
    if (nodes.length === 0) return

    const hubs = nodes.map((n, i) => (n.isHub ? i : -1)).filter((i) => i >= 0)
    const start = hubs[Math.floor(Math.random() * hubs.length)]
    const pathLen = 6 + Math.floor(Math.random() * 12)
    const path = [start]
    const visited = new Set([start])

    let current = start
    for (let step = 0; step < pathLen; step++) {
      const nb = nodes[current].neighbors.filter((n) => !visited.has(n))
      if (nb.length === 0) break
      const next = nb[Math.floor(Math.random() * nb.length)]
      path.push(next)
      visited.add(next)
      current = next
    }

    if (path.length < 3) return

    const slot = pulsesRef.current.find((p) => !p.alive)
    const pulse: Pulse = { path, step: 0, t: 0, speed: 0.8 + Math.random() * 0.6, alive: true }
    if (slot) Object.assign(slot, pulse)
    else if (pulsesRef.current.length < 12) pulsesRef.current.push(pulse)
  }, [])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
      const nodes = nodesRef.current
      const pulses = pulsesRef.current
      const scroll = scrollRef.current
      const m = mouseRef.current

      m.sx += (m.x - m.sx) * dt * 3
      m.sy += (m.y - m.sy) * dt * 3

      const parallaxX = (m.sx - 0.5) * 20
      const parallaxY = (m.sy - 0.5) * 12

      ctx.clearRect(0, 0, w, h)
      ctx.save()

      const globalAlpha = Math.max(0, 1 - scroll * 1.5)
      ctx.globalAlpha = globalAlpha
      ctx.translate(parallaxX, parallaxY)

      // Active edges (from pulses)
      const activeEdges = new Set<string>()
      for (const p of pulses) {
        if (!p.alive) continue
        const si = Math.floor(p.step)
        for (let k = Math.max(0, si - PULSE_TRAIL); k <= si && k < p.path.length - 1; k++) {
          const a = Math.min(p.path[k], p.path[k + 1])
          const b = Math.max(p.path[k], p.path[k + 1])
          activeEdges.add(`${a}-${b}`)
        }
      }

      // Draw lines
      const drawnEdges = new Set<string>()
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        for (const j of n.neighbors) {
          if (j <= i) continue
          const key = `${i}-${j}`
          if (drawnEdges.has(key)) continue
          drawnEdges.add(key)

          const m2 = nodes[j]
          const isActive = activeEdges.has(key)

          ctx.beginPath()
          ctx.moveTo(n.x, n.y)
          ctx.lineTo(m2.x, m2.y)
          ctx.strokeStyle = isActive ? LINE_ACTIVE : LINE_COLOR
          ctx.lineWidth = isActive ? 1.5 : 0.7
          ctx.stroke()
        }
      }

      // Decay glow
      for (const n of nodes) {
        n.glow = Math.max(0, n.glow - dt * 1.8)
      }

      // Update pulses
      timeRef.current += dt
      if (Math.random() < dt * 1.2) spawnPulse()

      for (const p of pulses) {
        if (!p.alive) continue
        p.t += dt * p.speed
        if (p.t >= 1) {
          p.t = 0
          p.step++
          if (p.step >= p.path.length - 1) {
            p.alive = false
            continue
          }
          nodes[p.path[p.step]].glow = 1
        }

        const si = Math.floor(p.step)
        if (si >= p.path.length - 1) {
          p.alive = false
          continue
        }

        const from = nodes[p.path[si]]
        const to = nodes[p.path[si + 1]]
        const px = from.x + (to.x - from.x) * p.t
        const py = from.y + (to.y - from.y) * p.t

        // Glow
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 18)
        grad.addColorStop(0, PULSE_GLOW)
        grad.addColorStop(1, 'rgba(150,234,122,0)')
        ctx.beginPath()
        ctx.arc(px, py, 18, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        // Pulse dot
        ctx.beginPath()
        ctx.arc(px, py, PULSE_R, 0, Math.PI * 2)
        ctx.fillStyle = PULSE_COLOR
        ctx.fill()
      }

      // Draw nodes
      for (const n of nodes) {
        const glowAmount = n.glow

        if (n.isHub) {
          // Hub ring
          ctx.beginPath()
          ctx.arc(n.x, n.y, HUB_R + 4, 0, Math.PI * 2)
          ctx.strokeStyle = HUB_STROKE
          ctx.lineWidth = 1
          ctx.stroke()

          ctx.beginPath()
          ctx.arc(n.x, n.y, HUB_R, 0, Math.PI * 2)
          ctx.fillStyle = glowAmount > 0.1 ? DOT_ACTIVE : HUB_FILL
          ctx.fill()
          ctx.strokeStyle = HUB_STROKE
          ctx.lineWidth = 1
          ctx.stroke()
        } else {
          ctx.beginPath()
          ctx.arc(n.x, n.y, DOT_R + glowAmount * 2, 0, Math.PI * 2)
          ctx.fillStyle =
            glowAmount > 0.1 ? `rgba(150,234,122,${0.3 + glowAmount * 0.5})` : DOT_COLOR
          ctx.fill()
        }
      }

      ctx.restore()
    },
    [spawnPulse],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let last = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildGrid(rect.width, rect.height)
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = (e.clientX - rect.left) / rect.width
      mouseRef.current.y = (e.clientY - rect.top) / rect.height
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove)

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const rect = canvas.getBoundingClientRect()
      draw(ctx, rect.width, rect.height, dt)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [buildGrid, draw])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.65 }}
    />
  )
}
