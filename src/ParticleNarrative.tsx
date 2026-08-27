import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'

type Props = {
  progress: MutableRefObject<number>
  reducedMotion: boolean
}

const vertexShader = `
  attribute vec3 aMolecule;
  attribute vec3 aMicrostructure;
  attribute vec3 aChip;
  attribute vec3 aComputer;
  attribute vec3 aRenderedMap;
  attribute float aSeed;
  uniform float uProgress;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vSeed;
  varying float vProgress;

  float easeCubic(float value) {
    return value * value * (3.0 - 2.0 * value);
  }

  void main() {
    float p = clamp(uProgress, 0.0, 1.0);
    float sequence = p * 5.0;
    float localProgress = fract(sequence);
    float morphProgress = easeCubic(smoothstep(0.22, 0.78, localProgress));
    vec3 finalPosition;

    if (sequence < 1.0) finalPosition = mix(position, aMolecule, morphProgress);
    else if (sequence < 2.0) finalPosition = mix(aMolecule, aMicrostructure, morphProgress);
    else if (sequence < 3.0) finalPosition = mix(aMicrostructure, aChip, morphProgress);
    else if (sequence < 4.0) finalPosition = mix(aChip, aComputer, morphProgress);
    else if (sequence < 5.0) finalPosition = mix(aComputer, aRenderedMap, morphProgress);
    else finalPosition = aRenderedMap;

    float secondaryMotion = sin(uTime * 0.38 + aSeed * 31.0) * 0.018;
    secondaryMotion *= 1.0 - smoothstep(0.42, 0.78, p);
    finalPosition += normalize(finalPosition + vec3(0.001)) * secondaryMotion;

    vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float perspective = 8.0 / max(2.5, -mvPosition.z);
    gl_PointSize = (1.65 + aSeed * 2.25) * uPixelRatio * perspective;
    vSeed = aSeed;
    vProgress = p;
  }
`

