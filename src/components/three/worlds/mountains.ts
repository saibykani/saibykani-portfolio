import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { canvasTex, Ctx, Fader, fbm2, glowTex, noise2, World } from "./common";

/* =====================================================================================
 * Mountain worlds: Arctic Northern Lights (aurora), Golden Summit (summit), Alpine Lake
 * Sunrise (alpine). Everything is procedural: smooth-shaded heightfield ranges with
 * slope/height materials + baked soft shadows + aerial perspective, instanced spruce
 * forests, a real planar reflection for the lakes, shader skies, clouds, aurora and mist.
 * ===================================================================================== */

type U<T = number> = { value: T };
const C = (hex: string, k = 1) => new THREE.Color(hex).multiplyScalar(k);
const clamp = THREE.MathUtils.clamp;
const sstep = (x: number, a: number, b: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pxScale = (ctx: Ctx) => window.innerHeight * Math.min(window.devicePixelRatio || 1, ctx.lite ? 1 : 1.35) * 0.87;
const dpr = (ctx: Ctx) => Math.min(window.devicePixelRatio || 1, ctx.lite ? 1 : 1.35);

const OUT = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>`;

/* ---------- tileable 4-channel noise texture (R,G: fbm, B: fine fbm, A: ridged) ---------- */
let _noise: THREE.DataTexture | null = null;
function noiseTex() {
  if (_noise) return _noise;
  const N = 256;
  const r = rng(11);
  const chan = (baseP: number, oct: number, ridge: boolean, gain = 0.5) => {
    const lats: Float32Array[] = [];
    for (let o = 0; o < oct; o++) {
      const P = baseP << o;
      const a = new Float32Array(P * P);
      for (let i = 0; i < a.length; i++) a[i] = r();
      lats.push(a);
    }
    const out = new Float32Array(N * N);
    let mn = 1e9,
      mx = -1e9;
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        let v = 0,
          amp = 1,
          w = 1;
        for (let o = 0; o < oct; o++) {
          const P = baseP << o,
            L = lats[o];
          const fx = (x / N) * P,
            fy = (y / N) * P;
          const xi = Math.floor(fx),
            yi = Math.floor(fy);
          let u = fx - xi,
            t = fy - yi;
          u = u * u * u * (u * (u * 6 - 15) + 10);
          t = t * t * t * (t * (t * 6 - 15) + 10);
          const x0 = xi % P,
            x1 = (xi + 1) % P,
            y0 = yi % P,
            y1 = (yi + 1) % P;
          const a = L[y0 * P + x0],
            b = L[y0 * P + x1],
            c = L[y1 * P + x0],
            d = L[y1 * P + x1];
          let n = a + (b - a) * u + (c - a) * t + (a - b - c + d) * u * t;
          if (ridge) {
            n = 1 - Math.abs(n * 2 - 1);
            n *= n * w;
            w = Math.min(1, n * 2);
          }
          v += n * amp;
          amp *= gain;
        }
        out[y * N + x] = v;
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
    for (let i = 0; i < out.length; i++) out[i] = (out[i] - mn) / (mx - mn);
    return out;
  };
  const R = chan(4, 6, false),
    G = chan(6, 5, false),
    B = chan(16, 4, false, 0.55),
    A = chan(5, 5, true);
  const data = new Uint8Array(N * N * 4);
  for (let i = 0; i < N * N; i++) {
    data[i * 4] = R[i] * 255;
    data[i * 4 + 1] = G[i] * 255;
    data[i * 4 + 2] = B[i] * 255;
    data[i * 4 + 3] = A[i] * 255;
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  _noise = t;
  return t;
}

/* ---------- terrain height primitives ---------- */
function ridged(x: number, z: number, oct = 6) {
  let s = 0,
    a = 0.5,
    fr = 1,
    w = 1,
    norm = 0;
  for (let i = 0; i < oct; i++) {
    let n = noise2(x * fr + i * 17.31, z * fr - i * 9.17);
    n = 1 - Math.abs(n * 2 - 1);
    n *= n;
    n *= w;
    w = clamp(n * 1.9, 0, 1);
    s += n * a;
    norm += a;
    fr *= 2.03;
    a *= 0.52;
  }
  return s / norm;
}

type Peak = [x: number, z: number, radius: number, height: number];
type RangeOpts = { z0: number; z1: number; H: number; f: number; seed: number; base: number; peaks?: Peak[]; warp?: number; vary?: number };
function rangeH(x: number, z: number, o: RangeOpts) {
  const t = (z - (o.z0 + o.z1) / 2) / ((o.z1 - o.z0) / 2);
  const env = Math.max(0, 1 - t * t);
  const wp = o.warp ?? 50;
  const wx = x + (fbm2(x * 0.011 + o.seed, z * 0.011, 3) - 0.5) * wp;
  const wz = z + (fbm2(x * 0.011 - 4.1, z * 0.011 + o.seed, 3) - 0.5) * wp;
  const r = ridged(wx * o.f + o.seed, wz * o.f, 7);
  const vary = o.vary ?? 1;
  const massif = 1 - vary + vary * (0.25 + 1.25 * fbm2(x * 0.0045 + o.seed * 3.1, 1.7 + o.seed, 3));
  let h = Math.pow(r, 1.6) * o.H * massif * Math.pow(env, 0.65);
  if (o.peaks)
    for (const [px, pz, rad, ph] of o.peaks) {
      const d = Math.hypot(x - px, (z - pz) * 1.15) / rad;
      if (d < 1) h += ph * Math.pow(1 - d, 1.25) * (0.25 + 1.1 * Math.pow(r, 1.3));
    }
  return h + o.base;
}

/* Grid heightfield in world coordinates (+ baked soft sun shadows as a vertex attribute). */
function heightfield(o: { x0: number; x1: number; z0: number; z1: number; sx: number; sz: number; h: (x: number, z: number) => number; sun?: THREE.Vector3; shadowSoft?: number }) {
  const nx = o.sx + 1,
    nz = o.sz + 1;
  const dx = (o.x1 - o.x0) / o.sx,
    dz = (o.z1 - o.z0) / o.sz;
  const H = new Float32Array(nx * nz);
  const pos = new Float32Array(nx * nz * 3);
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const x = o.x0 + i * dx,
        z = o.z0 + j * dz;
      const h = o.h(x, z);
      const k = j * nx + i;
      H[k] = h;
      pos[k * 3] = x;
      pos[k * 3 + 1] = h;
      pos[k * 3 + 2] = z;
    }
  const idx = new Uint32Array(o.sx * o.sz * 6);
  let p = 0;
  for (let j = 0; j < o.sz; j++)
    for (let i = 0; i < o.sx; i++) {
      const a = j * nx + i,
        b = a + 1,
        c = a + nx,
        d = c + 1;
      idx[p++] = a;
      idx[p++] = c;
      idx[p++] = b;
      idx[p++] = b;
      idx[p++] = c;
      idx[p++] = d;
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  const sample = (x: number, z: number) => {
    const fx = clamp((x - o.x0) / dx, 0, o.sx - 0.0001),
      fz = clamp((z - o.z0) / dz, 0, o.sz - 0.0001);
    const i = Math.floor(fx),
      j = Math.floor(fz);
    const u = fx - i,
      v = fz - j;
    const k = j * nx + i;
    return (H[k] * (1 - u) + H[k + 1] * u) * (1 - v) + (H[k + nx] * (1 - u) + H[k + nx + 1] * u) * v;
  };
  const shade = new Float32Array(nx * nz).fill(1);
  if (o.sun) {
    const l = Math.hypot(o.sun.x, o.sun.z) || 1;
    const ux = o.sun.x / l,
      uz = o.sun.z / l,
      tanE = o.sun.y / l;
    const step = Math.max(Math.abs(dx), Math.abs(dz)) * 1.2;
    const soft = o.shadowSoft ?? 2;
    for (let k = 0; k < nx * nz; k++) {
      const x = pos[k * 3],
        h = pos[k * 3 + 1],
        z = pos[k * 3 + 2];
      let occ = 0;
      for (let s = 1; s <= 36; s++) {
        const dist = step * Math.pow(s, 1.25);
        const sxp = x + ux * dist,
          szp = z + uz * dist;
        if (sxp < o.x0 || sxp > o.x1 || szp < o.z0 || szp > o.z1) break;
        const o2 = (sample(sxp, szp) - (h + dist * tanE)) / (1 + dist * 0.04);
        if (o2 > occ) occ = o2;
      }
      shade[k] = 1 - sstep(occ, 0, soft);
    }
  }
  geo.setAttribute("aShade", new THREE.BufferAttribute(shade, 1));
  const slope = (x: number, z: number) => {
    const e = 1.2;
    return Math.hypot(sample(x + e, z) - sample(x - e, z), sample(x, z + e) - sample(x, z - e)) / (2 * e);
  };
  return { geo, sample, slope };
}

/* ---------- shared environment uniforms (one set per world) ---------- */
type Env = ReturnType<typeof makeEnv>;
function makeEnv(f: Fader, o: { sunDir: THREE.Vector3; sun: THREE.Color; sky: THREE.Color; bounce: THREE.Color; haze: THREE.Color; hazeSun: THREE.Color; hazeDen: number; hazeFloor?: number }) {
  return {
    uFade: f.uniform({ value: 0 }, 1),
    uTime: { value: 0 },
    uNoise: { value: noiseTex() as THREE.Texture },
    uSunDir: { value: o.sunDir.clone().normalize() },
    uSunCol: { value: o.sun },
    uSky: { value: o.sky },
    uBounce: { value: o.bounce },
    uHaze: { value: o.haze },
    uHazeSun: { value: o.hazeSun },
    uHazeDen: { value: o.hazeDen },
    uHazeFloor: { value: o.hazeFloor ?? -2 },
  };
}

const HAZE_GLSL = /* glsl */ `
  uniform vec3 uHaze, uHazeSun, uSunDir; uniform float uHazeDen, uHazeFloor;
  vec3 applyHaze(vec3 col, vec3 wp, float k){
    vec3 d = wp - cameraPosition; float dist = length(d);
    float a = 1.0 - exp(-dist * uHazeDen * k);
    float hf = exp(-max(wp.y - uHazeFloor, 0.0) * 0.022);
    a = clamp(a * (0.55 + 0.6 * hf), 0.0, 1.0);
    float s = pow(max(dot(d / dist, uSunDir), 0.0), 5.0);
    return mix(col, mix(uHaze, uHazeSun, s), a);
  }`;

/* ---------- terrain material ---------- */
type TerrainLook = Partial<{
  rockA: string;
  rockB: string;
  snow: string;
  grass: string;
  grass2: string;
  snowLine: number;
  snowSlope: number;
  grassLine: number;
  mist: string;
  mistY: number;
  mistH: number;
  mistAmt: number;
  litLine: number;
  hazeK: number;
  rimK: number;
  cutY: number;
  cutH: number;
}>;
function terrainMat(env: Env, o: TerrainLook = {}) {
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: true,
    uniforms: {
      ...env,
      uRockA: { value: C(o.rockA ?? "#2b2a2c") },
      uRockB: { value: C(o.rockB ?? "#4a4643") },
      uSnowC: { value: C(o.snow ?? "#eef3fa") },
      uGrass: { value: C(o.grass ?? "#27381f") },
      uGrass2: { value: C(o.grass2 ?? "#3b4a26") },
      uSnowLine: { value: o.snowLine ?? 20 },
      uSnowSlope: { value: o.snowSlope ?? 0.55 },
      uGrassLine: { value: o.grassLine ?? -100 },
      uMist: { value: C(o.mist ?? "#ffffff") },
      uMistY: { value: o.mistY ?? -100 },
      uMistH: { value: o.mistH ?? 1 },
      uMistAmt: { value: o.mistAmt ?? 0 },
      uLitLine: { value: o.litLine ?? -1000 },
      uHazeK: { value: o.hazeK ?? 1 },
      uRimK: { value: o.rimK ?? 0 },
      uCutY: { value: o.cutY ?? -1000 },
      uCutH: { value: o.cutH ?? 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aShade; varying vec3 vW; varying vec3 vN; varying float vShade;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vShade = aShade;
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uNoise; uniform float uFade, uTime, uSnowLine, uSnowSlope, uGrassLine, uMistY, uMistH, uMistAmt, uLitLine, uHazeK, uRimK, uCutY, uCutH;
      uniform vec3 uSunCol, uSky, uBounce, uRockA, uRockB, uSnowC, uGrass, uGrass2, uMist;
      varying vec3 vW; varying vec3 vN; varying float vShade;
      ${HAZE_GLSL}
      void main(){
        vec3 n = normalize(vN);
        vec4 n1 = texture2D(uNoise, vW.xz * 0.012);
        vec4 n2 = texture2D(uNoise, vW.xz * 0.061 + vW.y * 0.013);
        vec4 n3 = texture2D(uNoise, vW.xz * 0.23 + vW.y * 0.05);
        float strata = texture2D(uNoise, vec2(vW.x * 0.006 + vW.z * 0.005, vW.y * 0.05 + n1.r * 0.9)).g;
        // micro normal detail from ridged channel (fake erosion gullies)
        vec2 g = vec2(texture2D(uNoise, vW.xz * 0.05 + vec2(0.004, 0.0)).a - texture2D(uNoise, vW.xz * 0.05 - vec2(0.004, 0.0)).a,
                      texture2D(uNoise, vW.xz * 0.05 + vec2(0.0, 0.004)).a - texture2D(uNoise, vW.xz * 0.05 - vec2(0.0, 0.004)).a);
        vec2 g2 = vec2(texture2D(uNoise, vW.xz * 0.21 + vec2(0.003, 0.0)).b - texture2D(uNoise, vW.xz * 0.21 - vec2(0.003, 0.0)).b,
                       texture2D(uNoise, vW.xz * 0.21 + vec2(0.0, 0.003)).b - texture2D(uNoise, vW.xz * 0.21 - vec2(0.0, 0.003)).b);
        float fade = 1.0 / (1.0 + length(vW - cameraPosition) * 0.012);
        vec2 g3 = vec2(texture2D(uNoise, vW.xz * 0.8 + vec2(0.004, 0.0)).a - texture2D(uNoise, vW.xz * 0.8 - vec2(0.004, 0.0)).a,
                       texture2D(uNoise, vW.xz * 0.8 + vec2(0.0, 0.004)).a - texture2D(uNoise, vW.xz * 0.8 - vec2(0.0, 0.004)).a);
        float fadeN = 1.0 - smoothstep(15.0, 60.0, length(vW - cameraPosition));
        n = normalize(n + vec3(g.x, 0.0, g.y) * 6.0 * (1.0 - n.y + 0.2) + vec3(g2.x, 0.0, g2.y) * 5.0 * fade + vec3(g3.x, 0.0, g3.y) * 5.0 * fadeN);
        float slope = 1.0 - n.y;
        float dCam = length(vW - cameraPosition);
        float nearK = 1.0 - smoothstep(20.0, 70.0, dCam);
        vec4 n4 = texture2D(uNoise, vW.xz * 0.9 + vW.y * 0.4);
        vec4 n5 = texture2D(uNoise, vec2(vW.x + vW.z, vW.y * 2.5) * 0.35);
        vec3 rock = mix(uRockA, uRockB, smoothstep(0.2, 0.85, strata * 0.6 + n2.g * 0.4)) * (0.62 + 0.55 * n2.b) * (0.85 + 0.3 * n3.b) * mix(1.0, 0.55 + 0.8 * n4.b * n5.g * 1.6, nearK);
        float gl = uGrassLine + (n1.r - 0.5) * 16.0;
        float grass = (1.0 - smoothstep(gl - 3.0, gl + 3.0, vW.y)) * (1.0 - smoothstep(0.32, 0.6, slope + (n2.r - 0.5) * 0.3));
        vec3 base = mix(rock, mix(uGrass, uGrass2, smoothstep(0.3, 0.7, n2.g)) * (0.75 + 0.5 * n3.r), grass);
        float sl = uSnowLine + (n1.g - 0.5) * 18.0 + (n3.r - 0.5) * 4.0;
        float snowH = smoothstep(sl - 3.0, sl + 5.0, vW.y);
        float snowS = 1.0 - smoothstep(uSnowSlope - 0.12, uSnowSlope + 0.14, slope + (n2.b - 0.5) * 0.45 + (n3.g - 0.5) * 0.2);
        float rib = texture2D(uNoise, vW.xz * vec2(0.03, 0.03) + vec2(vW.y * 0.01)).a;
        snowS *= mix(1.0, smoothstep(0.25, 0.6, rib + (n3.b - 0.5) * 0.4), smoothstep(0.2, 0.45, slope));
        float snow = clamp(snowH * snowS * 1.4, 0.0, 1.0);
        base = mix(base, uSnowC * (0.9 + 0.12 * n3.b), snow);
        float sh = vShade * smoothstep(uLitLine - 6.0, uLitLine + 10.0, vW.y + (n1.r - 0.5) * 10.0);
        float ndl = dot(n, uSunDir);
        float dif = max(ndl, 0.0) * sh;
        float sky = 0.55 + 0.45 * n.y;
        vec3 col = base * (uSunCol * dif + uSky * sky + uBounce * (1.0 - n.y) * 0.6);
        vec3 V = normalize(cameraPosition - vW);
        float spec = pow(max(dot(reflect(-uSunDir, n), V), 0.0), 16.0) * snow * sh;
        col += uSunCol * spec * 0.18;
        // rim light when backlit
        col += uSunCol * uRimK * pow(1.0 - max(dot(n, V), 0.0), 3.0) * max(dot(-V, uSunDir), 0.0) * sh * (0.3 + snow);
        col = applyHaze(col, vW, uHazeK);
        float m = (1.0 - smoothstep(uMistY, uMistY + uMistH, vW.y + (texture2D(uNoise, vW.xz * 0.008 + vec2(uTime * 0.003, 0.0)).r - 0.5) * uMistH)) * uMistAmt;
        col = mix(col, uMist, clamp(m, 0.0, 1.0));
        // dissolve into the cloud layer (stochastic cut, clouds behind fill the holes)
        float keep = smoothstep(uCutY, uCutY + uCutH, vW.y + (n3.g - 0.5) * uCutH * 0.8 + (n2.r - 0.5) * uCutH * 0.6);
        if (keep < texture2D(uNoise, gl_FragCoord.xy / 256.0).b) discard;
        gl_FragColor = vec4(col, uFade);
        ${OUT}
      }`,
  });
  return m;
}

