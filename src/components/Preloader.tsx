"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Monogram from "@/components/ui/Monogram";

/* Cinematic intro: letterbox bars, monogram, counter, then the bars split open. Once per session. */
export default function Preloader() {
  const [show, setShow] = useState(false);
  const [n, setN] = useState(0);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("sb-intro") === "1";
      sessionStorage.setItem("sb-intro", "1");
    } catch {}
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setShow(true);
    // advance per frame (with a capped step) so a busy first load can't skip the intro
    let elapsed = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      elapsed += Math.min(now - last, 60);
      last = now;
      const t = Math.min(1, elapsed / 1500);
      setN(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        setOpening(true);
        setTimeout(() => setShow(false), 900);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[10000] no-print" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          {/* letterbox halves */}
          <motion.div
            className="absolute inset-x-0 top-0 h-1/2 bg-black"
            animate={opening ? { y: "-100%" } : { y: 0 }}
            transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 h-1/2 bg-black"
            animate={opening ? { y: "100%" } : { y: 0 }}
            transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
          />
          <motion.div
            animate={opening ? { opacity: 0, scale: 1.4 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6"
          >
            <Monogram className="text-[84px] md:text-[120px]" />
            <div className="h-px w-64 overflow-hidden bg-white/10">
              <motion.div className="h-full bg-gradient-to-r from-[#FF0080] via-[#7928CA] to-[#38bdf8]" style={{ width: `${n}%` }} />
            </div>
            <div className="flex w-64 justify-between font-mono text-[11px] uppercase tracking-[0.3em] text-white/50">
              <span>Loading experience</span>
              <span className="tabular-nums text-white">{n}%</span>
            </div>
          </motion.div>
          {/* light sweep */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
            className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
