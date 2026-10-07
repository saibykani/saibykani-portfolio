import * as THREE from "three";
import { flatShape } from "./aircraft";

/* ---------------------------------------------------------------------------
 * Air-combat layer for the hero sky:
 *  - 5th-gen stealth fighters in a turning dogfight; bank angles come from the
 *    flight path's curvature (coordinated turns), not hand-keyed rolls
 *  - afterburner plumes with shock diamonds, wingtip vapour under high g
 *  - missile shots with a smoke trail that get spoofed by flare salvos and
 *    detonate on the decoy (fireball, smoke, falling sparks, light flash)
 *  - a four-ship formation flyby pulling contrails up high
 * Everything is deterministic from the clock and loops seamlessly.
 * ------------------------------------------------------------------------- */

type V3 = THREE.Vector3;
type Path = (s: number, out: V3) => V3;

const UP = new THREE.Vector3(0, 1, 0);
const G = 4; // scene-unit gravity used to derive bank angle / g-load
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const randDir = (v: V3, len: number) => v.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(len);

const FINISH = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>`;

/* ---------- soft particles (smoke, fire, sparks) in one draw call ---------- */
class Particles {
  readonly points: THREE.Points;
  readonly mat: THREE.ShaderMaterial;
  private readonly n: number;
  private next = 0;
  private readonly pos: Float32Array;
  private readonly vel: Float32Array;
  private readonly col: Float32Array;
  private readonly size: Float32Array;
  private readonly alpha: Float32Array;
  private readonly age: Float32Array;
  private readonly life: Float32Array;
  private readonly s0: Float32Array;
  private readonly s1: Float32Array;
  private readonly a0: Float32Array;
  private readonly drag: Float32Array;
  private readonly lift: Float32Array;

  constructor(n: number, map: THREE.Texture, additive: boolean) {
    this.n = n;
    this.pos = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    this.size = new Float32Array(n);
    this.alpha = new Float32Array(n);
    this.age = new Float32Array(n).fill(1);
    this.life = new Float32Array(n).fill(1);
    this.s0 = new Float32Array(n);
    this.s1 = new Float32Array(n);
    this.a0 = new Float32Array(n);
    this.drag = new Float32Array(n);
    this.lift = new Float32Array(n);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(this.size, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(this.alpha, 1));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: map }, uScale: { value: 600 }, uTint: { value: new THREE.Color(1, 1, 1) } },
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: /* glsl */ `
        uniform float uScale;
        attribute float aSize;
        attribute float aAlpha;
        attribute vec3 aColor;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uScale / max(0.5, -mv.z);
          vAlpha = aAlpha;
          vColor = aColor;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        uniform vec3 uTint;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          float a = texture2D(uMap, gl_PointCoord).a * vAlpha;
          if (a < 0.003) discard;
          gl_FragColor = vec4(vColor * uTint, a);
          ${FINISH}
        }`,
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
  }

  spawn(p: V3, v: V3, life: number, s0: number, s1: number, a0: number, c: THREE.Color, drag = 0.8, lift = 0) {
    const i = this.next;
    this.next = (i + 1) % this.n;
    this.pos.set([p.x, p.y, p.z], i * 3);
    this.vel.set([v.x, v.y, v.z], i * 3);
    this.col.set([c.r, c.g, c.b], i * 3);
    this.age[i] = 0;
    this.life[i] = life;
    this.s0[i] = s0;
    this.s1[i] = s1;
    this.a0[i] = a0;
    this.drag[i] = drag;
    this.lift[i] = lift;
    this.points.geometry.attributes.aColor.needsUpdate = true;
  }

  update(dt: number) {
    for (let i = 0; i < this.n; i++) {
      if (this.age[i] >= this.life[i]) {
        this.size[i] = 0;
        this.alpha[i] = 0;
        continue;
      }
      this.age[i] += dt;
      const k = Math.min(1, this.age[i] / this.life[i]);
      const d = Math.exp(-this.drag[i] * dt);
      const j = i * 3;
      this.vel[j] *= d;
      this.vel[j + 1] = this.vel[j + 1] * d + this.lift[i] * dt;
      this.vel[j + 2] *= d;
      this.pos[j] += this.vel[j] * dt;
      this.pos[j + 1] += this.vel[j + 1] * dt;
      this.pos[j + 2] += this.vel[j + 2] * dt;
      this.size[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * (1 - (1 - k) * (1 - k));
      this.alpha[i] = this.a0[i] * Math.pow(1 - k, 1.5) * Math.min(1, this.age[i] * 10);
    }
    const a = this.points.geometry.attributes;
    a.position.needsUpdate = true;
    a.aSize.needsUpdate = true;
    a.aAlpha.needsUpdate = true;
  }
}

/* ---------- camera-facing ribbon trail (vapour, contrails, missile smoke) ---------- */
type RibbonOpts = { color: string; width: number; spread: number; life: number; interval: number; opacity: number; additive?: boolean };

class Ribbon {
  readonly mesh: THREE.Mesh;
  readonly base: THREE.Color;
  private readonly o: RibbonOpts;
  private readonly n: number;
  private readonly pts: Float32Array;
  private readonly times: Float32Array;
  private readonly str: Float32Array;
  private readonly vpos: Float32Array;
  private readonly valpha: Float32Array;
  private last = -1e9;
  private static tan = new THREE.Vector3();
  private static cur = new THREE.Vector3();
  private static side = new THREE.Vector3();
  private static eye = new THREE.Vector3();

  constructor(n: number, o: RibbonOpts) {
    this.n = n;
    this.o = o;
    this.base = new THREE.Color(o.color);
    this.pts = new Float32Array(n * 3);
    this.times = new Float32Array(n).fill(-1e9);
    this.str = new Float32Array(n);
    this.vpos = new Float32Array(n * 6);
    this.valpha = new Float32Array(n * 2);
    const idx: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.vpos, 3));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(this.valpha, 1));
    geo.setIndex(idx);
    this.mesh = new THREE.Mesh(
      geo,
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: this.base.clone() }, uOpacity: { value: o.opacity } },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        vertexShader: /* glsl */ `
          attribute float aAlpha;
          varying float vA;
          void main() {
            vA = aAlpha;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying float vA;
          void main() {
            gl_FragColor = vec4(uColor, vA * uOpacity);
            ${FINISH}
          }`,
      })
    );
    this.mesh.frustumCulled = false;
  }

  get uniforms() {
    return (this.mesh.material as THREE.ShaderMaterial).uniforms;
  }

  push(p: V3, now: number, strength: number) {
    if (now - this.last >= this.o.interval) {
      this.pts.copyWithin(3, 0, (this.n - 1) * 3);
      this.times.copyWithin(1, 0, this.n - 1);
      this.str.copyWithin(1, 0, this.n - 1);
      this.last = now;
    }
    this.pts[0] = p.x;
    this.pts[1] = p.y;
    this.pts[2] = p.z;
    this.times[0] = now;
    this.str[0] = strength;
  }

  clear() {
    this.times.fill(-1e9);
    this.last = -1e9;
  }

  update(now: number, cam: V3) {
    const { pts, n, o } = this;
    const { tan, cur, side, eye } = Ribbon;
    // collapse expired points onto their younger neighbour so nothing streaks to stale positions
    for (let i = 1; i < n; i++) if (now - this.times[i] > o.life) pts.copyWithin(i * 3, (i - 1) * 3, i * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1) * 3;
      const b = Math.min(n - 1, i + 1) * 3;
      tan.set(pts[a] - pts[b], pts[a + 1] - pts[b + 1], pts[a + 2] - pts[b + 2]);
      cur.set(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]);
      side.crossVectors(tan, eye.subVectors(cam, cur)).normalize();
      const age = now - this.times[i];
      const k = Math.min(1, Math.max(0, age / o.life));
      const hw = o.width * (0.35 + o.spread * k) * (i === 0 ? 0.3 : 1);
      const j = i * 6;
      this.vpos[j] = cur.x + side.x * hw;
      this.vpos[j + 1] = cur.y + side.y * hw;
      this.vpos[j + 2] = cur.z + side.z * hw;
      this.vpos[j + 3] = cur.x - side.x * hw;
      this.vpos[j + 4] = cur.y - side.y * hw;
      this.vpos[j + 5] = cur.z - side.z * hw;
      const al = age > o.life ? 0 : this.str[i] * Math.pow(1 - k, 1.4);
      this.valpha[i * 2] = al;
      this.valpha[i * 2 + 1] = al;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.aAlpha.needsUpdate = true;
  }
}

/* ---------- stealth fighter (chined body, diamond wing, canted twin tails) ---------- */
type Fighter = {
  outer: THREE.Group;
  inner: THREE.Group;
  plumes: { mesh: THREE.Mesh; base: number }[];
  glows: THREE.Sprite[];
  diamonds: THREE.Sprite[];
  nozzles: V3[];
  tips: V3[];
};

function glowSprite(glow: THREE.Texture, color: string, size: number) {
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glow, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false })
  );
  sp.scale.setScalar(size);
  return sp;
}

function buildFighter(glow: THREE.Texture, skinHex: string, canopyHex: string): Fighter {
  const outer = new THREE.Group();
  const g = new THREE.Group();
  g.rotation.y = -Math.PI / 2; // nose (+x) onto +z, the forward axis of the pose basis
  g.scale.setScalar(1.3);
  outer.add(g);

  const skin = new THREE.MeshStandardMaterial({ color: skinHex, metalness: 0.45, roughness: 0.5 });
  const edge = new THREE.MeshStandardMaterial({ color: new THREE.Color(skinHex).multiplyScalar(0.72), metalness: 0.45, roughness: 0.55 });
  const glass = new THREE.MeshPhysicalMaterial({ color: canopyHex, metalness: 1, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05 });
  const dark = new THREE.MeshStandardMaterial({ color: "#14161b", metalness: 0.3, roughness: 0.75 });
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };

  // blended, flattened fuselage
  const prof: [number, number][] = [
    [0, 1.8], [0.045, 1.66], [0.1, 1.42], [0.16, 1.05], [0.21, 0.55], [0.24, 0.05], [0.24, -0.95], [0.22, -1.35], [0.19, -1.55],
  ];
  const fus = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 28);
  fus.rotateZ(-Math.PI / 2);
  fus.scale(1, 0.6, 1.5);
  add(fus, skin);

  // chined lifting-body planform
  const chine = flatShape([[1.45, 0], [0.4, 0.34], [-1.5, 0.4], [-1.5, -0.4], [0.4, -0.34]], 0.04);
  chine.rotateX(Math.PI / 2);
  add(chine, skin, 0, 0.02, 0);

  // diamond wing: swept leading edge, forward-swept trailing edge
  const wing = flatShape([[0.5, 0.36], [-0.8, 1.55], [-1.02, 1.55], [-1.18, 0.36], [-1.18, -0.36], [-1.02, -1.55], [-0.8, -1.55], [0.5, -0.36]], 0.035);
  wing.rotateX(Math.PI / 2);
  add(wing, skin, 0, 0, 0);

  // all-moving stabilators
  const stab = flatShape([[-1.15, 0.3], [-1.58, 0.98], [-1.8, 0.98], [-1.78, 0.3], [-1.78, -0.3], [-1.8, -0.98], [-1.58, -0.98], [-1.15, -0.3]], 0.025);
  stab.rotateX(Math.PI / 2);
  add(stab, edge, 0, -0.01, 0);

  // twin vertical tails, canted outward
  for (const side of [-1, 1]) {
    const fin = add(flatShape([[-0.82, 0], [-1.36, 0.82], [-1.62, 0.82], [-1.6, 0]], 0.025), edge, 0, 0.08, side * 0.3);
    fin.rotation.x = side * 0.47;
  }

  // gold-tinted bubble canopy
  const canopy = add(new THREE.SphereGeometry(0.13, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), glass, 0.95, 0.07, 0);
  canopy.scale.set(3, 1, 0.95);

  // caret intakes
  for (const side of [-1, 1]) {
    const intake = add(new THREE.BoxGeometry(0.62, 0.17, 0.11), edge, 0.32, -0.02, side * 0.33);
    intake.rotation.y = side * 0.12;
    add(new THREE.PlaneGeometry(0.1, 0.15), dark, 0.64, -0.02, side * 0.34).rotation.y = Math.PI / 2;
  }

  // engines: nozzle, layered afterburner plume, shock diamonds
  const plumes: Fighter["plumes"] = [];
  const glows: THREE.Sprite[] = [];
  const diamonds: THREE.Sprite[] = [];
  const nozzles: V3[] = [];
  const cone = (r: number, len: number) => {
    const c = new THREE.ConeGeometry(r, len, 16, 1, true);
    c.rotateZ(Math.PI / 2); // tip trails backward along -x
    c.translate(-len / 2, 0, 0);
    return c;
  };
  for (const side of [-1, 1]) {
    const z = side * 0.16;
    add(new THREE.CylinderGeometry(0.1, 0.12, 0.26, 16, 1, true), dark, -1.62, 0, z).rotation.z = Math.PI / 2;
    for (const [r, len, color, base] of [[0.095, 1.3, "#ff8f3d", 0.5], [0.055, 0.75, "#cfe3ff", 0.8]] as const) {
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: base, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
      plumes.push({ mesh: add(cone(r, len), mat, -1.75, 0, z), base });
    }
    const gl = glowSprite(glow, "#ffb070", 0.8);
    gl.position.set(-1.8, 0, z);
    g.add(gl);
    glows.push(gl);
    for (let k = 0; k < 4; k++) {
      const d = glowSprite(glow, "#ffe2b0", 0.3 - k * 0.045);
      d.position.set(-1.98 - k * 0.2, 0, z);
      g.add(d);
      diamonds.push(d);
    }
    nozzles.push(new THREE.Vector3(-1.8, 0, z));
  }

  return { outer, inner: g, plumes, glows, diamonds, nozzles, tips: [new THREE.Vector3(-0.95, 0, 1.55), new THREE.Vector3(-0.95, 0, -1.55)] };
}

function setBurner(f: Fighter, level: number) {
  const flick = 0.9 + Math.random() * 0.2;
  for (const p of f.plumes) {
    p.mesh.scale.set((0.3 + 0.9 * level) * flick, 0.85 + 0.25 * level, 0.85 + 0.25 * level);
    (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.base * (0.25 + 0.75 * level);
  }
  for (const s of f.glows) {
    s.scale.setScalar((0.5 + 0.6 * level) * flick);
    s.material.opacity = 0.45 + 0.55 * level;
  }
  const d = Math.max(0, level - 0.5) * 2;
  for (const s of f.diamonds) s.material.opacity = d * (0.75 + Math.random() * 0.25);
}

/* ---------- missile ---------- */
function buildMissile(glow: THREE.Texture) {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: "#e9ecf1", metalness: 0.3, roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 10), white);
  body.rotation.x = Math.PI / 2;
  g.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 10), white);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = 0.61;
  g.add(nose);
  for (let k = 0; k < 4; k++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.16, 0.16), white);
    const a = (k * Math.PI) / 2;
    fin.position.set(Math.sin(a) * 0.1, Math.cos(a) * 0.1, -0.42);
    fin.rotation.z = -a;
    g.add(fin);
  }
  const motor = glowSprite(glow, "#fff0d0", 1.6);
  motor.position.z = -0.62;
  g.add(motor);
  g.scale.setScalar(1.3);
  g.visible = false;
  return { g, motor };
}

/* ---------- flight paths ---------- */
const P = 22; // dogfight loop period (s)
const W = (2 * Math.PI) / P;
// Turning fight: an oval racetrack swinging toward the camera and away, with
// altitude trades (energy fight) and tighter jinks layered on top.
const fightPath: Path = (s, out) => {
  const a = W * s;
  return out.set(40 * Math.sin(a) + 8 * Math.sin(3 * a), 7 + 6 * Math.sin(2 * a + 0.8) + 3 * Math.sin(3 * a + 1.3), -42 + 24 * Math.cos(a));
};
const FLYBY_P = 30;
const FLYBY_D = 9;
const flybyPath: Path = (s, out) => {
  const u = s / FLYBY_D;
  return out.set(-115 + 230 * u, 25 - 5 * u + 0.5 * Math.sin(s * 0.8), -95);
};

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _f = new THREE.Vector3();
const _acc = new THREE.Vector3();
const _up = new THREE.Vector3();
const _x = new THREE.Vector3();
const _m = new THREE.Matrix4();

/* Place an aircraft on a path; orientation follows velocity and banks so lift
 * opposes (acceleration + gravity), i.e. a coordinated turn. Returns g-load. */
function pose(obj: THREE.Object3D, path: Path, s: number, off: V3, vel: V3) {
  const h = 0.06;
  path(s - h, _a);
  path(s, _b);
  path(s + h, _c);
  vel.subVectors(_c, _a).divideScalar(2 * h);
  _f.copy(vel).normalize();
  _acc.copy(_c).add(_a).addScaledVector(_b, -2).divideScalar(h * h);
  _up.copy(_acc).addScaledVector(UP, G);
  const load = _up.length() / G;
  _up.addScaledVector(_f, -_up.dot(_f)).normalize();
  _x.crossVectors(_up, _f);
  _m.makeBasis(_x, _up, _f);
  obj.position.copy(_b).add(off);
  obj.quaternion.setFromRotationMatrix(_m);
  return load;
}

const crossed = (prev: number, cur: number, at: number) => (prev <= cur ? prev < at && at <= cur : at > prev || at <= cur);

type Actor = { f: Fighter; lag: number; off: V3; vel: V3; load: number; vapour: Ribbon[]; streak: Ribbon[] };
type Flare = { sp: THREE.Sprite; pos: V3; vel: V3; age: number; alive: boolean };

export function buildAirWar(glow: THREE.Texture, puff: THREE.Texture) {
  const root = new THREE.Group();
  const smoke = new Particles(1800, puff, false);
  const fire = new Particles(700, glow, true);
  root.add(smoke.points, fire.points);
  const ribbons: Ribbon[] = [];
  const ribbon = (n: number, o: RibbonOpts) => {
    const r = new Ribbon(n, o);
    ribbons.push(r);
    root.add(r.mesh);
    return r;
  };

  const makeActor = (skin: string, canopy: string, lag: number, off: V3, contrail = false): Actor => {
    const f = buildFighter(glow, skin, canopy);
    root.add(f.outer);
    const vapour = contrail ? [] : f.tips.map(() => ribbon(36, { color: "#ffffff", width: 0.06, spread: 0.8, life: 0.9, interval: 0.03, opacity: 0.7 }));
    const streak = contrail
      ? f.nozzles.map(() => ribbon(60, { color: "#f4f7ff", width: 0.22, spread: 2.2, life: 3, interval: 0.05, opacity: 0.55 }))
      : [ribbon(46, { color: "#ffd7a8", width: 0.14, spread: 0.6, life: 1.2, interval: 0.03, opacity: 0.22, additive: true })];
    return { f, lag, off, vel: new THREE.Vector3(), load: 1, vapour, streak };
  };

  // the fight: bandit (dark) defending against a friendly two-ship in lag pursuit
  const bandit = makeActor("#434a55", "#26344a", 0, new THREE.Vector3());
  const lead = makeActor("#7f8896", "#b8963c", 2.2, new THREE.Vector3(0, 0.8, 0));
  const wing = makeActor("#7a8391", "#b8963c", 4, new THREE.Vector3(3, -1.5, -4));
  const fight = [bandit, lead, wing];

  // four-ship in fingertip, high and far
  const fourship = [
    [0, 0, 0],
    [-3.4, -0.5, -3.4],
    [-3.4, -0.5, 3.8],
    [-6.9, -1, 7.4],
  ].map(([x, y, z]) => makeActor("#8a93a2", "#b8963c", 0, new THREE.Vector3(x, y, z), true));

  // missiles
  const missiles = [0, 1].map(() => {
    const { g, motor } = buildMissile(glow);
    root.add(g);
    const trail = ribbon(80, { color: "#e8ebf0", width: 0.2, spread: 1.6, life: 4, interval: 0.05, opacity: 0.8 });
    return { g, motor, trail, pos: new THREE.Vector3(), vel: new THREE.Vector3(), age: 0, live: false, decoy: null as Flare | null };
  });

  // flares
  const flares: Flare[] = Array.from({ length: 28 }, () => {
    const sp = glowSprite(glow, "#fff2d8", 2);
    sp.visible = false;
    root.add(sp);
    return { sp, pos: new THREE.Vector3(), vel: new THREE.Vector3(), age: 0, alive: false };
  });
  const flareQueue: { at: number; src: Actor }[] = [];
  const dumpFlares = (src: Actor, now: number, count: number, delay = 0) => {
    for (let k = 0; k < count; k++) flareQueue.push({ at: now + delay + k * 0.075, src });
  };

  // detonation flash
  const flash = glowSprite(glow, "#ffd9a0", 1);
  flash.visible = false;
  root.add(flash);
  const boom = new THREE.PointLight("#ffb46b", 0, 90, 1.2);
  root.add(boom);
  let flashLife = 0;

  const C = {
    smoke: new THREE.Color("#d9dde5"),
    dark: new THREE.Color("#3e3f45"),
    fireA: new THREE.Color("#ffb347"),
    fireB: new THREE.Color("#ff6a1f"),
    spark: new THREE.Color("#ffd27a"),
    flare: new THREE.Color("#ffcf7a"),
  };
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const explode = (p: V3) => {
    flash.position.copy(p);
    boom.position.copy(p);
    flashLife = 1;
    for (let i = 0; i < 30; i++) fire.spawn(p, randDir(tmp, rand(3, 11)), rand(0.45, 1.05), 0.8, rand(3.5, 6), 1, i % 2 ? C.fireA : C.fireB, 2.4, 0.6);
    for (let i = 0; i < 22; i++) smoke.spawn(tmp2.copy(p).add(randDir(tmp, rand(0, 1.2))), randDir(tmp, rand(1, 3.5)), rand(3, 4.5), 1.5, rand(6, 9), 0.6, C.dark, 0.9, 0.35);
    for (let i = 0; i < 16; i++) fire.spawn(p, randDir(tmp, rand(9, 18)), rand(0.8, 1.5), 0.35, 0.12, 1, C.spark, 0.5, -7);
  };

  const fire1 = (m: (typeof missiles)[number], shooter: Actor) => {
    m.live = true;
    m.age = 0;
    m.decoy = null;
    m.trail.clear();
    shooter.f.outer.updateMatrixWorld(true);
    m.pos.copy(shooter.f.inner.localToWorld(tmp.set(0.2, -0.15, 0.5)));
    m.vel.copy(shooter.vel);
    m.g.visible = true;
  };

  // shots in the fight loop (phase in seconds), each answered by a flare salvo
  const shots = [
    { at: P - 1.2, shooter: lead, missile: missiles[0] },
    { at: P * 0.5 - 0.4, shooter: wing, missile: missiles[1] },
  ];
  const T0 = P - 5; // first shot lands a few seconds after the page opens
  let prevPhase = -1;
  let flybyWas = false;

  const update = (t: number, dt: number, cam: V3, light: THREE.Color) => {
    // ---- dogfight ----
    const s = t + T0;
    const phase = ((s % P) + P) % P;
    for (const a of fight) {
      a.load = pose(a.f.outer, fightPath, s - a.lag, a.off, a.vel);
      const burner = THREE.MathUtils.smoothstep(a.load, 1.5, 2.6);
      setBurner(a.f, 0.35 + 0.65 * burner);
    }
    if (prevPhase >= 0)
      for (const sh of shots)
        if (crossed(prevPhase, phase, sh.at)) {
          fire1(sh.missile, sh.shooter);
          dumpFlares(bandit, t, 8, 0.12);
        }
    prevPhase = phase;

    // ---- four-ship flyby ----
    const fs = (t + 12) % FLYBY_P;
    const flyby = fs < FLYBY_D;
    for (const a of fourship) {
      a.f.outer.visible = flyby;
      if (flyby) {
        a.load = pose(a.f.outer, flybyPath, fs, a.off, a.vel);
        setBurner(a.f, 0.3);
      }
    }
    if (flyby && !flybyWas) fourship.forEach((a) => a.streak.forEach((r) => r.clear()));
    flybyWas = flyby;

    // ---- trails off every visible jet ----
    for (const a of [...fight, ...fourship]) {
      if (!a.f.outer.visible) continue;
      a.f.outer.updateMatrixWorld(true);
      const vap = THREE.MathUtils.smoothstep(a.load, 1.6, 2.5);
      a.f.tips.forEach((tp, i) => a.vapour[i]?.push(a.f.inner.localToWorld(tmp.copy(tp)), t, vap));
      if (a.streak.length === 1) a.streak[0].push(a.f.inner.localToWorld(tmp.set(-1.8, 0, 0)), t, 1);
      else a.f.nozzles.forEach((nz, i) => a.streak[i].push(a.f.inner.localToWorld(tmp.copy(nz).setX(-3.2)), t, 1));
    }

    // ---- flares: release, ballistics, smoke ----
    for (let i = flareQueue.length - 1; i >= 0; i--) {
      const q = flareQueue[i];
      if (t < q.at) continue;
      flareQueue.splice(i, 1);
      const fl = flares.find((x) => !x.alive);
      if (!fl) continue;
      const src = q.src.f.outer;
      _f.copy(q.src.vel).normalize();
      _x.set(1, 0, 0).applyQuaternion(src.quaternion);
      fl.alive = true;
      fl.age = 0;
      fl.pos.copy(src.position).addScaledVector(_f, -1.6);
      fl.vel
        .copy(q.src.vel)
        .multiplyScalar(0.45)
        .addScaledVector(_x, (Math.random() < 0.5 ? -1 : 1) * rand(4, 7.5))
        .addScaledVector(UP, -rand(1.5, 3.5))
        .add(randDir(tmp, 0.8));
      fl.sp.visible = true;
    }
    for (const fl of flares) {
      if (!fl.alive) continue;
      fl.age += dt;
      if (fl.age > 2.8) {
        fl.alive = false;
        fl.sp.visible = false;
        continue;
      }
      fl.vel.multiplyScalar(Math.exp(-1.3 * dt));
      fl.vel.y -= 5 * dt;
      fl.pos.addScaledVector(fl.vel, dt);
      const k = 1 - Math.pow(fl.age / 2.8, 3);
      fl.sp.position.copy(fl.pos);
      fl.sp.scale.setScalar(rand(1.7, 2.4) * k);
      fl.sp.material.opacity = k;
      smoke.spawn(fl.pos, randDir(tmp, 0.3), 2.2, 0.35, 2.4, 0.3 * k, C.smoke, 1, 0.3);
      if (Math.random() < 0.5) fire.spawn(fl.pos, randDir(tmp, 1.5), 0.25, 0.7, 0.2, 0.8 * k, C.flare, 1);
    }

    // ---- missiles: boost, pursuit with turn-rate limit, decoyed by flares ----
    for (const m of missiles) {
      if (m.live) {
        m.age += dt;
        if (!m.decoy && m.age > 0.45) m.decoy = flares.find((x) => x.alive) ?? null;
        const target = m.decoy?.alive ? m.decoy.pos : bandit.f.outer.position;
        const speed = Math.min(42, m.vel.length() + 34 * dt);
        _f.copy(m.vel).normalize();
        dir.subVectors(target, m.pos).normalize();
        const ang = _f.angleTo(dir);
        _f.lerp(dir, Math.min(1, (3.2 * dt) / Math.max(ang, 1e-4))).normalize();
        m.vel.copy(_f).multiplyScalar(speed);
        m.pos.addScaledVector(m.vel, dt);
        m.g.position.copy(m.pos);
        m.g.lookAt(tmp.copy(m.pos).add(m.vel));
        m.motor.scale.setScalar(rand(1.3, 1.9));
        m.trail.push(tmp.copy(m.pos).addScaledVector(_f, -0.85), t, 1);
        smoke.spawn(m.pos, randDir(tmp, 0.4), rand(2.2, 3.2), 0.5, 3.2, 0.3, C.smoke, 0.8, 0.25);
        if (m.pos.distanceTo(target) < 1.4 || m.age > 3.6) {
          m.live = false;
          m.g.visible = false;
          if (m.decoy) m.decoy.age = 2.8; // flare consumed by the blast
          explode(m.pos);
        }
      }
    }

    // ---- flash, particles, ribbons ----
    flashLife = Math.max(0, flashLife - dt * 2.6);
    flash.visible = flashLife > 0;
    flash.scale.setScalar(6 + 16 * Math.sqrt(1 - flashLife));
    flash.material.opacity = flashLife;
    boom.intensity = 900 * flashLife * flashLife;
    smoke.mat.uniforms.uTint.value.copy(light).multiplyScalar(0.75).addScalar(0.18);
    smoke.update(dt);
    fire.update(dt);
    for (const r of ribbons) {
      r.uniforms.uColor.value.copy(r.base).multiply(smoke.mat.uniforms.uTint.value);
      r.update(t, cam);
    }
  };

  return {
    root,
    /** pixels per world unit at distance 1 (drawing-buffer height / (2·tan(fov/2))) */
    setScale(px: number) {
      smoke.mat.uniforms.uScale.value = px;
      fire.mat.uniforms.uScale.value = px;
    },
    update,
  };
}
