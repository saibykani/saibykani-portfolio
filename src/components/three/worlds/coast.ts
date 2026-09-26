import * as THREE from "three";
import { desertExtras } from "./extra";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { canvasTex, Ctx, Fader, fbm2, glowTex, rand, World } from "./common";

/* Realistic sunset worlds: Desert Dunes + Tropical Coast.
 * Everything custom-shaded shares one GLSL "atmosphere" (sky gradient + sun glow) so terrain / water
 * fog fades into exactly the sky colour behind it. Shader colours are authored in display space. */

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type SkyOpts = {
  sunDir: THREE.Vector3;
  zen: string;
  mid: string;
  hor: string; // horizon toward the sun
  hor2: string; // horizon away from the sun
  glow: string;
  sunCol: string;
  fogD: number;
};

function shared(o: SkyOpts, uFade: { value: number }) {
  return {
    uSunDir: { value: o.sunDir.clone().normalize() },
    uZen: { value: new THREE.Color(o.zen) },
    uMid: { value: new THREE.Color(o.mid) },
    uHor: { value: new THREE.Color(o.hor) },
    uHor2: { value: new THREE.Color(o.hor2) },
    uGlow: { value: new THREE.Color(o.glow) },
    uSunCol: { value: new THREE.Color(o.sunCol) },
    uFogD: { value: o.fogD },
    uTime: { value: 0 },
    uFade,
  } as Record<string, THREE.IUniform>;
}

const HEAD = /* glsl */ `
uniform vec3 uSunDir; uniform vec3 uZen; uniform vec3 uMid; uniform vec3 uHor; uniform vec3 uHor2; uniform vec3 uGlow; uniform vec3 uSunCol;
uniform float uFogD; uniform float uTime; uniform float uFade;
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash12(i), hash12(i+vec2(1.0,0.0)), u.x), mix(hash12(i+vec2(0.0,1.0)), hash12(i+vec2(1.0,1.0)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++){ v += a*vnoise(p); p = p*2.03 + 17.1; a *= 0.5; } return v; }
vec3 skyCol(vec3 d){
  float h = max(d.y, 0.0);
  float mu = max(dot(d, uSunDir), 0.0);
  vec2 dh = normalize(d.xz + vec2(1e-5)); vec2 sh = normalize(uSunDir.xz);
  float az = dot(dh, sh) * 0.5 + 0.5;
  vec3 hor = mix(uHor2, uHor, az * az);
  vec3 c = mix(hor, uMid, smoothstep(0.0, 0.2, h));
  c = mix(c, uZen, smoothstep(0.12, 0.72, h));
  c += uGlow * (pow(mu, 5.0) * 0.5 * exp(-h * 7.0) + pow(mu, 28.0) * 0.45 + pow(mu, 380.0) * 1.1);
  return c;
}
vec3 applyFog(vec3 col, vec3 w){
  vec3 v = w - cameraPosition; float d = length(v); vec3 dir = v / d;
  float f = 1.0 - exp(-uFogD * uFogD * d * d);
  vec3 fc = skyCol(normalize(vec3(dir.x, max(dir.y, 0.0) * 0.4 + 0.004, dir.z)));
  return mix(col, fc, f);
}
`;

const VS_WORLD = /* glsl */ `
varying vec3 vW; varying vec3 vN;
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;

function smat(f: Fader, U: Record<string, THREE.IUniform>, extra: Record<string, THREE.IUniform>, vs: string, fs: string, opts: THREE.ShaderMaterialParameters = {}) {
  const m = new THREE.ShaderMaterial({ uniforms: { ...U, ...extra }, vertexShader: HEAD + vs, fragmentShader: HEAD + fs, ...opts });
  f.mat(m);
  m.depthWrite = opts.depthWrite ?? true;
  return m;
}

/* Sky dome: gradient, huge low sun, clouds lit from below, optional faint first stars. */
function skyDome(f: Fader, U: Record<string, THREE.IUniform>, o: { cloud: number; stars: number; cloudLit: string; cloudDark: string; sunR: number; streak: number }) {
  const m = smat(
    f,
    U,
    {
      uCloud: { value: o.cloud },
      uStars: { value: o.stars },
      uCloudLit: { value: new THREE.Color(o.cloudLit) },
      uCloudDark: { value: new THREE.Color(o.cloudDark) },
      uSunR: { value: o.sunR },
      uStreak: { value: o.streak },
    },
    `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    `uniform float uCloud, uStars, uSunR, uStreak; uniform vec3 uCloudLit, uCloudDark; varying vec3 vW;
    void main(){
      vec3 d = normalize(vW - cameraPosition);
      vec3 c = skyCol(d);
      float mu = dot(d, uSunDir);
      // sun disc: large, low, redder near the horizon, soft limb
      float disc = smoothstep(cos(uSunR * 1.06), cos(uSunR), mu);
      vec3 sunC = mix(vec3(1.0, 0.55, 0.28), vec3(1.25, 1.0, 0.78), smoothstep(-0.01, 0.12, d.y));
      c = mix(c, sunC * 1.25, disc);
      // faint first stars away from the sun
      if (uStars > 0.0) {
        vec2 sp = d.xz / (d.y + 1.0) * 260.0;
        vec2 cell = floor(sp); float h = hash12(cell);
        float st = step(0.985, h) * smoothstep(0.35, 0.0, length(fract(sp) - 0.5 - (hash12(cell + 7.0) - 0.5) * 0.4));
        float tw = 0.65 + 0.35 * sin(uTime * (1.5 + h * 3.0) + h * 40.0);
        c += vec3(0.9, 0.92, 1.0) * st * tw * uStars * smoothstep(0.22, 0.7, d.y) * (1.0 - max(mu, 0.0));
      }
      // clouds on a virtual plane, lit from below by the low sun
      if (uCloud > 0.0 && d.y > 0.0) {
        vec2 cp = d.xz / (d.y + 0.06) * 1.4 + vec2(uTime * 0.004, uTime * 0.0015);
        float n = fbm(cp * vec2(0.45 * uStreak, 1.5) + vec2(3.0, 1.0));
        n += (vnoise(cp * vec2(2.2, 6.0)) - 0.5) * 0.12;
        float th = 1.0 - uCloud;
        float dens = smoothstep(th, th + 0.22, n);
        float thick = smoothstep(th + 0.05, th + 0.45, n);
        vec2 dh = normalize(d.xz); vec2 sh = normalize(uSunDir.xz);
        float warm = pow(max(dot(dh, sh), 0.0), 2.0);
        vec3 cc = mix(uCloudLit, uCloudDark, clamp(thick * 0.75 + (1.0 - warm) * 0.55 + smoothstep(0.05, 0.5, d.y) * 0.35, 0.0, 1.0));
        cc += uGlow * pow(max(mu, 0.0), 7.0) * (1.0 - thick) * 0.9;
        cc = mix(cc, uCloudLit * 1.15, (1.0 - smoothstep(0.02, 0.22, d.y)) * 0.45 * warm);
        c = mix(c, cc, dens * smoothstep(0.0, 0.045, d.y) * 0.96);
      }
      gl_FragColor = vec4(c, uFade);
    }`,
    { side: THREE.BackSide, depthWrite: false, fog: false }
  );
  const s = new THREE.Mesh(new THREE.SphereGeometry(520, 48, 24), m);
  s.renderOrder = -10;
  s.frustumCulled = false;
  return s;
}

/* Non-uniform terrain grid: rows packed densely near the camera, width grows with distance. */
function gridGeo(nx: number, nz: number, zNear: number, zFar: number, halfW: (z: number) => number, h: (x: number, z: number) => number, pw = 2) {
  const pos = new Float32Array((nx + 1) * (nz + 1) * 3);
  let k = 0;
  for (let j = 0; j <= nz; j++) {
    const z = zNear + (zFar - zNear) * Math.pow(j / nz, pw);
    const hw = halfW(z);
    for (let i = 0; i <= nx; i++) {
      const x = ((i / nx) * 2 - 1) * hw;
      pos[k++] = x;
      pos[k++] = h(x, z);
      pos[k++] = z;
    }
  }
  const idx = new Uint32Array(nx * nz * 6);
  k = 0;
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i,
        b = a + 1,
        c = a + nx + 1,
        d = c + 1;
      idx[k++] = a;
      idx[k++] = b;
      idx[k++] = c;
      idx[k++] = b;
      idx[k++] = d;
      idx[k++] = c;
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return g;
}

