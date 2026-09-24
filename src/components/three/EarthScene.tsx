"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { latLonToVec, moonState, subsolarPoint } from "@/components/three/astro";

export type City = { name: string; lat: number; lon: number; tz: string; home?: boolean };

export const CITIES: City[] = [
  { name: "Hyderabad", lat: 17.385, lon: 78.4867, tz: "Asia/Kolkata", home: true },
  { name: "London", lat: 51.5072, lon: -0.1276, tz: "Europe/London" },
  { name: "New York", lat: 40.7128, lon: -74.006, tz: "America/New_York" },
  { name: "San Francisco", lat: 37.7749, lon: -122.4194, tz: "America/Los_Angeles" },
  { name: "Dubai", lat: 25.2048, lon: 55.2708, tz: "Asia/Dubai" },
  { name: "Singapore", lat: 1.3521, lon: 103.8198, tz: "Asia/Singapore" },
  { name: "Sydney", lat: -33.8688, lon: 151.2093, tz: "Australia/Sydney" },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503, tz: "Asia/Tokyo" },
  { name: "Frankfurt", lat: 50.1109, lon: 8.6821, tz: "Europe/Berlin" },
  { name: "São Paulo", lat: -23.5505, lon: -46.6333, tz: "America/Sao_Paulo" },
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946, tz: "Asia/Kolkata" },
];

const ROUTES: [string, string][] = [
  ["Hyderabad", "London"],
  ["Hyderabad", "Dubai"],
  ["Hyderabad", "Singapore"],
  ["Hyderabad", "Frankfurt"],
  ["Hyderabad", "San Francisco"],
  ["London", "New York"],
  ["New York", "San Francisco"],
  ["Singapore", "Sydney"],
  ["Tokyo", "San Francisco"],
  ["Dubai", "London"],
  ["Frankfurt", "São Paulo"],
  ["Bengaluru", "Tokyo"],
  ["Singapore", "Tokyo"],
  ["New York", "São Paulo"],
];

const v3 = (lat: number, lon: number, r = 1) => new THREE.Vector3(...latLonToVec(lat, lon, r));

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.2, "rgba(255,255,255,0.7)");
  grd.addColorStop(0.5, "rgba(255,255,255,0.18)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/* Procedural spiral galaxy sprite (two log-spiral arms with dust + bright core). */
function galaxyTexture() {
  const s = 512;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.translate(s / 2, s / 2);
  const core = g.createRadialGradient(0, 0, 0, 0, 0, 90);
  core.addColorStop(0, "rgba(255,240,220,0.95)");
  core.addColorStop(0.3, "rgba(255,210,170,0.45)");
  core.addColorStop(1, "rgba(120,90,200,0)");
  g.fillStyle = core;
  g.beginPath();
  g.arc(0, 0, 90, 0, Math.PI * 2);
  g.fill();
  for (let arm = 0; arm < 2; arm++) {
    for (let i = 0; i < 2600; i++) {
      const t = Math.random() * 3.6;
      const r = 14 * Math.exp(0.62 * t);
      const a = t * 1.9 + arm * Math.PI + (Math.random() - 0.5) * 0.55;
      const x = Math.cos(a) * r + (Math.random() - 0.5) * 14;
      const y = Math.sin(a) * r + (Math.random() - 0.5) * 14;
      const hue = Math.random() < 0.2 ? "255,170,210" : Math.random() < 0.5 ? "170,200,255" : "230,225,255";
      g.fillStyle = `rgba(${hue},${0.35 * (1 - t / 4)})`;
      g.fillRect(x, y, 1.6, 1.6);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function starField(n: number, radius: number, band = false) {
  const pos: number[] = [];
  const size: number[] = [];
  const col: number[] = [];
  const phase: number[] = [];
  const tilt = new THREE.Matrix4().makeRotationZ(0.9).multiply(new THREE.Matrix4().makeRotationX(0.35));
  for (let i = 0; i < n; i++) {
    let v: THREE.Vector3;
    if (band) {
      const a = Math.random() * Math.PI * 2;
      const lat = (Math.random() + Math.random() + Math.random() - 1.5) * 0.16;
      v = new THREE.Vector3(Math.cos(a), lat, Math.sin(a)).applyMatrix4(tilt);
    } else v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
    v.normalize().multiplyScalar(radius);
    pos.push(v.x, v.y, v.z);
    size.push(band ? 0.8 + Math.random() * 1.6 : Math.random() < 0.05 ? 6 + Math.random() * 5 : 1.5 + Math.random() * 3);
    const tint = [
      [0.75, 0.84, 1],
      [1, 1, 1],
      [1, 0.93, 0.8],
      [1, 0.8, 0.6],
    ][Math.floor(Math.random() * 4)];
    col.push(...(band ? [0.75, 0.8, 1] : tint));
    phase.push(Math.random() * 10);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("aSize", new THREE.Float32BufferAttribute(size, 1));
  geo.setAttribute("aColor", new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute("aPhase", new THREE.Float32BufferAttribute(phase, 1));
  return geo;
}

const starMaterial = (opacity: number) =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uScale: { value: 1 }, uOpacity: { value: opacity } },
    vertexShader: `attribute float aSize; attribute vec3 aColor; attribute float aPhase;
      uniform float uTime; uniform float uScale; varying vec3 vC; varying float vT;
      void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vT = 0.6+0.4*sin(uTime*(0.7+aPhase*0.2)+aPhase*6.28);
      vC = aColor; gl_PointSize = aSize*uScale*(0.8+0.3*vT); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uOpacity; varying vec3 vC; varying float vT;
      void main(){ vec2 c = gl_PointCoord-0.5; float d = length(c);
      float a = (smoothstep(0.2,0.0,d) + smoothstep(0.5,0.0,d)*0.3) * vT * uOpacity; gl_FragColor = vec4(vC*a, a); }`,
  });

/* Tiny airliner mesh for the globe routes (nose along +z). */
function tinyPlane() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: "#f8fafc", metalness: 0.3, roughness: 0.4, emissive: "#9fb8ff", emissiveIntensity: 0.35 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.0035, 0.022, 4, 8), mat);
  body.rotation.x = Math.PI / 2;
  g.add(body);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.0012, 0.007), mat);
  wing.position.z = 0.001;
  g.add(wing);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.001, 0.004), mat);
  tail.position.z = -0.011;
  g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.001, 0.006, 0.005), mat);
  fin.position.set(0, 0.003, -0.011);
  g.add(fin);
  return g;
}

