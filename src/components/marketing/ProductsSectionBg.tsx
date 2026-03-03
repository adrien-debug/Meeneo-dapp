'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const GREEN = new THREE.Color('#96EA7A').convertSRGBToLinear()
const LIGHT_GREEN = new THREE.Color('#c4f0b5').convertSRGBToLinear()
const NODE_COUNT = 40
const LINK_DIST = 2.2

function NetworkScene() {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const nodes = useMemo(
    () =>
      Array.from({ length: NODE_COUNT }, () => ({
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 6,
        z: (Math.random() - 0.5) * 4,
        size: 0.06 + Math.random() * 0.12,
        speed: 0.15 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: 0.3 + Math.random() * 0.6,
      })),
    [],
  )

  const lineGeo = useMemo(() => {
    const maxPairs = 120
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPairs * 6), 3))
    return geo
  }, [])

  /* Pulse particles traveling along edges */
  const PULSE_COUNT = 12
  const pulseMeshRef = useRef<THREE.InstancedMesh>(null)
  const pulses = useMemo(
    () =>
      Array.from({ length: PULSE_COUNT }, () => ({
        fromIdx: Math.floor(Math.random() * NODE_COUNT),
        toIdx: Math.floor(Math.random() * NODE_COUNT),
        t: Math.random(),
        speed: 0.3 + Math.random() * 0.4,
      })),
    [],
  )

  useFrame((state) => {
    if (!meshRef.current || !groupRef.current) return
    const time = state.clock.elapsedTime
    const positions: number[] = []

    for (let i = 0; i < NODE_COUNT; i++) {
      const n = nodes[i]
      const px = n.x + Math.sin(time * n.speed + n.phase) * 0.3
      const py = n.y + Math.cos(time * n.speed * 0.8 + n.phase) * 0.25
      const pz = n.z + Math.sin(time * n.speed * 0.5 + n.phase * 1.3) * 0.15

      dummy.position.set(px, py, pz)
      dummy.rotation.set(
        time * n.rotSpeed * 0.15,
        time * n.rotSpeed * 0.25,
        time * n.rotSpeed * 0.1,
      )
      dummy.scale.setScalar(n.size)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
      positions.push(px, py, pz)
    }
    meshRef.current.instanceMatrix.needsUpdate = true

    const lp = lineGeo.attributes.position as THREE.BufferAttribute
    const la = lp.array as Float32Array
    let li = 0
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        if (li >= la.length - 5) break
        const dx = positions[i * 3] - positions[j * 3]
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1]
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < LINK_DIST) {
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

    /* Pulse particles */
    if (pulseMeshRef.current) {
      const delta = state.clock.getDelta()
      for (let p = 0; p < PULSE_COUNT; p++) {
        const pulse = pulses[p]
        pulse.t += pulse.speed * 0.012

        if (pulse.t > 1) {
          pulse.t = 0
          pulse.fromIdx = Math.floor(Math.random() * NODE_COUNT)
          pulse.toIdx = Math.floor(Math.random() * NODE_COUNT)
          if (pulse.fromIdx === pulse.toIdx) pulse.toIdx = (pulse.toIdx + 1) % NODE_COUNT
        }

        const fi = pulse.fromIdx * 3
        const ti = pulse.toIdx * 3
        const lerpT = pulse.t
        const px = positions[fi] + (positions[ti] - positions[fi]) * lerpT
        const py = positions[fi + 1] + (positions[ti + 1] - positions[fi + 1]) * lerpT
        const pz = positions[fi + 2] + (positions[ti + 2] - positions[fi + 2]) * lerpT

        dummy.position.set(px, py, pz)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.setScalar(0.035)
        dummy.updateMatrix()
        pulseMeshRef.current.setMatrixAt(p, dummy.matrix)
      }
      pulseMeshRef.current.instanceMatrix.needsUpdate = true
    }

    groupRef.current.rotation.y = time * 0.02
  })

  return (
    <group ref={groupRef}>
      {/* Cubes — nodes */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, NODE_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={GREEN}
          transparent
          opacity={0.35}
          roughness={0.5}
          metalness={0.2}
          emissive={GREEN}
          emissiveIntensity={0.15}
          depthWrite={false}
          wireframe
        />
      </instancedMesh>

      {/* Links */}
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial color={GREEN} transparent opacity={0.08} depthWrite={false} />
      </lineSegments>

      {/* Pulse particles */}
      <instancedMesh ref={pulseMeshRef} args={[undefined, undefined, PULSE_COUNT]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={LIGHT_GREEN} transparent opacity={0.6} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}

export function ProductsSectionBg() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.5 }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, outputColorSpace: 'srgb' }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <NetworkScene />
      </Canvas>
    </div>
  )
}
