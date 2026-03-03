'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

/* ─── Palette ────────────────────────────────────────── */
const GREEN = new THREE.Color('#96EA7A').convertSRGBToLinear()
const MINT = new THREE.Color('#b8f0a0').convertSRGBToLinear()
const GHOST = new THREE.Color('#d4f7c8').convertSRGBToLinear()

const VIVID = new THREE.Color('#5cd645').convertSRGBToLinear()
const BRIGHT = new THREE.Color('#7aff55').convertSRGBToLinear()

/* ─── Shared scroll progress (written from React, read in R3F) ─ */
const scrollTarget = { value: 0 }
const scrollProgress = { value: 0 }

/* ─── 4 step-node positions ─────────────────────────── */
const STEP_POS = [
  new THREE.Vector3(-2.4, 1.2, 0),
  new THREE.Vector3(-0.8, 0.5, -0.08),
  new THREE.Vector3(0.8, 1.1, -0.04),
  new THREE.Vector3(2.4, 0.6, 0.04),
]

/* ─── Per-node reveal thresholds ────────────────────── */
const NODE_THRESHOLDS = [0.05, 0.25, 0.5, 0.72]

function nodeVisibility(nodeIndex: number): number {
  const p = scrollProgress.value
  const start = NODE_THRESHOLDS[nodeIndex]
  const end = start + 0.18
  return THREE.MathUtils.clamp((p - start) / (end - start), 0, 1)
}

/* ─── Smooth curve ──────────────────────────────────── */
const FLOW_CURVE = new THREE.CatmullRomCurve3(
  [new THREE.Vector3(-4.5, 1.4, 0.15), ...STEP_POS, new THREE.Vector3(4.5, 0.4, 0.15)],
  false,
  'centripetal',
  0.5,
)

/* ═══════════════════════════════════════════════════════
   FlowTube — translucent pipeline
   ═══════════════════════════════════════════════════════ */
function FlowTube() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    const reveal = THREE.MathUtils.clamp(scrollProgress.value / 0.15, 0, 1)
    mat.opacity = (0.06 + Math.sin(clock.elapsedTime * 0.5) * 0.025) * reveal
  })

  return (
    <mesh ref={meshRef}>
      <tubeGeometry args={[FLOW_CURVE, 200, 0.04, 12, false]} />
      <meshBasicMaterial
        color={GREEN}
        transparent
        opacity={0}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/* ═══════════════════════════════════════════════════════
   HelixFlow — double helix of particles along curve
   ═══════════════════════════════════════════════════════ */
function HelixFlow() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const count = 300

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        t: Math.random(),
        speed: 0.004 + Math.random() * 0.01,
        stream: i % 2,
        radius: 0.06 + Math.random() * 0.12,
        size: 0.008 + Math.random() * 0.016,
        phase: Math.random() * Math.PI * 2,
        helixFreq: 8 + Math.random() * 4,
      })),
    [],
  )

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime
    const maxT = THREE.MathUtils.clamp(scrollProgress.value * 1.5, 0, 1)

    for (let i = 0; i < count; i++) {
      const s = seeds[i]
      const ct = (s.t + t * s.speed) % 1

      if (ct > maxT) {
        dummy.scale.setScalar(0)
        dummy.position.set(0, -100, 0)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
        continue
      }

      const pt = FLOW_CURVE.getPointAt(ct)
      const helixAngle = ct * s.helixFreq * Math.PI * 2 + s.stream * Math.PI + t * 0.15
      const offY = Math.cos(helixAngle) * s.radius
      const offZ = Math.sin(helixAngle) * s.radius

      dummy.position.set(pt.x, pt.y + offY, pt.z + offZ)

      let prox = 0
      for (const n of STEP_POS) {
        const d = dummy.position.distanceTo(n)
        if (d < 0.4) prox = Math.max(prox, 1 - d / 0.4)
      }

      dummy.scale.setScalar(s.size * (1 + prox * 2))
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={GREEN} transparent opacity={0.2} depthWrite={false} />
    </instancedMesh>
  )
}

/* ═══════════════════════════════════════════════════════
   DataPulses — bright fast-moving orbs with trails
   ═══════════════════════════════════════════════════════ */