const fragmentShader = `
  uniform float uOpacity;
  uniform float uTime;
  varying float vSeed;
  varying float vProgress;

  void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float alpha = smoothstep(0.5, 0.07, distanceToCenter) * uOpacity;
    vec3 platinum = vec3(0.82, 0.87, 0.90);
    vec3 ice = vec3(0.36, 0.63, 0.88);
    vec3 amber = vec3(0.96, 0.55, 0.24);

    float moleculePhase = smoothstep(0.08, 0.28, vProgress);
    float mapPhase = smoothstep(0.82, 1.0, vProgress);
    float chipPhase = 1.0 - smoothstep(0.08, 0.18, abs(vProgress - 0.6));
    vec3 color = mix(platinum, ice, moleculePhase * 0.7);
    color = mix(color, platinum, smoothstep(0.34, 0.58, vProgress) * 0.48);
    color = mix(color, ice, mapPhase * 0.68);
    float signal = step(0.88, vSeed) * (0.55 + 0.45 * sin(uTime * 2.0 + vSeed * 40.0));
    color = mix(color, amber, max(chipPhase, mapPhase * 0.6) * signal);
    alpha *= 0.76 + max(chipPhase, mapPhase) * signal * 0.24;
    gl_FragColor = vec4(color, alpha);
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

function setVector(array: Float32Array, index: number, x: number, y: number, z: number) {
  const offset = index * 3
  array[offset] = x
  array[offset + 1] = y
  array[offset + 2] = z
}

function rotateXYZ(x: number, y: number, z: number, rx: number, ry: number, rz: number) {
  const cosX = Math.cos(rx); const sinX = Math.sin(rx)
  const cosY = Math.cos(ry); const sinY = Math.sin(ry)
  const cosZ = Math.cos(rz); const sinZ = Math.sin(rz)
  const y1 = y * cosX - z * sinX
  const z1 = y * sinX + z * cosX
  const x2 = x * cosY + z1 * sinY
  const z2 = -x * sinY + z1 * cosY
  return [x2 * cosZ - y1 * sinZ, x2 * sinZ + y1 * cosZ, z2] as const
}

function createAtomTarget(count: number, random: () => number) {
  const positions = new Float32Array(count * 3)
  const nucleusCount = Math.floor(count * 0.32)
  for (let i = 0; i < count; i += 1) {
    if (i < nucleusCount) {
      const theta = random() * Math.PI * 2
      const phi = Math.acos(2 * random() - 1)
      const radius = Math.cbrt(random()) * 0.62
      setVector(positions, i, Math.sin(phi) * Math.cos(theta) * radius, Math.cos(phi) * radius, Math.sin(phi) * Math.sin(theta) * radius)
      continue
    }

    const ring = i % 2
    const angle = ((i - nucleusCount) / (count - nucleusCount)) * Math.PI * 2 * 8 + ring * 0.8
    const radiusX = 1.72 + ring * 0.28
    const radiusY = 0.7 + ring * 0.1
    const thickness = (random() - 0.5) * 0.13
    const x = Math.cos(angle) * radiusX
    const y = Math.sin(angle) * radiusY
    const z = thickness
    const rotations = [[0.18, 0.0, 0.22], [0.94, 0.48, -0.18]][ring]
    const point = rotateXYZ(x, y, z, rotations[0], rotations[1], rotations[2])
    setVector(positions, i, point[0], point[1], point[2])
  }
  return positions
}

function createMoleculeTarget(count: number, random: () => number) {
  const positions = new Float32Array(count * 3)
  const centers = [
    [0, 0, 0], [-1.55, 0.78, 0.06], [1.55, 0.78, -0.06],
    [0, -1.5, 0.12], [-2.75, -0.35, -0.18], [2.75, -0.35, 0.18],
  ]
  const bonds = [[0, 1], [0, 2], [0, 3], [1, 4], [2, 5], [1, 3], [2, 3]]
  const bondCount = Math.floor(count * 0.34)

  for (let i = 0; i < count; i += 1) {
    if (i < bondCount) {
      const bond = bonds[i % bonds.length]
      const from = centers[bond[0]]
      const to = centers[bond[1]]
      const t = random()
      const jitter = (random() - 0.5) * 0.055
      setVector(positions, i, from[0] + (to[0] - from[0]) * t + jitter, from[1] + (to[1] - from[1]) * t + jitter, from[2] + (to[2] - from[2]) * t + jitter)
      continue
    }

    const centerIndex = i % centers.length
    const center = centers[centerIndex]
    const localIndex = i - bondCount
    if (localIndex % 3 === 0) {
      const theta = random() * Math.PI * 2
      const phi = Math.acos(2 * random() - 1)
      const radius = Math.cbrt(random()) * (centerIndex === 0 ? 0.38 : 0.31)
      setVector(positions, i, center[0] + Math.sin(phi) * Math.cos(theta) * radius, center[1] + Math.cos(phi) * radius, center[2] + Math.sin(phi) * Math.sin(theta) * radius)
    } else {
      const angle = random() * Math.PI * 2
      const ringRadius = centerIndex === 0 ? 0.72 : 0.57
      const point = rotateXYZ(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius * 0.38, (random() - 0.5) * 0.05, centerIndex * 0.26, centerIndex * 0.18, centerIndex * 0.31)
      setVector(positions, i, center[0] + point[0], center[1] + point[1], center[2] + point[2])
    }
  }
  return positions
}

function createMicrostructureTarget(count: number, random: () => number) {
  const positions = new Float32Array(count * 3)
  const grainCenters = [
    [-2.25, 1.15, 0.06], [0, 1.28, -0.04], [2.25, 1.08, 0.08],
    [-2.15, -1.18, -0.07], [0.08, -1.08, 0.05], [2.3, -1.22, -0.02],
  ]
  const grainAngles = [
    [-0.16, 0.18, -0.12], [0.12, -0.2, 0.2], [-0.08, 0.24, -0.18],
    [0.18, -0.12, 0.14], [-0.14, -0.2, -0.16], [0.1, 0.16, 0.22],
  ]
  const nx = 12
  const ny = 10
  const nz = 10
  const pointsPerGrain = nx * ny * nz
  const spacing = 0.125

  for (let i = 0; i < count; i += 1) {
    const grain = i % grainCenters.length
    const local = Math.floor(i / grainCenters.length) % pointsPerGrain
    const ix = local % nx
    const iy = Math.floor(local / nx) % ny
    const iz = Math.floor(local / (nx * ny)) % nz
    let x = (ix - (nx - 1) * 0.5) * spacing
    let y = (iy - (ny - 1) * 0.5) * spacing
    let z = (iz - (nz - 1) * 0.5) * spacing

    // Each grain keeps a strict local lattice but has its own crystal orientation.
    const angles = grainAngles[grain]
    const rotated = rotateXYZ(x, y, z, angles[0], angles[1], angles[2])
    x = rotated[0] + grainCenters[grain][0]
    y = rotated[1] + grainCenters[grain][1]
    z = rotated[2] + grainCenters[grain][2]

    // Sparse dislocations interrupt the order without collapsing it into noise.
    if (local % 97 === 0) {
      x += (random() - 0.5) * 0.28
      y += (random() - 0.5) * 0.28
      z += 0.18
    }
    setVector(positions, i, x, y, z)
  }
  return positions
}

function createChipTarget(count: number, random: () => number) {
  const positions = new Float32Array(count * 3)
  const dieEnd = Math.floor(count * 0.43)
  const borderEnd = Math.floor(count * 0.60)
  const traceEnd = Math.floor(count * 0.84)
  const pinEnd = Math.floor(count * 0.94)

  for (let i = 0; i < count; i += 1) {
    if (i < dieEnd) {
      const columns = 72
      const rows = Math.ceil(dieEnd / columns)
      const column = i % columns
      const row = Math.floor(i / columns)
      const x = (column / (columns - 1) - 0.5) * 5.8
      const y = (row / (rows - 1) - 0.5) * 3.2
      const channel = column % 8 === 0 || row % 7 === 0
      const z = channel ? 0.24 : 0.1 + (i % 3) * 0.045
      setVector(positions, i, x, y, z)
    } else if (i < borderEnd) {
      const local = i - dieEnd
      const t = local / Math.max(1, borderEnd - dieEnd - 1)
      const perimeter = t * 4
      let x = 0; let y = 0
      if (perimeter < 1) { x = -3.8 + perimeter * 7.6; y = -2.35 }
      else if (perimeter < 2) { x = 3.8; y = -2.35 + (perimeter - 1) * 4.7 }
      else if (perimeter < 3) { x = 3.8 - (perimeter - 2) * 7.6; y = 2.35 }
      else { x = -3.8; y = 2.35 - (perimeter - 3) * 4.7 }
      setVector(positions, i, x, y, 0.02 + (local % 3) * 0.14)
    } else if (i < traceEnd) {
      const local = i - borderEnd
      const channel = local % 20
      const t = Math.floor(local / 20) / Math.max(1, Math.floor((traceEnd - borderEnd) / 20) - 1)
      const horizontal = channel % 2 === 0
      const direction = channel % 4 < 2 ? 1 : -1
      const offset = (Math.floor(channel / 4) - 2) * 0.32
      const x = horizontal ? direction * (0.4 + t * 3.35) : offset
      const y = horizontal ? offset : direction * (0.3 + t * 2.0)
      setVector(positions, i, x, y, 0.34 + (channel % 3) * 0.05)
    } else if (i < pinEnd) {
      const local = i - traceEnd
      const side = local % 2
      const t = Math.floor(local / 2) / Math.max(1, Math.floor((pinEnd - traceEnd) / 2) - 1)
      setVector(positions, i, side === 0 ? -4.18 : 4.18, (t - 0.5) * 4.45, -0.08 + (local % 4) * 0.06)
    } else {
      const local = i - pinEnd
      const angle = local * 0.31
      const radius = 0.5 + (local % 14) * 0.045
      const layer = (local % 8) * 0.11
      setVector(positions, i, Math.cos(angle) * radius, Math.sin(angle) * radius * 0.72, 0.38 + layer)
    }
  }
  return positions
}

function createComputerTarget(count: number, random: () => number) {
  const positions = new Float32Array(count * 3)
  const screenEnd = Math.floor(count * 0.46)
  const frameEnd = Math.floor(count * 0.66)
  const standEnd = Math.floor(count * 0.78)

  for (let i = 0; i < count; i += 1) {
    if (i < screenEnd) {
      const columns = 64
      const rows = Math.ceil(screenEnd / columns)
      const column = i % columns
      const row = Math.floor(i / columns)
      const x = (column / (columns - 1) - 0.5) * 6.4
      const y = (row / (rows - 1) - 0.5) * 3.25 + 0.35
      const interfaceGap = column % 13 === 0 || row % 11 === 0
      setVector(positions, i, x, y, interfaceGap ? 0.16 : 0.04)
    } else if (i < frameEnd) {
      const local = i - screenEnd
      const t = local / Math.max(1, frameEnd - screenEnd - 1)
      const perimeter = t * 4
      let x = 0; let y = 0
      if (perimeter < 1) { x = -3.7 + perimeter * 7.4; y = -1.7 }
      else if (perimeter < 2) { x = 3.7; y = -1.7 + (perimeter - 1) * 4.1 }
      else if (perimeter < 3) { x = 3.7 - (perimeter - 2) * 7.4; y = 2.4 }
      else { x = -3.7; y = 2.4 - (perimeter - 3) * 4.1 }
      setVector(positions, i, x, y, (local % 4) * 0.045)
    } else if (i < standEnd) {
      const local = i - frameEnd
      const ratio = local / Math.max(1, standEnd - frameEnd - 1)
      if (local % 3 === 0) setVector(positions, i, (random() - 0.5) * 0.18, -1.7 - ratio * 1.15, 0.02)
      else setVector(positions, i, (ratio - 0.5) * 3.0, -2.86 + (random() - 0.5) * 0.08, 0.02)
    } else {
      const local = i - standEnd
      const channel = local % 8
      const t = Math.floor(local / 8) / Math.max(1, Math.floor((count - standEnd) / 8) - 1)
      const x = -2.8 + t * 5.6
      const bar = 0.3 + ((channel * 7) % 9) * 0.12
      const y = channel < 4 ? 1.55 - channel * 0.48 : -1.05 + Math.sin(t * Math.PI * (channel - 2)) * bar
      setVector(positions, i, x, y + 0.35, 0.24 + (channel % 3) * 0.055)
    }
  }
  return positions
}

function createRenderedMapTarget(count: number) {
  const positions = new Float32Array(count * 3)
  const terrainEnd = Math.floor(count * 0.68)
  const landmarkEnd = Math.floor(count * 0.88)

  for (let i = 0; i < count; i += 1) {
    if (i < terrainEnd) {
      const columns = 82
      const rows = Math.ceil(terrainEnd / columns)
      const x = ((i % columns) / (columns - 1) - 0.5) * 7.6
      const z = (Math.floor(i / columns) / Math.max(1, rows - 1) - 0.5) * 5.2
      const y = -1.25 + Math.sin(x * 0.72) * 0.18 + Math.cos(z * 1.05) * 0.14 + Math.sin((x + z) * 1.8) * 0.055
      setVector(positions, i, x, y, z)
    } else if (i < landmarkEnd) {
      const local = i - terrainEnd
      const landmark = local % 14
      const t = Math.floor(local / 14) / Math.max(1, Math.floor((landmarkEnd - terrainEnd) / 14) - 1)
      const centerX = (landmark % 7 - 3) * 1.0
      const centerZ = (Math.floor(landmark / 7) - 0.5) * 2.1
      const base = -1.18 + Math.sin(centerX * 0.72) * 0.18 + Math.cos(centerZ * 1.05) * 0.14
      const angle = t * Math.PI * 8
      const radius = 0.08 + t * 0.24
      setVector(positions, i, centerX + Math.cos(angle) * radius, base + t * (0.55 + (landmark % 4) * 0.12), centerZ + Math.sin(angle) * radius)
    } else {
      const local = i - landmarkEnd
      const lane = local % 8
      const t = Math.floor(local / 8) / Math.max(1, Math.floor((count - landmarkEnd) / 8) - 1)
      const x = -3.65 + t * 7.3
      const z = Math.sin(t * Math.PI * 2.5) * 1.15 + (lane - 3.5) * 0.025
      const y = -1.2 + Math.sin(x * 0.72) * 0.18 + Math.cos(z * 1.05) * 0.14 + 0.055
      setVector(positions, i, x, y, z)
    }
  }
  return positions
}

function createParticleData(count: number) {
  const random = seededRandom(1993)
  const atom = createAtomTarget(count, random)
  const molecule = createMoleculeTarget(count, random)
  const microstructure = createMicrostructureTarget(count, random)
  const chip = createChipTarget(count, random)
  const computer = createComputerTarget(count, random)
  const renderedMap = createRenderedMapTarget(count)
  const seeds = new Float32Array(count)
  for (let i = 0; i < count; i += 1) seeds[i] = random()
  return { atom, molecule, microstructure, chip, computer, renderedMap, seeds }
}

function ChipGeometry({ progress }: Pick<Props, 'progress'>) {
  const group = useRef<THREE.Group>(null)
  const plateMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const lineMaterials = useRef<THREE.LineBasicMaterial[]>([])
  const outerEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(8.35, 5.25, 0.38)), [])
  const dieEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(6.15, 3.55, 0.52)), [])
  const coreEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(2.0, 1.35, 0.78)), [])

  useFrame(() => {
    const distanceFromChip = Math.abs(progress.current - 0.6)
    const reveal = 1 - THREE.MathUtils.smoothstep(distanceFromChip, 0.035, 0.105)
    if (group.current) {
      group.current.visible = reveal > 0.002
      group.current.scale.setScalar(0.88 + reveal * 0.12)
    }
    if (plateMaterial.current) plateMaterial.current.opacity = reveal * 0.07
    lineMaterials.current.forEach((material, index) => { material.opacity = reveal * (index === 2 ? 0.62 : 0.36) })
  })

  const lineMaterial = (index: number, color: string) => (
    <lineBasicMaterial ref={material => { if (material) lineMaterials.current[index] = material }} color={color} transparent opacity={0} depthWrite={false} />
  )

  return (
    <group ref={group} visible={false} rotation={[-0.08, 0.04, 0]}>
      <mesh position={[0, 0, -0.12]}><boxGeometry args={[8.35, 5.25, 0.38]} /><meshBasicMaterial ref={plateMaterial} color="#13202a" transparent opacity={0} depthWrite={false} /></mesh>
      <lineSegments geometry={outerEdges}>{lineMaterial(0, '#7894a9')}</lineSegments>
      <lineSegments geometry={dieEdges} position={[0, 0, 0.12]}>{lineMaterial(1, '#83b8ea')}</lineSegments>
      <lineSegments geometry={coreEdges} position={[0, 0, 0.48]}>{lineMaterial(2, '#eaa468')}</lineSegments>
    </group>
  )
}

function ParticleField({ progress, reducedMotion }: Props) {
  const material = useRef<THREE.ShaderMaterial>(null)
  const points = useRef<THREE.Points>(null)
  const particleGroup = useRef<THREE.Group>(null)
  const interaction = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    pointerX: 0,
    pointerY: 0,
    targetRotationX: 0,
    targetRotationY: 0,
    rotationX: 0,
    rotationY: 0,
  })
  const count = useMemo(() => (window.innerWidth < 850 ? 2800 : 5600), [])
  const data = useMemo(() => createParticleData(count), [count])
  const geometry = useMemo(() => {
    const result = new THREE.BufferGeometry()
    result.setAttribute('position', new THREE.BufferAttribute(data.atom, 3))
    result.setAttribute('aMolecule', new THREE.BufferAttribute(data.molecule, 3))
    result.setAttribute('aMicrostructure', new THREE.BufferAttribute(data.microstructure, 3))
    result.setAttribute('aChip', new THREE.BufferAttribute(data.chip, 3))
    result.setAttribute('aComputer', new THREE.BufferAttribute(data.computer, 3))
    result.setAttribute('aRenderedMap', new THREE.BufferAttribute(data.renderedMap, 3))
    result.setAttribute('aSeed', new THREE.BufferAttribute(data.seeds, 1))
    return result
  }, [data])
  const uniforms = useMemo(() => ({
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
    uOpacity: { value: 0.88 },
  }), [])

  useEffect(() => {
    const state = interaction.current
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      const isControl = target instanceof Element && Boolean(target.closest('a, button, input, textarea, select, [role="dialog"]'))
      if (event.button !== 0 || event.pointerType !== 'mouse' || isControl) return
      state.dragging = true
      state.lastX = event.clientX
      state.lastY = event.clientY
      document.body.classList.add('particle-dragging')
    }
    const onPointerMove = (event: PointerEvent) => {
      state.pointerX = event.clientX / Math.max(1, window.innerWidth) * 2 - 1
      state.pointerY = -(event.clientY / Math.max(1, window.innerHeight) * 2 - 1)
      if (!state.dragging) return
      const deltaX = event.clientX - state.lastX
      const deltaY = event.clientY - state.lastY
      state.lastX = event.clientX
      state.lastY = event.clientY
      state.targetRotationY += deltaX * 0.006
      state.targetRotationX = THREE.MathUtils.clamp(state.targetRotationX + deltaY * 0.005, -1.05, 1.05)
      event.preventDefault()
    }
    const stopDragging = () => {
      state.dragging = false
      document.body.classList.remove('particle-dragging')
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('blur', stopDragging)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('blur', stopDragging)
      document.body.classList.remove('particle-dragging')
    }
  }, [])

  useFrame((state) => {
    if (!material.current || !points.current || !particleGroup.current) return
    const smoothing = reducedMotion ? 0.2 : 0.085
    const current = THREE.MathUtils.lerp(material.current.uniforms.uProgress.value, progress.current, smoothing)
    material.current.uniforms.uProgress.value = current
    material.current.uniforms.uTime.value = state.clock.elapsedTime

    const chipReveal = 1 - THREE.MathUtils.smoothstep(Math.abs(current - 0.6), 0.045, 0.13)
    const computerReveal = 1 - THREE.MathUtils.smoothstep(Math.abs(current - 0.8), 0.045, 0.13)
    const latePullback = THREE.MathUtils.smoothstep(current, 0.84, 1.0)
    const cameraTarget = 7.1 + chipReveal * 2.6 + computerReveal * 1.4 + latePullback * 1.1
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, cameraTarget, 0.055)
    const earlyMotion = 1 - THREE.MathUtils.smoothstep(current, 0.48, 0.74)
    const mapTilt = THREE.MathUtils.smoothstep(current, 0.84, 1.0)
    const motionY = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.12) * 0.1 * earlyMotion
    const motionX = reducedMotion ? 0 : Math.cos(state.clock.elapsedTime * 0.1) * 0.05 * earlyMotion
    const input = interaction.current
    input.rotationX = THREE.MathUtils.lerp(input.rotationX, input.targetRotationX, input.dragging ? 0.16 : 0.075)
    input.rotationY = THREE.MathUtils.lerp(input.rotationY, input.targetRotationY, input.dragging ? 0.16 : 0.075)
    particleGroup.current.rotation.y = motionY - mapTilt * 0.16 + input.rotationY
    particleGroup.current.rotation.x = motionX + mapTilt * 0.48 + input.rotationX
    const pointerX = reducedMotion ? 0 : input.pointerX * 0.07
    const pointerY = reducedMotion ? 0 : input.pointerY * 0.045
    particleGroup.current.position.x = THREE.MathUtils.lerp(particleGroup.current.position.x, pointerX, 0.035)
    particleGroup.current.position.y = THREE.MathUtils.lerp(particleGroup.current.position.y, pointerY, 0.035)
  })

  return (
    <group position={[window.innerWidth < 850 ? 0 : 0.85, 0, 0]}>
      <group ref={particleGroup}>
      <points ref={points} geometry={geometry} frustumCulled={false}>
        <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <ChipGeometry progress={progress} />
      </group>
    </group>
  )
}

export function ParticleNarrative(props: Props) {
  return (
    <div className="scene-canvas" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 7.1], fov: 46 }} dpr={[1, 1.5]} gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}>
        <ParticleField {...props} />
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom intensity={0.68} luminanceThreshold={0.34} luminanceSmoothing={0.72} mipmapBlur radius={0.62} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
