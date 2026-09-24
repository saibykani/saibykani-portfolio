"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform, useVelocity, type MotionValue } from "framer-motion";
import F1Car, { LIVERIES, type Livery } from "@/components/ui/F1Car";
import { SectionHeading } from "@/components/ui/primitives";
import { useWeather } from "@/components/weather/WeatherContext";

function Sparks({ active }: { active: boolean }) {
  return (
    <span className="pointer-events-none absolute left-[18%] top-1/2 -translate-y-1/2">
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className="absolute block h-[2px] w-5 rounded-full bg-gradient-to-l from-amber-200 via-orange-400 to-transparent"
          style={{
            top: (i % 5) * 5 - 10,
            opacity: active ? 1 : 0,
            animation: active ? `spark ${0.35 + (i % 4) * 0.08}s linear ${i * 0.05}s infinite` : "none",
          }}
        />
      ))}
    </span>
  );
}

function RaceCarOnRoad({ left, top, livery, id, speed, rain }: { left: MotionValue<string>; top: string; livery: Livery; id: string; speed: MotionValue<number>; rain: boolean }) {
  const trail = useTransform(speed, [0, 1], [60, 520]);
  const [fast, setFast] = useState(false);
  useMotionValueEvent(speed, "change", (v) => setFast(v > 0.45));
  return (
    <motion.div className="absolute flex items-center" style={{ left, top }}>
      <motion.span style={{ width: trail }} className="flex flex-col gap-3 opacity-80">
        {[livery.accent, livery.accent2, livery.base, livery.accent].map((c, i) => (
          <span key={i} className="block h-1 rounded-full" style={{ marginLeft: `${i * 9}%`, background: `linear-gradient(90deg, transparent, ${c})` }} />
        ))}
      </motion.span>
      <span className="relative block w-[380px] [filter:drop-shadow(0_18px_14px_rgba(0,0,0,0.75))]">
        <F1Car livery={livery} id={id} rainLight={rain} />
        <Sparks active={fast} />
      </span>
    </motion.div>
  );
}

