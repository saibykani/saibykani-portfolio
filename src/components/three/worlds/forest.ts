import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { canvasTex, Ctx, Fader, fbm2, glowTex, noise2, World } from "./common";

/* =====================================================================================
 * Cinematic nature worlds: "Rainforest" (jungle) and "Kyoto Cherry Garden" (sakura).
 * Everything heavy is instanced / merged; all wind, water, petals and particles animate
 * in vertex / fragment shaders so per-frame JS stays tiny.
 * ===================================================================================== */

type V3 = THREE.Vector3;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const C = (c: THREE.ColorRepresentation) => new THREE.Color(c);
const lerp = THREE.MathUtils.lerp;
const TAU = Math.PI * 2;
/* GLSL-style smoothstep (edges may be reversed). */
const sm = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/* Deterministic random so every visit sees the same composed shot. */
let _seed = 1;
const seed = (s: number) => (_seed = s);
const rnd = () => ((_seed = (_seed * 16807) % 2147483647) - 1) / 2147483646;
const rr = (a: number, b: number) => a + rnd() * (b - a);

/* ---------------------------------- shared env ---------------------------------- */
type U<T> = { value: T };
type Env = { time: U<number>; sunDir: U<V3>; sunCol: U<THREE.Color>; wind: U<THREE.Vector2> };
const mkEnv = (sun: V3, col: string, wind: [number, number]): Env => ({
  time: { value: 0 },
  sunDir: { value: sun.normalize() },
  sunCol: { value: C(col) },
  wind: { value: new THREE.Vector2(wind[0], wind[1]) },
});

const NOISE = /* glsl */ `
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm3(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { v += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v / 0.875; }
`;

/* ------------------------- nature material (Lambert + wind) ------------------------- */
const NAT_VHEAD = /* glsl */ `#include <common>
attribute float aSway;
uniform float uTime, uSway, uFlutter;
uniform vec2 uWind;
varying vec3 vWPos;
#ifdef ATLAS
attribute vec2 aCell;
#endif`;
const NAT_PROJ = /* glsl */ `
vec4 mvPosition = vec4(transformed, 1.0);
vec3 ip = modelMatrix[3].xyz;
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
  ip = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xyz;
#endif
vec4 wp = modelMatrix * mvPosition;
float ph = dot(ip, vec3(0.31, 0.17, 0.23));
float gust = 0.65 + 0.35 * sin(uTime * 0.37 + ip.x * 0.06 + ip.z * 0.04);
float swv = (sin(uTime * 1.05 + ph) * 0.7 + sin(uTime * 2.13 + ph * 1.9) * 0.3) * gust;
wp.xz += uWind * (swv + 0.3 * gust) * uSway * aSway;
wp.y += sin(uTime * 5.3 + dot(wp.xyz, vec3(1.7, 1.1, 1.3))) * uFlutter * aSway;
vWPos = wp.xyz;
mvPosition = viewMatrix * wp;
gl_Position = projectionMatrix * mvPosition;`;
const NAT_FHEAD = /* glsl */ `#include <common>
uniform vec3 uSunDir, uSunCol, uAo;
uniform float uBack;
uniform vec2 uClip;
varying vec3 vWPos;`;
const NAT_ATEST = /* glsl */ `
if (vWPos.y < uClip.x || vWPos.y > uClip.y) discard;
#ifdef USE_ALPHATEST
  if (diffuseColor.a < alphaTest * max(opacity, 0.0001)) discard;
  diffuseColor.a = opacity;
#endif`;
const NAT_TAIL = /* glsl */ `{
  float aoK = mix(uAo.x, 1.0, smoothstep(uAo.y, uAo.z, vWPos.y));
  outgoingLight *= aoK;
  vec3 vdir = normalize(vWPos - cameraPosition);
  float bl = pow(max(dot(vdir, uSunDir), 0.0), 4.0);
  outgoingLight += diffuseColor.rgb * uSunCol * uBack * (0.12 + 1.4 * bl) * (0.35 + 0.65 * aoK);
}
#include <opaque_fragment>`;

type NatOpts = {
  map?: THREE.Texture | null;
  color?: THREE.ColorRepresentation;
  vc?: boolean;
  sway?: number;
  flutter?: number;
  back?: number;
  ao?: [number, number, number];
  alphaTest?: number;
  side?: THREE.Side;
  atlas?: boolean;
  emissive?: THREE.ColorRepresentation;
  bend?: string;
  clip?: [number, number];
};
function natMat(f: Fader, env: Env, o: NatOpts) {
  const m = new THREE.MeshLambertMaterial({
    map: o.map ?? null,
    color: o.color ?? 0xffffff,
    vertexColors: !!o.vc,
    side: o.side ?? THREE.FrontSide,
    alphaTest: o.alphaTest ?? 0,
    emissive: o.emissive ?? 0x000000,
  });
  const u = {
    uSway: { value: o.sway ?? 0 },
    uFlutter: { value: o.flutter ?? 0 },
    uBack: { value: o.back ?? 0 },
    uAo: { value: new THREE.Vector3(...(o.ao ?? [1, 0, 1])) },
    uClip: { value: new THREE.Vector2(...(o.clip ?? [-1e5, 1e5])) },
  };
  if (o.atlas) m.defines = { ATLAS: "" };
  const bend = o.bend ?? "";
  m.customProgramCacheKey = () => "nat|" + bend;
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, u, { uTime: env.time, uSunDir: env.sunDir, uSunCol: env.sunCol, uWind: env.wind });
    s.vertexShader = s.vertexShader
      .replace("#include <common>", NAT_VHEAD)
      .replace("#include <uv_vertex>", "#include <uv_vertex>\n#if defined(ATLAS) && defined(USE_MAP)\n vMapUv = vMapUv * 0.5 + aCell * 0.5;\n#endif")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\n" + bend)
      .replace("#include <project_vertex>", NAT_PROJ);
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", NAT_FHEAD)
      .replace("#include <alphatest_fragment>", NAT_ATEST)
      .replace("#include <opaque_fragment>", NAT_TAIL);
  };
  return f.mat(m);
}

/* Unlit material (baked colours) with optional world-height clip, for distant silhouettes and mirrors. */
function basicMat(f: Fader, p: THREE.MeshBasicMaterialParameters, clipHigh = 1e5, toneMapped = true) {
  const m = new THREE.MeshBasicMaterial(p);
  m.toneMapped = toneMapped;
  if (clipHigh < 1e4) {
    m.customProgramCacheKey = () => "bclip";
    m.onBeforeCompile = (s) => {
      s.uniforms.uClipY = { value: clipHigh };
      s.vertexShader = s.vertexShader
        .replace("#include <common>", `#include <common>
varying float vWY;`)
        .replace(
          "#include <project_vertex>",
          `#include <project_vertex>
{ vec4 w_ = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  w_ = instanceMatrix * w_;
#endif
  vWY = (modelMatrix * w_).y; }`
        );
      s.fragmentShader = s.fragmentShader
        .replace("#include <common>", `#include <common>
varying float vWY; uniform float uClipY;`)
        .replace("#include <map_fragment>", `if (vWY > uClipY) discard;
#include <map_fragment>`);
    };
  }
  return f.mat(m);
}

/* Planar reflection by mirrored geometry: a copy of obj flipped about y = wl, sharing geometry/instances. */
const _mir = new THREE.Matrix4();
function mirrorOf(obj: THREE.Mesh, mat: THREE.Material, wl: number) {
  let m: THREE.Mesh;
  if ((obj as THREE.InstancedMesh).isInstancedMesh) {
    const im = obj as THREE.InstancedMesh;
    const r = new THREE.InstancedMesh(im.geometry, mat, 1);
    r.instanceMatrix = im.instanceMatrix;
    r.instanceColor = im.instanceColor;
    r.count = im.count;
    m = r;
  } else m = new THREE.Mesh(obj.geometry, mat);
  obj.updateMatrix();
  m.matrixAutoUpdate = false;
  m.matrix.copy(obj.matrix).premultiply(_mir.makeScale(1, -1, 1).setPosition(0, 2 * wl, 0));
  m.frustumCulled = false;
  m.renderOrder = obj.renderOrder;
  return m;
}

/* Per-vertex wind weight attribute (every natMat geometry gets one). */
function sway(g: THREE.BufferGeometry, fn?: (x: number, y: number, z: number, u: number, v: number) => number) {
  const p = g.attributes.position;
  const uv = g.attributes.uv;
  const a = new Float32Array(p.count);
  if (fn) for (let i = 0; i < p.count; i++) a[i] = fn(p.getX(i), p.getY(i), p.getZ(i), uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0);
  g.setAttribute("aSway", new THREE.BufferAttribute(a, 1));
  return g;
}

/* Custom shader material that fades with the world. */
function shMat(
  f: Fader,
  o: { u: Record<string, THREE.IUniform>; vs: string; fs: string; fog?: boolean; add?: boolean; side?: THREE.Side; depthWrite?: boolean; base?: number; toneMapped?: boolean }
) {
  const uFade = f.uniform({ value: 0 }, o.base ?? 1);
  const m = new THREE.ShaderMaterial({
    uniforms: { ...(o.fog ? THREE.UniformsUtils.clone(THREE.UniformsLib.fog) : {}), ...o.u, uFade },
    vertexShader: o.vs,
    fragmentShader: o.fs,
    transparent: true,
    depthWrite: o.depthWrite ?? false,
    blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending,
    side: o.side ?? THREE.FrontSide,
    fog: !!o.fog,
  });
  m.toneMapped = o.toneMapped ?? true;
  return f.mat(m);
}

const _v2 = new THREE.Vector2();
/* Keeps a point-size uniform in pixels-per-world-unit-at-depth-1. */
function pointScale(obj: THREE.Object3D, u: U<number>) {
  obj.onBeforeRender = (r, _s, cam) => {
    r.getDrawingBufferSize(_v2);
    u.value = _v2.y / (2 * Math.tan(((cam as THREE.PerspectiveCamera).fov * Math.PI) / 360));
  };
}

/* ---------------------------------- instancing ---------------------------------- */
type Inst = { p: V3; r: [number, number, number]; s: number | [number, number, number]; c?: THREE.Color; cell?: number };
const _m4 = new THREE.Matrix4(),
  _q = new THREE.Quaternion(),
  _e = new THREE.Euler(0, 0, 0, "YXZ"),
  _sc = new THREE.Vector3();
function setInst(m: THREE.InstancedMesh, i: number, p: V3, r: [number, number, number], s: number | [number, number, number]) {
  _e.set(r[0], r[1], r[2], "YXZ");
  if (typeof s === "number") _sc.set(s, s, s);
  else _sc.set(s[0], s[1], s[2]);
  _m4.compose(p, _q.setFromEuler(_e), _sc);
  m.setMatrixAt(i, _m4);
}
function instanced(geo: THREE.BufferGeometry, mat: THREE.Material, items: Inst[], atlas = false) {
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length));
  m.count = items.length;
  const cells = new Float32Array(Math.max(1, items.length) * 2);
  const white = C(0xffffff);
  items.forEach((it, i) => {
    setInst(m, i, it.p, it.r, it.s);
    m.setColorAt(i, it.c ?? white);
    const c = it.cell ?? 0;
    cells[i * 2] = c % 2;
    cells[i * 2 + 1] = Math.floor(c / 2);
  });
  if (atlas) geo.setAttribute("aCell", new THREE.InstancedBufferAttribute(cells, 2));
  m.instanceMatrix.needsUpdate = true;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
  m.frustumCulled = false;
  return m;
}

/* Solid primitive with a baked vertex color, transformed (for merged props). */
function solid(g: THREE.BufferGeometry, col: THREE.ColorRepresentation, pos: V3, rot: [number, number, number] = [0, 0, 0], scl: [number, number, number] = [1, 1, 1]) {
  const gg = g;
  _e.set(rot[0], rot[1], rot[2], "YXZ");
  _m4.compose(pos, _q.setFromEuler(_e), _sc.set(scl[0], scl[1], scl[2]));
  gg.applyMatrix4(_m4);
  const c = C(col);
  const n = gg.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
  gg.setAttribute("color", new THREE.BufferAttribute(a, 3));
  return gg;
}
function mergeAll(list: THREE.BufferGeometry[]) {
  const keep = ["position", "normal", "uv", "color"];
  const prepped = list.map((g) => {
    let x = g;
    for (const k of Object.keys(x.attributes)) if (!keep.includes(k)) x.deleteAttribute(k);
    if (!x.attributes.uv) x.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2));
    if (!x.index) x = mergeVertices(x);
    return x;
  });
  return mergeGeometries(prepped)!;
}

/* Tapered tube segments (branches, vines) -> one indexed geometry. */
type Seg = { a: V3; b: V3; ra: number; rb: number; wa?: number; wb?: number; col?: THREE.Color };
function tubeGeo(segs: Seg[], radial: number, uvScale = 1) {
  const P: number[] = [],
    N: number[] = [],
    UV: number[] = [],
    CL: number[] = [],
    SW: number[] = [],
    I: number[] = [];
  const ax = V(),
    t1 = V(),
    t2 = V(),
    n = V(),
    c = V(),
    X = V(1, 0, 0),
    Y = V(0, 1, 0);
  const white = C(0xffffff);
  for (const s of segs) {
    ax.subVectors(s.b, s.a);
    const len = ax.length() || 1e-4;
    ax.divideScalar(len);
    t1.crossVectors(ax, Math.abs(ax.y) > 0.9 ? X : Y).normalize();
    t2.crossVectors(ax, t1);
    const base = P.length / 3;
    const col = s.col ?? white;
    for (let e = 0; e < 2; e++) {
      const r = e ? s.rb : s.ra;
      if (e) c.copy(s.b).addScaledVector(ax, s.rb * 0.6);
      else c.copy(s.a).addScaledVector(ax, -s.ra * 0.3);
      for (let k = 0; k <= radial; k++) {
        const th = (k / radial) * TAU;
        n.copy(t1).multiplyScalar(Math.cos(th)).addScaledVector(t2, Math.sin(th));
        P.push(c.x + n.x * r, c.y + n.y * r, c.z + n.z * r);
        N.push(n.x, n.y, n.z);
        UV.push(k / radial, e * len * uvScale);
        CL.push(col.r, col.g, col.b);
        SW.push(e ? s.wb ?? 0 : s.wa ?? 0);
      }
    }
    for (let k = 0; k < radial; k++) {
      const i0 = base + k,
        i1 = i0 + 1,
        i2 = base + radial + 1 + k,
        i3 = i2 + 1;
      I.push(i0, i1, i2, i1, i3, i2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(CL, 3));
  g.setAttribute("aSway", new THREE.Float32BufferAttribute(SW, 1));
  g.setIndex(I);
  return g;
}

/* Terrain heightfield with vertex colours. */
function terrainGeo(w: number, d: number, sx: number, sz: number, cx: number, cz: number, h: (x: number, z: number) => number, col: (x: number, y: number, z: number, out: THREE.Color) => void, rep: number) {
  const g = new THREE.PlaneGeometry(w, d, sx, sz);
  g.rotateX(-Math.PI / 2);
  g.translate(cx, 0, cz);
  const p = g.attributes.position;
  const uv = g.attributes.uv;
  const cl = new Float32Array(p.count * 3);
  const c = C(0xffffff);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      z = p.getZ(i);
    const y = h(x, z);
    p.setY(i, y);
    col(x, y, z, c);
    cl.set([c.r, c.g, c.b], i * 3);
    uv.setXY(i, (x / w) * rep, (z / d) * rep);
  }
  g.setAttribute("color", new THREE.BufferAttribute(cl, 3));
  g.computeVertexNormals();
  sway(g);
  return g;
}

/* Organic boulder: displaced icosphere, mossy on top. */
function rockGeo(sx: number, sy: number, sz: number, sd: number, rock: THREE.Color, moss: THREE.Color, mossAmt = 1, detail = 3) {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    const r = 1 + (noise2(x * 1.6 + sd, y * 1.6 + z * 1.3) - 0.5) * 0.55 + (noise2(x * 4.1 + z * 3.3, y * 4.1 + sd) - 0.5) * 0.16;
    p.setXYZ(i, x * r * sx, Math.max(y * r, -0.35) * sy, z * r * sz);
  }
  g.computeVertexNormals();
  const nn = g.attributes.normal;
  const cl = new Float32Array(p.count * 3);
  const c = C(0xffffff);
  for (let i = 0; i < p.count; i++) {
    const m = sm(0.25, 0.75, nn.getY(i) + (noise2(p.getX(i) * 2 + sd, p.getZ(i) * 2) - 0.5) * 0.6) * mossAmt;
    c.copy(rock).multiplyScalar(0.8 + noise2(p.getX(i) * 3, p.getY(i) * 3 + sd) * 0.4).lerp(moss, m);
    c.multiplyScalar(0.55 + 0.45 * sm(-0.35 * sy, 0.6 * sy, p.getY(i)));
    cl.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(cl, 3));
  boxUv(g, 0.5);
  return g;
}
/* Cheap planar-blend UVs for noisy organic meshes. */
function boxUv(g: THREE.BufferGeometry, k: number) {
  const p = g.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) uv.set([(p.getX(i) + p.getZ(i) * 0.7) * k, (p.getY(i) + p.getZ(i) * 0.3) * k], i * 2);
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

/* --------------------------------- canvas painting --------------------------------- */
const hsl = (h: number, s: number, l: number, a = 1) => `hsla(${h},${Math.min(100, s)}%,${Math.min(100, l)}%,${a})`;
const angOf = (dx: number, dy: number) => Math.atan2(-dx, dy);

function drawLeaf(g: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, wid: number, h: number, s: number, l: number, veins = true) {
  g.save();
  g.translate(x, y);
  g.rotate(ang);
  const path = () => {
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(wid, len * 0.12, wid * 0.85, len * 0.72, 0, len);
    g.bezierCurveTo(-wid * 0.85, len * 0.72, -wid, len * 0.12, 0, 0);
    g.closePath();
  };
  const gr = g.createLinearGradient(0, 0, 0, len);
  gr.addColorStop(0, hsl(h - 4, s, l * 0.6));
  gr.addColorStop(0.55, hsl(h, s, l));
  gr.addColorStop(1, hsl(h + 6, s + 5, l * 1.15));
  path();
  g.fillStyle = gr;
  g.fill();
  if (veins && len > 14) {
    g.save();
    path();
    g.clip();
    g.fillStyle = "rgba(0,0,0,0.16)";
    g.fillRect(0, 0, wid * 1.2, len);
    g.strokeStyle = hsl(h, s * 0.5, l * 1.7, 0.55);
    g.lineWidth = Math.max(1, wid * 0.07);
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(wid * 0.08, len * 0.5, 0, len * 0.97);
    g.stroke();
    g.lineWidth = Math.max(0.6, wid * 0.03);
    g.globalAlpha = 0.3;
    for (let k = 0.12; k < 0.9; k += 0.11) {
      g.beginPath();
      g.moveTo(0, len * k);
      g.quadraticCurveTo(wid * 0.4, len * (k + 0.05), wid * 0.9, len * (k + 0.14));
      g.moveTo(0, len * k);
      g.quadraticCurveTo(-wid * 0.4, len * (k + 0.05), -wid * 0.9, len * (k + 0.14));
      g.stroke();
    }
    g.restore();
  }
  g.restore();
}

