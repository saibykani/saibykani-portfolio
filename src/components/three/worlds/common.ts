import * as THREE from "three";

export type WorldId = "milkyway" | "nyc" | "ocean" | "jungle" | "port" | "dragon";

export const WORLD_META: Record<WorldId, { label: string; emoji: string }> = {
  milkyway: { label: "Milky Way", emoji: "🌌" },
  nyc: { label: "New York City", emoji: "🗽" },
  ocean: { label: "Open Ocean", emoji: "🐬" },
  jungle: { label: "Wild Jungle", emoji: "🐘" },
  port: { label: "Port City", emoji: "⚓" },
  dragon: { label: "Dragon Realm", emoji: "🐉" },
};

export type Ctx = { lite: boolean };
export type Cam = (cam: THREE.PerspectiveCamera, t: number, prog: number, mouse: { x: number; y: number }) => void;

export type World = {
  group: THREE.Group;
  bg: THREE.Color;
  fog: THREE.Color;
  fogDensity: number;
  fade: Fader;
  update: (t: number, dt: number) => void;
  camera?: Cam;
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

export function stars(f: Fader, n: number, r: number, size = 0.6, color = "#dfe8ff") {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3(rand(-1, 1), rand(-0.05, 1), rand(-1, 1)).normalize().multiplyScalar(r * rand(0.85, 1));
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, f.mat(new THREE.PointsMaterial({ size, map: glowTex(), color, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
}

/* Gradient sky dome with an optional sun disc. */
export function skyDome(f: Fader, top: string, mid: string, horizon: string, sunDir?: THREE.Vector3, sunColor = "#ffd08a", sunSize = 0.02) {
  const uFade = f.uniform({ value: 0 });
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    transparent: true,
    fog: false,
    uniforms: {
      uFade,
      cT: { value: new THREE.Color(top) },
      cM: { value: new THREE.Color(mid) },
      cH: { value: new THREE.Color(horizon) },
      sDir: { value: (sunDir ?? new THREE.Vector3(0, -1, 0)).clone().normalize() },
      sCol: { value: new THREE.Color(sunColor) },
      sSize: { value: sunDir ? sunSize : 0 },
    },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uFade, sSize; uniform vec3 cT, cM, cH, sDir, sCol; varying vec3 vD;
      void main(){ float y = vD.y;
        vec3 col = y > 0.0 ? mix(cH, mix(cM, cT, smoothstep(0.15, 0.7, y)), smoothstep(0.0, 0.15, y)) : cH * 0.6;
        float d = dot(normalize(vD), sDir);
        col += sCol * (smoothstep(1.0 - sSize, 1.0 - sSize * 0.7, d) * 2.0 + pow(max(d, 0.0), 12.0) * 0.45 + pow(max(d, 0.0), 3.0) * 0.12) * step(0.0001, sSize);
        gl_FragColor = vec4(col, uFade); }`,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(380, 32, 16), m);
}

/* ---------- Ocean waves: identical in GLSL and JS so boats ride the rendered surface ---------- */
const WAVES = [
  { d: [1, 0.3], k: 0.16, a: 0.5, w: 0.8 },
  { d: [-0.6, 1], k: 0.26, a: 0.28, w: 1.1 },
  { d: [0.2, -1], k: 0.46, a: 0.13, w: 1.6 },
  { d: [0.8, 0.8], k: 0.95, a: 0.05, w: 2.3 },
].map((w) => {
  const l = Math.hypot(w.d[0], w.d[1]);
  return { ...w, d: [w.d[0] / l, w.d[1] / l] };
});
export function waveHeight(x: number, z: number, t: number, scale = 1) {
  let h = 0;
  for (const w of WAVES) h += w.a * scale * Math.sin((w.d[0] * x + w.d[1] * z) * w.k + t * w.w);
  return h;
}
const glslWaves = WAVES.map(
  (w) => `{ vec2 d = vec2(${w.d[0].toFixed(4)}, ${w.d[1].toFixed(4)}); float ph = dot(d, p) * ${w.k.toFixed(3)} + uTime * ${w.w.toFixed(3)};
    h += ${w.a.toFixed(3)} * uAmp * sin(ph); g += d * ${(w.a * w.k).toFixed(4)} * uAmp * cos(ph); }`
).join("\n");

export function waterMaterial(f: Fader, o: { deep: string; shallow: string; sky: string; sunDir: THREE.Vector3; sun: string; amp?: number }) {
  const uFade = f.uniform({ value: 0 });
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uFade,
      uAmp: { value: o.amp ?? 1 },
      cDeep: { value: new THREE.Color(o.deep) },
      cShallow: { value: new THREE.Color(o.shallow) },
      cSky: { value: new THREE.Color(o.sky) },
      cSun: { value: new THREE.Color(o.sun) },
      sDir: { value: o.sunDir.clone().normalize() },
      fogColor: { value: new THREE.Color() },
      fogDensity: { value: 0 },
    },
    fog: true,
    vertexShader: `uniform float uTime, uAmp; varying vec3 vW; varying vec3 vN; varying float vH;
      #include <fog_pars_vertex>
      void main(){ vec3 pos = position; vec4 w0 = modelMatrix * vec4(pos, 1.0); vec2 p = w0.xz;
        float h = 0.0; vec2 g = vec2(0.0);
        ${glslWaves}
        w0.y += h; vH = h; vW = w0.xyz; vN = normalize(vec3(-g.x, 1.0, -g.y));
        vec4 mvPosition = viewMatrix * w0; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform float uTime, uFade; uniform vec3 cDeep, cShallow, cSky, cSun, sDir; varying vec3 vW; varying vec3 vN; varying float vH;
      #include <fog_pars_fragment>
      float hsh(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){ vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
        float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);
        vec3 col = mix(cDeep, cShallow, clamp(vH * 0.6 + 0.4, 0.0, 1.0));
        col = mix(col, cSky, fres * 0.85);
        vec3 H = normalize(normalize(sDir) + V);
        float spec = pow(max(dot(N, H), 0.0), 220.0);
        float glitter = step(0.93, hsh(floor(vW.xz * 6.0) + floor(uTime * 6.0))) * pow(max(dot(N, H), 0.0), 40.0);
        col += cSun * (spec * 2.5 + glitter * 1.5);
        col += vec3(1.0) * smoothstep(0.55, 0.85, vH) * 0.35; // foam on crests
        gl_FragColor = vec4(col, uFade);
        #include <fog_fragment>
      }`,
  });
}

/* Simple flapping bird (gull / parrot): body + two wings. */
export function bird(f: Fader, body: string, wing: string, scale = 1) {
  const g = new THREE.Group();
  const bm = f.mat(new THREE.MeshStandardMaterial({ color: body, roughness: 0.6 }));
  const wm = f.mat(new THREE.MeshStandardMaterial({ color: wing, roughness: 0.6, side: THREE.DoubleSide }));
  const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.22, 4, 8).rotateX(Math.PI / 2), bm);
  g.add(b);
  const l = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.14).translate(-0.21, 0, 0).rotateX(-Math.PI / 2), wm);
  const r = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.14).translate(0.21, 0, 0).rotateX(-Math.PI / 2), wm);
  g.add(l, r);
  g.scale.setScalar(scale);
  return { g, flap: (t: number) => ((l.rotation.z = Math.sin(t) * 0.7), (r.rotation.z = -Math.sin(t) * 0.7)) };
}

/* Lit-window texture for buildings. */
export function windowTexture(warm = true) {
  return canvasTex(128, 256, (g) => {
    g.fillStyle = "#070810";
    g.fillRect(0, 0, 128, 256);
    for (let y = 4; y < 256; y += 9)
      for (let x = 4; x < 128; x += 9) {
        if (Math.random() < 0.42) continue;
        g.fillStyle = warm ? ["#fde68a", "#fcd34d", "#fff7d6", "#bae6fd"][Math.floor(Math.random() * 4)] : ["#67e8f9", "#f0abfc", "#ffffff"][Math.floor(Math.random() * 3)];
        g.globalAlpha = rand(0.35, 1);
        g.fillRect(x, y, 5, 5);
      }
  });
}
