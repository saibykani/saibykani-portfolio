"use client";

import { motion, useReducedMotion } from "framer-motion";

/* Side-profile airliner silhouette (nose to the right) with nav lights. */
function Airliner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 42" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="fuse" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c7d6ff" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#6d83c9" stopOpacity="0.9" />
          <stop offset="1" stopColor="#1b2553" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      {/* far wing */}
      <path d="M56 19 L44 7 L51 7 L72 19Z" fill="#26336d" />
      {/* tail fin + stabiliser */}
      <path d="M10 19 L3 3 L12 3 L26 19Z" fill="url(#fuse)" />
      <path d="M6 22 L0 18 L6 18 L16 21Z" fill="#26336d" />
      {/* fuselage */}
      <path d="M6 22 C6 19.5 11 18.4 21 18.4 L96 18.4 C106 18.4 114 20 118 22 C114 24 106 25.6 96 25.6 L21 25.6 C11 25.6 6 24.5 6 22Z" fill="url(#fuse)" />
      {/* windows */}
      <path d="M30 20.6 H92" stroke="#e8f0ff" strokeOpacity="0.55" strokeWidth="0.9" strokeDasharray="1.4 2" />
      <path d="M104 20.2 C107 20.4 110 21 112 21.8 L104 21.8Z" fill="#0b1433" />
      {/* near wing + engine */}
      <path d="M52 24.5 L37 39 L47 39 L75 24.5Z" fill="url(#fuse)" />
      <rect x="47" y="27.5" width="12" height="4.2" rx="2" fill="#1b2553" />
      {/* nav lights */}
      <circle cx="39" cy="38.6" r="1.4" fill="#ff3b3b">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="4" cy="4" r="1.2" fill="#ffffff">
        <animate attributeName="opacity" values="0;0;1;0;0" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <circle cx="60" cy="18.4" r="1" fill="#ff5a5a">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="0.9s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* Swept-wing jet, top-down-ish silhouette for a quick distant pass. */
function Jet({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 24" className={className} aria-hidden="true">
      <path d="M58 12 L40 10 L28 1 L23 1 L30 10 L12 10.5 L6 5 L2 5 L6 12 L2 19 L6 19 L12 13.5 L30 14 L23 23 L28 23 L40 14 Z" fill="#a9bbf5" fillOpacity="0.85" />
      <circle cx="28" cy="1.5" r="1" fill="#ff4b4b">
        <animate attributeName="opacity" values="1;0.1;1" dur="0.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="28" cy="22.5" r="1" fill="#3bff8a">
        <animate attributeName="opacity" values="0.1;1;0.1" dur="0.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

type FlightProps = {
  top: string;
  duration: number;
  delay: number;
  repeatDelay: number;
  reverse?: boolean;
  width: number;
  opacity?: number;
  kind?: "airliner" | "jet";
  climb?: number;
};

function Flight({ top, duration, delay, repeatDelay, reverse = false, width, opacity = 1, kind = "airliner", climb = -30 }: FlightProps) {
  return (
    <motion.div
      className="absolute left-0 flex items-center"
      style={{ top, opacity, scaleX: reverse ? -1 : 1 }}
      initial={{ x: reverse ? "115vw" : "-25vw", y: 0 }}
      animate={{ x: reverse ? "-25vw" : "115vw", y: [0, climb * 0.4, climb] }}
      transition={{ duration, delay, repeat: Infinity, repeatDelay, ease: "linear" }}
    >
      {/* contrail */}
      <motion.span
        className="block h-[2px] origin-right rounded-full bg-gradient-to-r from-transparent via-white/25 to-white/60 blur-[0.6px]"
        style={{ width: width * 4 }}
        animate={{ opacity: [0.2, 0.8, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatType: "mirror" }}
      />
      <span className="-ml-1 block [filter:drop-shadow(0_0_6px_rgba(160,190,255,0.45))]" style={{ width }}>
        {kind === "jet" ? <Jet className="w-full" /> : <Airliner className="w-full" />}
      </span>
    </motion.div>
  );
}

function ShootingStar({ top, left, delay }: { top: string; left: string; delay: number }) {
  return (
    <motion.span
      className="absolute block h-px w-40 origin-left -rotate-[20deg] bg-gradient-to-r from-white via-sky-200/60 to-transparent"
      style={{ top, left }}
      initial={{ opacity: 0, x: 0, y: 0, scaleX: 0.2 }}
      animate={{ opacity: [0, 1, 0], x: [-40, 260], y: [0, 95], scaleX: [0.2, 1, 0.4] }}
      transition={{ duration: 1.3, delay, repeat: Infinity, repeatDelay: 7 + delay, ease: "easeOut" }}
    />
  );
}

export default function FlightLayer() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* main airliner crossing the middle */}
      <Flight top="44%" duration={26} delay={1.5} repeatDelay={6} width={120} climb={-40} />
      {/* distant airliner the other way, higher up */}
      <Flight top="22%" duration={40} delay={9} repeatDelay={10} width={56} opacity={0.55} reverse climb={-12} />
      {/* quick jet pass below the headline */}
      <Flight top="62%" duration={9} delay={14} repeatDelay={16} width={46} opacity={0.8} kind="jet" climb={-60} />

      <ShootingStar top="12%" left="18%" delay={3} />
      <ShootingStar top="8%" left="62%" delay={8} />
      <ShootingStar top="28%" left="78%" delay={13} />
    </div>
  );
}