/* 2x2 atlas of leafy branch clusters. */
function clusterAtlas(pal: { h: [number, number]; s: [number, number]; l: [number, number] }, twig: string, leaves: [number, number], size = 1024, shape = [0.28, 0.5]) {
  return canvasTex(size, size, (g) => {
    const cs = size / 2;
    for (let cell = 0; cell < 4; cell++) {
      const ox = (cell % 2) * cs,
        oy = Math.floor(cell / 2) * cs;
      const cx = ox + cs / 2,
        cy = oy + cs / 2,
        R = cs * 0.29;
      g.save();
      g.beginPath();
      g.rect(ox, oy, cs, cs);
      g.clip();
      const nT = 5 + cell;
      const tw: { a: number; L: number }[] = [];
      g.strokeStyle = twig;
      g.lineCap = "round";
      for (let i = 0; i < nT; i++) {
        const a = (i / nT) * TAU + rr(-0.3, 0.3),
          L = R * rr(0.7, 1);
        tw.push({ a, L });
        g.lineWidth = rr(2, 4) * (size / 1024);
        g.beginPath();
        g.moveTo(cx, cy);
        g.quadraticCurveTo(cx + Math.cos(a + 0.3) * L * 0.5, cy + Math.sin(a + 0.3) * L * 0.5, cx + Math.cos(a) * L, cy + Math.sin(a) * L);
        g.stroke();
      }
      const N = leaves[0] + cell * leaves[1];
      for (let i = 0; i < N; i++) {
        const t = tw[i % nT];
        const tt = rr(0.1, 1);
        const px = cx + Math.cos(t.a) * t.L * tt + rr(-6, 6),
          py = cy + Math.sin(t.a) * t.L * tt + rr(-6, 6);
        const a = t.a + rr(-1.0, 1.0);
        const len = R * rr(shape[0], shape[1]) * (1.1 - tt * 0.35);
        const k = i / N;
        drawLeaf(g, px, py, angOf(Math.cos(a), Math.sin(a)), len, len * rr(0.22, 0.34), rr(pal.h[0], pal.h[1]), rr(pal.s[0], pal.s[1]), rr(pal.l[0], pal.l[1]) * (0.75 + 0.4 * k));
      }
      g.restore();
    }
  });
}

function drawFlower(g: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number, deep: number) {
  for (let k = 0; k < 5; k++) {
    g.save();
    g.translate(x, y);
    g.rotate(rot + (k * TAU) / 5 + rr(-0.12, 0.12));
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
    gr.addColorStop(0, `rgb(${lerp(232, 205, deep) | 0},${lerp(112, 60, deep) | 0},${lerp(146, 112, deep) | 0})`);
    gr.addColorStop(0.38, `rgb(250,${lerp(206, 150, deep) | 0},${lerp(222, 184, deep) | 0})`);
    gr.addColorStop(1, `rgb(255,${lerp(246, 206, deep) | 0},${lerp(248, 226, deep) | 0})`);
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(r * 0.56, -r * 0.14, r * 0.64, -r * 0.9, r * 0.14, -r);
    g.lineTo(0, -r * 0.85);
    g.lineTo(-r * 0.14, -r);
    g.bezierCurveTo(-r * 0.64, -r * 0.9, -r * 0.56, -r * 0.14, 0, 0);
    g.fill();
    g.strokeStyle = "rgba(190,110,140,0.22)";
    g.lineWidth = 0.8;
    g.stroke();
    g.restore();
  }
  g.fillStyle = "rgba(205,70,112,0.55)";
  g.beginPath();
  g.arc(x, y, r * 0.12, 0, TAU);
  g.fill();
  g.strokeStyle = "rgba(240,210,215,0.8)";
  g.lineWidth = 0.7;
  for (let k = 0; k < 9; k++) {
    const a = rr(0, TAU),
      l = r * rr(0.3, 0.5);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
    g.fillStyle = "rgba(255,214,120,0.95)";
    g.fillRect(x + Math.cos(a) * l - 1, y + Math.sin(a) * l - 1, 2, 2);
  }
}

function blossomAtlas() {
  return canvasTex(1024, 1024, (g) => {
    const cs = 512;
    for (let cell = 0; cell < 4; cell++) {
      const ox = (cell % 2) * cs,
        oy = Math.floor(cell / 2) * cs;
      const cx = ox + cs / 2,
        cy = oy + cs / 2,
        R = cs * 0.34;
      g.save();
      g.beginPath();
      g.rect(ox, oy, cs, cs);
      g.clip();
      // twigs
      g.strokeStyle = "#3a2524";
      g.lineCap = "round";
      for (let i = 0; i < 4; i++) {
        const a = rr(0, TAU),
          L = R * rr(0.6, 1);
        g.lineWidth = rr(2, 4.5);
        g.beginPath();
        g.moveTo(cx - Math.cos(a) * L * 0.3, cy - Math.sin(a) * L * 0.3);
        g.quadraticCurveTo(cx + rr(-20, 20), cy + rr(-20, 20), cx + Math.cos(a) * L, cy + Math.sin(a) * L);
        g.stroke();
      }
      const deep = cell === 3 ? 0.55 : cell * 0.12;
      const flowersAt = (count: number, rad: number) => {
        for (let i = 0; i < count; i++) {
          const a = rr(0, TAU),
            d = Math.sqrt(rnd()) * rad;
          const bx = cx + Math.cos(a) * d,
            by = cy + Math.sin(a) * d;
          const m = 2 + Math.floor(rnd() * 4);
          for (let j = 0; j < m; j++) drawFlower(g, bx + rr(-16, 16), by + rr(-16, 16), cs * rr(0.03, 0.05), rr(0, TAU), deep + rr(-0.1, 0.15));
          if (rnd() < 0.5) {
            g.fillStyle = `rgb(${220 - deep * 20},${90 - deep * 30},${130})`;
            g.beginPath();
            g.ellipse(bx + rr(-22, 22), by + rr(-22, 22), 4, 6, rr(0, 3), 0, TAU);
            g.fill();
          }
        }
      };
      flowersAt(14, R * 0.95);
      // shade the back layer so the clump has depth
      g.globalCompositeOperation = "source-atop";
      g.fillStyle = "rgba(110,50,80,0.28)";
      g.fillRect(ox, oy, cs, cs);
      g.globalCompositeOperation = "source-over";
      flowersAt(16, R * 0.85);
      g.restore();
    }
  });
}

function fernTex() {
  return canvasTex(256, 512, (g) => {
    g.strokeStyle = "#3d5a22";
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(128, 512);
    g.quadraticCurveTo(122, 260, 128, 6);
    g.stroke();
    for (let k = 0; k < 34; k++) {
      const t = k / 34;
      const y = 505 - t * 495;
      const L = 118 * Math.sin(Math.PI * (t * 0.85 + 0.1)) * (1 - t * 0.2);
      for (const sd of [-1, 1]) {
        const dx = sd * 0.9,
          dy = -0.42;
        const h = rr(88, 108),
          l = rr(26, 40);
        // pinna built of small lobes
        const n = Math.max(3, Math.floor(L / 10));
        for (let j = 0; j < n; j++) {
          const q = j / n;
          const px = 128 + dx * L * q,
            py = y + dy * L * q;
          drawLeaf(g, px, py, angOf(dx * 0.4 + sd * 0.2, -1), (1 - q * 0.7) * 16, 6, h, 55, l + q * 8, false);
          drawLeaf(g, px, py, angOf(dx * 0.4 + sd * 0.2, 1), (1 - q * 0.7) * 14, 5, h, 55, l * 0.85, false);
        }
      }
    }
  });
}

function palmTex() {
  return canvasTex(256, 1024, (g) => {
    g.strokeStyle = "#5b6a2e";
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(128, 1024);
    g.lineTo(128, 0);
    g.stroke();
    for (let k = 0; k < 46; k++) {
      const t = k / 46;
      const y = 1010 - t * 1000;
      const L = 125 * (1 - t * 0.55);
      for (const sd of [-1, 1]) {
        drawLeaf(g, 128, y, angOf(sd * 0.9, -0.5), L, L * 0.09, rr(82, 100), rr(45, 60), rr(26, 38));
      }
    }
  });
}

/* Big understory leaves: monstera, banana, alocasia, heart philodendron. */
function bigLeafAtlas() {
  return canvasTex(1024, 1024, (g) => {
    const cs = 512;
    const cell = (i: number, draw: (bx: number, by: number) => void) => {
      const ox = (i % 2) * cs,
        oy = Math.floor(i / 2) * cs;
      g.save();
      g.beginPath();
      g.rect(ox, oy, cs, cs);
      g.clip();
      draw(ox + cs / 2, oy + cs - 4);
      g.globalCompositeOperation = "source-atop";
      for (let k = 0; k < 1500; k++) {
        g.fillStyle = rnd() < 0.55 ? `rgba(0,0,0,${rr(0.03, 0.1)})` : `rgba(210,235,150,${rr(0.03, 0.08)})`;
        const r = rr(2, 11);
        g.beginPath();
        g.ellipse(ox + rr(0, cs), oy + rr(0, cs), r, r * rr(0.4, 1), rr(0, 3), 0, TAU);
        g.fill();
      }
      const sh = g.createLinearGradient(ox, oy + cs, ox + cs, oy);
      sh.addColorStop(0, "rgba(0,0,0,0.18)");
      sh.addColorStop(0.55, "rgba(255,255,225,0.1)");
      sh.addColorStop(1, "rgba(60,40,0,0.22)");
      g.fillStyle = sh;
      g.fillRect(ox, oy, cs, cs);
      const tip = g.createRadialGradient(ox + cs / 2, oy + 20, 0, ox + cs / 2, oy + 20, cs * 0.35);
      tip.addColorStop(0, `rgba(150,120,40,${rr(0.15, 0.45)})`);
      tip.addColorStop(1, "rgba(150,120,40,0)");
      g.fillStyle = tip;
      g.fillRect(ox, oy, cs, cs);
      g.globalCompositeOperation = "source-over";
      g.restore();
    };
    const veins = (bx: number, by: number, len: number, wid: number, col: string, n: number, lw: number) => {
      g.strokeStyle = col;
      g.lineWidth = lw * 2.2;
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx, by - len);
      g.stroke();
      g.lineWidth = lw;
      for (let k = 1; k < n; k++) {
        const y = by - (len * k) / n;
        for (const s of [-1, 1]) {
          g.beginPath();
          g.moveTo(bx, y);
          g.quadraticCurveTo(bx + s * wid * 0.5, y - len * 0.03, bx + s * wid, y - len * 0.1);
          g.stroke();
        }
      }
    };
    // monstera
    cell(0, (bx, by) => {
      const len = 470,
        wid = 215;
      g.save();
      g.translate(bx, by);
      g.beginPath();
      g.moveTo(0, -30);
      g.bezierCurveTo(wid * 1.25, -len * 0.05, wid * 1.1, -len * 0.95, 0, -len);
      g.bezierCurveTo(-wid * 1.1, -len * 0.95, -wid * 1.25, -len * 0.05, 0, -30);
      const gr = g.createLinearGradient(-wid, 0, wid, -len);
      gr.addColorStop(0, "#123d17");
      gr.addColorStop(0.5, "#1f5a22");
      gr.addColorStop(1, "#2e7a2c");
      g.fillStyle = gr;
      g.fill();
      g.restore();
      veins(bx, by - 30, len - 40, wid * 0.95, "rgba(120,170,90,0.3)", 9, 1.6);
      g.globalCompositeOperation = "destination-out";
      for (let k = 1; k < 9; k++) {
        const y = by - 30 - ((len - 40) * k) / 9 - 16;
        for (const s of [-1, 1]) {
          g.save();
          g.translate(bx + s * wid * 1.2, y);
          g.rotate(s * 0.28);
          g.fillRect(-wid * 0.7, -5, wid * 0.7 * 2 * 0.62, rr(7, 13));
          g.restore();
        }
      }
      g.globalCompositeOperation = "source-over";
    });
    // banana
    cell(1, (bx, by) => {
      const len = 500,
        wid = 105;
      g.save();
      g.translate(bx, by);
      g.beginPath();
      g.moveTo(0, 0);
      g.bezierCurveTo(wid * 1.2, -len * 0.1, wid * 1.1, -len * 0.9, 0, -len);
      g.bezierCurveTo(-wid * 1.1, -len * 0.9, -wid * 1.2, -len * 0.1, 0, 0);
      const gr = g.createLinearGradient(0, 0, 0, -len);
      gr.addColorStop(0, "#2e5a1d");
      gr.addColorStop(1, "#5e8f2c");
      g.fillStyle = gr;
      g.fill();
      g.restore();
      g.strokeStyle = "rgba(200,220,140,0.16)";
      g.lineWidth = 1;
      for (let k = 0; k < 60; k++) {
        const y = by - 10 - k * 8;
        g.beginPath();
        g.moveTo(bx, y);
        g.lineTo(bx - wid, y - 40);
        g.moveTo(bx, y);
        g.lineTo(bx + wid, y - 40);
        g.stroke();
      }
      g.strokeStyle = "#a8b86a";
      g.lineWidth = 7;
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx, by - len);
      g.stroke();
      g.globalCompositeOperation = "destination-out";
      g.lineWidth = 3;
      for (let k = 0; k < 7; k++) {
        const y = by - rr(60, len - 60),
          s = rnd() < 0.5 ? -1 : 1;
        g.beginPath();
        g.moveTo(bx + s * wid * 1.2, y - 45);
        g.lineTo(bx + s * 8, y);
        g.stroke();
      }
      g.globalCompositeOperation = "source-over";
    });
    // alocasia (arrowhead elephant ear)
    cell(2, (bx, by) => {
      const len = 470,
        wid = 200;
      g.save();
      g.translate(bx, by - 60);
      g.beginPath();
      g.moveTo(0, 0);
      g.bezierCurveTo(wid * 0.6, 40, wid * 1.1, -len * 0.2, wid * 0.6, -len * 0.55);
      g.quadraticCurveTo(wid * 0.25, -len * 0.8, 0, -len + 60);
      g.quadraticCurveTo(-wid * 0.25, -len * 0.8, -wid * 0.6, -len * 0.55);
      g.bezierCurveTo(-wid * 1.1, -len * 0.2, -wid * 0.6, 40, 0, 0);
      const gr = g.createRadialGradient(0, -len * 0.3, 10, 0, -len * 0.3, len * 0.7);
      gr.addColorStop(0, "#2d6a2a");
      gr.addColorStop(1, "#153f18");
      g.fillStyle = gr;
      g.fill();
      g.restore();
      veins(bx, by - 60, len - 60, wid * 0.8, "rgba(210,230,190,0.6)", 7, 2.5);
      g.strokeStyle = "#4e6b2b";
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx, by - 60);
      g.stroke();
    });
    // philodendron heart
    cell(3, (bx, by) => {
      const len = 420,
        wid = 190;
      g.save();
      g.translate(bx, by - 40);
      g.beginPath();
      g.moveTo(0, -20);
      g.bezierCurveTo(wid * 0.7, 30, wid * 1.2, -len * 0.4, 0, -len);
      g.bezierCurveTo(-wid * 1.2, -len * 0.4, -wid * 0.7, 30, 0, -20);
      const gr = g.createLinearGradient(0, 0, 0, -len);
      gr.addColorStop(0, "#1c4a1c");
      gr.addColorStop(1, "#3f8a2a");
      g.fillStyle = gr;
      g.fill();
      g.restore();
      veins(bx, by - 60, len - 60, wid * 0.75, "rgba(160,200,110,0.28)", 7, 1.5);
    });
  });
}

function barkTex(kind: "jungle" | "cherry") {
  return canvasTex(256, 512, (g) => {
    g.fillStyle = kind === "jungle" ? "#8a8272" : "#4a3a36";
    g.fillRect(0, 0, 256, 512);
    if (kind === "jungle") {
      for (let i = 0; i < 700; i++) {
        const x = rr(0, 256),
          y = rr(0, 512);
        g.fillStyle = rnd() < 0.5 ? `rgba(40,34,26,${rr(0.1, 0.35)})` : `rgba(200,195,170,${rr(0.05, 0.2)})`;
        g.fillRect(x, y, rr(1, 3), rr(20, 90));
      }
      for (let i = 0; i < 60; i++) {
        g.fillStyle = rnd() < 0.5 ? `rgba(180,200,160,${rr(0.15, 0.35)})` : `rgba(70,110,40,${rr(0.2, 0.45)})`;
        g.beginPath();
        g.ellipse(rr(0, 256), rr(0, 512), rr(6, 22), rr(6, 30), 0, 0, TAU);
        g.fill();
      }
    } else {
      for (let i = 0; i < 500; i++) {
        g.fillStyle = `rgba(20,12,12,${rr(0.1, 0.4)})`;
        g.fillRect(rr(0, 256), rr(0, 512), rr(4, 30), rr(2, 8));
      }
      for (let y = 0; y < 512; y += rr(10, 26)) {
        for (let x = 0; x < 256; x += rr(20, 50)) {
          g.fillStyle = `rgba(170,150,140,${rr(0.25, 0.55)})`;
          g.fillRect(x, y, rr(8, 26), rr(1.5, 3));
        }
      }
    }
  });
}

