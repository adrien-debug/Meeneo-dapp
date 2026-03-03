'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

const GREEN = new THREE.Color('#96EA7A').convertSRGBToLinear()

// Fibonacci sphere — distributes points evenly on sphere surface
function fibonacciSphere(n: number, radius: number) {
  const pts: [number, number, number][] = []
  const phi = Math.PI * (Math.sqrt(5) - 1)
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = phi * i
    pts.push([radius * r * Math.cos(theta), radius * y, radius * r * Math.sin(theta)])
  }
  return pts
}

function Globe({ phase }: { phase: 'forming' | 'spinning' | 'dissolving' }) {
  const groupRef = useRef<THREE.Group>(null)
  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const ringsRef = useRef<THREE.Group>(null)
  const coreMeshRef = useRef<THREE.Mesh>(null)

  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const NODE_COUNT = 180
  const RADIUS = 2.2

  const spherePts = useMemo(() => fibonacciSphere(NODE_COUNT, RADIUS), [])

  // Node positions + scatter origins (explode from center)
  const positions = useMemo(() => {
    const arr = new Float32Array(NODE_COUNT * 3)
    for (let i = 0; i < NODE_COUNT; i++) {
      arr[i * 3] = spherePts[i][0]
      arr[i * 3 + 1] = spherePts[i][1]
      arr[i * 3 + 2] = spherePts[i][2]
    }
    return arr
  }, [spherePts])

  const scatterOrigins = useMemo(() => {
    const arr = new Float32Array(NODE_COUNT * 3)
    for (let i = 0; i < NODE_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 12
      arr[i * 3 + 1] = (Math.random() - 0.5) * 12
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12
    }
    return arr
  }, [])

  // Line pairs: connect nearby nodes
  const linePositions = useMemo(() => {
    const pairs: number[] = []
    for (let i = 0; i < NODE_COUNT; i++) {
      const [ax, ay, az] = spherePts[i]
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const [bx, by, bz] = spherePts[j]
        const d = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2)
        if (d < 0.9 && pairs.length < 3000) {
          pairs.push(ax, ay, az, bx, by, bz)
        }
      }
    }
    return new Float32Array(pairs)
  }, [spherePts])

  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(linePositions.slice(), 3))
    return g
  }, [linePositions])

  // Animated positions (lerp scatter → sphere or sphere → scatter)
  const animPos = useMemo(() => new Float32Array(positions), [positions])
  const tAnim = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state, delta) => {
    if (!groupRef.current || !pointsRef.current || !linesRef.current) return
    const t = state.clock.elapsedTime
    const ph = phaseRef.current

    // Animate phase progress — lent
    if (ph === 'forming') {
      tAnim.current = Math.min(tAnim.current + delta * 0.35, 1)
    } else if (ph === 'spinning') {
      tAnim.current = 1
    } else if (ph === 'dissolving') {
      tAnim.current = Math.max(tAnim.current - delta * 0.45, 0)
    }

    const prog = easeInOut(tAnim.current)

    // Update node positions (lerp scatter → sphere)
    for (let i = 0; i < NODE_COUNT; i++) {
      const tx = spherePts[i][0]
      const ty = spherePts[i][1]
      const tz = spherePts[i][2]
      const sx = scatterOrigins[i * 3]
      const sy = scatterOrigins[i * 3 + 1]
      const sz = scatterOrigins[i * 3 + 2]

      animPos[i * 3] = sx + (tx - sx) * prog
      animPos[i * 3 + 1] = sy + (ty - sy) * prog
      animPos[i * 3 + 2] = sz + (tz - sz) * prog
    }
    ;(pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).array = animPos
    ;(pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true

    // Update line positions (lerp scatter → sphere)
    const lp = lineGeo.attributes.position as THREE.BufferAttribute
    const lpArr = lp.array as Float32Array
    let li = 0
    for (let i = 0; i < NODE_COUNT && li < lpArr.length - 5; i++) {
      const [ax, ay, az] = spherePts[i]
      const sx0 = scatterOrigins[i * 3]
      const sy0 = scatterOrigins[i * 3 + 1]
      const sz0 = scatterOrigins[i * 3 + 2]
      const cx = sx0 + (ax - sx0) * prog
      const cy = sy0 + (ay - sy0) * prog
      const cz = sz0 + (az - sz0) * prog

      for (let j = i + 1; j < NODE_COUNT && li < lpArr.length - 5; j++) {
        const [bx, by, bz] = spherePts[j]
        const d = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2)
        if (d < 0.9) {
          const sx1 = scatterOrigins[j * 3]
          const sy1 = scatterOrigins[j * 3 + 1]
          const sz1 = scatterOrigins[j * 3 + 2]
          const dx = sx1 + (bx - sx1) * prog
          const dy = sy1 + (by - sy1) * prog
          const dz = sz1 + (bz - sz1) * prog

          lpArr[li] = cx
          lpArr[li + 1] = cy
          lpArr[li + 2] = cz
          lpArr[li + 3] = dx
          lpArr[li + 4] = dy
          lpArr[li + 5] = dz
          li += 6
        }
      }
    }
    lp.needsUpdate = true

    // Group rotation
    groupRef.current.rotation.y = t * 0.22
    groupRef.current.rotation.x = Math.sin(t * 0.15) * 0.18

    // Opacity of elements
    const fade = prog
    const pMat = pointsRef.current.material as THREE.PointsMaterial
    pMat.opacity = fade * 0.85

    const lMat = linesRef.current.material as THREE.LineBasicMaterial
    lMat.opacity = fade * 0.25

    if (coreMeshRef.current) {
      const cMat = coreMeshRef.current.material as THREE.MeshBasicMaterial
      cMat.opacity = fade * (0.04 + Math.sin(t * 1.5) * 0.02)
      coreMeshRef.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.05)
    }

    // Rings
    if (ringsRef.current) {
      ringsRef.current.children.forEach((child, idx) => {
        const mat = (child as THREE.Mesh).material as THREE.LineBasicMaterial
        if (mat) {
          mat.opacity = fade * 0.15
        }
        child.rotation.z = t * (0.1 + idx * 0.05)
        child.rotation.x = t * (0.07 - idx * 0.03)
      })
    }
  })

  const ringGeos = useMemo(() => {
    return [2.25, 2.4, 2.6].map((r, i) => {
      const pts: THREE.Vector3[] = []
      const segs = 128
      const tiltX = (i * Math.PI) / 4
      const tiltZ = (i * Math.PI) / 3
      for (let k = 0; k <= segs; k++) {
        const a = (k / segs) * Math.PI * 2
        const x = Math.cos(a) * r
        const y = Math.sin(a) * r
        // tilt each ring differently
        const rx = x
        const ry = y * Math.cos(tiltX)
        const rz = y * Math.sin(tiltX) + x * Math.sin(tiltZ) * 0.3
        pts.push(new THREE.Vector3(rx, ry, rz))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const mat = new THREE.LineBasicMaterial({
        color: GREEN,
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
      })
      return new THREE.Line(geo, mat)
    })
  }, [])

  const nodeColors = useMemo(() => {
    const c = new Float32Array(NODE_COUNT * 3)
    for (let i = 0; i < NODE_COUNT; i++) {
      // Some nodes brighter
      const bright = Math.random() > 0.85
      c[i * 3] = bright ? GREEN.r * 1.2 : GREEN.r
      c[i * 3 + 1] = bright ? GREEN.g * 1.2 : GREEN.g * 0.7
      c[i * 3 + 2] = bright ? GREEN.b * 1.2 : GREEN.b * 0.4
    }
    return c
  }, [])

  const nodeSizes = useMemo(() => {
    const s = new Float32Array(NODE_COUNT)
    for (let i = 0; i < NODE_COUNT; i++) s[i] = 0.03 + Math.random() * 0.04
    return s
  }, [])

  return (
    <group ref={groupRef}>
      {/* Orbit rings */}
      <group ref={ringsRef}>
        {ringGeos.map((line, i) => (
          <primitive key={i} object={line} />
        ))}
      </group>

      {/* Nodes */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[animPos, 3]} count={NODE_COUNT} />
          <bufferAttribute attach="attributes-color" args={[nodeColors, 3]} count={NODE_COUNT} />
          <bufferAttribute attach="attributes-size" args={[nodeSizes, 1]} count={NODE_COUNT} />
        </bufferGeometry>
        <pointsMaterial
          transparent
          opacity={0}
          depthWrite={false}
          vertexColors
          sizeAttenuation
          size={0.05}
        />
      </points>

      {/* Connection lines */}
      <lineSegments ref={linesRef} geometry={lineGeo}>
        <lineBasicMaterial transparent opacity={0} depthWrite={false} color={GREEN} />
      </lineSegments>

      {/* Core glow */}
      <mesh ref={coreMeshRef}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial
          color={GREEN}
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Inner bright core */}
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.6} depthWrite={false} />
      </mesh>
    </group>
  )
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

