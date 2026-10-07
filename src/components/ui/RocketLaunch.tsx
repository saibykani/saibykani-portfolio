"use client";

import { motion } from "framer-motion";

/* Illustrated launch scene behind the hero headline (crisp SVG, GPU-cheap transforms).
 * Cycle: on the pad → ignition (bloom, light rays, smoke spheres) → straight up →
 * pitch over and fly to orbit → fresh rocket back on the pad. */

const D = 16; // seconds per launch cycle
const loop = { duration: D, repeat: Infinity };

const BUBBLES = [
  { cx: 640, cy: 772, r: 26, dx: -150, dy: -70 },
  { cx: 668, cy: 756, r: 16, dx: -90, dy: -110 },
  { cx: 600, cy: 784, r: 40, dx: -230, dy: -30 },
  { cx: 805, cy: 768, r: 34, dx: 170, dy: -60 },
  { cx: 776, cy: 782, r: 14, dx: 110, dy: -20 },
  { cx: 850, cy: 786, r: 24, dx: 250, dy: -40 },
  { cx: 700, cy: 790, r: 12, dx: -40, dy: -150 },
  { cx: 748, cy: 786, r: 18, dx: 60, dy: -170 },
];

function Rocket() {
  return (
    <g>
      {/* flame (flickers via CSS, fades with the cycle) */}
      <motion.g
        animate={{ opacity: [0, 0, 1, 1, 1, 0, 0] }}
        transition={{ ...loop, times: [0, 0.19, 0.22, 0.5, 0.66, 0.72, 1] }}
      >
        <g className="rocket-flame" style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}>
          <path d="M700 780 C700 830 712 880 720 930 C728 880 740 830 740 780 Z" fill="url(#flame)" />
          <path d="M708 780 C708 815 715 845 720 870 C725 845 732 815 732 780 Z" fill="#ffffff" opacity={0.9} />
        </g>
      </motion.g>

      {/* engine bells */}
      {[704, 720, 736].map((x) => (
        <path key={x} d={`M${x - 6} 770 L${x + 6} 770 L${x + 8} 782 L${x - 8} 782 Z`} fill="#1e1b4b" stroke="#6366f1" strokeWidth={0.8} />
      ))}
      {/* fins */}
      <path d="M698 712 L680 772 L698 768 Z M742 712 L760 772 L742 768 Z" fill="url(#band)" />
      {/* first stage */}
      <rect x={698} y={600} width={44} height={170} fill="url(#body)" />
      <rect x={698} y={640} width={44} height={22} fill="url(#band)" />
      <rect x={698} y={732} width={44} height={10} fill="url(#band)" />
      {/* interstage + second stage */}
      <path d="M698 600 L701 588 L739 588 L742 600 Z" fill="url(#band)" />
      <rect x={701} y={490} width={38} height={98} fill="url(#body)" />
      <rect x={701} y={530} width={38} height={18} fill="url(#band)" />
      {/* third stage */}
      <path d="M701 490 L705 478 L735 478 L739 490 Z" fill="url(#body)" />
      <rect x={705} y={420} width={30} height={58} fill="url(#body)" />
      <rect x={705} y={446} width={30} height={9} fill="url(#band)" />
      {/* capsule + nose */}
      <path d="M705 420 L709 404 L731 404 L735 420 Z" fill="url(#band)" />
      <path d="M709 404 L720 352 L731 404 Z" fill="url(#body)" />
      {/* specular streak for a crisp cylindrical look */}
      <rect x={712} y={430} width={3} height={330} fill="#ffffff" opacity={0.55} />
    </g>
  );
}

