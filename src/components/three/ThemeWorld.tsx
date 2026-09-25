"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import { WORLD_META, type Ctx, type World, type WorldId } from "./worlds/common";
import { adaptiveResolution } from "./adaptive";
import { onLightning, useWeather, type Weather } from "@/components/weather/WeatherContext";

/* Each world lives in its own chunk and is only downloaded when its section is near. */
const LOADERS: Record<WorldId, () => Promise<(ctx: Ctx) => World>> = {
  milkyway: () => import("./worlds/milkyway").then((m) => m.milkyway),
  nyc: () => import("./worlds/nyc").then((m) => m.nyc),
  ocean: () => import("./worlds/ocean").then((m) => m.ocean),
  jungle: () => import("./worlds/jungle").then((m) => m.jungle),
  port: () => import("./worlds/port").then((m) => m.port),
  dragon: () => import("./worlds/dragon").then((m) => m.dragon),
};

type Particle = "snow" | "rain" | "leaves" | "fireflies";

/* Seasonal look applied on top of every world. */
const SEASON: Record<Weather, { tint: string; blend: string; exposure: number; particle: "none" | Particle }> = {
  night: { tint: "transparent", blend: "normal", exposure: 1.0, particle: "none" },
  winter: { tint: "rgba(186,220,255,0.35)", blend: "soft-light", exposure: 1.02, particle: "snow" },
  summer: { tint: "rgba(255,190,90,0.32)", blend: "soft-light", exposure: 1.15, particle: "fireflies" },
  rain: { tint: "rgba(30,41,59,0.45)", blend: "multiply", exposure: 0.78, particle: "rain" },
  autumn: { tint: "rgba(234,120,40,0.3)", blend: "soft-light", exposure: 1.02, particle: "leaves" },
};

type Section = { el: HTMLElement; id: WorldId | "none" };

function scanSections(): Section[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-world]")).map((el) => ({ el, id: (el.dataset.world as WorldId | "none") ?? "none" }));
}

/* 3D weather particles that follow the camera through whatever world is showing (GPU-animated). */
function seasonLayer(kind: Particle, lite: boolean) {
  const N = { snow: lite ? 900 : 2200, rain: lite ? 1400 : 3200, leaves: lite ? 240 : 520, fireflies: lite ? 200 : 420 }[kind];
  const pos = new Float32Array(N * 3);
  const ph = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos.set([Math.random() * 60 - 30, Math.random() * 30, Math.random() * 60 - 30], i * 3);
    ph[i] = Math.random() * 10;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aP", new THREE.BufferAttribute(ph, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const cfg = {
    snow: { fall: 1.6, sway: 0.9, size: 9, color: "vec3(1.0)", shape: "smoothstep(0.5, 0.1, d)" },
    rain: { fall: 26, sway: 0.0, size: 22, color: "vec3(0.72, 0.8, 0.95)", shape: "smoothstep(0.06, 0.0, abs(c.x)) * smoothstep(0.5, 0.2, abs(c.y)) * 0.8" },
    leaves: { fall: 1.8, sway: 2.2, size: 16, color: "mix(vec3(0.95,0.45,0.1), vec3(0.8,0.15,0.08), fract(vP*3.7))", shape: "smoothstep(0.5, 0.42, length(vec2(r.x*1.9, r.y)))" },
    fireflies: { fall: -0.25, sway: 1.4, size: 11, color: "vec3(1.0, 0.85, 0.35)", shape: "smoothstep(0.5, 0.0, d) * (0.4 + 0.6 * sin(uTime * 3.0 + vP * 5.0))" },
  }[kind];
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: kind === "fireflies" ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uFade: { value: 0 }, uPx: { value: Math.min(window.devicePixelRatio || 1, 1.5) } },
    vertexShader: `attribute float aP; uniform float uTime, uPx; uniform vec3 uCam; varying float vP;
      void main(){ vP = aP; vec3 p = position;
        p.y = mod(p.y - uTime * ${cfg.fall.toFixed(2)} * (0.7 + fract(aP) * 0.6), 30.0);
        p.x += sin(uTime * 0.7 + aP) * ${cfg.sway.toFixed(2)};
        p.z += cos(uTime * 0.5 + aP * 1.3) * ${cfg.sway.toFixed(2)} * 0.6;
        vec3 base = vec3(mod(p.x - uCam.x + 30.0, 60.0) - 30.0, p.y - 12.0, mod(p.z - uCam.z + 30.0, 60.0) - 30.0);
        vec4 mv = viewMatrix * vec4(uCam + base, 1.0);
        gl_PointSize = ${cfg.size.toFixed(1)} * uPx * 10.0 / max(1.0, -mv.z);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uTime, uFade; varying float vP;
      void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c);
        float ang = uTime * (0.5 + fract(vP)) + vP; vec2 r = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * c;
        float a = ${cfg.shape};
        gl_FragColor = vec4(${cfg.color}, a * uFade); }`,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  return { pts, mat };
}

