'use client'

import { useCallback, useEffect, useRef } from 'react'

interface Props {
  hovered: boolean
  variant: 'rwa' | 'yield' | 'monthly' | 'transparent'
}

// Configs per card type
const CONFIGS = {
  rwa: {
    // Floating cubes/blocks representing tokenized assets
    particleCount: 18,
    color: [150, 234, 122] as [number, number, number],
    speed: 0.3,
  },
  yield: {
    particleCount: 22,
    color: [150, 234, 122] as [number, number, number],
    speed: 0.4,
  },
  monthly: {
    particleCount: 16,
    color: [150, 234, 122] as [number, number, number],
    speed: 0.25,
  },
  transparent: {
    particleCount: 20,
    color: [150, 234, 122] as [number, number, number],
    speed: 0.35,
  },
}

interface Cube {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  size: number
  rotX: number
  rotY: number
  rotZ: number
  vrotX: number
  vrotY: number
  opacity: number
}

function projectPoint(x: number, y: number, z: number, fov: number, cx: number, cy: number) {
  const scale = fov / (fov + z)
  return {
    sx: cx + x * scale,
    sy: cy + y * scale,
    scale,
  }
}

function drawCube(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  rotX: number,
  rotY: number,
  color: [number, number, number],
  opacity: number,
  hovered: boolean,
) {
  const s = size / 2
  // 8 vertices of a cube
  const verts: [number, number, number][] = [
    [-s, -s, -s],
    [s, -s, -s],
    [s, s, -s],
    [-s, s, -s],
    [-s, -s, s],
    [s, -s, s],
    [s, s, s],
    [-s, s, s],
  ]

  // Rotate vertices
  const cosX = Math.cos(rotX),
    sinX = Math.sin(rotX)
  const cosY = Math.cos(rotY),
    sinY = Math.sin(rotY)

  const rotated = verts.map(([x, y, z]) => {
    // rotate X
    const y1 = y * cosX - z * sinX
    const z1 = y * sinX + z * cosX
    // rotate Y
    const x2 = x * cosY + z1 * sinY
    const z2 = -x * sinY + z1 * cosY
    return [x2, y1, z2] as [number, number, number]
  })

  // Project to 2D
  const fov = 180
  const proj = rotated.map(([x, y, z]) => {
    const scale = fov / (fov + z + 60)
    return { sx: cx + x * scale, sy: cy + y * scale }
  })

  // Edges
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0], // back
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4], // front
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7], // sides
  ]

  const alpha = hovered ? opacity * 0.9 : opacity * 0.55
  const glowAlpha = hovered ? opacity * 0.25 : 0

  // Glow on hover
  if (hovered && glowAlpha > 0) {
    ctx.shadowColor = `rgba(${color[0]},${color[1]},${color[2]},0.6)`
    ctx.shadowBlur = 8
  }

  ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`
  ctx.lineWidth = hovered ? 1.2 : 0.8

  for (const [a, b] of edges) {
    ctx.beginPath()
    ctx.moveTo(proj[a].sx, proj[a].sy)
    ctx.lineTo(proj[b].sx, proj[b].sy)
    ctx.stroke()
  }

  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'
}

export function FeatureCardCanvas({ hovered, variant }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const cubesRef = useRef<Cube[]>([])
  const hoveredRef = useRef(hovered)
  hoveredRef.current = hovered

  const config = CONFIGS[variant]

  const init = useCallback(
    (w: number, h: number) => {
      cubesRef.current = Array.from({ length: config.particleCount }, () => ({
        x: (Math.random() - 0.5) * w * 0.8,
        y: (Math.random() - 0.5) * h * 0.8,
        z: (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * config.speed,
        vy: (Math.random() - 0.5) * config.speed,
        vz: (Math.random() - 0.5) * config.speed * 0.5,
        size: 8 + Math.random() * 14,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        vrotX: (Math.random() - 0.5) * 0.008,
        vrotY: (Math.random() - 0.5) * 0.012,
        opacity: 0.2 + Math.random() * 0.4,
      }))
    },
    [config],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      init(rect.width, rect.height)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let last = performance.now()

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      const cx = w / 2
      const cy = h / 2
      const isHovered = hoveredRef.current

      ctx.clearRect(0, 0, w, h)

      const speedMult = isHovered ? 1.8 : 1.0

      for (const cube of cubesRef.current) {
        cube.x += cube.vx * speedMult
        cube.y += cube.vy * speedMult
        cube.z += cube.vz * speedMult

        cube.rotX += cube.vrotX * speedMult
        cube.rotY += cube.vrotY * speedMult

        // Bounce
        if (Math.abs(cube.x) > w * 0.55) cube.vx *= -1
        if (Math.abs(cube.y) > h * 0.55) cube.vy *= -1
        if (Math.abs(cube.z) > 60) cube.vz *= -1

        drawCube(
          ctx,
          cx + cube.x,
          cy + cube.y,
          cube.size,
          cube.rotX,
          cube.rotY,
          config.color,
          cube.opacity,
          isHovered,
        )
      }

      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
    }
  }, [init, config])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full rounded-2xl"
      style={{ opacity: hovered ? 1 : 0.6, transition: 'opacity 0.4s ease' }}
    />
  )
}