export default function RocketLaunch() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id="body" x1="0" x2="1">
          <stop offset="0" stopColor="#5b67d6" />
          <stop offset="0.28" stopColor="#e0e7ff" />
          <stop offset="0.48" stopColor="#ffffff" />
          <stop offset="0.78" stopColor="#a5b4fc" />
          <stop offset="1" stopColor="#3730a3" />
        </linearGradient>
        <linearGradient id="band" x1="0" x2="1">
          <stop offset="0" stopColor="#14123a" />
          <stop offset="0.45" stopColor="#3b3a8f" />
          <stop offset="1" stopColor="#0f0e2e" />
        </linearGradient>
        <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#c7d2fe" />
          <stop offset="0.7" stopColor="#818cf8" stopOpacity="0.7" />
          <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="bloom">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.18" stopColor="#e0e7ff" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#818cf8" stopOpacity="0.35" />
          <stop offset="1" stopColor="#4f46e5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bubble" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#4a4f9e" />
          <stop offset="0.55" stopColor="#191b46" />
          <stop offset="1" stopColor="#0a0b22" />
        </radialGradient>
        <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6366f1" stopOpacity="0.55" />
          <stop offset="1" stopColor="#1e1b4b" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="ray" x1="0" x2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff7e0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* blue glowing hills framing the pad */}
      <path d="M0 520 C160 470 260 600 420 640 C520 665 580 720 640 790 L0 790 Z" fill="url(#hill)" />
      <path d="M1440 520 C1280 470 1180 600 1020 640 C920 665 860 720 800 790 L1440 790 Z" fill="url(#hill)" />
      <path d="M0 640 C200 600 330 700 500 740 L560 790 L0 790 Z M1440 640 C1240 600 1110 700 940 740 L880 790 L1440 790 Z" fill="#4f46e5" opacity={0.18} />

      {/* ignition bloom */}
      <motion.circle
        cx={720}
        cy={780}
        r={260}
        fill="url(#bloom)"
        animate={{ opacity: [0.08, 0.08, 1, 1, 0.45, 0.08, 0.08], scale: [0.6, 0.6, 1.1, 1, 0.8, 0.6, 0.6] }}
        transition={{ ...loop, times: [0, 0.19, 0.24, 0.4, 0.6, 0.78, 1] }}
        style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
      />

      {/* light rays sweeping along the ground */}
      {[
        "M720 790 L400 806",
        "M720 790 L1040 806",
      ].map((d) => (
        <motion.path
          key={d}
          d={d}
          stroke="url(#ray)"
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
          animate={{ pathLength: [0, 0, 1, 1, 0], opacity: [0, 0, 1, 0, 0] }}
          transition={{ ...loop, times: [0, 0.2, 0.26, 0.42, 1] }}
        />
      ))}

      {/* rocket: straight up, then pitch over toward orbit */}
      <motion.g
        animate={{
          y: [0, 0, -60, -560, -1050, 0, 0],
          x: [0, 0, 0, 0, 420, 0, 0],
          rotate: [0, 0, 0, 0, 50, 0, 0],
          scale: [1, 1, 1, 1, 0.45, 1, 1],
          opacity: [1, 1, 1, 1, 0, 0, 1],
        }}
        transition={{ ...loop, times: [0, 0.28, 0.36, 0.55, 0.72, 0.95, 1], ease: ["linear", "easeIn", "easeIn", "easeOut", "linear", "linear"] }}
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
      >
        <Rocket />
      </motion.g>

      {/* glossy smoke spheres billowing from the pad */}
      {BUBBLES.map((b, i) => (
        <motion.circle
          key={i}
          cx={b.cx}
          cy={b.cy}
          r={b.r}
          fill="url(#bubble)"
          stroke="#a5b4fc"
          strokeOpacity={0.45}
          strokeWidth={1.2}
          animate={{
            opacity: [0, 0, 0.95, 0.9, 0, 0],
            scale: [0.2, 0.2, 1, 1.45, 1.8, 0.2],
            x: [0, 0, b.dx * 0.55, b.dx, b.dx * 1.2, 0],
            y: [0, 0, b.dy * 0.5, b.dy, b.dy * 1.4, 0],
          }}
          transition={{ ...loop, times: [0, 0.21 + i * 0.006, 0.3, 0.58, 0.85, 1] }}
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        />
      ))}

      {/* launch pad + ground */}
      <path d="M660 790 L780 790 L790 800 L650 800 Z" fill="#c7d2fe" opacity={0.85} />
      <rect x={0} y={798} width={1440} height={102} fill="#07071a" />
      <path d="M90 798 L150 784 L230 798 Z M1180 798 L1260 780 L1350 798 Z M420 798 L470 790 L520 798 Z" fill="#1b1a45" />
    </svg>
  );
}
