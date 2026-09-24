"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[6000] h-[2px] origin-left bg-gradient-to-r from-[#FF0080] via-[#7928CA] to-[#38bdf8] no-print"
    />
  );
}
