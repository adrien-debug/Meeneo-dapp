'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const GREEN = new THREE.Color('#96EA7A').convertSRGBToLinear()
const MINT = new THREE.Color('#b8f0a0').convertSRGBToLinear()
const PALE = new THREE.Color('#d0f5c0').convertSRGBToLinear()
const WHITE_GREEN = new THREE.Color('#e8fce2').convertSRGBToLinear()

// ── Slowly rotating wireframe sphere with inner glow ─────────────────────────
function GlassSphere({
  position,
  radius = 1.5,
  speed = 0.06,
}: {
  position: [number, number, number]
  radius?: number
  speed?: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const innerRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    groupRef.current.rotation.y = t * speed
    groupRef.current.rotation.x = t * speed * 0.3
    groupRef.current.position.y = position[1] + Math.sin(t * 0.08) * 0.3
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * speed * 1.5
      innerRef.current.rotation.z = t * speed * 0.7
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Outer wireframe sphere */}
      <mesh>
        <icosahedronGeometry args={[radius, 2]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.08} wireframe depthWrite={false} />
      </mesh>
      {/* Inner wireframe sphere */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[radius * 0.6, 1]} />
        <meshBasicMaterial color={MINT} transparent opacity={0.05} wireframe depthWrite={false} />
      </mesh>
      {/* Subtle glow halo */}
      <mesh>
        <sphereGeometry args={[radius * 1.08, 32, 32]} />
        <meshBasicMaterial
          color={PALE}
          transparent
          opacity={0.02}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

// ── Orbit ring ───────────────────────────────────────────────────────────────
function OrbitRing({
  position,
  radius = 2,
  tilt = 0,
  speed = 0.04,
  opacity = 0.09,
}: {
  position: [number, number, number]
  radius?: number
  tilt?: number
  speed?: number
  opacity?: number
}) {
  const groupRef = useRef<THREE.Group>(null)

  const lineObj = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0)
    const pts = curve.getPoints(96).map((p) => new THREE.Vector3(p.x, 0, p.y))
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({
      color: GREEN,
      transparent: true,
      opacity,
      depthWrite: false,
    })
    return new THREE.Line(geo, mat)
  }, [radius, opacity])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = clock.elapsedTime * speed
  })

  return (
    <group position={position} rotation={[tilt, 0, 0]}>
      <group ref={groupRef}>
        <primitive object={lineObj} />
      </group>
    </group>
  )
}

// ── Pulsing dot on orbit ─────────────────────────────────────────────────────
function OrbitDot({
  center,
  radius = 2,
  tilt = 0,
  speed = 0.3,
  phase = 0,
  dotSize = 0.06,
  opacity = 0.6,
}: {
  center: [number, number, number]
  radius?: number
  tilt?: number
  speed?: number
  phase?: number
  dotSize?: number
  opacity?: number
}) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const angle = clock.elapsedTime * speed + phase
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    const y = Math.sin(tilt) * z
    const zp = Math.cos(tilt) * z
    ref.current.position.set(center[0] + x, center[1] + y, center[2] + zp)
    const pulse = 1 + Math.sin(clock.elapsedTime * 2 + phase) * 0.3
    ref.current.scale.setScalar(pulse)
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[dotSize, 10, 10]} />
      <meshBasicMaterial color={GREEN} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

// ── Network graph (nodes + edges with fade-by-distance) ──────────────────────
const NODE_COUNT = 35
const EDGE_DISTANCE = 4.5