/* Space-station-style satellite: truss, modules, 8 solar arrays, radiators. */
function station(glow: THREE.Texture) {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: "#d4d8e0", metalness: 0.8, roughness: 0.3 });
  const panel = new THREE.MeshStandardMaterial({ color: "#1f3a8a", metalness: 0.6, roughness: 0.25, emissive: "#0b1a44", emissiveIntensity: 0.4 });
  const gold = new THREE.MeshStandardMaterial({ color: "#e0b050", metalness: 0.9, roughness: 0.3 });
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.004, 0.004), metal));
  for (const x of [-0.012, 0.012]) {
    const mod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 12), x > 0 ? metal : gold);
    mod.rotation.x = Math.PI / 2;
    mod.position.x = x;
    g.add(mod);
  }
  for (const x of [-0.065, -0.045, 0.045, 0.065])
    for (const z of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.0008, 0.05), panel);
      p.position.set(x, 0, z * 0.03);
      g.add(p);
    }
  const rad = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.0008, 0.025), metal);
  rad.position.set(0, 0.006, 0);
  g.add(rad);
  const light = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: "#ffffff", blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  light.scale.setScalar(0.05);
  g.add(light);
  return { g, light };
}

function smallSat(glow: THREE.Texture, color: string) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.016), new THREE.MeshStandardMaterial({ color: "#e0b050", metalness: 0.9, roughness: 0.35 }));
  g.add(body);
  const panelMat = new THREE.MeshStandardMaterial({ color: "#1e3a8a", metalness: 0.5, roughness: 0.3, emissive: "#0b1a44", emissiveIntensity: 0.4 });
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.0008, 0.012), panelMat);
    p.position.x = s * 0.025;
    g.add(p);
  }
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.007, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2.4), new THREE.MeshStandardMaterial({ color: "#f1f5f9", metalness: 0.4, roughness: 0.4, side: THREE.DoubleSide }));
  dish.position.z = 0.012;
  dish.rotation.x = -Math.PI / 2;
  g.add(dish);
  const light = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  light.scale.setScalar(0.035);
  g.add(light);
  return { g, light };
}

