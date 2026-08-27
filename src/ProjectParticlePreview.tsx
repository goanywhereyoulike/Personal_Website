import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type PreviewKind = 'zhongkui' | 'water' | 'engine'

type Props = {
  kind: PreviewKind
  reducedMotion: boolean
}

const vertexShader = `
  attribute float aSeed;
  uniform float uTime;
  uniform float uMode;
  uniform float uPixelRatio;
  varying float vSeed;
  varying float vHeight;

  void main() {
    vec3 p = position;
    if (uMode < 0.5) {
      p.z += sin(uTime * 0.7 + aSeed * 18.0) * 0.018;
    } else if (uMode < 1.5) {
      float t = uTime * 0.8;
      p.y += sin((t + p.z) * 8.0) * 0.11;
      p.y += cos((t + p.x) * 10.0) * 0.13;
      p.y += sin((p.x + p.z) * 4.0 - t * 1.4) * 0.055;
    } else {
      p.y += sin(uTime * 0.45 + aSeed * 21.0) * 0.012;
    }

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = (1.5 + aSeed * 2.4) * uPixelRatio * (7.0 / max(2.5, -mvPosition.z));
    vSeed = aSeed;
    vHeight = p.y;
  }
`

const fragmentShader = `
  uniform float uMode;
  uniform float uTime;
  varying float vSeed;
  varying float vHeight;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float core = smoothstep(0.34, 0.04, d);
    float halo = smoothstep(0.5, 0.16, d) * 0.36;
    float alpha = core + halo;
    vec3 cool = vec3(0.42, 0.72, 1.0);
    vec3 warm = vec3(1.0, 0.48, 0.2);
    vec3 water = vec3(0.25, 0.78, 0.94);
    vec3 color = uMode < 0.5 ? mix(cool, warm, step(0.84, vSeed)) : (uMode < 1.5 ? water : mix(cool, vec3(0.74, 0.9, 1.0), smoothstep(-1.0, 1.7, vHeight)));
    float pulse = 0.86 + sin(uTime * 1.4 + vSeed * 25.0) * 0.14;
    gl_FragColor = vec4(color * pulse, alpha * 0.88);
  }
`

function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function setPoint(array: Float32Array, index: number, x: number, y: number, z = 0) {
  array[index * 3] = x
  array[index * 3 + 1] = y
  array[index * 3 + 2] = z
}

function ellipsePoint(random: () => number, cx: number, cy: number, rx: number, ry: number) {
  const angle = random() * Math.PI * 2
  const radius = Math.sqrt(random())
  return [cx + Math.cos(angle) * rx * radius, cy + Math.sin(angle) * ry * radius] as const
}

function createBattle(count: number, random: () => number) {
  const positions = new Float32Array(count * 3)
  const bodyEnd = Math.floor(count * 0.22)
  const headEnd = Math.floor(count * 0.31)
  const robeEnd = Math.floor(count * 0.47)
  const weaponEnd = Math.floor(count * 0.61)
  const monsterEnd = Math.floor(count * 0.83)
  const hornsEnd = Math.floor(count * 0.91)

  for (let i = 0; i < count; i += 1) {
    if (i < bodyEnd) {
      const p = ellipsePoint(random, -1.25, -0.05, 0.56, 0.92)
      setPoint(positions, i, p[0], p[1], (random() - 0.5) * 0.15)
    } else if (i < headEnd) {
      const p = ellipsePoint(random, -1.25, 1.08, 0.38, 0.42)
      setPoint(positions, i, p[0], p[1], (random() - 0.5) * 0.12)
    } else if (i < robeEnd) {
      const t = random()
      setPoint(positions, i, -1.25 + (random() - 0.5) * (0.7 + t * 0.9), -0.1 - t * 1.5, (random() - 0.5) * 0.18)
    } else if (i < weaponEnd) {
      const t = random()
      setPoint(positions, i, -0.82 + t * 2.55 + (random() - 0.5) * 0.045, 1.35 - t * 2.55 + (random() - 0.5) * 0.045, 0.14)
    } else if (i < monsterEnd) {
      const p = ellipsePoint(random, 1.48, -0.48, 0.82, 0.68)
      setPoint(positions, i, p[0], p[1], (random() - 0.5) * 0.22)
    } else if (i < hornsEnd) {
      const local = (i - monsterEnd) / Math.max(1, hornsEnd - monsterEnd - 1)
      const side = i % 2 === 0 ? -1 : 1
      const t = (local * 2) % 1
      setPoint(positions, i, 1.48 + side * (0.22 + t * 0.56), 0.08 + Math.sin(t * Math.PI) * 0.72, 0.05)
    } else {
      const t = random()
      setPoint(positions, i, -0.25 + t * 1.7 + (random() - 0.5) * 0.45, 0.35 - t * 0.75 + (random() - 0.5) * 0.4, (random() - 0.5) * 0.25)
    }
  }
  return positions
}