function NodeNetwork() {
  const nodes = useMemo(() => {
    const rng = (seed: number) => {
      let s = seed
      return () => {
        s = (s * 16807 + 0) % 2147483647
        return s / 2147483647
      }
    }
    const r = rng(42)
    return Array.from({ length: NODE_COUNT }, () => ({
      x: (r() - 0.5) * 22,
      y: (r() - 0.5) * 12,
      z: -2 - r() * 5,
      phase: r() * Math.PI * 2,
      speed: 0.03 + r() * 0.05,
      size: 0.03 + r() * 0.04,
    }))
  }, [])

  const positions = useRef(nodes.map((n) => new THREE.Vector3(n.x, n.y, n.z)))

  const sphereMesh = useRef<THREE.InstancedMesh>(null)
  const glowMesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const lineRef = useRef<THREE.LineSegments>(null)
  const lineGeo = useMemo(() => {
    const maxEdges = NODE_COUNT * NODE_COUNT
    const buf = new Float32Array(maxEdges * 6)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(buf, 3).setUsage(THREE.DynamicDrawUsage))
    return geo
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    for (let i = 0; i < NODE_COUNT; i++) {
      const n = nodes[i]
      const p = positions.current[i]
      p.x = n.x + Math.sin(t * n.speed + n.phase) * 0.7
      p.y = n.y + Math.cos(t * n.speed * 0.8 + n.phase) * 0.5
      p.z = n.z + Math.sin(t * n.speed * 0.3 + n.phase * 2) * 0.3

      if (sphereMesh.current) {
        dummy.position.copy(p)
        const pulse = 1 + Math.sin(t * 1.5 + n.phase) * 0.15
        dummy.scale.setScalar(n.size * pulse)
        dummy.updateMatrix()
        sphereMesh.current.setMatrixAt(i, dummy.matrix)
      }
      if (glowMesh.current) {
        dummy.position.copy(p)
        dummy.scale.setScalar(n.size * 3.5)
        dummy.updateMatrix()
        glowMesh.current.setMatrixAt(i, dummy.matrix)
      }
    }
    if (sphereMesh.current) sphereMesh.current.instanceMatrix.needsUpdate = true
    if (glowMesh.current) glowMesh.current.instanceMatrix.needsUpdate = true

    if (lineRef.current) {
      const attr = lineRef.current.geometry.attributes.position as THREE.BufferAttribute
      const buf = attr.array as Float32Array
      let idx = 0
      for (let a = 0; a < NODE_COUNT; a++) {
        for (let b = a + 1; b < NODE_COUNT; b++) {
          const dist = positions.current[a].distanceTo(positions.current[b])
          if (dist < EDGE_DISTANCE) {
            buf[idx++] = positions.current[a].x
            buf[idx++] = positions.current[a].y
            buf[idx++] = positions.current[a].z
            buf[idx++] = positions.current[b].x
            buf[idx++] = positions.current[b].y
            buf[idx++] = positions.current[b].z
          }
        }
      }
      for (; idx < buf.length; idx++) buf[idx] = 0
      attr.needsUpdate = true
      lineRef.current.geometry.setDrawRange(0, idx / 3)
    }
  })

  return (
    <group>
      {/* Node cores */}
      <instancedMesh ref={sphereMesh} args={[undefined, undefined, NODE_COUNT]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.55} depthWrite={false} />
      </instancedMesh>
      {/* Node glow halos */}
      <instancedMesh ref={glowMesh} args={[undefined, undefined, NODE_COUNT]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={PALE} transparent opacity={0.04} depthWrite={false} />
      </instancedMesh>
      {/* Edges */}
      <lineSegments ref={lineRef} geometry={lineGeo}>
        <lineBasicMaterial color={GREEN} transparent opacity={0.12} depthWrite={false} />
      </lineSegments>
    </group>
  )
}

// ── Floating wireframe polyhedra (subtle, far edges) ─────────────────────────
function FloatingPoly({
  position,
  type = 'icosa',
  scale = 1,
  speed = 0.08,
  phase = 0,
  opacity = 0.1,
}: {
  position: [number, number, number]
  type?: 'icosa' | 'octa' | 'dodeca'
  scale?: number
  speed?: number
  phase?: number
  opacity?: number
}) {
  const ref = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.rotation.x = t * speed * 0.6 + phase
    ref.current.rotation.y = t * speed + phase
    ref.current.position.y = position[1] + Math.sin(t * speed * 0.8 + phase) * 0.35
    ref.current.position.x = position[0] + Math.cos(t * speed * 0.3 + phase) * 0.15
  })

  const Geo = () => {
    switch (type) {
      case 'octa':
        return <octahedronGeometry args={[1, 0]} />
      case 'dodeca':
        return <dodecahedronGeometry args={[1, 0]} />
      default:
        return <icosahedronGeometry args={[1, 0]} />
    }
  }

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh>
        <Geo />
        <meshBasicMaterial
          color={GREEN}
          transparent
          opacity={opacity}
          wireframe
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <Geo />
        <meshStandardMaterial
          color={WHITE_GREEN}
          transparent
          opacity={opacity * 0.25}
          roughness={0.3}
          metalness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