function DataPulses() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const pulseCount = 10
  const trailLen = 6
  const count = pulseCount * trailLen

  const seeds = useMemo(
    () =>
      Array.from({ length: pulseCount }, (_, i) => ({
        offset: i / pulseCount,
        speed: 0.02 + Math.random() * 0.015,
      })),
    [],
  )

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime
    const maxT = THREE.MathUtils.clamp(scrollProgress.value * 1.5, 0, 1)

    let idx = 0
    for (let i = 0; i < pulseCount; i++) {
      const s = seeds[i]

      for (let tr = 0; tr < trailLen; tr++) {
        const delay = tr * 0.008
        const ct = (((s.offset + (t - delay) * s.speed) % 1) + 1) % 1

        if (ct > maxT) {
          dummy.scale.setScalar(0)
          dummy.position.set(0, -100, 0)
        } else {
          const pt = FLOW_CURVE.getPointAt(ct)
          dummy.position.copy(pt)
          const fade = 1 - tr / trailLen
          const pulse = (0.03 + Math.sin(t * 5 + i * 1.8) * 0.01) * fade
          dummy.scale.setScalar(Math.max(0.001, pulse))
        }
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(idx, dummy.matrix)
        idx++
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial color={BRIGHT} transparent opacity={0.25} depthWrite={false} />
    </instancedMesh>
  )
}

/* ═══════════════════════════════════════════════════════
   StepNode — glowing icosahedron + orbit rings
   ═══════════════════════════════════════════════════════ */
function StepNode({ position, index }: { position: THREE.Vector3; index: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const r1 = useRef<THREE.Mesh>(null)
  const r2 = useRef<THREE.Mesh>(null)
  const r3 = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const p = index * 1.5
    const vis = nodeVisibility(index)

    if (groupRef.current) {
      groupRef.current.position.y = position.y + Math.sin(t * 0.6 + p) * 0.07
      const s = THREE.MathUtils.lerp(0, 1, vis)
      groupRef.current.scale.setScalar(s)
      groupRef.current.visible = vis > 0.001
    }

    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.3 + index
      coreRef.current.rotation.x = t * 0.15
      coreRef.current.scale.setScalar(1 + Math.sin(t * 2.5 + p) * 0.15)
    }
    if (r1.current) {
      r1.current.rotation.x = t * 0.18 + index
      r1.current.rotation.y = t * 0.12
    }
    if (r2.current) {
      r2.current.rotation.z = -t * 0.15 + index * 2
      r2.current.rotation.x = Math.PI / 2.5
    }
    if (r3.current) {
      r3.current.rotation.y = t * 0.1 + index * 0.8
      r3.current.rotation.z = Math.PI / 3
    }
  })

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.28, 1]} />
        <meshBasicMaterial color={VIVID} transparent opacity={0.2} depthWrite={false} wireframe />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={BRIGHT} transparent opacity={0.22} depthWrite={false} />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshBasicMaterial
          color={GREEN}
          transparent
          opacity={0.02}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh ref={r1}>
        <torusGeometry args={[0.55, 0.004, 8, 64]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh ref={r2}>
        <torusGeometry args={[0.45, 0.003, 8, 64]} />
        <meshBasicMaterial color={MINT} transparent opacity={0.08} depthWrite={false} />
      </mesh>
      <mesh ref={r3}>
        <torusGeometry args={[0.65, 0.003, 8, 64]} />
        <meshBasicMaterial color={MINT} transparent opacity={0.09} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════
   VortexParticles — swirling particles at each node
   ═══════════════════════════════════════════════════════ */
function VortexParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const perNode = 28
  const count = perNode * STEP_POS.length

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        nodeIdx: Math.floor(i / perNode),
        angle: ((i % perNode) / perNode) * Math.PI * 2,
        radius: 0.2 + Math.random() * 0.25,
        speed: 0.4 + Math.random() * 0.4,
        yOff: (Math.random() - 0.5) * 0.3,
        size: 0.007 + Math.random() * 0.012,
      })),
    [],
  )

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime

    for (let i = 0; i < count; i++) {
      const s = seeds[i]
      const vis = nodeVisibility(s.nodeIdx)

      if (vis < 0.01) {
        dummy.scale.setScalar(0)
        dummy.position.set(0, -100, 0)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
        continue
      }

      const node = STEP_POS[s.nodeIdx]
      const angle = s.angle + t * s.speed

      dummy.position.set(
        node.x + Math.cos(angle) * s.radius,
        node.y + s.yOff + Math.sin(t * 0.8 + i * 0.2) * 0.05,
        node.z + Math.sin(angle) * s.radius,
      )
      dummy.scale.setScalar(s.size * vis)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={VIVID} transparent opacity={0.15} depthWrite={false} />
    </instancedMesh>
  )
}

