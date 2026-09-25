"use client";

import { useEffect, useRef, useState } from "react";
import { onLightning, useWeather, WEATHER_META } from "@/components/weather/WeatherContext";

type P = { x: number; y: number; vx: number; vy: number; s: number; r: number; vr: number; a: number; c: string; ph: number };

const LEAF_COLORS = ["#f97316", "#ea580c", "#facc15", "#b45309", "#dc2626"];

function leafPath(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.9, -s * 0.3, 0, s);
  ctx.quadraticCurveTo(-s * 0.9, -s * 0.3, 0, -s);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(0, s * 1.2);
  ctx.stroke();
}

/* Site-wide weather particles: snow, rain, falling leaves, summer fireflies. */
export default function WeatherOverlay() {
  const { weather } = useWeather();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const kindRef = useRef(WEATHER_META[weather].particle);
  kindRef.current = WEATHER_META[weather].particle;
  const [flash, setFlash] = useState(false);

  useEffect(
    () =>
      onLightning(() => {
        setFlash(true);
        setTimeout(() => setFlash(false), 140);
      }),
    []
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 0;
    let H = 0;
    const resize = () => {
      W = innerWidth;
      H = innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener("resize", resize);

    let parts: P[] = [];
    let kind = "";
    let fade = 0; // 0..1 global alpha for smooth theme transitions
    let lastScroll = scrollY;

    const make = (k: string, initial: boolean): P => {
      const x = Math.random() * W;
      const y = initial ? Math.random() * H : -20;
      switch (k) {
        case "snow":
          return { x, y, vx: 0, vy: 0.5 + Math.random() * 1.1, s: 1 + Math.random() * 2.6, r: 0, vr: 0, a: 0.5 + Math.random() * 0.5, c: "#fff", ph: Math.random() * 10 };
        case "rain":
          return { x, y: initial ? y : -40, vx: -2.2, vy: 14 + Math.random() * 8, s: 10 + Math.random() * 14, r: 0, vr: 0, a: 0.25 + Math.random() * 0.35, c: "#c7d2fe", ph: 0 };
        case "leaves":
          return { x, y, vx: 0.4 + Math.random() * 0.8, vy: 0.7 + Math.random() * 1, s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.06, a: 0.85, c: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)], ph: Math.random() * 10 };
        default: // fireflies
          return { x, y: initial ? y : Math.random() * H, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, s: 1.5 + Math.random() * 2, r: 0, vr: 0, a: 0, c: "#fde68a", ph: Math.random() * 10 };
      }
    };
    const counts: Record<string, number> = { snow: 170, rain: 240, leaves: 38, fireflies: 55 };

    let raf = 0;
    let t = 0;
    let cleared = false;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      t += 1;
      const want = kindRef.current;
      if (want !== kind) {
        // fade out the old weather before switching particles
        fade -= 0.05;
        if (fade <= 0 || kind === "" || kind === "none") {
          kind = want;
          parts = kind === "none" ? [] : Array.from({ length: Math.round(counts[kind] * (W < 700 ? 0.55 : 1)) }, () => make(kind, true));
          fade = 0;
        }
      } else if (fade < 1) fade += 0.03;

      const sv = scrollY - lastScroll; // particles react to scroll (parallax)
      lastScroll = scrollY;
      // inside a 3D theme world the seasonal particles are rendered in 3D instead
      const inWorld = !!document.documentElement.dataset.world && document.documentElement.dataset.world !== "none";
      if (inWorld) {
        if (!cleared) ctx.clearRect(0, 0, W, H);
        cleared = true;
        return;
      }
      if (kind === "none" || !parts.length) {
        if (!cleared) ctx.clearRect(0, 0, W, H);
        cleared = true;
        return;
      }
      cleared = false;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = 1;

      for (const p of parts) {
        if (kind === "snow") {
          p.x += Math.sin(t * 0.01 + p.ph) * 0.6 + p.vx;
          p.y += p.vy - sv * 0.15 * p.s * 0.3;
          ctx.globalAlpha = p.a * fade;
          ctx.fillStyle = p.c;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
          ctx.fill();
        } else if (kind === "rain") {
          p.x += p.vx;
          p.y += p.vy - sv * 0.2;
          ctx.globalAlpha = p.a * fade;
          ctx.strokeStyle = p.c;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.6, p.y + p.s);
          ctx.stroke();
        } else if (kind === "leaves") {
          p.x += p.vx + Math.sin(t * 0.02 + p.ph) * 1.2;
          p.y += p.vy - sv * 0.1;
          p.r += p.vr + Math.sin(t * 0.03 + p.ph) * 0.02;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.r);
          ctx.scale(Math.cos(t * 0.04 + p.ph), 1); // 3D-ish flutter
          ctx.globalAlpha = p.a * fade;
          ctx.fillStyle = p.c;
          leafPath(ctx, p.s);
          ctx.restore();
        } else {
          p.x += p.vx + Math.sin(t * 0.013 + p.ph) * 0.35;
          p.y += p.vy + Math.cos(t * 0.011 + p.ph) * 0.35 - sv * 0.05;
          const glowA = (0.5 + 0.5 * Math.sin(t * 0.05 + p.ph * 3)) * fade;
          ctx.globalAlpha = glowA * 0.9;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 5);
          g.addColorStop(0, "rgba(253,230,138,0.95)");
          g.addColorStop(1, "rgba(253,230,138,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s * 5, 0, Math.PI * 2);
          ctx.fill();
        }
        // recycle
        if (p.y > H + 30 || p.x < -40 || p.x > W + 40 || p.y < -60) {
          const n = make(kind, false);
          if (kind === "fireflies") {
            n.x = Math.random() * W;
            n.y = Math.random() * H;
          }
          if (sv < -2 && kind !== "fireflies") n.y = H + 10; // scrolling up: enter from the bottom
          Object.assign(p, n);
        }
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[35] h-screen w-screen no-print" />
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-[36] bg-indigo-100 transition-opacity no-print ${flash ? "opacity-20 duration-75" : "opacity-0 duration-300"}`}
      />
    </>
  );
}
