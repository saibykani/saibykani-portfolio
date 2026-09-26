import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { canvasTex, Ctx, Fader, World } from "./common";

/* ============================================================================
 * NIGHT CITY — cinematic drone shot over a dense modern downtown at night.
 * Street grid with sodium / LED streetlights, rivers of head- and tail-lights
 * obeying traffic signals, lit office facades (procedural, per-floor), glass
 * towers with reflections, a river with bridges and shimmering reflections,
 * a helicopter that lands on a rooftop helipad, and a police helicopter
 * sweeping the streets with its searchlight.
 * Ground is y = 0. One unit ~ 3.7 m (one storey).
 * ========================================================================== */

const P = 16; // block pitch (avenues at x = 16i, streets at z = 16j)
const AVE = 2.6; // avenue half width
const ST = 1.8; // street half width
const WALK = 1.0; // sidewalk width
const IX0 = -15,
  IX1 = 14; // block columns
const JZ0 = -22,
  JZ1 = 3; // block rows
const NX = IX1 - IX0 + 1,
  NZ = JZ1 - JZ0 + 1;
const RZ0 = -112 + ST + WALK; // river (between the riverside streets z = -112 and z = -80)
const RZ1 = -80 - ST - WALK;
const RIVER_ST = -96; // street swallowed by the river
const BRIDGES = [-64, 0, 64];
const PAD_Y = 34; // helipad tower roof
const TOWER = new THREE.Vector3(-8, PAD_Y, -24);
const HS = 0.55; // helicopter scale (built in metres-ish)

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FOG_PARS_V = `uniform float fogDensity;`;
const OUT_FRAG = `
#include <tonemapping_fragment>
#include <colorspace_fragment>
`;

