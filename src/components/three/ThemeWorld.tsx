"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import { adaptiveResolution } from "./adaptive";
import { WORLD_META, type Ctx, type World, type WorldId } from "./worlds/common";

/* Each world's code is its own chunk: downloaded only when its section gets close. */
type Factory = (ctx: Ctx) => World;
const LOADERS: Record<WorldId, () => Promise<Factory>> = {
  aurora: () => import("./worlds/mountains").then((m) => m.aurora),
  summit: () => import("./worlds/mountains").then((m) => m.summit),
  alpine: () => import("./worlds/mountains").then((m) => m.alpine),
  city: () => import("./worlds/city").then((m) => m.city),
  jungle: () => import("./worlds/forest").then((m) => m.jungle),
  desert: () => import("./worlds/coast").then((m) => m.desert),
  beach: () => import("./worlds/coast").then((m) => m.beach),
  galaxy: () => import("./worlds/extra").then((m) => m.galaxy),
  balloons: () => import("./worlds/extra").then((m) => m.balloons),
};

/* Worlds whose sections are on screen or within ~1.5 screens: prepared ahead, everything else is freed. */
function nearWorlds(): Set<WorldId> {
  const vh = window.innerHeight;
  const out = new Set<WorldId>();
  document.querySelectorAll<HTMLElement>("[data-world]").forEach((el) => {
    const id = el.dataset.world as WorldId | "none";
    if (id === "none") return;
    const r = el.getBoundingClientRect();
    if (r.top < vh * 2.5 && r.bottom > -vh * 1.5) out.add(id);
  });
  return out;
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose?.();
    const mats = (Array.isArray(m.material) ? m.material : m.material ? [m.material] : []) as THREE.Material[];
    for (const mat of mats) {
      for (const v of Object.values(mat as any)) if (v instanceof THREE.Texture) v.dispose();
      const u = (mat as THREE.ShaderMaterial).uniforms;
      if (u) for (const x of Object.values(u)) if (x?.value instanceof THREE.Texture) x.value.dispose();
      mat.dispose();
    }
    (o as any).dispose?.(); // e.g. Reflector render targets
  });
}

/* ?world=city previews a single world full-screen (handy for design work). */
const forcedWorld = () => {
  const w = new URLSearchParams(window.location.search).get("world");
  return w && w in LOADERS ? (w as WorldId) : null;
};

/* Which [data-world] section crosses the middle of the viewport. */
function activeWorld(): WorldId | "none" {
  const mid = window.innerHeight * 0.5;
  const els = document.querySelectorAll<HTMLElement>("[data-world]");
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.top <= mid && r.bottom >= mid) return (el.dataset.world as WorldId | "none") ?? "none";
  }
  return "none";
}

