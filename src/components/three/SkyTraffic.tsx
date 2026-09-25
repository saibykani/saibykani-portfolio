"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { adaptiveResolution } from "@/components/three/adaptive";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { onLightning, useWeather } from "@/components/weather/WeatherContext";
import { currentPhase, type SkyPhase } from "@/components/ui/TimeSky";
import { buildAirliner, buildJet, type Aircraft } from "@/components/three/aircraft";

/* ---------------------------------------------------------------------------
 * Full-page 3D air traffic over the real photo themes: detailed airliners and a
 * jet formation flying straight lines with contrails, nav strobes and lit cabins.
 * Clouds + a camera dolly in the hero; lighting follows the visitor's time of day.
 * ------------------------------------------------------------------------- */

type SkyTheme = { cloud: string; cloudOpacity: number; fog: string; hemiSky: string; hemiGround: string; key: string; keyI: number; stars: number };
const THEME: Record<SkyPhase | "rain", SkyTheme> = {
  sunrise: { cloud: "#ffc9a8", cloudOpacity: 0.22, fog: "#4a2a4a", hemiSky: "#ffd9b8", hemiGround: "#2a1a30", key: "#ffb98a", keyI: 2.3, stars: 0 },
  day: { cloud: "#ffffff", cloudOpacity: 0.2, fog: "#6a8bb5", hemiSky: "#ffffff", hemiGround: "#5a6b80", key: "#fff6e8", keyI: 2.7, stars: 0 },
  sunset: { cloud: "#ff9a6a", cloudOpacity: 0.24, fog: "#4a1d30", hemiSky: "#ffc7a0", hemiGround: "#301020", key: "#ff9a5a", keyI: 2.3, stars: 0.15 },
  night: { cloud: "#5b76bd", cloudOpacity: 0.22, fog: "#0b1a45", hemiSky: "#9db4ff", hemiGround: "#0b1026", key: "#c7d6ff", keyI: 1.6, stars: 1 },
  rain: { cloud: "#5b6475", cloudOpacity: 0.4, fog: "#10141c", hemiSky: "#7a8599", hemiGround: "#05070a", key: "#aab6cc", keyI: 1, stars: 0 },
};

function makeCloudTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
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

/* Time-based fading line trail (additive; colour fades to black). */
class Trail {
  line: THREE.Line;
  private pos: Float32Array;
  private col: Float32Array;
  private times: Float32Array;
  private n: number;
  private base: THREE.Color;
  private maxAge: number;
  constructor(n: number, color: string, maxAge: number) {
    this.n = n;
    this.maxAge = maxAge;
    this.pos = new Float32Array(n * 3).fill(9999);
    this.col = new Float32Array(n * 3);
    this.times = new Float32Array(n).fill(-1e9);
    this.base = new THREE.Color(color);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(this.col, 3));
    this.line = new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    this.line.frustumCulled = false;
  }
  push(v: THREE.Vector3, now: number) {
    this.pos.copyWithin(3, 0, (this.n - 1) * 3);
    this.times.copyWithin(1, 0, this.n - 1);
    this.pos.set([v.x, v.y, v.z], 0);
    this.times[0] = now;
    for (let i = 0; i < this.n; i++) {
      const age = now - this.times[i];
      if (this.pos[i * 3] === 9999 || age > this.maxAge) this.pos.copyWithin(i * 3, Math.max(0, i - 1) * 3, Math.max(0, i - 1) * 3 + 3);
      const f = Math.pow(Math.max(0, 1 - Math.max(i / this.n, age / this.maxAge)), 1.6);
      this.col[i * 3] = this.base.r * f;
      this.col[i * 3 + 1] = this.base.g * f;
      this.col[i * 3 + 2] = this.base.b * f;
    }
    this.line.geometry.attributes.position.needsUpdate = true;
    this.line.geometry.attributes.color.needsUpdate = true;
  }
  clear() {
    this.pos.fill(9999);
    this.times.fill(-1e9);
    this.line.geometry.attributes.position.needsUpdate = true;
  }
}