/* ---------- sky dome ---------- */
function skyDome(env: Env, o: { zenith: string; mid: string; horizon: string; below: string; glow: string; glowK: number; sunDisc?: string; sunSize?: number; band?: string; bandK?: number }) {
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    uniforms: {
      uFade: env.uFade,
      uSunDir: env.uSunDir,
      uZen: { value: C(o.zenith) },
      uMid: { value: C(o.mid) },
      uHor: { value: C(o.horizon) },
      uBelow: { value: C(o.below) },
      uGlow: { value: C(o.glow) },
      uGlowK: { value: o.glowK },
      uDisc: { value: C(o.sunDisc ?? "#000000") },
      uSunSize: { value: o.sunSize ?? 0.0 },
      uBand: { value: C(o.band ?? "#000000") },
      uBandK: { value: o.bandK ?? 0 },
    },
    vertexShader: /* glsl */ `varying vec3 vD; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vD = w.xyz - cameraPosition; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform float uFade, uGlowK, uSunSize, uBandK; uniform vec3 uSunDir, uZen, uMid, uHor, uBelow, uGlow, uDisc, uBand; varying vec3 vD;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec3 d = normalize(vD); float h = d.y; float up = max(h, 0.0);
        vec3 col = mix(uHor, uMid, smoothstep(0.0, 0.16, up));
        col = mix(col, uZen, smoothstep(0.1, 0.7, up));
        col = mix(col, uBelow, smoothstep(0.0, -0.05, h));
        float s = max(dot(d, uSunDir), 0.0);
        float hz = 1.0 - smoothstep(0.0, 0.5, abs(h));
        col += uGlow * uGlowK * (pow(s, 6.0) * 0.35 * (0.4 + hz) + pow(s, 40.0) * 0.8 + pow(s, 400.0) * 2.0);
        col += uDisc * smoothstep(1.0 - uSunSize, 1.0 - uSunSize * 0.55, s);
        col += uBand * uBandK * exp(-pow((h - 0.12) / 0.1, 2.0)) * smoothstep(0.1, -0.7, d.z);
        col += (hash(gl_FragCoord.xy) - 0.5) / 180.0;
        gl_FragColor = vec4(col, uFade);
        ${OUT}
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(520, 48, 24), m);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return mesh;
}

/* ---------- realistic star field ---------- */
function starField(env: Env, ctx: Ctx, n: number) {
  const r = rng(5);
  const pos = new Float32Array(n * 3),
    sz = new Float32Array(n),
    ph = new Float32Array(n),
    col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const y = Math.pow(r(), 0.8) * 0.98 + 0.02;
    const a = r() * Math.PI * 2;
    const rr = Math.sqrt(1 - y * y);
    pos.set([Math.cos(a) * rr * 480, y * 480, Math.sin(a) * rr * 480], i * 3);
    const mag = Math.pow(r(), 6);
    sz[i] = 1.1 + mag * 3.2;
    ph[i] = r() * 10;
    const warm = r();
    const c = warm < 0.2 ? C("#ffd9b0") : warm < 0.45 ? C("#cfe0ff") : C("#ffffff");
    c.multiplyScalar(0.35 + mag * 1.6 + r() * 0.25);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
  g.setAttribute("aPh", new THREE.BufferAttribute(ph, 1));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uFade: env.uFade, uTime: env.uTime, uDpr: { value: dpr(ctx) } },
    vertexShader: /* glsl */ `attribute float aSize, aPh; attribute vec3 color; uniform float uTime, uDpr; varying vec3 vC;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); float tw = 0.75 + 0.25 * sin(uTime * (1.3 + fract(aPh) * 2.0) + aPh * 7.0);
        vC = color * tw * smoothstep(0.0, 60.0, w.y - cameraPosition.y); gl_PointSize = aSize * uDpr; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `uniform float uFade; varying vec3 vC; void main(){ vec2 p = gl_PointCoord - 0.5; float a = exp(-dot(p, p) * 18.0);
      gl_FragColor = vec4(vC * a, uFade); ${OUT} }`,
  });
  const pts = new THREE.Points(g, m);
  pts.renderOrder = -9;
  pts.frustumCulled = false;
  return pts;
}

