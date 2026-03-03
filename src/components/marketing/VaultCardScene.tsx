'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/* ────────────────────────────────────────────
   RWA Mining — rotating mining blocks
   ──────────────────────────────────────────── */
function MiningBlocks({ hovered }: { hovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const hovRef = useRef(hovered)
  hovRef.current = hovered

  const COUNT = 14
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const blocks = useMemo(() => {
    return Array.from({ length: COUNT }, (_, i) => ({
      x: (Math.random() - 0.5) * 3.5,
      y: (Math.random() - 0.5) * 2.5,
      z: (Math.random() - 0.5) * 2,
      size: 0.12 + Math.random() * 0.2,
      rotSpeed: 0.2 + Math.random() * 0.5,
      floatSpeed: 0.3 + Math.random() * 0.4,
      floatAmp: 0.15 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
    }))
  }, [])

  // Connection lines
  const lineGeo = useMemo(() => {
    const maxPairs = 30
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPairs * 6), 3))
    return geo
  }, [])

  useFrame((state) => {
    if (!meshRef.current || !groupRef.current) return
    const t = state.clock.elapsedTime
    const h = hovRef.current
    const speed = h ? 1.6 : 0.8

    const positions: number[] = []

    for (let i = 0; i < COUNT; i++) {
      const b = blocks[i]
      const px = b.x + Math.sin(t * b.floatSpeed + b.phase) * b.floatAmp * 0.5
      const py = b.y + Math.sin(t * b.floatSpeed * 1.3 + b.phase) * b.floatAmp
      const pz = b.z + Math.cos(t * b.floatSpeed * 0.7 + b.phase) * b.floatAmp * 0.3

      dummy.position.set(px, py, pz)
      dummy.rotation.set(
        t * b.rotSpeed * speed * 0.3,
        t * b.rotSpeed * speed * 0.5,
        t * b.rotSpeed * speed * 0.2,
      )
      const s = b.size * (h ? 1.15 : 1)
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      positions.push(px, py, pz)
    }
    meshRef.current.instanceMatrix.needsUpdate = true

    // Lines between nearby blocks
    const lp = lineGeo.attributes.position as THREE.BufferAttribute
    const la = lp.array as Float32Array
    let li = 0
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        if (li >= la.length - 5) break
        const dx = positions[i * 3] - positions[j * 3]
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1]
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < 1.4) {
          la[li] = positions[i * 3]
          la[li + 1] = positions[i * 3 + 1]
          la[li + 2] = positions[i * 3 + 2]
          la[li + 3] = positions[j * 3]
          la[li + 4] = positions[j * 3 + 1]
          la[li + 5] = positions[j * 3 + 2]
          li += 6
        }
      }
    }
    for (let k = li; k < la.length; k++) la[k] = 0
    lp.needsUpdate = true
    lineGeo.setDrawRange(0, li / 3)

    // Group
    groupRef.current.rotation.y = t * 0.06 * speed
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = h ? 0.5 : 0.2
    mat.opacity = h ? 0.9 : 0.6
  })

  const color = useMemo(() => new THREE.Color('#96EA7A'), [])

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.6}
          roughness={0.4}
          metalness={0.3}
          emissive={color}
          emissiveIntensity={0.2}
          depthWrite={false}
          wireframe
        />
      </instancedMesh>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial color={color} transparent opacity={0.15} depthWrite={false} />
      </lineSegments>
    </group>
  )
}

/* ────────────────────────────────────────────
   BTC Hedged — shield / wave visualization
   ──────────────────────────────────────────── */
function HedgeWave({ hovered }: { hovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const hovRef = useRef(hovered)
  hovRef.current = hovered

  const SEGMENTS = 64
  const WAVES = 3

  const waveGeos = useMemo(() => {
    return Array.from({ length: WAVES }, () => {
      const geo = new THREE.BufferGeometry()
      const pts = new Float32Array(SEGMENTS * 3)
      geo.setAttribute('position', new THREE.BufferAttribute(pts, 3))
      return geo
    })
  }, [])

  const waveLines = useMemo(() => {
    return waveGeos.map((geo, i) => {
      const opacity = 0.3 - i * 0.08
      const mat = new THREE.LineBasicMaterial({
        color: i === 0 ? new THREE.Color('#F7931A') : new THREE.Color('#96EA7A'),
        transparent: true,
        opacity,
        depthWrite: false,
      })
      return new THREE.Line(geo, mat)
    })
  }, [waveGeos])

  // Shield mesh
  const shieldRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    const h = hovRef.current
    const speed = h ? 1.5 : 0.7

    for (let w = 0; w < WAVES; w++) {
      const pts = waveGeos[w].attributes.position as THREE.BufferAttribute
      const arr = pts.array as Float32Array
      for (let i = 0; i < SEGMENTS; i++) {
        const x = (i / (SEGMENTS - 1) - 0.5) * 5
        const freq = 1.8 + w * 0.6
        const amp = (h ? 0.5 : 0.3) * (1 - w * 0.2)
        const y =
          Math.sin(x * freq + t * speed * (1 + w * 0.3)) * amp +
          Math.sin(x * freq * 2.3 + t * speed * 0.7) * amp * 0.3
        const z = w * 0.4 - 0.4
        arr[i * 3] = x
        arr[i * 3 + 1] = y
        arr[i * 3 + 2] = z
      }
      pts.needsUpdate = true

      const mat = waveLines[w].material as THREE.LineBasicMaterial
      mat.opacity = h ? 0.5 - w * 0.1 : 0.25 - w * 0.06
    }

    groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.1

    if (shieldRef.current) {
      const sm = shieldRef.current.material as THREE.MeshBasicMaterial
      sm.opacity = h ? 0.06 : 0.03
      shieldRef.current.scale.setScalar(1.5 + Math.sin(t * 0.5) * 0.05)
    }
  })

  return (
    <group ref={groupRef}>
      {waveLines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
      <mesh ref={shieldRef} position={[0, 0, -0.5]}>
        <icosahedronGeometry args={[1.5, 2]} />
        <meshBasicMaterial
          color={new THREE.Color('#F7931A')}
          transparent
          opacity={0.03}
          depthWrite={false}
          wireframe
        />
      </mesh>
    </group>
  )
}

/* ────────────────────────────────────────────
   Exported wrapper
   ──────────────────────────────────────────── */
interface VaultCardSceneProps {
  variant: 'mining' | 'hedged'
  hovered: boolean
}

function Scene({ variant, hovered }: VaultCardSceneProps) {
  return variant === 'mining' ? <MiningBlocks hovered={hovered} /> : <HedgeWave hovered={hovered} />
}

export function VaultCardScene({ variant, hovered }: VaultCardSceneProps) {
  return (
    <div
      className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none"
      style={{ opacity: hovered ? 1 : 0.5, transition: 'opacity 0.5s ease' }}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, outputColorSpace: 'srgb' }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 3, 3]} intensity={0.3} />
        <Scene variant={variant} hovered={hovered} />
      </Canvas>
    </div>
  )
}