type Phase = 'forming' | 'spinning' | 'dissolving' | 'hidden'

interface EnergyGlobeProps {
  trigger: boolean
}

export function EnergyGlobe({ trigger }: EnergyGlobeProps) {
  const [phase, setPhase] = useState<Phase>('hidden')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!trigger) return
    if (phase !== 'hidden') return

    setVisible(true)
    setPhase('forming')

    const t1 = setTimeout(() => setPhase('spinning'), 3200) // forming pendant ~3s
    const t2 = setTimeout(() => setPhase('dissolving'), 5500) // spinning pendant ~2s
    const t3 = setTimeout(() => {
      setPhase('hidden')
      setVisible(false)
    }, 8000) // dissolving pendant ~2.5s

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [trigger, phase])

  if (!visible) return null

  return (
    <div
      className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
      style={{
        opacity: phase === 'dissolving' ? 0 : 1,
        transition: phase === 'dissolving' ? 'opacity 2.2s ease-out' : 'none',
      }}
    >
      <div className="w-full h-full">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, outputColorSpace: 'srgb' }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.3} />
          <pointLight position={[3, 3, 3]} intensity={0.5} color="#96EA7A" />
          {phase !== 'hidden' && <Globe phase={phase} />}
        </Canvas>
      </div>
    </div>
  )
}