function createWater(count: number) {
  const positions = new Float32Array(count * 3)
  const columns = Math.ceil(Math.sqrt(count * 1.45))
  const rows = Math.ceil(count / columns)
  for (let i = 0; i < count; i += 1) {
    const column = i % columns
    const row = Math.floor(i / columns)
    const x = (column / Math.max(1, columns - 1) - 0.5) * 7.4
    const z = (row / Math.max(1, rows - 1) - 0.5) * 4.7
    setPoint(positions, i, x, 0, z)
  }
  return positions
}

function createEngineMap(count: number, random: () => number) {
  const positions = new Float32Array(count * 3)
  const terrainEnd = Math.floor(count * 0.54)
  const cityEnd = Math.floor(count * 0.9)
  for (let i = 0; i < count; i += 1) {
    if (i < terrainEnd) {
      const columns = 58
      const rows = Math.ceil(terrainEnd / columns)
      const x = ((i % columns) / (columns - 1) - 0.5) * 7.0
      const z = (Math.floor(i / columns) / Math.max(1, rows - 1) - 0.5) * 4.8
      const y = Math.sin(x * 0.8) * 0.12 + Math.cos(z * 1.1) * 0.1
      setPoint(positions, i, x, y - 1.15, z)
    } else if (i < cityEnd) {
      const local = i - terrainEnd
      const tower = local % 24
      const level = Math.floor(local / 24)
      const levels = Math.ceil((cityEnd - terrainEnd) / 24)
      const cx = (tower % 6 - 2.5) * 0.85
      const cz = (Math.floor(tower / 6) - 1.5) * 0.72
      const height = 0.6 + ((tower * 13) % 11) * 0.13
      const edge = level % 4
      const y = -1.08 + (level / Math.max(1, levels - 1)) * height
      setPoint(positions, i, cx + (edge % 2 === 0 ? -0.22 : 0.22), y, cz + (edge < 2 ? -0.2 : 0.2))
    } else {
      const t = (i - cityEnd) / Math.max(1, count - cityEnd - 1)
      setPoint(positions, i, -3.2 + t * 6.4, -1.02 + Math.sin(t * Math.PI * 3) * 0.18, -0.7 + (random() - 0.5) * 0.04)
    }
  }
  return positions
}

function PreviewField({ kind, reducedMotion }: Props) {
  const material = useRef<THREE.ShaderMaterial>(null)
  const group = useRef<THREE.Group>(null)
  const mode = kind === 'zhongkui' ? 0 : kind === 'water' ? 1 : 2
  const count = useMemo(() => (window.innerWidth < 760 ? 1800 : 3200), [])
  const data = useMemo(() => {
    const random = seededRandom(kind === 'zhongkui' ? 108 : kind === 'water' ? 206 : 311)
    const positions = kind === 'zhongkui' ? createBattle(count, random) : kind === 'water' ? createWater(count) : createEngineMap(count, random)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i += 1) seeds[i] = random()
    return { positions, seeds }
  }, [count, kind])
  const geometry = useMemo(() => {
    const result = new THREE.BufferGeometry()
    result.setAttribute('position', new THREE.BufferAttribute(data.positions, 3))
    result.setAttribute('aSeed', new THREE.BufferAttribute(data.seeds, 1))
    return result
  }, [data])
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMode: { value: mode },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
  }), [mode])

  useFrame(state => {
    if (material.current) material.current.uniforms.uTime.value = reducedMotion ? 0 : state.clock.elapsedTime
    if (group.current && !reducedMotion && kind === 'engine') group.current.rotation.y = -0.35 + Math.sin(state.clock.elapsedTime * 0.16) * 0.045
  })

  return (
    <group ref={group} rotation={kind === 'water' ? [-0.78, 0, 0] : kind === 'engine' ? [-0.42, -0.35, 0] : [0, 0, 0]}>
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}

export default function ProjectParticlePreview(props: Props) {
  return (
    <div className="project-particle-canvas" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 6.4], fov: 47 }} dpr={[1, 1.5]} gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}>
        <PreviewField {...props} />
      </Canvas>
    </div>
  )
}
