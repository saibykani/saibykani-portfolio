"use client";

import { motion } from "framer-motion";

// Animated "SB" wordmark (Sai Bykani): letters rise in, an aurora gradient sweeps
// through them, a live dot pulses, and the letters split apart on hover.
export default function Monogram({ className = "text-[28px]", animate = true }: { className?: string; animate?: boolean }) {
  const letter = {
    hidden: { y: "70%", opacity: 0, filter: "blur(6px)" },
    show: (i: number) => ({
      y: "0%",
      opacity: 1,
      filter: "blur(0px)",
      transition: { delay: 0.15 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
    }),
  };
  return (
    <motion.span
      initial={animate ? "hidden" : false}
      animate="show"
      whileHover="hover"
      className={`group/mono relative inline-flex select-none items-baseline leading-none ${className}`}
      aria-label="Sai Bykani"
    >
      <motion.span
        custom={0}
        variants={{ ...letter, hover: { x: -3, rotate: -8, transition: { type: "spring", stiffness: 400, damping: 12 } } }}
        className="mono-gradient inline-block font-outfit font-black tracking-[-0.06em]"
      >
        S
      </motion.span>
      <motion.span
        custom={1}
        variants={{ ...letter, hover: { x: 3, rotate: 8, transition: { type: "spring", stiffness: 400, damping: 12 } } }}
        className="mono-gradient -ml-[0.04em] inline-block font-instrument font-normal italic"
      >
        B
      </motion.span>
      <span className="relative -ml-[0.02em] mb-[0.12em] inline-flex size-[0.2em] self-end">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-400 opacity-70" />
        <span className="relative inline-flex size-full rounded-full bg-sky-400" />
      </span>
    </motion.span>
  );
}
