"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";

/* Side-view race car; wheels spin via CSS while scrolling. */
function RaceCar({ spinning }: { spinning: boolean }) {
  const wheel = (cx: number) => (
    <g className={spinning ? "car-wheel-spin" : ""} style={{ transformOrigin: `${cx}px 17px`, transformBox: "view-box" }}>
      <circle cx={cx} cy="17" r="4.2" fill="#0a0a0a" stroke="#3f3f46" strokeWidth="1" />
      <path d={`M${cx - 3} 17 H${cx + 3} M${cx} 14 V20`} stroke="#a1a1aa" strokeWidth="0.9" />
    </g>
  );
  return (
    <svg viewBox="0 0 64 22" className="h-[18px] w-[52px] drop-shadow-[0_0_6px_rgba(56,189,248,0.6)]" aria-hidden="true">
      <defs>
        <linearGradient id="car-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FF0080" />
          <stop offset="0.5" stopColor="#7928CA" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      {/* rear wing */}
      <path d="M2 5 H11 V7 H7 L6 12 H4 L4 7 H2Z" fill="url(#car-body)" />
      {/* body */}
      <path d="M3 13 L10 10.5 L22 10 L28 6.5 L34 6.5 L38 10 L54 11 L62 14 L62 16 L3 16Z" fill="url(#car-body)" />
      {/* cockpit / halo */}
      <path d="M28.5 7 L33.5 7 L36 10 L27 10Z" fill="#0b1026" stroke="#e5e7eb" strokeOpacity="0.6" strokeWidth="0.6" />
      {/* front wing */}
      <path d="M55 15.5 H63 V17 H55Z" fill="#e5e7eb" />
      {/* number */}
      <text x="44" y="14.3" fontSize="4.2" fontWeight="800" fill="white" fontFamily="Arial">07</text>
      {wheel(14)}
      {wheel(50)}
    </svg>
  );
}

export default function ScrollProgress() {
  const { scrollYProgress, scrollY } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  const left = useTransform(scaleX, (v) => `calc(${v * 100}% - 52px)`);
  const velocity = useVelocity(scrollY);
  const smoothVel = useSpring(velocity, { stiffness: 200, damping: 40 });
  const tilt = useTransform(smoothVel, [-3000, 0, 3000], [6, 0, -6]);
  const trail = useTransform(smoothVel, [-3000, 0, 3000], [60, 0, 60]);
  const [visible, setVisible] = useState(false);
  const [moving, setMoving] = useState(false);
  const [reverse, setReverse] = useState(false);

  useMotionValueEvent(scaleX, "change", (v) => setVisible(v > 0.015 && v < 0.995));
  useMotionValueEvent(smoothVel, "change", (v) => {
    setMoving(Math.abs(v) > 40);
    if (Math.abs(v) > 80) setReverse(v < 0);
  });

  return (
    <>
      <motion.div
        style={{ scaleX }}
        className="fixed inset-x-0 top-0 z-[6000] h-[2px] origin-left bg-gradient-to-r from-[#FF0080] via-[#7928CA] to-[#38bdf8] no-print"
      />
      <motion.div
        style={{ left, rotate: tilt }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -12 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-none fixed top-[3px] z-[6000] hidden items-center md:flex no-print"
      >
        {/* speed lines */}
        <motion.span style={{ width: trail }} className="mr-0.5 flex flex-col gap-[3px] opacity-80">
          <span className="block h-px w-full bg-gradient-to-r from-transparent to-sky-300/80" />
          <span className="ml-3 block h-px bg-gradient-to-r from-transparent to-fuchsia-300/80" style={{ width: "70%" }} />
          <span className="ml-1 block h-px w-full bg-gradient-to-r from-transparent to-violet-300/70" />
        </motion.span>
        <span className={`block transition-transform duration-300 ${reverse ? "-scale-x-100" : ""}`}>
          <RaceCar spinning={moving} />
        </span>
      </motion.div>
    </>
  );
}
