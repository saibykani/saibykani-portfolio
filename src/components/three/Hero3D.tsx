"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { onLightning, type Weather } from "@/components/weather/WeatherContext";

/* ---------------------------------------------------------------------------
 * Cinematic 3D sky layered over the shader background:
 *  - volumetric-looking cloud billboards drifting toward the camera
 *  - low-poly airliners + a jet formation flying curved paths THROUGH the clouds,
 *    banking into turns, with nav-light strobes and fading contrails
 *  - comets with long tails, shooting stars, a slowly turning star field,
 *    distant "night traffic" seen only as blinking lights
 *  - lightning bolts + flash lighting during storms
 * ------------------------------------------------------------------------- */

const THEME: Record<Weather, { cloud: string; cloudOpacity: number; fog: string; hemiSky: string; hemiGround: string; key: string; keyI: number; stars: number }> = {
  night: { cloud: "#5b76bd", cloudOpacity: 0.26, fog: "#0b1a45", hemiSky: "#9db4ff", hemiGround: "#0b1026", key: "#c7d6ff", keyI: 1.4, stars: 1 },
  winter: { cloud: "#dde7f5", cloudOpacity: 0.3, fog: "#2a3a55", hemiSky: "#eef4ff", hemiGround: "#3a4a66", key: "#ffffff", keyI: 1.8, stars: 0.5 },
  summer: { cloud: "#ffb08a", cloudOpacity: 0.26, fog: "#5a1d3c", hemiSky: "#ffd2a8", hemiGround: "#3a1030", key: "#ffc27a", keyI: 2.4, stars: 0.15 },
  rain: { cloud: "#5b6475", cloudOpacity: 0.42, fog: "#10141c", hemiSky: "#7a8599", hemiGround: "#05070a", key: "#aab6cc", keyI: 0.9, stars: 0 },
  autumn: { cloud: "#e3a064", cloudOpacity: 0.28, fog: "#3a1a0c", hemiSky: "#ffcf99", hemiGround: "#2a1206", key: "#ffb36b", keyI: 2, stars: 0.3 },
};

function makeCloudTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  // several overlapping soft puffs make a billowy cloud
  for (let i = 0; i < 26; i++) {
    const x = 128 + (Math.random() - 0.5) * 130;
    const y = 138 + (Math.random() - 0.5) * 60;
    const r = 30 + Math.random() * 55;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, "rgba(255,255,255,0.55)");
    grd.addColorStop(0.5, "rgba(255,255,255,0.22)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(255,255,255,0.6)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function flatShape(points: [number, number][], depth: number) {
  const s = new THREE.Shape();
  s.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) s.lineTo(x, y);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
}

type Light = { sprite: THREE.Sprite; kind: "red" | "green" | "strobe" | "beacon"; phase: number };