/* Twinkling star points: per-star size, phase and colour temperature, soft halo + spikes. */
function makeStarMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 }, uScale: { value: 1 } },
    vertexShader: `
      attribute float aSize; attribute float aPhase; attribute vec3 aColor;
      uniform float uTime; uniform float uScale;
      varying vec3 vColor; varying float vTw;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vTw = 0.6 + 0.4 * sin(uTime * (0.8 + aPhase * 0.25) + aPhase * 6.2831);
        vColor = aColor;
        gl_PointSize = aSize * uScale * (0.75 + 0.35 * vTw);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uOpacity; varying vec3 vColor; varying float vTw;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float core = smoothstep(0.18, 0.0, d);
        float halo = smoothstep(0.5, 0.0, d) * 0.35;
        float spikes = (smoothstep(0.02, 0.0, abs(c.x)) + smoothstep(0.02, 0.0, abs(c.y))) * smoothstep(0.5, 0.0, d) * 0.35;
        float a = (core + halo + spikes) * vTw * uOpacity;
        gl_FragColor = vec4(vColor * a, a);
      }`,
  });
}

function starPoints(positions: number[], sizes: number[], colors: number[]) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
  geo.setAttribute("aPhase", new THREE.Float32BufferAttribute(sizes.map(() => Math.random() * 10), 1));
  geo.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));
  return geo;
}

const STAR_TINTS = [
  [0.75, 0.84, 1.0],
  [1.0, 1.0, 1.0],
  [1.0, 0.93, 0.8],
  [1.0, 0.82, 0.62],
  [0.82, 0.9, 1.0],
];

type Flight = { obj: Aircraft; from: THREE.Vector3; to: THREE.Vector3; period: number; duration: number; offset: number; trails: Trail[]; formation?: THREE.Vector3 };