/* Fixed full-screen 3D backdrop: each page section gets its own themed world, cross-faded on scroll. */
export default function ThemeWorld() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<WorldId | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lite = window.innerWidth < 768;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    } catch {
      return;
    }
    const maxDpr = Math.min(window.devicePixelRatio || 1, lite ? 1 : 1.25);
    renderer.setPixelRatio(maxDpr);
    const tuneRes = adaptiveResolution(maxDpr, 0.6, (r) => {
      renderer.setPixelRatio(r);
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setClearColor("#000000");
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";

    const scene = new THREE.Scene();
    const fog = new THREE.FogExp2("#000000", 0.02);
    scene.fog = fog;
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 600);
    camera.position.set(0, 0.6, 9);

    const worlds = new Map<WorldId, World & { f: number }>();
    const pending = new Set<WorldId>();
    let alive = true;
    let lastScroll = 0;
    const onScroll = () => (lastScroll = performance.now());
    window.addEventListener("scroll", onScroll, { passive: true });
    const ric: (cb: () => void, o?: { timeout: number }) => number = (window as any).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 120));
    // load + build off the critical path; the visible world builds immediately once loaded
    const ensure = (id: WorldId, urgent: boolean) => {
      if (worlds.has(id) || pending.has(id)) return;
      pending.add(id);
      LOADERS[id]()
        .then((factory) => {
          const build = () => {
            if (!alive) return;
            const w = Object.assign(factory({ lite }), { f: 0 });
            w.fade.set(0);
            scene.add(w.group);
            // compile shaders in parallel (KHR_parallel_shader_compile) instead of a blocking first draw
            renderer
              .compileAsync(scene, camera)
              .catch(() => {})
              .finally(() => {
                if (!alive) return;
                w.group.visible = false;
                worlds.set(id, w);
                pending.delete(id);
              });
          };
          // prefetch builds wait until scrolling has paused, so they never stutter a scroll
          const whenCalm = () => (performance.now() - lastScroll > 700 ? ric(build, { timeout: 1500 }) : window.setTimeout(whenCalm, 300));
          if (urgent || id === active) build();
          else whenCalm();
        })
        .catch(() => pending.delete(id));
    };

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.fov = window.innerWidth < 700 ? 72 : 60;
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

    let active: WorldId | "none" = "none";
    let lastLabel: WorldId | "none" = "none";
    let labelTimer: ReturnType<typeof setTimeout> | undefined;
    const bg = new THREE.Color("#000000");
    const fogC = new THREE.Color("#000000");
    const clock = new THREE.Clock();
    let raf = 0;
    let checkT = 0;
    let frameAcc = 0;
    const lowEnd = lite || (navigator.hardwareConcurrency || 8) <= 4;
    const viewPos = new THREE.Vector3(),
      viewLook = new THREE.Vector3();
    const camPos = new THREE.Vector3(0, 0.6, 9),
      camLook = new THREE.Vector3(0, 0.4, -8);

    const loop = () => {
      raf = requestAnimationFrame(loop);
      frameAcc += clock.getDelta();
      if (lowEnd && frameAcc < 1 / 31) return; // phones / low-core laptops: 30fps cap
      const raw = frameAcc;
      frameAcc = 0;
      const dt = Math.min(raw, 0.05); // animation step
      const fdt = Math.min(raw, 0.5); // fades follow real time, even on slow devices
      if (document.hidden) return;
      const t = clock.elapsedTime;
      if (active !== "none") tuneRes(raw);

      checkT += fdt;
      if (checkT > 0.15) {
        checkT = 0;
        active = forcedWorld() ?? activeWorld();
        if (active !== "none") ensure(active, true);
        const near = nearWorlds();
        near.forEach((id) => ensure(id, false));
        // free GPU memory of worlds far away (they rebuild quickly if you scroll back)
        for (const [id, w] of worlds)
          if (id !== active && w.f === 0 && !near.has(id)) {
            scene.remove(w.group);
            disposeObject(w.group);
            worlds.delete(id);
          }
        if (active !== lastLabel) {
          lastLabel = active;
          clearTimeout(labelTimer);
          if (active !== "none") {
            setLabel(active);
            labelTimer = setTimeout(() => setLabel(null), 2600);
          } else setLabel(null);
        }
      }

      // cross-fade worlds
      let total = 0;
      let dens = 0;
      bg.setRGB(0, 0, 0);
      fogC.setRGB(0, 0, 0);
      for (const [id, w] of worlds) {
        const target = id === active ? 1 : 0;
        w.f += (target - w.f) * Math.min(1, fdt * 2.2);
        if (w.f < 0.002 && target === 0) w.f = 0;
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
        }
      }
      mount.style.opacity = String(Math.min(1, total));
      if (total <= 0) return;
      fog.color.copy(fogC).multiplyScalar(1 / total);
      fog.density = dens / total;
      renderer.setClearColor(bg.multiplyScalar(1 / total));

      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      // camera: ease toward the active world's own path, plus pointer sway
      viewPos.set(0, 0.6, 9);
      viewLook.set(0, 0.4, -8);
      const aw = active !== "none" ? worlds.get(active) : undefined;
      aw?.view?.(t, viewPos, viewLook);
      const k = Math.min(1, fdt * 1.5);
      camPos.lerp(viewPos, k);
      camLook.lerp(viewLook, k);
      camera.position.set(camPos.x + mouse.x * 1.4 + Math.sin(t * 0.15) * 0.3, camPos.y - mouse.y * 0.6 + Math.sin(t * 0.2) * 0.15, camPos.z);
      camera.lookAt(camLook.x + mouse.x * 0.5, camLook.y, camLook.z);
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      alive = false;
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      clearTimeout(labelTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
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
  }, []);

  return (
    <>
      <div ref={mountRef} aria-hidden="true" className="theme-world-root pointer-events-none fixed inset-0 -z-10 opacity-0 transition-none no-print" />
      {/* dim + vignette so content stays readable over every world */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.35)_70%,rgba(0,0,0,0.7)_100%)] no-print" />
      <AnimatePresence>
        {label && (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: -10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
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