// ── Floating dust particles ──────────────────────────────────────────────────
function DustParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const count = 60

  const rng = useMemo(() => {
    let s = 123
    return () => {
      s = (s * 16807 + 0) % 2147483647
      return s / 2147483647
    }
  }, [])

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (rng() - 0.5) * 24,
        y: (rng() - 0.5) * 14,
        z: -1 - rng() * 5,
        speed: 0.015 + rng() * 0.04,
        phase: rng() * Math.PI * 2,
        size: 0.008 + rng() * 0.018,
      })),
    [rng],
  )

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const s = seeds[i]
      dummy.position.set(
        s.x + Math.sin(t * s.speed + s.phase) * 1.0,
        s.y + Math.cos(t * s.speed * 0.7 + s.phase) * 0.6,
        s.z,
      )
      const pulse = 1 + Math.sin(t * 1.5 + s.phase) * 0.35
      dummy.scale.setScalar(s.size * pulse)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={GREEN} transparent opacity={0.25} depthWrite={false} />
    </instancedMesh>
  )
}

// ── Slow global rotation for depth ───────────────────────────────────────────
function SlowRotator({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.015) * 0.08
    ref.current.rotation.x = Math.cos(clock.elapsedTime * 0.01) * 0.03
  })
  return <group ref={ref}>{children}</group>
}

// ── Scene ────────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 6, 6]} intensity={0.6} color="#ffffff" />
      <pointLight position={[-4, 3, 3]} intensity={0.3} color="#96EA7A" distance={15} decay={2} />
      <pointLight position={[5, -2, 2]} intensity={0.2} color="#b8f0a0" distance={12} decay={2} />

      <SlowRotator>
        {/* Main glass sphere – right */}
        <GlassSphere position={[6.5, 0, -4]} radius={2.0} speed={0.05} />
        <OrbitRing position={[6.5, 0, -4]} radius={2.6} tilt={1.1} speed={0.03} opacity={0.07} />
        <OrbitRing position={[6.5, 0, -4]} radius={3.0} tilt={0.5} speed={-0.02} opacity={0.05} />
        <OrbitDot
          center={[6.5, 0, -4]}
          radius={2.6}
          tilt={1.1}
          speed={0.3}
          phase={0}
          dotSize={0.05}
          opacity={0.5}
        />
        <OrbitDot
          center={[6.5, 0, -4]}
          radius={3.0}
          tilt={0.5}
          speed={-0.2}
          phase={2}
          dotSize={0.04}
          opacity={0.4}
        />

        {/* Secondary glass sphere – left */}
        <GlassSphere position={[-7, -1.5, -5]} radius={1.4} speed={0.04} />
        <OrbitRing position={[-7, -1.5, -5]} radius={1.9} tilt={0.8} speed={0.04} opacity={0.06} />
        <OrbitDot
          center={[-7, -1.5, -5]}
          radius={1.9}
          tilt={0.8}
          speed={0.35}
          phase={1.5}
          dotSize={0.04}
          opacity={0.45}
        />

        {/* Wireframe polyhedra scattered at edges */}
        <FloatingPoly
          position={[-5.5, 3.5, -5]}
          type="icosa"
          scale={0.9}
          speed={0.07}
          phase={0}
          opacity={0.09}
        />
        <FloatingPoly
          position={[3.5, 4.2, -6]}
          type="octa"
          scale={0.7}
          speed={0.1}
          phase={2}
          opacity={0.08}
        />
        <FloatingPoly
          position={[-8.5, 1, -4]}
          type="dodeca"
          scale={0.8}
          speed={0.06}
          phase={4}
          opacity={0.07}
        />
        <FloatingPoly
          position={[8.5, -3.5, -5]}
          type="icosa"
          scale={0.6}
          speed={0.12}
          phase={1.5}
          opacity={0.07}
        />
        <FloatingPoly
          position={[-3, -4.5, -6]}
          type="octa"
          scale={0.65}
          speed={0.09}
          phase={3.2}
          opacity={0.06}
        />
        <FloatingPoly
          position={[1, 5, -7]}
          type="dodeca"
          scale={0.5}
          speed={0.08}
          phase={5}
          opacity={0.05}
        />

        {/* Node network */}
        <NodeNetwork />

        {/* Dust */}
        <DustParticles />
      </SlowRotator>
    </>
  )
}

// ── Export ───────────────────────────────────────────────────────────────────
export function FAQWaveCanvas() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, outputColorSpace: 'srgb' }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