/* Low-poly airliner, nose along +x (wrapped so +x maps onto +z for lookAt). */
function buildAirliner(glow: THREE.Texture, tailColor: string) {
  const outer = new THREE.Group();
  const g = new THREE.Group();
  g.rotation.y = -Math.PI / 2;
  outer.add(g);

  const skin = new THREE.MeshStandardMaterial({ color: "#e4eaf5", metalness: 0.35, roughness: 0.45 });
  const dark = new THREE.MeshStandardMaterial({ color: "#8f9ab0", metalness: 0.5, roughness: 0.4 });
  const tail = new THREE.MeshStandardMaterial({ color: tailColor, metalness: 0.3, roughness: 0.5 });

  const fus = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 4.2, 6, 14), skin);
  fus.rotation.z = Math.PI / 2;
  g.add(fus);

  const wing = flatShape(
    [
      [0.8, 0.3],
      [-0.9, 2.9],
      [-1.35, 2.9],
      [-0.6, 0.3],
      [-0.6, -0.3],
      [-1.35, -2.9],
      [-0.9, -2.9],
      [0.8, -0.3],
    ],
    0.06
  );
  wing.rotateX(Math.PI / 2);
  const wings = new THREE.Mesh(wing, skin);
  wings.position.set(0.15, -0.12, 0);
  g.add(wings);

  const tp = flatShape(
    [
      [-1.8, 0.2],
      [-2.4, 1.1],
      [-2.65, 1.1],
      [-2.4, 0.2],
      [-2.4, -0.2],
      [-2.65, -1.1],
      [-2.4, -1.1],
      [-1.8, -0.2],
    ],
    0.04
  );
  tp.rotateX(Math.PI / 2);
  g.add(new THREE.Mesh(tp, skin));

  const fin = flatShape(
    [
      [-1.6, 0.25],
      [-2.45, 1.55],
      [-2.8, 1.55],
      [-2.55, 0.25],
    ],
    0.05
  );
  const finMesh = new THREE.Mesh(fin, tail);
  finMesh.position.z = -0.025;
  g.add(finMesh);

  for (const z of [-1.15, 1.15]) {
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.75, 12), dark);
    eng.rotation.z = Math.PI / 2;
    eng.position.set(0.25, -0.34, z);
    g.add(eng);
  }

  const lights: Light[] = [];
  const addLight = (x: number, y: number, z: number, color: string, kind: Light["kind"], size: number) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    sp.position.set(x, y, z);
    sp.scale.setScalar(size);
    g.add(sp);
    lights.push({ sprite: sp, kind, phase: Math.random() * 10 });
  };
  addLight(-1.3, -0.1, 2.95, "#ff3b3b", "red", 0.7);
  addLight(-1.3, -0.1, -2.95, "#3bff8a", "green", 0.7);
  addLight(-2.8, 1.6, 0, "#ffffff", "strobe", 1.4);
  addLight(0, 0.4, 0, "#ff5050", "beacon", 0.8);

  // engine exhaust points (in g-space) used to seed contrails
  const exhaust = [new THREE.Vector3(-0.2, -0.34, -1.15), new THREE.Vector3(-0.2, -0.34, 1.15)];
  return { outer, inner: g, lights, exhaust };
}

/* Small delta-wing jet with afterburner glow. */
function buildJet(glow: THREE.Texture) {
  const outer = new THREE.Group();
  const g = new THREE.Group();
  g.rotation.y = -Math.PI / 2;
  outer.add(g);
  const mat = new THREE.MeshStandardMaterial({ color: "#aab4c8", metalness: 0.6, roughness: 0.35 });
  const fus = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 2.2, 4, 10), mat);
  fus.rotation.z = Math.PI / 2;
  g.add(fus);
  const wing = flatShape(
    [
      [0.6, 0.15],
      [-0.9, 1.25],
      [-1.15, 1.25],
      [-0.95, 0.15],
      [-0.95, -0.15],
      [-1.15, -1.25],
      [-0.9, -1.25],
      [0.6, -0.15],
    ],
    0.04
  );
  wing.rotateX(Math.PI / 2);
  g.add(new THREE.Mesh(wing, mat));
  for (const z of [-0.18, 0.18]) {
    const fin = flatShape(
      [
        [-0.7, 0.1],
        [-1.2, 0.75],
        [-1.4, 0.75],
        [-1.25, 0.1],
      ],
      0.03
    );
    const m = new THREE.Mesh(fin, mat);
    m.position.z = z;
    m.rotation.x = z > 0 ? -0.25 : 0.25;
    g.add(m);
  }
  const burner = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: "#ff9a3c", blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  burner.position.set(-1.45, 0, 0);
  burner.scale.set(1.3, 0.7, 1);
  g.add(burner);
  const lights: Light[] = [{ sprite: burner, kind: "beacon", phase: 0 }];
  return { outer, inner: g, lights, exhaust: [new THREE.Vector3(-1.3, 0, 0)], burner };
}

