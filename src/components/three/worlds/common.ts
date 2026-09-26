import * as THREE from "three";

export type WorldId = "aurora" | "city" | "galaxy" | "jungle" | "balloons" | "summit" | "alpine" | "desert" | "beach";

export const WORLD_META: Record<WorldId, { label: string; emoji: string }> = {
  aurora: { label: "Arctic Northern Lights", emoji: "🏔️" },
  city: { label: "Night City", emoji: "🌃" },
  galaxy: { label: "Milky Way", emoji: "🌌" },
  jungle: { label: "Rainforest", emoji: "🌿" },
  balloons: { label: "Balloons at Sunrise", emoji: "🎈" },
  summit: { label: "Golden Summit", emoji: "⛰️" },
  alpine: { label: "Alpine Lake Sunrise", emoji: "🌄" },
  desert: { label: "Desert Dunes", emoji: "🏜️" },
  beach: { label: "Tropical Coast", emoji: "🏝️" },
};

export type Ctx = { lite: boolean };

export type World = {
  group: THREE.Group;
  bg: THREE.Color;
  fog: THREE.Color;
  fogDensity: number;
  fade: Fader;
  update: (t: number, dt: number) => void;
  /* Optional camera path for this world (defaults: pos (0, 0.6, 9) looking at (0, 0.4, -8)).
   * ThemeWorld eases toward it and layers a small pointer sway on top. */
  view?: (t: number, pos: THREE.Vector3, look: THREE.Vector3) => void;
};

/* Tracks every material / light / uniform in a world so the whole world can fade in and out. */
export class Fader {
  private mats: { m: THREE.Material; base: number }[] = [];
  private lights: { l: THREE.Light; base: number }[] = [];
  private unis: { u: { value: number }; base: number }[] = [];
  value = 0;
  mat<T extends THREE.Material>(m: T, base?: number): T {
    m.transparent = true;
    this.mats.push({ m, base: base ?? m.opacity ?? 1 });
    m.opacity = 0;
    return m;
  }
  light<T extends THREE.Light>(l: T): T {
    this.lights.push({ l, base: l.intensity });
    l.intensity = 0;
    return l;
  }
  uniform(u: { value: number }, base = 1) {
    this.unis.push({ u, base });
    u.value = 0;
    return u;
  }
  set(a: number) {
    this.value = a;
    for (const x of this.mats) x.m.opacity = x.base * a;
    for (const x of this.lights) x.l.intensity = x.base * a;
    for (const x of this.unis) x.u.value = x.base * a;
  }
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a);

let _glow: THREE.Texture | null = null;
export function glowTex() {
  if (_glow) return _glow;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(255,255,255,0.55)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  _glow = new THREE.CanvasTexture(c);
  return _glow;
}

export function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* 2D value noise + fbm (for terrain). */
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
export function noise2(x: number, y: number) {
  const xi = Math.floor(x),
    yi = Math.floor(y);
  const xf = x - xi,
    yf = y - yi;
  const u = xf * xf * (3 - 2 * xf),
    v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi),
    b = hash(xi + 1, yi),
    c = hash(xi, yi + 1),
    d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm2(x: number, y: number, o = 5) {
  let v = 0,
    a = 0.5,
    f = 1;
  for (let i = 0; i < o; i++) {
    v += a * noise2(x * f, y * f);
    f *= 2;
    a *= 0.5;
  }
  return v;
}

/* Background star shell. */
export function stars(f: Fader, n: number, r: number, size = 0.6, color = "#dfe8ff") {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3(rand(-1, 1), rand(-0.1, 1), rand(-1, -0.2)).normalize().multiplyScalar(r * rand(0.8, 1));
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(
    g,
    f.mat(new THREE.PointsMaterial({ size, map: glowTex(), color, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))
  );
}

/* Particles with per-frame update helper. */
export function particles(f: Fader, n: number, init: (i: number, p: Float32Array) => void, mat: THREE.PointsMaterial) {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) init(i, pos);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, f.mat(mat));
  pts.frustumCulled = false;
  return { pts, pos, flush: () => (g.attributes.position.needsUpdate = true) };
}

/* Neon grid floor (used by cyber + synthwave). */
export function gridFloor(f: Fader, colA: string, colB: string, size = 240, density = 1.2) {
  const uFade = f.uniform({ value: 0 });
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uFade, cA: { value: new THREE.Color(colA) }, cB: { value: new THREE.Color(colB) }, uD: { value: density } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uTime, uFade, uD; uniform vec3 cA, cB; varying vec3 vW;
      void main(){ vec2 g = vW.xz * uD + vec2(0.0, uTime * 3.0);
        vec2 gr = abs(fract(g) - 0.5) / fwidth(g);
        float line = 1.0 - min(min(gr.x, gr.y), 1.0);
        float dist = length(vW.xz);
        float fade = exp(-dist * 0.018);
        vec3 col = mix(cA, cB, clamp(-vW.z / 80.0, 0.0, 1.0));
        gl_FragColor = vec4(col * (line * 1.4 + 0.04), (line * 0.9 + 0.06) * fade * uFade); }`,
  });
  (mat as any).extensions = { derivatives: true };
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  m.rotation.x = -Math.PI / 2;
  return { mesh: m, mat };
}