/* Wrap-aware scatter so tiling textures have no seams. */
function wrapDo(W: number, H: number, x: number, y: number, m: number, fn: (x: number, y: number) => void) {
  for (const dx of [-W, 0, W])
    for (const dy of [-H, 0, H]) {
      const X = x + dx,
        Y = y + dy;
      if (X > -m && X < W + m && Y > -m && Y < H + m) fn(X, Y);
    }
}
function groundTex(kind: "jungle" | "sakura") {
  return canvasTex(512, 512, (g) => {
    if (kind === "jungle") {
      g.fillStyle = "#4a4128";
      g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 1900; i++) {
        const x = rr(0, 512),
          y = rr(0, 512),
          a = rr(0, TAU),
          len = rr(10, 28);
        const green = rnd() < 0.25;
        wrapDo(512, 512, x, y, 30, (X, Y) => drawLeaf(g, X, Y, a, len, len * 0.35, green ? rr(70, 100) : rr(20, 42), green ? 45 : rr(30, 50), green ? rr(20, 32) : rr(16, 34), false));
      }
      for (let i = 0; i < 40; i++) {
        const x = rr(0, 512),
          y = rr(0, 512),
          r = rr(20, 60);
        wrapDo(512, 512, x, y, 60, (X, Y) => {
          const gr = g.createRadialGradient(X, Y, 0, X, Y, r);
          gr.addColorStop(0, "rgba(60,95,30,0.5)");
          gr.addColorStop(1, "rgba(60,95,30,0)");
          g.fillStyle = gr;
          g.fillRect(X - r, Y - r, r * 2, r * 2);
        });
      }
    } else {
      g.fillStyle = "#7a8a48";
      g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 6000; i++) {
        g.fillStyle = hsl(rr(65, 100), rr(30, 55), rr(26, 50), rr(0.4, 0.9));
        g.fillRect(rr(0, 512), rr(0, 512), rr(1, 3), rr(2, 6));
      }
      for (let i = 0; i < 380; i++) {
        const x = rr(0, 512),
          y = rr(0, 512),
          a = rr(0, TAU);
        wrapDo(512, 512, x, y, 8, (X, Y) => {
          g.fillStyle = `rgba(255,${rr(190, 220) | 0},${rr(205, 230) | 0},${rr(0.6, 0.95)})`;
          g.beginPath();
          g.ellipse(X, Y, rr(2, 3.5), rr(1.2, 2.2), a, 0, TAU);
          g.fill();
        });
      }
    }
  });
}

function rockTex() {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = "#8b877c";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = rnd() < 0.5 ? `rgba(30,30,26,${rr(0.05, 0.25)})` : `rgba(220,215,200,${rr(0.04, 0.16)})`;
      const x = rr(0, 256),
        y = rr(0, 256),
        s = rr(2, 12);
      wrapDo(256, 256, x, y, 12, (X, Y) => g.fillRect(X, Y, s, s * rr(0.3, 1)));
    }
  });
}

function cloudTex() {
  return canvasTex(
    256,
    256,
    (g) => {
      g.fillStyle = "#000";
      g.fillRect(0, 0, 256, 256);
      g.globalCompositeOperation = "lighter";
      for (let i = 0; i < 40; i++) {
        const a = rr(0, TAU),
          d = Math.sqrt(rnd()) * 70;
        const x = 128 + Math.cos(a) * d * 1.2,
          y = 128 + Math.sin(a) * d * 0.7,
          r = rr(25, 60);
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, "rgba(255,255,255,0.14)");
        gr.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = gr;
        g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      g.globalCompositeOperation = "multiply";
      const m = g.createRadialGradient(128, 128, 30, 128, 128, 128);
      m.addColorStop(0, "#fff");
      m.addColorStop(1, "#000");
      g.fillStyle = m;
      g.fillRect(0, 0, 256, 256);
    },
    false
  );
}

/* ------------------------------------ sky dome ------------------------------------ */
const SKY_PARS =
  /* glsl */ `uniform vec3 uTop, uMid, uHor, uGround, uSunCol, uSunDir, uCloudLit, uCloudDark;
uniform float uGlow, uSunSize, uClouds, uTime;
` +
  NOISE +
  /* glsl */ `
vec3 skyCol(vec3 d){
  float h = d.y;
  vec3 c = mix(uHor, uMid, smoothstep(0.0, 0.2, h));
  c = mix(c, uTop, smoothstep(0.18, 0.8, h));
  c = mix(c, uGround, smoothstep(0.0, -0.25, h));
  float sd = max(dot(d, uSunDir), 0.0);
  c += uSunCol * (pow(sd, 5.0) * 0.28 + pow(sd, 40.0) * 0.55) * uGlow;
  c += uSunCol * smoothstep(1.0 - uSunSize, 1.0 - uSunSize * 0.45, sd) * 2.5;
  if (uClouds > 0.0 && h > 0.0) {
    vec2 cp = d.xz / (h + 0.15);
    float n = fbm3(cp * vec2(1.1, 3.6) + vec2(uTime * 0.006, 0.0)) * 0.7 + vnoise(cp * vec2(3.0, 11.0)) * 0.3;
    float cl = smoothstep(0.5, 0.78, n) * smoothstep(0.03, 0.12, h) * (1.0 - smoothstep(0.25, 0.5, h)) * (0.55 + 0.45 * vnoise(cp * 0.35 + 4.0));
    vec3 cc = mix(uCloudDark, uCloudLit, 0.25 + 0.75 * pow(sd, 2.5));
    c = mix(c, cc, cl * uClouds);
  }
  return c;
}`;
type SkyO = { top: string; mid: string; hor: string; ground: string; glow: number; sunSize: number; clouds: number; lit?: string; dark?: string };
function skyUniforms(env: Env, o: SkyO): Record<string, THREE.IUniform> {
  return {
    uTop: { value: C(o.top) },
    uMid: { value: C(o.mid) },
    uHor: { value: C(o.hor) },
    uGround: { value: C(o.ground) },
    uCloudLit: { value: C(o.lit ?? "#fff") },
    uCloudDark: { value: C(o.dark ?? "#888") },
    uGlow: { value: o.glow },
    uSunSize: { value: o.sunSize },
    uClouds: { value: o.clouds },
    uSunDir: env.sunDir,
    uSunCol: env.sunCol,
    uTime: env.time,
  };
}
function skyDome(f: Fader, su: Record<string, THREE.IUniform>, clipHigh = 1e5) {
  const m = shMat(f, {
    u: { ...su, uClipY: { value: clipHigh } },
    vs: `varying vec3 vDir; varying float vWY; void main(){ vDir = position; vWY = (modelMatrix * vec4(position, 1.0)).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fs: `${SKY_PARS}
uniform float uFade, uClipY; varying vec3 vDir; varying float vWY;
void main(){ if (vWY > uClipY) discard; gl_FragColor = vec4(skyCol(normalize(vDir)), uFade);
#include <colorspace_fragment>
}`,
    side: THREE.BackSide,
    toneMapped: false,
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(420, 48, 24), m);
  s.renderOrder = -10;
  s.frustumCulled = false;
  return s;
}

/* ------------------------------------ water ------------------------------------ */
function waterMat(f: Fader, su: Record<string, THREE.IUniform>, o: { deep: string; canopy: string; canopyAmt: number; rip: [number, number, number]; foam: number; alpha: [number, number]; spec: number; chop: number; mirror?: boolean }) {
  const m = shMat(f, {
    fog: true,
    u: {
      ...su,
      uDeep: { value: C(o.deep) },
      uCanopy: { value: C(o.canopy) },
      uCanopyAmt: { value: o.canopyAmt },
      uRip: { value: V(...o.rip) },
      uFoam: { value: o.foam },
      uAlpha: { value: new THREE.Vector2(...o.alpha) },
      uSpec: { value: o.spec },
      uChop: { value: o.chop },
      uMirror: { value: o.mirror ? 1 : 0 },
    },
    vs: `varying vec3 vW;
#include <fog_pars_vertex>
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
    fs: `${SKY_PARS}
uniform vec3 uDeep, uCanopy, uRip; uniform float uCanopyAmt, uFoam, uSpec, uChop, uFade, uMirror; uniform vec2 uAlpha;
varying vec3 vW;
#include <fog_pars_fragment>
void main(){
  vec2 p = vW.xz; float t = uTime;
  vec2 g = vec2(0.0);
  g += vec2(0.6, 0.8) * cos(dot(p, vec2(0.6, 0.8)) * 1.9 + t * 1.2) * 0.5;
  g += vec2(-0.8, 0.45) * cos(dot(p, vec2(-0.8, 0.45)) * 3.3 + t * 1.7) * 0.35;
  g += vec2(0.25, -0.95) * cos(dot(p, vec2(0.25, -0.95)) * 6.1 + t * 2.6) * 0.2;
  float e = 0.2; vec2 np = p * 1.7 + vec2(t * 0.25, t * 0.18);
  float n0 = vnoise(np);
  g += vec2(vnoise(np + vec2(e, 0.0)) - n0, vnoise(np + vec2(0.0, e)) - n0) / e * 0.45;
  vec2 dq = p - uRip.xy; float dr = length(dq);
  g += dq / (dr + 0.001) * cos(dr * 5.0 - t * 4.0) * exp(-dr * uRip.z) * 1.4;
  vec3 n = normalize(vec3(-g.x * uChop, 1.0, -g.y * uChop));
  vec3 v = normalize(vW - cameraPosition);
  vec3 r = reflect(v, n); r.y = abs(r.y);
  float fr = 0.02 + 0.98 * pow(1.0 - max(dot(-v, n), 0.0), 5.0);
  vec3 refl = skyCol(r);
  refl = mix(refl, uCanopy, uCanopyAmt * (1.0 - smoothstep(uAlpha.x * 0.0 + 0.16, 0.5, r.y)) * smoothstep(-0.02, 0.05, r.y + vnoise(p * vec2(0.4, 2.5)) * 0.08));
  vec3 col = mix(uDeep, refl, fr);
  float sd = max(dot(r, uSunDir), 0.0);
  col += uSunCol * (pow(sd, 300.0) * 6.0 + pow(sd, 24.0) * 0.3) * uSpec;
  float foam = (smoothstep(0.5, 0.9, vnoise(p * 4.0 + vec2(0.0, t * 0.8)) * exp(-dr * 0.45) * 1.7) + exp(-dr * 1.1) * 0.7) * uFoam;
  foam = clamp(foam, 0.0, 1.0);
  col = mix(col, vec3(0.86, 0.9, 0.86), foam);
  if (uMirror > 0.5) {
    // mirrored scene is already behind the surface: add transmission tint + glints (premultiplied)
    float a = mix(uAlpha.x, uAlpha.y, fr);
    vec3 glint = uSunCol * (pow(sd, 300.0) * 6.0 + pow(sd, 24.0) * 0.25) * uSpec + refl * clamp(length(g) * uChop * 5.0 - 0.1, 0.0, 1.0) * 0.18;
    gl_FragColor = vec4(((uDeep * a + glint) * (1.0 - foam) + vec3(0.86, 0.9, 0.86) * foam) * uFade, max(a, foam) * uFade);
  } else
  gl_FragColor = vec4(col, max(mix(uAlpha.x, uAlpha.y, fr), foam) * uFade);
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
}`,
  });
  if (o.mirror) {
    m.blending = THREE.CustomBlending;
    m.blendSrc = THREE.OneFactor;
    m.blendDst = THREE.OneMinusSrcAlphaFactor;
  }
  return m;
}

