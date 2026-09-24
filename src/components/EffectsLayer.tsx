"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const COLORS = ["#ffffff", "#7dd3fc", "#c084fc", "#FF0080", "#38bdf8"];

type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string; len: number };
type Ring = { x: number; y: number; t: number };

/* Click sparks + ripple ring (canvas) and a trailing cursor ring. */
export default function EffectsLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fine, setFine] = useState(false);
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setFine(window.matchMedia("(pointer: fine)").matches);

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let sparks: Spark[] = [];
    let rings: Ring[] = [];
    let raf = 0;
    let running = false;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      rings = rings.filter((r) => (r.t += 0.035) < 1);
      for (const r of rings) {
        ctx.beginPath();
        ctx.arc(r.x, r.y, 6 + r.t * 46, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(125, 211, 252, ${0.6 * (1 - r.t)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      sparks = sparks.filter((s) => (s.life -= 0.028) > 0);
      for (const s of sparks) {
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.9;
        s.vy = s.vy * 0.9 + 0.12;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * s.len, s.y - s.vy * s.len);
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = s.life;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (sparks.length || rings.length) raf = requestAnimationFrame(tick);
      else {
        running = false;
        canvas.style.display = "none"; // keep the overlay out of compositing when idle
      }
    };

    const onDown = (e: PointerEvent) => {
      setDown(true);
      const n = 10;
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
        const sp = 4 + Math.random() * 3;
        sparks.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color: COLORS[i % COLORS.length], len: 2.2 });
      }
      rings.push({ x: e.clientX, y: e.clientY, t: 0 });
      if (!running) {
        running = true;
        canvas.style.display = "block";
        raf = requestAnimationFrame(tick);
      }
    };
    const onUp = () => setDown(false);
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as HTMLElement | null;
      setHover(Boolean(t?.closest("a, button, [role='button'], input, textarea, label")));
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
    };
  }, [x, y]);

  return (
    <>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[9998] hidden h-screen w-screen no-print" />
      {fine && (
        <motion.div
          style={{ left: sx, top: sy }}
          animate={{ scale: down ? 0.7 : hover ? 1.8 : 1, opacity: hover ? 0.9 : 0.55 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="pointer-events-none fixed z-[9998] -ml-4 -mt-4 size-8 rounded-full border border-white/70 mix-blend-difference no-print"
        >
          <span className="absolute left-1/2 top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        </motion.div>
      )}
    </>
  );
}
