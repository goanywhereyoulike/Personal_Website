import { useEffect, useRef } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'
import './GradientWaves.css'

type Detail = 'low' | 'medium' | 'high'

type GradientWavesProps = {
  active?: boolean
  horizonColor?: string
  waveColor?: string
  crestColor?: string
  speed?: number
  amplitude?: number
  waveScale?: number
  waveRatio?: number
  swell?: number
  turbulence?: number
  tilt?: number
  zoom?: number
  height?: number
  fogDepth?: number
  detail?: Detail
  brightness?: number
  opacity?: number
  mouseInteraction?: boolean
  parallaxStrength?: number
  fieldInteraction?: boolean
  fieldStrength?: number
  interactionColor?: string
  spotRadius?: number
  scanDuration?: number
  scanRadius?: number
  grain?: boolean
  grainIntensity?: number
  maxFps?: number
  className?: string
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return [1, 1, 1]
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
}

const detailToSteps = (detail: Detail) => detail === 'low' ? 36 : detail === 'high' ? 82 : 56

const vertex = `#version 300 es
precision highp float;
in vec2 position;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaveScale;
uniform float uWaveRatio;
uniform float uSwell;
uniform float uTurbulence;
uniform float uTilt;
uniform float uZoom;
uniform float uHeight;
uniform float uFogDepth;
uniform float uSteps;
uniform bool uFieldEnabled;
uniform vec2 uMouse;
uniform vec2 uPulseMouse;
uniform float uPulseActive;
uniform float uPulseSurfaceTime;
uniform float uFieldStrength;
flat out vec2 vFieldCenter;
flat out vec2 vPulseCenter;
flat out float vFieldValid;
flat out float vPulseValid;

const float POINTER_MAX_DIST = 20000.0;

float pointerBaseHeight(vec2 point, vec2 freq, vec4 tc) {
  float mx = point.x + tc.x;
  mx += uSwell * sin((point.y + mx) / 20.0 + tc.y);
  float my = point.y - tc.z;
  my += uTurbulence * cos(point.x / 23.0 + tc.w);
  return sin(mx * freq.x) * uAmplitude + sin(my * freq.y) * uAmplitude + uHeight;
}

float pointerScene(vec3 point, vec2 freq, vec4 tc) {
  return point.z - pointerBaseHeight(point.xy, freq, tc);
}

vec3 pointerCameraRay(vec2 rayUv, float vfov) {
  vec3 ray = vec3(0.0, 0.0, -1.0);
  float rayLength = length(rayUv);
  float xrot = vfov * rayLength;
  float c = cos(xrot);
  float s = sin(xrot);
  ray = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * ray;
  vec2 normalizedUv = rayLength > 1e-5 ? rayUv / rayLength : vec2(1.0, 0.0);
  c = normalizedUv.x;
  s = normalizedUv.y;
  ray = mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0) * ray;
  c = cos(uTilt);
  s = sin(uTilt);
  return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * ray;
}

vec3 rayForPointer(vec2 pointer, float vfov) {
  vec2 pointerUv = pointer - 0.5;
  pointerUv.x *= iResolution.x / iResolution.y;
  pointerUv.y *= -1.0;
  return pointerCameraRay(pointerUv, vfov);
}

float pointerRaymarch(vec3 origin, vec3 direction, vec2 freq, vec4 tc) {
  // Begin just in front of the highest possible crest. This avoids spending
  // most of the march budget travelling through empty space on shallow rays.
  float highestSurface = uHeight + 2.0 * abs(uAmplitude) + 0.5;
  float distanceValue = max(0.0, (origin.z - highestSurface) / max(-direction.z, 0.001));
  float previousDistance = distanceValue;
  float previousScene = pointerScene(origin + distanceValue * direction, freq, tc);
  bool hit = false;
  for (int i = 0; i < 128; i++) {
    float sceneValue = pointerScene(origin + distanceValue * direction, freq, tc);
    if (abs(sceneValue) < 0.018) {
      hit = true;
      break;
    }
    if (sceneValue < 0.0 && previousScene > 0.0) {
      float lower = previousDistance;
      float upper = distanceValue;
      for (int refinement = 0; refinement < 6; refinement++) {
        float middle = (lower + upper) * 0.5;
        float middleScene = pointerScene(origin + middle * direction, freq, tc);
        if (middleScene > 0.0) lower = middle;
        else upper = middle;
      }
      distanceValue = (lower + upper) * 0.5;
      hit = true;
      break;
    }
    previousDistance = distanceValue;
    previousScene = sceneValue;
    distanceValue += clamp(abs(sceneValue) * 0.44, 0.018, 1.0);
    if (!(abs(distanceValue) < POINTER_MAX_DIST)) return POINTER_MAX_DIST;
  }
  return hit ? distanceValue : POINTER_MAX_DIST;
}

vec4 pointerTimeChannels(float timeValue) {
  float waveTime = timeValue * uSpeed;
  return vec4(waveTime / 0.130, waveTime / 0.810, waveTime / 0.200, waveTime / 0.710);
}

void main() {
  vFieldCenter = vec2(0.0);
  vPulseCenter = vec2(0.0);
  vFieldValid = 0.0;
  vPulseValid = 0.0;
  if (uFieldEnabled) {
    vec2 freq = vec2(uWaveScale / 7.0, (uWaveScale * uWaveRatio) / 3.0);
    float vfov = (3.14159 / 2.3) / max(uZoom, 0.05);
    vec3 camera = vec3(0.0, 0.0, 30.0);
    vec4 fieldTc = pointerTimeChannels(iTime);
    vec3 fieldRay = rayForPointer(uMouse, vfov);
    float fieldDistance = pointerRaymarch(camera, fieldRay, freq, fieldTc);
    if (fieldDistance < POINTER_MAX_DIST * 0.5) {
      vFieldCenter = (camera + fieldDistance * fieldRay).xy;
      vFieldValid = 1.0;
    }

    if (uPulseActive > 0.001) {
      vec4 pulseTc = pointerTimeChannels(uPulseSurfaceTime);
      vec3 pulseRay = rayForPointer(uPulseMouse, vfov);
      float pulseDistance = pointerRaymarch(camera, pulseRay, freq, pulseTc);
      if (pulseDistance < POINTER_MAX_DIST * 0.5) {
        vPulseCenter = (camera + pulseDistance * pulseRay).xy;
        float pulseDepth = clamp(uFogDepth / max(pulseDistance, 0.001), 0.0, 1.0);
        vPulseValid = smoothstep(0.46, 0.68, pulseDepth);
      }
    }
  }
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaveScale;
uniform float uWaveRatio;
uniform float uSwell;
uniform float uTurbulence;
uniform float uTilt;
uniform float uZoom;
uniform float uHeight;
uniform float uFogDepth;
uniform float uSteps;
uniform float uBrightness;
uniform float uOpacity;
uniform float uGrain;
uniform float uGrainIntensity;
uniform vec2 uMouse;
uniform float uParallax;
uniform bool uEnableMouse;
uniform bool uFieldEnabled;
uniform float uFieldStrength;
uniform float uMouseActivity;
uniform float uSpotRadius;
uniform float uPulseAge;
uniform float uPulseActive;
uniform float uPulseDuration;
uniform float uPulseRadius;
uniform vec3 uHorizonColor;
uniform vec3 uWaveColor;
uniform vec3 uCrestColor;
uniform vec3 uInteractionColor;
flat in vec2 vFieldCenter;
flat in vec2 vPulseCenter;
flat in float vFieldValid;
flat in float vPulseValid;
out vec4 fragColor;

const float MAX_DIST = 20000.0;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float baseSurfaceHeight(vec2 point, vec2 freq, vec4 tc) {
  float mx = point.x + tc.x;
  mx += uSwell * sin((point.y + mx) / 20.0 + tc.y);
  float my = point.y - tc.z;
  my += uTurbulence * cos(point.x / 23.0 + tc.w);
  return sin(mx * freq.x) * uAmplitude + sin(my * freq.y) * uAmplitude + uHeight;
}

float pulseSurfaceLift(vec2 point) {
  if (!uFieldEnabled || uPulseActive <= 0.001 || vPulseValid <= 0.001) return 0.0;

  float pulseProgress = clamp(uPulseAge / max(uPulseDuration, 0.001), 0.0, 1.0);
  float expandingRadius = pulseProgress * uPulseRadius;
  float ringDelta = length(point - vPulseCenter) - expandingRadius;
  float ringWidth = mix(2.2, 1.65, pulseProgress);
  float ringCoordinate = clamp(abs(ringDelta) / ringWidth, 0.0, 1.0);
  float ringEnvelope = 0.5 + 0.5 * cos(3.14159265 * ringCoordinate);

  // The click begins as a raised pulse, then the ridge travels outward and
  // settles back into the base surface. The cosine packet has zero slope at
  // both edges, keeping the displaced height field continuous.
  float heightDecay = 1.0 - smoothstep(0.38, 0.96, pulseProgress);
  return ringEnvelope * heightDecay * uFieldStrength * 0.58 * vPulseValid;
}

float surfaceHeight(vec2 point, vec2 freq, vec4 tc) {
  return baseSurfaceHeight(point, freq, tc) + pulseSurfaceLift(point);
}

float plasma(vec3 r, vec2 freq, vec4 tc) {
  return r.z - surfaceHeight(r.xy, freq, tc);
}

float raymarch(vec3 pos, vec3 dir, vec2 freq, vec4 tc, out float hitMask) {
  float dist = 0.0;
  float previousDist = 0.0;
  float previousScene = plasma(pos, freq, tc);
  hitMask = 0.0;
  for (int i = 0; i < 128; i++) {
    if (float(i) >= uSteps) break;
    float dscene = plasma(pos + dist * dir, freq, tc);
    if (abs(dscene) < 0.035) {
      hitMask = 1.0;
      break;
    }

    // This is a height field rather than a true signed-distance field. When a
    // narrow moving crest is crossed, bracket the root and refine it instead
    // of allowing a large step to tear the rendered surface.
    if (dscene < 0.0 && previousScene > 0.0) {
      float lower = previousDist;
      float upper = dist;
      for (int refinement = 0; refinement < 6; refinement++) {
        float middle = (lower + upper) * 0.5;
        float middleScene = plasma(pos + middle * dir, freq, tc);
        if (middleScene > 0.0) lower = middle;
        else upper = middle;
      }
      dist = (lower + upper) * 0.5;
      hitMask = 1.0;
      break;
    }

    previousDist = dist;
    previousScene = dscene;
    dist += clamp(abs(dscene) * 0.48, 0.035, 1.25);
    if (!(abs(dist) < MAX_DIST)) {
      hitMask = 0.0;
      return MAX_DIST;
    }
  }
  // Keep the original approximate distance when the budget ends. It produces
  // the soft fog/horizon transition, while hitMask prevents interaction light
  // from treating that approximation as a real surface.
  return dist;
}

vec3 makeCameraRay(vec2 rayUv, float vfov) {
  vec3 ray = vec3(0.0, 0.0, -1.0);
  float rayLength = length(rayUv);
  float xrot = vfov * rayLength;
  float c = cos(xrot);
  float s = sin(xrot);
  ray = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * ray;
  vec2 normalizedUv = rayLength > 1e-5 ? rayUv / rayLength : vec2(1.0, 0.0);
  c = normalizedUv.x;
  s = normalizedUv.y;
  ray = mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0) * ray;
  c = cos(uTilt);
  s = sin(uTilt);
  return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * ray;
}

vec4 waveTimeChannels(float timeValue) {
  float waveTime = timeValue * uSpeed;
  return vec4(waveTime / 0.130, waveTime / 0.810, waveTime / 0.200, waveTime / 0.710);
}

void main() {
  vec2 freq = vec2(uWaveScale / 7.0, (uWaveScale * uWaveRatio) / 3.0);
  vec4 tc = waveTimeChannels(iTime);
  float c, s;
  float vfov = (3.14159 / 2.3) / max(uZoom, 0.05);
  vec3 cam = vec3(0.0, 0.0, 30.0);
  vec2 uv = (gl_FragCoord.xy / iResolution.xy) - 0.5;
  uv.x *= iResolution.x / iResolution.y;
  uv.y *= -1.0;

  vec2 fieldCenter = vFieldCenter;

  vec3 dir = makeCameraRay(uv, vfov);

  if (uEnableMouse) {
    float yaw = (uMouse.x - 0.5) * uParallax * 0.4;
    float pitch = (uMouse.y - 0.5) * uParallax * 0.4;
    c = cos(yaw); s = sin(yaw);
    dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;
    c = cos(pitch); s = sin(pitch);
    dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  }

  float rayHit = 0.0;
  float dist = raymarch(cam, dir, freq, tc, rayHit);
  vec3 pos = cam + dist * dir;
  float t = clamp(uFogDepth / max(dist, 0.001), 0.0, 1.0);
  float validSurface = 1.0 - step(MAX_DIST * 0.5, abs(dist));
  vec3 body = mix(uWaveColor, uCrestColor, clamp(pos.z * 0.08 + 0.5, 0.0, 1.0));
  vec3 col = mix(uHorizonColor, body, t);
  col *= uBrightness;

  if (uFieldEnabled) {
    float normalEpsilon = 0.18;
    float slopeX = baseSurfaceHeight(pos.xy + vec2(normalEpsilon, 0.0), freq, tc)
      - baseSurfaceHeight(pos.xy - vec2(normalEpsilon, 0.0), freq, tc);
    float slopeY = baseSurfaceHeight(pos.xy + vec2(0.0, normalEpsilon), freq, tc)
      - baseSurfaceHeight(pos.xy - vec2(0.0, normalEpsilon), freq, tc);
    vec3 surfaceNormal = normalize(vec3(-slopeX, -slopeY, 2.0 * normalEpsilon));
    float topFacing = smoothstep(0.24, 0.58, surfaceNormal.z);
    float depthVisibility = smoothstep(0.46, 0.68, t);
    float interactionSurface = validSurface * rayHit * topFacing * depthVisibility;

    // World-space footprint on the actual wave surface. Its centre comes from
    // the same camera ray as the pointer and now shares the canvas dimensions.
    float spotDistance = length(pos.xy - fieldCenter);
    float safeSpotRadius = max(uSpotRadius, 0.001);
    float surfaceSpot = exp(-pow(spotDistance / safeSpotRadius, 2.0) * 2.35);
    float hitCore = exp(-pow(spotDistance / max(safeSpotRadius * 0.22, 0.001), 2.0) * 2.8);
    float spot = clamp(surfaceSpot * 0.78 + hitCore * 0.34, 0.0, 1.0)
      * uMouseActivity * interactionSurface * vFieldValid;
    col = mix(col, uInteractionColor, spot * 0.66);
    col += uInteractionColor * spot * 0.2;

    float pulseProgress = clamp(uPulseAge / max(uPulseDuration, 0.001), 0.0, 1.0);
    float expandingRadius = pulseProgress * uPulseRadius;
    float pulseDistance = length(pos.xy - vPulseCenter);
    float scanDelta = pulseDistance - expandingRadius;
    float scanWidth = 1.5 + min(fwidth(scanDelta) * 1.5, 0.55);
    float scanCoordinate = clamp(abs(scanDelta) / scanWidth, 0.0, 1.0);
    float scanBand = 0.5 + 0.5 * cos(3.14159265 * scanCoordinate);
    float scanFade = (1.0 - smoothstep(0.08, 1.0, pulseProgress))
      * uPulseActive * vPulseValid * interactionSurface;
    float scanLight = scanBand * scanFade;
    col = mix(col, uInteractionColor, scanLight * 0.76);
    col += uInteractionColor * scanLight * 0.12;
  }
  col = clamp(col, 0.0, 1.0);

  float alpha = clamp(t, 0.0, 1.0) * uOpacity;
  if (uGrain > 0.5) {
    float g = hash21(gl_FragCoord.xy + mod(iTime, 64.0) * 11.0);
    alpha += (g - 0.5) * uGrainIntensity;
  }
  alpha = clamp(alpha, 0.0, 1.0);
  fragColor = vec4(col * alpha, alpha);
}
`