export default function RaceShowcase() {
  const ref = useRef<HTMLElement>(null);
  const { weather } = useWeather();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 22, mass: 0.4 });

  // Silver car leads early; the navy car overtakes after the middle of the section.
  const leftA = useTransform(p, [0, 0.55, 1], ["-45%", "44%", "105%"]);
  const leftB = useTransform(p, [0, 0.55, 1], ["-25%", "40%", "80%"]);
  const kerb = useTransform(p, (v) => `${-v * 4200}px 0`);
  const lane = useTransform(p, (v) => `${-v * 6400}px 0`);
  const tilt = useTransform(p, [0, 1], [64, 56]);

  const vel = useVelocity(scrollYProgress);
  const speed = useSpring(useTransform(vel, (v) => Math.min(1, Math.abs(v) * 2.2)), { stiffness: 120, damping: 22 });
  const [hud, setHud] = useState({ kmh: 0, gear: 1, leader: "arrow" as "arrow" | "bull", gap: 0.412 });
  useMotionValueEvent(speed, "change", (v) => {
    const kmh = Math.round(90 + v * 250);
    setHud((h) => ({ ...h, kmh, gear: Math.min(8, 1 + Math.floor(kmh / 42)) }));
  });
  useMotionValueEvent(p, "change", (v) => {
    const leader = v > 0.55 ? "bull" : "arrow";
    const gap = Math.abs(v - 0.55) * 2.4 + 0.08;
    setHud((h) => ({ ...h, leader, gap }));
  });

  const rows = hud.leader === "bull" ? (["bull", "arrow"] as const) : (["arrow", "bull"] as const);
  const revLeds = Math.round(((hud.kmh - 90) / 250) * 15);

  return (
    <section ref={ref} className="relative overflow-hidden py-14">
      <SectionHeading eyebrow="Race Mode" title="Built for" highlight="speed" className="container mb-10" />

      <div className="relative h-[420px] w-full overflow-hidden [perspective:1000px] [perspective-origin:50%_0%] md:h-[520px]">
        {/* tilted road plane */}
        <motion.div
          style={{ rotateX: tilt, transformOrigin: "50% 0%" }}
          className="absolute -left-[30%] top-6 h-[880px] w-[160%] [transform-style:preserve-3d]"
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#171717,#202020_50%,#161616)]" />
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:7px_7px]" />
          <motion.div style={{ backgroundPosition: kerb }} className="absolute inset-x-0 top-0 h-7 [background-image:repeating-linear-gradient(90deg,#e11d48_0_60px,#f5f5f5_60px_120px)]" />
          <motion.div style={{ backgroundPosition: kerb }} className="absolute inset-x-0 bottom-0 h-7 [background-image:repeating-linear-gradient(90deg,#f5f5f5_0_60px,#e11d48_60px_120px)]" />
          <motion.div style={{ backgroundPosition: lane }} className="absolute inset-x-0 top-[33%] h-2 opacity-60 [background-image:repeating-linear-gradient(90deg,#fafafa_0_90px,transparent_90px_200px)]" />
          <motion.div style={{ backgroundPosition: lane }} className="absolute inset-x-0 top-[66%] h-2 opacity-60 [background-image:repeating-linear-gradient(90deg,#fafafa_0_90px,transparent_90px_200px)]" />
          {/* start/finish line */}
          <div className="absolute inset-y-7 left-[62%] w-10 opacity-80 [background-image:repeating-conic-gradient(#fff_0_25%,#111_0_50%)] [background-size:20px_20px]" />
          {/* skid marks */}
          <div className="absolute left-[35%] top-[22%] h-2 w-72 -rotate-1 rounded-full bg-black/50 blur-[2px]" />
          <div className="absolute left-[50%] top-[55%] h-2 w-96 rotate-1 rounded-full bg-black/50 blur-[2px]" />

          <RaceCarOnRoad left={leftB} top="12%" livery={LIVERIES.arrow} id="arrow" speed={speed} rain={weather === "rain"} />
          <RaceCarOnRoad left={leftA} top="44%" livery={LIVERIES.bull} id="bull" speed={speed} rain={weather === "rain"} />
        </motion.div>

        {/* fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />

        {/* TV-style position tower */}
        <div className="absolute left-4 top-4 z-10 w-56 overflow-hidden rounded-lg border border-white/10 bg-black/75 font-mono text-xs text-white shadow-2xl backdrop-blur md:left-8 md:w-64">
          <div className="flex items-center justify-between bg-gradient-to-r from-[#e10600] to-[#7928CA] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest">
            <span>Lap 3 / 3</span>
            <span className="animate-pulse">● Live</span>
          </div>
          {rows.map((k, i) => {
            const L = LIVERIES[k];
            return (
              <motion.div layout key={k} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="flex items-center gap-2 border-t border-white/5 px-3 py-2">
                <span className="w-5 font-bold text-white/60">P{i + 1}</span>
                <span className="h-4 w-1 rounded-full" style={{ background: L.accent }} />
                <span className="flex-1 font-bold">{k === "bull" ? "SAI" : "BYK"} {L.number}</span>
                <span className="text-white/70">{i === 0 ? "LEADER" : `+${hud.gap.toFixed(3)}`}</span>
              </motion.div>
            );
          })}
        </div>

        {/* steering-wheel HUD */}
        <div className="absolute bottom-4 right-4 z-10 rounded-xl border border-white/10 bg-black/75 px-4 py-3 font-mono text-white shadow-2xl backdrop-blur md:bottom-8 md:right-8">
          <div className="mb-2 flex gap-[3px]">
            {Array.from({ length: 15 }).map((_, i) => (
              <span
                key={i}
                className="block h-2 w-2.5 rounded-sm transition-colors duration-75"
                style={{ background: i < revLeds ? (i < 5 ? "#22c55e" : i < 10 ? "#ef4444" : "#3b82f6") : "#27272a", boxShadow: i < revLeds ? "0 0 6px currentColor" : "none" }}
              />
            ))}
          </div>
          <div className="flex items-end gap-4">
            <div>
              <div className="text-3xl font-bold tabular-nums leading-none">{hud.kmh}</div>
              <div className="text-[9px] uppercase tracking-widest text-white/50">km/h</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold leading-none text-amber-300">{hud.gear}</div>
              <div className="text-[9px] uppercase tracking-widest text-white/50">gear</div>
            </div>
            <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${hud.kmh > 260 ? "bg-emerald-500 text-black" : "bg-zinc-800 text-white/40"}`}>DRS</span>
          </div>
        </div>
      </div>
      <p className="container mt-2 font-mono text-[11px] uppercase tracking-widest text-white/40">Scroll faster to push the throttle ↓</p>
    </section>
  );
}
