'use client'

import { Edges, Float } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'

const H = 1.1
const VERTS: [number, number, number][] = [
  [-H, -H, -H],
  [-H, -H, H],
  [-H, H, -H],
  [-H, H, H],
  [H, -H, -H],
  [H, -H, H],
  [H, H, -H],
  [H, H, H],
]
const ADJ: number[][] = [
  [1, 2, 4],
  [0, 3, 5],
  [0, 3, 6],
  [1, 2, 7],
  [0, 5, 6],
  [1, 4, 7],
  [2, 4, 7],
  [3, 5, 6],
]

const EDGE_PAIRS: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 4],
  [1, 3],
  [1, 5],
  [2, 3],
  [2, 6],
  [3, 7],
  [4, 5],
  [4, 6],
  [5, 7],
  [6, 7],
]

function EdgeTube({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const curve = useMemo(() => {
    return new THREE.LineCurve3(new THREE.Vector3(...from), new THREE.Vector3(...to))
  }, [from, to])

  return (
    <mesh>
      <tubeGeometry args={[curve, 1, 0.015, 6, false]} />
      <meshStandardMaterial
        color="#96EA7A"
        emissive="#96EA7A"
        emissiveIntensity={2}
        transparent
        opacity={0.5}
        toneMapped={false}
      />
    </mesh>
  )
}

function VertexNode({ position, idx }: { position: [number, number, number]; idx: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.scale.setScalar(
        0.09 * (1 + Math.sin(clock.getElapsedTime() * 2.5 + idx * 0.8) * 0.3),
      )
    }
  })
  return (
    <mesh ref={ref} position={position} scale={0.09}>
      <sphereGeometry args={[1, 20, 20]} />
      <meshStandardMaterial
        color="#96EA7A"
        emissive="#96EA7A"
        emissiveIntensity={5}
        toneMapped={false}
      />
    </mesh>
  )
}

function EnergyPulse({ startIdx, delay }: { startIdx: number; delay: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const state = useRef({
    from: startIdx,
    to: ADJ[startIdx][0],
    t: 0,
    speed: 0.5 + Math.random() * 0.4,
    started: false,
    startTime: delay,
  })

  useFrame(({ clock }, delta) => {
    const s = state.current
    if (!s.started) {
      if (clock.getElapsedTime() > s.startTime) s.started = true
      else return
    }
    s.t += delta * s.speed
    if (s.t >= 1) {
      s.from = s.to
      const neighbors = ADJ[s.from]
      s.to = neighbors[Math.floor(Math.random() * neighbors.length)]
      s.t = 0
      s.speed = 0.5 + Math.random() * 0.4
    }
    if (ref.current) {
      const a = VERTS[s.from]
      const b = VERTS[s.to]
      ref.current.position.set(
        a[0] + (b[0] - a[0]) * s.t,
        a[1] + (b[1] - a[1]) * s.t,
        a[2] + (b[2] - a[2]) * s.t,
      )
      ref.current.scale.setScalar(0.045 * (1 + Math.sin(s.t * Math.PI) * 0.6))
    }
  })

  return (
    <mesh ref={ref} scale={0.045}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#96EA7A"
        emissiveIntensity={10}
        toneMapped={false}
      />
    </mesh>
  )
}

function InnerCore() {
  const lightRef = useRef<THREE.PointLight>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (lightRef.current) lightRef.current.intensity = 1.5 + Math.sin(t * 2.5) * 0.8
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.4
      meshRef.current.rotation.x = t * 0.25
      meshRef.current.scale.setScalar(0.4 + Math.sin(t * 2) * 0.05)
    }
  })

  return (
    <>
      <pointLight
        ref={lightRef}
        position={[0, 0, 0]}
        color="#96EA7A"
        intensity={1.5}
        distance={6}
      />
      <mesh ref={meshRef} scale={0.4}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#96EA7A"
          emissive="#96EA7A"
          emissiveIntensity={3}
          wireframe
          transparent
          opacity={0.6}
          toneMapped={false}
        />
      </mesh>
    </>
  )
}

function AtomStructure() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.08
      groupRef.current.rotation.x = 0.3 + Math.sin(clock.getElapsedTime() * 0.05) * 0.06
    }
  })

  return (
    <Float speed={0.5} rotationIntensity={0.015} floatIntensity={0.12}>
      <group ref={groupRef} scale={2.3}>
        {/* Edges — green tubes connecting vertices */}
        {EDGE_PAIRS.map(([a, b], i) => (
          <EdgeTube key={`edge-${i}`} from={VERTS[a]} to={VERTS[b]} />
        ))}

        {/* Vertex atoms */}
        {VERTS.map((pos, i) => (
          <VertexNode key={i} position={pos} idx={i} />
        ))}

        {/* Energy pulses traveling between atoms */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <EnergyPulse key={i} startIdx={i} delay={i * 0.4} />
        ))}

        {/* Wireframe core */}
        <InnerCore />
      </group>
    </Float>
  )
}

function OrbitalRings() {
  const ref = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.03
  })

  return (
    <group ref={ref}>
      {[3.5, 4.2, 5.0].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.2, i * 0.35, 0]}>
          <torusGeometry args={[r, 0.006, 8, 160]} />
          <meshStandardMaterial
            color="#96EA7A"
            emissive="#96EA7A"
            emissiveIntensity={1.5}
            transparent
            opacity={0.18 - i * 0.04}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function FloatingParticles() {
  const groupRef = useRef<THREE.Group>(null)

  const particles = useMemo(() => {
    return Array.from({ length: 22 }, () => {
      const angle = Math.random() * Math.PI * 2
      const elevation = (Math.random() - 0.5) * Math.PI * 0.5
      const r = 4.0 + Math.random() * 3.0
      return {
        position: [
          r * Math.cos(elevation) * Math.cos(angle),
          r * Math.sin(elevation),
          r * Math.cos(elevation) * Math.sin(angle),
        ] as [number, number, number],
        scale: 0.03 + Math.random() * 0.05,
      }
    })
  }, [])

  useFrame(({ clock }) => {
    if (groupRef.current) groupRef.current.rotation.y = clock.getElapsedTime() * 0.015
  })

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <Float key={i} speed={0.3 + (i % 3) * 0.15} floatIntensity={0.2}>
          <mesh position={p.position} scale={p.scale}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial
              color="#96EA7A"
              emissive="#96EA7A"
              emissiveIntensity={3}
              transparent
              opacity={0.7}
              toneMapped={false}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

interface FloatingOrbProps {
  className?: string
}

export function FloatingOrb({ className = '' }: FloatingOrbProps) {
  return (
    <div className={`pointer-events-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 46 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <directionalLight position={[6, 8, 6]} intensity={1} color="#ffffff" />
          <directionalLight position={[-4, 4, -4]} intensity={0.4} color="#ffffff" />
          <pointLight position={[-3, 3, -3]} intensity={0.8} color="#96EA7A" />
          <pointLight position={[3, -2, 5]} intensity={0.3} color="#ffffff" />

          <AtomStructure />
          <OrbitalRings />
          <FloatingParticles />

          <EffectComposer>
            <Bloom intensity={1.4} luminanceThreshold={0.1} luminanceSmoothing={0.85} mipmapBlur />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}