export default function SkyTraffic() {
  const { weather } = useWeather();
  const mountRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<SkyPhase | "rain">("night");
  themeRef.current = weather === "rain" ? "rain" : currentPhase();

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cleanup = () => {};
    let cancelled = false;
    const ric = (window as any).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 250));
    const handle = ric(() => {
      if (!cancelled) cleanup = init(mountEl) ?? (() => {});
    }, { timeout: 900 });
    return () => {
      cancelled = true;
      ((window as any).cancelIdleCallback ?? clearTimeout)(handle);
      cleanup();
    };
  }, []);

  function init(mount: HTMLDivElement): (() => void) | void {

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
    } catch {
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 1);
    renderer.setPixelRatio(dpr);
    const tuneRes = adaptiveResolution(dpr, 0.5, (r) => {
      renderer.setPixelRatio(r);
      renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";

    const scene = new THREE.Scene();
    const t0 = THEME[themeRef.current];
    scene.fog = new THREE.FogExp2(t0.fog, 0.0045);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.55;

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 700);
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

    // ---- stargazing sky ----
    const skyGroup = new THREE.Group();
    scene.add(skyGroup);
    const starMat = makeStarMaterial();
    const onSphere = (dir: THREE.Vector3, r = 300) => dir.normalize().multiplyScalar(r);
    {
      const pos: number[] = [];
      const size: number[] = [];
      const col: number[] = [];
      for (let i = 0; i < 700; i++) {
        const v = onSphere(new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 1.2 - 0.25, -Math.random() * 1.1 - 0.15), 280 + Math.random() * 60);
        pos.push(v.x, v.y, v.z);
        size.push(Math.random() < 0.06 ? 9 + Math.random() * 7 : 2 + Math.random() * 4);
        col.push(...STAR_TINTS[Math.floor(Math.random() * STAR_TINTS.length)]);
      }
      skyGroup.add(new THREE.Points(starPoints(pos, size, col), starMat));
    }
    // ---- clouds ----
    const clouds: { s: THREE.Sprite; v: number; baseOpacity: number }[] = [];
    const placeCloud = (s: THREE.Sprite, zStart?: number) => {
      const edge = Math.random() < 0.85;
      const side = Math.random() < 0.5 ? -1 : 1;
      const z = zStart ?? -110 + Math.random() * 115;
      const x = edge ? side * (16 + Math.random() * 30) : (Math.random() - 0.5) * 40;
      s.position.set(x, -9 + Math.random() * 24, edge ? z : Math.min(z, -70));
      const sc = 16 + Math.random() * 26;
      s.scale.set(sc * 1.6, sc, 1);
    };
    for (let i = 0; i < 14; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex[i % 3], color: t0.cloud, transparent: true, depthWrite: false, opacity: t0.cloudOpacity }));
      placeCloud(s);
      scene.add(s);
      clouds.push({ s, v: 0.6 + Math.random() * 1.2, baseOpacity: 0.6 + Math.random() * 0.4 });
    }

    // ---- straight-line flights ----
    const flights: Flight[] = [];
    const addFlight = (obj: Aircraft, from: number[], to: number[], period: number, duration: number, offset: number, trailColor: string, formation?: THREE.Vector3, trailAge = 1.1) => {
      scene.add(obj.outer);
      const trails = obj.exhaust.map(() => {
        const tr = new Trail(60, trailColor, trailAge);
        scene.add(tr.line);
        return tr;
      });
      flights.push({ obj, from: new THREE.Vector3(from[0], from[1], from[2]), to: new THREE.Vector3(to[0], to[1], to[2]), period, duration, offset, trails, formation });
    };
    addFlight(buildAirliner(glow, "#7c3aed"), [-75, 1.5, -26], [75, 4, -26], 34, 26, 0, "#7f93bd");
    addFlight(buildAirliner(glow, "#0ea5e9"), [80, 9, -72], [-80, 10.5, -72], 48, 42, 10, "#6f7fa6");
    addFlight(buildAirliner(glow, "#f43f5e"), [-2, -1.5, -230], [2.5, 7, 12], 42, 17, 21, "#5d6a88", undefined, 0.25); // head-on approach
    addFlight(buildAirliner(glow, "#f59e0b"), [-95, 15, -120], [95, 17, -120], 64, 58, 32, "#5f6f96");
    // more traffic: extra airliners at different altitudes, depths and directions
    addFlight(buildAirliner(glow, "#10b981"), [90, -4, -48], [-90, -2.5, -48], 40, 30, 16, "#6a7fa8");
    addFlight(buildAirliner(glow, "#38bdf8"), [100, 5, -95], [-100, 7, -95], 55, 50, 3, "#5d6d96");
    const jetOffsets = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(2.4, -0.6, -2.4), new THREE.Vector3(2.4, -0.6, 2.4)];
    jetOffsets.forEach((o) => addFlight(buildJet(glow), [72, -2, -38], [-72, 1, -38], 36, 7, 6, "#b08a6a", o));

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
      g.position.set(-120 + Math.random() * 240, 12 + Math.random() * 40, -160 - Math.random() * 60);
      scene.add(g);
      traffic.push({ g, red, green, strobe, speed: (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 2.5), phase: Math.random() * 10 });
    }

    // ---- lightning ----
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
      const sc = dpr * Math.min(1.2, h / 900);
      starMat.uniforms.uScale.value = sc;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let visible = true;
    const io = new IntersectionObserver((es) => {
      for (const e of es) visible = !(e.isIntersecting && e.intersectionRect.height > innerHeight * 0.5);
      mount.style.opacity = visible ? "1" : "0";
    }, { threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35] });
    document.querySelectorAll("[data-sky-off]").forEach((el) => io.observe(el));

    const cloudCol = new THREE.Color(t0.cloud);
    const fogCol = new THREE.Color(t0.fog);
    const target = { cloud: new THREE.Color(), fog: new THREE.Color(), hs: new THREE.Color(), hg: new THREE.Color(), key: new THREE.Color() };
    let cloudOp = t0.cloudOpacity;
    let starOp = t0.stars;
    const clock = new THREE.Clock();
    const tmp = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const white = new THREE.Color("#ffffff");
    let raf = 0;
    let frameAcc = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible || document.hidden) {
        clock.getDelta();
        return;
      }
      // cap at ~30fps: smooth enough for slow cruising aircraft, half the GPU work
      const tick = clock.getDelta();
      tuneRes(tick);
      frameAcc += tick;
      if (frameAcc < 1 / 31) return;
      const rawDt = frameAcc;
      frameAcc = 0;
      const dt = Math.min(rawDt, 0.05);
      const t = clock.elapsedTime;
      const th = THEME[themeRef.current];

      const scrollP = Math.min(1, window.scrollY / innerHeight);
      // cross-fade theme
      cloudCol.lerp(target.cloud.set(th.cloud), 0.03);
      fogCol.lerp(target.fog.set(th.fog), 0.03);
      (scene.fog as THREE.FogExp2).color.copy(fogCol);
      cloudOp += (th.cloudOpacity - cloudOp) * 0.03;
      starOp += (th.stars - starOp) * 0.03;
      hemi.color.lerp(target.hs.set(th.hemiSky), 0.03);
      hemi.groundColor.lerp(target.hg.set(th.hemiGround), 0.03);
      key.color.lerp(target.key.set(th.key), 0.03);
      key.intensity += (th.keyI - key.intensity) * 0.03;

      // camera: mouse parallax + scroll dolly into the clouds
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      camera.position.set(mouse.x * 3, -mouse.y * 1.6 + scrollP * 2, 18 - scrollP * 8);
      camera.lookAt(mouse.x * 1.2, -mouse.y * 0.6, -20);

      // stars (night only): slow sidereal drift + twinkle, hero only
      skyGroup.visible = starOp * (1 - scrollP) > 0.01;
      skyGroup.rotation.y = t * 0.0035;
      starMat.uniforms.uTime.value = t;
      starMat.uniforms.uOpacity.value = starOp * (1 - scrollP);

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
        m.color.copy(cloudCol).lerp(white, f * 0.8);
        const near = THREE.MathUtils.smoothstep(camera.position.z - c.s.position.z, 2, 12);
        const far = 1 - THREE.MathUtils.smoothstep(-c.s.position.z, 80, 115);
        m.opacity = cloudOp * c.baseOpacity * near * far * (1 - scrollP);
        c.s.visible = m.opacity > 0.005;
      }

      // straight-line flights
      const now = performance.now() / 1000;
      for (const fl of flights) {
        const local = ((t + fl.offset) % fl.period) / fl.duration;
        const active = local <= 1;
        fl.obj.outer.visible = active;
        if (!active) {
          fl.trails.forEach((tr) => tr.clear());
          continue;
        }
        const p = tmp.lerpVectors(fl.from, fl.to, local);
        if (fl.formation) p.add(fl.formation);
        dir.subVectors(fl.to, fl.from).normalize();
        fl.obj.outer.position.copy(p);
        fl.obj.outer.lookAt(p.x + dir.x, p.y + dir.y, p.z + dir.z);
        fl.obj.outer.updateMatrixWorld(true);
        fl.obj.exhaust.forEach((e, i) => fl.trails[i].push(fl.obj.inner.localToWorld(e.clone()), now));
        for (const l of fl.obj.lights) {
          const m = l.sprite.material as THREE.SpriteMaterial;
          if (l.kind === "strobe") m.opacity = (t * 1.1 + l.phase) % 1.2 < 0.08 ? 1 : 0;
          else if (l.kind === "beacon") m.opacity = 0.5 + 0.5 * Math.sin(t * 6 + l.phase);
          else m.opacity = 0.9;
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

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      offLightning();
      window.removeEventListener("pointermove", onMove);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      glow.dispose();
      cloudTex.forEach((c) => c.dispose());
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }

  return <div ref={mountRef} className="pointer-events-none fixed inset-0 z-[1] transition-opacity duration-700 no-print" aria-hidden="true" />;
}