export default function EarthScene({ onLabels }: { onLabels?: (labels: { name: string; x: number; y: number; visible: boolean; home?: boolean }[]) => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelsCb = useRef(onLabels);
  labelsCb.current = onLabels;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:pan-y;cursor:grab;";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 400);
    const home = CITIES[0];

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = Math.PI - 0.35;
    renderer.domElement.addEventListener("pointerdown", () => (renderer.domElement.style.cursor = "grabbing"));
    renderer.domElement.addEventListener("pointerup", () => (renderer.domElement.style.cursor = "grab"));

    const loader = new THREE.TextureLoader();
    const tex = (url: string, srgb = true) => {
      const t = loader.load(url);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    };
    const dayMap = tex("/textures/earth-day.jpg");
    const nightMap = tex("/textures/earth-night.jpg");
    const waterMap = tex("/textures/earth-water.jpg", false);
    const cloudMap = tex("/textures/earth-clouds.jpg", false);
    const moonMap = tex("/textures/moon.jpg");
    const bumpMap = tex("/textures/earth-bump.jpg", false);
    cloudMap.wrapS = THREE.RepeatWrapping;
    const glow = glowTexture();
    const galaxy = galaxyTexture();

    // ---- sun direction (real time) ----
    const sunDir = new THREE.Vector3(1, 0, 0);
    const moonDir = new THREE.Vector3(0, 0, 1);
    const updateAstro = () => {
      const now = new Date();
      const s = subsolarPoint(now);
      sunDir.copy(v3(s.lat, s.lon));
      const m = moonState(now);
      moonDir.copy(v3(m.lat, m.lon));
    };
    updateAstro();
    // start looking along the day/night terminator near home, so both sunlight and city lights show
    {
      const homeDir = v3(home.lat + 10, home.lon);
      const side = new THREE.Vector3().crossVectors(sunDir, new THREE.Vector3(0, 1, 0)).normalize();
      const onTerminator = side.dot(homeDir) >= 0 ? side : side.negate();
      const start = homeDir.clone().multiplyScalar(0.55).add(onTerminator.multiplyScalar(0.7)).add(sunDir.clone().multiplyScalar(0.25)).normalize();
      start.y = Math.max(start.y, 0.25);
      camera.position.copy(start.normalize().multiplyScalar(5.4));
    }

    // ---- earth ----
    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        dayMap: { value: dayMap },
        nightMap: { value: nightMap },
        waterMap: { value: waterMap },
        cloudMap: { value: cloudMap },
        bumpMap: { value: bumpMap },
        sunDir: { value: sunDir },
        cloudOffset: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){ vUv = uv; vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz;
          gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `
        uniform sampler2D dayMap, nightMap, waterMap, cloudMap, bumpMap; uniform vec3 sunDir; uniform float cloudOffset;
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){
          vec3 N = normalize(vN);
          // cheap bump from the topology map
          float hC = texture2D(bumpMap, vUv).r;
          float hX = texture2D(bumpMap, vUv + vec2(1.0/1024.0, 0.0)).r;
          float hY = texture2D(bumpMap, vUv + vec2(0.0, 1.0/512.0)).r;
          vec3 V = normalize(cameraPosition - vW);
          vec3 L = normalize(sunDir);
          float ndl = dot(N, L);
          float relief = (hC - hX) * 2.5 + (hC - hY) * 2.5;
          float day = smoothstep(-0.06, 0.12, ndl);
          vec3 dayCol = texture2D(dayMap, vUv).rgb;
          float lit = clamp(ndl + relief * 0.4, 0.0, 1.0);
          vec3 col = dayCol * (0.08 + 1.05 * pow(lit, 0.75));
          // soft cloud shadows on the ground
          float cs = texture2D(cloudMap, vUv + vec2(cloudOffset - 0.003, 0.002)).r;
          col *= 1.0 - cs * 0.35 * day;
          // ocean glint
          float water = texture2D(waterMap, vUv).r;
          vec3 H = normalize(L + V);
          float spec = pow(max(dot(N, H), 0.0), 380.0) * water * day;
          col += vec3(1.0, 0.92, 0.78) * spec * 0.45;
          // night side city lights (warm), fading in past the terminator
          vec3 lights = texture2D(nightMap, vUv).rgb;
          lights = pow(lights, vec3(1.35)) * vec3(1.35, 1.05, 0.7) * 2.2;
          col = mix(lights + dayCol * 0.015, col, day);

          // atmospheric rim
          float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
          col += mix(vec3(0.05, 0.1, 0.35), vec3(0.35, 0.6, 1.0), day) * fres * (0.25 + 0.75 * day);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), earthMat);
    scene.add(earth);

    const cloudMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { cloudMap: { value: cloudMap }, sunDir: { value: sunDir }, cloudOffset: { value: 0 } },
      vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){ vUv = uv; vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `uniform sampler2D cloudMap; uniform vec3 sunDir; uniform float cloudOffset; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){ float c = texture2D(cloudMap, vUv + vec2(cloudOffset, 0.0)).r; vec3 N = normalize(vN);
          float ndl = dot(N, normalize(sunDir)); float day = smoothstep(-0.18, 0.25, ndl);
          vec3 col = mix(vec3(0.02,0.03,0.06), vec3(1.0), day) * (0.6 + 0.4*max(ndl,0.0));

          gl_FragColor = vec4(col, c * (0.25 + 0.7*day));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.012, 96, 48), cloudMat);
    scene.add(clouds);

    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 64, 32),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { sunDir: { value: sunDir } },
        vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
        fragmentShader: `uniform vec3 sunDir; varying vec3 vN; varying vec3 vW;
          void main(){ vec3 V = normalize(cameraPosition - vW); float i = pow(max(0.0, 0.78 - dot(-vN, V)), 3.2) * 2.4;
            float s = smoothstep(-0.4, 0.6, dot(normalize(vW), normalize(sunDir)));
            vec3 col = mix(vec3(0.12,0.2,0.6), vec3(0.35,0.65,1.0), s);
            gl_FragColor = vec4(col * i * (0.35 + 0.65*s), 1.0); }`,
      })
    );
    scene.add(atmo);

    // ---- sun + moon ----
    const sunLight = new THREE.DirectionalLight("#fff7ea", 2.6);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight("#223355", 0.25));
    const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: "#ffe9c4", blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    sunSprite.scale.setScalar(9);
    scene.add(sunSprite);
    const sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: "#ff9f5a", blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.35 }));
    sunHalo.scale.setScalar(26);
    scene.add(sunHalo);

    const moon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 64, 32), new THREE.MeshStandardMaterial({ map: moonMap, bumpMap: moonMap, bumpScale: 0.6, roughness: 0.95, metalness: 0 }));
    scene.add(moon);

    // ---- stars, Milky Way, galaxy ----
    const starsMat = starMaterial(1);
    const milkyMat = starMaterial(0.55);
    scene.add(new THREE.Points(starField(2600, 120), starsMat));
    scene.add(new THREE.Points(starField(7000, 125, true), milkyMat));
    const galaxySprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: galaxy, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    galaxySprite.position.copy(new THREE.Vector3(-0.6, 0.45, -0.66).normalize().multiplyScalar(110));
    galaxySprite.scale.set(22, 12, 1);
    galaxySprite.material.rotation = 0.5;
    scene.add(galaxySprite);
    for (let i = 0; i < 8; i++) {
      const neb = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: i % 2 ? "#7c3aed" : "#2563eb", transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false }));
      const a = (i / 8) * Math.PI * 2;
      neb.position.copy(new THREE.Vector3(Math.cos(a), (Math.random() - 0.5) * 0.3, Math.sin(a)).applyMatrix4(new THREE.Matrix4().makeRotationZ(0.9)).normalize().multiplyScalar(118));
      neb.scale.setScalar(40 + Math.random() * 30);
      scene.add(neb);
    }

    // ---- cities ----
    const cityGroup = new THREE.Group();
    scene.add(cityGroup);
    const cityVecs = new Map<string, THREE.Vector3>();
    const beacons: { s: THREE.Sprite; ph: number; home?: boolean }[] = [];
    for (const c of CITIES) {
      const p = v3(c.lat, c.lon, 1.003);
      cityVecs.set(c.name, v3(c.lat, c.lon));
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: c.home ? "#34d399" : "#7dd3fc", blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      s.position.copy(p);
      s.scale.setScalar(c.home ? 0.09 : 0.05);
      cityGroup.add(s);
      beacons.push({ s, ph: Math.random() * 6, home: c.home });
    }
    // home ring pulse
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.026, 48), new THREE.MeshBasicMaterial({ color: "#34d399", transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    const homeP = v3(home.lat, home.lon, 1.004);
    ring.position.copy(homeP);
    ring.lookAt(homeP.clone().multiplyScalar(2));
    scene.add(ring);

    // ---- flight routes: great-circle arcs, animated glow + planes ----
    type Route = { curve: THREE.Vector3[]; line: THREE.Line; colors: Float32Array; planes: { m: THREE.Group; u: number; speed: number; dir: number; light: THREE.Sprite }[] };
    const routes: Route[] = [];
    const SEG = 120;
    for (const [a, b] of ROUTES) {
      const A = cityVecs.get(a)!;
      const B = cityVecs.get(b)!;
      const ang = A.angleTo(B);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG;
        const p = new THREE.Vector3().copy(A).multiplyScalar(Math.sin((1 - t) * ang)).add(B.clone().multiplyScalar(Math.sin(t * ang))).divideScalar(Math.sin(ang));
        p.normalize().multiplyScalar(1.004 + Math.sin(Math.PI * t) * (0.04 + ang * 0.05));
        pts.push(p);
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const colors = new Float32Array((SEG + 1) * 3);
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      scene.add(line);
      const planes = [0, 0.5].map((off, i) => {
        const m = tinyPlane();
        scene.add(m);
        const light = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: "#ff5a5a", blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
        light.scale.setScalar(0.022);
        m.add(light);
        return { m, u: (Math.random() + off) % 1, speed: 0.035 + Math.random() * 0.03, dir: i === 0 ? 1 : -1, light };
      });
      routes.push({ curve: pts, line, colors, planes });
    }

    // ---- satellites ----
    const sats: { g: THREE.Group; light: THREE.Sprite; r: number; incl: number; node: number; speed: number; ph: number; blinkPh: number }[] = [];
    const orbitLine = (r: number, incl: number, node: number, color: string) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 160; i++) {
        const a = (i / 160) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r).applyAxisAngle(new THREE.Vector3(1, 0, 0), incl).applyAxisAngle(new THREE.Vector3(0, 1, 0), node));
      }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.16, depthWrite: false })));
    };
    const iss = station(glow);
    scene.add(iss.g);
    sats.push({ g: iss.g, light: iss.light, r: 1.14, incl: 51.6 * (Math.PI / 180), node: 0.6, speed: 0.12, ph: 0, blinkPh: 0 });
    orbitLine(1.14, 51.6 * (Math.PI / 180), 0.6, "#93c5fd");
    const satDefs = [
      { r: 1.32, incl: 0.3, node: 2.1, speed: 0.08, c: "#a78bfa" },
      { r: 1.5, incl: 1.2, node: 4.0, speed: 0.06, c: "#f472b6" },
      { r: 1.7, incl: 0.9, node: 5.3, speed: 0.05, c: "#34d399" },
      { r: 2.3, incl: 0.02, node: 0, speed: 0.025, c: "#fbbf24" }, // geostationary-style
    ];
    for (const d of satDefs) {
      const s = smallSat(glow, d.c);
      scene.add(s.g);
      sats.push({ g: s.g, light: s.light, r: d.r, incl: d.incl, node: d.node, speed: d.speed, ph: Math.random() * Math.PI * 2, blinkPh: Math.random() * 5 });
      orbitLine(d.r, d.incl, d.node, d.c);
    }

    // ---- sizing, visibility, scroll zoom ----
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w < 700 ? 44 : 32;
      camera.updateProjectionMatrix();
      const sc = dpr * Math.min(1.2, h / 800);
      starsMat.uniforms.uScale.value = sc;
      milkyMat.uniforms.uScale.value = sc;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(mount);

    const clock = new THREE.Clock();
    const tmp = new THREE.Vector3();
    const tmp2 = new THREE.Vector3();
    const proj = new THREE.Vector3();
    let astroT = 0;
    let labelT = 0;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (!visible || document.hidden) return;
      const t = clock.elapsedTime;

      astroT += dt;
      if (astroT > 5) {
        astroT = 0;
        updateAstro();
      }

      // scroll-linked zoom: approach the planet as the section centres on screen
      const r = mount.getBoundingClientRect();
      const centre = 1 - Math.min(1, Math.abs(r.top + r.height / 2 - innerHeight / 2) / innerHeight);
      const far = mount.clientWidth < 700 ? 8.2 : 5.6;
      const targetDist = far - centre * (mount.clientWidth < 700 ? 1.6 : 1.5);
      const len = camera.position.length();
      camera.position.multiplyScalar(1 + (targetDist - len) / len * 0.05);
      controls.update();

      // sun, moon
      sunLight.position.copy(sunDir).multiplyScalar(40);
      sunSprite.position.copy(sunDir).multiplyScalar(60);
      sunHalo.position.copy(sunSprite.position);
      moon.position.copy(moonDir).multiplyScalar(3.3);
      moon.rotation.y = Math.atan2(-moonDir.x, -moonDir.z); // tidally locked: same face toward Earth

      // clouds drift
      const co = (t * 0.0022) % 1;
      earthMat.uniforms.cloudOffset.value = co;
      cloudMat.uniforms.cloudOffset.value = co;

      // stars
      starsMat.uniforms.uTime.value = t;
      milkyMat.uniforms.uTime.value = t;

      // city beacons
      for (const b of beacons) b.s.material.opacity = b.home ? 0.75 + 0.25 * Math.sin(t * 4) : 0.55 + 0.35 * Math.sin(t * 2 + b.ph);
      const rp = (t * 0.6) % 1;
      ring.scale.setScalar(1 + rp * 3);
      (ring.material as THREE.MeshBasicMaterial).opacity = 1 - rp;

      // routes: travelling glow pulse + planes
      for (const rt of routes) {
        for (let i = 0; i <= SEG; i++) {
          const u = i / SEG;
          let a = 0.12;
          for (const p of rt.planes) {
            const d = p.dir > 0 ? p.u - u : u - p.u;
            if (d > 0 && d < 0.25) a += (1 - d / 0.25) * 0.9; // trail behind each plane
          }
          rt.colors[i * 3] = 0.35 * a;
          rt.colors[i * 3 + 1] = 0.7 * a;
          rt.colors[i * 3 + 2] = 1.0 * a;
        }
        rt.line.geometry.attributes.color.needsUpdate = true;
        for (const p of rt.planes) {
          p.u += p.speed * dt * p.dir;
          if (p.u > 1) p.u = 0;
          if (p.u < 0) p.u = 1;
          const f = p.u * SEG;
          const i0 = Math.floor(f);
          const i1 = Math.min(SEG, i0 + 1);
          tmp.lerpVectors(rt.curve[i0], rt.curve[i1], f - i0);
          p.m.position.copy(tmp);
          const ahead = rt.curve[p.dir > 0 ? Math.min(SEG, i1 + 1) : Math.max(0, i0 - 1)];
          p.m.up.copy(tmp).normalize();
          p.m.lookAt(ahead);
          p.light.material.opacity = Math.sin(t * 8 + p.u * 40) > 0.6 ? 1 : 0.2;
        }
      }

      // satellites
      for (const s of sats) {
        const a = s.ph + t * s.speed;
        tmp2.set(Math.cos(a) * s.r, 0, Math.sin(a) * s.r).applyAxisAngle(new THREE.Vector3(1, 0, 0), s.incl).applyAxisAngle(new THREE.Vector3(0, 1, 0), s.node);
        s.g.position.copy(tmp2);
        s.g.lookAt(0, 0, 0);
        s.light.material.opacity = (t + s.blinkPh) % 1.4 < 0.1 ? 1 : 0.15;
      }

      renderer.render(scene, camera);

      // project city labels (throttled)
      labelT += dt;
      if (labelsCb.current && labelT > 0.05) {
        labelT = 0;
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        const camDir = camera.position.clone().normalize();
        labelsCb.current(
          CITIES.map((c) => {
            const p = cityVecs.get(c.name)!;
            proj.copy(p).multiplyScalar(1.01).project(camera);
            return { name: c.name, x: ((proj.x + 1) / 2) * w, y: ((1 - proj.y) / 2) * h, visible: p.dot(camDir) > 0.25, home: c.home };
          })
        );
      }
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      [dayMap, nightMap, waterMap, cloudMap, moonMap, bumpMap, glow, galaxy].forEach((x) => x.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" />;
}
