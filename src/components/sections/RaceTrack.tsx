"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform, useVelocity, type MotionValue } from "framer-motion";
import { Flag, Timer, Zap } from "lucide-react";
import resumeData from "@/data/resumeData.json";

/* Top-down F1 car, nose to the right. */
function F1Car({ livery, number, id }: { livery: [string, string, string]; number: string; id: string }) {
  return (
    <svg viewBox="0 0 150 56" className="w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`liv-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={livery[0]} />
          <stop offset="0.55" stopColor={livery[1]} />
          <stop offset="1" stopColor={livery[2]} />
        </linearGradient>
      </defs>
      {/* rear wing */}
      <rect x="2" y="6" width="10" height="44" rx="2" fill={`url(#liv-${id})`} />
      <rect x="4" y="8" width="3" height="40" fill="#0b0b0b" opacity="0.5" />
      {/* rear tyres */}
      <rect x="16" y="1" width="22" height="12" rx="3" fill="#111" stroke="#2a2a2a" />
      <rect x="16" y="43" width="22" height="12" rx="3" fill="#111" stroke="#2a2a2a" />
      {/* body / sidepods */}
      <path d="M12 20 L40 14 L70 14 L92 20 L128 23 L140 26 L140 30 L128 33 L92 36 L70 42 L40 42 L12 36 Z" fill={`url(#liv-${id})`} />
      <path d="M40 18 L70 18 L88 23 L88 33 L70 38 L40 38 Z" fill="#000" opacity="0.18" />
      {/* engine cover stripe */}
      <path d="M14 27 H120" stroke="white" strokeOpacity="0.6" strokeWidth="1.4" />
      {/* cockpit + halo */}
      <ellipse cx="80" cy="28" rx="10" ry="6" fill="#050505" />
      <path d="M72 28 A8 6 0 0 1 90 28" stroke="#d4d4d8" strokeWidth="1.6" fill="none" />
      <circle cx="80" cy="28" r="3.2" fill={livery[2]} />
      {/* front tyres */}
      <rect x="100" y="3" width="18" height="11" rx="3" fill="#111" stroke="#2a2a2a" />
      <rect x="100" y="42" width="18" height="11" rx="3" fill="#111" stroke="#2a2a2a" />
      {/* front wing */}
      <path d="M134 6 L146 10 L146 46 L134 50 Z" fill={`url(#liv-${id})`} />
      <rect x="140" y="8" width="3" height="40" fill="white" opacity="0.5" />
      {/* number */}
      <text x="50" y="31.5" fontSize="9" fontWeight="900" fill="white" fontFamily="Arial" fontStyle="italic">
        {number}
      </text>
    </svg>
  );
}

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
      <span className="block w-[150px] [filter:drop-shadow(0_8px_10px_rgba(0,0,0,0.7))] md:w-[190px]">
        <F1Car livery={livery} number={number} id={id} />
      </span>
    </motion.div>
  );
}

export default function RaceTrack() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.4 });

  // Car 07 leads early; car 99 overtakes around the middle of the section
  const x1 = useTransform(p, [0, 0.45, 1], ["-25vw", "48vw", "115vw"]);
  const x2 = useTransform(p, [0, 0.45, 1], ["-45vw", "40vw", "135vw"]);
  const w1 = useTransform(p, (v) => Math.sin(v * 40) * 3);
  const w2 = useTransform(p, (v) => Math.cos(v * 36) * 3);

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
      <div className="relative h-[230px] w-full overflow-hidden md:h-[260px]">
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
          className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 opacity-60 [background-image:repeating-linear-gradient(90deg,#fafafa_0_40px,transparent_40px_90px)]"
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

        <Car x={x1} lane="16%" livery={["#FF0080", "#7928CA", "#38bdf8"]} number="07" id="a" wobble={w1} speed={speed} />
        <Car x={x2} lane="56%" livery={["#f59e0b", "#ef4444", "#fde047"]} number="99" id="b" wobble={w2} speed={speed} />

        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent" />
      </div>
      <p className="container mt-3 font-mono text-[11px] uppercase tracking-widest text-white/40">Scroll to race ↓</p>
    </section>
  );
}