/* ═══════════════════════════════════════════════════════
   NodePulseRings — expanding concentric rings
   ═══════════════════════════════════════════════════════ */
function NodePulseRings() {
  const groupRef = useRef<THREE.Group>(null)
  const ringsPerNode = 3

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime

    let nodeIdx = 0
    groupRef.current.children.forEach((nodeGroup) => {
      const vis = nodeVisibility(nodeIdx)
      nodeGroup.children.forEach((ring, i) => {
        const mesh = ring as THREE.Mesh
        const phase = (t * 0.15 + i / ringsPerNode + nodeIdx * 0.2) % 1
        mesh.scale.setScalar((0.3 + phase * 0.9) * vis)
        ;(mesh.material as THREE.MeshBasicMaterial).opacity =
          vis > 0.01 ? (1 - phase) * 0.12 * vis : 0
      })
      nodeIdx++
    })
  })

  return (
    <group ref={groupRef}>
      {STEP_POS.map((pos, ni) => (
        <group key={ni} position={[pos.x, pos.y, pos.z]}>
          {Array.from({ length: ringsPerNode }, (_, i) => (
            <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.65, 0.67, 64]} />
              <meshBasicMaterial
                color={GREEN}
                transparent
                opacity={0}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════
   AtmosphericDust — ambient floating particles
   ═══════════════════════════════════════════════════════ */
function AtmosphericDust() {
  const ref = useRef<THREE.Points>(null)
  const count = 150

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8
      arr[i * 3 + 2] = (Math.random() - 0.5) * 5
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.01
    ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.05) * 0.025
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial
        color={GHOST}
        transparent
        opacity={0.06}
        size={0.018}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

/* ═══════════════════════════════════════════════════════
   FlowRibbon — curved line
   ═══════════════════════════════════════════════════════ */
function FlowRibbon() {
  const lineObj = useMemo(() => {
    const points = FLOW_CURVE.getPoints(200)
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineBasicMaterial({
      color: GREEN,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    return new THREE.Line(geo, mat)
  }, [])

  useFrame(({ clock }) => {
    const mat = lineObj.material as THREE.LineBasicMaterial
    const reveal = THREE.MathUtils.clamp(scrollProgress.value / 0.15, 0, 1)
    mat.opacity = (0.08 + Math.sin(clock.elapsedTime * 0.4) * 0.04) * reveal
  })

  return <primitive object={lineObj} />
}

/* ═══════════════════════════════════════════════════════
   Scene
   ═══════════════════════════════════════════════════════ */
function Scene() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    // Smooth interpolation — prevents jump when scrolling fast
    scrollProgress.value += (scrollTarget.value - scrollProgress.value) * 0.012

    if (!groupRef.current) return
    const t = clock.elapsedTime
    groupRef.current.rotation.y = Math.sin(t * 0.02) * 0.03
    groupRef.current.rotation.x = Math.sin(t * 0.03) * 0.015
  })

  return (
    <group ref={groupRef}>
      <AtmosphericDust />
      <FlowTube />
      <FlowRibbon />
      <HelixFlow />
      <DataPulses />
      <VortexParticles />
      <NodePulseRings />
      {STEP_POS.map((pos, i) => (
        <StepNode key={i} position={pos} index={i} />
      ))}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════
   Export — Canvas with scroll-driven reveal
   ═══════════════════════════════════════════════════════ */
export function StepFlowCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById('how-it-works')
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const raw = 1 - rect.top / vh
      scrollTarget.value = THREE.MathUtils.clamp(raw, 0, 1)
    }

    scrollTarget.value = 0
    scrollProgress.value = 0
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, outputColorSpace: 'srgb' }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
