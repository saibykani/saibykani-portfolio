"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useScroll, useSpring, useTransform, useVelocity, type MotionValue } from "framer-motion";
import { Flag, Timer, Zap } from "lucide-react";
import resumeData from "@/data/resumeData.json";
import F1Car from "@/components/ui/F1Car";

function Car({
  x,
  lane,
  livery,
  number,
  id,
  wobble,
  speed,
}: {
  x: MotionValue<string>;
  lane: string;
  livery: [string, string, string];
  number: string;
  id: string;
  wobble: MotionValue<number>;
  speed: MotionValue<number>;
}) {
  const trail = useTransform(speed, [0, 1], [30, 220]);
  const flame = useTransform(speed, [0, 1], [0.3, 1]);
  return (
    <motion.div className="absolute left-0 flex items-center" style={{ x, top: lane, y: wobble }}>
      {/* speed lines */}
      <motion.span style={{ width: trail }} className="mr-1 flex flex-col gap-[7px]">
        {[0.9, 0.55, 0.75, 0.4].map((o, i) => (
          <span
            key={i}
            className="block h-[2px] rounded-full"
            style={{ opacity: o, marginLeft: `${i * 12}%`, background: `linear-gradient(90deg, transparent, ${livery[i % 3]})` }}
          />
        ))}
      </motion.span>
      {/* exhaust flicker */}
      <motion.span style={{ opacity: flame }} className="-mr-2 block h-2 w-5 animate-pulse rounded-full bg-gradient-to-l from-orange-300 via-rose-500 to-transparent blur-[2px]" />
      <span className="block w-[120px] [filter:drop-shadow(0_8px_10px_rgba(0,0,0,0.7))] md:w-[160px]">
        <F1Car livery={livery} number={number} id={id} />
      </span>
    </motion.div>
  );
}