/* ============================== DESERT DUNES ============================== */
export function desert(ctx: Ctx): World {
  const lite = ctx.lite;
  const group = new THREE.Group();
  const f = new Fader();
  const uFade = f.uniform({ value: 0 });
  const SUN = new THREE.Vector3(-0.6, 0.062, -0.77).normalize();
  const U = shared({ sunDir: SUN, zen: "#241f52", mid: "#8a4f86", hor: "#ffa24e", hor2: "#c9717a", glow: "#ff9a45", sunCol: "#ffb36b", fogD: 0.0031 }, uFade);

  group.add(skyDome(f, U, { cloud: 0.3, stars: 0.55, cloudLit: "#ffb07a", cloudDark: "#6d4a78", sunR: 0.034, streak: 0.6 }));

  // ---- dune field ----
  const WX = 0.9708,
    WZ = -0.2402; // wind direction (xz)
  const roadZ = (x: number) => -46 + 6 * Math.sin(x * 0.012 + 1);
  const ridgeZ = (x: number) => -112 + 8 * Math.sin(x * 0.016 + 0.5) + 3 * Math.sin(x * 0.043);
  const ridgeH = (x: number) => 9 + 8 * (0.5 + 0.5 * Math.sin(x * 0.019 + 1.3));
  const duneH = (x: number, z: number) => {
    const warp = fbm2(x * 0.006 + 5, z * 0.009, 3) * 3.4 + fbm2(x * 0.025, z * 0.025 + 9, 2) * 0.7;
    const u = (x * WX + z * WZ) / 26 + warp;
    const fr = u - Math.floor(u);
    const c = 0.72;
    let p = fr < c ? Math.pow(fr / c, 1.35) : Math.pow(1 - (fr - c) / (1 - c), 1.8);
    p -= 0.05 * Math.exp(-(((fr - c) / 0.035) ** 2)); // slightly rounded crest (no aliasing teeth)
    const an = fbm2(x * 0.013 - 3, z * 0.013 + 1, 3);
    const dist = Math.max(0, 9 - z);
    const amp = (1.0 + an * 7.0) * (0.55 + Math.min(dist / 60, 2.2));
    let h = p * amp;
    const u2 = (x * 0.35 + z * 0.94) / 6 + warp * 1.6;
    const f2 = u2 - Math.floor(u2);
    h += Math.pow(f2 < 0.7 ? f2 / 0.7 : 1 - (f2 - 0.7) / 0.3, 1.4) * 0.06 * (0.3 + an);
    // the big draa ridge the caravan walks on (gentle far side, steep slip face toward us)
    const dz = z - ridgeZ(x);
    const bigP = dz < 0 ? Math.pow(Math.max(0, 1 + dz / 55), 1.5) : Math.pow(Math.max(0, 1 - dz / 30), 1.8);
    const env = Math.exp(-((dz / 45) ** 2));
    h = h * (1 - 0.8 * env) + bigP * ridgeH(x);
    // distant buttes / mesas on the horizon
    if (z < -300) {
      const m = fbm2(x * 0.009 + 11, z * 0.004, 3);
      const mesa = smooth(0.5, 0.56, m) * (22 + 14 * fbm2(x * 0.02, 3, 2)) * smooth(-300, -370, z);
      h = Math.max(h, mesa + h * 0.3);
    }
    // road valley
    const k = smooth(5, 20, Math.abs(z - roadZ(x)));
    return -2 + h * k;
  };

  const tGeo = gridGeo(lite ? 160 : 320, lite ? 170 : 290, 16, -480, (z) => 40 + Math.max(0, 9 - z) * 1.25, duneH, 2.1);
  const tMat = smat(
    f,
    U,
    {},
    `varying vec3 vW; varying vec3 vN;
    void main(){ vec4 w = modelMatrix * vec4(position, 1.0);
      float far = smoothstep(110.0, 260.0, length(w.xz - cameraPosition.xz));
      w.y += sin(uTime * 2.1 + w.x * 0.31 + w.z * 0.07) * 0.22 * far; // heat shimmer on the far dunes
      vW = w.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
    `varying vec3 vW; varying vec3 vN;
    void main(){
      vec3 N = normalize(vN);
      vec3 toC = cameraPosition - vW; float dist = length(toC); vec3 V = toC / dist;
      vec2 wd = vec2(0.9708, -0.2402);
      // wind ripples on windward faces only (slip faces stay smooth)
      float wind = clamp(-dot(N.xz, wd) * 5.0 + 0.35, 0.0, 1.0) * smoothstep(0.55, 0.85, N.y);
      float nearF = 1.0 - smoothstep(8.0, 40.0, dist);
      float ph = dot(vW.xz, wd) * 13.0 + vnoise(vW.xz * 0.35) * 3.0 + vnoise(vW.xz * 1.7) * 0.9;
      float r = sin(ph); float rs = r * abs(r) + 0.3 * sin(ph * 2.0);
      N = normalize(N + vec3(wd.x, 0.0, wd.y) * rs * 0.09 * wind * nearF);
      float ndl = dot(N, uSunDir);
      float grain = vnoise(vW.xz * 7.0) * 0.6 + vnoise(vW.xz * 29.0) * 0.4;
      float big = vnoise(vW.xz * 0.04 + 3.0);
      vec3 sand = mix(vec3(0.92, 0.64, 0.44), vec3(0.86, 0.56, 0.4), big);
      sand *= 0.92 + 0.14 * (grain - 0.5) * (0.3 + nearF);
      float lit = smoothstep(-0.08, 0.55, ndl);
      vec3 col = sand * uSunCol * lit * 1.6;
      vec3 skyAmb = mix(vec3(0.2, 0.24, 0.62), vec3(0.42, 0.34, 0.62), N.y * 0.5 + 0.5);
      col += sand * skyAmb * 0.85;
      // warm bounce light inside troughs
      col += vec3(0.08, 0.03, 0.02) * (1.0 - N.y) * (1.0 - lit);
      // glowing crest rim where the grazing sun catches the edge
      col += uGlow * 0.35 * pow(1.0 - max(dot(N, V), 0.0), 3.0) * lit;
      // sparkle of grains up close
      col += vec3(1.0, 0.85, 0.6) * step(0.993, hash12(floor(vW.xz * 50.0))) * nearF * lit * 0.4;
      // desert mirage: far flats reflect the sky, shimmering
      float farM = smoothstep(80.0, 200.0, dist) * (1.0 - smoothstep(300.0, 420.0, dist));
      float pool = smoothstep(0.58, 0.82, vnoise(vec2(vW.x * 0.018 + uTime * 0.03, vW.z * 0.012))) * smoothstep(0.95, 0.995, N.y);
      vec3 R = reflect(-V, vec3(0.0, 1.0, 0.0));
      col = mix(col, skyCol(normalize(R)) * (0.92 + 0.08 * sin(uTime * 7.0 + vW.x * 0.7)), farM * pool * 0.7);
      col = applyFog(col, vW);
      gl_FragColor = vec4(col, uFade);
    }`
  );
  const terrain = new THREE.Mesh(tGeo, tMat);
  terrain.frustumCulled = false;
  group.add(terrain);

  // ---- desert highway (with mirage on the far asphalt) ----
  const RN = lite ? 200 : 360;
  const rPos: number[] = [],
    rUv: number[] = [],
    rIdx: number[] = [];
  let along = 0;
  for (let i = 0; i <= RN; i++) {
    const x = -260 + (520 * i) / RN;
    const z = roadZ(x);
    const dzdx = 5 * 0.012 * Math.cos(x * 0.012 + 1);
    const l = Math.hypot(1, dzdx);
    const nx = -dzdx / l,
      nz = 1 / l;
    if (i > 0) along += 520 / RN / 1;
    for (const s of [-1, 1]) {
      rPos.push(x + nx * s * 3.8, -1.965, z + nz * s * 3.8);
      rUv.push(along * l, s * 0.5 + 0.5);
    }
    if (i < RN) {
      const a = i * 2;
      rIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute("position", new THREE.Float32BufferAttribute(rPos, 3));
  roadGeo.setAttribute("uv", new THREE.Float32BufferAttribute(rUv, 2));
  roadGeo.setIndex(rIdx);
  const roadMat = smat(
    f,
    U,
    {},
    `varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    `varying vec3 vW; varying vec2 vUv;
    void main(){
      vec3 toC = cameraPosition - vW; float dist = length(toC); vec3 V = toC / dist;
      float v = vUv.y; float u = vUv.x;
      vec3 asph = vec3(0.2, 0.17, 0.17) * (0.9 + 0.2 * vnoise(vW.xz * 3.0));
      vec3 col = asph * (vec3(0.5, 0.4, 0.5) + uSunCol * 0.45);
      float dash = step(abs(v - 0.5), 0.012) * step(fract(u / 9.0), 0.5);
      float edgeL = step(abs(v - 0.07), 0.01) + step(abs(v - 0.93), 0.01);
      col = mix(col, vec3(0.95, 0.72, 0.3), dash * 0.85);
      col = mix(col, vec3(0.85, 0.75, 0.68), edgeL * 0.7);
      // sand drifting onto the shoulders
      float drift = smoothstep(0.55, 0.8, vnoise(vec2(u * 0.12, v * 4.0)) + pow(abs(v - 0.5) * 2.0, 5.0) * 0.8);
      col = mix(col, vec3(0.9, 0.56, 0.33) * (0.55 + uSunCol * 0.5), drift);
      // highway mirage
      float m = smoothstep(30.0, 110.0, dist) * (0.75 + 0.25 * sin(uTime * 6.0 + u * 0.6));
      col = mix(col, skyCol(normalize(reflect(-V, vec3(0.0, 1.0, 0.0)))), m * 0.65 * (1.0 - drift));
      col = applyFog(col, vW);
      gl_FragColor = vec4(col, uFade);
    }`
  );
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.frustumCulled = false;
  group.add(road);

  // power line poles + sagging wires along the far shoulder
  const poleGeo = mergeGeometries([new THREE.BoxGeometry(0.22, 9, 0.22).translate(0, 4.5, 0), new THREE.BoxGeometry(0.14, 0.14, 2.2).translate(0, 8.5, 0)]);
  const poleXs: number[] = [];
  for (let x = -250; x <= 250; x += 34) poleXs.push(x);
  const poleMat = f.mat(new THREE.MeshStandardMaterial({ color: "#2a1d1a", roughness: 0.9 }));
  poleMat.depthWrite = true;
  const poles = new THREE.InstancedMesh(poleGeo, poleMat, poleXs.length);
  const m4 = new THREE.Matrix4();
  const wireP: number[] = [];
  poleXs.forEach((x, i) => {
    const z = roadZ(x) - 7.5;
    m4.makeTranslation(x, -2, z);
    poles.setMatrixAt(i, m4);
    if (i < poleXs.length - 1) {
      const x2 = poleXs[i + 1],
        z2 = roadZ(x2) - 7.5;
      for (const off of [-0.95, 0.95])
        for (let s = 0; s < 10; s++) {
          const a = s / 10,
            b = (s + 1) / 10;
          const ya = 6.5 - 4 * a * (1 - a) * 1.1,
            yb = 6.5 - 4 * b * (1 - b) * 1.1;
          wireP.push(x + (x2 - x) * a, ya, z + (z2 - z) * a + off, x + (x2 - x) * b, yb, z + (z2 - z) * b + off);
        }
    }
  });
  group.add(poles);
  const wg = new THREE.BufferGeometry();
  wg.setAttribute("position", new THREE.Float32BufferAttribute(wireP, 3));
  group.add(new THREE.LineSegments(wg, f.mat(new THREE.LineBasicMaterial({ color: "#2b1b1c" }), 0.55)));

  // vehicles
  type Veh = { x: number; v: number; lane: number; truck: boolean };
  const vehs: Veh[] = [];
  const nV = lite ? 5 : 9;
  for (let i = 0; i < nV; i++) {
    const dir = i % 2 ? 1 : -1;
    vehs.push({ x: rand(-200, 200), v: dir * rand(9, 15), lane: dir * 1.8, truck: i % 3 === 0 });
  }
  const vc = (g: THREE.BufferGeometry, c: string) => {
    const cc = new THREE.Color(c);
    const a = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < a.length; i += 3) a.set([cc.r, cc.g, cc.b], i);
    g.setAttribute("color", new THREE.BufferAttribute(a, 3));
    return g;
  };
  const carGeo = mergeGeometries([
    vc(new THREE.BoxGeometry(4.4, 0.72, 1.8).translate(0, 0.62, 0), "#ffffff"),
    vc(new THREE.BoxGeometry(2.3, 0.6, 1.62).translate(-0.25, 1.27, 0), "#c9b8d8"),
    vc(new THREE.BoxGeometry(2.1, 0.08, 1.5).translate(-0.25, 1.6, 0), "#ffffff"),
    vc(new THREE.CylinderGeometry(0.34, 0.34, 1.86, 10).rotateX(Math.PI / 2).translate(1.35, 0.34, 0), "#222222"),
    vc(new THREE.CylinderGeometry(0.34, 0.34, 1.86, 10).rotateX(Math.PI / 2).translate(-1.35, 0.34, 0), "#222222"),
  ])!;
  const truckGeo = mergeGeometries([
    vc(new THREE.BoxGeometry(2.4, 2.5, 2.4).translate(5.2, 1.55, 0), "#ffffff"),
    vc(new THREE.BoxGeometry(0.1, 0.9, 2.2).translate(6.42, 2.1, 0), "#c9b8d8"),
    vc(new THREE.BoxGeometry(10, 2.9, 2.5).translate(-1.4, 1.95, 0), "#e8e0d8"),
    vc(new THREE.BoxGeometry(12.4, 0.4, 2.2).translate(0, 0.45, 0), "#333333"),
  ])!;
  const vMat = f.mat(new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.4, metalness: 0.35 }));
  vMat.depthWrite = true;
  const cars = new THREE.InstancedMesh(carGeo, vMat, nV);
  const trucks = new THREE.InstancedMesh(truckGeo, vMat, nV);
  const carCols = ["#6a1616", "#8a8580", "#1f2a3a", "#6e6a64", "#2a2a2a", "#9a948a"];
  for (let i = 0; i < nV; i++) {
    cars.setColorAt(i, new THREE.Color(carCols[i % carCols.length]));
    trucks.setColorAt(i, new THREE.Color(i % 2 ? "#6b5a4e" : "#7a2a1a"));
  }
  cars.frustumCulled = trucks.frustumCulled = false;
  group.add(cars, trucks);
  const lightPos = new Float32Array(nV * 4 * 3);
  const lightCol = new Float32Array(nV * 4 * 3);
  for (let i = 0; i < nV; i++) {
    lightCol.set([1, 0.93, 0.78, 1, 0.93, 0.78, 1, 0.12, 0.06, 1, 0.12, 0.06], i * 12);
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.BufferAttribute(lightPos, 3));
  lg.setAttribute("color", new THREE.BufferAttribute(lightCol, 3));
  const lights = new THREE.Points(lg, f.mat(new THREE.PointsMaterial({ size: 1.9, map: glowTex(), vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false })));
  lights.frustumCulled = false;
  lights.renderOrder = 3;
  group.add(lights);
  const beamTex = canvasTex(128, 64, (g) => {
    const gr = g.createLinearGradient(0, 0, 128, 0);
    gr.addColorStop(0, "rgba(255,235,200,0.9)");
    gr.addColorStop(1, "rgba(255,235,200,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 64);
    g.globalCompositeOperation = "destination-in";
    const gv = g.createLinearGradient(0, 0, 0, 64);
    gv.addColorStop(0, "rgba(0,0,0,0)");
    gv.addColorStop(0.5, "rgba(0,0,0,1)");
    gv.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gv;
    g.fillRect(0, 0, 128, 64);
  });
  const beams = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(16, 5).rotateX(-Math.PI / 2).translate(8, 0, 0),
    f.mat(new THREE.MeshBasicMaterial({ map: beamTex, blending: THREE.AdditiveBlending, depthWrite: false, color: "#ffd9a0" }), 0.28),
    nV
  );
  beams.frustumCulled = false;
  beams.renderOrder = 2;
  group.add(beams);

  // ---- camel caravan silhouette on the big ridge ----
  const camelShape = () => {
    const s = new THREE.Shape();
    const pts: [number, number][] = [
      [-1.0, 1.35], [-0.97, 1.55], [-0.75, 1.78], [-0.4, 2.12], [-0.1, 2.24], [0.18, 2.12], [0.42, 1.86], [0.68, 1.72], [0.92, 1.56],
      [1.12, 1.6], [1.27, 1.86], [1.34, 2.06], [1.5, 2.12], [1.72, 2.02], [1.76, 1.93], [1.52, 1.87], [1.43, 1.76], [1.32, 1.5],
      [1.12, 1.3], [0.82, 1.18], [0.66, 1.03], [0.3, 0.96], [-0.3, 0.98], [-0.72, 1.04], [-0.96, 1.16],
    ];
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();
    return s;
  };
  const riderShape = () => {
    const s = new THREE.Shape();
    s.moveTo(-0.32, 2.05);
    s.lineTo(0.22, 2.05);
    s.lineTo(0.12, 2.55);
    s.lineTo(0.05, 2.62);
    s.absarc(0.0, 2.72, 0.1, -0.3, Math.PI + 0.3, false);
    s.lineTo(-0.14, 2.5);
    s.closePath();
    return s;
  };
  const buildCamel = (phase: number, rider: boolean) => {
    const shapes = [camelShape()];
    if (rider) shapes.push(riderShape());
    const body = new THREE.ShapeGeometry(shapes, 3).toNonIndexed();
    const bn = body.attributes.position.count;
    const bl = new Float32Array(bn * 4);
    for (let i = 0; i < bn; i++) bl.set([0, 0, phase, 0], i * 4);
    body.setAttribute("aLeg", new THREE.BufferAttribute(bl, 4));
    const legs: number[] = [],
      la: number[] = [];
    const legDefs: [number, number, number][] = [
      [0.58, 1.1, 0],
      [0.46, 1.1, Math.PI],
      [-0.64, 1.12, 0.35],
      [-0.78, 1.12, Math.PI + 0.35],
    ];
    for (const [hx, hy, lp] of legDefs) {
      const w0 = 0.085,
        w1 = 0.05;
      const q = [
        [hx - w0, hy + 0.08],
        [hx + w0, hy + 0.08],
        [hx + w1, 0],
        [hx - w1, 0],
      ];
      for (const t of [0, 1, 2, 0, 2, 3]) {
        legs.push(q[t][0], q[t][1], 0);
        la.push(hx, hy, phase + lp, 1);
      }
    }
    const lgm = new THREE.BufferGeometry();
    lgm.setAttribute("position", new THREE.Float32BufferAttribute(legs, 3));
    lgm.setAttribute("normal", new THREE.Float32BufferAttribute(new Array(legs.length).fill(0).map((_, i) => (i % 3 === 2 ? 1 : 0)), 3));
    lgm.setAttribute("uv", new THREE.Float32BufferAttribute(new Array((legs.length / 3) * 2).fill(0), 2));
    lgm.setAttribute("aLeg", new THREE.Float32BufferAttribute(la, 4));
    return mergeGeometries([body, lgm])!;
  };
  const camelMat = smat(
    f,
    U,
    {},
    `attribute vec4 aLeg; varying vec3 vW;
    void main(){ vec3 p = position; float t = uTime * 2.1;
      if (aLeg.w > 0.5) { float a = sin(t + aLeg.z) * 0.33; vec2 r = p.xy - aLeg.xy; float c = cos(a), s = sin(a); p.xy = aLeg.xy + vec2(c * r.x - s * r.y, s * r.x + c * r.y); }
      else { p.y += sin(t * 2.0 + aLeg.z) * 0.025; if (p.x > 0.8) p.y += sin(t + aLeg.z + 1.0) * 0.06 * (p.x - 0.8); }
      vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    `varying vec3 vW; void main(){ vec3 col = vec3(0.09, 0.05, 0.05); gl_FragColor = vec4(applyFog(col, vW), uFade); }`,
    { side: THREE.DoubleSide }
  );
  const nCamel = lite ? 5 : 7;
  const camels: THREE.Mesh[] = [];
  for (let i = 0; i < nCamel; i++) {
    const c = new THREE.Mesh(buildCamel(i * 1.3, i === 0 || i === 3 || i === 5), camelMat);
    c.scale.setScalar(1.55);
    c.frustumCulled = false;
    camels.push(c);
    group.add(c);
  }

  // ---- wind-blown sand off the crests (all motion in the vertex shader) ----
  const nS = lite ? 1400 : 3200;
  const sO = new Float32Array(nS * 3),
    sP = new Float32Array(nS * 3);
  let placed = 0,
    tries = 0;
  while (placed < nS && tries < nS * 60) {
    tries++;
    let x: number, z: number, y: number;
    if (placed < nS * 0.45) {
      x = rand(-150, 150);
      z = ridgeZ(x) + rand(-0.4, 0.4);
      y = duneH(x, z);
    } else {
      x = rand(-70, 70);
      z = rand(-95, -2);
      y = duneH(x, z);
      const a = duneH(x + WX * 1.2, z + WZ * 1.2),
        b = duneH(x - WX * 1.2, z - WZ * 1.2);
      if (!(y > a + 0.25 && y > b + 0.05 && y > -1.2)) continue;
    }
    sO.set([x, y + 0.05, z], placed * 3);
    sP.set([Math.random(), rand(0.18, 0.4), Math.random() < 0.7 ? rand(0.5, 1.4) : rand(0.08, 0.16)], placed * 3);
    placed++;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(sO, 3));
  sg.setAttribute("aP", new THREE.BufferAttribute(sP, 3));
  sg.setDrawRange(0, placed);
  const uScale = { value: 500 };
  const sandMat = smat(
    f,
    U,
    { uScale, uMap: { value: glowTex() } },
    `attribute vec3 aP; uniform float uScale; varying float vA; varying vec3 vW;
    void main(){
      float age = fract(uTime * aP.y + aP.x);
      vec3 wdir = vec3(0.9708, 0.0, -0.2402);
      float gust = 0.7 + 0.3 * sin(uTime * 0.6 + position.x * 0.05);
      vec3 p = position + wdir * age * (5.0 + aP.x * 5.0) * gust + vec3(0.0, age * 1.9 - age * age * 1.3, 0.0) * (0.6 + aP.z * 0.5);
      p.xz += vec2(sin(uTime * 2.3 + aP.x * 50.0), cos(uTime * 1.7 + aP.x * 31.0)) * 0.25 * age;
      vA = sin(age * 3.14159) * (1.0 - age * 0.6) * (aP.z > 0.3 ? 0.07 : 0.7);
      vec4 mv = viewMatrix * vec4(p, 1.0); vW = p;
      gl_PointSize = clamp(aP.z * uScale / -mv.z, 1.0, 90.0);
      gl_Position = projectionMatrix * mv; }`,
    `uniform sampler2D uMap; varying float vA; varying vec3 vW;
    void main(){ float a = texture2D(uMap, gl_PointCoord).a * vA;
      vec3 col = vec3(1.0, 0.72, 0.45) * (0.75 + uSunCol * 0.35);
      gl_FragColor = vec4(applyFog(col, vW), a * uFade); }`,
    { depthWrite: false }
  );
  const sand = new THREE.Points(sg, sandMat);
  sand.frustumCulled = false;
  sand.renderOrder = 4;
  group.add(sand);

  // lights for the standard materials (vehicles, poles)
  group.add(f.light(new THREE.HemisphereLight("#c89ac0", "#8a5030", 1.8)));
  const sunL = f.light(new THREE.DirectionalLight("#ffb070", 2.6));
  sunL.position.copy(SUN).multiplyScalar(100);
  group.add(sunL);

  // dust devils + airliner with contrail
  const extras = desertExtras(f, lite, duneH);
  group.add(extras.group);

  const tmpQ = new THREE.Quaternion(),
    tmpP = new THREE.Vector3(),
    tmpS = new THREE.Vector3(1, 1, 1),
    upV = new THREE.Vector3(0, 1, 0),
    zero = new THREE.Matrix4().makeScale(0, 0, 0);
  let camX = 0;

  return {
    group,
    fade: f,
    bg: new THREE.Color("#c9788a"),
    fog: new THREE.Color("#d88a70"),
    fogDensity: 0.0031,
    update: (t, dt) => {
      U.uTime.value = t;
      extras.update(t);
      uScale.value = window.innerHeight * Math.min(window.devicePixelRatio || 1, lite ? 1 : 1.35) * 0.87;
      // vehicles
      for (let i = 0; i < nV; i++) {
        const v = vehs[i];
        v.x += v.v * dt;
        if (v.x > 230) v.x = -230;
        if (v.x < -230) v.x = 230;
        const dzdx = 5 * 0.012 * Math.cos(v.x * 0.012 + 1);
        const l = Math.hypot(1, dzdx);
        const fx = (Math.sign(v.v) * 1) / l,
          fz = (Math.sign(v.v) * dzdx) / l;
        const px = v.x - (dzdx / l) * v.lane,
          pz = roadZ(v.x) + (1 / l) * v.lane;
        tmpQ.setFromAxisAngle(upV, Math.atan2(-fz, fx));
        tmpP.set(px, -1.96, pz);
        m4.compose(tmpP, tmpQ, tmpS);
        (v.truck ? trucks : cars).setMatrixAt(i, m4);
        (v.truck ? cars : trucks).setMatrixAt(i, zero);
        const front = v.truck ? 6.45 : 2.22,
          back = v.truck ? -6.45 : -2.22;
        const sx = -fz,
          sz = fx;
        const hy = -1.96 + (v.truck ? 0.9 : 0.7);
        lightPos.set(
          [
            px + fx * front + sx * 0.72, hy, pz + fz * front + sz * 0.72,
            px + fx * front - sx * 0.72, hy, pz + fz * front - sz * 0.72,
            px + fx * back + sx * 0.75, hy + 0.05, pz + fz * back + sz * 0.75,
            px + fx * back - sx * 0.75, hy + 0.05, pz + fz * back - sz * 0.75,
          ],
          i * 12
        );
        tmpP.set(px + fx * front, -1.93, pz + fz * front);
        m4.compose(tmpP, tmpQ, tmpS);
        beams.setMatrixAt(i, m4);
      }
      cars.instanceMatrix.needsUpdate = trucks.instanceMatrix.needsUpdate = beams.instanceMatrix.needsUpdate = true;
      lg.attributes.position.needsUpdate = true;
      // caravan walks the ridge crest
      const lead = ((t * 1.25 + 130) % 280) - 140;
      for (let i = 0; i < nCamel; i++) {
        const x = lead - i * 4.4;
        const z = ridgeZ(x);
        const dz = (ridgeZ(x + 0.5) - ridgeZ(x - 0.5)) / 1;
        const c = camels[i];
        c.position.set(x, duneH(x, z) - 0.05, z);
        c.rotation.y = -Math.atan(dz);
      }
    },
    view: (t, pos, look) => {
      camX = 9 * Math.sin(t * 0.021);
      const z = 7 + 3 * Math.sin(t * 0.014);
      pos.set(camX, Math.max(duneH(camX, z) + 6.5, 5) + 0.4 * Math.sin(t * 0.05), z);
      look.set(camX * 0.5 - 12, 0.5, -90);
    },
  };
}

/* ============================== TROPICAL COAST ============================== */
export function beach(ctx: Ctx): World {
  const lite = ctx.lite;
  const group = new THREE.Group();
  const f = new Fader();
  const uFade = f.uniform({ value: 0 });
  const m4 = new THREE.Matrix4();
  const SUN = new THREE.Vector3(-0.07, 0.068, -0.995).normalize();
  const U = shared({ sunDir: SUN, zen: "#34497f", mid: "#d98a8a", hor: "#ffbf73", hor2: "#e59a8c", glow: "#ffa050", sunCol: "#ffc27a", fogD: 0.0029 }, uFade);

  group.add(skyDome(f, U, { cloud: 0.5, stars: 0, cloudLit: "#ffb88c", cloudDark: "#7a5d7e", sunR: 0.03, streak: 0.5 }));

  const GL_SHORE = /* glsl */ `
  float shoreZ(float x){ return -12.0 + 3.0 * sin(x * 0.035) + 1.5 * sin(x * 0.09 + 1.0); }
  float sandY(vec2 p){ float d = p.y - shoreZ(p.x); return -2.0 + (d > 0.0 ? d * 0.07 : max(d * 0.09, -4.0)); }`;
  const shoreZ = (x: number) => -12 + 3 * Math.sin(x * 0.035) + 1.5 * Math.sin(x * 0.09 + 1);
  const sandH = (x: number, z: number) => {
    const d = z - shoreZ(x);
    let h = d > 0 ? d * 0.07 : Math.max(d * 0.09, -4);
    h += smooth(9, 26, d) * 1.3 * (0.4 + fbm2(x * 0.05, z * 0.05, 3));
    h += (fbm2(x * 0.4, z * 0.4, 2) - 0.5) * 0.06 * smooth(3, 9, d);
    return -2 + h;
  };

  // ---- sand ----
  const sGeo = gridGeo(lite ? 120 : 200, lite ? 70 : 110, 16, -80, (z) => 40 + Math.max(0, 9 - z) * 1.3, sandH, 1.6);
  const sandMat = smat(
    f,
    U,
    {},
    VS_WORLD,
    `varying vec3 vW; varying vec3 vN;
    void main(){
      vec3 toC = cameraPosition - vW; float dist = length(toC); vec3 V = toC / dist;
      vec3 N = normalize(vN);
      float nearF = 1.0 - smoothstep(6.0, 30.0, dist);
      float n0 = vnoise(vW.xz * 5.0);
      vec2 g = vec2(n0 - vnoise(vW.xz * 5.0 + vec2(0.2, 0.0)), n0 - vnoise(vW.xz * 5.0 + vec2(0.0, 0.2)));
      N = normalize(N + vec3(g.x, 0.0, g.y) * 0.35 * nearF);
      float rel = vW.y + 2.0;
      float wet = 1.0 - smoothstep(0.2, 0.42, rel + (vnoise(vW.xz * 0.6) - 0.5) * 0.08);
      vec3 dry = vec3(0.96, 0.8, 0.6) * (0.95 + 0.1 * (vnoise(vW.xz * 24.0) - 0.5) * nearF + 0.06 * (vnoise(vW.xz * 0.15) - 0.5));
      dry *= 1.0 - 0.12 * (1.0 - smoothstep(0.42, 1.1, rel)); // damp band above the tide line
      dry *= 0.9 + 0.2 * smoothstep(0.3, 0.7, vnoise(vW.xz * vec2(0.08, 0.3)));
      vec3 base = mix(dry, vec3(0.5, 0.38, 0.3), wet);
      float ndl = max(dot(N, uSunDir), 0.0);
      vec3 col = base * (vec3(0.4, 0.36, 0.44) + uSunCol * (0.32 + ndl * 1.3));
      col += uGlow * 0.18 * pow(max(dot(-V, uSunDir), 0.0), 6.0) * (1.0 - wet);
      col += vec3(1.0, 0.9, 0.7) * step(0.992, hash12(floor(vW.xz * 60.0))) * nearF * 0.35;
      // glossy wet sand mirrors the sky and the sun
      vec3 R = reflect(-V, normalize(vec3(0.0, 1.0, 0.0) + vec3(g.x, 0.0, g.y) * 0.25));
      float fres = 0.08 + 0.92 * pow(1.0 - max(V.y, 0.0), 4.0);
      col = mix(col, skyCol(normalize(vec3(R.x, abs(R.y), R.z))), wet * fres * 0.75);
      col += uSunCol * pow(max(dot(R, uSunDir), 0.0), 120.0) * wet * 2.5;
      col = mix(col, vec3(0.12, 0.3, 0.3), smoothstep(0.0, -1.2, rel));
      col = applyFog(col, vW);
      gl_FragColor = vec4(col, uFade);
    }`
  );
  const sandMesh = new THREE.Mesh(sGeo, sandMat);
  sandMesh.frustumCulled = false;
  group.add(sandMesh);

  // ---- ocean: Gerstner swell, surf, swash, foam, fresnel, sun glitter ----
  const wGeo = gridGeo(lite ? 140 : 260, lite ? 120 : 220, 12, -470, (z) => 50 + Math.max(0, 9 - z) * 1.35, () => -2, 2.2);
  wGeo.deleteAttribute("normal");
  const waterMat = smat(
    f,
    U,
    { uDeep: { value: new THREE.Color("#0b3140") }, uShallow: { value: new THREE.Color("#2e9f96") } },
    GL_SHORE +
      `varying vec3 vW; varying vec3 vN; varying float vCrest;
    vec3 gerst(vec2 xz, vec2 D, float L, float A, float Q, inout vec3 n){
      float k = 6.2832 / L; float w = sqrt(9.8 * k); float ph = k * dot(D, xz) - w * uTime;
      float c = cos(ph), s = sin(ph);
      n.x -= D.x * k * A * c; n.z -= D.y * k * A * c; n.y -= Q * k * A * s;
      return vec3(Q * A * D.x * c, A * s, Q * A * D.y * c);
    }
    void main(){
      vec4 w = modelMatrix * vec4(position, 1.0);
      vec2 xz = w.xz;
      float d = shoreZ(xz.x) - xz.y; // distance offshore
      float att = smoothstep(-2.0, 30.0, d);
      vec3 n = vec3(0.0, 1.0, 0.0);
      vec3 o = vec3(0.0);
      o += gerst(xz, normalize(vec2(0.12, 1.0)), 21.0, 0.2 * att, 0.6, n);
      o += gerst(xz, normalize(vec2(-0.35, 1.0)), 9.5, 0.09 * att, 0.7, n);
      o += gerst(xz, normalize(vec2(0.55, 1.0)), 5.3, 0.045 * att, 0.7, n);
      o += gerst(xz, normalize(vec2(0.9, 0.45)), 3.1, 0.022 * att, 0.6, n);
      o += gerst(xz, normalize(vec2(-0.8, 0.6)), 1.9, 0.012 * att, 0.5, n);
      // shoaling surf rolling in toward the shore
      float sph = 0.62 * d + uTime * 1.3 + 0.35 * sin(xz.x * 0.06);
      float sb = 0.5 + 0.5 * sin(sph);
      float env = smoothstep(0.5, 5.0, d) * (1.0 - smoothstep(9.0, 22.0, d));
      float surf = pow(sb, 5.0) * 0.32 * env;
      n.z += 5.0 * pow(sb, 4.0) * 0.5 * cos(sph) * 0.62 * 0.32 * env;
      // swash running up the beach, then drawing back
      float sw = 0.3 * pow(0.5 + 0.5 * sin(uTime * 1.3 + 0.35 * sin(xz.x * 0.06) - 0.9 + xz.x * 0.015), 2.2) * (1.0 - smoothstep(0.0, 9.0, d)) - 0.06;
      w.xyz += o;
      w.y += surf + sw;
      vCrest = pow(sb, 5.0) * env;
      vW = w.xyz; vN = normalize(n);
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
    GL_SHORE +
      `uniform vec3 uDeep, uShallow; varying vec3 vW; varying vec3 vN; varying float vCrest;
    void main(){
      vec3 toC = cameraPosition - vW; float dist = length(toC); vec3 V = toC / dist;
      float depth = vW.y - sandY(vW.xz);
      if (depth < 0.0) discard;
      vec3 N = normalize(vN);
      float nearF = 1.0 - smoothstep(25.0, 160.0, dist);
      float e = 0.2;
      vec2 q = vW.xz * vec2(0.7, 1.1) + vec2(uTime * 0.1, uTime * 0.45);
      float n0 = vnoise(q); float nx = vnoise(q + vec2(e, 0.0)); float nz = vnoise(q + vec2(0.0, e));
      vec2 q2 = vW.xz * vec2(2.6, 3.4) - vec2(uTime * 0.35, uTime * 0.8);
      float m0 = vnoise(q2); float mx = vnoise(q2 + vec2(e, 0.0)); float mz = vnoise(q2 + vec2(0.0, e));
      vec2 g = vec2(nx - n0, nz - n0) / e * 0.22 + vec2(mx - m0, mz - m0) / e * 0.1;
      N = normalize(N + vec3(-g.x, 0.0, -g.y) * (0.35 + 0.65 * nearF));
      vec3 R = reflect(-V, N); R.y = abs(R.y) + 0.01;
      vec3 refl = skyCol(normalize(R));
      float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
      float shallow = 1.0 - smoothstep(0.0, 2.6, depth);
      vec3 body = mix(uDeep, uShallow, shallow * 0.85);
      float ndl = max(dot(N, uSunDir), 0.0);
      body *= vec3(0.55, 0.5, 0.55) + uSunCol * (0.2 + 0.5 * ndl);
      // sun light scattering through the backs of the wave crests
      float sss = pow(max(dot(-V, uSunDir), 0.0), 3.0) * clamp(vW.y + 2.0, 0.0, 0.5) * 2.0;
      body += vec3(0.25, 0.55, 0.4) * sss * 0.5;
      vec3 col = mix(body, refl, fres * 0.95);
      float rough = smoothstep(15.0, 320.0, dist);
      float spec = pow(max(dot(normalize(R), uSunDir), 0.0), mix(1400.0, 160.0, rough));
      col += uSunCol * spec * mix(9.0, 3.0, rough);
      // foam: swash edge, lace in the shallows, whitewater on breaking crests
      float fn = fbm(vW.xz * vec2(1.1, 2.2) + vec2(0.0, -uTime * 0.5));
      float edge = (1.0 - smoothstep(0.015, 0.14, depth)) * smoothstep(0.25, 0.55, fn + 0.2);
      float lace = smoothstep(0.56, 0.68, fn) * (1.0 - smoothstep(0.08, 0.7, depth));
      float br = smoothstep(0.3, 0.85, vCrest) * smoothstep(0.35, 0.62, fn + 0.18);
      float foam = clamp(edge + lace * 0.75 + br, 0.0, 1.0);
      vec3 foamC = vec3(1.0, 0.9, 0.82) * (0.62 + 0.38 * uSunCol);
      col = mix(col, foamC, foam * 0.92);
      col = applyFog(col, vW);
      float a = smoothstep(0.0, 0.05, depth) * mix(0.5, 1.0, smoothstep(0.0, 0.7, depth));
      a = max(a, foam * smoothstep(0.0, 0.02, depth));
      gl_FragColor = vec4(col, a * uFade);
    }`,
    { side: THREE.DoubleSide }
  );
  const water = new THREE.Mesh(wGeo, waterMat);
  water.frustumCulled = false;
  water.renderOrder = 1;
  group.add(water);

  // ---- rocky headland + far island ----
  const edgeX = (z: number) => 50 + Math.min(0, z + 60) * 0.3 + 16 * (fbm2(z * 0.035, 1, 4) - 0.5) + 5 * (fbm2(z * 0.15, 4, 2) - 0.5);
  const headH = (x: number, z: number) => {
    const q = x - edgeX(z);
    if (q < 0) return -3.5 + q * 0.2;
    const n = fbm2(x * 0.03, z * 0.03, 4);
    let h = 13 * smooth(0, 5 + 8 * n, q) * (0.5 + 0.9 * n) + 26 * smooth(8, 70, q) * fbm2(x * 0.018 + 3, z * 0.018, 3) + 3 * fbm2(x * 0.12, z * 0.12, 2);
    return -3.5 + h;
  };
  const hGeo = new THREE.PlaneGeometry(170, 230, lite ? 90 : 150, lite ? 110 : 190);
  hGeo.rotateX(-Math.PI / 2);
  hGeo.translate(105, 0, -105);
  const hp = hGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < hp.count; i++) hp.setY(i, headH(hp.getX(i), hp.getZ(i)));
  hGeo.computeVertexNormals();
  const hn = hGeo.attributes.normal as THREE.BufferAttribute;
  const hc = new Float32Array(hp.count * 3);
  const rock = new THREE.Color("#6e5648"),
    veg = new THREE.Color("#23402a"),
    tmpC = new THREE.Color();
  for (let i = 0; i < hp.count; i++) {
    const ny = hn.getY(i),
      y = hp.getY(i);
    const x = hp.getX(i),
      z = hp.getZ(i);
    tmpC.copy(rock).multiplyScalar(0.7 + 0.5 * fbm2(x * 0.08, y * 0.5 + z * 0.02, 3));
    tmpC.lerp(veg, smooth(0.6, 0.8, ny) * smooth(-1, 2.5, y));
    tmpC.multiplyScalar(0.55 + 0.45 * smooth(-3.5, -1.0, y));
    hc.set([tmpC.r, tmpC.g, tmpC.b], i * 3);
  }
  hGeo.setAttribute("color", new THREE.BufferAttribute(hc, 3));
  const landMat = f.mat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  landMat.depthWrite = true;
  group.add(new THREE.Mesh(hGeo, landMat));
  // jungle canopy on the headland
  const nT = lite ? 300 : 800;
  const trees = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), f.mat(new THREE.MeshStandardMaterial({ color: "#1d3a24", roughness: 1 })), nT);
  (trees.material as THREE.Material).depthWrite = true;
  let ti = 0,
    tt = 0;
  while (ti < nT && tt < nT * 40) {
    tt++;
    const x = rand(30, 185),
      z = rand(-215, -30);
    const y = headH(x, z);
    if (x - edgeX(z) < 9 || y < 3) continue;
    const s = rand(0.9, 2.0);
    m4.compose(new THREE.Vector3(x, y + s * 0.2, z), new THREE.Quaternion(), new THREE.Vector3(s, s * rand(0.6, 1.0), s));
    trees.setMatrixAt(ti++, m4);
  }
  trees.count = ti;
  group.add(trees);
  const iGeo = new THREE.PlaneGeometry(160, 60, 60, 24);
  iGeo.rotateX(-Math.PI / 2);
  const ip = iGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < ip.count; i++) {
    const x = ip.getX(i),
      z = ip.getZ(i);
    const r = Math.hypot(x / 80, z / 30);
    ip.setY(i, -4 + Math.max(0, 1 - r * r) * (16 + 10 * fbm2(x * 0.05, z * 0.05, 3)));
  }
  iGeo.computeVertexNormals();
  const icol = new Float32Array(ip.count * 3);
  for (let i = 0; i < ip.count; i++) icol.set([0.16, 0.22, 0.17], i * 3);
  iGeo.setAttribute("color", new THREE.BufferAttribute(icol, 3));
  const island = new THREE.Mesh(iGeo, landMat);
  island.position.set(-170, 0, -330);
  group.add(island);

  // ---- palms (trunks + fronds merged; sway + frond flutter in the vertex shader) ----
  const TR = { p: [] as number[], n: [] as number[], uv: [] as number[], sw: [] as number[], fl: [] as number[], ph: [] as number[], idx: [] as number[] };
  const FR = { p: [] as number[], n: [] as number[], uv: [] as number[], sw: [] as number[], fl: [] as number[], ph: [] as number[], idx: [] as number[] };
  const addPalm = (bx: number, bz: number, dirA: number, lean: number, H: number, nFr: number) => {
    const by = sandH(bx, bz) - 0.25;
    const ph = rand(0, 6.28);
    const dx = Math.cos(dirA),
      dz = Math.sin(dirA);
    const P = (s: number) => {
      const o = lean * H * (1.35 * s - 0.55 * s * s);
      return new THREE.Vector3(bx + dx * o, by + H * s, bz + dz * o);
    };
    const RS = 7,
      LS = 16;
    const base0 = TR.p.length / 3;
    for (let j = 0; j <= LS; j++) {
      const s = j / LS;
      const c = P(s);
      const T = P(Math.min(1, s + 0.01)).sub(P(Math.max(0, s - 0.01))).normalize();
      const s1 = new THREE.Vector3().crossVectors(T, new THREE.Vector3(0, 0, 1)).normalize();
      const s2 = new THREE.Vector3().crossVectors(T, s1).normalize();
      const r = 0.24 - 0.09 * s + 0.16 * Math.exp(-s * 14);
      for (let k = 0; k <= RS; k++) {
        const a = (k / RS) * Math.PI * 2;
        const nv = s1.clone().multiplyScalar(Math.cos(a)).addScaledVector(s2, Math.sin(a));
        TR.p.push(c.x + nv.x * r, c.y + nv.y * r, c.z + nv.z * r);
        TR.n.push(nv.x, nv.y, nv.z);
        TR.uv.push(k / RS, s * H);
        TR.sw.push(s * s);
        TR.fl.push(0);
        TR.ph.push(ph);
      }
    }
    for (let j = 0; j < LS; j++)
      for (let k = 0; k < RS; k++) {
        const a = base0 + j * (RS + 1) + k,
          b = a + 1,
          c = a + RS + 1,
          d = c + 1;
        TR.idx.push(a, c, b, b, c, d);
      }
    const top = P(1);
    for (let i = 0; i < nFr; i++) {
      const az = (i / nFr) * Math.PI * 2 + rand(-0.25, 0.25);
      const hx = Math.cos(az),
        hz = Math.sin(az);
      const sx = -hz,
        sz = hx;
      const L = rand(3.0, 4.2) * (H / 9) ** 0.4;
      const e0 = i < 3 ? rand(0.7, 1.1) : rand(0.15, 0.65);
      const droop = rand(0.55, 0.95);
      const NS = 10;
      const b0 = FR.p.length / 3;
      for (let j = 0; j <= NS; j++) {
        const s = j / NS;
        const cx = top.x + hx * L * s * Math.cos(e0),
          cz = top.z + hz * L * s * Math.cos(e0);
        const cy = top.y + L * s * Math.sin(e0) - L * droop * s * s;
        const w = 0.95 * Math.pow(Math.sin(Math.PI * (0.08 + 0.92 * s)), 0.6);
        const ty = L * Math.sin(e0) - 2 * L * droop * s;
        const tl = Math.hypot(L * Math.cos(e0), ty);
        const Tx = (hx * L * Math.cos(e0)) / tl,
          Ty = ty / tl,
          Tz = (hz * L * Math.cos(e0)) / tl;
        // normal = side x tangent
        const nx = -sz * Ty,
          nny = sz * Tx - sx * Tz,
          nz = sx * Ty;
        const nl = Math.hypot(nx, nny, nz) || 1;
        for (const v of [-1, 0, 1]) {
          FR.p.push(cx + sx * v * w, cy - Math.abs(v) * w * 0.32, cz + sz * v * w);
          FR.n.push(nx / nl, nny / nl, nz / nl);
          FR.uv.push(s, v * 0.5 + 0.5);
          FR.sw.push(1);
          FR.fl.push(s * (0.7 + Math.abs(v) * 0.3));
          FR.ph.push(ph + i * 0.7);
        }
      }
      for (let j = 0; j < NS; j++)
        for (let k = 0; k < 2; k++) {
          const a = b0 + j * 3 + k,
            b = a + 1,
            c = a + 3,
            d = c + 1;
          FR.idx.push(a, c, b, b, c, d);
        }
    }
  };
  if (lite) {
    // narrow portrait view: pull the framing palms in toward the centre
    addPalm(-5.2, -3, -0.25, 0.4, 8.6, 12);
    addPalm(-9, -9, 0.3, 0.3, 10, 12);
    addPalm(6, -4, Math.PI + 0.2, 0.36, 7.8, 11);
  } else {
    addPalm(-8.5, -2, -0.25, 0.42, 8.8, 13);
    addPalm(-14, -8, 0.3, 0.3, 10.5, 13);
    addPalm(10, -1, Math.PI + 0.2, 0.38, 7.8, 12);
    addPalm(16.5, -7, Math.PI - 0.2, 0.22, 10, 12);
  }
  const bgPalms: [number, number][] = lite
    ? [[-26, 3], [-38, 8], [26, 5]]
    : [[-24, 2], [-30, 7], [-37, 4], [-46, 10], [-55, 6], [24, 4], [31, 9], [37, 3], [44, 7]];
  for (const [x, z] of bgPalms) addPalm(x, z + shoreZ(x) + 6, rand(0, 6.28), rand(0.15, 0.35), rand(7, 10.5), 11);
  const mkGeo = (B: typeof TR) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(B.p, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(B.n, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(B.uv, 2));
    g.setAttribute("aSw", new THREE.Float32BufferAttribute(B.sw, 1));
    g.setAttribute("aFl", new THREE.Float32BufferAttribute(B.fl, 1));
    g.setAttribute("aPh", new THREE.Float32BufferAttribute(B.ph, 1));
    g.setIndex(B.idx);
    return g;
  };
  const PALM_VS = `attribute float aSw; attribute float aFl; attribute float aPh; varying vec3 vW; varying vec3 vN; varying vec2 vUv;
    void main(){ vec3 p = position; float t = uTime;
      float gust = 0.55 + 0.45 * sin(t * 0.23 + aPh * 0.3);
      float g = (sin(t * 0.8 + aPh) * 0.55 + sin(t * 1.9 + aPh * 1.7) * 0.2 + 0.6) * gust;
      p.x += g * aSw * 0.4; p.z += sin(t * 0.55 + aPh * 2.0) * aSw * 0.12;
      float fl = sin(t * 3.4 + aPh * 3.0 + position.x * 0.9 + position.z * 0.7);
      p.y += fl * 0.16 * aFl * (0.5 + gust);
      p.x += (cos(t * 2.7 + aPh + position.y * 1.3) * 0.1 + 0.18 * gust) * aFl;
      vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; vN = normal; vUv = uv; gl_Position = projectionMatrix * viewMatrix * w; }`;
  const trunkMat = smat(
    f,
    U,
    {},
    PALM_VS,
    `varying vec3 vW; varying vec3 vN; varying vec2 vUv;
    void main(){ vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
      float ring = 0.8 + 0.2 * smoothstep(0.2, 0.8, fract(vUv.y * 3.2)) + 0.08 * (vnoise(vUv * vec2(6.0, 40.0)) - 0.5);
      vec3 base = vec3(0.3, 0.25, 0.21) * ring;
      float ndl = max(dot(N, uSunDir), 0.0);
      vec3 col = base * (vec3(0.34, 0.3, 0.38) + uSunCol * ndl * 0.9);
      col += uGlow * 0.12 * pow(1.0 - max(dot(N, V), 0.0), 4.0) * ndl;
      gl_FragColor = vec4(applyFog(col, vW), uFade); }`
  );
  const frondTex = canvasTex(512, 128, (g) => {
    g.clearRect(0, 0, 512, 128);
    g.lineCap = "round";
    for (let x = 6; x < 505; x += 6.5) {
      for (const sd of [-1, 1]) {
        const tone = rand(0, 1);
        g.strokeStyle = tone < 0.15 ? "#8a8a3a" : tone < 0.6 ? "#4c6a28" : "#3a5520";
        g.lineWidth = rand(3.2, 4.6);
        g.beginPath();
        g.moveTo(x, 64);
        g.quadraticCurveTo(x + 10, 64 + sd * 30, x + 22 + rand(-3, 3), 64 + sd * rand(52, 62));
        g.stroke();
      }
    }
    g.strokeStyle = "#6b5a2c";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(0, 64);
    g.lineTo(510, 64);
    g.stroke();
  });
  const frondMat = smat(
    f,
    U,
    { uMap: { value: frondTex } },
    PALM_VS,
    `uniform sampler2D uMap; varying vec3 vW; varying vec3 vN; varying vec2 vUv;
    void main(){ vec4 tx = texture2D(uMap, vUv); if (tx.a < 0.45) discard;
      vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
      float ndl = dot(N, uSunDir);
      float back = pow(max(dot(-V, uSunDir), 0.0), 2.5);
      vec3 leaf = mix(tx.rgb, vec3(dot(tx.rgb, vec3(0.33))), 0.35);
      vec3 col = leaf * (vec3(0.3, 0.28, 0.34) + uSunCol * abs(ndl) * 0.6);
      col += leaf * vec3(1.2, 1.0, 0.35) * back * 0.75 * (0.3 + 0.7 * vUv.x);
      gl_FragColor = vec4(applyFog(col, vW), uFade); }`,
    { side: THREE.DoubleSide }
  );
  const trunks = new THREE.Mesh(mkGeo(TR), trunkMat);
  const fronds = new THREE.Mesh(mkGeo(FR), frondMat);
  trunks.frustumCulled = fronds.frustumCulled = false;
  trunks.renderOrder = fronds.renderOrder = 2;
  group.add(trunks, fronds);

  // shoreline rocks
  const rockGeo = new THREE.IcosahedronGeometry(1, 2);
  const rp = rockGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < rp.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(rp, i);
    v.multiplyScalar(0.75 + 0.5 * fbm2(v.x * 1.7 + 3, v.y * 1.7 + v.z, 3));
    rp.setXYZ(i, v.x, v.y * 0.7, v.z);
  }
  rockGeo.computeVertexNormals();
  const rockMat = f.mat(new THREE.MeshStandardMaterial({ color: "#3b302c", roughness: 0.7, metalness: 0.1 }));
  rockMat.depthWrite = true;
  const rockDefs: [number, number, number][] = [
    [17, -3.5, 1.6],
    [19.5, -2.6, 0.9],
    [15.5, -5.5, 0.7],
    [-20, -6, 1.2],
    [-18.3, -5.2, 0.6],
  ];
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockDefs.length);
  rockDefs.forEach(([x, z, s], i) => {
    m4.compose(new THREE.Vector3(x, sandH(x, z + shoreZ(x)) + s * 0.1, z + shoreZ(x)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rand(0, 6), 0)), new THREE.Vector3(s * 1.4, s, s * 1.2));
    rocks.setMatrixAt(i, m4);
  });
  group.add(rocks);

  // ---- sailboat on the horizon ----
  const boat = new THREE.Group();
  const hull = new THREE.BoxGeometry(6, 0.9, 1.6).translate(0, 0.2, 0);
  const hpz = hull.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < hpz.count; i++) if (hpz.getY(i) < 0) hpz.setX(i, hpz.getX(i) * 0.8);
  const sailS = new THREE.Shape();
  sailS.moveTo(-2.2, 1.0);
  sailS.lineTo(0.2, 1.0);
  sailS.lineTo(0.15, 8.6);
  sailS.closePath();
  const jibS = new THREE.Shape();
  jibS.moveTo(0.45, 1.1);
  jibS.lineTo(2.9, 0.8);
  jibS.lineTo(0.4, 7.8);
  jibS.closePath();
  const colorize = (g: THREE.BufferGeometry, c: string) => {
    const cc = new THREE.Color(c);
    const n = g.attributes.position.count;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) a.set([cc.r, cc.g, cc.b], i * 3);
    g.setAttribute("color", new THREE.BufferAttribute(a, 3));
    return g.toNonIndexed();
  };
  const boatGeo = mergeGeometries([
    colorize(hull, "#2a2230"),
    colorize(new THREE.BoxGeometry(0.1, 8.2, 0.1).translate(0.3, 4.6, 0), "#2a2230"),
    colorize(new THREE.ShapeGeometry(sailS), "#f2c4a4"),
    colorize(new THREE.ShapeGeometry(jibS), "#e9b598"),
  ])!;
  const boatMat = f.mat(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  boatMat.depthWrite = true;
  boat.add(new THREE.Mesh(boatGeo, boatMat));
  boat.position.set(-20, -2.1, -150);
  boat.rotation.y = 0.35;
  group.add(boat);

  // ---- seagulls gliding (instanced, wing flap in the vertex shader) ----
  const nG = lite ? 6 : 11;
  const gp: number[] = [],
    gw: number[] = [];
  const tri = (a: number[], b: number[], c: number[]) => {
    for (const v of [a, b, c]) {
      gp.push(v[0], v[1], v[2]);
      gw.push(Math.abs(v[0]));
    }
  };
  for (const sd of [-1, 1]) {
    tri([0, 0, 0.22], [sd * 0.5, 0.06, 0.08], [0, 0, -0.14]);
    tri([sd * 0.5, 0.06, 0.08], [sd * 1.05, -0.02, -0.16], [sd * 0.45, 0.04, -0.12]);
    tri([0, 0, -0.14], [sd * 0.5, 0.06, 0.08], [sd * 0.45, 0.04, -0.12]);
  }
  tri([0, 0.02, 0.35], [0.07, 0, -0.35], [-0.07, 0, -0.35]);
  const gullGeo = new THREE.BufferGeometry();
  gullGeo.setAttribute("position", new THREE.Float32BufferAttribute(gp, 3));
  gullGeo.setAttribute("aW", new THREE.Float32BufferAttribute(gw, 1));
  const gph = new Float32Array(nG);
  for (let i = 0; i < nG; i++) gph[i] = Math.random();
  gullGeo.setAttribute("aPh", new THREE.InstancedBufferAttribute(gph, 1));
  const gullMat = smat(
    f,
    U,
    {},
    `attribute float aW; attribute float aPh; varying vec3 vW;
    void main(){ vec3 p = position; float t = uTime;
      float gate = smoothstep(0.1, 0.7, sin(t * 0.45 + aPh * 20.0));
      float flap = sin(t * 8.5 + aPh * 6.28);
      p.y += (flap * gate * 0.5 + 0.12 * (1.0 - gate)) * aW * aW;
      vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    `varying vec3 vW; void main(){ gl_FragColor = vec4(applyFog(vec3(0.16, 0.12, 0.14), vW), uFade); }`,
    { side: THREE.DoubleSide }
  );
  const gulls = new THREE.InstancedMesh(gullGeo, gullMat, nG);
  gulls.frustumCulled = false;
  gulls.renderOrder = 3;
  group.add(gulls);
  const gData = Array.from({ length: nG }, () => ({
    c: new THREE.Vector3(rand(-22, 22), rand(3.5, 11), rand(-40, -6)),
    r: rand(6, 16),
    w: rand(0.12, 0.22) * (Math.random() < 0.5 ? -1 : 1),
    a: rand(0, 6.28),
    s: rand(0.8, 1.1),
  }));

  group.add(f.light(new THREE.HemisphereLight("#ffb89a", "#3a2c3e", 1.1)));
  const sunL = f.light(new THREE.DirectionalLight("#ffb77a", 2.4));
  sunL.position.copy(SUN).multiplyScalar(100);
  group.add(sunL);

  const q = new THREE.Quaternion(),
    e = new THREE.Euler(0, 0, 0, "YXZ"),
    pv = new THREE.Vector3(),
    sv = new THREE.Vector3();
  let boatX = -30;
  return {
    group,
    fade: f,
    bg: new THREE.Color("#e7a07f"),
    fog: new THREE.Color("#e6a283"),
    fogDensity: 0.0029,
    update: (t, dt) => {
      U.uTime.value = t;
      boatX += dt * 0.35;
      if (boatX > 90) boatX = -90;
      boat.position.set(boatX, -2.15 + Math.sin(t * 0.9) * 0.08, -150);
      boat.rotation.z = Math.sin(t * 0.7) * 0.03;
      for (let i = 0; i < nG; i++) {
        const g = gData[i];
        const a = g.a + t * g.w;
        pv.set(g.c.x + Math.cos(a) * g.r, g.c.y + Math.sin(t * 0.3 + i) * 0.8, g.c.z + Math.sin(a) * g.r * 0.6);
        e.set(Math.sin(t * 0.5 + i) * 0.08, Math.atan2(-Math.sin(a) * g.w, Math.cos(a) * g.w * 0.6), -Math.sign(g.w) * 0.35);
        q.setFromEuler(e);
        sv.setScalar(g.s);
        m4.compose(pv, q, sv);
        gulls.setMatrixAt(i, m4);
      }
      gulls.instanceMatrix.needsUpdate = true;
    },
    view: (t, pos, look) => {
      const x = 4.5 * Math.sin(t * 0.024);
      const z = 8.8 + 1.2 * Math.sin(t * 0.017);
      pos.set(x, sandH(x, z) + 1.75 + 0.25 * Math.sin(t * 0.04), z);
      look.set(x * 0.4 + 1, -0.6, -60);
    },
  };
}
