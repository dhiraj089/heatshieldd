'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { ArrowRight, RotateCcw, FastForward } from 'lucide-react'

interface IntroAnimationProps {
  onComplete: () => void
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const capRef = useRef<HTMLDivElement | null>(null)
  const flashRef = useRef<HTMLDivElement | null>(null)
  const progRef = useRef<HTMLDivElement | null>(null)
  const [isTitleShown, setIsTitleShown] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)

  const skipToTitleRef = useRef<(() => void) | null>(null)
  const replayRef = useRef<(() => void) | null>(null)

  const handleEnterDashboard = () => {
    setIsFadingOut(true)
    setTimeout(() => {
      onComplete()
    }, 600)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const capEl = capRef.current
    const flashEl = flashRef.current
    const progEl = progRef.current
    if (!canvas) return

    const V = THREE.Vector3

    /* ---------- timeline (seconds) ---------- */
    const T = {
      heat: 6.8, // rays start leaving the sun
      flames: 7.6, // Earth starts to burn
      shield: 10.2, // shield switches on
      title: 11.8, // project name appears
      cameraEnd: 12.4, // camera path finished
    }
    const CAPTIONS: [number, number, string][] = [
      [0.4, 3.6, 'Our Solar System'],
      [3.9, 6.9, 'The Sun'],
      [7.2, 9.9, 'The Heat'],
      [10.1, 11.6, 'Shield Activated'],
    ]
    const SHIELD_COLOR = 0x7dffb4

    /* ---------- helpers ---------- */
    const clamp = (x: number) => Math.max(0, Math.min(1, x))
    const easeInOut = (x: number) => {
      x = clamp(x)
      return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
    }
    const easeOutBack = (x: number) => {
      x = clamp(x)
      const c = 1.7
      return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2)
    }

    function canvasTexture(draw: (g: CanvasRenderingContext2D) => void, w = 512, h = 256) {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      if (ctx) draw(ctx)
      return new THREE.CanvasTexture(c)
    }

    const glowTex = canvasTexture((g) => {
      const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
      r.addColorStop(0, 'rgba(255,255,255,1)')
      r.addColorStop(0.25, 'rgba(255,255,255,.5)')
      r.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = r
      g.fillRect(0, 0, 128, 128)
    }, 128, 128)

    function glowSprite(color: number, size: number, opacity: number) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTex,
          color,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      )
      s.scale.set(size, size, 1)
      return s
    }

    function pointsMaterial(opts: THREE.PointsMaterialParameters) {
      return new THREE.PointsMaterial(
        Object.assign(
          {
            map: glowTex,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          },
          opts
        )
      )
    }

    /* ---------- renderer, scene, camera ---------- */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight, false)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05060a)
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2500)

    function resize() {
      if (!canvas) return
      renderer.setSize(window.innerWidth, window.innerHeight, false)
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', resize)

    /* ---------- stars ---------- */
    const STARS = 2500
    const starPos = new Float32Array(STARS * 3)
    for (let i = 0; i < STARS; i++) {
      const y = Math.random() * 2 - 1
      const a = Math.random() * Math.PI * 2
      const r = Math.sqrt(1 - y * y)
      starPos.set([600 * r * Math.cos(a), 600 * y, 600 * r * Math.sin(a)], i * 3)
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    scene.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({
          color: 0xffffff,
          size: 1.5,
          sizeAttenuation: false,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        })
      )
    )

    const space = new THREE.Group()
    scene.add(space)

    /* ---------- sun ---------- */
    const sunGroup = new THREE.Group()
    space.add(sunGroup)
    const sunMat = new THREE.MeshBasicMaterial({
      map: canvasTexture((g) => {
        g.fillStyle = '#ffc21f'
        g.fillRect(0, 0, 512, 256)
        for (let k = 0; k < 700; k++) {
          g.fillStyle = k % 2 ? 'rgba(255,245,150,.25)' : 'rgba(220,120,0,.25)'
          g.beginPath()
          g.arc(Math.random() * 512, Math.random() * 256, 6 + Math.random() * 34, 0, 7)
          g.fill()
        }
      }),
    })
    const sun = new THREE.Mesh(new THREE.SphereGeometry(8, 48, 48), sunMat)
    const glowInner = glowSprite(0xffc21f, 44, 0.7)
    const glowOuter = glowSprite(0xffa000, 80, 0.35)
    sunGroup.add(sun, glowInner, glowOuter, new THREE.PointLight(0xffd080, 1.7, 0))

    scene.add(new THREE.AmbientLight(0x6a5a50, 0.55))
    const fill = new THREE.DirectionalLight(0xffffff, 0.45)
    fill.position.set(5, 10, 20)
    scene.add(fill)

    /* ---------- planets: [orbit radius, size, color, speed, start angle] ---------- */
    const earthTex = canvasTexture((g) => {
      g.fillStyle = '#1f64c0'
      g.fillRect(0, 0, 512, 256)
      for (let k = 0; k < 90; k++) {
        g.fillStyle = k % 3 ? '#2f8f45' : '#3aa557'
        g.beginPath()
        g.arc(Math.random() * 512, 40 + Math.random() * 176, 6 + Math.random() * 26, 0, 7)
        g.fill()
      }
      for (let k = 0; k < 70; k++) {
        g.fillStyle = 'rgba(255,255,255,.35)'
        g.beginPath()
        g.ellipse(Math.random() * 512, Math.random() * 256, 10 + Math.random() * 30, 3 + Math.random() * 6, 0, 0, 7)
        g.fill()
      }
    })
    const jupiterTex = canvasTexture((g) => {
      for (let y = 0; y < 256; y += 16) {
        g.fillStyle = (y / 16) % 2 ? '#c9a27a' : '#e2c7a0'
        g.fillRect(0, y, 512, 16)
      }
    })
    const PLANETS: [number, number, number, number, number][] = [
      [14, 0.8, 0xb8ad9f, 0.55, 0.5], // Mercury
      [20, 1.4, 0xe8c48c, 0.42, 2.2], // Venus
      [28, 3.2, 0xffffff, 0.3, -1.1], // Earth
      [36, 1.2, 0xc8501f, 0.24, 4], // Mars
      [48, 4.2, 0xffffff, 0.14, 5.5], // Jupiter
      [62, 3.5, 0xe6d29e, 0.1, 1.3], // Saturn
      [74, 2.4, 0xa6e6ea, 0.07, 3.4], // Uranus
      [85, 2.3, 0x4468e0, 0.05, 0.2], // Neptune
    ]
    const EARTH = 2
    const EARTH_STOP = 6
    const OTHERS_STOP = 9
    const planetMeshes = PLANETS.map((d, i) => {
      const mat = new THREE.MeshStandardMaterial({ color: d[2], roughness: 0.9 })
      if (i === EARTH) mat.map = earthTex
      if (i === 4) mat.map = jupiterTex
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(d[1], 40, 40), mat)
      space.add(mesh)
      const orbit: THREE.Vector3[] = []
      for (let k = 0; k <= 128; k++) {
        const a = (k / 128) * Math.PI * 2
        orbit.push(new V(d[0] * Math.cos(a), 0, d[0] * Math.sin(a)))
      }
      space.add(
        new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(orbit),
          new THREE.LineBasicMaterial({ color: 0x7a6f62, transparent: true, opacity: 0.35 })
        )
      )
      return mesh
    })
    const saturnRing = new THREE.Mesh(
      new THREE.RingGeometry(4.6, 7.4, 64),
      new THREE.MeshBasicMaterial({ color: 0xcdb98a, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    )
    saturnRing.rotation.x = Math.PI / 2.3
    planetMeshes[5].add(saturnRing)

    const earth = planetMeshes[EARTH]
    const earthGlow = glowSprite(0xff4a1a, 18, 0) // red heat glow
    earth.add(earthGlow, glowSprite(0x5fa8ff, 10, 0.35)) // blue atmosphere

    // Earth's final position (it stops orbiting at EARTH_STOP)
    const earthAngle = PLANETS[EARTH][4] + PLANETS[EARTH][3] * EARTH_STOP
    const earthPos = new V(28 * Math.cos(earthAngle), 0, 28 * Math.sin(earthAngle))
    const toEarth = earthPos.clone().normalize()
    const sideDir = new V(-toEarth.z, 0, toEarth.x)
    const midpoint = earthPos.clone().multiplyScalar(0.5)

    /* ---------- sun rays (60% aimed at Earth, 40% in all directions) ---------- */
    const RAYS = 1100
    const rayDir: THREE.Vector3[] = []
    const rayLen = new Float32Array(RAYS)
    const rayT = new Float32Array(RAYS)
    const raySpeed = new Float32Array(RAYS)
    const rayPos = new Float32Array(RAYS * 3)
    for (let i = 0; i < RAYS; i++) {
      const v = new V()
      if (i % 10 < 6) {
        v.copy(earthPos).add(new V(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(5))
        rayLen[i] = v.length()
      } else {
        v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        rayLen[i] = 70 + Math.random() * 30
      }
      rayDir.push(v.normalize())
      rayT[i] = Math.random()
      raySpeed[i] = 0.25 + Math.random() * 0.35
    }
    const rayGeo = new THREE.BufferGeometry()
    rayGeo.setAttribute('position', new THREE.BufferAttribute(rayPos, 3))
    const rays = new THREE.Points(rayGeo, pointsMaterial({ size: 1.5, color: 0xffa840 }))
    space.add(rays)

    /* ---------- flames on the sun-facing side of Earth ---------- */
    const FLAMES = 300
    const flameDir: THREE.Vector3[] = []
    const flameT = new Float32Array(FLAMES)
    const flameSpeed = new Float32Array(FLAMES)
    const flamePos = new Float32Array(FLAMES * 3)
    for (let i = 0; i < FLAMES; i++) {
      const v = new V()
      do {
        v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
      } while (v.dot(toEarth) > -0.2)
      flameDir.push(v)
      flameT[i] = Math.random()
      flameSpeed[i] = 0.5 + Math.random() * 0.9
    }
    const flameGeo = new THREE.BufferGeometry()
    flameGeo.setAttribute('position', new THREE.BufferAttribute(flamePos, 3))
    const flames = new THREE.Points(flameGeo, pointsMaterial({ size: 1.7, color: 0xff6a1a }))
    space.add(flames)

    /* ---------- 3D shield around Earth ---------- */
    const shieldMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uAlpha: { value: 0 },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(SHIELD_COLOR) },
        uSun: { value: toEarth.clone().negate() },
      },
      vertexShader: `
        varying vec3 vN, vV, vP;
        void main(){
          vN = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.);
          vV = -mv.xyz; vP = position;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying vec3 vN, vV, vP;
        uniform float uAlpha, uTime; uniform vec3 uColor, uSun;
        void main(){
          float rim = pow(1. - abs(dot(normalize(vN), normalize(vV))), 2.2);
          vec3 p = normalize(vP);
          float lon = atan(p.z, p.x), lat = asin(clamp(p.y, -1., 1.));
          float grid = max(smoothstep(.94, 1., abs(sin(lon * 9.))), smoothstep(.94, 1., abs(sin(lat * 9. + uTime * .6))));
          float dd = acos(clamp(dot(p, uSun), -1., 1.)); float rip = pow(max(0., sin(dd * 14. - uTime * 6.)), 6.) * exp(-dd * 1.6);
          float k = rim * 1.2 + grid * .55 + .1 + rip * .9;
          gl_FragColor = vec4(uColor * k, uAlpha * clamp(k, 0., 1.));
        }`,
    })
    const shield = new THREE.Mesh(new THREE.SphereGeometry(5.2, 48, 32), shieldMat)
    const shockwave = new THREE.Mesh(
      new THREE.SphereGeometry(5.2, 32, 24),
      new THREE.MeshBasicMaterial({
        color: SHIELD_COLOR,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    const shieldRing = new THREE.Mesh(
      new THREE.TorusGeometry(6.6, 0.05, 16, 160),
      new THREE.MeshBasicMaterial({ color: SHIELD_COLOR, transparent: true, opacity: 0 })
    )
    ;[shield, shockwave, shieldRing].forEach((m) => {
      m.position.copy(earthPos)
      space.add(m)
    })

    /* ---------- extra animation objects ---------- */
    const randDir = (cond?: (v: THREE.Vector3) => boolean) => {
      const v = new V()
      do {
        v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
      } while (cond && !cond(v))
      return v
    }

    // drifting nebula glows
    const nebB: [number, number, number][] = [
      [-260, 60, -300],
      [280, -40, -260],
      [0, 160, -380],
      [-200, -120, 260],
      [220, 100, 280],
    ]
    const nebs = [0x5a2a8a, 0x1f4a8a, 0x8a2a3a, 0x2a6a6a, 0x6a3a8a].map((c, i) => {
      const n = glowSprite(c, 420, 0.2)
      n.position.set(...nebB[i])
      scene.add(n)
      return n
    })

    // shooting stars
    const COM = 8
    const comPos = new Float32Array(COM * 6)
    interface CometData {
      p: THREE.Vector3
      v: THREE.Vector3
      l: number
      max: number
      delay: number
    }
    const comD: CometData[] = []
    const comGeo = new THREE.BufferGeometry()
    comGeo.setAttribute('position', new THREE.BufferAttribute(comPos, 3))
    const comets = new THREE.LineSegments(
      comGeo,
      new THREE.LineBasicMaterial({
        color: 0xcfe8ff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      })
    )
    comets.frustumCulled = false
    scene.add(comets)

    function spawnComet(c: Partial<CometData>) {
      const a = Math.random() * 6.28
      const r = 240 + Math.random() * 80
      c.p = new V(r * Math.cos(a), (Math.random() - 0.5) * 160, r * Math.sin(a))
      c.v = new V(
        -Math.cos(a) + (Math.random() - 0.5),
        (Math.random() - 0.5) * 0.6,
        -Math.sin(a) + (Math.random() - 0.5)
      )
        .normalize()
        .multiplyScalar(120 + Math.random() * 80)
      c.l = 0
      c.max = 1.4 + Math.random() * 1.4
      c.delay = Math.random() * 4
    }
    for (let i = 0; i < COM; i++) {
      const c: Partial<CometData> = {}
      spawnComet(c)
      c.delay = Math.random() * 3
      comD.push(c as CometData)
    }

    // asteroid belt (between Mars and Jupiter)
    const BELT = 700
    const beltPos = new Float32Array(BELT * 3)
    for (let i = 0; i < BELT; i++) {
      const a = Math.random() * 6.283
      const r = 40.5 + Math.random() * 4.5
      beltPos.set([r * Math.cos(a), (Math.random() - 0.5) * 1.6, r * Math.sin(a)], i * 3)
    }
    const beltGeo = new THREE.BufferGeometry()
    beltGeo.setAttribute('position', new THREE.BufferAttribute(beltPos, 3))
    const belt = new THREE.Points(
      beltGeo,
      new THREE.PointsMaterial({
        map: glowTex,
        color: 0xb8a995,
        size: 0.8,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      })
    )
    space.add(belt)

    // moon
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xc4c4c4, roughness: 1 })
    )
    space.add(moon)

    // solar prominences
    const PRO = 240
    const proDir: THREE.Vector3[] = []
    const proT = new Float32Array(PRO)
    const proS = new Float32Array(PRO)
    const proPos = new Float32Array(PRO * 3)
    for (let i = 0; i < PRO; i++) {
      proDir.push(randDir())
      proT[i] = Math.random()
      proS[i] = 0.3 + Math.random() * 0.5
    }
    const proGeo = new THREE.BufferGeometry()
    proGeo.setAttribute('position', new THREE.BufferAttribute(proPos, 3))
    const pro = new THREE.Points(proGeo, pointsMaterial({ size: 1.6, color: 0xffd060 }))
    space.add(pro)

    const sunWave = new THREE.Mesh(
      new THREE.SphereGeometry(8.2, 32, 24),
      new THREE.MeshBasicMaterial({
        color: 0xff7a2a,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      })
    )
    space.add(sunWave)

    // heat rings around burning Earth
    const heatRings = [0, 1, 2].map(() => {
      const r = new THREE.Mesh(
        new THREE.TorusGeometry(4.2, 0.05, 8, 96),
        new THREE.MeshBasicMaterial({
          color: 0xff5a1a,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      )
      space.add(r)
      return r
    })

    // shield impact sparks (sun-facing side)
    const SPK = 180
    const spkDir: THREE.Vector3[] = []
    const spkT = new Float32Array(SPK)
    const spkS = new Float32Array(SPK)
    const spkPos = new Float32Array(SPK * 3)
    for (let i = 0; i < SPK; i++) {
      spkDir.push(randDir((v) => v.dot(toEarth) < -0.35))
      spkT[i] = Math.random()
      spkS[i] = 1 + Math.random() * 1.6
    }
    const spkGeo = new THREE.BufferGeometry()
    spkGeo.setAttribute('position', new THREE.BufferAttribute(spkPos, 3))
    const spk = new THREE.Points(spkGeo, pointsMaterial({ size: 1.3, color: 0xb4ffd8 }))
    space.add(spk)

    // shield activation burst
    const BUR = 320
    const burDir: THREE.Vector3[] = []
    const burS = new Float32Array(BUR)
    const burPos = new Float32Array(BUR * 3)
    for (let i = 0; i < BUR; i++) {
      burDir.push(randDir())
      burS[i] = 3 + Math.random() * 7
    }
    const burGeo = new THREE.BufferGeometry()
    burGeo.setAttribute('position', new THREE.BufferAttribute(burPos, 3))
    const bur = new THREE.Points(burGeo, pointsMaterial({ size: 1.8, color: SHIELD_COLOR }))
    space.add(bur)
    const coolGlow = glowSprite(SHIELD_COLOR, 16, 0)
    earth.add(coolGlow)

    /* ---------- 3D upgrade: panels, gyro rings, satellites, atmosphere, clouds, dust ---------- */
    const panelGeo = new THREE.IcosahedronGeometry(5.5, 2)
    const posCount = panelGeo.attributes.position.count
    const nF = Math.floor(posCount / 3)
    const rnd = new Float32Array(posCount)
    for (let f = 0; f < nF; f++) {
      const r = Math.random()
      rnd[f * 3] = r
      rnd[f * 3 + 1] = r
      rnd[f * 3 + 2] = r
    }
    panelGeo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1))

    const panelMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uAlpha: { value: 0 },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(SHIELD_COLOR) },
      },
      vertexShader:
        'attribute float aRand; varying float vR; void main(){ vR = aRand; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader:
        'varying float vR; uniform float uAlpha, uTime; uniform vec3 uColor; void main(){ float f = pow(max(0., sin(uTime * 2.2 + vR * 40.)), 10.); gl_FragColor = vec4(uColor, uAlpha * (.04 + f * .5)); }',
    })
    const panels = new THREE.Mesh(panelGeo, panelMat)
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(panelGeo),
      new THREE.LineBasicMaterial({
        color: 0x9dffcc,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    ;[panels, wire].forEach((m) => {
      m.position.copy(earthPos)
      space.add(m)
    })

    const gyro = [
      [7.6, 1.1, 0.045],
      [8.4, 0.5, 0.04],
      [9.2, 1.9, 0.035],
    ].map((d, i) => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(d[0], d[2], 8, 160),
        new THREE.MeshBasicMaterial({
          color: i ? 0x62d4ff : SHIELD_COLOR,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      )
      m.userData.tilt = d[1]
      m.position.copy(earthPos)
      space.add(m)
      return m
    })

    const SAT = 6
    const sats: THREE.Mesh[] = []
    const satPos = new Float32Array(SAT * 6)
    const satGeo = new THREE.BufferGeometry()
    satGeo.setAttribute('position', new THREE.BufferAttribute(satPos, 3))
    const satBeam = new THREE.LineSegments(
      satGeo,
      new THREE.LineBasicMaterial({
        color: 0xb4ffd8,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    satBeam.frustumCulled = false
    space.add(satBeam)

    for (let i = 0; i < SAT; i++) {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), new THREE.MeshBasicMaterial({ color: 0xb4ffd8 }))
      m.add(glowSprite(SHIELD_COLOR, 3.6, 0.8))
      m.scale.setScalar(0)
      space.add(m)
      sats.push(m)
    }

    const atmoMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      uniforms: { uC: { value: new THREE.Color(0x5fa8ff) } },
      vertexShader:
        'varying vec3 vN, vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }',
      fragmentShader:
        'varying vec3 vN, vV; uniform vec3 uC; void main(){ float f = pow(max(0., .75 - abs(dot(normalize(vN), normalize(vV)))), 3.); gl_FragColor = vec4(uC, clamp(f * 3., 0., 1.)); }',
    })
    earth.add(new THREE.Mesh(new THREE.SphereGeometry(3.6, 48, 32), atmoMat))

    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(3.27, 40, 40),
      new THREE.MeshStandardMaterial({
        transparent: true,
        depthWrite: false,
        roughness: 1,
        map: canvasTexture((g) => {
          for (let k = 0; k < 140; k++) {
            g.fillStyle = 'rgba(255,255,255,.5)'
            g.beginPath()
            g.ellipse(
              Math.random() * 512,
              Math.random() * 256,
              8 + Math.random() * 30,
              3 + Math.random() * 7,
              0,
              0,
              7
            )
            g.fill()
          }
        }),
      })
    )
    earth.add(clouds)

    const DUST = 600
    const dustPos = new Float32Array(DUST * 3)
    for (let i = 0; i < DUST; i++) {
      dustPos.set(randDir().multiplyScalar(15 + Math.random() * 100).toArray(), i * 3)
    }
    const dustGeo = new THREE.BufferGeometry()
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        map: glowTex,
        color: 0xffe9c8,
        size: 0.9,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
    space.add(dust)

    let mx = 0
    let my = 0
    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX / window.innerWidth - 0.5
      my = e.clientY / window.innerHeight - 0.5
    }
    window.addEventListener('mousemove', onMouseMove)

    /* ---------- camera path ---------- */
    const camPath = new THREE.CatmullRomCurve3([
      new V(0, 95, 150), // wide: whole solar system
      new V(35, 50, 95),
      new V(6, 3, 24), // close to the sun
      midpoint.clone().add(sideDir.clone().multiplyScalar(36)).add(new V(0, 12, 0)), // sun and Earth side by side
      earthPos.clone().sub(toEarth.clone().multiplyScalar(12)).add(sideDir.clone().multiplyScalar(7)).add(new V(0, 3, 0)),
      earthPos.clone().sub(toEarth.clone().multiplyScalar(16)).add(sideDir.clone().multiplyScalar(9)).add(new V(0, 3.5, 0)),
    ])
    const lookPath = new THREE.CatmullRomCurve3([
      new V(0, 0, 0),
      new V(0, 0, 0),
      new V(0, 0, 0),
      midpoint.clone(),
      earthPos.clone(),
      earthPos.clone(),
    ])

    let t0 = 0
    let lastNow = 0
    let lastCaption = ''
    let titleShown = false
    let animId = 0

    skipToTitleRef.current = () => {
      t0 = performance.now() - (T.title + 0.3) * 1000
    }

    replayRef.current = () => {
      t0 = performance.now()
      lastNow = t0
      titleShown = false
      setIsTitleShown(false)
      if (capEl) capEl.textContent = ''
      for (let i = 0; i < RAYS; i++) rayT[i] = Math.random()
    }

    // Render the initial 3D scene immediately
    renderer.render(scene, camera)

    function frame(now: number) {
      if (t0 === 0) {
        t0 = now
        lastNow = now
      }

      const t = (now - t0) / 1000
      const dt = Math.min(0.05, (now - lastNow) / 1000)
      lastNow = now

      // planets
      planetMeshes.forEach((m, i) => {
        const d = PLANETS[i]
        const a = d[4] + d[3] * Math.min(t, i === EARTH ? EARTH_STOP : OTHERS_STOP)
        m.position.set(d[0] * Math.cos(a), 0, d[0] * Math.sin(a))
        m.rotation.y += dt * (i === EARTH ? 0.5 : 0.3)
      })

      // sun heats up (yellow -> red)
      const heat = clamp((t - T.heat) / 2.4)
      sunGroup.scale.setScalar(1 + 0.04 * Math.sin(t * 6) * heat)
      sun.rotation.y = t * 0.2
      const fade = 1 - heat * 0.5
      sunMat.color.setRGB(1, fade * 0.7, fade * 0.55)
      glowInner.material.color.setRGB(1, 0.76 - 0.55 * heat, 0.12)
      glowOuter.material.color.setRGB(1, 0.63 - 0.5 * heat, 0.05)

      // shield progress 0..1
      const sk = easeInOut((t - T.shield) / 1.3)

      // rays: aimed rays stop at the shield once it is up
      rays.material.opacity = clamp((t - T.heat) / 1)
      for (let i = 0; i < RAYS; i++) {
        rayT[i] += raySpeed[i] * dt
        if (rayT[i] > 1) rayT[i] = 0
        const end = i % 10 < 6 ? rayLen[i] - 5.6 * sk : rayLen[i]
        const dist = 8.5 + rayT[i] * (end - 8.5)
        rayPos[i * 3] = rayDir[i].x * dist
        rayPos[i * 3 + 1] = rayDir[i].y * dist
        rayPos[i * 3 + 2] = rayDir[i].z * dist
      }
      rayGeo.attributes.position.needsUpdate = true

      // Earth burns, then cools when the shield is up
      const burn = clamp((t - T.flames) / 2) * (1 - sk)
      earth.material.emissive.setRGB(0.8 * burn, 0.1 * burn + 0.1 * sk, 0.05 * sk)
      earth.material.color.setRGB(1, 1 - 0.45 * burn, 1 - 0.6 * burn)
      earthGlow.material.opacity = burn * 0.8
      for (let i = 0; i < FLAMES; i++) {
        flameT[i] += dt * flameSpeed[i]
        if (flameT[i] > 1) flameT[i] = 0
        const r = 3.15 + flameT[i] * 2.4
        flamePos[i * 3] = earthPos.x + flameDir[i].x * r
        flamePos[i * 3 + 1] = earthPos.y + flameDir[i].y * r + flameT[i] * 0.8
        flamePos[i * 3 + 2] = earthPos.z + flameDir[i].z * r
      }
      flameGeo.attributes.position.needsUpdate = true
      flames.material.opacity = burn * 0.9

      // shield
      shieldMat.uniforms.uAlpha.value = sk
      shieldMat.uniforms.uTime.value = t
      shield.scale.setScalar(0.55 + 0.45 * easeOutBack((t - T.shield) / 1.3))
      const wave = clamp((t - T.shield) / 1.6)
      shockwave.scale.setScalar(1 + wave * 1.1)
      shockwave.material.opacity = wave > 0 ? (1 - wave) * 0.55 : 0
      shieldRing.rotation.set(1.15, 0, t * 0.5)
      shieldRing.material.opacity = sk * 0.8

      // ---- extra animation ----
      nebs.forEach((n, i) =>
        n.position.set(
          nebB[i][0] + Math.sin(t * 0.1 + i) * 20,
          nebB[i][1] + Math.cos(t * 0.13 + i) * 14,
          nebB[i][2]
        )
      )
      comD.forEach((c, i) => {
        c.delay -= dt
        const k = i * 6
        if (c.delay > 0) {
          for (let j = 0; j < 6; j++) comPos[k + j] = 9999
          return
        }
        c.p.addScaledVector(c.v, dt)
        c.l += dt
        comPos[k] = c.p.x
        comPos[k + 1] = c.p.y
        comPos[k + 2] = c.p.z
        comPos[k + 3] = c.p.x - c.v.x * 0.12
        comPos[k + 4] = c.p.y - c.v.y * 0.12
        comPos[k + 5] = c.p.z - c.v.z * 0.12
        if (c.l > c.max) spawnComet(c)
      })
      comGeo.attributes.position.needsUpdate = true
      belt.rotation.y += dt * 0.04

      const mt = t * 1.3
      moon.position.set(
        earth.position.x + 9 * Math.cos(mt),
        earth.position.y + 1.5 * Math.sin(mt * 0.5),
        earth.position.z + 9 * Math.sin(mt)
      )

      for (let i = 0; i < PRO; i++) {
        proT[i] += dt * proS[i]
        if (proT[i] > 1) proT[i] = 0
        const r = 8 + Math.sin(proT[i] * Math.PI) * (2.5 + heat * 5)
        proPos[i * 3] = proDir[i].x * r
        proPos[i * 3 + 1] = proDir[i].y * r
        proPos[i * 3 + 2] = proDir[i].z * r
      }
      proGeo.attributes.position.needsUpdate = true
      pro.material.opacity = 0.25 + heat * 0.65

      const sw = t > T.heat && t < T.shield ? ((t - T.heat) % 1.4) / 1.4 : 0
      sunWave.scale.setScalar(1 + sw * 6)
      sunWave.material.opacity = sw > 0 ? (1 - sw) * 0.45 : 0
      glowOuter.scale.setScalar(80 + 5 * Math.sin(t * 2.2) * (1 + heat))

      heatRings.forEach((r, k) => {
        const ph = (t * 0.7 + k / 3) % 1
        r.position.copy(earth.position)
        r.scale.setScalar(0.9 + ph * 1.5)
        r.material.opacity = burn * (1 - ph) * 0.6
        r.lookAt(camera.position)
      })

      for (let i = 0; i < SPK; i++) {
        spkT[i] += dt * spkS[i]
        if (spkT[i] > 1) spkT[i] = 0
        const r = 5.5 + spkT[i] * 2.4
        spkPos[i * 3] = earth.position.x + spkDir[i].x * r
        spkPos[i * 3 + 1] = earth.position.y + spkDir[i].y * r
        spkPos[i * 3 + 2] = earth.position.z + spkDir[i].z * r
      }
      spkGeo.attributes.position.needsUpdate = true
      spk.material.opacity = sk * 0.85

      const bt = Math.max(0, t - T.shield)
      for (let i = 0; i < BUR; i++) {
        const r = 4 + bt * burS[i]
        burPos[i * 3] = earth.position.x + burDir[i].x * r
        burPos[i * 3 + 1] = earth.position.y + burDir[i].y * r
        burPos[i * 3 + 2] = earth.position.z + burDir[i].z * r
      }
      burGeo.attributes.position.needsUpdate = true
      bur.material.opacity = bt > 0 ? clamp(1 - bt / 2.2) : 0
      coolGlow.material.opacity = sk * 0.5

      if (flashEl) flashEl.style.opacity = bt > 0 ? String(Math.max(0, 0.55 - bt * 1.1)) : '0'
      if (progEl) progEl.style.width = clamp(t / (T.title + 1)) * 100 + '%'

      // ---- 3D upgrade ----
      const ps = 0.55 + 0.45 * easeOutBack((t - T.shield) / 1.3)
      panelMat.uniforms.uAlpha.value = sk
      panelMat.uniforms.uTime.value = t
      panels.scale.setScalar(ps)
      wire.scale.setScalar(ps)
      panels.rotation.y = wire.rotation.y = t * 0.12
      wire.material.opacity = sk * 0.35

      gyro.forEach((g, i) => {
        g.rotation.set(
          g.userData.tilt + Math.sin(t * 0.5 + i) * 0.3,
          t * (0.4 + i * 0.25) * (i % 2 ? -1 : 1),
          t * 0.2
        )
        g.material.opacity = sk * 0.7
        g.scale.setScalar(0.5 + 0.5 * sk)
      })

      sats.forEach((m, i) => {
        const a = t * 0.6 + i * 1.047
        const k = i * 6
        m.position.set(
          earthPos.x + 7.2 * Math.cos(a),
          earthPos.y + Math.sin(a * 1.3 + i) * 2.6,
          earthPos.z + 7.2 * Math.sin(a)
        )
        m.rotation.y = t * 2
        m.scale.setScalar(sk)
        const e = m.position.clone().sub(earthPos).normalize().multiplyScalar(5.3).add(earthPos)
        satPos[k] = m.position.x
        satPos[k + 1] = m.position.y
        satPos[k + 2] = m.position.z
        satPos[k + 3] = e.x
        satPos[k + 4] = e.y
        satPos[k + 5] = e.z
      })
      satGeo.attributes.position.needsUpdate = true
      satBeam.material.opacity = sk * 0.5 * (0.7 + 0.3 * Math.sin(t * 9))

      atmoMat.uniforms.uC.value.setRGB(
        Math.min(1, 0.37 + 0.63 * burn),
        Math.min(1, 0.66 - 0.4 * burn + 0.3 * sk),
        Math.max(0, 1 - 0.8 * burn - 0.2 * sk)
      )
      clouds.rotation.y += dt * 0.2
      dust.rotation.y += dt * 0.02
      camera.fov = 60 + 12 * (bt > 0 ? Math.exp(-bt * 2.5) : 0)
      camera.updateProjectionMatrix()

      // camera
      const u = clamp(t / T.cameraEnd)
      const shake = clamp((t - 7) / 1) * (1 - clamp((t - 9.9) / 0.5)) * 0.12
      camera.position.copy(camPath.getPoint(u))
      if (t > T.cameraEnd) {
        // slow orbit around Earth + mouse parallax after the intro
        const rel = camera.position
          .clone()
          .sub(earthPos)
          .applyAxisAngle(new V(0, 1, 0), (t - T.cameraEnd) * 0.07)
        camera.position.copy(earthPos).add(rel)
        camera.position.x += mx * 3
        camera.position.y -= my * 2
      }
      camera.position.x += (Math.random() - 0.5) * shake + Math.sin(t * 0.5) * 0.25 * clamp((t - 12) / 1)
      camera.position.y += (Math.random() - 0.5) * shake
      camera.lookAt(lookPath.getPoint(u))

      // captions + title
      let text = ''
      CAPTIONS.forEach((c) => {
        if (t > c[0] && t < c[1]) text = c[2]
      })
      if (capEl) {
        if (text && text !== lastCaption) {
          capEl.textContent = text
          capEl.classList.remove('pop')
          void capEl.offsetWidth
          capEl.classList.add('pop')
        }
        capEl.style.opacity = text ? '1' : '0'
      }
      if (text) lastCaption = text

      if (t > T.title && !titleShown) {
        titleShown = true
        setIsTitleShown(true)
      }

      renderer.render(scene, camera)
      animId = requestAnimationFrame(frame)
    }

    animId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      renderer.dispose()
      scene.clear()
    }
  }, [])

  const LETTER_COLORS = [
    '#ff3d2e',
    '#ff5a1f',
    '#ff8a1f',
    '#ffb020',
    '#d9fbff',
    '#b4f3ff',
    '#8fe8ff',
    '#6bdcff',
    '#8fe8ff',
    '#d9fbff',
  ]

  return (
    <div
      className={`intro-root ${isFadingOut ? 'fade-out' : ''}`}
    >
      <canvas
        ref={canvasRef}
        id="c"
        className="intro-canvas"
      />

      <div
        ref={capRef}
        id="cap"
      />

      <div id="vg" className={isTitleShown ? 'on' : ''} />
      <div ref={flashRef} id="flash" />
      <div ref={progRef} id="prog" />

      {/* Title only rendered when isTitleShown is true (never at start!) */}
      {isTitleShown && (
        <div id="title" className="show">
          <h1 id="name">
            <span className="w w1">
              {'HEAT'.split('').map((ch, i) => (
                <span
                  key={`heat-${i}`}
                  className="l"
                  style={
                    {
                      color: LETTER_COLORS[0 + i],
                      '--g': LETTER_COLORS[0 + i] + 'aa',
                      '--i': i,
                    } as React.CSSProperties
                  }
                >
                  {ch}
                </span>
              ))}
            </span>
            <span className="w w2">
              {'SHIELD'.split('').map((ch, i) => (
                <span
                  key={`shield-${i}`}
                  className="l"
                  style={
                    {
                      color: LETTER_COLORS[4 + i],
                      '--g': LETTER_COLORS[4 + i] + 'aa',
                      '--i': i,
                    } as React.CSSProperties
                  }
                >
                  {ch}
                </span>
              ))}
            </span>
          </h1>
          <div className="line" />
          <p>Optimizing Urban Heat Mitigation and Cooling Strategies via AI/ML</p>

          {/* Enter Dashboard Action Button (glowing CTA) */}
          <div
            className="enter-action-wrap"
            style={{
              marginTop: '34px',
              animation: 'fadeInUp 0.8s ease 1.5s both',
              pointerEvents: 'auto',
            }}
          >
            <button
              type="button"
              onClick={handleEnterDashboard}
              className="enter-platform-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '13px 32px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, rgba(255, 74, 42, 0.95), rgba(98, 212, 255, 0.88))',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                border: '1px solid rgba(255,255,255,0.45)',
                cursor: 'pointer',
                boxShadow: '0 0 30px rgba(255, 74, 42, 0.55), 0 0 15px rgba(98, 212, 255, 0.4)',
                transition: 'all 0.28s ease',
              }}
            >
              <span>Enter HeatShield Platform</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Skip and Replay Control Buttons */}
      <div
        className="intro-actions-bar"
        style={{
          position: 'fixed',
          right: 'max(16px, env(safe-area-inset-right, 0px))',
          bottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (replayRef.current) replayRef.current()
          }}
          className="intro-btn"
          id="replay"
        >
          <RotateCcw size={12} />
          <span>Replay</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (isTitleShown) {
              handleEnterDashboard()
            } else if (skipToTitleRef.current) {
              skipToTitleRef.current()
            }
          }}
          className="intro-btn"
          id="skip"
        >
          <FastForward size={12} />
          <span>{isTitleShown ? 'Enter App' : 'Skip'}</span>
        </button>
      </div>
    </div>
  )
}