/* F1 start gantry: five red lights come on one by one, then all go out -> race start. */
function StartLights({ active }: { active: boolean }) {
  const [lit, setLit] = useState(0);
  const [out, setOut] = useState(false);
  useEffect(() => {
    if (!active) return;
    setLit(0);
    setOut(false);
    const timers = [1, 2, 3, 4, 5].map((n) => setTimeout(() => setLit(n), n * 550));
    timers.push(setTimeout(() => setOut(true), 5 * 550 + 900));
    return () => timers.forEach(clearTimeout);
  }, [active]);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2 rounded-lg border border-white/10 bg-black/80 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
        {[1, 2, 3, 4, 5].map((n) => {
          const on = !out && lit >= n;
          return (
            <div key={n} className="flex flex-col gap-1.5 rounded-md bg-zinc-900 p-1.5">
              {[0, 1].map((r) => (
                <span
                  key={r}
                  className={`block size-4 rounded-full transition-all duration-150 md:size-5 ${
                    on
                      ? "bg-red-500 shadow-[0_0_14px_4px_rgba(239,68,68,0.85)]"
                      : out
                        ? "bg-emerald-500/80 shadow-[0_0_10px_2px_rgba(16,185,129,0.6)]"
                        : "bg-zinc-800"
                  }`}
                />
              ))}
            </div>
          );
        })}
      </div>
      <AnimatePresence>
        {out && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6, y: -6 }}
            animate={{ opacity: [0, 1, 1, 0.9], scale: [0.6, 1.15, 1] }}
            exit={{ opacity: 0 }}
            className="font-arcade text-[10px] text-emerald-300 [text-shadow:0_0_12px_rgba(52,211,153,0.9)] md:text-xs"
          >
            LIGHTS OUT!
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RaceTrack() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.4 });

  // Car 07 leads early; car 99 overtakes around the middle of the section
  const x1 = useTransform(p, [0, 0.45, 1], ["-25vw", "48vw", "115vw"]);
  const x2 = useTransform(p, [0, 0.45, 1], ["-45vw", "40vw", "135vw"]);
  const x3 = useTransform(p, [0, 0.3, 0.7, 1], ["-60vw", "20vw", "70vw", "112vw"]);
  const x4 = useTransform(p, [0, 0.55, 1], ["-80vw", "30vw", "125vw"]);
  const w1 = useTransform(p, (v) => Math.sin(v * 40) * 3);
  const w2 = useTransform(p, (v) => Math.cos(v * 36) * 3);
  const w3 = useTransform(p, (v) => Math.sin(v * 30 + 1) * 4);
  const w4 = useTransform(p, (v) => Math.cos(v * 44 + 2) * 3);

  const vel = useVelocity(scrollYProgress);
  const speed = useSpring(useTransform(vel, (v) => Math.min(1, Math.abs(v) * 1.5)), { stiffness: 120, damping: 20 });
  const kerbShift = useTransform(p, (v) => `${-v * 2400}px 0`);
  const laneShift = useTransform(p, (v) => `${-v * 3600}px 0`);

  const regression = resumeData.experience[0].kpis.regressionReduced;
  const lapStat = resumeData.projects[0].caseStudy.testingMetrics?.[1] ?? "";

  return (
    <section ref={ref} className="relative overflow-hidden py-16">
      <div className="container mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-white/60">Pit Wall</p>
          <h2 className="heading-glow mt-2 font-instrument text-4xl text-white md:text-5xl">
            Regression at <span className="text-aurora animate-aurora italic">race pace</span>
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-xs">
          <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-white/80">
            <Timer className="size-3.5 text-sky-300" /> {lapStat}
          </span>
          <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-white/80">
            <Zap className="size-3.5 text-amber-300" /> {regression} faster regression
          </span>
        </div>
      </div>

      {/* track */}
      <div className="relative h-[340px] w-full overflow-hidden md:h-[400px]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#141414,#1c1c1c_50%,#141414)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:6px_6px]" />
        {/* kerbs */}
        <motion.div
          style={{ backgroundPosition: kerbShift }}
          className="absolute inset-x-0 top-0 h-3 [background-image:repeating-linear-gradient(90deg,#e11d48_0_28px,#f5f5f5_28px_56px)]"
        />
        <motion.div
          style={{ backgroundPosition: kerbShift }}
          className="absolute inset-x-0 bottom-0 h-3 [background-image:repeating-linear-gradient(90deg,#f5f5f5_0_28px,#e11d48_28px_56px)]"
        />
        {/* lane line */}
        <motion.div
          style={{ backgroundPosition: laneShift }}
          className="absolute inset-x-0 top-[48%] h-[3px] opacity-60 [background-image:repeating-linear-gradient(90deg,#fafafa_0_40px,transparent_40px_90px)]"
        />
        {/* skid marks */}
        <div className="absolute left-[30%] top-[30%] h-1 w-40 -rotate-2 rounded-full bg-black/40 blur-[1px]" />
        <div className="absolute left-[62%] top-[68%] h-1 w-52 rotate-1 rounded-full bg-black/40 blur-[1px]" />

        {/* finish line + flag */}
        <div className="absolute inset-y-3 right-[8%] w-6 [background-image:repeating-conic-gradient(#fff_0_25%,#111_0_50%)] [background-size:12px_12px] opacity-80" />
        <motion.span
          animate={{ rotate: [-8, 8, -8] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[6%] top-6 origin-bottom-left text-white"
        >
          <Flag className="size-8 fill-white" />
        </motion.span>

        <Car x={x1} lane="8%" livery={["#FF0080", "#7928CA", "#38bdf8"]} number="07" id="a" wobble={w1} speed={speed} />
        <Car x={x2} lane="30%" livery={["#f59e0b", "#ef4444", "#fde047"]} number="99" id="b" wobble={w2} speed={speed} />
        <Car x={x3} lane="52%" livery={["#10b981", "#0ea5e9", "#a7f3d0"]} number="44" id="c" wobble={w3} speed={speed} />
        <Car x={x4} lane="72%" livery={["#e5e7eb", "#6b7280", "#f43f5e"]} number="16" id="d" wobble={w4} speed={speed} />

        {/* start gantry */}
        <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2">
          <StartLights active={inView} />
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent" />
      </div>
      <p className="container mt-3 font-mono text-[11px] uppercase tracking-widest text-white/40">Scroll to race ↓</p>
    </section>
  );
}