/* Fixed full-screen 3D backdrop: each page section gets its own themed world,
 * cross-faded on scroll, with the camera flying through it as you scroll. */
export default function ThemeWorld() {
  const mountRef = useRef<HTMLDivElement>(null);
  const tintRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<WorldId | null>(null);
  const { weather } = useWeather();
  const weatherRef = useRef(weather);
  weatherRef.current = weather;

  useEffect(() => {
    const s = SEASON[weather];
    if (tintRef.current) {
      tintRef.current.style.background = s.tint;
      tintRef.current.style.mixBlendMode = s.blend;
    }
  }, [weather]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // gating (first scroll / idle) happens in ThemeWorldLazy, so start right away
    const cleanup = run(mount);
    return () => cleanup();
  }, []);

  function run(mount: HTMLDivElement) {
    const lite = window.innerWidth < 768 || (navigator.hardwareConcurrency || 8) <= 4;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    } catch {
      return () => {};
    }
    const maxRatio = Math.min(window.devicePixelRatio || 1, lite ? 0.9 : 1.15);
    renderer.setPixelRatio(maxRatio);
    const tuneRes = adaptiveResolution(maxRatio, 0.45, (r) => {
      renderer.setPixelRatio(r);
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setClearColor("#000000");
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";

    const scene = new THREE.Scene();
    const fog = new THREE.FogExp2("#000000", 0.01);
    scene.fog = fog;
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 900);
    camera.position.set(0, 2, 12);

    const worlds = new Map<WorldId, World & { f: number }>();
    const loading = new Set<WorldId>();
    const ensure = (id: WorldId) => {
      if (worlds.has(id) || loading.has(id)) return;
      loading.add(id);
      LOADERS[id]()
        .then((factory) => {
          const w = Object.assign(factory({ lite }), { f: 0 });
          scene.add(w.group);
          // compile shaders now so the first fade-in doesn't hitch
          w.group.visible = true;
          renderer.compile(scene, camera);
          w.group.visible = false;
          worlds.set(id, w);
        })
        .finally(() => loading.delete(id));
    };

    const layers: Partial<Record<Particle, ReturnType<typeof seasonLayer>>> = {};
    const layerFade: Partial<Record<Particle, number>> = {};
    const getLayer = (k: Particle) => {
      if (!layers[k]) {
        layers[k] = seasonLayer(k, lite);
        scene.add(layers[k]!.pts);
        layerFade[k] = 0;
      }
      return layers[k]!;
    };
    let flash = 0;
    const offLightning = onLightning(() => (flash = 1));

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.fov = window.innerWidth < 700 ? 70 : 58;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerWidth - 0.5;
      mouse.ty = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let sections = scanSections();
    let active: WorldId | "none" = "none";
    let activeEl: HTMLElement | null = null;
    let lastLabel: WorldId | "none" = "none";
    let labelTimer: ReturnType<typeof setTimeout> | undefined;
    const bg = new THREE.Color();
    const fogC = new THREE.Color();
    const clock = new THREE.Clock();
    let raf = 0;
    let checkT = 1;
    let exposure = 1;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const raw = clock.getDelta();
      if (document.hidden) return;
      const dt = Math.min(raw, 0.05);
      const fdt = Math.min(raw, 0.5);
      const t = clock.elapsedTime;
      const mid = window.innerHeight * 0.5;

      checkT += fdt;
      if (checkT > 0.2) {
        checkT = 0;
        if (!sections.length || !sections[0].el.isConnected) sections = scanSections();
        active = "none";
        activeEl = null;
        for (const s of sections) {
          const r = s.el.getBoundingClientRect();
          if (r.top <= mid && r.bottom >= mid) {
            active = s.id;
            activeEl = s.el;
          }
          // prebuild worlds for sections coming up within ~1.5 screens
          if (s.id !== "none" && r.top < window.innerHeight * 2.5 && r.bottom > -window.innerHeight) ensure(s.id);
        }
        document.documentElement.dataset.world = active;
        if (active !== lastLabel) {
          lastLabel = active;
          clearTimeout(labelTimer);
          if (active !== "none") {
            setLabel(active);
            labelTimer = setTimeout(() => setLabel(null), 2600);
          } else setLabel(null);
        }
      }

      let total = 0;
      let dens = 0;
      bg.setRGB(0, 0, 0);
      fogC.setRGB(0, 0, 0);
      let lead: (World & { f: number }) | null = null;
      for (const [id, w] of worlds) {
        const target = id === active ? 1 : 0;
        w.f += (target - w.f) * Math.min(1, fdt * 2.4);
        if (w.f < 0.003 && target === 0) w.f = 0;
        w.group.visible = w.f > 0;
        w.fade.set(w.f);
        if (w.f > 0) {
          w.update(t, dt);
          bg.r += w.bg.r * w.f;
          bg.g += w.bg.g * w.f;
          bg.b += w.bg.b * w.f;
          fogC.r += w.fog.r * w.f;
          fogC.g += w.fog.g * w.f;
          fogC.b += w.fog.b * w.f;
          dens += w.fogDensity * w.f;
          total += w.f;
          if (!lead || w.f > lead.f) lead = w;
        }
      }
      mount.style.opacity = String(Math.min(1, total));
      if (total <= 0) return;
      tuneRes(raw);
      fog.color.copy(fogC).multiplyScalar(1 / total);
      fog.density = dens / total;
      renderer.setClearColor(bg.multiplyScalar(1 / total));

      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      let prog = 0.5;
      if (activeEl) {
        const r = activeEl.getBoundingClientRect();
        prog = THREE.MathUtils.clamp((mid - r.top) / Math.max(1, r.height), 0, 1);
      }
      if (lead?.camera) lead.camera(camera, t, prog, mouse);
      else {
        camera.position.set(mouse.x * 2, 2 - mouse.y, 12 - prog * 8);
        camera.lookAt(0, 1, -20);
      }

      const season = SEASON[weatherRef.current];
      exposure += (season.exposure - exposure) * Math.min(1, fdt * 2);
      flash *= 0.86;
      renderer.toneMappingExposure = exposure + (flash > 0.05 ? flash * 1.6 * (0.6 + Math.random() * 0.4) : 0);
      if (flashRef.current) flashRef.current.style.opacity = String(flash > 0.05 ? flash * 0.5 : 0);
      if (season.particle !== "none") getLayer(season.particle);
      for (const k of Object.keys(layers) as Particle[]) {
        const L = layers[k]!;
        const target = k === season.particle ? 1 : 0;
        layerFade[k] = (layerFade[k] ?? 0) + (target - (layerFade[k] ?? 0)) * Math.min(1, fdt * 1.5);
        L.pts.visible = (layerFade[k] ?? 0) > 0.01;
        L.mat.uniforms.uFade.value = (layerFade[k] ?? 0) * Math.min(1, total);
        L.mat.uniforms.uTime.value = t;
        L.mat.uniforms.uCam.value.copy(camera.position);
      }

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(labelTimer);
      offLightning();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      delete document.documentElement.dataset.world;
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }

  return (
    <>
      <div ref={mountRef} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 opacity-0 no-print" />
      {/* seasonal colour grade + storm flash */}
      <div ref={tintRef} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 transition-[background] duration-1000 no-print" />
      <div ref={flashRef} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-indigo-50 opacity-0 no-print" />
      {/* vignette keeps content readable over every world */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.3)_70%,rgba(0,0,0,0.65)_100%)] no-print" />
      <AnimatePresence>
        {label && (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pointer-events-none fixed left-1/2 top-[72px] z-[4800] -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.25em] text-white shadow-border backdrop-blur-xl no-print md:top-20"
          >
            <span className="mr-2">{WORLD_META[label].emoji}</span>
            World · {WORLD_META[label].label}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
