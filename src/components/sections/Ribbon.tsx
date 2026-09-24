"use client";

import { motion, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
import { Marquee } from "@/components/ui/primitives";

const words = [
  "Automated",
  "Reliable",
  "Scalable",
  "Performant",
  "Secure",
  "Data-Driven",
  "Regression-Proof",
  "Production Ready",
  "Zero Defect",
];

function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-white/90 md:size-5">
      <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0Z" />
    </svg>
  );
}

export default function Ribbon() {
  const { scrollY } = useScroll();
  const vel = useSpring(useVelocity(scrollY), { stiffness: 300, damping: 50 });
  const skew = useTransform(vel, [-2500, 0, 2500], [8, 0, -8]);
  const lift = useTransform(vel, [-2500, 0, 2500], [-10, 0, 10]);
  return (
    <section className="overflow-hidden pb-20 pt-10">
      <div className="relative scale-[1.1]">
        <div className="z-0 translate-y-10 rotate-6 bg-gradient-to-r from-[#6799fe] to-[#0a255b] py-4 opacity-60 md:rotate-3 lg:translate-y-16 lg:py-8" />
        <motion.div style={{ skewX: skew, y: lift, rotate: -3 }} className="relative z-[2] flex items-center justify-center overflow-hidden bg-gradient-to-r from-[#6799fe] to-[#0255fb] py-1.5 will-change-transform lg:py-2">
          <div className="mask-x flex overflow-hidden">
            <Marquee duration="40s">
              {words.map((w) => (
                <div key={w} className="inline-flex shrink-0 items-center gap-2.5">
                  <span className="text-nowrap font-instrument text-sm font-semibold uppercase leading-6 tracking-wider text-gray-50 md:text-lg lg:text-xl">
                    {w}
                  </span>
                  <Sparkle />
                </div>
              ))}
            </Marquee>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