/* ---------- drifting particles (snow / pollen / dust), animated fully on the GPU ---------- */
function drift(env: Env, ctx: Ctx, o: { n: number; center: THREE.Vector3; box: THREE.Vector3; vel: THREE.Vector3; size: number; color: THREE.Color; wobble: number; soft?: number }) {
  const r = rng(99);
  const pos = new Float32Array(o.n * 3),
    seed = new Float32Array(o.n);
  for (let i = 0; i < o.n; i++) {
    pos.set([(r() - 0.5) * o.box.x, (r() - 0.5) * o.box.y, (r() - 0.5) * o.box.z], i * 3);
    seed[i] = r();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uFade: env.uFade,
      uTime: env.uTime,
      uPx: { value: pxScale(ctx) },
      uC: { value: o.center },
      uBox: { value: o.box },
      uVel: { value: o.vel },
      uSize: { value: o.size },
      uCol: { value: o.color },
      uWob: { value: o.wobble },
      uSoft: { value: o.soft ?? 10 },
    },
    vertexShader: /* glsl */ `attribute float aSeed; uniform float uTime, uPx, uSize, uWob; uniform vec3 uC, uBox, uVel; varying float vA;
      void main(){ vec3 p = position + uVel * uTime * (0.7 + aSeed * 0.6);
        p += vec3(sin(uTime * 0.7 + aSeed * 40.0), 0.0, cos(uTime * 0.53 + aSeed * 23.0)) * uWob;
        p = mod(p + uBox * 0.5, uBox) - uBox * 0.5 + uC;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float d = -mv.z; vA = step(-1.9, cameraPosition.y) * smoothstep(0.4, 2.0, d) * (1.0 - smoothstep(uBox.z * 0.35, uBox.z * 0.5, d)) * (0.5 + 0.5 * aSeed);
        gl_PointSize = max(uSize * (0.6 + aSeed * 0.8) * uPx / d, 1.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `uniform float uFade, uSoft; uniform vec3 uCol; varying float vA;
      void main(){ vec2 p = gl_PointCoord - 0.5; float a = exp(-dot(p, p) * uSoft) * vA; gl_FragColor = vec4(uCol, a * uFade); ${OUT} }`,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  pts.renderOrder = 6;
  return pts;
}

/* ---------- camera-facing soft sprites in one draw call (clouds, mist, smoke) ---------- */
function cloudTex(kind: "puff" | "mist") {
  return canvasTex(
    256,
    kind === "puff" ? 256 : 128,
    (g) => {
      const r = rng(kind === "puff" ? 3 : 8);
      const W = 256,
        Hh = kind === "puff" ? 256 : 128;
      g.clearRect(0, 0, W, Hh);
      const n = kind === "puff" ? 46 : 60;
      for (let i = 0; i < n; i++) {
        let x: number, y: number, rad: number;
        if (kind === "puff") {
          const a = r() * Math.PI * 2,
            d = Math.sqrt(r()) * 70;
          x = 128 + Math.cos(a) * d * 1.15;
          y = 140 + Math.sin(a) * d * 0.62 - (70 - d) * 0.35;
          rad = 26 + r() * 34 * (1 - d / 110);
        } else {
          x = 20 + r() * 216;
          y = 64 + (r() - 0.5) * 40;
          rad = 16 + r() * 30;
        }
        const grd = g.createRadialGradient(x, y - rad * 0.25, rad * 0.05, x, y, rad);
        const lit = kind === "puff" ? 0.55 + 0.45 * (1 - y / Hh) : 1;
        const v = Math.round(255 * lit);
        grd.addColorStop(0, `rgba(${v},${v},${v},${kind === "puff" ? 0.5 : 0.16})`);
        grd.addColorStop(0.6, `rgba(${v},${v},${v},${kind === "puff" ? 0.25 : 0.07})`);
        grd.addColorStop(1, `rgba(${v},${v},${v},0)`);
        g.fillStyle = grd;
        g.beginPath();
        if (kind === "puff") g.arc(x, y, rad, 0, Math.PI * 2);
        else g.ellipse(x, y, rad * 2.2, rad * 0.7, 0, 0, Math.PI * 2);
        g.fill();
      }
    },
    false
  );
}
function sprites(
  env: Env,
  items: { x: number; y: number; z: number; w: number; h: number; rot?: number; b?: number }[],
  o: { tex: THREE.Texture; lit: THREE.Color; shadow: THREE.Color; opacity: number; drift: THREE.Vector3; wrapX?: number; hazeK?: number; sunLit?: number; additive?: boolean }
) {
  const n = items.length;
  const base = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  g.setAttribute("position", base.attributes.position);
  g.setAttribute("uv", base.attributes.uv);
  const c = new Float32Array(n * 4),
    s = new Float32Array(n * 4);
  items.forEach((it, i) => {
    c.set([it.x, it.y, it.z, it.b ?? 1], i * 4);
    s.set([it.w, it.h, it.rot ?? 0, Math.random()], i * 4);
  });
  g.setAttribute("aC", new THREE.InstancedBufferAttribute(c, 4));
  g.setAttribute("aS", new THREE.InstancedBufferAttribute(s, 4));
  g.instanceCount = n;
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      ...env,
      uTex: { value: o.tex },
      uLit: { value: o.lit },
      uShadow: { value: o.shadow },
      uOp: { value: o.opacity },
      uDrift: { value: o.drift },
      uWrap: { value: o.wrapX ?? 0 },
      uHazeK: { value: o.hazeK ?? 1 },
      uSunLit: { value: o.sunLit ?? 0.5 },
    },
    vertexShader: /* glsl */ `attribute vec4 aC; attribute vec4 aS; uniform float uTime, uWrap; uniform vec3 uDrift;
      varying vec2 vUv; varying float vB; varying float vNear; varying vec3 vW; varying float vY;
      void main(){ vec3 c = aC.xyz + uDrift * uTime * (0.7 + aS.w * 0.6);
        if (uWrap > 0.0) c.x = mod(c.x + uWrap, uWrap * 2.0) - uWrap;
        vec4 w = modelMatrix * vec4(c, 1.0); vW = w.xyz;
        vec4 mv = viewMatrix * w; float r = aS.z + sin(uTime * 0.03 + aS.w * 6.0) * 0.05;
        vec2 q = position.xy * aS.xy; mv.xy += vec2(cos(r) * q.x - sin(r) * q.y, sin(r) * q.x + cos(r) * q.y);
        vUv = uv; vB = aC.w; vY = position.y + 0.5; vNear = smoothstep(1.0, 10.0, -mv.z);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `uniform sampler2D uTex; uniform float uFade, uOp, uHazeK, uSunLit; uniform vec3 uLit, uShadow, uSunCol;
      varying vec2 vUv; varying float vB; varying float vNear; varying vec3 vW; varying float vY;
      ${HAZE_GLSL}
      void main(){ vec4 t = texture2D(uTex, vUv); if (t.a < 0.003) discard;
        vec3 V = normalize(vW - cameraPosition);
        float fwd = pow(max(dot(V, uSunDir), 0.0), 4.0);
        vec3 col = mix(uShadow, uLit, smoothstep(0.4, 1.0, t.r * (0.5 + vY * 0.75))) * vB;
        col += uSunCol * uSunLit * fwd * (1.0 - t.a) * 0.6;
        col = applyHaze(col, vW, uHazeK);
        gl_FragColor = vec4(col, t.a * uOp * vNear * uFade); ${OUT} }`,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  return { mesh, mat: m };
}

/* ---------- spruce / pine forests (instanced, two LODs) ---------- */
function spruceGeo(layers: number, radial: number, seed: number) {
  const r = rng(seed);
  const pos: number[] = [],
    col: number[] = [];
  const push = (v: number[], c: number) => {
    pos.push(v[0], v[1], v[2]);
    col.push(c, c * 1.02, c * 0.95);
  };
  // trunk
  const tr = 0.025;
  for (let i = 0; i < 5; i++) {
    const a0 = (i / 5) * Math.PI * 2,
      a1 = ((i + 1) / 5) * Math.PI * 2;
    const p0 = [Math.cos(a0) * tr, 0, Math.sin(a0) * tr],
      p1 = [Math.cos(a1) * tr, 0, Math.sin(a1) * tr];
    const q0 = [p0[0], 0.3, p0[2]],
      q1 = [p1[0], 0.3, p1[2]];
    push(p0, 0.35);
    push(q0, 0.3);
    push(p1, 0.35);
    push(p1, 0.35);
    push(q0, 0.3);
    push(q1, 0.3);
  }
  for (let L = 0; L < layers; L++) {
    const fr = L / (layers - 1);
    const y0 = 0.1 + fr * 0.74 + (r() - 0.5) * 0.03;
    const y1 = y0 + 0.3 - fr * 0.12;
    const rad = 0.3 * Math.pow(1 - fr, 1.1) + 0.035;
    const apex = [(r() - 0.5) * 0.02, y1, (r() - 0.5) * 0.02];
    const ring: number[][] = [],
      inner: number[][] = [];
    const off = r() * 6;
    for (let i = 0; i < radial; i++) {
      const a = (i / radial) * Math.PI * 2 + off;
      const rr = rad * (0.7 + r() * 0.6);
      ring.push([Math.cos(a) * rr, y0 - r() * 0.05 * (1 - fr), Math.sin(a) * rr]);
      inner.push([Math.cos(a) * rr * 0.3, y0 + 0.07, Math.sin(a) * rr * 0.3]);
    }
    const lit = 0.75 + fr * 0.35;
    for (let i = 0; i < radial; i++) {
      const a = ring[i],
        b = ring[(i + 1) % radial];
      push(apex, lit * 0.6);
      push(b, lit);
      push(a, lit);
      push(a, 0.28);
      push(b, 0.28);
      push(inner[i], 0.12);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  // bend normals outward/upward for soft foliage shading
  const nrm = g.attributes.normal as THREE.BufferAttribute;
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < nrm.count; i++) {
    const v = new THREE.Vector3(p.getX(i), 0.35, p.getZ(i)).normalize();
    const n = new THREE.Vector3(nrm.getX(i), nrm.getY(i), nrm.getZ(i)).lerp(v, 0.6).normalize();
    nrm.setXYZ(i, n.x, n.y, n.z);
  }
  return g;
}
function forest(
  f: Fader,
  o: { n: number; seed: number; tint: string; pick: (r: () => number) => [number, number] | null; height: (x: number, z: number) => number; size: [number, number]; far?: boolean; emissive?: string }
) {
  const r = rng(o.seed);
  const geo = o.far ? spruceGeo(4, 6, o.seed + 1) : spruceGeo(8, 8, o.seed + 1);
  const mat = f.mat(new THREE.MeshLambertMaterial({ vertexColors: true, color: C(o.tint), emissive: C(o.emissive ?? "#000000") }));
  mat.depthWrite = true;
  const im = new THREE.InstancedMesh(geo, mat, o.n);
  const d = new THREE.Object3D();
  const cc = new THREE.Color();
  let k = 0;
  for (let tries = 0; tries < o.n * 12 && k < o.n; tries++) {
    const p = o.pick(r);
    if (!p) continue;
    const [x, z] = p;
    const s = o.size[0] + Math.pow(r(), 1.5) * (o.size[1] - o.size[0]);
    d.position.set(x, o.height(x, z) - 0.15 * s, z);
    d.rotation.set((r() - 0.5) * 0.06, r() * Math.PI * 2, (r() - 0.5) * 0.06);
    d.scale.set(s * (0.75 + r() * 0.4), s, s * (0.75 + r() * 0.4));
    d.updateMatrix();
    im.setMatrixAt(k, d.matrix);
    cc.setScalar(0.7 + r() * 0.5);
    cc.g *= 0.95 + r() * 0.12;
    im.setColorAt(k, cc);
    k++;
  }
  im.count = k;
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.computeBoundingSphere();
  return im;
}

/* ---------- lake with a real (low-res) planar reflection + ripples + sun glints ---------- */
function lake(env: Env, ctx: Ctx, o: { y: number; w: number; d: number; z: number; deep: string; shallow: string; distort: number; ripple: number; refl: number; glint: number; normalK: number; shoreFade?: number }) {
  const scale = ctx.lite ? 0.35 : 0.6;
  const geo = new THREE.PlaneGeometry(o.w, o.d);
  const refl = new Reflector(geo, {
    textureWidth: Math.round(window.innerWidth * scale),
    textureHeight: Math.round(window.innerHeight * scale),
    clipBias: 0.002,
    multisample: 0,
    shader: {
      name: "LakeWater",
      uniforms: {
        tDiffuse: { value: null },
        color: { value: null },
        textureMatrix: { value: null },
        uFade: { value: 0 },
        uTime: { value: 0 },
        uNoise: { value: null },
        uSunDir: { value: null },
        uSunCol: { value: null },
        uHaze: { value: null },
        uHazeSun: { value: null },
        uHazeDen: { value: 0 },
        uHazeFloor: { value: 0 },
        uDeep: { value: C(o.deep) },
        uShallow: { value: C(o.shallow) },
        uDist: { value: o.distort },
        uRip: { value: o.ripple },
        uRefl: { value: o.refl },
        uGlint: { value: o.glint },
        uNK: { value: o.normalK },
      },
      vertexShader: /* glsl */ `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
        void main(){ vUv = textureMatrix * vec4(position, 1.0); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `uniform sampler2D tDiffuse, uNoise; uniform float uFade, uTime, uDist, uRip, uRefl, uGlint, uNK; uniform vec3 uDeep, uShallow, uSunCol;
        varying vec4 vUv; varying vec3 vW;
        ${HAZE_GLSL}
        void main(){
          vec3 toC = cameraPosition - vW; float dist = length(toC); vec3 V = toC / dist;
          vec2 p = vW.xz * uRip;
          vec4 a = texture2D(uNoise, p * vec2(1.0, 2.2) + vec2(uTime * 0.006, uTime * 0.011));
          vec4 b = texture2D(uNoise, p * vec2(2.7, 5.0) - vec2(uTime * 0.012, -uTime * 0.017));
          vec4 c = texture2D(uNoise, p * vec2(9.0, 16.0) + vec2(uTime * 0.03, uTime * 0.02));
          vec2 r = (a.rg - 0.5) + (b.gb - 0.5) * 0.7 + (c.rb - 0.5) * 0.35;
          float att = 1.0 / (1.0 + dist * 0.02);
          vec3 N = normalize(vec3(r.x * uNK * att, 1.0, r.y * uNK * att));
          vec4 uv = vUv; uv.xy += r * uDist * uv.w * (0.3 + att);
          vec3 refl = texture2DProj(tDiffuse, uv).rgb;
          float fres = 0.12 + 0.88 * pow(1.0 - max(dot(N, V), 0.0), 3.0);
          vec3 body = mix(uShallow, uDeep, smoothstep(4.0, 45.0, dist));
          vec3 col = mix(body, refl, clamp(fres * uRefl, 0.0, 1.0));
          vec3 R = reflect(-V, N);
          float gs = max(dot(R, uSunDir), 0.0);
          float spark = smoothstep(0.62, 0.9, c.b) * smoothstep(0.55, 0.8, b.r);
          col += uSunCol * uGlint * (pow(gs, 900.0) * 6.0 + pow(gs, 60.0) * 0.25 * spark * 4.0);
          col = applyHaze(col, vW, 0.6);
          gl_FragColor = vec4(col, uFade);
          ${OUT}
        }`,
    },
  });
  const m = refl.material as THREE.ShaderMaterial;
  m.transparent = true;
  m.depthWrite = true;
  const u = m.uniforms;
  for (const k of ["uFade", "uTime", "uNoise", "uSunDir", "uSunCol", "uHaze", "uHazeSun", "uHazeDen", "uHazeFloor"] as const) u[k] = (env as Record<string, U<unknown>>)[k];
  refl.rotation.x = -Math.PI / 2;
  refl.position.set(0, o.y, o.z);
  return refl;
}

/* ---------- birds (instanced, wings flap in the vertex shader) ---------- */
function birdFlock(env: Env, n: number, color: string, flapAmp = 1) {
  const pos = [0, 0, 0.28, -0.06, 0, -0.1, 0.06, 0, -0.1, 0, 0, 0.12, -1, 0, -0.08, 0, 0, -0.14, 0, 0, 0.12, 0, 0, -0.14, 1, 0, -0.08, -0.55, 0, 0.02, -1, 0, -0.08, 0, 0, 0.1, 1, 0, -0.08, 0.55, 0, 0.02, 0, 0, 0.1];
  const flap: number[] = [];
  for (let i = 0; i < pos.length; i += 3) flap.push(Math.abs(pos[i]));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aFlap", new THREE.Float32BufferAttribute(flap, 1));
  const ph = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) ph.set([Math.random() * 6.28, 7 + Math.random() * 3, 0], i * 3);
  const phA = new THREE.InstancedBufferAttribute(ph, 3);
  g.setAttribute("aB", phA);
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { ...env, uCol: { value: C(color) }, uAmp: { value: flapAmp } },
    vertexShader: /* glsl */ `attribute float aFlap; attribute vec3 aB; uniform float uTime, uAmp; varying vec3 vW;
      void main(){ vec3 p = position; float glide = aB.z; float fl = sin(uTime * aB.y + aB.x) * (1.0 - glide);
        p.y += (fl * 0.55 + glide * 0.12) * aFlap * uAmp; p.x *= 1.0 - abs(fl) * 0.08;
        vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `uniform vec3 uCol; uniform float uFade; varying vec3 vW; ${HAZE_GLSL}
      void main(){ gl_FragColor = vec4(applyHaze(uCol, vW, 1.0), uFade); ${OUT} }`,
  });
  const im = new THREE.InstancedMesh(g, m, n);
  im.frustumCulled = false;
  im.renderOrder = 4;
  const d = new THREE.Object3D();
  const prev = new THREE.Vector3();
  return {
    mesh: im,
    /* path(i, t, out) writes bird i's position; heading follows the path; glide 0..1 */
    update(t: number, path: (i: number, t: number, out: THREE.Vector3) => number, size: number) {
      for (let i = 0; i < n; i++) {
        const glide = path(i, t - 0.05, prev);
        path(i, t, d.position);
        d.lookAt(d.position.x * 2 - prev.x, d.position.y * 2 - prev.y, d.position.z * 2 - prev.z);
        const turn = Math.atan2(d.position.x - prev.x, d.position.z - prev.z);
        d.rotateZ(Math.sin(turn * 3 + t * 0.2) * 0.12);
        d.scale.setScalar(size * (0.85 + ((i * 37) % 10) * 0.03));
        d.updateMatrix();
        im.setMatrixAt(i, d.matrix);
        ph[i * 3 + 2] = glide;
      }
      im.instanceMatrix.needsUpdate = true;
      phA.needsUpdate = true;
    },
  };
}

/* ---------- soft light shafts texture ---------- */
function raysTex() {
  return canvasTex(
    512,
    512,
    (g) => {
      const r = rng(21);
      g.translate(256, 256);
      for (let i = 0; i < 70; i++) {
        const a = r() * Math.PI * 2,
          w = 0.01 + r() * 0.05,
          len = 150 + r() * 106;
        const grd = g.createRadialGradient(0, 0, 0, 0, 0, len);
        const k = 0.05 + r() * 0.12;
        grd.addColorStop(0, `rgba(255,255,255,${k})`);
        grd.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grd;
        g.beginPath();
        g.moveTo(0, 0);
        g.arc(0, 0, len, a - w, a + w);
        g.closePath();
        g.fill();
      }
      const grd = g.createRadialGradient(0, 0, 0, 0, 0, 256);
      grd.addColorStop(0, "rgba(255,255,255,0.45)");
      grd.addColorStop(0.2, "rgba(255,255,255,0.1)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grd;
      g.fillRect(-256, -256, 512, 512);
    },
    false
  );
}

function lights(f: Fader, group: THREE.Group, o: { sky: string; ground: string; hemi: number; sun: string; sunI: number; dir: THREE.Vector3 }) {
  group.add(f.light(new THREE.HemisphereLight(o.sky, o.ground, o.hemi)));
  const d = f.light(new THREE.DirectionalLight(o.sun, o.sunI));
  d.position.copy(o.dir).multiplyScalar(50);
  group.add(d);
  group.add(d.target);
}

/* ===================================================================================
 * 1. ARCTIC NORTHERN LIGHTS
 * =================================================================================== */
export function aurora(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  const lite = ctx.lite;
  const moonDir = new THREE.Vector3(-0.55, 0.32, 0.35).normalize();
  const env = makeEnv(f, {
    sunDir: moonDir,
    sun: C("#9db4e8", 0.95),
    sky: C("#1b3056", 0.26).add(C("#0f3b2e", 0.16)),
    bounce: C("#0e2a2a", 0.3),
    haze: C("#08162a"),
    hazeSun: C("#0d2038"),
    hazeDen: 0.0036,
    hazeFloor: -2,
  });

  group.add(
    skyDome(env, {
      zenith: "#010309",
      mid: "#030b1c",
      horizon: "#0a1a2e",
      below: "#07111f",
      glow: "#1a2a4a",
      glowK: 0.3,
      band: "#0b4a32",
      bandK: 0.22,
    })
  );
  group.add(starField(env, ctx, lite ? 1400 : 3000));

  /* aurora curtains: several folded sheets, each with 2-3 parallel layers for thickness */
  {
    // each curtain runs from (x0,z0) to (x1,z1); some recede diagonally into the distance
    const curtains = [
      { x0: -330, z0: -260, x1: 180, z1: -430, y0: 45, h: 150, amp: 34, seed: 0.3, sheets: 3, b: 1.1 },
      { x0: -60, z0: -340, x1: 460, z1: -310, y0: 58, h: 160, amp: 40, seed: 2.1, sheets: 3, b: 0.7 },
      { x0: -470, z0: -430, x1: -60, z1: -370, y0: 75, h: 160, amp: 44, seed: 4.4, sheets: 2, b: 0.45 },
    ];
    const M = lite ? 90 : 170,
      V = 5;
    const pos: number[] = [],
      uv: number[] = [],
      seed: number[] = [],
      bright: number[] = [],
      idx: number[] = [];
    for (const c of curtains)
      for (let s = 0; s < c.sheets; s++) {
        const sd = c.seed + s * 0.37;
        const start = pos.length / 3;
        const len = Math.hypot(c.x1 - c.x0, c.z1 - c.z0);
        const nx = -(c.z1 - c.z0) / len,
          nz = (c.x1 - c.x0) / len;
        for (let i = 0; i <= M; i++) {
          const u = i / M;
          const off = s * 5 + Math.sin(u * 7.5 + sd) * c.amp + Math.sin(u * 19 + sd * 2) * c.amp * 0.25;
          const x = c.x0 + (c.x1 - c.x0) * u + nx * off;
          const z = c.z0 + (c.z1 - c.z0) * u + nz * off;
          for (let k = 0; k <= V; k++) {
            const v = k / V;
            pos.push(x + v * 18, c.y0 + v * c.h * (lite ? 1.6 : 1) - s * 3, z - v * 25);
            uv.push((u * len) / 45, v);
            seed.push(sd);
            bright.push(c.b * (s === 0 ? 1 : 0.5), u);
          }
        }
        for (let i = 0; i < M; i++)
          for (let k = 0; k < V; k++) {
            const a = start + i * (V + 1) + k,
              b = a + V + 1;
            idx.push(a, b, a + 1, a + 1, b, b + 1);
          }
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
    g.setAttribute("aB", new THREE.Float32BufferAttribute(bright, 2));
    g.setIndex(idx);
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uFade: env.uFade, uTime: env.uTime, uNoise: env.uNoise },
      vertexShader: /* glsl */ `attribute float aSeed; attribute vec2 aB; uniform float uTime; varying vec2 vUv; varying float vSeed; varying vec2 vB;
        void main(){ vUv = uv; vSeed = aSeed; vB = aB; vec3 p = position; float u = uv.x;
          p.z += (sin(u * 0.55 + uTime * 0.045 + aSeed * 5.0) * 26.0 + sin(u * 1.7 - uTime * 0.08 + aSeed * 3.0) * 8.0 + sin(u * 4.3 + uTime * 0.16) * 2.5) * (1.0 + uv.y * 0.4);
          p.x += sin(u * 0.9 + uTime * 0.035 + aSeed) * 10.0 * uv.y;
          p.y += sin(u * 0.7 - uTime * 0.05 + aSeed * 2.0) * 8.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: /* glsl */ `uniform sampler2D uNoise; uniform float uTime, uFade; varying vec2 vUv; varying float vSeed; varying vec2 vB;
        void main(){
          float u = vUv.x, v = vUv.y;
          float e0 = texture2D(uNoise, vec2(u * 0.11 + uTime * 0.004 + vSeed, 0.37)).r;
          float e1 = texture2D(uNoise, vec2(u * 0.6 - uTime * 0.012 + vSeed * 1.7, 0.71)).g;
          float edge = v - (e0 - 0.5) * 0.18 - (e1 - 0.5) * 0.05;
          // rays: tall, thin, drifting sideways along the curtain
          float r1 = texture2D(uNoise, vec2(u * 1.3 + uTime * 0.018 + vSeed, v * 0.035 + vSeed)).b;
          float r2 = texture2D(uNoise, vec2(u * 3.7 - uTime * 0.035 + vSeed * 3.0, v * 0.06 + 0.5)).b;
          float r3 = texture2D(uNoise, vec2(u * 9.0 + uTime * 0.05, v * 0.1)).r;
          float rays = smoothstep(0.35, 0.95, r1) * 1.1 + smoothstep(0.45, 1.0, r2) * 0.9 + smoothstep(0.5, 1.0, r3) * 0.5;
          // big slow brightness pulses travelling along the band
          float big = texture2D(uNoise, vec2(u * 0.045 - uTime * 0.0035 + vSeed * 0.3, 0.2 + vSeed * 0.1)).g;
          big = smoothstep(0.33, 0.85, big) * (0.7 + 0.3 * sin(uTime * 0.4 + u * 0.8 + vSeed * 4.0));
          float lower = smoothstep(-0.02, 0.06, edge);
          float prof = lower * (exp(-max(edge, 0.0) * 3.4) + 0.1 * exp(-max(edge, 0.0) * 0.7)) + 0.05 * exp(-abs(edge) * 12.0);
          float ends = smoothstep(0.0, 0.12, vB.y) * smoothstep(1.0, 0.85, vB.y);
          float top = 1.0 - smoothstep(0.55, 1.0, v);
          vec3 green = vec3(0.2, 1.0, 0.36);
          vec3 cyan = vec3(0.35, 1.0, 0.25);
          vec3 violet = vec3(0.5, 0.12, 0.75);
          vec3 crimson = vec3(0.8, 0.1, 0.35);
          vec3 col = mix(green, cyan, smoothstep(0.25, 0.5, e1) * 0.35);
          col = mix(col, violet, smoothstep(0.32, 0.75, edge) * 0.8);
          col = mix(col, crimson, smoothstep(0.65, 0.95, edge) * 0.6);
          col += vec3(0.9, 0.25, 0.6) * smoothstep(0.03, 0.0, abs(edge - 0.005)) * 0.35 * big;
          float I = prof * (0.3 + rays * 0.85) * big * ends * top * vB.x * 0.7;
          gl_FragColor = vec4(col * I, uFade);
          ${OUT}
        }`,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.renderOrder = -8;
    mesh.frustumCulled = false;
    group.add(mesh);
  }

  /* terrain: far range, mid range, lake shore land */
  const far = heightfield({
    x0: -520,
    x1: 520,
    z0: -300,
    z1: -170,
    sx: lite ? 140 : 280,
    sz: lite ? 30 : 56,
    sun: moonDir,
    h: (x, z) => rangeH(x, z, { z0: -300, z1: -170, H: 120, f: 0.011, seed: 3.3, base: -8, peaks: [[-60, -245, 70, 80], [140, -250, 80, 65], [-230, -240, 70, 50]] }),
  });
  const mid = heightfield({
    x0: -340,
    x1: 340,
    z0: -190,
    z1: -95,
    sx: lite ? 120 : 250,
    sz: lite ? 30 : 60,
    sun: moonDir,
    h: (x, z) => rangeH(x, z, { z0: -190, z1: -95, H: 60, f: 0.016, seed: 7.7, base: -6, peaks: [[40, -150, 45, 32], [-95, -160, 40, 26]] }),
  });
  const cab = new THREE.Vector3(-17, 0, -20);
  const landH = (x: number, z: number) => {
    const rx = x < 0 ? 15 : 24;
    const wob = (fbm2(x * 0.035 + 1.3, z * 0.035, 4) - 0.5) * 0.5;
    const e = Math.hypot(x / rx, (z + 32) / 46) - 1 + wob;
    const rise = sstep(e, -0.1, 0.7);
    const ec = clamp(e, 0, 3.5);
    const r = ridged(x * 0.02 + 5, z * 0.02, 5);
    let h = -2.9 + rise * (1.6 + fbm2(x * 0.03, z * 0.03 + 7, 4) * 3.5) + Math.pow(r, 1.4) * ec * ec * 3.2;
    const dc = Math.hypot(x - cab.x, z - cab.z);
    h = THREE.MathUtils.lerp(h, -1.25, 1 - sstep(dc, 3, 6));
    return h;
  };
  const land = heightfield({ x0: -230, x1: 230, z0: -130, z1: 16, sx: lite ? 110 : 220, sz: lite ? 45 : 90, sun: moonDir, h: landH });
  const tLook = { rockA: "#0b0c10", rockB: "#1a1c22", snow: "#c3d0e6", snowLine: -30, snowSlope: 0.4 };
  group.add(new THREE.Mesh(far.geo, terrainMat(env, { ...tLook, hazeK: 0.55 })));
  group.add(new THREE.Mesh(mid.geo, terrainMat(env, { ...tLook, snowSlope: 0.52 })));
  group.add(new THREE.Mesh(land.geo, terrainMat(env, { ...tLook, snowSlope: 0.6 })));

  /* forests */
  const treeOk = (x: number, z: number, h: number, sl: number) => h > -1.7 && sl < 0.55 && Math.hypot(x - cab.x, z - cab.z) > 3.2;
  group.add(
    forest(f, {
      n: lite ? 420 : 1100,
      seed: 4,
      tint: "#2c4540",
      size: [1.6, 4.2],
      height: land.sample,
      pick: (r) => {
        const x = (r() - 0.5) * 150,
          z = -r() * 110 + 8;
        const h = land.sample(x, z);
        return treeOk(x, z, h, land.slope(x, z)) && h < 16 && r() < 0.9 ? [x, z] : null;
      },
    })
  );
  group.add(
    forest(f, {
      n: lite ? 400 : 1200,
      seed: 9,
      tint: "#2c4542",
      size: [2.2, 4.5],
      far: true,
      height: (x, z) => Math.max(land.sample(x, z), mid.sample(x, z)),
      pick: (r) => {
        const x = (r() - 0.5) * 360,
          z = -95 - r() * 55;
        const h = mid.sample(x, z);
        return h > -1 && h < 14 && mid.slope(x, z) < 0.6 ? [x, z] : null;
      },
    })
  );

  /* cabin with warm window, snowy roof and chimney smoke */
  let cabinLight: THREE.PointLight;
  {
    const logs = canvasTex(256, 128, (g) => {
      g.fillStyle = "#3a2618";
      g.fillRect(0, 0, 256, 128);
      for (let y = 0; y < 128; y += 11) {
        const grd = g.createLinearGradient(0, y, 0, y + 11);
        grd.addColorStop(0, "#5a3b24");
        grd.addColorStop(0.5, "#402a1a");
        grd.addColorStop(1, "#1e130b");
        g.fillStyle = grd;
        g.fillRect(0, y, 256, 11);
      }
    });
    const cabin = new THREE.Group();
    const wallM = f.mat(new THREE.MeshLambertMaterial({ map: logs, color: "#b09080" }));
    const snowM = f.mat(new THREE.MeshLambertMaterial({ color: "#e8eef8" }));
    const winM = f.mat(new THREE.MeshBasicMaterial({ color: C("#ffae55", 3.2) }));
    [wallM, snowM, winM].forEach((m) => (m.depthWrite = true));
    const body = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, 2.2), wallM);
    body.position.y = 0.8;
    cabin.add(body);
    const gable = new THREE.Shape([new THREE.Vector2(-1.5, 0), new THREE.Vector2(1.5, 0), new THREE.Vector2(0, 1.1)]);
    const gg = new THREE.ExtrudeGeometry(gable, { depth: 2.2, bevelEnabled: false });
    gg.translate(0, 1.6, -1.1);
    cabin.add(new THREE.Mesh(gg, wallM));
    const roofL = new THREE.BoxGeometry(1.95, 0.16, 2.7);
    const r1 = new THREE.Mesh(roofL, snowM);
    r1.position.set(-0.78, 2.2, 0);
    r1.rotation.z = 0.63;
    const r2 = r1.clone();
    r2.position.x = 0.78;
    r2.rotation.z = -0.63;
    cabin.add(r1, r2);
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.9, 0.32), wallM);
    chim.position.set(0.7, 2.5, -0.4);
    cabin.add(chim);
    const w1 = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.5), winM);
    w1.position.set(0.55, 0.9, 1.111);
    const w2 = w1.clone();
    w2.position.x = -0.6;
    const w3 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.45), winM);
    w3.rotation.y = Math.PI / 2;
    w3.position.set(1.511, 0.9, 0.2);
    cabin.add(w1, w2, w3);
    const halo = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: C("#ff9a40", 1), blending: THREE.AdditiveBlending, depthWrite: false }), 0.55));
    halo.scale.set(4.5, 3, 1);
    halo.position.set(0, 0.95, 1.4);
    cabin.add(halo);
    cabinLight = f.light(new THREE.PointLight("#ff9544", 14, 14, 1.6));
    cabinLight.position.set(0, 1.0, 2.4);
    cabin.add(cabinLight);
    cabin.position.set(cab.x, landH(cab.x, cab.z) - 0.1, cab.z);
    cabin.rotation.y = 0.55;
    cabin.scale.setScalar(0.95);
    group.add(cabin);
    // smoke
    const n = lite ? 40 : 70;
    const sp = new Float32Array(n * 3),
      ss = new Float32Array(n);
    for (let i = 0; i < n; i++) ss[i] = i / n;
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    sg.setAttribute("aSeed", new THREE.BufferAttribute(ss, 1));
    cabin.updateMatrixWorld();
    const top = new THREE.Vector3(0.7, 3.0, -0.4).applyMatrix4(cabin.matrixWorld);
    const sm = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uFade: env.uFade, uTime: env.uTime, uPx: { value: pxScale(ctx) }, uO: { value: top } },
      vertexShader: /* glsl */ `attribute float aSeed; uniform float uTime, uPx; uniform vec3 uO; varying float vA;
        void main(){ float l = fract(uTime * 0.045 + aSeed); float s = aSeed * 91.7;
          vec3 p = uO + vec3(l * l * 7.0 + sin(s + uTime * 0.3) * l * 1.2, l * 9.0, cos(s) * l * 1.5);
          vec4 mv = modelViewMatrix * vec4(p, 1.0); vA = step(-1.9, cameraPosition.y) * smoothstep(0.0, 0.08, l) * (1.0 - l);
          gl_PointSize = (0.5 + l * 4.5) * uPx / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */ `uniform float uFade; varying float vA; void main(){ vec2 p = gl_PointCoord - 0.5; float a = exp(-dot(p, p) * 12.0) * vA * 0.09;
        gl_FragColor = vec4(vec3(0.45, 0.5, 0.6), a * uFade); ${OUT} }`,
    });
    const smoke = new THREE.Points(sg, sm);
    smoke.frustumCulled = false;
    smoke.renderOrder = 5;
    group.add(smoke);
  }

  /* still, dark mirror lake */
  group.add(lake(env, ctx, { y: -2, w: 420, d: 150, z: -50, deep: "#02060d", shallow: "#06101c", distort: 0.0025, ripple: 0.045, refl: 0.9, glint: 0.0, normalK: 0.12 }));

  /* gentle falling snow */
  group.add(drift(env, ctx, { n: lite ? 500 : 1300, center: new THREE.Vector3(0, 3, -6), box: new THREE.Vector3(44, 16, 34), vel: new THREE.Vector3(0.35, -0.9, 0.05), size: 0.055, color: C("#dfe8ff", 0.9), wobble: 0.5 }));

  lights(f, group, { sky: "#35507f", ground: "#0b1220", hemi: 0.55, sun: "#a8bff0", sunI: 0.55, dir: moonDir });
  const auroraL = f.light(new THREE.DirectionalLight("#40ffa0", 0.35));
  auroraL.position.set(0, 40, -100);
  group.add(auroraL);

  return {
    group,
    fade: f,
    bg: new THREE.Color("#020610"),
    fog: new THREE.Color("#08162a"),
    fogDensity: 0.0075,
    update: (t) => {
      env.uTime.value = t;
      cabinLight.intensity = 14 * f.value * (0.92 + 0.08 * Math.sin(t * 7.3) * Math.sin(t * 3.1));
      auroraL.intensity = 0.35 * f.value * (0.8 + 0.2 * Math.sin(t * 0.3));
    },
    view: (t, pos, look) => {
      pos.set(Math.sin(t * 0.035) * 3.5, 0.9 + Math.sin(t * 0.05) * 0.25, 8 + Math.sin(t * 0.025) * 2.5);
      look.set(Math.sin(t * 0.035 + 0.8) * 7, lite ? 14 : 9, -80);
    },
  };
}

/* ===================================================================================
 * 2. GOLDEN SUMMIT — peaks at golden hour above a sea of clouds
 * =================================================================================== */
export function summit(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  const lite = ctx.lite;
  const sunDir = new THREE.Vector3(0.62, 0.075, -0.78).normalize();
  const env = makeEnv(f, {
    sunDir,
    sun: C("#ffb46a", 2.8),
    sky: C("#6a82c0", 0.6),
    bounce: C("#e0a070", 0.18),
    haze: C("#c0937e"),
    hazeSun: C("#ffb86a"),
    hazeDen: 0.0019,
    hazeFloor: -4,
  });
  group.add(
    skyDome(env, {
      zenith: "#23406f",
      mid: "#8f8aa0",
      horizon: "#ffb472",
      below: "#d9a27a",
      glow: "#ffb35c",
      glowK: 1.4,
      sunDisc: "#fff3d6",
      sunSize: 0.0009,
    })
  );
  // sun glow + rays billboard
  const sunPos = sunDir.clone().multiplyScalar(470);
  const rays = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: raysTex(), color: C("#ffc47a", 0.9), blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), 0.3));
  rays.position.copy(sunPos);
  rays.scale.set(380, 380, 1);
  rays.renderOrder = -7;
  group.add(rays);
  const glow = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: C("#ffd79a", 1.4), blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), 0.9));
  glow.position.copy(sunPos);
  glow.scale.set(70, 70, 1);
  glow.renderOrder = -7;
  group.add(glow);

  const cloudY = -3.5;
  const look: TerrainLook = { rockA: "#26221f", rockB: "#474039", snow: "#fff1e2", snowLine: 2, snowSlope: 0.72, mist: "#e2b08e", mistY: cloudY - 1, mistH: 5, mistAmt: 0.85, rimK: 1.4 };
  const far = heightfield({
    x0: -560,
    x1: 560,
    z0: -380,
    z1: -210,
    sx: lite ? 140 : 280,
    sz: lite ? 30 : 60,
    sun: sunDir,
    h: (x, z) => rangeH(x, z, { z0: -380, z1: -210, H: 90, f: 0.009, seed: 12.1, base: -14, peaks: [[-160, -300, 70, 50]] }),
  });
  const main = heightfield({
    x0: -260,
    x1: 260,
    z0: -200,
    z1: -50,
    sx: lite ? 130 : 260,
    sz: lite ? 45 : 90,
    sun: sunDir,
    shadowSoft: 3,
    h: (x, z) =>
      rangeH(x, z, {
        z0: -200,
        z1: -50,
        H: 48,
        f: 0.018,
        seed: 2.2,
        base: -16,
        vary: 0.6,
        peaks: [
          [-8, -128, 46, 58],
          [-70, -150, 42, 34],
          [70, -135, 40, 30],
        ],
      }),
  });
  // knife-edge rocky ridge in the foreground, rising to a small summit where the flag stands
  const ridgeH = (x: number, z: number) => {
    const ax = 7,
      az = -13,
      bx = 46,
      bz = -44;
    const L = Math.hypot(bx - ax, bz - az);
    const tx = (bx - ax) / L,
      tz = (bz - az) / L;
    const t = (x - ax) * tx + (z - az) * tz;
    const c = -(x - ax) * tz + (z - az) * tx;
    const crest = 1.6 - Math.max(0, t) * 0.12 - Math.pow(Math.max(0, -t), 1.3) * 1.6 + (fbm2(t * 0.15, 3.3, 4) - 0.5) * 3;
    const side = Math.abs(c + (fbm2(t * 0.1, 8, 3) - 0.5) * 3) * (c > 0 ? 1.2 : 1.5);
    const r = ridged(x * 0.16 + 3, z * 0.16, 6);
    const h = crest - side + (r - 0.5) * 3.4 - Math.pow(Math.max(0, side - 3), 1.3) * 0.5;
    return h > -2 ? h : -2 + (h + 2) * 3;
  };
  const near = heightfield({ x0: -10, x1: 70, z0: -60, z1: 0, sx: lite ? 80 : 160, sz: lite ? 60 : 120, sun: sunDir, shadowSoft: 1, h: ridgeH });
  group.add(new THREE.Mesh(far.geo, terrainMat(env, { ...look, snowLine: 18, hazeK: 1 })));
  group.add(new THREE.Mesh(main.geo, terrainMat(env, look)));
  group.add(new THREE.Mesh(near.geo, terrainMat(env, { ...look, snowLine: -1.5, snowSlope: 0.42, mist: "#e8c29a", mistAmt: 0.9, mistY: cloudY + 0.6, mistH: 4, hazeK: 0.6, cutY: cloudY + 0.3, cutH: 3 })));

  // summit flag + cairn on the foreground ridge
  let flagMat: THREE.ShaderMaterial;
  {
    let top = new THREE.Vector3(13, -100, -19);
    for (let x = 3; x < 16; x += 0.4)
      for (let z = -20; z < -8; z += 0.4) {
        const h = near.sample(x, z);
        if (h > top.y) top = new THREE.Vector3(x, h, z);
      }
    const poleM = f.mat(new THREE.MeshLambertMaterial({ color: "#2a241f" }));
    poleM.depthWrite = true;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 2.6, 6), poleM);
    pole.position.set(top.x, top.y + 1.2, top.z);
    group.add(pole);
    const fg = new THREE.PlaneGeometry(1.25, 0.8, 20, 8);
    fg.translate(0.625, 0, 0);
    flagMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      uniforms: { ...env, uCol: { value: C("#b3121c") } },
      vertexShader: /* glsl */ `uniform float uTime; varying float vS; varying vec3 vW;
        void main(){ vec3 p = position; float k = p.x / 1.25;
          float w = sin(p.x * 5.0 - uTime * 6.0) * 0.12 + sin(p.x * 9.0 - uTime * 9.5 + p.y * 3.0) * 0.04;
          p.z += w * k; p.y -= k * k * 0.1;
          vS = 0.6 + cos(p.x * 5.0 - uTime * 6.0) * 0.4 * k;
          vec4 wp = modelMatrix * vec4(p, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */ `uniform vec3 uCol, uSunCol, uSky; uniform float uFade; varying float vS; varying vec3 vW; ${HAZE_GLSL}
        void main(){ vec3 c = uCol * (uSunCol * 0.35 * vS + uSky * 0.6); gl_FragColor = vec4(applyHaze(c, vW, 1.0), uFade); ${OUT} }`,
    });
    const flag = new THREE.Mesh(fg, flagMat);
    flag.position.set(top.x, top.y + 2.1, top.z);
    flag.rotation.y = -0.4;
    group.add(flag);
    // climber silhouette, arms raised beside the flag
    const parts: THREE.BufferGeometry[] = [];
    const cap = (r0: number, len: number, x: number, y: number, rz: number) => {
      const g = new THREE.CapsuleGeometry(r0, len, 3, 6);
      g.rotateZ(rz);
      g.translate(x, y, 0);
      parts.push(g);
    };
    cap(0.05, 0.36, -0.06, 0.24, 0.08); // legs
    cap(0.05, 0.36, 0.06, 0.24, -0.08);
    cap(0.1, 0.3, 0, 0.66, 0); // torso + pack
    cap(0.035, 0.34, -0.17, 1.0, 0.45); // arms up
    cap(0.035, 0.34, 0.17, 1.0, -0.45);
    const head = new THREE.SphereGeometry(0.075, 8, 6);
    head.translate(0, 0.98, 0);
    parts.push(head);
    const pack = new THREE.BoxGeometry(0.2, 0.28, 0.12);
    pack.translate(0, 0.68, -0.1);
    parts.push(pack);
    const manM = f.mat(new THREE.MeshLambertMaterial({ color: "#241a16" }));
    manM.depthWrite = true;
    const man = new THREE.Mesh(mergeGeometries(parts.map((g) => g.toNonIndexed())), manM);
    man.position.set(top.x - 0.55, top.y - 0.05, top.z + 0.25);
    man.rotation.y = 0.6;
    man.scale.setScalar(0.95);
    group.add(man);
  }

  // cloud sea: stacked noise slices (volumetric look, soft where peaks meet it)
  const slices = lite ? 2 : 3;
  const cloudMats: THREE.ShaderMaterial[] = [];
  for (let s = 0; s < slices; s++) {
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        ...env,
        uLit: { value: C("#ffc88a", 1.3) },
        uShadow: { value: C("#6a5d88", 0.7) },
        uCover: { value: s === 0 ? 0.2 : 0.36 + s * 0.12 },
        uK: { value: s },
      },
      vertexShader: /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `uniform sampler2D uNoise; uniform float uTime, uFade, uCover, uK; uniform vec3 uLit, uShadow, uSunCol; varying vec3 vW; ${HAZE_GLSL}
        float dens(vec2 p){
          float a = texture2D(uNoise, p * 0.0026 + vec2(uTime * 0.0012, 0.0)).r;
          float b = 1.0 - texture2D(uNoise, p * 0.011 + vec2(uTime * 0.0022, uTime * 0.0006)).a;
          float c = 1.0 - texture2D(uNoise, p * 0.037 + vec2(uTime * 0.004, 0.0)).a;
          return a * 0.5 + b * 0.33 + c * 0.17;
        }
        void main(){
          vec2 p = vW.xz + vec2(uK * 37.0, uK * 11.0);
          float d = dens(p);
          float cov = smoothstep(uCover, uCover + 0.2, d);
          if (cov < 0.004) discard;
          vec2 sd = normalize(uSunDir.xz);
          float d2 = dens(p + sd * 4.0);
          float light = clamp(0.5 + (d - d2) * 9.0 + (d - uCover - 0.1) * 1.6 + uK * 0.1, 0.0, 1.0);
          light = light * light * (3.0 - 2.0 * light);
          vec3 col = mix(uShadow, uLit, light);
          vec3 V = normalize(vW - cameraPosition);
          float fwd = pow(max(dot(V, uSunDir), 0.0), 6.0);
          col += uSunCol * fwd * 0.35 * (1.1 - cov);
          col = applyHaze(col, vW, 0.75);
          float dist = length(vW - cameraPosition);
          float a = clamp(cov + smoothstep(120.0, 480.0, dist) * (1.0 - uK * 0.3), 0.0, 1.0);
          gl_FragColor = vec4(col, a * uFade * (uK == 0.0 ? 1.0 : 0.85));
          ${OUT}
        }`,
    });
    cloudMats.push(m);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(1400, 900), m);
    pl.rotation.x = -Math.PI / 2;
    pl.position.set(0, cloudY + s * 1.3, -350);
    pl.renderOrder = 1 + s;
    group.add(pl);
  }
  // the cloud sea's billowing surface: hundreds of lit puffs, sorted far -> near, one draw call
  {
    const r = rng(17);
    const items: { x: number; y: number; z: number; w: number; h: number; rot: number; b: number }[] = [];
    const n = lite ? 170 : 400;
    for (let i = 0; i < n; i++) {
      const z = -12 * Math.pow(36, r());
      const x = (r() - 0.5) * 2 * (25 + -z * 1.15);
      const w = 7 + -z * 0.2 + r() * 10;
      items.push({ x, y: cloudY + 0.4 + r() * 1.6 - w * 0.02, z, w, h: w * (0.42 + r() * 0.18), rot: (r() - 0.5) * 0.12, b: 0.85 + r() * 0.25 });
    }
    // wrap the foreground ridge's flanks in cloud
    for (let i = 0; i < (lite ? 10 : 18); i++) {
      const t = r();
      const w = 7 + r() * 8;
      items.push({ x: 4 + t * 34 + (r() - 0.5) * 8, y: cloudY + 1.2 + r() * 1.4, z: -10 - t * 28 + (r() - 0.5) * 6, w, h: w * 0.45, rot: (r() - 0.5) * 0.2, b: 0.95 + r() * 0.15 });
    }
    for (let i = 0; i < 6; i++) {
      const w = 6 + r() * 5;
      items.push({ x: 3 + r() * 12, y: cloudY + 1.6 + r() * 1.2, z: -7 - r() * 7, w, h: w * 0.42, rot: (r() - 0.5) * 0.2, b: 0.9 + r() * 0.15 });
    }
    items.sort((p, q) => p.z - q.z);
    const sp = sprites(env, items, { tex: cloudTex("puff"), lit: C("#ffc684", 1.45), shadow: C("#6d5f8e", 0.72), opacity: 0.95, drift: new THREE.Vector3(0.5, 0, 0), wrapX: 480, hazeK: 0.7, sunLit: 0.9 });
    sp.mesh.renderOrder = 5;
    group.add(sp.mesh);
  }
  // eagles soaring
  const eagles = birdFlock(env, 3, "#1c1410", 0.8);
  group.add(eagles.mesh);

  lights(f, group, { sky: "#8390b8", ground: "#5a3a28", hemi: 0.5, sun: "#ffc088", sunI: 1.6, dir: sunDir });

  return {
    group,
    fade: f,
    bg: new THREE.Color("#c99a7c"),
    fog: new THREE.Color("#c9926e"),
    fogDensity: 0.006,
    update: (t) => {
      env.uTime.value = t;
      rays.material.rotation = t * 0.004;
      eagles.update(
        t,
        (i, tt, out) => {
          const a = tt * (0.07 + i * 0.015) + i * 2.1;
          const R = 14 + i * 6;
          out.set(-20 + i * 22 + Math.cos(a) * R, 8 + i * 2.5 + Math.sin(tt * 0.2 + i) * 1.5, -60 - i * 12 + Math.sin(a) * R * 0.5);
          return clamp(0.4 + 0.8 * Math.sin(tt * 0.25 + i * 3), 0, 1);
        },
        1.5
      );
    },
    view: (t, pos, lk) => {
      pos.set(Math.sin(t * 0.03) * 6, 4.2 + Math.sin(t * 0.045) * 0.6, 8 + Math.sin(t * 0.021) * 3);
      lk.set(4 + Math.sin(t * 0.03 + 1.1) * 8, 10, -110);
    },
  };
}

/* ===================================================================================
 * 3. ALPINE LAKE SUNRISE
 * =================================================================================== */
export function alpine(ctx: Ctx): World {
  const group = new THREE.Group();
  const f = new Fader();
  const lite = ctx.lite;
  const sunDir = new THREE.Vector3(-0.52, 0.06, -0.85).normalize();
  const env = makeEnv(f, {
    sunDir,
    sun: C("#ffba88", 2.0),
    sky: C("#8fa6cc", 0.95),
    bounce: C("#5c6e70", 0.3),
    haze: C("#a9a6bb"),
    hazeSun: C("#ffc4a0"),
    hazeDen: 0.002,
    hazeFloor: -2,
  });
  group.add(
    skyDome(env, {
      zenith: "#3a67a6",
      mid: "#a3aecb",
      horizon: "#ffc49a",
      below: "#a9a3b6",
      glow: "#ffb888",
      glowK: 1.2,
      sunDisc: "#fff4e0",
      sunSize: 0.0008,
    })
  );
  const sunPos = sunDir.clone().multiplyScalar(470);
  const glow = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: glowTex(), color: C("#ffd2a8", 1.2), blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), 0.8));
  glow.position.copy(sunPos);
  glow.scale.set(90, 90, 1);
  glow.renderOrder = -7;
  group.add(glow);

  const tl: TerrainLook = {
    rockA: "#6a625c",
    rockB: "#948a80",
    snow: "#fbe6e6",
    grass: "#3a5a2a",
    grass2: "#5f7236",
    snowLine: 30,
    snowSlope: 0.55,
    grassLine: 10,
    mist: "#cfc6d2",
    mistY: -2.5,
    mistH: 3,
    mistAmt: 0.22,
    litLine: 6,
  };
  const far = heightfield({
    x0: -540,
    x1: 540,
    z0: -330,
    z1: -180,
    sx: lite ? 140 : 280,
    sz: lite ? 30 : 60,
    sun: sunDir,
    h: (x, z) => rangeH(x, z, { z0: -330, z1: -180, H: 105, f: 0.01, seed: 21.4, base: -10, peaks: [[60, -260, 80, 55], [-190, -270, 70, 40]] }),
  });
  const mid = heightfield({
    x0: -320,
    x1: 320,
    z0: -190,
    z1: -80,
    sx: lite ? 120 : 250,
    sz: lite ? 35 : 70,
    sun: sunDir,
    h: (x, z) => rangeH(x, z, { z0: -190, z1: -80, H: 62, f: 0.015, seed: 5.9, base: -7, peaks: [[-40, -140, 40, 26], [110, -150, 45, 30]] }),
  });
  const landH = (x: number, z: number) => {
    const rx = x < 0 ? 26 : 20;
    const wob = (fbm2(x * 0.03 + 8.3, z * 0.03, 4) - 0.5) * 0.45;
    const e = Math.hypot(x / rx, (z + 38) / 52) - 1 + wob;
    const rise = sstep(e, -0.1, 0.6);
    const ec = clamp(e, 0, 3.5);
    const r = ridged(x * 0.018 + 1, z * 0.018, 5);
    return -3 + rise * (1.5 + fbm2(x * 0.04, z * 0.04 + 2, 4) * 3) + Math.pow(r, 1.3) * ec * ec * 3.6;
  };
  const land = heightfield({ x0: -230, x1: 230, z0: -130, z1: 16, sx: lite ? 110 : 220, sz: lite ? 45 : 90, sun: sunDir, h: landH });
  group.add(new THREE.Mesh(far.geo, terrainMat(env, { ...tl, snowLine: 22, mistAmt: 0.0, litLine: -100 })));
  group.add(new THREE.Mesh(mid.geo, terrainMat(env, { ...tl, snowLine: 26, grassLine: 12, litLine: 12 })));
  group.add(new THREE.Mesh(land.geo, terrainMat(env, { ...tl, grassLine: 22, litLine: -6, hazeK: 0.7 })));

  group.add(
    forest(f, {
      n: lite ? 500 : 1300,
      seed: 31,
      tint: "#4c7c52",
      size: [1.8, 4.6],
      height: land.sample,
      pick: (r) => {
        const x = (r() - 0.5) * 170,
          z = -r() * 115 + 10;
        const h = land.sample(x, z);
        return h > -1.6 && h < 20 && land.slope(x, z) < 0.6 ? [x, z] : null;
      },
    })
  );
  group.add(
    forest(f, {
      n: lite ? 500 : 1400,
      seed: 37,
      tint: "#4a7650",
      size: [2.5, 5],
      far: true,
      height: mid.sample,
      pick: (r) => {
        const x = (r() - 0.5) * 380,
          z = -85 - r() * 60;
        const h = mid.sample(x, z);
        return h > -1.5 && h < 16 && mid.slope(x, z) < 0.65 ? [x, z] : null;
      },
    })
  );

  // wooden dock and a rowboat
  {
    const wood = canvasTex(128, 32, (g) => {
      g.fillStyle = "#6b4a30";
      g.fillRect(0, 0, 128, 32);
      for (let i = 0; i < 40; i++) {
        g.fillStyle = `rgba(${40 + Math.random() * 40},${25 + Math.random() * 25},15,0.35)`;
        g.fillRect(0, Math.random() * 32, 128, 1);
      }
    });
    const wm = f.mat(new THREE.MeshLambertMaterial({ map: wood, color: "#e0c0a0", emissive: C("#2a1a10") }));
    wm.depthWrite = true;
    const planks = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 0.06, 0.2), wm, 34);
    const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.07, 1.4, 6), wm, 12);
    const d = new THREE.Object3D();
    const ox = 6.5,
      oz = -4;
    for (let i = 0; i < 34; i++) {
      d.position.set(ox + (Math.random() - 0.5) * 0.05, -1.45 + (Math.random() - 0.5) * 0.02, oz - i * 0.23);
      d.rotation.set(0, (Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.02);
      d.updateMatrix();
      planks.setMatrixAt(i, d.matrix);
    }
    d.rotation.set(0, 0, 0);
    for (let i = 0; i < 12; i++) {
      d.position.set(ox + (i % 2 ? 0.72 : -0.72), -1.9, oz - Math.floor(i / 2) * 1.5);
      d.updateMatrix();
      posts.setMatrixAt(i, d.matrix);
    }
    const dock = new THREE.Group();
    dock.add(planks, posts);
    dock.rotation.y = 1.05;
    dock.position.set(17.2 - ox * Math.cos(1.05) - oz * Math.sin(1.05), 0, -8.5 + ox * Math.sin(1.05) - oz * Math.cos(1.05));
    group.add(dock);
    // rowboat: pinched box hull
    const hg = new THREE.BoxGeometry(0.9, 0.35, 2.6, 4, 2, 12);
    const hp = hg.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < hp.count; i++) {
      const z = hp.getZ(i) / 1.3,
        y = hp.getY(i);
      const pinch = 1 - Math.pow(Math.abs(z), 2.2) * 0.9;
      hp.setX(i, hp.getX(i) * pinch * (y < 0 ? 0.75 : 1));
      hp.setY(i, y + Math.pow(Math.abs(z), 2) * 0.12);
    }
    hg.computeVertexNormals();
    const bm = f.mat(new THREE.MeshLambertMaterial({ color: "#7a3b24" }));
    bm.depthWrite = true;
    const boat = new THREE.Mesh(hg, bm);
    const inner = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 2.0), f.mat(new THREE.MeshLambertMaterial({ color: "#3a2416" })));
    inner.rotation.x = -Math.PI / 2;
    inner.position.y = 0.15;
    boat.add(inner);
    boat.position.set(10.2, -1.85, -14.2);
    boat.rotation.y = 2.4;
    group.add(boat);
    (group.userData as { boat?: THREE.Mesh }).boat = boat;
  }

  group.add(lake(env, ctx, { y: -2, w: 420, d: 150, z: -50, deep: "#0a434c", shallow: "#15706f", distort: 0.02, ripple: 0.06, refl: 0.9, glint: 1.0, normalK: 0.55 }));

  // drifting morning mist over the water and along the forest
  let mist: ReturnType<typeof sprites>;
  {
    const r = rng(41);
    const items: { x: number; y: number; z: number; w: number; h: number; rot: number; b: number }[] = [];
    const n = lite ? 16 : 30;
    for (let i = 0; i < n; i++) {
      const z = -25 - r() * 100;
      items.push({ x: (r() - 0.5) * (30 + -z * 0.9), y: -1.5 + r() * 1.0 + (z < -70 ? r() * 5 : 0), z, w: 22 + r() * 30, h: 2.5 + r() * 3, rot: 0, b: 0.9 + r() * 0.2 });
    }
    mist = sprites(env, items, { tex: cloudTex("mist"), lit: C("#fff0ec", 1.05), shadow: C("#c8bccb", 1), opacity: 0.3, drift: new THREE.Vector3(0.35, 0, 0), wrapX: 140, hazeK: 0.7, sunLit: 0.8 });
    mist.mesh.renderOrder = 5;
    group.add(mist.mesh);
  }
  // birds crossing
  const birds = birdFlock(env, lite ? 7 : 11, "#2a2428", 1);
  group.add(birds.mesh);
  group.add(drift(env, ctx, { n: lite ? 120 : 260, center: new THREE.Vector3(0, 1, -4), box: new THREE.Vector3(30, 8, 24), vel: new THREE.Vector3(0.15, 0.05, 0), size: 0.03, color: C("#fff2dc", 1.1), wobble: 0.6 }));

  lights(f, group, { sky: "#b2c1dc", ground: "#3b4a3a", hemi: 0.7, sun: "#ffc59a", sunI: 1.3, dir: sunDir });
  const boat = (group.userData as { boat: THREE.Mesh }).boat;

  return {
    group,
    fade: f,
    bg: new THREE.Color("#a9a6bb"),
    fog: new THREE.Color("#a9a6bb"),
    fogDensity: 0.0065,
    update: (t) => {
      env.uTime.value = t;
      boat.position.y = -1.85 + Math.sin(t * 0.9) * 0.025;
      boat.rotation.z = Math.sin(t * 0.7) * 0.025;
      boat.rotation.x = Math.sin(t * 0.5 + 1) * 0.015;
      birds.update(
        t,
        (i, tt, out) => {
          const k = ((tt * 0.018 + 0.1) % 1) * 2 - 1;
          out.set(k * 90 + (i % 4) * 2.2 - Math.floor(i / 4) * 1.5, 12 + Math.sin(tt * 0.3 + i) * 0.6 + (i % 3) * 0.8 - Math.abs((i % 5) - 2) * 0.5, -48 - (i % 5) * 1.6 + Math.sin(tt * 0.2) * 3);
          return 0;
        },
        0.55
      );
    },
    view: (t, pos, lk) => {
      pos.set(Math.sin(t * 0.03) * 4, 0.5 + Math.sin(t * 0.04) * 0.25, 8 + Math.sin(t * 0.02) * 2);
      lk.set(Math.sin(t * 0.03 + 0.9) * 6, 5, -80);
    },
  };
}
