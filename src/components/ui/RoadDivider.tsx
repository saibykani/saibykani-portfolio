"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import F1Car from "@/components/ui/F1Car";

/* A thin strip of road between sections; an F1 car drives across it as you scroll past. */
export default function RoadDivider({
  livery,
  number,
  id,
  reverse = false,
}: {
  livery: [string, string, string];
  number: string;
  id: string;
  reverse?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 20, mass: 0.4 });
  const x = useTransform(p, [0, 1], reverse ? ["110vw", "-30vw"] : ["-30vw", "110vw"]);
  const dash = useTransform(p, (v) => `${(reverse ? 1 : -1) * v * 3000}px 0`);
  const bob = useTransform(p, (v) => Math.sin(v * 50) * 2);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none relative my-6 h-24 w-full overflow-hidden md:h-28">
      <div className="absolute inset-x-0 top-1/2 h-16 -translate-y-1/2 bg-gradient-to-b from-[#131313] via-[#1b1b1b] to-[#131313] md:h-20" />
      <motion.div
        style={{ backgroundPosition: dash }}
        className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 opacity-50 [background-image:repeating-linear-gradient(90deg,#fafafa_0_30px,transparent_30px_70px)]"
      />
      <div className="absolute inset-x-0 top-[calc(50%-2rem)] h-[3px] [background-image:repeating-linear-gradient(90deg,#e11d48_0_20px,#f5f5f5_20px_40px)] opacity-70 md:top-[calc(50%-2.5rem)]" />
      <div className="absolute inset-x-0 top-[calc(50%+2rem)] h-[3px] [background-image:repeating-linear-gradient(90deg,#f5f5f5_0_20px,#e11d48_20px_40px)] opacity-70 md:top-[calc(50%+2.5rem)]" />
      <div className="absolute inset-y-0 left-0 flex items-center">
      <motion.div style={{ x, y: bob }} className="flex items-center">
        <span className={`flex items-center ${reverse ? "-scale-x-100" : ""}`}>
          <span className="mr-1 flex w-40 flex-col gap-[5px]">
            <span className="block h-[2px] rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${livery[0]})` }} />
            <span className="ml-8 block h-[2px] rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${livery[2]})` }} />
          </span>
          <span className="block w-[120px] [filter:drop-shadow(0_6px_8px_rgba(0,0,0,0.7))] md:w-[160px]">
            <F1Car livery={livery} number={number} id={`road-${id}`} />
          </span>
        </span>
      </motion.div>
      </div>
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent" />
    </div>
  );
}