/* ------------------------------ particles & volumes ------------------------------ */
/* Falling / drifting petals or leaves, fully GPU animated inside a wrapping box. */
function drifters(f: Fader, env: Env, n: number, o: { min: V3; size: V3; wind: V3; fall: number; swirl: number; sz: [number, number]; colA: string; colB: string; shape: 0 | 1; base?: number }) {
  const pos = new Float32Array(n * 3),
    sd = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    pos.set([o.min.x + rnd() * o.size.x, o.min.y + rnd() * o.size.y, o.min.z + rnd() * o.size.z], i * 3);
    sd.set([rnd(), rnd(), rnd(), rr(o.sz[0], o.sz[1])], i * 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aS", new THREE.BufferAttribute(sd, 4));
  const uScale = { value: 800 };
  const m = shMat(f, {
    fog: true,
    base: o.base,
    u: { uTime: env.time, uScale, uMin: { value: o.min }, uSize: { value: o.size }, uWind: { value: o.wind }, uFall: { value: o.fall }, uSwirl: { value: o.swirl }, uColA: { value: C(o.colA) }, uColB: { value: C(o.colB) }, uShape: { value: o.shape } },
    vs: `attribute vec4 aS; uniform vec3 uMin, uSize, uWind; uniform float uTime, uScale, uFall, uSwirl;
varying float vSpin, vFlip, vA, vT;
#include <fog_pars_vertex>
void main(){
  float t = uTime;
  vec3 p = position + uWind * t * (0.7 + aS.y * 0.6);
  p += vec3(sin(t * 0.7 + aS.x * 30.0) * uSwirl, -uFall * t * (0.6 + aS.y * 0.8) + sin(t * 1.3 + aS.z * 20.0) * 0.25 * uSwirl, cos(t * 0.6 + aS.y * 25.0) * uSwirl);
  p = uMin + mod(p - uMin, uSize);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float d = -mvPosition.z;
  gl_PointSize = clamp(aS.w * uScale / d, 1.0, 96.0);
  vSpin = t * (0.6 + aS.x * 1.8) + aS.y * 6.28;
  vFlip = cos(t * (1.2 + aS.z * 2.2) + aS.x * 6.28);
  vA = smoothstep(0.35, 1.4, d);
  vT = aS.z;
#include <fog_vertex>
}`,
    fs: `uniform vec3 uColA, uColB; uniform float uFade, uShape; varying float vSpin, vFlip, vA, vT;
#include <fog_pars_fragment>
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float cs = cos(vSpin), sn = sin(vSpin);
  c = vec2(cs * c.x - sn * c.y, sn * c.x + cs * c.y);
  float fl = max(abs(vFlip), 0.18);
  c.x /= fl;
  float e;
  if (uShape < 0.5) { e = length(vec2(c.x * 2.3, (c.y + 0.04) * 1.75)); e += smoothstep(0.08, 0.0, abs(c.x)) * smoothstep(0.1, 0.3, c.y) * 0.6; }
  else { e = length(vec2(c.x * 3.4, c.y * 1.9)); }
  float a = 1.0 - smoothstep(0.4, 0.5, e);
  if (a < 0.03) discard;
  vec3 col = mix(uColA, uColB, vT) * (0.7 + 0.45 * fl) * (0.85 + 0.3 * smoothstep(0.5, 0.0, e));
  gl_FragColor = vec4(col, a * vA * uFade);
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
}`,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  pointScale(pts, uScale);
  pts.renderOrder = 22;
  return pts;
}

/* Glowing motes (dust in light shafts / fireflies). */
function motes(f: Fader, env: Env, pts: V3[], o: { col: string; sz: [number, number]; kind: 0 | 1; drift: number; base?: number }) {
  const n = pts.length;
  const pos = new Float32Array(n * 3),
    sd = new Float32Array(n * 4);
  pts.forEach((p, i) => {
    pos.set([p.x, p.y, p.z], i * 3);
    sd.set([rnd(), rnd(), rnd(), rr(o.sz[0], o.sz[1])], i * 4);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aS", new THREE.BufferAttribute(sd, 4));
  const uScale = { value: 800 };
  const m = shMat(f, {
    fog: true,
    add: true,
    base: o.base,
    u: { uTime: env.time, uScale, uCol: { value: C(o.col) }, uKind: { value: o.kind }, uDrift: { value: o.drift } },
    vs: `attribute vec4 aS; uniform float uTime, uScale, uKind, uDrift; uniform float fogDensity; varying float vA;
void main(){
  float t = uTime;
  vec3 p = position + vec3(sin(t * 0.13 + aS.x * 40.0), sin(t * 0.09 + aS.y * 33.0) * 0.6 + sin(t * 0.5 + aS.z * 9.0) * 0.15 * uKind, cos(t * 0.11 + aS.z * 27.0)) * uDrift;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float d = -mvPosition.z;
  gl_PointSize = clamp(aS.w * uScale / d, 1.0, 48.0);
  float tw = uKind < 0.5 ? 0.45 + 0.55 * sin(t * 1.3 + aS.x * 50.0) : smoothstep(0.35, 1.0, sin(t * (0.6 + aS.y) + aS.z * 40.0));
  vA = tw * smoothstep(0.6, 3.0, d) * exp(-fogDensity * fogDensity * d * d * 0.6);
}`,
    fs: `uniform vec3 uCol; uniform float uFade; varying float vA;
void main(){ float d = length(gl_PointCoord - 0.5); float a = pow(max(0.0, 1.0 - d * 2.0), 1.8);
  gl_FragColor = vec4(uCol, a * vA * uFade);
#include <colorspace_fragment>
}`,
  });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  pointScale(p, uScale);
  p.renderOrder = 24;
  return p;
}

/* Volumetric light shafts: camera-facing additive ribbons along the sun direction. */
function godRays(f: Fader, env: Env, rays: { g: V3; len: number; w: number; i: number }[], cam: V3, col: string, base: number) {
  const P: number[] = [],
    UV: number[] = [],
    S: number[] = [],
    I: number[] = [];
  const A = env.sunDir.value.clone();
  rays.forEach((r, k) => {
    const mid = r.g.clone().addScaledVector(A, r.len / 2);
    const W = V().crossVectors(A, cam.clone().sub(mid).normalize()).normalize();
    const s = rnd();
    for (const [u, v] of [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]) {
      const p = r.g
        .clone()
        .addScaledVector(A, v * r.len)
        .addScaledVector(W, (u - 0.5) * r.w * (0.8 + 0.5 * v));
      P.push(p.x, p.y, p.z);
      UV.push(u, v);
      S.push(s, r.i);
    }
    const b = k * 4;
    I.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2));
  g.setAttribute("aS", new THREE.Float32BufferAttribute(S, 2));
  g.setIndex(I);
  const m = shMat(f, {
    fog: true,
    add: true,
    base,
    side: THREE.DoubleSide,
    u: { uTime: env.time, uCol: { value: C(col) } },
    vs: `attribute vec2 aS; varying vec2 vUv; varying vec2 vS; varying float vD;
void main(){ vUv = uv; vS = aS; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fs: `${NOISE}
uniform vec3 uCol; uniform float uTime, uFade; uniform float fogDensity; varying vec2 vUv; varying vec2 vS; varying float vD;
void main(){
  float across = pow(sin(3.14159 * vUv.x), 2.2);
  float along = smoothstep(0.0, 0.3, vUv.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
  float n = vnoise(vec2(vUv.x * 4.0 + vS.x * 17.0, vUv.y * 1.2 - uTime * 0.035));
  float fl = 0.7 + 0.3 * sin(uTime * 0.3 + vS.x * 6.28);
  float a = across * along * (0.45 + 0.55 * n) * fl * vS.y * smoothstep(1.5, 7.0, vD) * (0.45 + 0.55 * exp(-fogDensity * fogDensity * vD * vD * 0.5));
  gl_FragColor = vec4(uCol, a * uFade);
#include <colorspace_fragment>
}`,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.renderOrder = 20;
  mesh.frustumCulled = false;
  return mesh;
}

/* Drifting mist billboards (instanced). */
function mistLayer(f: Fader, env: Env, items: { p: V3; s: number; a: number; str: number; sp: number }[], col: string, groundY: number, range: number, base = 1) {
  const plane = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.index = plane.index;
  g.setAttribute("position", plane.attributes.position);
  g.setAttribute("uv", plane.attributes.uv);
  const M = new Float32Array(items.length * 4),
    Nn = new Float32Array(items.length * 4);
  items.forEach((it, i) => {
    M.set([it.p.x, it.p.y, it.p.z, it.s], i * 4);
    Nn.set([it.sp, rnd(), it.a, it.str], i * 4);
  });
  g.setAttribute("aM", new THREE.InstancedBufferAttribute(M, 4));
  g.setAttribute("aN", new THREE.InstancedBufferAttribute(Nn, 4));
  g.instanceCount = items.length;
  const m = shMat(f, {
    fog: true,
    base,
    u: { uTime: env.time, uTex: { value: cloudTex() }, uCol: { value: C(col) }, uGround: { value: groundY }, uRange: { value: range } },
    vs: `attribute vec4 aM; attribute vec4 aN; uniform float uTime, uRange; varying vec2 vUv; varying float vA, vY, vD;
#include <fog_pars_vertex>
void main(){
  vec3 c = aM.xyz;
  c.x += uTime * aN.x;
  c.x = mod(c.x + uRange, 2.0 * uRange) - uRange;
  c.y += sin(uTime * 0.2 + aN.y * 6.28) * 0.3;
  vec4 mvPosition = viewMatrix * vec4(c, 1.0);
  vec2 q = position.xy * aM.w * vec2(aN.w, 1.0);
  mvPosition.xy += q;
  vY = c.y + q.y;
  vA = aN.z * smoothstep(uRange, uRange * 0.75, abs(c.x));
  vD = -mvPosition.z;
  vUv = uv;
  gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
    fs: `uniform sampler2D uTex; uniform vec3 uCol; uniform float uFade, uGround; varying vec2 vUv; varying float vA, vY, vD;
#include <fog_pars_fragment>
void main(){
  float a = texture2D(uTex, vUv).r * vA * smoothstep(uGround, uGround + 1.6, vY) * smoothstep(0.8, 6.0, vD);
  gl_FragColor = vec4(uCol, a * uFade);
#include <colorspace_fragment>
#include <fog_fragment>
}`,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  mesh.renderOrder = 21;
  return mesh;
}

/* Macaw-like bird silhouette in XZ (heading +z), wings along x. */
function birdGeo(body: string, wingIn: string, wingMid: string, wingTip: string, tail: string) {
  const P: number[] = [],
    Cc: number[] = [];
  const tri = (a: number[], b: number[], c: number[], ca: string, cb: string, cc: string) => {
    P.push(...a, ...b, ...c);
    for (const x of [ca, cb, cc]) {
      const k = C(x);
      Cc.push(k.r, k.g, k.b);
    }
  };
  tri([0, 0, 0.36], [0.07, 0.01, 0.1], [-0.07, 0.01, 0.1], body, body, body);
  tri([0.07, 0.01, 0.1], [0, 0, -0.2], [-0.07, 0.01, 0.1], body, body, body);
  tri([0.04, 0, -0.14], [0, 0, -0.8], [-0.04, 0, -0.14], tail, tail, tail);
  for (const s of [-1, 1]) {
    const a = [s * 0.06, 0, 0.13],
      b = [s * 0.06, 0, -0.1],
      c = [s * 0.34, 0, -0.08],
      d = [s * 0.32, 0, 0.14],
      e = [s * 0.74, 0, -0.1],
      g = [s * 0.6, 0, 0.08];
    tri(a, b, c, wingIn, wingIn, wingMid);
    tri(a, c, d, wingIn, wingMid, wingMid);
    tri(d, c, e, wingMid, wingMid, wingTip);
    tri(d, e, g, wingMid, wingTip, wingTip);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(Cc, 3));
  g.computeVertexNormals();
  sway(g);
  return g;
}
const FLAP = (speed: number, amp: number, bias: number, hinge: number) => /* glsl */ `
{
  float ph_ = float(gl_InstanceID) * 1.93;
  float ax_ = max(abs(position.x) - ${hinge.toFixed(3)}, 0.0);
  float a_ = sin(uTime * ${speed.toFixed(2)} + ph_) * ${amp.toFixed(2)} + ${bias.toFixed(2)};
  transformed.x = sign(position.x) * (min(abs(position.x), ${hinge.toFixed(3)}) + ax_ * cos(a_));
  transformed.y += ax_ * sin(a_);
}`;

/* Leaf / frond strip arching out from the origin (for ferns & palm crowns). */
function frondStrip(len: number, wid: number, elev: number, droop: number, yaw: number, segs = 10) {
  const g = new THREE.PlaneGeometry(1, 1, 2, segs);
  const p = g.attributes.position;
  const uv = g.attributes.uv;
  const dir = V(Math.cos(yaw), 0, Math.sin(yaw)),
    side = V(-Math.sin(yaw), 0, Math.cos(yaw));
  for (let i = 0; i < p.count; i++) {
    const u = uv.getX(i),
      v = uv.getY(i);
    const s = v * len;
    const along = Math.cos(elev) * s;
    const up = Math.sin(elev) * s - droop * s * s;
    const w = (u - 0.5) * wid * (1 - v * 0.55) * Math.sin(Math.min(1, v * 5 + 0.2) * 1.5);
    const fold = -Math.abs(u - 0.5) * wid * 0.25;
    p.setXYZ(i, dir.x * along + side.x * w, up + fold, dir.z * along + side.z * w);
  }
  g.computeVertexNormals();
  return g;
}

/* ============================================================================================
 *                                         RAINFOREST
 * ============================================================================================ */
export function jungle(ctx: Ctx): World {
  seed(4242);
  const L = ctx.lite;
  const n = (d: number, m = 0.45) => Math.max(1, Math.round(L ? d * m : d));
  const group = new THREE.Group();
  const f = new Fader();
  const env = mkEnv(V(0.2, 0.6, -0.78), "#ffe0a0", [0.3, 0.12]);
  const sunD = env.sunDir.value;
  const camRef = V(0, 1.4, 6);

  const su = skyUniforms(env, { top: "#a9c592", mid: "#d7e3b6", hor: "#eef1d4", ground: "#7f9670", glow: 1.3, sunSize: 0.004, clouds: 0 });
  group.add(skyDome(f, su));

  /* ---- landform ---- */
  const WL = -2.2;
  {
    const sm_ = skyDome(f, su, WL);
    group.add(mirrorOf(sm_, sm_.material as THREE.Material, WL));
  }
  const addM = <T extends THREE.Mesh>(mesh: T, o: NatOpts) => {
    group.add(mesh);
    group.add(mirrorOf(mesh, natMat(f, env, { ...o, clip: [-1e5, WL] }), WL));
    return mesh;
  };
  const PX = 3,
    PZ = -24,
    PRX = 8,
    PRZ = 6;
  const poolD = (x: number, z: number) => Math.hypot((x - PX) / PRX, (z - PZ) / PRZ);
  const cliffTop = (x: number) => lerp(10.6, 11 + fbm2(x * 0.05, 3.3, 4) * 16, sm(2, 9, Math.abs(x - PX)));
  const cliffZ = (x: number, y: number) => {
    let z = -30 + Math.min(0.012 * (x - PX) ** 2, 9);
    z += (fbm2(x * 0.14, y * 0.14, 4) - 0.5) * 3.4 + (noise2(x * 0.7, y * 0.7) - 0.5) * 0.7 + Math.sin(y * 1.1 + noise2(x * 0.1, y * 0.2) * 4) * 0.35;
    const rec = 1 - sm(2.4, 5.5, Math.abs(x - PX));
    z = lerp(z, -31.6 + (noise2(x * 0.8, y * 0.8) - 0.5) * 0.5, rec * 0.85);
    const top = cliffTop(x);
    if (y > top) z -= (y - top) * 2.2;
    return z;
  };
  const hJ = (x: number, z: number) => {
    const d = poolD(x, z);
    let h = -2 + (fbm2(x * 0.07 + 3, z * 0.07 + 1, 4) - 0.5) * 1.5 * sm(1.05, 1.8, d);
    h += sm(1.2, 0.7, d) * -1.4 + sm(1.4, 1.12, d) * sm(0.95, 1.12, d) * 0.18;
    h += Math.max(0, Math.abs(x - 2) - 15) * 0.2;
    if (d > 1.22) h = Math.max(h, WL + 0.12);
    return h;
  };

  const gTex = groundTex("jungle");
  gTex.wrapS = gTex.wrapT = THREE.RepeatWrapping;
  gTex.anisotropy = 4;
  const moss = C("#a9c46a"),
    soil = C("#d9c49a"),
    wet = C("#5d6c44");
  const ground = new THREE.Mesh(
    terrainGeo(
      240,
      190,
      L ? 90 : 150,
      L ? 70 : 120,
      2,
      -55,
      hJ,
      (x, y, z, c) => {
        c.copy(soil).lerp(moss, sm(0.35, 0.7, fbm2(x * 0.09, z * 0.09, 3)));
        c.lerp(wet, sm(1.25, 0.9, poolD(x, z)));
      },
      26
    ),
    natMat(f, env, { map: gTex, vc: true, ao: [0.8, -2.5, 2], clip: [WL - 0.01, 1e5] })
  );
  group.add(ground);

  // cliff + waterfall amphitheatre
  {
    const g = new THREE.PlaneGeometry(96, 40, L ? 80 : 130, L ? 36 : 60);
    g.translate(PX, 17, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i);
      p.setZ(i, cliffZ(x, y));
    }
    g.computeVertexNormals();
    const nn = g.attributes.normal;
    const cl = new Float32Array(p.count * 3);
    const rock = C("#6d6a5c"),
      mossC = C("#56742e"),
      dark = C("#2f3228");
    const c = C(0xffffff);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i);
      const m = 0.3 + 0.7 * sm(0.0, 0.5, nn.getY(i) + (fbm2(x * 0.2, y * 0.2, 3) - 0.5) * 1.4) + sm(cliffTop(x) - 1, cliffTop(x) + 1, y);
      c.copy(rock).lerp(mossC, Math.min(1, m)).multiplyScalar(0.75 + 0.5 * noise2(x * 0.5, y * 0.5));
      c.lerp(dark, (1 - sm(2.2, 6, Math.abs(x - PX))) * 0.7);
      cl.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(cl, 3));
    sway(g);
    const rt = rockTex();
    rt.wrapS = rt.wrapT = THREE.RepeatWrapping;
    rt.repeat.set(10, 5);
    const co: NatOpts = { map: rt, vc: true, ao: [0.55, -2, 8] };
    addM(new THREE.Mesh(g, natMat(f, env, co)), co);
  }

  // waterfall strands
  {
    const strand = (x0: number, top: number, w0: number, zb: number) => {
      const g = new THREE.PlaneGeometry(1, 1, 8, 44);
      const p = g.attributes.position;
      const uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        const u = uv.getX(i),
          v = uv.getY(i);
        const w = w0 * (1 + (1 - v) * 0.45);
        p.setXYZ(i, x0 + (u - 0.5) * w + Math.sin(v * 3) * 0.15, WL - 0.25 + v * (top - WL + 0.25), zb + 1.1 * sm(0.86, 1.0, v) + (1 - v) * 0.6);
      }
      return g;
    };
    const g = mergeGeometries([strand(PX, 10.8, 3.8, -30.4), strand(PX - 3.1, 7.4, 0.9, -30.9)])!;
    const fallMat = (clip: number) => shMat(f, {
      fog: true,
      u: { uTime: env.time, uSunCol: env.sunCol, uClipY: { value: clip } },
      vs: `varying vec2 vUv; varying float vWY;
#include <fog_pars_vertex>
void main(){ vUv = uv; vWY = (modelMatrix * vec4(position, 1.0)).y; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
      fs: `${NOISE}
uniform float uTime, uFade, uClipY; uniform vec3 uSunCol; varying vec2 vUv; varying float vWY;
#include <fog_pars_fragment>
void main(){
  if (vWY > uClipY) discard;
  vec2 uv = vUv;
  float en = vnoise(vec2(uv.y * 7.0 + uTime * 1.8, 1.3)) * 0.14;
  float edge = smoothstep(en, 0.16 + en, uv.x) * smoothstep(1.0 - en, 0.84 - en, uv.x);
  float n1 = fbm3(vec2(uv.x * 9.0, uv.y * 2.4 + uTime * 1.15));
  float n2 = vnoise(vec2(uv.x * 28.0, uv.y * 6.0 + uTime * 2.6));
  float streak = smoothstep(0.3, 0.85, n1 * 0.75 + n2 * 0.4);
  float foam = smoothstep(0.2, 0.0, uv.y);
  float a = edge * (0.4 + 0.6 * streak);
  a = max(a, foam * edge * 0.95);
  vec3 col = mix(vec3(0.34, 0.44, 0.4), vec3(0.95, 0.98, 0.94), clamp(streak * 1.1 + foam, 0.0, 1.0));
  col *= 0.85 + 0.35 * uSunCol;
  gl_FragColor = vec4(col, a * uFade);
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
}`,
    });
    const fall = new THREE.Mesh(g, fallMat(1e5));
    fall.renderOrder = 12;
    group.add(fall, mirrorOf(fall, fallMat(WL), WL));
  }

  // pool
  {
    const g = new THREE.CircleGeometry(1, 72);
    g.rotateX(-Math.PI / 2);
    g.scale(PRX * 1.28, 1, PRZ * 1.28);
    g.translate(PX, WL, PZ);
    const w = new THREE.Mesh(g, waterMat(f, su, { deep: "#16261c", canopy: "#34502a", canopyAmt: 0, rip: [PX, -30.2, 0.3], foam: 0.9, alpha: [0.7, 0.12], spec: 0.8, chop: 0.07, mirror: true }));
    w.renderOrder = 11;
    group.add(w);
  }

  /* ---- rocks & fallen logs ---- */
  {
    const list: THREE.BufferGeometry[] = [];
    const rock = C("#a8a290"),
      mossC = C("#7f9e48");
    const add = (x: number, z: number, s: number, sy: number, y?: number) => {
      const g = rockGeo(s * rr(0.8, 1.3), s * sy, s * rr(0.8, 1.2), rr(0, 50), rock, mossC);
      g.rotateY(rr(0, TAU));
      g.translate(x, y ?? hJ(x, z) - 0.1 * s, z);
      list.push(g);
    };
    for (let i = 0; i < n(26); i++) {
      const a = rr(0, TAU),
        d = rr(0.95, 1.2);
      const x = PX + Math.cos(a) * PRX * d,
        z = PZ + Math.sin(a) * PRZ * d;
      if (z < -29.5) continue;
      add(x, z, rr(0.5, 1.4), rr(0.5, 0.8));
    }
    for (let i = 0; i < 7; i++) add(PX + rr(-5, 5), -29 + rr(-0.5, 1.5), rr(0.8, 1.8), rr(0.5, 0.9), WL - 0.2);
    for (let i = 0; i < n(18); i++) {
      const x = rr(-24, 26),
        z = rr(-26, 5);
      if (poolD(x, z) < 1.3) continue;
      add(x, z, rr(0.3, 1.1), rr(0.4, 0.7));
    }
    // mossy logs
    const logs: [number, number, number, number, number][] = [
      [-5.5, -5, 0.4, 7, 0.5],
      [9, -12, 0.5, 9, -0.3],
      [-11, -16, 0.45, 8, 1.1],
    ];
    for (const [x, z, r, len, yaw] of logs) {
      let g: THREE.BufferGeometry = new THREE.CylinderGeometry(r, r * 1.1, len, 12, 10);
      g.deleteAttribute("uv");
      g.deleteAttribute("normal");
      g = mergeVertices(g);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const k = 1 + (noise2(p.getY(i) * 1.5, Math.atan2(p.getZ(i), p.getX(i)) * 2) - 0.5) * 0.3;
        p.setXYZ(i, p.getX(i) * k, p.getY(i), p.getZ(i) * k);
      }
      g.computeVertexNormals();
      const nn = g.attributes.normal;
      const cl = new Float32Array(p.count * 3);
      const c = C(0xffffff);
      for (let i = 0; i < p.count; i++) {
        c.set("#8a7658").lerp(C("#86a64a"), sm(-0.3, 0.6, nn.getX(i) + (noise2(p.getY(i), p.getX(i) * 3) - 0.5)));
        cl.set([c.r, c.g, c.b], i * 3);
      }
      g.setAttribute("color", new THREE.BufferAttribute(cl, 3));
      boxUv(g, 0.6);
      g.rotateZ(Math.PI / 2);
      g.rotateY(yaw);
      g.translate(x, hJ(x, z) + r * 0.6, z);
      list.push(g);
    }
    const g = mergeGeometries(list)!;
    sway(g);
    const rt = rockTex();
    rt.wrapS = rt.wrapT = THREE.RepeatWrapping;
    const ro: NatOpts = { map: rt, vc: true, ao: [0.6, -2.5, 3] };
    addM(new THREE.Mesh(g, natMat(f, env, ro)), ro);
  }

  /* ---- trees ---- */
  const trees: { x: number; z: number; s: number; y: number; h: number }[] = [];
  const TH = 19;
  const okTree = (x: number, z: number, r: number) => {
    if (poolD(x, z) < 1.35) return false;
    if (z < cliffZ(x, 0) + 2.5) return false;
    if (Math.abs(x - lerp(0.5, PX, sm(4, -16, z))) < 3.2 + Math.max(0, -z) * 0.03 && z < 7) return false;
    for (const t of trees) if (Math.hypot(t.x - x, t.z - z) < r + t.s * 2.2) return false;
    return true;
  };
  const addTree = (x: number, z: number, s: number) => trees.push({ x, z, s, y: hJ(x, z), h: TH * s });
  addTree(-7.6, 0.5, 1.12);
  addTree(9.2, -3.5, 1.02);
  addTree(-10, -9, 1.2);
  addTree(12, -14, 1.35);
  for (let k = 0; trees.length < n(40, 0.55) && k < 3000; k++) {
    const x = rr(-40, 44),
      z = rr(-40, 4);
    const s = rr(0.7, 1.3);
    if (okTree(x, z, s * 2.2)) addTree(x, z, s);
  }
  // thin understory saplings
  const saplings: { x: number; z: number; s: number }[] = [];
  for (let k = 0; saplings.length < n(26) && k < 2000; k++) {
    const x = rr(-26, 30),
      z = rr(-28, 3);
    if (okTree(x, z, 1)) saplings.push({ x, z, s: rr(0.5, 0.9) });
  }

  {
    const g = new THREE.CylinderGeometry(1, 1, TH + 1, L ? 28 : 44, 34, true);
    g.translate(0, (TH + 1) / 2 - 1, 0);
    const p = g.attributes.position,
      uv = g.attributes.uv;
    const cl = new Float32Array(p.count * 3);
    const bark = C("#e8e2d0"),
      mossC = C("#8cab5a"),
      dark = C("#6a6452");
    const c = C(0xffffff);
    for (let i = 0; i < p.count; i++) {
      const th = uv.getX(i) * TAU,
        y = p.getY(i);
      const yn = Math.max(0, y) / TH;
      const ny = (noise2(Math.cos(th) * 2 + y * 0.5, Math.sin(th) * 2 + y * 0.3) - 0.5) * 0.14;
      let r = 0.48 * (1 - 0.42 * yn) + 0.25 * Math.exp(-Math.max(0, y) / 0.7);
      const finA = 0.6 + 0.8 * noise2(Math.cos(th * 5) * 1.3 + 2, Math.sin(th * 5) * 1.3);
      const finShape = Math.pow(Math.max(0, Math.cos(5 * th + Math.sin(th * 2) * 0.6)), 12);
      const hf = 2.6 + 2.4 * finA;
      r += finShape * 3.0 * finA * Math.pow(Math.max(0, 1 - Math.max(0, y) / hf), 2.4);
      const recess = (1 - finShape) * Math.pow(Math.max(0, 1 - Math.max(0, y) / hf), 1.5);
      r += Math.pow(Math.max(0, Math.cos(3 * th + 1.3)), 6) * 0.25 * Math.exp(-Math.max(0, y) / 5);
      r += ny;
      const bend = Math.sin(yn * 2.2) * 0.6;
      p.setXYZ(i, Math.cos(th) * r + bend, y, Math.sin(th) * r);
      uv.setXY(i, uv.getX(i) * 2, y / 4);
      const m = sm(0.5, 0.85, noise2(Math.cos(th) * 1.5 + 5, y * 0.35 + Math.sin(th)) * 0.8 + (1 - yn) * 0.45 + Math.max(0, Math.cos(th - 1)) * 0.15);
      c.copy(bark).lerp(mossC, m).multiplyScalar(1.15 * (1 - recess * 0.45));
      if (y < 1.5) c.lerp(dark, (1.5 - y) * 0.3);
      cl.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(cl, 3));
    g.computeVertexNormals();
    sway(g);
    const bt = barkTex("jungle");
    bt.wrapS = bt.wrapT = THREE.RepeatWrapping;
    const items: Inst[] = trees.map((t) => ({ p: V(t.x, t.y, t.z), r: [0, rr(0, TAU), rr(-0.03, 0.03)], s: [t.s, t.s, t.s], c: C(0xffffff).multiplyScalar(rr(0.8, 1.05)) }));
    for (const s of saplings) items.push({ p: V(s.x, hJ(s.x, s.z), s.z), r: [0, rr(0, TAU), rr(-0.08, 0.08)], s: [s.s * 0.28, s.s * 0.5, s.s * 0.28], c: C(0xffffff).multiplyScalar(0.8) });
    // trunks on the cliff plateau
    for (let i = 0; i < n(10); i++) {
      const x = rr(-30, 36);
      if (Math.abs(x - PX) < 6) continue;
      const tp = cliffTop(x);
      items.push({ p: V(x, tp - 1.5, cliffZ(x, tp) - rr(2, 8)), r: [0, rr(0, TAU), 0], s: [rr(0.8, 1.2), rr(0.6, 0.9), rr(0.8, 1.2)] });
    }
    const to: NatOpts = { map: bt, vc: true, ao: [0.75, -2, 10], back: 0.1 };
    addM(instanced(g, natMat(f, env, to), items), to);
  }

  /* ---- canopy + understory leaf clusters (one draw) ---- */
  {
    const tex = clusterAtlas({ h: [78, 122], s: [42, 72], l: [20, 44] }, "#3b3322", [64, 10]);
    tex.anisotropy = 4;
    const g = new THREE.PlaneGeometry(1, 1, 2, 2);
    g.attributes.position.setZ(4, 0.18);
    sway(g, (x, y) => 0.7 + Math.hypot(x, y) * 0.6);
    const items: Inst[] = [];
    const tint = (k: number) => {
      const c = C(0xffffff);
      const r = rnd();
      if (r < 0.25) c.setRGB(1.1, 1.05, 0.75);
      else if (r < 0.5) c.setRGB(0.85, 1.0, 0.85);
      else if (r < 0.7) c.setRGB(0.95, 0.95, 1.0);
      return c.multiplyScalar(k);
    };
    for (const t of trees) {
      const top = t.y + t.h - 1.5 * t.s;
      const cnt = Math.round(n(30, 0.5) * t.s);
      for (let i = 0; i < cnt; i++) {
        const a = rr(0, TAU),
          d = Math.sqrt(rnd());
        const R = 5.5 * t.s;
        const x = t.x + Math.cos(a) * R * d,
          z = t.z + Math.sin(a) * R * d;
        const y = top + rr(-2.2, 1.6) * t.s - d * d * 2.5 * t.s;
        items.push({ p: V(x, y, z), r: [-Math.PI / 2 + rr(-0.9, 0.9), rr(0, TAU), rr(0, TAU)], s: rr(3.2, 5.8) * Math.min(1.2, t.s), c: tint(0.62 + 0.45 * d), cell: Math.floor(rnd() * 4) });
      }
      // epiphytes & low branches on trunk
      for (let i = 0; i < n(4); i++) {
        const y = t.y + rr(3, t.h * 0.6);
        const a = rr(0, TAU);
        items.push({ p: V(t.x + Math.cos(a) * 0.9 * t.s, y, t.z + Math.sin(a) * 0.9 * t.s), r: [rr(-0.8, 0.8), rr(0, TAU), rr(0, TAU)], s: rr(1.2, 2.4), c: tint(0.7), cell: Math.floor(rnd() * 4) });
      }
    }
    // saplings' crowns
    for (const s of saplings) {
      const top = hJ(s.x, s.z) + TH * s.s * 0.5;
      for (let i = 0; i < 5; i++) items.push({ p: V(s.x + rr(-1.5, 1.5), top + rr(-1.5, 0.5), s.z + rr(-1.5, 1.5)), r: [rr(-1.2, -0.3), rr(0, TAU), rr(0, TAU)], s: rr(1.8, 3), c: tint(0.7), cell: Math.floor(rnd() * 4) });
    }
    // continuous ceiling filler + plateau forest above the cliff
    for (let i = 0; i < n(260); i++) {
      const x = rr(-46, 50),
        z = rr(-30, 6);
      const y = rr(11, 19) + Math.max(0, -z) * 0.1;
      if (Math.abs(x - 1.5) < 5 && z > -4) continue;
      items.push({ p: V(x, y, z), r: [rr(-0.9, 0.9) - Math.PI / 2, rr(0, TAU), rr(0, TAU)], s: rr(4, 7), c: tint(rr(0.6, 1)), cell: Math.floor(rnd() * 4) });
    }
    // hanging greenery on the cliff face
    for (let i = 0; i < n(420, 0.8); i++) {
      const x = PX + (rnd() < 0.5 ? -1 : 1) * rr(2.6, 30);
      const tp = cliffTop(x);
      const y = tp - Math.pow(rnd(), 0.7) * (tp + 1);
      items.push({ p: V(x, y, cliffZ(x, y) + rr(0.2, 1.0)), r: [rr(-0.6, 0.6), rr(-0.8, 0.8), rr(0, TAU)], s: rr(2.2, 4.8), c: tint(rr(0.55, 0.95)), cell: Math.floor(rnd() * 4) });
    }
    for (let i = 0; i < n(300, 0.7); i++) {
      const x = rr(-46, 52);
      const tp = cliffTop(x);
      const y = tp + rr(-0.5, 9);
      const z = cliffZ(x, Math.min(y, tp)) - rr(0.5, 14) * sm(tp - 1, tp + 3, y) - 0.4;
      items.push({ p: V(x, y, z), r: [rr(-0.7, 0.7), rr(0, TAU), rr(0, TAU)], s: rr(3.5, 7), c: tint(rr(0.65, 1.05)), cell: Math.floor(rnd() * 4) });
    }
    // understory shrubs
    for (let i = 0; i < n(340); i++) {
      const x = rr(-30, 32),
        z = rr(-29, 7);
      if (poolD(x, z) < 1.15) continue;
      if (Math.abs(x - lerp(0.5, PX, sm(4, -16, z))) < 2.2 && z > -18) continue;
      const y = hJ(x, z) + rr(0.2, 3.2);
      items.push({ p: V(x, y, z), r: [rr(-0.9, 0.9), rr(0, TAU), rr(0, TAU)], s: rr(1.4, 3.2), c: tint(rr(0.55, 0.85)), cell: Math.floor(rnd() * 4) });
    }
    const lo: NatOpts = { map: tex, alphaTest: 0.45, side: THREE.DoubleSide, atlas: true, sway: 0.55, flutter: 0.03, back: 0.9, ao: [0.4, -2, 15] };
    addM(instanced(g, natMat(f, env, lo), items, true), lo);
  }

  /* ---- big understory leaves (monstera / banana / alocasia / philodendron) ---- */
  const vines: Seg[] = [];
  {
    const tex = bigLeafAtlas();
    tex.anisotropy = 4;
    const g = new THREE.PlaneGeometry(1, 1, 3, 6);
    g.translate(0, 0.5, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i);
      p.setZ(i, -0.28 * y * y + 0.18 * x * x);
    }
    g.computeVertexNormals();
    sway(g, (_x, _y, _z, _u, v) => Math.pow(v, 1.3));
    const items: Inst[] = [];
    const add = (x: number, y: number, z: number, rx: number, ry: number, rz: number, s: number, cell: number, k = 1) =>
      items.push({ p: V(x, y, z), r: [rx, ry, rz], s: [s * (cell === 1 ? 0.75 : 1), s, s], c: C(0xffffff).multiplyScalar(k * rr(0.8, 1.1)), cell });
    // framing foreground (both bottom corners, and hanging from above)
    for (const sd of [-1, 1]) {
      for (let i = 0; i < n(12); i++) {
        const z = rr(-14, 8.5);
        const x = -0.3 + sd * rr(1.9, 5) * (1 + Math.max(0, -z) * 0.03);
        const cell = [0, 1, 2, 0, 2][i % 5];
        const m = 3 + Math.floor(rnd() * 3),
          yaw0 = rr(0, TAU),
          sc = rr(0.9, 1.8);
        for (let j = 0; j < m; j++) add(x + rr(-0.2, 0.2), hJ(x, z) - 0.15, z + rr(-0.2, 0.2), rr(-1.0, -0.35), yaw0 + (j / m) * TAU + rr(-0.3, 0.3), rr(-0.2, 0.2), sc * rr(0.7, 1.1), cell, 0.85);
      }
    }
    // understory scatter
    for (let i = 0; i < n(190); i++) {
      const x = rr(-28, 30),
        z = rr(-29, 3);
      if (poolD(x, z) < 1.05) continue;
      if (Math.abs(x - lerp(0.5, PX, sm(4, -16, z))) < 1.6 && z > -18) continue;
      const c = Math.floor(rnd() * 4);
      const k = rr(0.3, 1.0);
      for (let j = 0; j < 3; j++) add(x + rr(-0.6, 0.6), hJ(x, z) - 0.1, z + rr(-0.6, 0.6), rr(-0.9, -0.2), rr(0, TAU), rr(-0.3, 0.3), rr(0.6, 1.9) * (0.6 + k * 0.6), c);
    }
    // hanging vines & draped lianas
    const vcol = () => C(rnd() < 0.5 ? "#4d5a2c" : "#5b4c34").multiplyScalar(rr(0.7, 1.1));
    const hang = n(46);
    for (let i = 0; i < hang; i++) {
      const t = trees[Math.floor(rnd() * trees.length)];
      const a = rr(0, TAU),
        d = rr(1, 4.5) * t.s;
      const x = t.x + Math.cos(a) * d,
        z = t.z + Math.sin(a) * d;
      const top = Math.min(t.y + t.h - 2, rr(9, 15));
      const bot = rnd() < 0.3 ? hJ(x, z) + 0.2 : top - rr(3, 9);
      const segs = 12,
        col = vcol(),
        r = rr(0.025, 0.06),
        ph = rr(0, TAU);
      let prev = V(x, top, z);
      for (let k = 1; k <= segs; k++) {
        const q = k / segs;
        const cur = V(x + Math.sin(q * 3 + ph) * 0.2, lerp(top, bot, q), z + Math.cos(q * 2.5 + ph) * 0.2);
        vines.push({ a: prev, b: cur, ra: r, rb: r, wa: ((k - 1) / segs) ** 2 * 1.6, wb: q * q * 1.6, col });
        if (k % 3 === 0 && rnd() < 0.7) add(cur.x, cur.y, cur.z, rr(-0.4, 0.4), rr(0, TAU), Math.PI + rr(-0.6, 0.6), rr(0.35, 0.6), 3, 0.8);
        prev = cur;
      }
    }
    for (let i = 0; i < n(30); i++) {
      const A = trees[Math.floor(rnd() * trees.length)];
      const B = trees.reduce((best, t) => {
        const d = Math.hypot(t.x - A.x, t.z - A.z);
        return t !== A && d > 4 && d < Math.hypot(best.x - A.x, best.z - A.z) && rnd() < 0.7 ? t : best;
      }, trees[(trees.indexOf(A) + 1) % trees.length]);
      const pa = V(A.x, A.y + rr(5, 12), A.z),
        pb = V(B.x, B.y + rr(5, 12), B.z);
      const sag = rr(1.5, 4.5),
        segs = 16,
        col = vcol(),
        r = rr(0.05, 0.12);
      let prev = pa;
      for (let k = 1; k <= segs; k++) {
        const q = k / segs;
        const cur = pa.clone().lerp(pb, q);
        cur.y -= sag * 4 * q * (1 - q);
        const w = (u: number) => 4 * u * (1 - u) * 0.5;
        vines.push({ a: prev, b: cur, ra: r, rb: r, wa: w((k - 1) / segs), wb: w(q), col });
        prev = cur;
      }
    }
    // waterfall-side vines on the cliff
    for (let i = 0; i < n(16); i++) {
      const x = PX + (rnd() < 0.5 ? -1 : 1) * rr(4, 14);
      const tp = cliffTop(x);
      const len = rr(4, 11);
      const col = vcol();
      let prev = V(x, tp, cliffZ(x, tp) + 0.4);
      for (let k = 1; k <= 10; k++) {
        const y = tp - (len * k) / 10;
        const cur = V(x + Math.sin(k) * 0.1, y, cliffZ(x, y) + 0.45);
        vines.push({ a: prev, b: cur, ra: 0.05, rb: 0.05, wa: 0.1, wb: 0.1, col });
        prev = cur;
      }
    }
    group.add(instanced(g, natMat(f, env, { map: tex, alphaTest: 0.5, side: THREE.DoubleSide, atlas: true, sway: 0.5, flutter: 0.025, back: 0.7, ao: [0.45, -2, 9] }), items, true));
  }
  group.add(new THREE.Mesh(tubeGeo(vines, 5), natMat(f, env, { vc: true, sway: 0.45, ao: [0.4, -2, 12] })));

  /* ---- ferns ---- */
  {
    const fronds: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 9; k++) fronds.push(frondStrip(rr(1.1, 1.5), 0.5, rr(0.5, 1.1), rr(0.28, 0.45), (k / 9) * TAU + rr(-0.2, 0.2)));
    const g = mergeGeometries(fronds)!;
    sway(g, (_x, _y, _z, _u, v) => v * v);
    const items: Inst[] = [];
    for (let i = 0; i < n(230); i++) {
      const x = rr(-28, 30),
        z = rr(-29, 7.5);
      if (poolD(x, z) < 1.02) continue;
      if (Math.abs(x - lerp(0.5, PX, sm(4, -16, z))) < 1.2 && z > -18 && rnd() < 0.7) continue;
      items.push({ p: V(x, hJ(x, z) - 0.05, z), r: [rr(-0.15, 0.15), rr(0, TAU), rr(-0.15, 0.15)], s: rr(0.8, 2.1), c: C(0xffffff).multiplyScalar(rr(0.75, 1.15)) });
    }
    for (let i = 0; i < n(40); i++) {
      const x = PX + (rnd() < 0.5 ? -1 : 1) * rr(3.5, 22);
      const y = rr(-0.5, cliffTop(x) - 0.5);
      items.push({ p: V(x, y, cliffZ(x, y) + 0.25), r: [rr(0.2, 0.7), rr(-0.4, 0.4), rr(-0.3, 0.3)], s: rr(0.9, 1.6), c: C(0xffffff).multiplyScalar(0.85) });
    }
    const t = fernTex();
    group.add(instanced(g, natMat(f, env, { map: t, alphaTest: 0.45, side: THREE.DoubleSide, sway: 0.4, flutter: 0.02, back: 0.8, ao: [0.5, -2.5, 2] }), items));
  }

  /* ---- palms ---- */
  {
    const segs: Seg[] = [];
    let prev = V(0, -0.4, 0);
    const top = V(0.9, 6.4, 0);
    for (let k = 1; k <= 26; k++) {
      const q = k / 26;
      const cur = V(Math.sin(q * 1.4) * 0.95, -0.4 + q * 6.8, 0);
      segs.push({ a: prev, b: cur, ra: 0.17 - q * 0.05, rb: 0.17 - q * 0.05, col: C(k % 2 ? "#6b604c" : "#7d735c") });
      prev = cur;
    }
    top.copy(prev);
    const trunk = tubeGeo(segs, 7);
    const crowns: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 11; k++) crowns.push(frondStrip(rr(2.6, 3.4), 1.2, rr(0.15, 0.85), rr(0.13, 0.2), (k / 11) * TAU + rr(-0.15, 0.15), 12));
    const crown = mergeGeometries(crowns)!;
    crown.translate(top.x, top.y, top.z);
    sway(crown, (x, y, z) => Math.min(1, Math.hypot(x - top.x, z - top.z) / 3) ** 1.5 * 1.2);
    const items: Inst[] = [];
    for (let i = 0, k = 0; i < n(16) && k < 500; k++) {
      const x = rr(-24, 26),
        z = rr(-27, 2);
      if (Math.abs(x - 1.5) < 5 || poolD(x, z) < 1.3 || z < cliffZ(x, 0) + 2) continue;
      i++;
      items.push({ p: V(x, hJ(x, z), z), r: [0, rr(0, TAU), 0], s: rr(0.6, 1.2), c: C(0xffffff).multiplyScalar(rr(0.75, 1)) });
    }
    group.add(instanced(trunk, natMat(f, env, { vc: true, ao: [0.4, -2, 8] }), items));
    const pt = palmTex();
    group.add(instanced(crown, natMat(f, env, { map: pt, alphaTest: 0.45, side: THREE.DoubleSide, sway: 0.6, flutter: 0.03, back: 0.9, ao: [0.5, -2, 8] }), items));
  }

  /* ---- light, mist, particles ---- */
  const rays: { g: V3; len: number; w: number; i: number }[] = [];
  for (let i = 0; i < n(24, 0.6); i++) {
    const x = rr(-16, 20),
      z = rr(-28, 2);
    const y = hJ(x, z) + rr(-0.5, 1.5);
    rays.push({ g: V(x, y, z), len: (rr(14, 19) - y) / sunD.y, w: rr(1.2, 3.6), i: rr(0.3, 0.8) });
  }
  rays.push({ g: V(PX + 1, WL, -24), len: 30, w: 5, i: 0.9 });
  group.add(godRays(f, env, rays, camRef, "#ffe3a0", 0.95));

  const dust: V3[] = [];
  for (let i = 0; i < n(700); i++) {
    const r = rays[Math.floor(rnd() * rays.length)];
    const p = r.g.clone().addScaledVector(sunD, rr(0.05, 0.5) * r.len);
    p.x += rr(-0.6, 0.6) * r.w;
    p.z += rr(-0.6, 0.6);
    dust.push(p);
  }
  group.add(motes(f, env, dust, { col: "#fff0c0", sz: [0.03, 0.07], kind: 0, drift: 0.6, base: 0.9 }));
  const flies: V3[] = [];
  for (let i = 0; i < n(90); i++) {
    const x = rr(-18, 20),
      z = rr(-26, 4);
    flies.push(V(x, hJ(x, z) + rr(0.3, 3), z));
  }
  group.add(motes(f, env, flies, { col: "#d8ff8a", sz: [0.08, 0.14], kind: 1, drift: 1.4 }));

  // waterfall spray
  {
    const N = n(320);
    const pos = new Float32Array(N * 3),
      sd = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) sd.set([rnd(), rnd(), rnd(), rr(0.5, 1.4)], i * 4);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aS", new THREE.BufferAttribute(sd, 4));
    const uScale = { value: 800 };
    const m = shMat(f, {
      fog: true,
      base: 0.9,
      u: { uTime: env.time, uScale, uO: { value: V(PX, WL, -29.8) } },
      vs: `attribute vec4 aS; uniform float uTime, uScale; uniform vec3 uO; varying float vA;
#include <fog_pars_vertex>
void main(){
  float life = fract(uTime * 0.28 * (0.7 + aS.x * 0.6) + aS.y);
  vec3 dir = normalize(vec3((aS.x - 0.5) * 1.6, 0.5 + aS.y * 0.7, 0.4 + aS.z * 0.8));
  vec3 p = uO + vec3((aS.z - 0.5) * 4.0, 0.0, 0.0) + dir * life * (1.5 + aS.z * 2.5);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = clamp(aS.w * (0.6 + life * 1.8) * uScale / -mvPosition.z, 1.0, 140.0);
  vA = sin(life * 3.14159) * 0.3;
#include <fog_vertex>
}`,
      fs: `uniform float uFade; varying float vA;
#include <fog_pars_fragment>
void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vA;
  gl_FragColor = vec4(vec3(0.92, 0.96, 0.93), a * uFade);
#include <colorspace_fragment>
#include <fog_fragment>
}`,
    });
    const pts = new THREE.Points(g, m);
    pts.frustumCulled = false;
    pts.renderOrder = 23;
    pointScale(pts, uScale);
    group.add(pts);
  }

  const mists: { p: V3; s: number; a: number; str: number; sp: number }[] = [];
  for (let i = 0; i < n(22); i++) mists.push({ p: V(rr(-40, 40), rr(-1.6, 0.6), rr(-30, 2)), s: rr(5, 10), a: rr(0.2, 0.4), str: 2.4, sp: rr(0.1, 0.3) });
  for (let i = 0; i < 7; i++) mists.push({ p: V(PX + rr(-4, 4), rr(-1.2, 2), -28.5 + rr(0, 2)), s: rr(3, 6), a: 0.45, str: 1.4, sp: rr(-0.03, 0.03) });
  for (let i = 0; i < n(12); i++) mists.push({ p: V(rr(-40, 40), rr(3, 12), rr(-34, -20)), s: rr(12, 20), a: rr(0.15, 0.28), str: 2, sp: rr(0.05, 0.15) });
  group.add(mistLayer(f, env, mists, "#dfe6c8", -2.4, 45));

  group.add(drifters(f, env, n(90), { min: V(-18, -2, -24), size: V(36, 16, 30), wind: V(0.25, 0, 0.1), fall: 0.35, swirl: 0.8, sz: [0.09, 0.16], colA: "#a3a24a", colB: "#6a7a2c", shape: 1 }));

  /* ---- creatures ---- */
  const bfN = n(12, 0.5);
  const wingTex = canvasTex(128, 64, (g) => {
    for (const s of [-1, 1]) {
      g.save();
      g.translate(64, 32);
      g.scale(s, 1);
      const gr = g.createRadialGradient(6, 0, 2, 20, 0, 58);
      gr.addColorStop(0, "#9fe0ff");
      gr.addColorStop(0.45, "#1f7bff");
      gr.addColorStop(0.8, "#0c2c8a");
      gr.addColorStop(1, "#050a18");
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(2, -4);
      g.bezierCurveTo(30, -34, 62, -30, 60, -8);
      g.bezierCurveTo(58, 4, 44, 6, 40, 8);
      g.bezierCurveTo(50, 20, 36, 32, 20, 28);
      g.bezierCurveTo(8, 24, 4, 10, 2, 4);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.8)";
      for (let k = 0; k < 4; k++) g.fillRect(48 + k * 2, -18 + k * 5, 2, 2);
      g.restore();
    }
  });
  const bfGeo = new THREE.PlaneGeometry(0.62, 0.32, 2, 1);
  bfGeo.rotateX(-Math.PI / 2);
  sway(bfGeo);
  const bfMesh = instanced(bfGeo, natMat(f, env, { map: wingTex, alphaTest: 0.4, side: THREE.DoubleSide, emissive: "#0a2a70", bend: FLAP(15, 1.0, 0.35, 0.0) }), Array.from({ length: bfN }, () => ({ p: V(), r: [0, 0, 0] as [number, number, number], s: 1 })));
  group.add(bfMesh);
  const bfs = Array.from({ length: bfN }, () => ({ c: V(rr(-7, 10), rr(-0.5, 2.5), rr(-16, 3)), r: rr(1.5, 4), sp: rr(0.25, 0.5), ph: rr(0, TAU), s: rr(0.32, 0.48) }));

  const birdN = n(6, 0.5);
  const birdMesh = instanced(
    birdGeo("#c81e16", "#d0241a", "#f2c21a", "#1f55c8", "#b01a18"),
    natMat(f, env, { vc: true, side: THREE.DoubleSide, bend: FLAP(8.5, 0.75, 0.1, 0.06) }),
    Array.from({ length: birdN }, () => ({ p: V(), r: [0, 0, 0] as [number, number, number], s: 1 }))
  );
  group.add(birdMesh);
  const birds = Array.from({ length: birdN }, (_, i) => ({ dir: i % 3 === 2 ? -1 : 1, off: rr(0, 90), y: rr(4, 10), z: rr(-27, -14), sp: rr(3, 4.5), ph: rr(0, TAU), s: rr(1.1, 1.5) }));

  /* ---- lights ---- */
  group.add(f.light(new THREE.HemisphereLight("#e4ecc0", "#46522a", 1.8)));
  const sunL = f.light(new THREE.DirectionalLight("#ffe2a8", 2.4));
  sunL.position.copy(sunD).multiplyScalar(60);
  group.add(sunL);
  const fill = f.light(new THREE.DirectionalLight("#a6c8a0", 0.5));
  fill.position.set(-10, 6, 20);
  group.add(fill);

  const pp = V();
  return {
    group,
    fade: f,
    bg: C("#aebf95"),
    fog: C("#93a67c"),
    fogDensity: 0.021,
    update: (t) => {
      env.time.value = t;
      for (let i = 0; i < bfN; i++) {
        const b = bfs[i];
        const a = t * b.sp + b.ph;
        pp.set(b.c.x + Math.sin(a) * b.r, b.c.y + Math.sin(a * 1.9) * 0.5 + Math.sin(t * 2.3 + b.ph) * 0.12, b.c.z + Math.cos(a * 0.7) * b.r * 0.6);
        const dx = Math.cos(a) * b.r,
          dz = -Math.sin(a * 0.7) * 0.7 * b.r * 0.6;
        setInst(bfMesh, i, pp, [Math.sin(t * 2 + b.ph) * 0.2, Math.atan2(dx, dz), Math.sin(t * 3 + b.ph) * 0.25], b.s);
      }
      bfMesh.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < birdN; i++) {
        const b = birds[i];
        const u = ((t * b.sp + b.off) % 90) - 45;
        pp.set(b.dir * u + PX, b.y + Math.sin(t * 0.6 + b.ph) * 1.2, b.z + Math.sin(u * 0.05 + b.ph) * 3);
        setInst(birdMesh, i, pp, [Math.cos(t * 0.6 + b.ph) * -0.15, (b.dir * Math.PI) / 2, Math.sin(t * 0.8 + b.ph) * 0.2], b.s);
      }
      birdMesh.instanceMatrix.needsUpdate = true;
    },
    view: (t, pos, look) => {
      const k = 0.5 - 0.5 * Math.cos(t * 0.045);
      pos.set(Math.sin(t * 0.03) * 1.4 - 0.3, 0.9 + k * 1.3 + Math.sin(t * 0.07) * 0.2, 8.5 - k * 6);
      look.set(2.4 + Math.sin(t * 0.03) * 1.2, 2.6 + k * 0.6, -28);
    },
  };
}

/* ============================================================================================
 *                                   KYOTO CHERRY GARDEN
 * ============================================================================================ */
function roofGeo(w: number, d: number, h: number, curl: number) {
  const g = new THREE.PlaneGeometry(1, 1, 18, 18);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      z = p.getZ(i);
    const ax = Math.abs(x) * 2,
      az = Math.abs(z) * 2;
    const rN = Math.max(ax, az);
    const y = h * Math.pow(1 - rN, 1.7) + curl * Math.pow(rN, 4) * (0.35 + 0.65 * Math.pow(Math.min(ax, az), 2));
    p.setXYZ(i, x * w, y, z * d);
  }
  g.computeVertexNormals();
  return g;
}

export function sakura(ctx: Ctx): World {
  seed(8117);
  const L = ctx.lite;
  const n = (d: number, m = 0.45) => Math.max(1, Math.round(L ? d * m : d));
  const group = new THREE.Group();
  const f = new Fader();
  const env = mkEnv(V(0.42, 0.085, -1), "#ffd29a", [0.22, 0.08]);
  const sunD = env.sunDir.value;

  const su = skyUniforms(env, { top: "#5a5690", mid: "#dc94ae", hor: "#ffc9a0", ground: "#c99a98", glow: 1.4, sunSize: 0.0016, clouds: 0.8, lit: "#ffd9bc", dark: "#8c6488" });
  const WL = -2.15;
  group.add(skyDome(f, su));
  {
    const sm_ = skyDome(f, su, WL);
    group.add(mirrorOf(sm_, sm_.material as THREE.Material, WL));
    sm_.geometry.dispose();
  }
  /* mirrored twin for the pond reflection (natMat objects) */
  const addM = <T extends THREE.Mesh>(mesh: T, o: NatOpts) => {
    group.add(mesh);
    group.add(mirrorOf(mesh, natMat(f, env, { ...o, clip: [-1e5, WL] }), WL));
    return mesh;
  };
  const haze = C("#efb4a8");

  /* ---- distant mountains: Fuji and ridges (baked haze, no fog) ---- */
  {
    const H = 78,
      R = 190,
      r0 = R * 0.03,
      A = L ? 100 : 160,
      RN = L ? 30 : 48;
    const P: number[] = [],
      I: number[] = [];
    for (let i = 0; i <= RN; i++) {
      const tn = Math.pow(i / RN, 1.35);
      for (let j = 0; j <= A; j++) {
        const th = (j / A) * TAU;
        const r = (r0 + (R - r0) * tn) * (1 + (noise2(Math.cos(th) * 3, Math.sin(th) * 3) - 0.5) * 0.06);
        const gully = Math.pow(Math.abs(Math.sin(th * 22 + noise2(th, 1) * 3)), 0.6) * (1 - tn) * H * 0.018;
        const y = H * Math.pow(1 - tn, 1.8) - gully - (i === 0 ? 1.2 : 0);
        P.push(Math.cos(th) * r, y, Math.sin(th) * r);
      }
    }
    for (let i = 0; i < RN; i++)
      for (let j = 0; j < A; j++) {
        const a = i * (A + 1) + j,
          b = a + A + 1;
        I.push(a, b, a + 1, a + 1, b, b + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
    g.setIndex(I);
    g.computeVertexNormals();
    const pos = g.attributes.position,
      nn = g.attributes.normal;
    const cl = new Float32Array(pos.count * 3);
    const rock = C("#5d4d78"),
      snow = C("#fbeef2"),
      c = C(0xffffff),
      nv = V();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        y = pos.getY(i),
        z = pos.getZ(i);
      const th = Math.atan2(z, x);
      const streak = Math.pow(0.5 + 0.5 * Math.sin(th * 38 + noise2(Math.cos(th) * 4, Math.sin(th) * 4) * 5), 3);
      const line = H * (0.6 + 0.07 * (noise2(Math.cos(th) * 5, Math.sin(th) * 5) - 0.5)) - streak * H * 0.2;
      const sn = sm(line - H * 0.02, line + H * 0.02, y);
      nv.set(nn.getX(i), nn.getY(i), nn.getZ(i));
      const lit = 0.55 + 0.7 * Math.max(0, nv.dot(V(sunD.x, 0.5, sunD.z).normalize()));
      c.copy(rock).lerp(snow, sn).multiplyScalar(lit);
      c.lerp(haze, 0.2 + 0.55 * Math.pow(1 - y / H, 2.0));
      cl.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(cl, 3));
    const fuji = new THREE.Mesh(g, basicMat(f, { vertexColors: true, fog: false }, 1e5, false));
    fuji.position.set(-70, -10, -300);
    fuji.renderOrder = -8;
    group.add(fuji, mirrorOf(fuji, basicMat(f, { vertexColors: true, fog: false }, WL, false), WL));

    const ridge = (zc: number, amp: number, freq: number, base: number, top: string, bot: string, sd: number, hazeK: number) => {
      const seg = 220;
      const P2: number[] = [],
        C2: number[] = [],
        I2: number[] = [];
      const ct = C(top).lerp(haze, hazeK),
        cb = C(bot).lerp(haze, Math.min(1, hazeK + 0.25));
      for (let i = 0; i <= seg; i++) {
        const x = -420 + (840 * i) / seg;
        const y = base + amp * fbm2(x * freq + sd, sd, 5) * (0.6 + 0.4 * Math.sin(x * 0.004 + sd));
        const z = zc + (x / 420) ** 2 * 60;
        P2.push(x, y, z, x, -12, z);
        C2.push(ct.r, ct.g, ct.b, cb.r, cb.g, cb.b);
        if (i < seg) {
          const a = i * 2;
          I2.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
        }
      }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute("position", new THREE.Float32BufferAttribute(P2, 3));
      gg.setAttribute("color", new THREE.Float32BufferAttribute(C2, 3));
      gg.setIndex(I2);
      return gg;
    };
    const rg = mergeGeometries([ridge(-230, 26, 0.012, -4, "#7e6a90", "#b99aa6", 3, 0.55), ridge(-170, 18, 0.02, -4, "#5a4a6c", "#9c7f94", 11, 0.42)])!;
    const r = new THREE.Mesh(rg, basicMat(f, { vertexColors: true, fog: false, side: THREE.DoubleSide }, 1e5, false));
    r.renderOrder = -7;
    group.add(r, mirrorOf(r, basicMat(f, { vertexColors: true, fog: false, side: THREE.DoubleSide }, WL, false), WL));
  }

  /* ---- garden landform ---- */
  const PX = 0.5,
    PZ = -13,
    PRX = 8.5,
    PRZ = 5.4;
  const poolD = (x: number, z: number) => Math.hypot((x - PX) / PRX, (z - PZ) / PRZ);
  const hS = (x: number, z: number) => {
    const d = poolD(x, z);
    let h = -2 + (fbm2(x * 0.06 + 7, z * 0.06, 4) - 0.5) * 0.9 * sm(1.05, 1.8, d);
    h += sm(1.15, 0.72, d) * -1.2;
    h += sm(-26, -60, z) * (2 + fbm2(x * 0.04, z * 0.04, 4) * 7);
    h += Math.max(0, Math.abs(x) - 22) * 0.15;
    if (d > 1.18) h = Math.max(h, WL + 0.1);
    return h;
  };
  const gTex = groundTex("sakura");
  gTex.wrapS = gTex.wrapT = THREE.RepeatWrapping;
  gTex.anisotropy = 4;
  const trees: { base: V3; h: number; lean: V3; tint: THREE.Color; spread: number; fine?: boolean }[] = [
    { base: V(-8.8, 0, -3.5), h: 8.5, lean: V(0.55, 1, 0.1), tint: C("#ffffff"), spread: 1.25 },
    { base: V(7.5, 0, 4.5), h: 7.5, lean: V(-0.7, 1, -0.35), tint: C("#fff4f8"), spread: 1.3, fine: true },
    { base: V(10.5, 0, -7), h: 8, lean: V(-0.45, 1, 0.1), tint: C("#fff2f6"), spread: 1.15 },
    { base: V(-4.5, 0, -24), h: 8.5, lean: V(0.1, 1, 0), tint: C("#ffe6ee"), spread: 1 },
    { base: V(6.5, 0, -27), h: 9, lean: V(-0.1, 1, 0.1), tint: C("#ffffff"), spread: 1.05 },
    { base: V(-15, 0, -30), h: 10, lean: V(0.2, 1, 0), tint: C("#ffd9e6"), spread: 1.1 },
    { base: V(19, 0, -34), h: 9, lean: V(-0.2, 1, 0), tint: C("#fff0f4"), spread: 1 },
  ];
  if (!L) trees.push({ base: V(-7, 0, -40), h: 8, lean: V(0, 1, 0), tint: C("#ffe0ea"), spread: 1 }, { base: V(28, 0, -18), h: 9, lean: V(-0.2, 1, 0), tint: C("#fff"), spread: 1.1 });
  for (const t of trees) t.base.y = hS(t.base.x, t.base.z);
  {
    const mossC = C("#c9d890"),
      petal = C("#ffe0e8"),
      path = C("#e8dccb");
    group.add(
      new THREE.Mesh(
        terrainGeo(
          260,
          170,
          L ? 90 : 150,
          L ? 60 : 100,
          0,
          -50,
          hS,
          (x, _y, z, c) => {
            c.copy(mossC).multiplyScalar(0.62 + 0.6 * fbm2(x * 0.12, z * 0.12, 4));
            c.lerp(C("#8f9a50"), sm(0.55, 0.75, noise2(x * 0.35 + 9, z * 0.35)) * 0.5);
            let pk = 0;
            for (const t of trees) pk = Math.max(pk, sm(t.h * 0.9, 0, Math.hypot(x - t.base.x, z - t.base.z)));
            c.lerp(petal, pk * 0.75 * (0.6 + 0.4 * noise2(x * 0.8, z * 0.8)));
            const pd = Math.abs(x - lerp(-2.5, -6.2, sm(8, -12, z)) - Math.sin(z * 0.3) * 1.2);
            if (z > -11 && z < 12) c.lerp(path, sm(1.5, 0.6, pd) * 0.7);
          },
          52
        ),
        natMat(f, env, { map: gTex, vc: true, ao: [0.85, -2.5, 2], clip: [WL - 0.01, 1e5] })
      )
    );
  }

  // pond
  {
    const g = new THREE.CircleGeometry(1, 80);
    g.rotateX(-Math.PI / 2);
    g.scale(PRX * 1.2, 1, PRZ * 1.2);
    g.translate(PX, WL, PZ);
    const w = new THREE.Mesh(g, waterMat(f, su, { deep: "#1a1820", canopy: "#6e4a5c", canopyAmt: 0, rip: [-100, -100, 1], foam: 0, alpha: [0.72, 0.1], spec: 1.2, chop: 0.035, mirror: true }));
    w.renderOrder = 11;
    group.add(w);
  }

  // koi (3 colour varieties)
  type Koi = { mesh: THREE.InstancedMesh; fish: { rx: number; rz: number; sp: number; ph: number; y: number; cx: number; cz: number; s: number }[] };
  const kois: Koi[] = [];
  {
    const variety: [string, string, string][] = [
      ["#f4efe6", "#e0461f", "#f4efe6"], // kohaku
      ["#f2a531", "#f7c85a", "#e8902a"], // yamabuki / ogon
      ["#efe8dc", "#d2381e", "#1b1a1c"], // showa / sanke
    ];
    const kMat = natMat(f, env, { vc: true, side: THREE.DoubleSide, emissive: "#140806", bend: `transformed.x += sin(position.z * 7.0 - uTime * 5.0 + float(gl_InstanceID) * 2.1) * 0.05 * smoothstep(0.35, -0.7, position.z);` });
    variety.forEach(([base, spot, spot2], vi) => {
      let body: THREE.BufferGeometry = new THREE.SphereGeometry(1, 18, 10);
      body.deleteAttribute("uv");
      body.deleteAttribute("normal");
      body = mergeVertices(body);
      const p = body.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i),
          y = p.getY(i),
          z = p.getZ(i);
        const tp = z < 0 ? 1 + z * 0.6 : 1 - z * z * 0.15;
        p.setXYZ(i, x * 0.11 * tp, y * 0.08 * tp, z * 0.42);
      }
      const fin = new THREE.BufferGeometry();
      fin.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, -0.36, 0, 0.13, -0.66, 0, 0, -0.54, 0, 0, -0.36, 0, 0, -0.54, 0, -0.13, -0.66, 0.08, -0.02, 0.1, 0.26, -0.04, -0.02, 0.09, -0.02, -0.04, -0.08, -0.02, 0.1, -0.09, -0.02, -0.04, -0.26, -0.04, -0.02], 3));
      fin.setIndex([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      const g = mergeGeometries([body, fin])!;
      g.computeVertexNormals();
      const pp = g.attributes.position;
      const cl = new Float32Array(pp.count * 3);
      const cb = C(base),
        cs = C(spot),
        cs2 = C(spot2),
        c = C(0xffffff);
      for (let i = 0; i < pp.count; i++) {
        const x = pp.getX(i),
          y = pp.getY(i),
          z = pp.getZ(i);
        const nA = noise2(x * 18 + vi * 7, z * 9 + vi * 3);
        const nB = noise2(x * 22 + 40, z * 11 + vi);
        c.copy(cb);
        if (y > -0.02 && nA > 0.55) c.lerp(cs, sm(0.55, 0.62, nA));
        if (vi === 2 && nB > 0.68) c.lerp(cs2, sm(0.68, 0.74, nB));
        if (z < -0.36) c.lerp(C(0xffffff), 0.35);
        cl.set([c.r, c.g, c.b], i * 3);
      }
      g.setAttribute("color", new THREE.BufferAttribute(cl, 3));
      sway(g);
      const cnt = vi === 0 ? 3 : 2;
      const mesh = instanced(g, kMat, Array.from({ length: cnt }, () => ({ p: V(), r: [0, 0, 0] as [number, number, number], s: 1 })));
      group.add(mesh);
      kois.push({ mesh, fish: Array.from({ length: cnt }, () => ({ rx: rr(2, 5.5), rz: rr(1, 2.8), sp: rr(0.12, 0.22) * (rnd() < 0.5 ? -1 : 1), ph: rr(0, TAU), y: WL - rr(0.12, 0.3), cx: PX + rr(-1.5, 1.5), cz: PZ + rr(0.5, 2), s: rr(0.9, 1.3) })) });
    });
  }

  // lily pads
  {
    const tex = canvasTex(256, 256, (g) => {
      g.translate(128, 128);
      const gr = g.createRadialGradient(0, 0, 10, 0, 0, 120);
      gr.addColorStop(0, "#5f7d2e");
      gr.addColorStop(0.85, "#3f5f22");
      gr.addColorStop(1, "#7a7a2c");
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, 120, 0.25, TAU - 0.05);
      g.closePath();
      g.fill();
      g.strokeStyle = "rgba(170,200,110,0.35)";
      g.lineWidth = 2;
      for (let k = 0; k < 18; k++) {
        const a = 0.3 + (k / 18) * (TAU - 0.4);
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(Math.cos(a) * 112, Math.sin(a) * 112);
        g.stroke();
      }
    });
    const g = new THREE.PlaneGeometry(1, 1);
    g.rotateX(-Math.PI / 2);
    sway(g, () => 1);
    const items: Inst[] = [];
    for (let i = 0; i < n(26); i++) {
      const a = rr(0, TAU),
        d = rr(0.45, 0.92);
      const cx = PX + Math.cos(a) * PRX * d,
        cz = PZ + Math.sin(a) * PRZ * d;
      for (let j = 0; j < 3; j++) items.push({ p: V(cx + rr(-0.7, 0.7), WL + 0.015, cz + rr(-0.5, 0.5)), r: [0, rr(0, TAU), 0], s: rr(0.35, 0.7), c: C(0xffffff).multiplyScalar(rr(0.8, 1.1)) });
    }
    const m = instanced(g, natMat(f, env, { map: tex, alphaTest: 0.5, side: THREE.DoubleSide, flutter: 0.01, back: 0.3 }), items);
    m.renderOrder = 13;
    group.add(m);
  }

  /* ---- architecture: bridge, torii, pagoda, hall (one merged mesh) ---- */
  {
    const parts: THREE.BufferGeometry[] = [];
    const red = "#c23a26",
      wood = "#5a3e2c",
      darkW = "#2e211b",
      blk = "#1c1818",
      stone = "#8a857a",
      white = "#e9e0cf",
      tile = "#3a3a3f",
      bronze = "#6a5a3c";
    // taiko bridge along x at z = BZ
    const BZ = -16.2,
      BX = PX,
      BL = 7.3,
      BH = 2.0;
    const by = (x: number) => WL + 0.25 + BH * (1 - ((x - BX) / BL) ** 2);
    const slope = (x: number) => (-2 * BH * (x - BX)) / (BL * BL);
    const NP = L ? 34 : 52;
    for (let i = 0; i < NP; i++) {
      const x = BX - BL * 0.97 + (i / (NP - 1)) * BL * 1.94;
      parts.push(solid(new THREE.BoxGeometry(0.26, 0.07, 1.7), i % 2 ? wood : "#654634", V(x, by(x), BZ), [0, 0, Math.atan(slope(x))]));
    }
    for (let i = 0; i < 28; i++) {
      const x0 = BX - BL + (i / 28) * BL * 2,
        x1 = BX - BL + ((i + 1) / 28) * BL * 2;
      const xm = (x0 + x1) / 2;
      const len = Math.hypot(x1 - x0, by(x1) - by(x0));
      const ang = Math.atan(slope(xm));
      for (const sz of [-0.86, 0.86]) {
        parts.push(solid(new THREE.BoxGeometry(len + 0.02, 0.26, 0.12), red, V(xm, by(xm) - 0.12, BZ + sz), [0, 0, ang]));
        parts.push(solid(new THREE.BoxGeometry(len + 0.02, 0.08, 0.1), red, V(xm, by(xm) + 0.85, BZ + sz), [0, 0, ang]));
        parts.push(solid(new THREE.BoxGeometry(len + 0.02, 0.05, 0.06), red, V(xm, by(xm) + 0.45, BZ + sz), [0, 0, ang]));
      }
    }
    for (let i = 0; i <= 8; i++) {
      const x = BX - BL * 0.95 + (i / 8) * BL * 1.9;
      for (const sz of [-0.86, 0.86]) {
        parts.push(solid(new THREE.BoxGeometry(0.12, 0.95, 0.12), red, V(x, by(x) + 0.42, BZ + sz)));
        if (i === 0 || i === 8) {
          parts.push(solid(new THREE.SphereGeometry(0.1, 10, 8), bronze, V(x, by(x) + 0.98, BZ + sz)));
          parts.push(solid(new THREE.ConeGeometry(0.05, 0.14, 8), bronze, V(x, by(x) + 1.12, BZ + sz)));
        }
      }
      if (i > 0 && i < 8)
        for (const sz of [-0.7, 0.7]) {
          const top = by(x) - 0.15;
          parts.push(solid(new THREE.CylinderGeometry(0.09, 0.1, top - (WL - 0.6), 8), darkW, V(x, (top + WL - 0.6) / 2, BZ + sz)));
        }
    }
    // torii
    const T = V(-9.6, hS(-9.6, -20), -20.5),
      tr = 0.3;
    const tp = (x: number, y: number, z = 0) => V(x, y, z).applyAxisAngle(V(0, 1, 0), tr).add(T);
    for (const sx of [-2.1, 2.1]) {
      parts.push(solid(new THREE.CylinderGeometry(0.2, 0.25, 5.3, 16), red, tp(sx, 2.55), [0, tr, -sx * 0.012]));
      parts.push(solid(new THREE.CylinderGeometry(0.29, 0.31, 0.5, 16), blk, tp(sx, 0.22), [0, tr, 0]));
    }
    parts.push(solid(new THREE.BoxGeometry(5.6, 0.28, 0.22), red, tp(0, 3.75), [0, tr, 0]));
    parts.push(solid(new THREE.BoxGeometry(0.28, 1.0, 0.16), red, tp(0, 4.35), [0, tr, 0]));
    {
      const k = new THREE.BoxGeometry(7.4, 0.34, 0.62, 30, 1, 1);
      const p = k.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        p.setY(i, p.getY(i) * (1 + Math.abs(x / 3.7) * 0.3) + 0.32 * Math.pow(Math.abs(x) / 3.7, 3));
      }
      k.computeVertexNormals();
      parts.push(solid(k, blk, tp(0, 5.25), [0, tr, 0]));
      const s = new THREE.BoxGeometry(6.6, 0.3, 0.46, 24, 1, 1);
      const p2 = s.attributes.position;
      for (let i = 0; i < p2.count; i++) p2.setY(i, p2.getY(i) + 0.22 * Math.pow(Math.abs(p2.getX(i)) / 3.3, 3));
      s.computeVertexNormals();
      parts.push(solid(s, red, tp(0, 4.92), [0, tr, 0]));
    }
    // five-storey pagoda
    const G = V(15.5, hS(15.5, -44), -44);
    parts.push(solid(new THREE.BoxGeometry(6.4, 0.8, 6.4), stone, V(G.x, G.y + 0.2, G.z)));
    let y = G.y + 0.6;
    for (let i = 0; i < 5; i++) {
      const bw = 3.3 - i * 0.36,
        bh = i === 0 ? 2.1 : 1.5;
      parts.push(solid(new THREE.BoxGeometry(bw, bh, bw), i % 2 ? "#7a2e22" : white, V(G.x, y + bh / 2, G.z)));
      for (const [cx, cz] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ])
        parts.push(solid(new THREE.BoxGeometry(0.16, bh, 0.16), "#7a2e22", V(G.x + (cx * bw) / 2, y + bh / 2, G.z + (cz * bw) / 2)));
      y += bh;
      const rw = bw * 2.0;
      parts.push(solid(new THREE.BoxGeometry(bw * 1.25, 0.3, bw * 1.25), darkW, V(G.x, y + 0.05, G.z)));
      parts.push(solid(roofGeo(rw, rw, 0.95, 0.55), tile, V(G.x, y - 0.25, G.z)));
      y += 0.62;
    }
    parts.push(solid(new THREE.CylinderGeometry(0.07, 0.1, 4.4, 8), bronze, V(G.x, y + 2.2, G.z)));
    for (let k = 0; k < 9; k++) parts.push(solid(new THREE.CylinderGeometry(0.3 - k * 0.012, 0.3 - k * 0.012, 0.07, 12), bronze, V(G.x, y + 0.8 + k * 0.3, G.z)));
    parts.push(solid(new THREE.SphereGeometry(0.16, 10, 8), bronze, V(G.x, y + 4.5, G.z)));
    // temple hall
    const Hh = V(-20, hS(-20, -40), -40);
    parts.push(solid(new THREE.BoxGeometry(11, 0.8, 7.5), stone, V(Hh.x, Hh.y + 0.3, Hh.z), [0, 0.35, 0]));
    parts.push(solid(new THREE.BoxGeometry(9, 3.2, 5.6), white, V(Hh.x, Hh.y + 2.3, Hh.z), [0, 0.35, 0]));
    for (let k = 0; k < 7; k++) {
      const off = V(-4.3 + k * 1.43, 0, 2.85).applyAxisAngle(V(0, 1, 0), 0.35);
      parts.push(solid(new THREE.BoxGeometry(0.22, 3.2, 0.22), "#7a2e22", V(Hh.x + off.x, Hh.y + 2.3, Hh.z + off.z), [0, 0.35, 0]));
    }
    parts.push(solid(roofGeo(14.5, 10, 3.2, 0.7), tile, V(Hh.x, Hh.y + 3.8, Hh.z), [0, 0.35, 0]));
    const g = mergeAll(parts);
    sway(g);
    addM(new THREE.Mesh(g, natMat(f, env, { vc: true, side: THREE.DoubleSide, back: 0.05, ao: [0.75, -2.5, 3] })), { vc: true, side: THREE.DoubleSide, back: 0.05, ao: [0.75, -2.5, 3] });
  }

  /* ---- stone lanterns ---- */
  const lampPos: V3[] = [];
  {
    const st = "#8f8a7f";
    const parts = [
      solid(new THREE.CylinderGeometry(0.42, 0.5, 0.26, 6), st, V(0, 0.13, 0)),
      solid(new THREE.CylinderGeometry(0.15, 0.2, 1.0, 12), st, V(0, 0.76, 0)),
      solid(new THREE.CylinderGeometry(0.44, 0.36, 0.2, 6), st, V(0, 1.36, 0)),
      solid(new THREE.CylinderGeometry(0.08, 0.66, 0.32, 6), st, V(0, 2.06, 0)),
      solid(new THREE.SphereGeometry(0.11, 10, 8), st, V(0, 2.32, 0)),
      solid(new THREE.ConeGeometry(0.06, 0.16, 8), st, V(0, 2.48, 0)),
    ];
    for (const [x, z] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ])
      parts.push(solid(new THREE.BoxGeometry(0.09, 0.44, 0.09), st, V(x * 0.21, 1.68, z * 0.21)));
    const g = mergeAll(parts);
    sway(g);
    const items: Inst[] = [];
    for (const a of [2.35, 1.72, 3.6, 5.2, 0.35]) {
      const x = PX + Math.cos(a) * PRX * 1.18,
        z = PZ + Math.sin(a) * PRZ * 1.25;
      const p = V(x, hS(x, z) - 0.05, z);
      items.push({ p, r: [0, rr(0, TAU), 0], s: 1, c: C(0xffffff).multiplyScalar(rr(0.85, 1)) });
      lampPos.push(p.clone().add(V(0, 1.68, 0)));
    }
    addM(instanced(g, natMat(f, env, { vc: true, ao: [0.7, -2.2, 0.5] }), items), { vc: true, ao: [0.7, -2.2, 0.5] });
    const gb = instanced(new THREE.BoxGeometry(0.36, 0.34, 0.36), basicMat(f, { color: "#ffc27a" }), lampPos.map((p) => ({ p, r: [0, 0, 0] as [number, number, number], s: 1 })));
    group.add(gb, mirrorOf(gb, basicMat(f, { color: "#ffc27a" }, WL), WL));
    const gp: number[] = [];
    for (const p of lampPos) {
      gp.push(p.x, p.y, p.z);
      if (poolD(p.x, p.z) < 1.45) gp.push(p.x, 2 * WL - p.y + 0.3, p.z + 0.6);
    }
    const gg = new THREE.BufferGeometry();
    gg.setAttribute("position", new THREE.Float32BufferAttribute(gp, 3));
    const glow = new THREE.Points(gg, f.mat(new THREE.PointsMaterial({ size: 2.4, map: glowTex(), color: "#ff9e52", blending: THREE.AdditiveBlending, depthWrite: false }), 0.8));
    glow.renderOrder = 25;
    group.add(glow);
  }
  const lamps = lampPos.slice(0, 2).map((p) => {
    const l = f.light(new THREE.PointLight("#ff9a45", 5, 11, 1.6));
    l.position.copy(p);
    group.add(l);
    return l;
  });

  /* ---- rocks around the pond & stepping stones ---- */
  {
    const list: THREE.BufferGeometry[] = [];
    const rock = C("#cfc8b8"),
      mossC = C("#9fae5c");
    for (let i = 0; i < n(34); i++) {
      const a = (i / n(34)) * TAU + rr(-0.1, 0.1),
        d = rr(1.0, 1.1);
      const x = PX + Math.cos(a) * PRX * d,
        z = PZ + Math.sin(a) * PRZ * d;
      const s = rr(0.35, 0.9);
      const g = rockGeo(s * rr(1, 1.5), s * rr(0.45, 0.7), s, rr(0, 80), rock, mossC, 0.8);
      g.rotateY(rr(0, TAU));
      g.translate(x, WL + 0.05, z);
      list.push(g);
    }
    for (let i = 0; i < 9; i++) {
      const z = 8 - i * 2.1;
      const x = lerp(-2.5, -6.2, sm(8, -12, z)) + Math.sin(z * 0.3) * 1.2;
      const g = rockGeo(rr(0.45, 0.6), 0.12, rr(0.35, 0.45), rr(0, 80), C("#d8d2c4"), mossC, 0.3);
      g.rotateY(rr(0, TAU));
      g.translate(x, hS(x, z) + 0.02, z);
      list.push(g);
    }
    for (const [x, z, s] of [
      [-12, -8, 1.3],
      [13, -15, 1.1],
      [-5, -21, 0.9],
      [9, -21, 1.2],
      [-17, -22, 1.6],
    ]) {
      const g = rockGeo(s * 1.3, s * 0.9, s, rr(0, 80), rock, mossC);
      g.translate(x, hS(x, z), z);
      list.push(g);
    }
    const g = mergeGeometries(list)!;
    sway(g);
    const rt = rockTex();
    rt.wrapS = rt.wrapT = THREE.RepeatWrapping;
    addM(new THREE.Mesh(g, natMat(f, env, { map: rt, vc: true, ao: [0.6, -2.5, 0] })), { map: rt, vc: true, ao: [0.6, -2.5, 0] });
  }

  /* ---- cherry trees: recursive branches + blossom clouds ---- */
  const blossomItems: Inst[] = [];
  {
    const segs: Seg[] = [];
    const bark = C("#ffffff");
    for (const tree of trees) {
      const tips: { p: V3; d: V3; r: number }[] = [];
      const H = tree.h;
      const rec = (p: V3, d: V3, len: number, r: number, depth: number, lvl: number) => {
        let cur = p.clone();
        const dir = d.clone();
        const steps = lvl < 2 ? 3 : 2;
        let rc = r;
        for (let s = 0; s < steps; s++) {
          dir.add(V(rr(-0.28, 0.28), rr(-0.12, 0.12), rr(-0.28, 0.28))).normalize();
          if (lvl >= 3) dir.y -= 0.05;
          dir.normalize();
          const nx = cur.clone().addScaledVector(dir, len / steps);
          const rn = r * (1 - (0.28 * (s + 1)) / steps);
          const w = Math.min(1, lvl * 0.25);
          segs.push({ a: cur, b: nx, ra: rc, rb: rn, wa: w * 0.7, wb: w, col: bark.clone().multiplyScalar(lerp(0.55, 1, Math.min(1, lvl / 4))) });
          cur = nx;
          rc = rn;
        }
        if (depth === 0 || rc < 0.02) {
          tips.push({ p: cur, d: dir, r: rc });
          return;
        }
        if (lvl >= 3) tips.push({ p: cur.clone(), d: dir.clone(), r: rc });
        const kids = lvl === 0 ? 4 : rnd() < 0.55 ? 2 : 3;
        const out = V(cur.x - tree.base.x, 0, cur.z - tree.base.z);
        if (out.lengthSq() < 1e-4) out.set(rr(-1, 1), 0, rr(-1, 1));
        out.normalize();
        for (let k = 0; k < kids; k++) {
          let nd: V3;
          if (lvl === 0) {
            const a = (k / kids) * TAU + rr(-0.4, 0.4);
            nd = V(Math.cos(a) * 0.9 * tree.spread, rr(0.55, 0.95), Math.sin(a) * 0.9 * tree.spread).normalize();
          } else {
            const axis = V(rr(-1, 1), rr(-1, 1), rr(-1, 1)).cross(dir).normalize();
            nd = dir.clone().applyAxisAngle(axis, rr(0.35, 0.85)).addScaledVector(out, 0.35 * tree.spread).normalize();
            if (lvl <= 2) nd.y = Math.max(nd.y, 0.15);
            nd.normalize();
          }
          rec(cur, nd, len * rr(0.66, 0.82), rc * rr(0.6, 0.76), depth - 1, lvl + 1);
        }
      };
      const lean = tree.lean.clone().normalize();
      rec(tree.base.clone().add(V(0, -0.3, 0)), lean, H * 0.3, H * 0.05, L ? 5 : 6, 0);
      // blossom clouds
      const cen = tips.reduce((a, t) => a.add(t.p), V()).divideScalar(tips.length);
      const maxD = tips.reduce((m, t) => Math.max(m, t.p.distanceTo(cen)), 1);
      for (const t of tips) {
        const cnt = (t.r < 0.05 ? 3 : 2) * (tree.fine ? 2 : 1);
        for (let i = 0; i < cnt; i++) {
          const p = t.p.clone().add(V(rr(-0.5, 0.5), rr(-0.25, 0.45), rr(-0.5, 0.5)).multiplyScalar(H * 0.1));
          const out = p.distanceTo(cen) / maxD;
          const k = (0.62 + 0.45 * out) * (0.85 + 0.25 * sm(cen.y - 2, cen.y + 2, p.y));
          blossomItems.push({ p, r: [rr(-Math.PI, Math.PI), rr(0, TAU), rr(0, TAU)], s: rr(0.9, 1.6) * (H / 9) * (tree.fine ? 0.62 : 1), c: tree.tint.clone().multiplyScalar(k), cell: rnd() < 0.15 ? 3 : Math.floor(rnd() * 3) });
        }
      }
    }
    const bt = barkTex("cherry");
    bt.wrapS = bt.wrapT = THREE.RepeatWrapping;
    const to: NatOpts = { map: bt, vc: true, sway: 0.08, back: 0.05, ao: [0.6, -2.5, 3] };
    addM(new THREE.Mesh(tubeGeo(segs, 8, 0.6), natMat(f, env, to)), to);
  }
  // distant cherry groves on the hills
  for (let i = 0; i < n(420, 0.35); i++) {
    const x = rr(-70, 70),
      z = rr(-80, -42);
    if (Math.abs(x - 15.5) < 5 && Math.abs(z + 44) < 5) continue;
    const y = hS(x, z) + rr(1.5, 6);
    blossomItems.push({ p: V(x, y, z), r: [rr(-Math.PI, Math.PI), rr(0, TAU), rr(0, TAU)], s: rr(3, 5.5), c: C("#ffe6ee").multiplyScalar(rr(0.6, 0.9)), cell: Math.floor(rnd() * 4) });
  }
  {
    const tex = blossomAtlas();
    tex.anisotropy = 4;
    const g = new THREE.PlaneGeometry(1, 1, 2, 2);
    g.attributes.position.setZ(4, 0.15);
    sway(g, () => 1);
    const bo: NatOpts = { map: tex, alphaTest: 0.42, side: THREE.DoubleSide, atlas: true, sway: 0.18, flutter: 0.015, back: 0.75, emissive: "#2a0e18", ao: [0.8, -2, 6] };
    addM(instanced(g, natMat(f, env, bo), blossomItems, true), bo);
  }

  /* ---- evergreens: clipped azalea mounds, pines, far tree line ---- */
  {
    const tex = clusterAtlas({ h: [80, 118], s: [28, 50], l: [18, 38] }, "#2a2418", [170, 25], 1024, [0.12, 0.22]);
    const g = new THREE.PlaneGeometry(1, 1, 2, 2);
    g.attributes.position.setZ(4, 0.15);
    sway(g, () => 1);
    const items: Inst[] = [];
    const blobs: THREE.BufferGeometry[] = [];
    const blob = (x: number, y: number, z: number, sx: number, sy: number, sz: number, col: string, detail = 3) => {
      const c0 = C(col);
      const b = rockGeo(sx, sy, sz, rr(0, 99), c0, c0.clone().multiplyScalar(1.3), 1, detail);
      b.rotateY(rr(0, TAU));
      b.translate(x, y, z);
      blobs.push(b);
    };
    const mound = (x: number, z: number, R: number, pink: boolean) => {
      const y0 = hS(x, z);
      blob(x, y0 + R * 0.12, z, R * 0.9, R * 0.66, R * 0.9, pink ? "#9ab85a" : "#86a44c");
      for (let i = 0; i < Math.round(R * 11); i++) {
        const a = rr(0, TAU),
          e = rr(0, 1.45),
          k = rr(0.75, 0.95);
        items.push({ p: V(x + Math.cos(a) * Math.cos(e) * R * k, y0 + Math.sin(e) * R * 0.7 * k, z + Math.sin(a) * Math.cos(e) * R * k), r: [rr(-1.4, 1.4), rr(0, TAU), rr(0, TAU)], s: rr(0.8, 1.1) * R * 0.75, c: (pink ? C("#d8e8b0") : C(0xffffff)).multiplyScalar(rr(0.75, 1.1) * (0.7 + 0.35 * Math.sin(e))), cell: Math.floor(rnd() * 4) });
      }
    };
    for (let i = 0; i < n(26); i++) {
      const a = rr(0, TAU),
        d = rr(1.25, 1.9);
      const x = PX + Math.cos(a) * PRX * d,
        z = PZ + Math.sin(a) * PRZ * d;
      if (z > 2 && Math.abs(x) < 5) continue;
      mound(x, z, rr(0.6, 1.2), rnd() < 0.3);
    }
    for (let i = 0; i < n(14); i++) mound(rr(-26, 26), rr(-36, -22), rr(1, 2), false);
    for (const [x, z, R, pk] of [
      [-6.5, 3.5, 1.3, 1],
      [-4.2, 5.5, 0.8, 0],
      [5.4, 3.4, 1.0, 1],
      [7.5, 5.5, 1.0, 0],
      [-11, -2, 1.5, 0],
      [2.6, 2.2, 0.7, 1],
      [0.4, -2.2, 0.55, 0],
      [12.5, -1, 1.6, 1],
    ] as [number, number, number, number][])
      mound(x, z, R, pk > 0);
    // cloud-pruned pines (flat pads)
    for (const [x, z] of [
      [-13.5, -12],
      [15, -20],
      [-21, -26],
    ]) {
      const y0 = hS(x, z);
      for (let k = 0; k < 5; k++) {
        const px = x + rr(-2.2, 2.2),
          pz = z + rr(-1.5, 1.5),
          py = y0 + 1.8 + k * 1.0;
        blob(px, py, pz, rr(0.9, 1.3), rr(0.45, 0.6), rr(0.8, 1.1), "#5f7d3c");
        for (let j = 0; j < 6; j++) items.push({ p: V(px + rr(-0.8, 0.8), py + rr(0, 0.2), pz + rr(-0.8, 0.8)), r: [-Math.PI / 2 + rr(-0.4, 0.4), rr(0, TAU), rr(0, TAU)], s: rr(1.0, 1.5), c: C(0xffffff).multiplyScalar(0.8), cell: Math.floor(rnd() * 4) });
      }
    }
    // far tree line
    for (let i = 0; i < n(170, 0.5); i++) {
      const x = rr(-110, 110),
        z = rr(-96, -50);
      if ((Math.abs(x - 15.5) < 6 && z > -52) || (Math.abs(x + 10) < 32 && z > -72)) continue;
      const r = rr(1.6, 3.4);
      blob(x, hS(x, z) + r * rr(0.2, 0.6), z, r, r * rr(0.8, 1.2), r, rnd() < 0.6 ? "#5a7040" : "#6c7a48", 2);
    }
    const pineSegs: Seg[] = [];
    for (const [x, z] of [
      [-13.5, -12],
      [15, -20],
      [-21, -26],
    ]) {
      const y0 = hS(x, z);
      let prev = V(x, y0 - 0.2, z);
      for (let k = 1; k <= 8; k++) {
        const cur = V(x + Math.sin(k * 0.7) * 0.5, y0 + k * 0.8, z + Math.cos(k * 0.5) * 0.3);
        pineSegs.push({ a: prev, b: cur, ra: 0.28 - k * 0.02, rb: 0.26 - k * 0.02, col: C("#6a5a4a") });
        prev = cur;
      }
    }
    const pineTrunk = tubeGeo(pineSegs, 7);
    addM(new THREE.Mesh(pineTrunk, natMat(f, env, { vc: true, ao: [0.6, -2, 3] })), { vc: true, ao: [0.6, -2, 3] });
    const eo: NatOpts = { map: tex, alphaTest: 0.45, side: THREE.DoubleSide, atlas: true, sway: 0.12, flutter: 0.01, back: 0.35, ao: [0.6, -2.5, 3] };
    addM(instanced(g, natMat(f, env, eo), items, true), eo);
    const st = canvasTex(512, 512, (c) => {
      c.fillStyle = "#56703a";
      c.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 4200; i++) {
        const x = rr(0, 512),
          y = rr(0, 512),
          a = rr(0, TAU),
          len = rr(7, 15);
        const h = rr(78, 112),
          l = rr(18, 44);
        wrapDo(512, 512, x, y, 16, (X, Y) => drawLeaf(c, X, Y, a, len, len * 0.4, h, 45, l, false));
      }
    });
    st.wrapS = st.wrapT = THREE.RepeatWrapping;
    const bg = mergeGeometries(blobs)!;
    sway(bg);
    const bo2: NatOpts = { map: st, vc: true, back: 0.12, ao: [0.6, -2.5, 3] };
    addM(new THREE.Mesh(bg, natMat(f, env, bo2)), bo2);
  }

  /* ---- atmosphere & life ---- */
  group.add(
    drifters(f, env, n(3600, 0.4), { min: V(-26, -2.2, -34), size: V(52, 14, 44), wind: V(0.8, -0.1, 0.3), fall: 0.32, swirl: 0.9, sz: [0.07, 0.13], colA: "#ffd6e4", colB: "#f39ab9", shape: 0 })
  );
  // petals resting on the pond
  group.add(drifters(f, env, n(500, 0.5), { min: V(PX - PRX, WL + 0.02, PZ - PRZ), size: V(PRX * 2, 0.001, PRZ * 2), wind: V(0.06, 0, 0.02), fall: 0, swirl: 0.15, sz: [0.05, 0.09], colA: "#ffd9e6", colB: "#f4b3c9", shape: 0, base: 0.9 }));
  const mists: { p: V3; s: number; a: number; str: number; sp: number }[] = [];
  for (let i = 0; i < n(10); i++) mists.push({ p: V(PX + rr(-9, 9), WL + rr(0.2, 0.9), PZ + rr(-4, 4)), s: rr(3.5, 6), a: rr(0.06, 0.12), str: 2.6, sp: rr(0.05, 0.12) });
  for (let i = 0; i < n(14); i++) mists.push({ p: V(rr(-60, 60), rr(0, 6), rr(-60, -32)), s: rr(14, 24), a: rr(0.18, 0.32), str: 2.4, sp: rr(0.1, 0.25) });
  group.add(mistLayer(f, env, mists, "#ffd6d0", -2.3, 60));
  const motesP: V3[] = [];
  for (let i = 0; i < n(260); i++) motesP.push(V(rr(-16, 18), rr(-1.5, 7), rr(-28, 4)));
  group.add(motes(f, env, motesP, { col: "#ffd9a8", sz: [0.03, 0.06], kind: 0, drift: 0.7, base: 0.7 }));
  group.add(
    godRays(
      f,
      env,
      Array.from({ length: n(6, 0.7) }, () => {
        const g = V(rr(-18, 6), rr(-2, 1), rr(-30, -14));
        return { g, len: 30, w: rr(2, 5), i: rr(0.2, 0.45) };
      }),
      V(0, 1.5, 8),
      "#ffc890",
      0.45
    )
  );

  // distant birds (egret/crow silhouettes)
  const birdN = n(5, 0.6);
  const birdMesh = instanced(
    birdGeo("#2a2230", "#2a2230", "#302838", "#241c28", "#2a2230"),
    natMat(f, env, { vc: true, side: THREE.DoubleSide, bend: FLAP(6.5, 0.7, 0.15, 0.06) }),
    Array.from({ length: birdN }, () => ({ p: V(), r: [0, 0, 0] as [number, number, number], s: 1 }))
  );
  group.add(birdMesh);
  const birds = Array.from({ length: birdN }, (_, i) => ({ off: i * 3 + rr(0, 2), y: rr(12, 18), z: rr(-70, -50) + i, sp: 2.4, ph: rr(0, TAU), s: rr(1.6, 2.2) }));

  /* ---- lights ---- */
  group.add(f.light(new THREE.HemisphereLight("#ffd0dc", "#6a4a58", 1.7)));
  const sunL = f.light(new THREE.DirectionalLight("#ffc68e", 2.3));
  sunL.position.copy(sunD).multiplyScalar(60);
  group.add(sunL);
  const fill = f.light(new THREE.DirectionalLight("#b9a4ff", 0.55));
  fill.position.set(-14, 8, 20);
  group.add(fill);

  const pp = V();
  return {
    group,
    fade: f,
    bg: C("#f1b9a6"),
    fog: C("#e9b0a6"),
    fogDensity: 0.0125,
    update: (t) => {
      env.time.value = t;
      lamps.forEach((l, i) => (l.intensity = 5 * f.value * (0.88 + Math.sin(t * 7 + i * 2) * 0.06 + Math.sin(t * 13 + i) * 0.04)));
      for (const k of kois) {
        k.fish.forEach((fi, i) => {
          const a = t * fi.sp + fi.ph;
          pp.set(fi.cx + Math.cos(a) * fi.rx + Math.sin(a * 2.3) * 0.4, fi.y, fi.cz + Math.sin(a) * fi.rz);
          const dx = -Math.sin(a) * fi.rx * fi.sp,
            dz = Math.cos(a) * fi.rz * fi.sp;
          setInst(k.mesh, i, pp, [0, Math.atan2(dx, dz), 0], fi.s);
        });
        k.mesh.instanceMatrix.needsUpdate = true;
      }
      for (let i = 0; i < birdN; i++) {
        const b = birds[i];
        const u = ((t * b.sp + b.off * 6) % 140) - 70;
        pp.set(u + b.off, b.y + Math.sin(t * 0.4 + b.ph) * 1.2, b.z);
        setInst(birdMesh, i, pp, [0, Math.PI / 2, Math.sin(t * 0.5 + b.ph) * 0.15], b.s);
      }
      birdMesh.instanceMatrix.needsUpdate = true;
    },
    view: (t, pos, look) => {
      const s = Math.sin(t * 0.035);
      const k = 0.5 - 0.5 * Math.cos(t * 0.03);
      pos.set(-1.2 + s * 3.2, 1.0 + Math.sin(t * 0.05) * 0.3 + k * 0.6, 6.8 - k * 2.6);
      look.set(0.8 + s * 1.4, 1.9, -26);
    },
  };
}