type WaveContext = { renderer: Renderer; program: Program; mesh: Mesh; setActive: (active: boolean) => void }
const ctxMap = new WeakMap<HTMLElement, WaveContext>()

export default function GradientWaves({
  active = true,
  horizonColor = '#5227FF', waveColor = '#FF9FFC', crestColor = '#FFFFFF', speed = 0.4,
  amplitude = 2.5, waveScale = 0.6, waveRatio = 0.9, swell = 35, turbulence = 20,
  tilt = 1.11, zoom = 1, height = 5.5, fogDepth = 15, detail = 'medium', brightness = 1,
  opacity = 1, mouseInteraction = true, parallaxStrength = 0.5,
  fieldInteraction = false, fieldStrength = 0.7, grain = true,
  interactionColor = '#F0B84F', spotRadius = 1.25,
  scanDuration = 1.9, scanRadius = 19,
  grainIntensity = 0.05, maxFps = 45, className = '',
}: GradientWavesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const enableMouseRef = useRef(mouseInteraction)
  const enableFieldRef = useRef(fieldInteraction)
  const activeRef = useRef(active)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const deviceProfile = navigator as Navigator & { deviceMemory?: number }
    const constrainedDevice = (navigator.hardwareConcurrency || 8) <= 4 || (deviceProfile.deviceMemory ?? 8) <= 4
    const pixelBudget = constrainedDevice ? 1_100_000 : 1_800_000
    const budgetDpr = Math.sqrt(pixelBudget / Math.max(1, window.innerWidth * window.innerHeight))
    const renderDpr = Math.max(0.5, Math.min(window.devicePixelRatio || 1, constrainedDevice ? 1 : 1.25, budgetDpr))
    const targetFps = Math.max(24, Math.min(maxFps, constrainedDevice ? 30 : 45))
    const frameInterval = 1000 / targetFps
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const renderer = new Renderer({ webgl: 2, alpha: true, premultipliedAlpha: true, antialias: false, dpr: renderDpr })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    const canvas = gl.canvas as HTMLCanvasElement
    container.appendChild(canvas)

    const geometry = new Triangle(gl)
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 }, iResolution: { value: new Float32Array([1, 1]) },
        uSpeed: { value: 0.4 }, uAmplitude: { value: 2.5 }, uWaveScale: { value: 0.6 },
        uWaveRatio: { value: 0.9 }, uSwell: { value: 35 }, uTurbulence: { value: 20 },
        uTilt: { value: 1.11 }, uZoom: { value: 1 }, uHeight: { value: 5.5 },
        uFogDepth: { value: 15 }, uSteps: { value: 70 }, uBrightness: { value: 1 },
        uOpacity: { value: 1 }, uGrain: { value: 1 }, uGrainIntensity: { value: 0.05 },
        uMouse: { value: new Float32Array([0.5, 0.5]) }, uParallax: { value: 0.5 },
        uEnableMouse: { value: true }, uFieldEnabled: { value: false },
        uFieldStrength: { value: 0.7 }, uMouseActivity: { value: 0 },
        uSpotRadius: { value: 1.25 },
        uPulseMouse: { value: new Float32Array([0.5, 0.5]) },
        uPulseAge: { value: 999 }, uPulseActive: { value: 0 },
        uPulseSurfaceTime: { value: 0 },
        uPulseDuration: { value: 1.9 }, uPulseRadius: { value: 19 },
        uHorizonColor: { value: new Float32Array([1, 1, 1]) },
        uWaveColor: { value: new Float32Array([1, 1, 1]) }, uCrestColor: { value: new Float32Array([1, 1, 1]) },
        uInteractionColor: { value: new Float32Array([1, 1, 1]) },
      },
    })
    const mesh = new Mesh(gl, { geometry, program })
    const setSize = () => {
      // clientWidth/clientHeight are layout-space dimensions and are not
      // affected by the opening animation's transform. getBoundingClientRect
      // previously captured the temporary 1.035 scale and left the WebGL
      // canvas permanently larger than its clipped container.
      const width = Math.max(1, container.clientWidth)
      const height = Math.max(1, container.clientHeight)
      renderer.setSize(width, height)
      // OGL writes pixel dimensions inline. Let the canvas always occupy the
      // exact container box even between resize callbacks.
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      const resolution = program.uniforms.iResolution.value as Float32Array
      resolution[0] = gl.drawingBufferWidth
      resolution[1] = gl.drawingBufferHeight
      renderer.render({ scene: mesh })
    }
    const resizeObserver = new ResizeObserver(setSize)
    resizeObserver.observe(container)
    setSize()

    const currentMouse = [0.5, 0.5]
    const targetMouse = [0.5, 0.5]
    const mouseVelocity = [0, 0]
    let currentActivity = 0
    let targetActivity = 0
    let pulseStartedAt = Number.NEGATIVE_INFINITY
    let renderActive = activeRef.current && !reducedMotion
    const readPointer = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      return [
        Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(1, rect.width))),
        1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / Math.max(1, rect.height))),
      ]
    }
    const onPointerMove = (event: PointerEvent) => {
      if (!renderActive || (!enableMouseRef.current && !enableFieldRef.current)) return
      const pointer = readPointer(event)
      targetMouse[0] = pointer[0]
      targetMouse[1] = pointer[1]
      // Keep the surface intersection visually locked to the pointer. Inertia
      // remains available only when camera parallax is explicitly enabled.
      if (!enableMouseRef.current) {
        currentMouse[0] = pointer[0]
        currentMouse[1] = pointer[1]
        mouseVelocity[0] = 0
        mouseVelocity[1] = 0
      }
      targetActivity = 1
    }
    const onPointerLeave = () => { targetActivity = 0 }
    const onPointerDown = (event: PointerEvent) => {
      if (!renderActive || !enableFieldRef.current || event.button !== 0) return
      const pointer = readPointer(event)
      const pulseMouse = program.uniforms.uPulseMouse.value as Float32Array
      pulseMouse[0] = pointer[0]
      pulseMouse[1] = pointer[1]
      targetMouse[0] = pointer[0]
      targetMouse[1] = pointer[1]
      currentMouse[0] = pointer[0]
      currentMouse[1] = pointer[1]
      targetActivity = 1
      program.uniforms.uPulseSurfaceTime.value = Number(program.uniforms.iTime.value)
      pulseStartedAt = performance.now()
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    document.documentElement.addEventListener('mouseleave', onPointerLeave)
    window.addEventListener('blur', onPointerLeave)

    let frame = 0
    let isVisible = true
    let isPageVisible = !document.hidden
    let lastRenderAt = 0
    const startedAt = performance.now()
    const loop = (time: number) => {
      frame = 0
      if (!renderActive || !isVisible || !isPageVisible) return
      frame = requestAnimationFrame(loop)
      if (time - lastRenderAt < frameInterval) return
      lastRenderAt = time - ((time - lastRenderAt) % frameInterval)
      program.uniforms.iTime.value = (time - startedAt) * 0.001
      const interactionEnabled = enableMouseRef.current || enableFieldRef.current
      const targetX = interactionEnabled ? targetMouse[0] : 0.5
      const targetY = interactionEnabled ? targetMouse[1] : 0.5
      for (let index = 0; index < 2; index += 1) {
        const target = index === 0 ? targetX : targetY
        mouseVelocity[index] += (target - currentMouse[index]) * 0.032
        mouseVelocity[index] *= 0.82
        currentMouse[index] += mouseVelocity[index]
      }
      currentActivity += (targetActivity - currentActivity) * 0.065
      const mouse = program.uniforms.uMouse.value as Float32Array
      mouse[0] = currentMouse[0]
      mouse[1] = currentMouse[1]
      program.uniforms.uMouseActivity.value = currentActivity
      const pulseDuration = Number(program.uniforms.uPulseDuration.value)
      const pulseAge = Number.isFinite(pulseStartedAt)
        ? (time - pulseStartedAt) * 0.001
        : pulseDuration + 1
      program.uniforms.uPulseAge.value = pulseAge
      program.uniforms.uPulseActive.value = pulseAge >= 0 && pulseAge <= pulseDuration ? 1 : 0
      renderer.render({ scene: mesh })
    }
    const tryStart = () => { if (renderActive && isVisible && isPageVisible && frame === 0) frame = requestAnimationFrame(loop) }
    const tryStop = () => { if (frame !== 0) { cancelAnimationFrame(frame); frame = 0 } }
    const setActive = (nextActive: boolean) => {
      renderActive = nextActive && !reducedMotion
      container.dataset.waveState = renderActive ? 'running' : 'paused'
      renderActive ? tryStart() : tryStop()
    }
    ctxMap.set(container, { renderer, program, mesh, setActive })
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      isVisible ? tryStart() : tryStop()
    })
    intersectionObserver.observe(container)
    const onVisibility = () => { isPageVisible = !document.hidden; isPageVisible ? tryStart() : tryStop() }
    document.addEventListener('visibilitychange', onVisibility)
    tryStart()

    return () => {
      tryStop()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      document.documentElement.removeEventListener('mouseleave', onPointerLeave)
      window.removeEventListener('blur', onPointerLeave)
      ctxMap.delete(container)
      canvas.remove()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const context = container ? ctxMap.get(container) : undefined
    if (!context) return
    const uniforms = context.program.uniforms
    activeRef.current = active
    context.setActive(active)
    enableMouseRef.current = mouseInteraction
    enableFieldRef.current = fieldInteraction
    uniforms.uSpeed.value = speed; uniforms.uAmplitude.value = amplitude; uniforms.uWaveScale.value = waveScale
    uniforms.uWaveRatio.value = waveRatio; uniforms.uSwell.value = swell; uniforms.uTurbulence.value = turbulence
    uniforms.uTilt.value = tilt; uniforms.uZoom.value = zoom; uniforms.uHeight.value = height
    uniforms.uFogDepth.value = fogDepth; uniforms.uSteps.value = detailToSteps(detail)
    uniforms.uBrightness.value = brightness; uniforms.uOpacity.value = opacity
    uniforms.uGrain.value = grain ? 1 : 0; uniforms.uGrainIntensity.value = grainIntensity
    uniforms.uParallax.value = parallaxStrength; uniforms.uEnableMouse.value = mouseInteraction
    uniforms.uFieldEnabled.value = fieldInteraction; uniforms.uFieldStrength.value = fieldStrength
    uniforms.uSpotRadius.value = spotRadius
    uniforms.uPulseDuration.value = scanDuration; uniforms.uPulseRadius.value = scanRadius
    const assignColor = (name: 'uHorizonColor' | 'uWaveColor' | 'uCrestColor' | 'uInteractionColor', value: string) => {
      const target = uniforms[name].value as Float32Array
      const rgb = hexToRgb(value)
      target[0] = rgb[0]; target[1] = rgb[1]; target[2] = rgb[2]
    }
    assignColor('uHorizonColor', horizonColor)
    assignColor('uWaveColor', waveColor)
    assignColor('uCrestColor', crestColor)
    assignColor('uInteractionColor', interactionColor)
    if (!active) context.renderer.render({ scene: context.mesh })
  }, [active, horizonColor, waveColor, crestColor, interactionColor, speed, amplitude, waveScale, waveRatio, swell, turbulence, tilt, zoom, height, fogDepth, detail, brightness, opacity, grain, grainIntensity, mouseInteraction, parallaxStrength, fieldInteraction, fieldStrength, spotRadius, scanDuration, scanRadius])

  return <div ref={containerRef} className={`gradient-waves-container ${className}`.trim()} />
}
