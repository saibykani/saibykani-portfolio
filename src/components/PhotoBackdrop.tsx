"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useWeather, type Weather } from "@/components/weather/WeatherContext";
import SceneFX from "@/components/SceneFX";

const SkyTraffic = dynamic(() => import("@/components/three/SkyTraffic"), { ssr: false });

/* Real photography behind each section (Unsplash License), cross-faded on scroll. */
export const SCENES = {
  "alpine-dawn": { label: "Alpine lake at dawn", dim: 0.5 },
  "nyc-night": { label: "New York City", dim: 0.45 },
  "ocean-aerial": { label: "Open ocean", dim: 0.55 },
  "forest-light": { label: "Old-growth forest", dim: 0.5 },
  "dubai-sunset": { label: "Dubai skyline", dim: 0.5 },
  "aurora-peaks": { label: "Aurora borealis", dim: 0.45 },
  "lake-sunset": { label: "Mountain lake at sunset", dim: 0.5 },
  "tokyo-neon": { label: "Tokyo after dark", dim: 0.5 },
  "manhattan-aerial": { label: "Manhattan from above", dim: 0.45 },
} as const;
export type SceneId = keyof typeof SCENES;

const SEASON_TINT: Record<Weather, { tint: string; blend: string }> = {
  night: { tint: "transparent", blend: "normal" },
  winter: { tint: "rgba(186,220,255,0.3)", blend: "soft-light" },
  summer: { tint: "rgba(255,190,90,0.28)", blend: "soft-light" },
  rain: { tint: "rgba(30,41,59,0.4)", blend: "multiply" },
  autumn: { tint: "rgba(234,120,40,0.26)", blend: "soft-light" },
};

type Sec = { el: HTMLElement; id: SceneId | "none" };

export default function PhotoBackdrop() {
  const { weather } = useWeather();
  const [active, setActive] = useState<SceneId | "none">("none");
  const [wanted, setWanted] = useState<Set<SceneId>>(new Set());
  const [label, setLabel] = useState<SceneId | null>(null);
  const layers = useRef<Record<string, HTMLDivElement | null>>({});
  const activeRef = useRef<{ id: SceneId | "none"; el: HTMLElement | null }>({ id: "none", el: null });

  useEffect(() => {
    let secs: Sec[] = [];
    const scan = () => (secs = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]")).map((el) => ({ el, id: el.dataset.scene as SceneId | "none" })));
    scan();
    let ticking = false;
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    let scrollY = 0;
    const onMove = (e: PointerEvent) => {
      tilt.tx = e.clientX / innerWidth - 0.5;
      tilt.ty = e.clientY / innerHeight - 0.5;
      onScroll();
    };
    let labelTimer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      const mid = vh / 2;
      let id: SceneId | "none" = "none";
      let el: HTMLElement | null = null;
      const need: SceneId[] = [];
      for (const s of secs) {
        const r = s.el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) {
          id = s.id;
          el = s.el;
        }
        if (s.id !== "none" && r.top < vh * 2.5 && r.bottom > -vh) need.push(s.id);
      }
      if (need.length) setWanted((prev) => (need.every((n) => prev.has(n)) ? prev : new Set([...prev, ...need])));
      if (id !== activeRef.current.id) {
        activeRef.current = { id, el };
        setActive(id);
        clearTimeout(labelTimer);
        if (id !== "none") {
          setLabel(id);
          labelTimer = setTimeout(() => setLabel(null), 2400);
        } else setLabel(null);
      }
      activeRef.current.el = el;
      // gentle parallax on the active photo (transform only -> compositor)
      if (el && id !== "none") {
        const r = el.getBoundingClientRect();
        const prog = Math.min(1, Math.max(0, (mid - r.top) / Math.max(1, r.height)));
        const node = layers.current[id];
        scrollY = (0.5 - prog) * 50;
        tilt.x += (tilt.tx - tilt.x) * 0.12;
        tilt.y += (tilt.ty - tilt.y) * 0.12;
        if (node) node.style.transform = `translate3d(${-tilt.x * 24}px, ${scrollY - tilt.y * 16}px, 0) rotateY(${tilt.x * 2}deg) rotateX(${-tilt.y * 1.4}deg) scale(1.05)`;
        if (Math.abs(tilt.tx - tilt.x) + Math.abs(tilt.ty - tilt.y) > 0.002) onScroll();
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    if (!window.matchMedia("(pointer: coarse)").matches) window.addEventListener("pointermove", onMove, { passive: true });
    const mo = new MutationObserver(() => (scan(), onScroll()));
    mo.observe(document.body, { childList: true, subtree: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onMove);
      mo.disconnect();
      clearTimeout(labelTimer);
    };
  }, []);

  const season = SEASON_TINT[weather];

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black no-print">
        {(Object.keys(SCENES) as SceneId[]).map((id) =>
          wanted.has(id) ? (
            <div
              key={id}
              className="absolute -inset-y-10 inset-x-0 transition-opacity duration-[1200ms] ease-out [perspective:1200px]"
              style={{ opacity: active === id ? 1 : 0 }}
            >
              <div ref={(n) => void (layers.current[id] = n)} className="absolute inset-0">
                <picture>
                  <source media="(max-width: 767px)" srcSet={`/photos/${id}-m.webp`} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/photos/${id}.webp`} alt="" decoding="async" loading="eager" className={`h-full w-full object-cover ${active === id ? "kenburns" : ""}`} />
                </picture>
              </div>
              <div className="absolute inset-0 bg-black" style={{ opacity: SCENES[id].dim }} />
            </div>
          ) : null
        )}
        <SceneFX scene={active} />
        <div className="absolute inset-0 transition-[background] duration-1000" style={{ background: season.tint, mixBlendMode: season.blend as any }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.25)_65%,rgba(0,0,0,0.7)_100%)]" />
      </div>
      <SkyTraffic />
      <AnimatePresence>
        {label && (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="pointer-events-none fixed bottom-6 left-1/2 z-[4800] -translate-x-1/2 rounded-full bg-black/55 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.25em] text-white shadow-border no-print"
          >
            📍 {SCENES[label].label}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