/* Fading trail (additive; colour fades to black = fades out). Lines for contrails, points for comets. */
class Trail {
  points: THREE.Points | THREE.Line;
  private pos: Float32Array;
  private col: Float32Array;
  private n: number;
  private base: THREE.Color;
  private times: Float32Array;
  private maxAge: number;
  constructor(n: number, color: string, size: number, glow: THREE.Texture, asLine = false, maxAge = Infinity) {
    this.n = n;
    this.times = new Float32Array(n).fill(-1e9);
    this.maxAge = maxAge;
    this.pos = new Float32Array(n * 3).fill(9999);
    this.col = new Float32Array(n * 3);
    this.base = new THREE.Color(color);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(this.col, 3));
    this.points = asLine
      ? new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }))
      : new THREE.Points(
          geo,
          new THREE.PointsMaterial({ size, map: glow, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, sizeAttenuation: true })
        );
    this.points.frustumCulled = false;
  }
  push(v: THREE.Vector3, now = performance.now() / 1000) {
    // shift so vertex 0 is the newest (keeps line segments in order)
    this.pos.copyWithin(3, 0, (this.n - 1) * 3);
    this.times.copyWithin(1, 0, this.n - 1);
    this.pos.set([v.x, v.y, v.z], 0);
    this.times[0] = now;
    for (let i = 0; i < this.n; i++) {
      // unfilled slots collapse onto the previous vertex so no stray segment is drawn
      const age = now - this.times[i];
      if (this.pos[i * 3] === 9999 || age > this.maxAge) {
        const j = Math.max(0, i - 1);
        this.pos.copyWithin(i * 3, j * 3, j * 3 + 3);
      }
      // fade by real time (so trails are equally short on slow and fast devices)
      const f = Math.pow(Math.max(0, 1 - Math.max(i / this.n, age / this.maxAge)), 1.6);
      this.col[i * 3] = this.base.r * f;
      this.col[i * 3 + 1] = this.base.g * f;
      this.col[i * 3 + 2] = this.base.b * f;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
  clear() {
    this.pos.fill(9999);
    this.times.fill(-1e9);
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}

type Flight = {
  obj: ReturnType<typeof buildAirliner> | ReturnType<typeof buildJet>;
  curve: THREE.CatmullRomCurve3;
  period: number;
  duration: number;
  offset: number;
  trails: Trail[];
  lastTangent: THREE.Vector3;
  formation?: THREE.Vector3;
};

export default function Hero3D({ weather }: { weather: Weather }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const weatherRef = useRef(weather);
  weatherRef.current = weather;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";

    const scene = new THREE.Scene();
    const t0 = THEME[weatherRef.current];
    scene.fog = new THREE.FogExp2(t0.fog, 0.006);
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 600);
    camera.position.set(0, 0, 18);

    const hemi = new THREE.HemisphereLight(t0.hemiSky, t0.hemiGround, 1.1);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(t0.key, t0.keyI);
    key.position.set(-10, 14, 10);
    scene.add(key);
    const bolt = new THREE.PointLight("#cfd8ff", 0, 120, 1.2);
    scene.add(bolt);

    const glow = makeGlowTexture();
    const cloudTex = [makeCloudTexture(), makeCloudTexture(), makeCloudTexture()];

    // ---- stars ----
    const starGeo = new THREE.BufferGeometry();
    const sp = new Float32Array(1400 * 3);
    for (let i = 0; i < 1400; i++) {
      const r = 250 + Math.random() * 80;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 1.6 - 0.6);
      sp.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), -Math.abs(r * Math.sin(ph) * Math.sin(th))], i * 3);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const starMat = new THREE.PointsMaterial({ size: 1.6, map: glow, color: "#dfe8ff", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ---- clouds ----
    const clouds: { s: THREE.Sprite; v: number; baseOpacity: number }[] = [];
    const cloudGroup = new THREE.Group();
    scene.add(cloudGroup);
    const placeCloud = (s: THREE.Sprite, zStart?: number) => {
      const edge = Math.random() < 0.85;
      const side = Math.random() < 0.5 ? -1 : 1;
      const z = zStart ?? -110 + Math.random() * 115;
      // centre clouds stay far back so they never smother the headline
      const x = edge ? side * (16 + Math.random() * 30) : (Math.random() - 0.5) * 40;
      s.position.set(x, -9 + Math.random() * 24, edge ? z : Math.min(z, -70));
      const sc = 16 + Math.random() * 26;
      s.scale.set(sc * 1.6, sc, 1);
    };
    for (let i = 0; i < 52; i++) {
      const m = new THREE.SpriteMaterial({ map: cloudTex[i % 3], color: t0.cloud, transparent: true, depthWrite: false, opacity: t0.cloudOpacity });
      const s = new THREE.Sprite(m);
      placeCloud(s);
      cloudGroup.add(s);
      clouds.push({ s, v: 0.6 + Math.random() * 1.2, baseOpacity: 0.6 + Math.random() * 0.4 });
    }

    // ---- flights ----
    const flights: Flight[] = [];
    const addFlight = (obj: Flight["obj"], pts: number[][], period: number, duration: number, offset: number, trailColor: string, formation?: THREE.Vector3) => {
      scene.add(obj.outer);
      const trails = obj.exhaust.map(() => {
        const tr = new Trail(60, trailColor, 1.1, glow, true, 0.9);
        scene.add(tr.points);
        return tr;
      });
      flights.push({
        obj,
        curve: new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
        period,
        duration,
        offset,
        trails,
        lastTangent: new THREE.Vector3(1, 0, 0),
        formation,
      });
    };
    // crosses the middle through the cloud banks, banking gently
    addFlight(buildAirliner(glow, "#7c3aed"), [[-60, 1, -30], [-18, 3, -12], [4, 2.5, -9], [26, 5, -14], [70, 8, -30]], 30, 22, 0, "#7f93bd");
    // cinematic flyby: comes out of the distance straight toward the camera, climbing overhead
    addFlight(buildAirliner(glow, "#0ea5e9"), [[-8, -3, -170], [-3, -0.5, -80], [1, 2.5, -25], [3, 7, 4], [4, 18, 30]], 38, 17, 12, "#8394b8");
    // high and far, the other direction
    addFlight(buildAirliner(glow, "#f43f5e"), [[80, 12, -90], [0, 14, -100], [-80, 13, -95]], 46, 40, 24, "#6f7fa6");
    // three-ship jet formation sweeping past
    const jetPath = [[60, -5, -45], [20, -1, -20], [-8, 1, -12], [-30, 4, -18], [-70, 9, -40]];
    const offsets = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(-2.2, -0.6, -2.4), new THREE.Vector3(-2.2, -0.6, 2.4)];
    offsets.forEach((o) => addFlight(buildJet(glow), jetPath, 34, 8, 6, "#b08a6a", o));

    // ---- distant night traffic (lights only) ----
    const traffic: { g: THREE.Group; red: THREE.Sprite; green: THREE.Sprite; strobe: THREE.Sprite; speed: number; phase: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const g = new THREE.Group();
      const mk = (c: string, s: number) => {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: c, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
        sp.scale.setScalar(s);
        g.add(sp);
        return sp;
      };
      const red = mk("#ff3b3b", 1.6);
      red.position.x = -0.8;
      const green = mk("#3bff8a", 1.6);
      green.position.x = 0.8;
      const strobe = mk("#ffffff", 2.6);
      g.position.set(-120 + Math.random() * 240, 10 + Math.random() * 40, -160 - Math.random() * 60);
      scene.add(g);
      traffic.push({ g, red, green, strobe, speed: (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 2.5), phase: Math.random() * 10 });
    }

    // ---- comets & shooting stars ----
    type Comet = { head: THREE.Sprite; trail: Trail; vel: THREE.Vector3; life: number; next: number; big: boolean };
    const comets: Comet[] = [];
    const spawnComet = (c: Comet) => {
      const fromLeft = Math.random() < 0.5;
      c.head.position.set(fromLeft ? -120 : 120, 40 + Math.random() * 50, -140 - Math.random() * 40);
      const sp = c.big ? 18 + Math.random() * 8 : 70 + Math.random() * 40;
      c.vel.set((fromLeft ? 1 : -1) * sp, -(c.big ? 3 : 25) - Math.random() * 6, 0);
      c.life = 0;
      c.trail.clear();
    };
    for (let i = 0; i < 5; i++) {
      const big = i < 2;
      const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: big ? "#bfe3ff" : "#ffffff", blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
      head.scale.setScalar(big ? 7 : 3);
      scene.add(head);
      const trail = new Trail(big ? 120 : 40, big ? "#7cc4ff" : "#dbeafe", big ? 5 : 2.2, glow, false, big ? 1.6 : 0.4);
      (trail.points.material as THREE.PointsMaterial).fog = false;
      scene.add(trail.points);
      const c: Comet = { head, trail, vel: new THREE.Vector3(), life: 0, next: 1 + i * (big ? 7 : 3), big };
      head.visible = false;
      comets.push(c);
    }

    // ---- lightning bolt geometry ----
    const boltMat = new THREE.LineBasicMaterial({ color: "#e8eeff", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, fog: false });
    const boltLine = new THREE.Line(new THREE.BufferGeometry(), boltMat);
    scene.add(boltLine);
    let flash = 0;
    const offLightning = onLightning((x) => {
      flash = 1;
      const bx = (x - 0.5) * 60;
      const pts: THREE.Vector3[] = [];
      let px = bx;
      for (let i = 0; i <= 14; i++) {
        pts.push(new THREE.Vector3(px, 22 - i * 2.4, -45));
        px += (Math.random() - 0.5) * 3.2;
      }
      boltLine.geometry.dispose();
      boltLine.geometry = new THREE.BufferGeometry().setFromPoints(pts);
      bolt.position.set(bx, 10, -30);
    });

    // ---- interaction ----
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / innerWidth - 0.5;
      mouse.ty = e.clientY / innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w < 700 ? 70 : 55;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(mount);

    // theme cross-fade state
    const cloudCol = new THREE.Color(t0.cloud);
    const fogCol = new THREE.Color(t0.fog);
    let cloudOp = t0.cloudOpacity;
    let starOp = t0.stars;

    const clock = new THREE.Clock();
    const tmp = new THREE.Vector3();
    const tmp2 = new THREE.Vector3();
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible || document.hidden) {
        clock.getDelta();
        return;
      }
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const th = THEME[weatherRef.current];

      // cross-fade theme
      cloudCol.lerp(new THREE.Color(th.cloud), 0.03);
      fogCol.lerp(new THREE.Color(th.fog), 0.03);
      (scene.fog as THREE.FogExp2).color.copy(fogCol);
      cloudOp += (th.cloudOpacity - cloudOp) * 0.03;
      starOp += (th.stars - starOp) * 0.03;
      hemi.color.lerp(new THREE.Color(th.hemiSky), 0.03);
      hemi.groundColor.lerp(new THREE.Color(th.hemiGround), 0.03);
      key.color.lerp(new THREE.Color(th.key), 0.03);
      key.intensity += (th.keyI - key.intensity) * 0.03;

      // camera: mouse parallax + scroll dolly into the clouds
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      const scrollP = Math.min(1, window.scrollY / innerHeight);
      camera.position.x = mouse.x * 3;
      camera.position.y = -mouse.y * 1.6 + scrollP * 2;
      camera.position.z = 18 - scrollP * 14;
      camera.lookAt(mouse.x * 1.2, -mouse.y * 0.6, -20);

      // stars
      stars.rotation.y = t * 0.004;
      starMat.opacity = starOp * (0.75 + Math.sin(t * 2) * 0.05);

      // lightning
      flash *= 0.88;
      const f = flash > 0.02 ? flash * (0.6 + Math.random() * 0.4) : 0;
      bolt.intensity = f * 900;
      boltMat.opacity = flash > 0.35 ? f : 0;

      // clouds drift toward the camera and recycle
      for (const c of clouds) {
        c.s.position.z += c.v * dt * 2.2;
        c.s.position.x += Math.sin(t * 0.05 + c.v) * dt * 0.2;
        if (c.s.position.z > camera.position.z - 1) placeCloud(c.s, -115);
        const m = c.s.material as THREE.SpriteMaterial;
        m.color.copy(cloudCol).lerp(new THREE.Color("#ffffff"), f * 0.8);
        // fade in from the distance, fade out right before passing the lens
        const near = THREE.MathUtils.smoothstep(camera.position.z - c.s.position.z, 2, 12);
        const far = 1 - THREE.MathUtils.smoothstep(-c.s.position.z, 80, 115);
        m.opacity = cloudOp * c.baseOpacity * near * far;
      }

      // flights
      for (const fl of flights) {
        const local = ((t + fl.offset) % fl.period) / fl.duration;
        const active = local <= 1;
        fl.obj.outer.visible = active;
        if (!active) {
          if (local < 1.05) fl.trails.forEach((tr) => tr.clear());
          continue;
        }
        const u = THREE.MathUtils.clamp(local, 0.0001, 0.9999);
        const p = fl.curve.getPointAt(u, tmp);
        const tan = fl.curve.getTangentAt(u, tmp2).normalize();
        if (fl.formation) p.add(fl.formation);
        fl.obj.outer.position.copy(p);
        fl.obj.outer.lookAt(p.x + tan.x, p.y + tan.y, p.z + tan.z);
        // bank into the turn: roll from change in heading
        const turn = fl.lastTangent.x * tan.z - fl.lastTangent.z * tan.x;
        fl.obj.outer.rotateZ(THREE.MathUtils.clamp(-turn * 60, -0.6, 0.6));
        fl.lastTangent.lerp(tan, 0.08);
        fl.obj.outer.updateMatrixWorld(true);
        fl.obj.exhaust.forEach((e, i) => fl.trails[i].push(fl.obj.inner.localToWorld(e.clone())));
        for (const l of fl.obj.lights) {
          const m = l.sprite.material as THREE.SpriteMaterial;
          if (l.kind === "strobe") m.opacity = (t * 1.1 + l.phase) % 1.2 < 0.08 ? 1 : 0;
          else if (l.kind === "beacon") m.opacity = 0.5 + 0.5 * Math.sin(t * 6 + l.phase);
          else m.opacity = 0.85;
        }
      }

      // night traffic
      for (const tr of traffic) {
        tr.g.position.x += tr.speed * dt;
        if (tr.g.position.x > 140) tr.g.position.x = -140;
        if (tr.g.position.x < -140) tr.g.position.x = 140;
        const b = 0.5 + 0.5 * Math.sin(t * 5 + tr.phase);
        (tr.red.material as THREE.SpriteMaterial).opacity = b;
        (tr.green.material as THREE.SpriteMaterial).opacity = 1 - b;
        (tr.strobe.material as THREE.SpriteMaterial).opacity = (t + tr.phase) % 1.6 < 0.07 ? 1 : 0;
      }

      // comets
      for (const c of comets) {
        if (!c.head.visible) {
          if (t > c.next) {
            spawnComet(c);
            c.head.visible = true;
          }
          continue;
        }
        c.life += dt;
        c.head.position.addScaledVector(c.vel, dt);
        c.trail.push(c.head.position);
        (c.head.material as THREE.SpriteMaterial).opacity = Math.min(1, c.life * 2) * (0.8 + Math.random() * 0.2) * Math.max(starOp, 0.35);
        if (Math.abs(c.head.position.x) > 135 || c.life > (c.big ? 14 : 3)) {
          c.head.visible = false;
          c.trail.clear();
          c.next = t + (c.big ? 10 + Math.random() * 12 : 3 + Math.random() * 6);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      offLightning();
      window.removeEventListener("pointermove", onMove);
      renderer.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      glow.dispose();
      cloudTex.forEach((c) => c.dispose());
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />;
}
