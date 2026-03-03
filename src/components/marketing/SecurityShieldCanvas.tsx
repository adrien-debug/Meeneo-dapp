'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const GREEN = new THREE.Color('#96EA7A').convertSRGBToLinear()
const MINT = new THREE.Color('#b8f0a0').convertSRGBToLinear()
const VIVID = new THREE.Color('#5cd645').convertSRGBToLinear()
const BRIGHT = new THREE.Color('#7aff55').convertSRGBToLinear()

/* ── Hex grid with perspective tilt ── */
function HexGrid() {
  const ref = useRef<THREE.LineSegments>(null)

  const geometry = useMemo(() => {
    const pts: number[] = []
    const cols = 20
    const rows = 14
    const size = 0.32
    const h = size * Math.sqrt(3)

    for (let row = -rows; row <= rows; row++) {
      for (let col = -cols; col <= cols; col++) {
        const cx = col * size * 1.5
        const cy = row * h + (col % 2 !== 0 ? h / 2 : 0)
        const dist = Math.sqrt(cx * cx + cy * cy)
        if (dist > 8) continue
        for (let i = 0; i < 6; i++) {
          const a1 = (Math.PI / 3) * i
          const a2 = (Math.PI / 3) * ((i + 1) % 6)
          pts.push(
            cx + Math.cos(a1) * size,
            cy + Math.sin(a1) * size,
            0,
            cx + Math.cos(a2) * size,
            cy + Math.sin(a2) * size,
            0,
          )
        }
      }
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return geo
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.rotation.x = 0.35 + Math.sin(t * 0.06) * 0.03
    ref.current.rotation.z = Math.sin(t * 0.04) * 0.02
    const mat = ref.current.material as THREE.LineBasicMaterial
    mat.opacity = 0.14 + Math.sin(t * 0.25) * 0.03
  })

  return (
    <lineSegments ref={ref} geometry={geometry} position={[-0.5, -0.8, -3]}>
      <lineBasicMaterial color={GREEN} transparent opacity={0.14} depthWrite={false} />
    </lineSegments>
  )
}

/* ── Layered shield construct ── */
function ShieldConstruct() {
  const groupRef = useRef<THREE.Group>(null)
  const innerRef = useRef<THREE.Mesh>(null)
  const midRef = useRef<THREE.Mesh>(null)
  const outerRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.1
      groupRef.current.rotation.x = Math.sin(t * 0.07) * 0.18
      groupRef.current.position.y = 0.2 + Math.sin(t * 0.4) * 0.08
    }
    if (innerRef.current) {
      innerRef.current.rotation.z = t * 0.15
      innerRef.current.rotation.x = t * 0.08
      innerRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.06)
    }
    if (midRef.current) {
      midRef.current.rotation.y = -t * 0.08
      midRef.current.rotation.z = t * 0.05
    }
    if (outerRef.current) {
      outerRef.current.rotation.z = -t * 0.04
      outerRef.current.rotation.x = t * 0.03
    }
  })

  return (
    <group ref={groupRef} position={[2.2, 0, 0]}>
      {/* Inner icosahedron */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshBasicMaterial color={VIVID} transparent opacity={0.25} depthWrite={false} wireframe />
      </mesh>

      {/* Mid dodecahedron */}
      <mesh ref={midRef}>
        <dodecahedronGeometry args={[1.55, 0]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.15} depthWrite={false} wireframe />
      </mesh>

      {/* Outer icosahedron */}
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[2.0, 0]} />
        <meshBasicMaterial color={MINT} transparent opacity={0.08} depthWrite={false} wireframe />
      </mesh>

      {/* Core bright */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color={BRIGHT} transparent opacity={0.55} depthWrite={false} />
      </mesh>

      {/* Halo glow */}
      <mesh>
        <sphereGeometry args={[2.4, 32, 32]} />
        <meshBasicMaterial
          color={GREEN}
          transparent
          opacity={0.03}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

/* ── Orbit rings around shield ── */
function OrbitRings() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    groupRef.current.children.forEach((child, i) => {
      child.rotation.x = t * (0.07 + i * 0.025) + i * 0.9
      child.rotation.y = t * (0.05 - i * 0.018)
    })
  })

  return (
    <group ref={groupRef} position={[2.2, 0.2, 0]}>
      {[1.4, 1.75, 2.1, 2.45].map((r, i) => (
        <mesh key={i}>
          <torusGeometry args={[r, 0.006, 8, 128]} />
          <meshBasicMaterial
            color={GREEN}
            transparent
            opacity={0.18 - i * 0.03}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/* ── Shield particles circling ── */
function ShieldParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const count = 200

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        orbit: 1.0 + Math.random() * 1.8,
        speed: 0.15 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        tiltX: (Math.random() - 0.5) * Math.PI * 0.8,
        tiltZ: (Math.random() - 0.5) * Math.PI * 0.4,
        size: 0.008 + Math.random() * 0.018,
        bright: i % 8 === 0,
      })),
    [],
  )

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime

    for (let i = 0; i < count; i++) {
      const s = seeds[i]
      const angle = t * s.speed + s.phase
      const x = Math.cos(angle) * s.orbit
      const y = Math.sin(angle) * s.orbit * Math.cos(s.tiltX)
      const z = Math.sin(angle) * s.orbit * Math.sin(s.tiltX)

      dummy.position.set(2.2 + x, 0.2 + y, z)
      const pulse = s.bright ? 1 + Math.sin(t * 3 + s.phase) * 0.5 : 1
      dummy.scale.setScalar(s.size * pulse)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={BRIGHT} transparent opacity={0.4} depthWrite={false} />
    </instancedMesh>
  )
}

/* ── Ambient floating nodes ── */
function AmbientNodes() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const count = 80

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 14,
        y: (Math.random() - 0.5) * 9,
        z: (Math.random() - 0.5) * 5,
        speed: 0.1 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
        size: 0.01 + Math.random() * 0.02,
      })),
    [],
  )

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime

    for (let i = 0; i < count; i++) {
      const s = seeds[i]
      dummy.position.set(
        s.x + Math.sin(t * s.speed * 0.3 + s.phase) * 0.3,
        s.y + Math.cos(t * s.speed * 0.2 + s.phase) * 0.25,
        s.z,
      )
      dummy.scale.setScalar(s.size * (1 + Math.sin(t * 1.2 + s.phase) * 0.3))
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={GREEN} transparent opacity={0.35} depthWrite={false} />
    </instancedMesh>
  )
}

/* ── Scan line sweeping ── */
function ScanLine() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    const cycle = (t * 0.08) % 1
    ref.current.position.y = (cycle - 0.5) * 10
    const mat = ref.current.material as THREE.MeshBasicMaterial
    const fade = 1 - Math.abs(cycle - 0.5) * 2
    mat.opacity = fade * 0.08
  })

  return (
    <mesh ref={ref} position={[0, 0, -1]}>
      <planeGeometry args={[20, 0.03]} />
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

function Scene() {
  const groupRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.012) * 0.015
  })

  return (
    <group ref={groupRef}>
      <HexGrid />
      <ShieldConstruct />
      <OrbitRings />
      <ShieldParticles />
      <AmbientNodes />
      <ScanLine />
    </group>
  )
}

export function SecurityShieldCanvas() {
  return (
    <div className="absolute inset-0 pointer-events-none">
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
