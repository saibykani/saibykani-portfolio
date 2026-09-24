"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

/* Scroll-linked entrance: the section rises, un-blurs and scales up into place as it enters. */
export default function ScrollScene({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.55"] });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });
  const scale = useTransform(p, [0, 1], [0.92, 1]);
  const y = useTransform(p, [0, 1], [80, 0]);
  const opacity = useTransform(p, [0, 0.6, 1], [0.2, 0.85, 1]);
  const rotateX = useTransform(p, [0, 1], [8, 0]);
  return (
    <div ref={ref} className="overflow-x-clip [perspective:1400px]">
      <motion.div style={{ scale, y, opacity, rotateX, transformOrigin: "50% 0%" }}>{children}</motion.div>
    </div>
  );
}