/* ---------------------------------------------------------------- glow points */
type Glow = {
  pts: THREE.Points;
  pos: Float32Array;
  col: Float32Array;
  geo: THREE.BufferGeometry;
};
function glowPoints(
  f: Fader,
  shared: { uTime: { value: number }; uScale: { value: number }; uFade: { value: number } },
  n: number,
  fill: (i: number, pos: Float32Array, col: Float32Array, size: Float32Array, dir: Float32Array, blink: Float32Array) => void
): Glow {
  const pos = new Float32Array(n * 3),
    col = new Float32Array(n * 3),
    size = new Float32Array(n),
    dir = new Float32Array(n * 4),
    blink = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) fill(i, pos, col, size, dir, blink);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("aDir", new THREE.BufferAttribute(dir, 4));
  geo.setAttribute("aBlink", new THREE.BufferAttribute(blink, 2));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared },
    vertexShader: `${FOG_PARS_V}
      attribute vec3 color; attribute float aSize; attribute vec4 aDir; attribute vec2 aBlink;
      uniform float uTime, uScale, uFade;
      varying vec3 vCol; varying float vA;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vec4 mv = viewMatrix * wp;
        float d = max(-mv.z, 0.1);
        float k = 1.0;
        if (aDir.w > 0.0) {
          vec3 dw = normalize(mat3(modelMatrix) * aDir.xyz);
          float fc = max(dot(dw, normalize(cameraPosition - wp.xyz)), 0.0);
          k = mix(1.0, 0.3 + 1.3 * fc * fc, aDir.w);
        }
        float b = 1.0;
        if (aBlink.y > 0.5) {
          if (aBlink.y < 1.5) b = pow(0.5 + 0.5 * sin(uTime * 2.6 + aBlink.x), 8.0);
          else if (aBlink.y < 2.5) b = step(0.92, fract(uTime * 0.75 + aBlink.x)) * 1.6;
          else b = 0.7 + 0.3 * sin(uTime * (0.7 + aBlink.x) + aBlink.x * 40.0);
        }
        float ps = aSize * projectionMatrix[1][1] * uScale / d * (0.6 + 0.4 * min(k, 1.5));
        float a = exp(-fogDensity * fogDensity * d * d) * uFade;
        if (ps < 2.0) { a *= ps * 0.5; ps = 2.0; }
        gl_PointSize = min(ps, 90.0);
        vCol = color * k * b; vA = a;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `varying vec3 vCol; varying float vA;
      void main(){
        vec2 c = gl_PointCoord * 2.0 - 1.0; float r2 = dot(c, c);
        if (r2 > 1.0) discard;
        float g = exp(-r2 * 10.0) + exp(-r2 * 3.2) * 0.22;
        gl_FragColor = vec4(vCol * g * vA, 1.0);
        ${OUT_FRAG}
      }`,
  });
  const pts = new THREE.Points(geo, f.mat(mat));
  pts.frustumCulled = false;
  pts.renderOrder = 2;
  return { pts, pos, col, geo };
}

/* ---------------------------------------------------------------- helicopter */
function colored(g: THREE.BufferGeometry, c: string) {
  const col = new THREE.Color(c);
  const n = g.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([col.r, col.g, col.b], i * 3);
  g.setAttribute("color", new THREE.BufferAttribute(a, 3));
  return g;
}
type Heli = {
  root: THREE.Group;
  rotor: THREE.Group;
  tail: THREE.Group;
  lights: Glow;
  landIdx: number;
  yaw: number;
  vel: THREE.Vector3;
  prev: THREE.Vector3;
  pitch: number;
  roll: number;
};
function buildHeli(
  f: Fader,
  env: THREE.Texture,
  shared: { uTime: { value: number }; uScale: { value: number }; uFade: { value: number } },
  main: string,
  accent: string
): Heli {
  const root = new THREE.Group();
  const parts: THREE.BufferGeometry[] = [];
  const add = (g: THREE.BufferGeometry, c: string) => parts.push(colored(g, c));
  add(new THREE.SphereGeometry(1, 22, 14).scale(1.0, 1.05, 2.2).translate(0, 0, 0.3), main);
  add(new THREE.SphereGeometry(1, 16, 10).scale(0.95, 0.5, 1.9).translate(0, -0.55, 0.25), accent);
  add(new THREE.BoxGeometry(1.05, 0.55, 2.1).translate(0, 1.0, -0.5), "#8d939b");
  add(new THREE.CylinderGeometry(0.16, 0.42, 5.8, 12).rotateX(-Math.PI / 2).translate(0, 0.35, -4.3), main);
  add(new THREE.CylinderGeometry(0.08, 0.2, 2.2, 8).rotateX(-Math.PI / 2).translate(0, 0.42, -3.0), accent);
  add(new THREE.BoxGeometry(0.1, 1.7, 0.95).rotateX(-0.35).translate(0, 1.0, -7.05), accent);
  add(new THREE.BoxGeometry(1.9, 0.07, 0.5).translate(0, 0.38, -6.3), main);
  for (const sx of [-1, 1]) {
    add(new THREE.CylinderGeometry(0.07, 0.07, 3.6, 6).rotateX(Math.PI / 2).translate(sx * 0.95, -1.35, 0.25), "#2b2f36");
    add(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 6).rotateZ(sx * 0.35).translate(sx * 0.8, -0.95, 1.0), "#2b2f36");
    add(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 6).rotateZ(sx * 0.35).translate(sx * 0.8, -0.95, -0.6), "#2b2f36");
  }
  add(new THREE.CylinderGeometry(0.1, 0.13, 0.55, 8).translate(0, 1.5, -0.25), "#2b2f36");
  const bodyMat = f.mat(new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.35, roughness: 0.38, envMap: env, envMapIntensity: 0.9 }));
  bodyMat.depthWrite = true;
  const body = new THREE.Mesh(mergeGeometries(parts)!, bodyMat);
  root.add(body);
  const glassMat = f.mat(new THREE.MeshStandardMaterial({ color: "#0b1622", metalness: 0.9, roughness: 0.08, envMap: env, envMapIntensity: 1.4 }));
  glassMat.depthWrite = true;
  const glass = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12).scale(0.92, 0.72, 1.35).translate(0, 0.18, 1.35), glassMat);
  root.add(glass);

  const rotor = new THREE.Group();
  rotor.position.set(0, 1.82, -0.25);
  const blades: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 4; k++) blades.push(new THREE.BoxGeometry(0.32, 0.04, 5.3).translate(0, 0, 2.75).rotateY((k * Math.PI) / 2));
  blades.push(new THREE.CylinderGeometry(0.22, 0.22, 0.22, 10));
  const bladeMat = f.mat(new THREE.MeshStandardMaterial({ color: "#1d2127", metalness: 0.5, roughness: 0.5 }));
  bladeMat.depthWrite = true;
  rotor.add(new THREE.Mesh(mergeGeometries(blades)!, bladeMat));
  const disk = new THREE.Mesh(
    new THREE.CircleGeometry(5.9, 48).rotateX(-Math.PI / 2),
    f.mat(new THREE.MeshBasicMaterial({ color: "#aab4c0", depthWrite: false, side: THREE.DoubleSide }), 0.07)
  );
  rotor.add(disk);
  root.add(rotor);

  const tail = new THREE.Group();
  tail.position.set(0.14, 1.05, -7.1);
  const tb = mergeGeometries([new THREE.BoxGeometry(0.04, 1.6, 0.14), new THREE.BoxGeometry(0.04, 0.14, 1.6)])!;
  tail.add(new THREE.Mesh(tb, bladeMat));
  const tdisk = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 24).rotateY(Math.PI / 2),
    f.mat(new THREE.MeshBasicMaterial({ color: "#aab4c0", depthWrite: false, side: THREE.DoubleSide }), 0.08)
  );
  tail.add(tdisk);
  root.add(tail);

  // navigation lights (local): red left (+x), green right (-x), white tail, red beacons, white strobe, landing light
  const L: [number[], number[], number, number[], number[]][] = [
    [[1.0, 0.38, -6.3], [1.6, 0.05, 0.03], 0.55, [0, 0, 0, 0], [0, 0]],
    [[-1.0, 0.38, -6.3], [0.05, 1.5, 0.25], 0.55, [0, 0, 0, 0], [0, 0]],
    [[0, 0.5, -7.45], [1.2, 1.2, 1.2], 0.45, [0, 0, 0, 0], [0, 0]],
    [[0, 1.35, 0.4], [2.2, 0.05, 0.02], 1.0, [0, 0, 0, 0], [1.3, 1]],
    [[0, -1.12, 0.3], [2.2, 0.05, 0.02], 0.9, [0, 0, 0, 0], [3.0, 1]],
    [[0, 1.9, -7.2], [3.0, 3.0, 3.2], 1.3, [0, 0, 0, 0], [0.4, 2]],
    [[0, -0.95, 2.2], [3.0, 2.9, 2.6], 1.8, [0, -0.5, 1, 0.8], [0, 0]],
  ];
  const lights = glowPoints(f, shared, L.length, (i, pos, col, size, dir, blink) => {
    pos.set(L[i][0], i * 3);
    col.set(L[i][1], i * 3);
    size[i] = L[i][2];
    dir.set(L[i][3], i * 4);
    blink.set(L[i][4], i * 2);
  });
  root.add(lights.pts);
  root.scale.setScalar(HS);
  root.rotation.order = "YXZ";
  return { root, rotor, tail, lights, landIdx: 6, yaw: 0, vel: new THREE.Vector3(), prev: new THREE.Vector3(), pitch: 0, roll: 0 };
}

/* Searchlight cone (apex at origin, pointing down -y, unit length / radius). */
function beamMesh(f: Fader, uFade: { value: number }) {
  const g = new THREE.ConeGeometry(1, 1, 28, 1, true).translate(0, -0.5, 0);
  const uI = { value: 0 };
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uFade, uI },
    vertexShader: `${FOG_PARS_V} varying float vV; varying float vF; varying float vFog;
      void main(){ vV = -position.y; vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal); vF = abs(dot(n, normalize(-mv.xyz)));
        float d = -mv.z; vFog = exp(-fogDensity * fogDensity * d * d);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uFade, uI; varying float vV; varying float vF; varying float vFog;
      void main(){ float a = pow(1.0 - vV, 1.4) * pow(vF, 2.2) * uI * uFade * vFog * 0.13;
        gl_FragColor = vec4(vec3(0.82, 0.9, 1.0) * a, 1.0); ${OUT_FRAG} }`,
  });
  f.mat(m);
  const mesh = new THREE.Mesh(g, m);
  mesh.renderOrder = 3;
  mesh.frustumCulled = false;
  return { mesh, uI };
}

/* ============================================================================ */
export function city(ctx: Ctx): World {
  const lite = ctx.lite;
  const group = new THREE.Group();
  const f = new Fader();
  const rng = mulberry(20260926);
  const R = (a: number, b: number) => a + rng() * (b - a);
  const T0 = 12; // start mid-approach so the helicopter is on screen right away

  const uFade = f.uniform({ value: 0 });
  const uTime = { value: 0 };
  const uScale = { value: 450 };
  const shared = { uTime, uScale, uFade };
  const fogColor = new THREE.Color("#3a3150");

  /* ---------------- environment map for reflections (night sky + city glow below) */
  const env = canvasTex(512, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#020309");
    gr.addColorStop(0.35, "#0a0d22");
    gr.addColorStop(0.49, "#3b2c3e");
    gr.addColorStop(0.52, "#4a3326");
    gr.addColorStop(0.6, "#1d1512");
    gr.addColorStop(1, "#0b0908");
    g.fillStyle = gr;
    g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 1400; i++) {
      const y = 128 + Math.pow(Math.random(), 1.6) * 128;
      g.fillStyle = Math.random() < 0.7 ? "rgba(255,190,120,0.9)" : "rgba(210,225,255,0.9)";
      g.fillRect(Math.random() * 512, y, 1 + Math.random() * 1.5, 1);
    }
    for (let i = 0; i < 60; i++) {
      g.fillStyle = "rgba(255,230,200,0.35)";
      g.fillRect(Math.random() * 512, 100 + Math.random() * 28, 2 + Math.random() * 6, 3 + Math.random() * 20);
    }
  });
  env.mapping = THREE.EquirectangularReflectionMapping;

  /* ---------------- sky dome */
  {
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      uniforms: {
        uFade,
        uHor: { value: fogColor.clone().convertLinearToSRGB() },
        uMid: { value: new THREE.Color("#161a3a") },
        uTop: { value: new THREE.Color("#04050d") },
        uGlow: { value: new THREE.Color("#2a1a26") },
      },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform vec3 uHor, uMid, uTop, uGlow; uniform float uFade; varying vec3 vW;
        void main(){ vec3 d = normalize(vW - cameraPosition); float e = d.y;
          vec3 c = mix(uMid, uTop, smoothstep(0.1, 0.75, e));
          c += uGlow * exp(-max(e, 0.0) * 10.0);
          gl_FragColor = vec4(c, uFade);
          ${OUT_FRAG}
          gl_FragColor.rgb = mix(uHor, gl_FragColor.rgb, smoothstep(-0.01, 0.2, e)); }`,
    });
    f.mat(m);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(480, 32, 16), m);
    sky.renderOrder = -3;
    sky.frustumCulled = false;
    group.add(sky);

    // faint stars (light-polluted sky)
    const ns = lite ? 160 : 320;
    group.add(
      glowPoints(f, shared, ns, (i, pos, col, size, _d, blink) => {
        const az = rng() * Math.PI * 2,
          el = 0.12 + Math.pow(rng(), 0.7) * 1.2;
        pos.set([Math.cos(az) * Math.cos(el) * 440, Math.sin(el) * 440, Math.sin(az) * Math.cos(el) * 440 - 60], i * 3);
        const b = 0.25 + rng() * 0.6;
        col.set([b * 0.9, b * 0.95, b], i * 3);
        size[i] = 1.6 + rng() * 1.4;
        blink.set([rng() * 3, 3], i * 2);
      }).pts
    );

    // moon
    const moonTex = canvasTex(128, 128, (g) => {
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, "rgba(235,230,215,1)");
      gr.addColorStop(0.28, "rgba(228,224,210,1)");
      gr.addColorStop(0.31, "rgba(190,200,230,0.22)");
      gr.addColorStop(0.6, "rgba(120,130,190,0.05)");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
      g.fillStyle = "rgba(170,165,160,0.35)";
      for (const [x, y, r] of [
        [56, 58, 7],
        [70, 66, 5],
        [62, 74, 4],
        [72, 54, 3],
      ])
        g.beginPath(), g.arc(x, y, r, 0, Math.PI * 2), g.fill();
    });
    const moon = new THREE.Sprite(f.mat(new THREE.SpriteMaterial({ map: moonTex, fog: false, depthWrite: false, blending: THREE.AdditiveBlending })));
    moon.position.set(-150, 150, -380);
    moon.scale.setScalar(26);
    moon.renderOrder = -2;
    group.add(moon);
  }

  /* ---------------- block map (parks) */
  const blk = new Uint8Array(NX * NZ * 4);
  const parks = new Set<string>(["1,-5", "2,-5", "-6,-3", "-4,-14", "6,-9"]);
  for (let i = IX0; i <= IX1; i++)
    for (let j = JZ0; j <= JZ1; j++) {
      const k = i + "," + j;
      if (!parks.has(k) && rng() < 0.035 && Math.abs(i) > 3) parks.add(k);
      if (parks.has(k)) blk[((j - JZ0) * NX + (i - IX0)) * 4] = 255;
    }
  const blkTex = new THREE.DataTexture(blk, NX, NZ, THREE.RGBAFormat);
  blkTex.needsUpdate = true;

  /* ---------------- ground: asphalt, markings, sidewalks, lamp pools, searchlight pools */
  const uSpot = { value: [new THREE.Vector4(0, 0, 1, 0), new THREE.Vector4(0, 0, 1, 0)] };
  {
    const m = new THREE.ShaderMaterial({
      transparent: true,
      fog: true,
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uFade, uBlk: { value: blkTex }, uSpot },
      vertexShader: `varying vec3 vW; varying float vD;
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uFade; uniform sampler2D uBlk; uniform vec4 uSpot[2];
        uniform vec3 fogColor; uniform float fogDensity;
        varying vec3 vW; varying float vD;
        float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vn(vec2 p){ vec2 i = floor(p), q = fract(p); q = q * q * (3.0 - 2.0 * q);
          return mix(mix(hs(i), hs(i + vec2(1.0, 0.0)), q.x), mix(hs(i + vec2(0.0, 1.0)), hs(i + vec2(1.0, 1.0)), q.x), q.y); }
        float band(float d, float w){ float fw = fwidth(d) + 1e-4; return 1.0 - smoothstep(w - fw, w + fw, d); }
        void main(){
          vec2 p = vW.xz;
          if (p.y > ${RZ0.toFixed(2)} && p.y < ${RZ1.toFixed(2)}) discard;
          vec2 cell = floor(p / 16.0);
          vec2 lp = p - cell * 16.0;
          float dx = min(lp.x, 16.0 - lp.x), dz = min(lp.y, 16.0 - lp.y);
          float aveIdx = floor(p.x / 16.0 + 0.5);
          float stIdx = floor(p.y / 16.0 + 0.5);
          float rs = abs(stIdx * 16.0 - (${RIVER_ST}.0)) < 1.0 ? 0.0 : 1.0;
          float onA = band(dx, ${AVE}), onS = band(dz, ${ST}) * rs;
          float wkA = band(dx, ${AVE + WALK}), wkS = band(dz, ${ST + WALK}) * rs;
          vec2 buv = (cell - vec2(${IX0}.0, ${JZ0}.0) + 0.5) / vec2(${NX}.0, ${NZ}.0);
          float park = texture2D(uBlk, clamp(buv, 0.0, 1.0)).r * (1.0 - max(wkA, wkS));
          float n = vn(p * 0.35) * 0.6 + vn(p * 1.9) * 0.4;
          vec3 lotC = mix(vec3(0.022, 0.022, 0.025), vec3(0.04, 0.038, 0.036), n);
          float canopy = smoothstep(0.45, 0.6, vn(p * 0.9));
          vec3 grass = mix(vec3(0.01, 0.022, 0.012), vec3(0.004, 0.01, 0.006), canopy);
          lotC = mix(lotC, grass, park);
          vec3 walkC = vec3(0.085, 0.08, 0.076) * (0.85 + 0.3 * n);
          vec3 asph = vec3(0.02, 0.021, 0.024) * (0.75 + 0.5 * n);
          float road = max(onA, onS);
          vec3 c = mix(lotC, walkC, max(wkA, wkS));
          c = mix(c, asph, road);
          float fade = exp(-vD * 0.004);
          float yel = band(abs(dx - 0.09), 0.035) * onA * (1.0 - wkS);
          float dash = band(abs(dx - 1.3), 0.045) * step(0.55, fract(p.y / 3.0)) * onA * (1.0 - wkS);
          float sdash = band(dz, 0.045) * step(0.5, fract(p.x / 2.6)) * onS * (1.0 - wkA);
          float cwA = onA * band(abs(dz - 2.35), 0.4) * step(0.5, fract(p.x * 1.5)) * rs;
          float cwS = onS * band(abs(dx - 3.1), 0.42) * step(0.5, fract(p.y * 1.5));
          c += (vec3(0.3) * (dash + sdash + cwA + cwS) + vec3(0.36, 0.25, 0.05) * yel) * fade;
          // streetlight pools (lamps every 8 units on both sides of every road)
          float mz = abs(mod(p.y, 8.0) - 4.0), mx = abs(mod(p.x, 8.0) - 4.0);
          float pa = exp(-((dx - 3.1) * (dx - 3.1) + mz * mz) / 4.0);
          float ps = exp(-((dz - 2.3) * (dz - 2.3) + mx * mx) / 4.0) * rs;
          vec3 sod = vec3(1.0, 0.52, 0.2), led = vec3(0.62, 0.62, 0.62);
          vec3 lamp = (mod(aveIdx, 4.0) == 0.0 ? led : sod) * pa + sod * ps;
          vec3 Lt = vec3(0.14, 0.13, 0.18) + lamp * 7.0 * mix(1.0, 0.45, smoothstep(80.0, 260.0, vD));
          for (int k = 0; k < 2; k++) { vec4 s = uSpot[k]; float q = length(p - s.xy) / max(s.z, 0.01);
            Lt += vec3(0.85, 0.9, 1.0) * s.w * exp(-q * q * 2.2) * 9.0; }
          c *= Lt;
          float fg = 1.0 - exp(-fogDensity * fogDensity * vD * vD);
          gl_FragColor = vec4(c, uFade);
          ${OUT_FRAG}
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fg);
        }`,
    });
    f.mat(m);
    m.depthWrite = true;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1300, 1300).rotateX(-Math.PI / 2).translate(0, 0, -200), m);
    ground.renderOrder = -1;
    group.add(ground);
  }

  /* ---------------- river water with streaky reflections */
  const waterMat = new THREE.ShaderMaterial({
    transparent: true,
    fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uFade, uTime },
    vertexShader: `varying vec3 vW; varying float vD;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uFade, uTime; uniform vec3 fogColor; uniform float fogDensity;
      varying vec3 vW; varying float vD;
      float h1(float n){ return fract(sin(n * 12.9898) * 43758.5453); }
      void main(){
        vec2 p = vW.xz;
        vec3 V = normalize(cameraPosition - vW);
        float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 4.0);
        vec3 c = vec3(0.004, 0.006, 0.012) + fres * vec3(0.09, 0.07, 0.1);
        float rip = sin(p.y * 1.9 + uTime * 1.4 + sin(p.x * 0.7) * 1.6) * 0.22 + sin(p.y * 5.1 - uTime * 2.3 + p.x * 1.3) * 0.08;
        float fromFar = p.y - ${RZ0.toFixed(2)};
        float fromNear = ${RZ1.toFixed(2)} - p.y;
        // lamp reflections from the far bank promenade (streak toward the camera)
        float lx = p.x + rip;
        float m = abs(fract(lx / 4.0) - 0.5) * 4.0;
        float br = 0.55 + 0.45 * sin(p.y * 7.0 + uTime * 3.0 + floor(lx / 4.0) * 1.7);
        c += vec3(1.0, 0.6, 0.28) * exp(-m * m * 5.0) * exp(-fromFar / 10.0) * br * 0.9;
        // tall lit buildings across the river: long broken coloured columns
        float cid = floor((p.x + rip * 2.5) / 1.6);
        float hb = h1(cid);
        vec3 bc = hb > 0.8 ? vec3(0.7, 0.8, 1.0) : vec3(1.0, 0.75, 0.45);
        float col = step(0.5, hb) * exp(-fromFar / 26.0) * pow(0.5 + 0.5 * sin(p.y * 4.0 + uTime * 2.0 + hb * 30.0), 3.0);
        c += bc * col * 0.28;
        // near-bank faint lamp glints
        c += vec3(1.0, 0.6, 0.28) * exp(-m * m * 5.0) * exp(-fromNear / 2.0) * 0.25;
        // bridge light reflections
        ${BRIDGES.map((b) => `{ float d = abs(p.x - (${b}.0) + rip * 0.6); c += vec3(1.0, 0.82, 0.6) * exp(-d * d * 0.03) * (0.4 + 0.3 * sin(p.y * 5.0 + uTime * 2.5)) * step(4.0, d) * 0.35; }`).join("\n")}
        float fg = 1.0 - exp(-fogDensity * fogDensity * vD * vD);
        gl_FragColor = vec4(c, uFade);
        ${OUT_FRAG}
        gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fg);
      }`,
  });
  f.mat(waterMat);
  waterMat.depthWrite = true;
  {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(1300, RZ1 - RZ0 + 0.4).rotateX(-Math.PI / 2).translate(0, -0.35, (RZ0 + RZ1) / 2), waterMat);
    w.renderOrder = -1;
    group.add(w);
  }

  /* ---------------- buildings */
  type Tier = { x: number; z: number; w: number; d: number; y0: number; y1: number; style: number; seed: number; top: number; lit: number; col: THREE.Color };
  const tiers: Tier[] = [];
  const beaconPts: number[][] = [];
  const spireGeos: THREE.BufferGeometry[] = [];
  const crownGeos: THREE.BufferGeometry[] = [];
  const concrete = ["#6f6a63", "#5d6067", "#7b7064", "#50535b", "#686a6e", "#7a7670"];
  const glassC = ["#2c3d52", "#23323a", "#34404f", "#3d4038", "#2a3446", "#3a4656"];
  const addTier = (x: number, z: number, w: number, d: number, y0: number, y1: number, style: number, seed: number, top: number, lit: number) => {
    const pal = style === 1 ? glassC : concrete;
    tiers.push({ x, z, w, d, y0, y1, style, seed, top, lit, col: new THREE.Color(pal[Math.floor(seed * 97) % pal.length]) });
  };
  const spire = (x: number, z: number, y: number, len: number, r = 0.35) => {
    spireGeos.push(new THREE.CylinderGeometry(r * 0.25, r, len, 6).translate(x, y + len / 2, z));
    beaconPts.push([x, y + len + 0.2, z, 1]);
  };
  const crown = (x: number, z: number, y: number, s: number, h: number) => {
    crownGeos.push(new THREE.ConeGeometry(s / Math.SQRT2, h, 4, 1, true).rotateY(Math.PI / 4).translate(x, y + h / 2, z));
  };
  const cornerBeacons = (x: number, z: number, w: number, d: number, y: number) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) beaconPts.push([x + (sx * w) / 2 - sx * 0.2, y + 0.25, z + (sz * d) / 2 - sz * 0.2, 0]);
  };

  const landmarks: Record<string, (cx: number, cz: number) => void> = {
    // helipad tower (glass) on a concrete podium
    "-1,-2": (cx, cz) => {
      addTier(cx, cz, 8.8, 10.4, 0, 6, 0, 0.13, 6, 0.6);
      addTier(cx, cz, 8.2, 8.2, 0, PAD_Y, 1, 0.41, PAD_Y, 0.62);
      cornerBeacons(cx, cz, 8.2, 8.2, PAD_Y);
    },
    "0,-11": (cx, cz) => {
      addTier(cx, cz, 10, 10, 0, 50, 1, 0.07, 92, 0.7);
      addTier(cx, cz, 8, 8, 50, 72, 1, 0.07, 92, 0.7);
      addTier(cx, cz, 6, 6, 72, 88, 1, 0.66, 92, 0.75);
      crown(cx, cz, 88, 6, 8);
      spire(cx, cz, 95, 16, 0.5);
    },
    "-3,-9": (cx, cz) => {
      addTier(cx, cz, 9, 9, 0, 62, 1, 0.71, 62, 0.62);
      spire(cx, cz, 62, 12);
      cornerBeacons(cx, cz, 9, 9, 62);
    },
    "2,-8": (cx, cz) => {
      addTier(cx, cz, 8.8, 10.4, 0, 8, 0, 0.23, 8, 0.5);
      addTier(cx, cz, 8.5, 9.5, 0, 54, 1, 0.36, 66, 0.55);
      addTier(cx, cz, 6.5, 7.5, 54, 66, 1, 0.64, 66, 0.6);
      cornerBeacons(cx, cz, 6.5, 7.5, 66);
    },
    "-2,-5": (cx, cz) => {
      addTier(cx, cz, 8, 10, 0, 46, 1, 0.68, 46, 0.58);
      cornerBeacons(cx, cz, 8, 10, 46);
    },
    "3,-4": (cx, cz) => {
      addTier(cx, cz, 8.8, 9, 0, 40, 0, 0.52, 40, 0.5);
    },
    "-5,-12": (cx, cz) => {
      addTier(cx, cz, 7.5, 7.5, 0, 72, 1, 0.9, 72, 0.6);
      spire(cx, cz, 72, 14);
    },
    "5,-13": (cx, cz) => {
      addTier(cx, cz, 9, 10, 0, 58, 1, 0.63, 58, 0.55);
      cornerBeacons(cx, cz, 9, 10, 58);
    },
    "1,-14": (cx, cz) => {
      addTier(cx - 2.4, cz, 4.2, 9, 0, 78, 1, 0.33, 78, 0.6);
      addTier(cx + 2.4, cz, 4.2, 9, 0, 70, 1, 0.34, 70, 0.6);
      spire(cx - 2.4, cz, 78, 10);
    },
    "-2,-16": (cx, cz) => {
      addTier(cx, cz, 9, 9, 0, 64, 1, 0.88, 68, 0.6);
      crown(cx, cz, 64, 9, 7);
    },
  };

  const downtown = (x: number, z: number) =>
    Math.max(Math.exp(-((x + 12) ** 2 + (z + 52) ** 2) / (46 * 46)) * 0.7, Math.exp(-((x - 4) ** 2 + (z + 175) ** 2) / (75 * 75)));

  for (let i = IX0; i <= IX1; i++)
    for (let j = JZ0; j <= JZ1; j++) {
      const key = i + "," + j;
      const x0 = P * i + AVE + WALK,
        x1 = P * (i + 1) - AVE - WALK;
      const z0 = P * j + ST + WALK,
        z1 = P * (j + 1) - ST - WALK;
      const cx = (x0 + x1) / 2,
        cz = (z0 + z1) / 2;
      if (cz > RZ0 - 1 && cz < RZ1 + 1) continue; // river
      if (parks.has(key)) continue;
      if (landmarks[key]) {
        landmarks[key](cx, cz);
        continue;
      }
      const D = downtown(cx, cz);
      const edge = Math.max(Math.abs(cx) / 170, (cz + 100) / 160, (-cz - 100) / 190);
      if (lite && (cz < -150 || Math.abs(cx) > 110) && rng() < 0.6) continue;
      const r = rng();
      const lots: [number, number, number, number][] = [];
      const gap = 0.6;
      if (r < 0.3) lots.push([x0, x1, z0, z1]);
      else if (r < 0.68) {
        const m = (z0 + z1) / 2 + R(-1.5, 1.5);
        lots.push([x0, x1, z0, m - gap / 2], [x0, x1, m + gap / 2, z1]);
      } else {
        const mx = (x0 + x1) / 2 + R(-1, 1),
          mz = (z0 + z1) / 2 + R(-1.2, 1.2);
        lots.push([x0, mx - gap / 2, z0, mz - gap / 2], [mx + gap / 2, x1, z0, mz - gap / 2], [x0, mx - gap / 2, mz + gap / 2, z1], [mx + gap / 2, x1, mz + gap / 2, z1]);
      }
      for (const [a0, a1, b0, b1] of lots) {
        if (edge > 0.8 && rng() < 0.25) continue;
        const ins = () => R(0.05, 0.5);
        const lx0 = a0 + ins(),
          lx1 = a1 - ins(),
          lz0 = b0 + ins(),
          lz1 = b1 - ins();
        const w = lx1 - lx0,
          d = lz1 - lz0;
        const x = (lx0 + lx1) / 2,
          z = (lz0 + lz1) / 2;
        let h = 3 + 7 * rng() + D * (8 + 50 * Math.pow(rng(), 1.5)) + (rng() < 0.07 ? R(6, 16) : 0);
        h *= 1 - Math.min(0.5, Math.max(0, edge - 0.6));
        if (z > -34) h = Math.min(h, 12 + rng() * 10);
        h = Math.max(2.5, Math.round(h));
        const seed = rng();
        const style = h > 26 ? (rng() < 0.7 ? 1 : 0) : h < 11 && rng() < 0.6 ? 2 : rng() < 0.2 ? 1 : 0;
        const lit = style === 1 ? R(0.35, 0.75) : style === 2 ? R(0.3, 0.6) : R(0.3, 0.65);
        if (h > 20 && rng() < 0.55 && w > 4 && d > 4) {
          // podium + tower (+ setback)
          const ph = Math.round(R(3, 6));
          addTier(x, z, w, d, 0, ph, 0, seed * 0.7, ph, R(0.4, 0.7));
          const tw = w * R(0.55, 0.8),
            td = d * R(0.55, 0.8);
          if (h > 32 && rng() < 0.5) {
            const sb = Math.round(h * R(0.6, 0.75));
            addTier(x, z, tw, td, 0, sb, style, seed, h, lit);
            addTier(x, z, tw * 0.72, td * 0.72, sb, h, style, seed, h, lit);
            if (rng() < 0.3) spire(x, z, h, R(4, 9), 0.25);
          } else addTier(x, z, tw, td, 0, h, style, seed, h, lit);
          if (h > 26) beaconPts.push([x, h + 0.3, z, 0]);
        } else {
          addTier(x, z, w, d, 0, h, style, seed, h, lit);
          if (h > 26) beaconPts.push([x, h + 0.3, z, 0]);
        }
      }
    }

  const bMat = new THREE.MeshStandardMaterial({ color: "#ffffff", metalness: 0.2, roughness: 0.8, envMap: env, envMapIntensity: 1.0, emissive: "#ffffff" });
  f.mat(bMat);
  bMat.depthWrite = true;
  const uWin = { value: 1 };
  bMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.uniforms.uWin = uWin;
    sh.vertexShader = sh.vertexShader
      .replace(
        "void main() {",
        `attribute vec4 aB; varying vec4 vB; varying vec3 vFac; varying vec4 vRoof;
        void main() {`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vB = aB;
        vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        vec4 wpB = modelMatrix * instanceMatrix * vec4(position, 1.0);
        float isX = step(0.5, abs(normal.x));
        float faceW = mix(sc.x, sc.z, isX);
        float lc = mix(position.x, position.z, isX) + 0.5;
        float cw = (aB.y > 0.5 && aB.y < 1.5 ? 0.7 : (aB.y > 1.5 ? 1.05 : 0.8)) * (0.82 + 0.4 * fract(aB.x * 13.7));
        float cols = max(1.0, floor(faceW / cw + 0.5));
        float fid = isX * (normal.x > 0.0 ? 1.0 : 2.0) + (1.0 - isX) * (normal.z > 0.0 ? 3.0 : 4.0);
        vFac = vec3(lc * cols, wpB.y, fid + step(0.5, normal.y) * 100.0);
        vRoof = vec4((position.x + 0.5) * sc.x, (position.z + 0.5) * sc.z, sc.x, sc.z);`
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "void main() {",
        `uniform float uTime, uWin; varying vec4 vB; varying vec3 vFac; varying vec4 vRoof;
        float bh1(float n){ return fract(sin(n) * 43758.5453); }
        float bh2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main() {
          vec3 wEm = vec3(0.0); float wMask = 0.0; float gS = 0.0; float rf = 0.0;`
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        {
          float seed = vB.x, style = vB.y, topH = vB.z, litF = vB.w;
          float roof = step(99.0, vFac.z);
          float glassS = step(0.5, style) * step(style, 1.5);
          float resS = step(1.5, style);
          float fh = mix(0.88, 1.0, glassS) + 0.1 * fract(seed * 5.3);
          vec2 g = vec2(vFac.x, vFac.y / fh);
          vec2 id = floor(g), fr = fract(g);
          vec2 fw = fwidth(g);
          float faceId = mod(vFac.z, 100.0);
          // window opening inside each bay: concrete = ribbon-ish, glass = full-height with mullions, residential = small punched
          vec2 lo = glassS > 0.5 ? vec2(0.06, 0.2) : (resS > 0.5 ? vec2(0.3, 0.32) : vec2(0.12, 0.3));
          vec2 hi = glassS > 0.5 ? vec2(0.94, 0.94) : (resS > 0.5 ? vec2(0.7, 0.8) : vec2(0.88, 0.8));
          float mx = smoothstep(lo.x - fw.x, lo.x + fw.x, fr.x) * (1.0 - smoothstep(hi.x - fw.x, hi.x + fw.x, fr.x));
          float my = smoothstep(lo.y - fw.y, lo.y + fw.y, fr.y) * (1.0 - smoothstep(hi.y - fw.y, hi.y + fw.y, fr.y));
          float area = (hi.x - lo.x) * (hi.y - lo.y);
          float farK = clamp(max(fw.x, fw.y) * 1.3 - 0.35, 0.0, 1.0);
          float win = mix(mx * my, area, farK);
          // occupancy: offices light whole floors (split into zones), homes light single rooms
          float zw = 2.0 + floor(bh1(id.y * 3.7 + seed * 41.0) * 6.0);
          float zone = floor(id.x / zw);
          float fl = bh2(vec2(id.y * 7.13 + seed * 113.0, zone * 3.1 + faceId * 0.37));
          float cl = bh2(id + vec2(seed * 57.0 + faceId * 13.0, seed * 31.0));
          float floorLit = step(fl, mix(litF, 0.55 + litF * 0.4, glassS));
          float on = resS > 0.5 ? step(1.0 - litF * 0.8, cl) : floorLit * step(0.07, cl) + (1.0 - floorLit) * step(0.94, cl);
          float fk = bh2(id * 1.37 + floor(uTime * 0.2 + cl * 9.0));
          on = abs(on - step(0.994, fk));
          on = mix(on, (resS > 0.5 ? litF * 0.8 : litF) * 0.9 + 0.03, farK * 0.6);
          float inten = mix(0.35 + 0.75 * bh2(id * 0.71 + seed * 3.0), (0.5 + 0.5 * bh1(id.y * 1.3 + zone * 7.0 + seed * 9.0)) * (0.85 + 0.15 * cl), 1.0 - resS);
          // colour temperature: offices fluorescent/LED (neutral-cool), homes warm tungsten
          float bt = fract(seed * 7.7);
          vec3 warm = vec3(1.0, 0.56, 0.24), neu = vec3(1.0, 0.8, 0.56), cool = vec3(0.78, 0.87, 1.0);
          vec3 wc = resS > 0.5 ? mix(warm, neu, cl * 0.6) : (bt < 0.45 ? mix(neu, cool, 0.35 + cl * 0.2) : (bt < 0.8 ? mix(neu, warm, 0.25) : cool));
          float grad = (0.72 + 0.4 * fr.y) * (0.8 + 0.25 * sin(fr.x * 6.2831 * (1.0 + floor(cl * 3.0)) + cl * 20.0)) ;
          vec3 em = wc * win * on * inten * grad * mix(0.9, 0.5, glassS);
          em += win * (1.0 - on) * vec3(0.02, 0.025, 0.035) * (0.5 + cl);
          float lobby = 1.0 - smoothstep(1.1, 1.4, vFac.y);
          em += lobby * win * vec3(1.0, 0.84, 0.62) * 1.1;
          em += vec3(1.0, 0.5, 0.22) * 0.05 * exp(-vFac.y * 0.3);
          float crownK = step(0.55, fract(seed * 3.3)) * step(30.0, topH) * smoothstep(topH - 5.0, topH - 0.3, vFac.y);
          em += crownK * mix(vec3(1.0, 0.8, 0.55), vec3(0.8, 0.88, 1.0), step(0.5, fract(seed * 11.0))) * 0.45;
          // roof: gravel noise, parapet edge, a few rooftop units
          vec2 ru = vRoof.xy;
          float edge = min(min(ru.x, vRoof.z - ru.x), min(ru.y, vRoof.w - ru.y));
          float par = 1.0 - smoothstep(0.15, 0.3, edge);
          vec2 uc = floor(ru / 1.7);
          float unit = step(0.8, bh2(uc + seed * 17.0)) * step(0.6, edge) * step(0.25, fract(ru.x / 1.7)) * step(fract(ru.x / 1.7), 0.8) * step(0.25, fract(ru.y / 1.7)) * step(fract(ru.y / 1.7), 0.8);
          vec3 roofC = vec3(0.12, 0.11, 0.1) * (0.75 + 0.5 * bh2(floor(ru * 3.0) + seed)) * (1.0 + par * 0.9 + unit * 0.8);
          wEm = em * (1.0 - roof) * uWin + roof * (par * vec3(0.014, 0.01, 0.007) + unit * vec3(0.01, 0.008, 0.006) + vec3(0.004, 0.003, 0.002));
          wMask = win * (1.0 - roof);
          diffuseColor.rgb = mix(diffuseColor.rgb * mix(1.0, 0.3, wMask), roofC, roof);
          gS = glassS; rf = roof;
        }`
      )
      .replace(
        "#include <metalnessmap_fragment>",
        `#include <metalnessmap_fragment>
        metalnessFactor = clamp(mix(metalnessFactor, 0.9, max(gS * 0.85, wMask * 0.6)), 0.0, 1.0) * (1.0 - rf);`
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(mix(roughnessFactor, 0.2, max(gS * 0.9, wMask * 0.7)), 1.0, rf);`
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        totalEmissiveRadiance = wEm;`
      );
  };
  // rooftop mechanical units / stair & lift housings / water tanks
  {
    const tops = tiers.filter((b) => b.y1 >= b.top - 0.01 && b.top > 3 && !(Math.abs(b.x - TOWER.x) < 5 && Math.abs(b.z - TOWER.z) < 5));
    const units: number[][] = [];
    for (const b of tops) {
      const n = 1 + Math.floor(rng() * (b.w * b.d > 40 ? 4 : 2.5));
      for (let k = 0; k < n; k++) {
        const w = Math.min(b.w * 0.45, R(0.6, 2.4)),
          d = Math.min(b.d * 0.45, R(0.6, 2.4));
        units.push([b.x + R(-0.5, 0.5) * (b.w - w - 0.6), b.y1, b.z + R(-0.5, 0.5) * (b.d - d - 0.6), w, R(0.35, 1.3), d]);
      }
    }
    const uMat = f.mat(new THREE.MeshStandardMaterial({ color: "#3a3936", metalness: 0.3, roughness: 0.8 }));
    uMat.depthWrite = true;
    const um = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), uMat, units.length);
    const m4 = new THREE.Matrix4();
    units.forEach((u, i) => um.setMatrixAt(i, m4.makeScale(u[3], u[4], u[5]).setPosition(u[0], u[1], u[2])));
    um.frustumCulled = false;
    group.add(um);
  }

  const bGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const bld = new THREE.InstancedMesh(bGeo, bMat, tiers.length);
  const aB = new Float32Array(tiers.length * 4);
  {
    const m4 = new THREE.Matrix4();
    tiers.forEach((b, i) => {
      m4.makeScale(b.w, b.y1 - b.y0, b.d).setPosition(b.x, b.y0, b.z);
      bld.setMatrixAt(i, m4);
      bld.setColorAt(i, b.col);
      aB.set([b.seed, b.style, b.top, b.lit], i * 4);
    });
  }
  bGeo.setAttribute("aB", new THREE.InstancedBufferAttribute(aB, 4));
  bld.frustumCulled = false;
  group.add(bld);

  const structMat = f.mat(new THREE.MeshStandardMaterial({ color: "#474b53", metalness: 0.6, roughness: 0.45, envMap: env }));
  structMat.depthWrite = true;
  const crownMat = f.mat(new THREE.MeshStandardMaterial({ color: "#20242c", metalness: 0.85, roughness: 0.25, envMap: env, emissive: "#ffd7a8", emissiveIntensity: 0.07, side: THREE.DoubleSide }));
  crownMat.depthWrite = true;
  if (crownGeos.length) group.add(new THREE.Mesh(mergeGeometries(crownGeos)!, crownMat));

  /* ---------------- bridges + embankments */
  const bridgeLamps: number[][] = [];
  const cablePos: number[] = [];
  {
    const zc = (RZ0 + RZ1) / 2,
      len = RZ1 - RZ0 + 5;
    for (const bx of BRIDGES) {
      spireGeos.push(new THREE.BoxGeometry(AVE * 2 + 1.2, 0.8, len).translate(bx, -0.39, zc));
      for (const s of [-1, 1]) {
        spireGeos.push(new THREE.BoxGeometry(0.25, 0.5, len).translate(bx + s * (AVE + 0.5), 0.25, zc));
        for (let z = RZ0 - 1; z <= RZ1 + 1; z += 2.4) bridgeLamps.push([bx + s * (AVE + 0.5), 0.9, z]);
      }
      if (bx === 0) {
        // cable-stayed: twin pylons with a cross beam and lit fan of cables
        for (const s of [-1, 1]) spireGeos.push(new THREE.BoxGeometry(0.7, 20, 0.9).translate(bx + s * (AVE + 0.9), 10, zc));
        spireGeos.push(new THREE.BoxGeometry(AVE * 2 + 2.5, 0.8, 0.9).translate(bx, 12, zc));
        for (const s of [-1, 1]) {
          bridgeLamps.push([bx + s * (AVE + 0.9), 20.3, zc]);
          for (let k = 1; k <= 7; k++)
            for (const dz of [-1, 1]) cablePos.push(bx + s * (AVE + 0.9), 19.5 - k * 0.55, zc, bx + s * (AVE + 0.5), 0.5, zc + dz * k * 2.0);
        }
      } else {
        // steel arch
        const pts: THREE.Vector3[] = [];
        for (let k = 0; k <= 24; k++) {
          const u = k / 24;
          pts.push(new THREE.Vector3(0, Math.sin(u * Math.PI) * 7, RZ0 - 0.5 + u * (RZ1 - RZ0 + 1)));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        for (const s of [-1, 1]) {
          spireGeos.push(new THREE.TubeGeometry(curve, 40, 0.28, 6).translate(bx + s * (AVE + 0.5), 0, 0));
          for (let k = 1; k < 12; k++) {
            const p = curve.getPoint(k / 12);
            cablePos.push(bx + s * (AVE + 0.5), p.y, p.z, bx + s * (AVE + 0.5), 0.4, p.z);
          }
        }
      }
    }
    for (const z of [RZ0, RZ1]) spireGeos.push(new THREE.BoxGeometry(1300, 0.8, 0.5).translate(0, -0.4, z + (z === RZ0 ? -0.25 : 0.25)));
  }
  if (spireGeos.length) {
    const s = new THREE.Mesh(mergeGeometries(spireGeos.map((g) => (g.index ? g.toNonIndexed() : g)))!, structMat);
    group.add(s);
  }
  {
    const cg = new THREE.BufferGeometry();
    cg.setAttribute("position", new THREE.Float32BufferAttribute(cablePos, 3));
    const cm = f.mat(new THREE.LineBasicMaterial({ color: "#ffe2bd", blending: THREE.AdditiveBlending, depthWrite: false }), 0.45);
    group.add(new THREE.LineSegments(cg, cm));
  }

  /* ---------------- helipad */
  const padTop = PAD_Y + 0.3;
  {
    const padTex = canvasTex(256, 256, (g) => {
      g.fillStyle = "#34373d";
      g.fillRect(0, 0, 256, 256);
      g.strokeStyle = "#f2f2f2";
      g.lineWidth = 10;
      g.beginPath();
      g.arc(128, 128, 118, 0, Math.PI * 2);
      g.stroke();
      g.strokeStyle = "#f5c518";
      g.lineWidth = 7;
      g.beginPath();
      g.arc(128, 128, 84, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = "#f2f2f2";
      g.fillRect(92, 76, 18, 104);
      g.fillRect(146, 76, 18, 104);
      g.fillRect(110, 119, 36, 18);
    });
    const padMat = f.mat(new THREE.MeshStandardMaterial({ map: padTex, emissiveMap: padTex, emissive: "#ffffff", emissiveIntensity: 0.28, roughness: 0.7 }));
    padMat.depthWrite = true;
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(3.7, 3.9, 0.3, 40), padMat);
    pad.position.set(TOWER.x, PAD_Y + 0.15, TOWER.z);
    pad.rotation.y = Math.PI / 2;
    group.add(pad);
    const padLight = f.light(new THREE.PointLight("#fff1dc", 40, 22, 1.6));
    padLight.position.set(TOWER.x, padTop + 5, TOWER.z);
    group.add(padLight);
  }

  /* ---------------- static lights: street lamps, bridge lamps, promenade, beacons */
  {
    const L: number[][] = []; // x,y,z,type
    const lampStep = lite ? 16 : 8;
    const zMin = P * JZ0,
      zMax = P * (JZ1 + 1);
    const inRiver = (z: number) => z > RZ0 - 0.3 && z < RZ1 + 0.3;
    for (let i = IX0; i <= IX1 + 1; i++)
      for (const s of [-1, 1])
        for (let z = zMin + 4; z < zMax; z += lampStep) if (!inRiver(z)) L.push([P * i + s * 3.1, 2.3, z, Math.abs(i) % 4 === 0 ? 1 : 0]);
    for (let j = JZ0; j <= JZ1 + 1; j++) {
      if (P * j === RIVER_ST) continue;
      for (const s of [-1, 1]) for (let x = P * IX0 + 4; x < P * (IX1 + 1); x += lampStep) L.push([x, 2.3, P * j + s * 2.3, 0]);
    }
    for (const z of [RZ0 - 0.4, RZ1 + 0.4]) for (let x = P * IX0; x < P * (IX1 + 1); x += 4) L.push([x, 1.6, z, 2]);
    for (const b of bridgeLamps) L.push([b[0], b[1], b[2], 3]);
    const g = glowPoints(f, shared, L.length, (i, pos, col, size, _d, blink) => {
      const [x, y, z, t] = L[i];
      pos.set([x, y, z], i * 3);
      const c = t === 1 ? [0.95, 0.93, 0.88] : t === 3 ? [1.0, 0.85, 0.62] : [1.0, 0.58, 0.24];
      const k = t === 2 ? 0.9 : 1.25;
      col.set([c[0] * k, c[1] * k, c[2] * k], i * 3);
      size[i] = t === 2 ? 0.8 : 1.05;
      blink.set([0, 0], i * 2);
    });
    group.add(g.pts);

    const bc = glowPoints(f, shared, beaconPts.length, (i, pos, col, size, _d, blink) => {
      const [x, y, z, big] = beaconPts[i];
      pos.set([x, y, z], i * 3);
      col.set([2.4, 0.08, 0.03], i * 3);
      size[i] = big ? 2.0 : 1.4;
      blink.set([Math.floor(rng() * 2) * 1.6, 1], i * 2);
    });
    group.add(bc.pts);

    // helipad perimeter lights (green) + floodlight glints
    const pl = glowPoints(f, shared, 20, (i, pos, col, size, _d, blink) => {
      const a = (i / 16) * Math.PI * 2;
      if (i < 16) {
        pos.set([TOWER.x + Math.cos(a) * 3.95, padTop + 0.05, TOWER.z + Math.sin(a) * 3.95], i * 3);
        col.set([0.15, 1.6, 0.45], i * 3);
        size[i] = 0.55;
        blink.set([0, 0], i * 2);
      } else {
        const k = i - 16;
        pos.set([TOWER.x + (k & 1 ? 3.8 : -3.8), padTop + 0.4, TOWER.z + (k & 2 ? 3.8 : -3.8)], i * 3);
        col.set([1.6, 1.5, 1.3], i * 3);
        size[i] = 0.9;
        blink.set([0, 0], i * 2);
      }
    });
    group.add(pl.pts);
  }

  /* ---------------- traffic */
  type Lane = { ax: 0 | 1; c: number; dir: 1 | -1; a: number; b: number; cars: number[]; idx: number; fade: boolean };
  const lanes: Lane[] = [];
  const zA = P * JZ0 + 8,
    zB = 64;
  for (let i = IX0; i <= IX1 + 1; i++) {
    const x = P * i;
    const main = BRIDGES.includes(x);
    const offs = main ? [0.65, 1.9] : [1.1];
    const segs: [number, number, boolean][] = main ? [[zA, zB, false]] : [
      [zA, RZ0 - 0.5, true],
      [RZ1 + 0.5, zB, true],
    ];
    for (const [a, b, fade] of segs)
      for (const o of offs) {
        lanes.push({ ax: 0, c: x + o, dir: -1, a, b, cars: [], idx: i, fade });
        lanes.push({ ax: 0, c: x - o, dir: 1, a, b, cars: [], idx: i, fade });
      }
  }
  for (let j = JZ0 + 1; j <= JZ1 + 1; j++) {
    const z = P * j;
    if (z === RIVER_ST) continue;
    lanes.push({ ax: 1, c: z + 0.9, dir: 1, a: -150, b: 150, cars: [], idx: j, fade: false });
    lanes.push({ ax: 1, c: z - 0.9, dir: -1, a: -150, b: 150, cars: [], idx: j, fade: false });
  }
  const target = lite ? 380 : 820;
  const weight = (l: Lane) => (l.b - l.a) * (l.ax === 0 ? (BRIDGES.includes(P * l.idx) ? 5 : 1) : 0.75) * (l.ax === 1 && (l.c < -230 || l.c > 60) ? 0.4 : 1);
  const W = lanes.reduce((s, l) => s + weight(l), 0);
  const cs: number[] = [],
    cv: number[] = [],
    cmax: number[] = [],
    clen: number[] = [],
    clane: number[] = [];
  const carCols = ["#0d0e10", "#e8e8e6", "#9aa0a6", "#4a4f55", "#1b2a44", "#7a1116", "#c9c2b4", "#101820", "#b8b8b8", "#d9a400"];
  const colIdx: number[] = [];
  for (let li = 0; li < lanes.length; li++) {
    const l = lanes[li];
    const L = l.b - l.a;
    const n = Math.max(1, Math.round((target * weight(l)) / W));
    for (let k = 0; k < n; k++) {
      const id = cs.length;
      const bus = l.ax === 0 && BRIDGES.includes(P * l.idx) && rng() < 0.06;
      cs.push(((k + R(0, 0.5)) / n) * L);
      cmax.push(bus ? R(3.6, 4.4) : R(4.8, 7.2));
      cv.push(cmax[id] * 0.6);
      clen.push(bus ? 3.4 : R(1.05, 1.35));
      clane.push(li);
      colIdx.push(bus ? -1 : rng() < 0.05 ? 9 : Math.floor(rng() * 9));
      l.cars.push(id);
    }
  }
  const NC = cs.length;
  const carGeo = mergeGeometries([new THREE.BoxGeometry(1, 0.42, 1).translate(0, 0.3, 0), new THREE.BoxGeometry(0.86, 0.3, 0.55).translate(0, 0.62, -0.05)])!;
  const carMat = f.mat(new THREE.MeshStandardMaterial({ color: "#ffffff", metalness: 0.6, roughness: 0.32, envMap: env, envMapIntensity: 1.3 }));
  carMat.depthWrite = true;
  const cars = new THREE.InstancedMesh(carGeo, carMat, NC);
  cars.frustumCulled = false;
  const cc = new THREE.Color();
  for (let i = 0; i < NC; i++) {
    cars.setColorAt(i, colIdx[i] < 0 ? cc.set(rng() < 0.5 ? "#b3261e" : "#1f5f9e") : cc.set(carCols[colIdx[i]]));
  }
  group.add(cars);
  const brake = new Uint8Array(NC);
  const carLights = glowPoints(f, shared, NC * 2, (i, _pos, col, size, dir, blink) => {
    const c = i >> 1,
      head = (i & 1) === 0;
    const l = lanes[clane[c]];
    const fx = l.ax === 1 ? l.dir : 0,
      fz = l.ax === 0 ? l.dir : 0;
    if (head) {
      col.set([1.35, 1.3, 1.15], i * 3);
      size[i] = clen[c] > 3 ? 1.1 : 0.95;
      dir.set([fx, -0.25, fz, 1], i * 4);
    } else {
      col.set([1.5, 0.04, 0.02], i * 3);
      size[i] = 0.8;
      dir.set([-fx, -0.1, -fz, 0.85], i * 4);
    }
    blink.set([0, 0], i * 2);
  });
  group.add(carLights.pts);
  const carM = cars.instanceMatrix.array as Float32Array;
  const lightPos = carLights.pos;
  const lightCol = carLights.col;

  const stopDist = (l: Lane, pos: number, t: number) => {
    // distance to the next stop line on this lane and whether it's red; Infinity when none
    if (l.ax === 0) {
      const off = ST + 0.6;
      const j = l.dir < 0 ? Math.floor((pos - off) / P) : Math.ceil((pos + off) / P);
      const zs = j * P;
      if (zs === RIVER_ST || j < JZ0 + 1 || j > JZ1 + 1) return Infinity;
      const ph = (t + j * 1.7 + l.idx * 0.9 + 400) % 20;
      if (ph < 9) return Infinity;
      return l.dir < 0 ? pos - (zs + off) : zs - off - pos;
    } else {
      const off = AVE + 0.7;
      const i = l.dir < 0 ? Math.floor((pos - off) / P) : Math.ceil((pos + off) / P);
      const xs = i * P;
      const ph = (t + l.idx * 1.7 + i * 0.9 + 400) % 20;
      if (ph >= 10 && ph < 19) return Infinity;
      return l.dir < 0 ? pos - (xs + off) : xs - off - pos;
    }
  };

  const updateTraffic = (t: number, dt: number) => {
    for (let li = 0; li < lanes.length; li++) {
      const l = lanes[li];
      const ids = l.cars,
        n = ids.length,
        L = l.b - l.a;
      for (let k = 0; k < n; k++) {
        const id = ids[k];
        let vt = cmax[id];
        if (n > 1) {
          const ld = ids[(k + 1) % n];
          let gap = cs[ld] - cs[id];
          if (gap < 0) gap += L;
          gap -= (clen[ld] + clen[id]) * 0.5;
          vt = Math.min(vt, Math.max(0, (gap - 0.8) * 1.5));
        }
        const pos = l.dir > 0 ? l.a + cs[id] : l.b - cs[id];
        const sd = stopDist(l, pos, t);
        if (sd > 0.05 && sd < 16) vt = Math.min(vt, Math.max(0, (sd - clen[id] * 0.5) * 0.9));
        const dv = vt - cv[id];
        cv[id] += dv > 0 ? Math.min(dv, 3.2 * dt) : Math.max(dv, -10 * dt);
        const br = dv < -0.4 || cv[id] < 0.4 ? 1 : 0;
        if (br !== brake[id]) {
          brake[id] = br;
          const o = (id * 2 + 1) * 3;
          lightCol[o] = br ? 3.2 : 1.5;
          lightCol[o + 1] = br ? 0.1 : 0.04;
          carLights.geo.attributes.color.needsUpdate = true;
        }
      }
      for (let k = 0; k < n; k++) {
        const id = ids[k];
        cs[id] += cv[id] * dt;
        if (cs[id] >= L) cs[id] -= L;
        const s = cs[id];
        const along = l.dir > 0 ? l.a + s : l.b - s;
        const x = l.ax === 0 ? l.c : along,
          z = l.ax === 0 ? along : l.c;
        const fx = l.ax === 1 ? l.dir : 0,
          fz = l.ax === 0 ? l.dir : 0;
        const len = clen[id],
          bus = len > 3;
        const sy = bus ? 1.9 : 1,
          sx = bus ? 0.7 : 0.55;
        // yaw rotation: columns = right (fz, 0, -fx), up, forward (fx, 0, fz)
        const o = id * 16;
        carM[o] = fz * sx;
        carM[o + 1] = 0;
        carM[o + 2] = -fx * sx;
        carM[o + 4] = 0;
        carM[o + 5] = sy;
        carM[o + 6] = 0;
        carM[o + 8] = fx * len;
        carM[o + 9] = 0;
        carM[o + 10] = fz * len;
        carM[o + 12] = x;
        carM[o + 13] = 0;
        carM[o + 14] = z;
        carM[o + 15] = 1;
        let vis = 1;
        if (l.fade) vis = Math.min(1, s / 4, (L - s) / 4);
        const h = id * 6;
        const hl = len * 0.5 + 0.05;
        lightPos[h] = x + fx * hl;
        lightPos[h + 1] = vis > 0.5 ? 0.32 : -50;
        lightPos[h + 2] = z + fz * hl;
        lightPos[h + 3] = x - fx * hl;
        lightPos[h + 4] = vis > 0.5 ? (bus ? 0.5 : 0.36) : -50;
        lightPos[h + 5] = z - fz * hl;
        if (vis <= 0.5) carM[o + 13] = -50;
      }
    }
    cars.instanceMatrix.needsUpdate = true;
    carLights.geo.attributes.position.needsUpdate = true;
  };
  // init matrices
  for (let i = 0; i < NC; i++) carM.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -50, 0, 1], i * 16);

  /* ---------------- helicopters */
  const heli = buildHeli(f, env, shared, "#e9ebee", "#b1141b");
  const cop = buildHeli(f, env, shared, "#1d2a44", "#e9ebee");
  group.add(heli.root, cop.root);
  const beam1 = beamMesh(f, uFade),
    beam2 = beamMesh(f, uFade);
  group.add(beam1.mesh, beam2.mesh);

  const restY = padTop + 1.42 * HS;
  const circ = (a: number, r: number, y: number) => new THREE.Vector3(TOWER.x + Math.cos(a) * r, y, TOWER.z + Math.sin(a) * r);
  const pathIn = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(130, 72, -190),
      new THREE.Vector3(80, 62, -120),
      new THREE.Vector3(34, 54, -62),
      circ(-0.6, 22, 49),
      circ(0.35, 22, 47),
      circ(1.25, 21, 45.5),
      circ(2.15, 19, 44.5),
      circ(3.05, 16, 43.5),
      circ(3.9, 9, restY + 9),
      new THREE.Vector3(TOWER.x, restY + 7, TOWER.z),
    ],
    false,
    "centripetal"
  );
  const endTan = pathIn.getTangentAt(1);
  const yawLand = Math.atan2(endTan.x, endTan.z) + 0.5;
  const fwd = new THREE.Vector3(Math.sin(yawLand), 0, Math.cos(yawLand));
  const liftTop = new THREE.Vector3(TOWER.x, restY + 9, TOWER.z);
  const pathOut = new THREE.CatmullRomCurve3(
    [
      liftTop.clone(),
      liftTop.clone().addScaledVector(fwd, 12).add(new THREE.Vector3(0, 3, 0)),
      new THREE.Vector3(50, 58, -30),
      new THREE.Vector3(110, 70, -120),
      new THREE.Vector3(170, 82, -220),
    ],
    false,
    "centripetal"
  );
  const TA = 26,
    TB = 6,
    TC = 8,
    TD = 5,
    TE = 16;
  const TOTAL = TA + TB + TC + TD + TE;
  const ease = (x: number) => x * x * (3 - 2 * x);
  const hp = new THREE.Vector3();
  const tmpV = new THREE.Vector3();
  const down = new THREE.Vector3(0, -1, 0);
  const q = new THREE.Quaternion();

  const placeBeam = (b: { mesh: THREE.Mesh; uI: { value: number } }, from: THREE.Vector3, dir: THREE.Vector3, inten: number, spot: THREE.Vector4) => {
    b.uI.value = inten;
    b.mesh.visible = inten > 0.01;
    const len = dir.y < -0.05 ? Math.min(90, from.y / -dir.y) : 60;
    const rad = len * 0.12;
    b.mesh.position.copy(from);
    q.setFromUnitVectors(down, dir);
    b.mesh.quaternion.copy(q);
    b.mesh.scale.set(rad, len, rad);
    spot.set(from.x + dir.x * len, from.z + dir.z * len, rad * 1.25, inten * (dir.y < -0.05 ? 1 : 0));
  };

  const angDiff = (a: number, b: number) => {
    let d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  };
  const orient = (h: Heli, dt: number, pedal: number | null) => {
    // derive heading / pitch / bank from the smoothed velocity
    if (dt > 0) {
      tmpV.copy(h.root.position).sub(h.prev).divideScalar(dt);
      const prevSpeed = Math.hypot(h.vel.x, h.vel.z);
      h.vel.lerp(tmpV, Math.min(1, dt * 3));
      const sp = Math.hypot(h.vel.x, h.vel.z);
      let yawRate = 0;
      if (pedal !== null) {
        const d = angDiff(pedal, h.yaw);
        h.yaw += d * Math.min(1, dt * 1.2);
      } else if (sp > 1.2) {
        const ty = Math.atan2(h.vel.x, h.vel.z);
        const d = angDiff(ty, h.yaw);
        yawRate = d * Math.min(1, dt * 2.5);
        h.yaw += yawRate;
        yawRate /= dt;
      }
      const acc = (sp - prevSpeed) / dt;
      const tp = THREE.MathUtils.clamp(sp * 0.018 + acc * 0.03, -0.22, 0.32);
      const tr = THREE.MathUtils.clamp(-yawRate * sp * 0.05, -0.45, 0.45);
      h.pitch += (tp - h.pitch) * Math.min(1, dt * 2);
      h.roll += (tr - h.roll) * Math.min(1, dt * 2);
    }
    h.prev.copy(h.root.position);
    h.root.rotation.set(h.pitch, h.yaw, h.roll);
  };

  let beamK1 = 0;
  const updateHeli = (tt: number, dt: number) => {
    let c = tt % TOTAL;
    let rotorSpeed = 24,
      beamT = 0,
      pedal: number | null = null,
      landOn = 0;
    if (c < TA) {
      const s = c / TA;
      hp.copy(pathIn.getPointAt(1 - (1 - s) * (1 - s)));
      beamT = s > 0.25 ? 1 : 0;
      landOn = 1;
    } else if ((c -= TA) < TB) {
      const s = ease(c / TB);
      hp.set(TOWER.x, restY + 7 * (1 - s), TOWER.z);
      pedal = yawLand;
      landOn = 1;
    } else if ((c -= TB) < TC) {
      hp.set(TOWER.x, restY, TOWER.z);
      pedal = yawLand;
      rotorSpeed = 15;
    } else if ((c -= TC) < TD) {
      const s = ease(c / TD);
      hp.set(TOWER.x, restY + 9 * s, TOWER.z);
      pedal = yawLand;
      landOn = 1;
    } else {
      c -= TD;
      const s = c / TE;
      hp.copy(pathOut.getPointAt(s * s));
      beamT = s < 0.6 ? 1 : 0;
      landOn = s < 0.4 ? 1 : 0;
    }
    const jump = hp.distanceTo(heli.root.position) > 20;
    heli.root.position.copy(hp);
    if (jump) {
      heli.prev.copy(hp);
      heli.vel.set(0, 0, 0);
    }
    orient(heli, jump ? 0 : dt, pedal);
    heli.rotor.rotation.y += dt * rotorSpeed;
    heli.tail.rotation.x += dt * rotorSpeed * 3.3;
    const lc = heli.lights.col,
      li = heli.landIdx * 3;
    const lk = landOn ? 1 : 0;
    if (Math.abs(lc[li] - 3.0 * lk) > 0.01) {
      lc[li] = 3.0 * lk;
      lc[li + 1] = 2.9 * lk;
      lc[li + 2] = 2.6 * lk;
      heli.lights.geo.attributes.color.needsUpdate = true;
    }
    beamK1 += (beamT - beamK1) * Math.min(1, dt * 1.5);
    // searchlight: from the nose, forward and down
    tmpV.set(0, -0.95, 2.0).multiplyScalar(HS).applyEuler(heli.root.rotation).add(heli.root.position);
    const bd = new THREE.Vector3(Math.sin(heli.yaw) * 0.55, -1, Math.cos(heli.yaw) * 0.55).normalize();
    placeBeam(beam1, tmpV, bd, beamK1, uSpot.value[0]);
  };

  const copC = new THREE.Vector3(24, 44, -165);
  const updateCop = (tt: number, dt: number) => {
    const a = tt * 0.075;
    cop.root.position.set(copC.x + Math.cos(a) * 46, copC.y + Math.sin(tt * 0.13) * 3, copC.z + Math.sin(a) * 34);
    orient(cop, dt, null);
    cop.rotor.rotation.y += dt * 24;
    cop.tail.rotation.x += dt * 80;
    tmpV.set(0, -1.0, 1.8).multiplyScalar(HS).applyEuler(cop.root.rotation).add(cop.root.position);
    // sweep the beam across the streets below
    const tx = cop.root.position.x + Math.sin(tt * 0.31) * 16 - Math.cos(a) * 14;
    const tz = cop.root.position.z + Math.cos(tt * 0.23) * 14 - Math.sin(a) * 10;
    const bd = new THREE.Vector3(tx - tmpV.x, -tmpV.y, tz - tmpV.z).normalize();
    placeBeam(beam2, tmpV, bd, 1, uSpot.value[1]);
  };

  /* ---------------- lights */
  group.add(f.light(new THREE.HemisphereLight("#2f3552", "#4a3020", 0.75)));
  const moonL = f.light(new THREE.DirectionalLight("#b4bedc", 0.4));
  moonL.position.set(-60, 90, -40);
  group.add(moonL);
  const glowL = f.light(new THREE.DirectionalLight("#ff9a55", 0.25));
  glowL.position.set(20, -10, 60);
  group.add(glowL);

  /* ---------------- camera: slow drone orbit around the helipad tower, looking down the avenue */
  const view = (t: number, pos: THREE.Vector3, look: THREE.Vector3) => {
    const tt = t + T0;
    const a = -0.1 + Math.sin(tt * 0.028) * 0.2;
    const R0 = 57 + Math.sin(tt * 0.021) * 4;
    pos.set(TOWER.x + Math.sin(a) * R0 + 4, 47 + Math.sin(tt * 0.043) * 2.5, TOWER.z + Math.cos(a) * R0);
    look.set(TOWER.x - Math.sin(a) * 42 + 10, 20, TOWER.z - Math.cos(a) * 42);
  };

  return {
    group,
    fade: f,
    bg: fogColor.clone(),
    fog: fogColor.clone(),
    fogDensity: 0.0046,
    view,
    update: (t, dt) => {
      const tt = t + T0;
      uTime.value = tt;
      uScale.value = (window.innerHeight * Math.min(window.devicePixelRatio || 1, lite ? 1 : 1.35)) / 2;
      updateTraffic(tt, dt);
      updateHeli(tt, dt);
      updateCop(tt, dt);
    },
  };
}
