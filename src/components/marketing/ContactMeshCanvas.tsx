'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const GREEN = new THREE.Color('#96EA7A').convertSRGBToLinear()
const MINT = new THREE.Color('#b8f0a0').convertSRGBToLinear()
const VIVID = new THREE.Color('#5cd645').convertSRGBToLinear()
const BRIGHT = new THREE.Color('#7aff55').convertSRGBToLinear()

interface Node {
  pos: THREE.Vector3
  vel: THREE.Vector3
  basePos: THREE.Vector3
  size: number
}

/* ── Live network graph ── */
function NetworkGraph() {
  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)

  const nodeCount = 70
  const maxDist = 1.8

  const nodes = useMemo<Node[]>(() => {
    return Array.from({ length: nodeCount }, () => {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 3,
      )
      return {
        pos: pos.clone(),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.002,
        ),
        basePos: pos.clone(),
        size: 0.03 + Math.random() * 0.04,
      }
    })
  }, [])

  const pointGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(nodeCount * 3)
    const sizes = new Float32Array(nodeCount)
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))
    return geo
  }, [])

  const lineGeo = useMemo(() => {
    const maxLines = nodeCount * nodeCount
    const geo = new THREE.BufferGeometry()
    const arr = new Float32Array(maxLines * 6)
    geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3))
    return geo
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    for (const node of nodes) {
      node.pos.x += node.vel.x + Math.sin(t * 0.12 + node.basePos.x) * 0.002
      node.pos.y += node.vel.y + Math.cos(t * 0.1 + node.basePos.y) * 0.002
      node.pos.z += node.vel.z

      if (Math.abs(node.pos.x - node.basePos.x) > 2.0) node.vel.x *= -1
      if (Math.abs(node.pos.y - node.basePos.y) > 1.5) node.vel.y *= -1
      if (Math.abs(node.pos.z - node.basePos.z) > 1.0) node.vel.z *= -1
    }

    if (pointsRef.current) {
      const posArr = pointGeo.attributes.position.array as Float32Array
      for (let i = 0; i < nodeCount; i++) {
        posArr[i * 3] = nodes[i].pos.x
        posArr[i * 3 + 1] = nodes[i].pos.y
        posArr[i * 3 + 2] = nodes[i].pos.z
      }
      pointGeo.attributes.position.needsUpdate = true
    }

    if (linesRef.current) {
      const lineArr = lineGeo.attributes.position.array as Float32Array
      let li = 0
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const d = nodes[i].pos.distanceTo(nodes[j].pos)
          if (d < maxDist) {
            lineArr[li++] = nodes[i].pos.x
            lineArr[li++] = nodes[i].pos.y
            lineArr[li++] = nodes[i].pos.z
            lineArr[li++] = nodes[j].pos.x
            lineArr[li++] = nodes[j].pos.y
            lineArr[li++] = nodes[j].pos.z
          }
        }
      }
      for (let k = li; k < lineArr.length; k++) lineArr[k] = 0
      lineGeo.attributes.position.needsUpdate = true
      lineGeo.setDrawRange(0, li / 3)
    }
  })

  return (
    <>
      <points ref={pointsRef} geometry={pointGeo}>
        <pointsMaterial
          color={VIVID}
          transparent
          opacity={0.65}
          size={0.06}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <lineSegments ref={linesRef} geometry={lineGeo}>
        <lineBasicMaterial color={GREEN} transparent opacity={0.2} depthWrite={false} />
      </lineSegments>
    </>
  )
}

/* ── Data pulses traveling along connections ── */
function DataPulses() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const count = 30

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        startX: (Math.random() - 0.5) * 12,
        startY: (Math.random() - 0.5) * 8,
        endX: (Math.random() - 0.5) * 12,
        endY: (Math.random() - 0.5) * 8,
        speed: 0.2 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        size: 0.02 + Math.random() * 0.02,
      })),
    [],
  )

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime

    for (let i = 0; i < count; i++) {
      const s = seeds[i]
      const progress = (((t * s.speed + s.phase) % 1) + 1) % 1

      const x = s.startX + (s.endX - s.startX) * progress
      const y = s.startY + (s.endY - s.startY) * progress
      const z = Math.sin(progress * Math.PI) * 0.3

      dummy.position.set(x, y, z)
      const pulse = 1 + Math.sin(t * 4 + s.phase) * 0.4
      dummy.scale.setScalar(s.size * pulse)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={BRIGHT} transparent opacity={0.5} depthWrite={false} />
    </instancedMesh>
  )
}

/* ── Central focal torus ── */
function FocalElement() {
  const groupRef = useRef<THREE.Group>(null)
  const t1 = useRef<THREE.Mesh>(null)
  const t2 = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.3) * 0.1
    }
    if (t1.current) {
      t1.current.rotation.x = t * 0.12
      t1.current.rotation.y = t * 0.08
    }
    if (t2.current) {
      t2.current.rotation.z = -t * 0.1
      t2.current.rotation.x = Math.PI / 2.5 + t * 0.06
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, -0.5]}>
      <mesh ref={t1}>
        <torusGeometry args={[1.6, 0.006, 8, 128]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh ref={t2}>
        <torusGeometry args={[1.3, 0.005, 8, 128]} />
        <meshBasicMaterial color={MINT} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={BRIGHT} transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial
          color={GREEN}
          transparent
          opacity={0.025}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

/* ── Ambient glow spheres ── */
function GlowSpheres() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const count = 6

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 7,
        z: -2 - Math.random() * 2,
        speed: 0.06 + Math.random() * 0.08,
        phase: Math.random() * Math.PI * 2,
        size: 1.0 + Math.random() * 1.5,
      })),
    [],
  )

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime

    for (let i = 0; i < count; i++) {
      const s = seeds[i]
      dummy.position.set(
        s.x + Math.sin(t * s.speed + s.phase) * 0.4,
        s.y + Math.cos(t * s.speed * 0.7 + s.phase) * 0.3,
        s.z,
      )
      dummy.scale.setScalar(s.size + Math.sin(t * 0.3 + s.phase) * 0.2)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshBasicMaterial color={MINT} transparent opacity={0.035} depthWrite={false} />
    </instancedMesh>
  )
}

function Scene() {
  const groupRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.01) * 0.01
  })

  return (
    <group ref={groupRef}>
      <NetworkGraph />
      <DataPulses />
      <FocalElement />
      <GlowSpheres />
    </group>
  )
}

export function ContactMeshCanvas() {
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
