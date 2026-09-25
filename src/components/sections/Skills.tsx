"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import resumeData from "@/data/resumeData.json";
import { Reveal, SectionHeading } from "@/components/ui/primitives";
import { TechIcon, hasTechIcon } from "@/components/ui/techIcons";

function SteelFlower() {
  const petals = Array.from({ length: 14 });
  return (
    <svg viewBox="-200 -200 400 400" className="size-full">
      <defs>
        <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4f4f5" />
          <stop offset="30%" stopColor="#71717a" />
          <stop offset="55%" stopColor="#e4e4e7" />
          <stop offset="80%" stopColor="#3f3f46" />
          <stop offset="100%" stopColor="#a1a1aa" />
        </linearGradient>
        <linearGradient id="steel-dark" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#52525b" />
          <stop offset="50%" stopColor="#d4d4d8" />
          <stop offset="100%" stopColor="#27272a" />
        </linearGradient>
        <radialGradient id="core" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#fafafa" />
          <stop offset="60%" stopColor="#71717a" />
          <stop offset="100%" stopColor="#18181b" />
        </radialGradient>
      </defs>
      {petals.map((_, i) => (
        <g key={i} transform={`rotate(${(360 / petals.length) * i})`}>
          <path
            d="M0 0 C 40 -40, 38 -140, 0 -185 C -38 -140, -40 -40, 0 0 Z"
            fill={i % 2 ? "url(#steel)" : "url(#steel-dark)"}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="0.8"
            opacity="0.92"
          />
          <path d="M0 -10 L0 -175" stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
        </g>
      ))}
      {petals.map((_, i) => (
        <g key={`in-${i}`} transform={`rotate(${(360 / petals.length) * i + 360 / petals.length / 2}) scale(0.55)`}>
          <path d="M0 0 C 40 -40, 38 -140, 0 -185 C -38 -140, -40 -40, 0 0 Z" fill="url(#steel)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        </g>
      ))}
      <circle r="30" fill="url(#core)" stroke="rgba(255,255,255,0.4)" />
    </svg>
  );
}

export default function Skills() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 300]);

  const categories = resumeData.skills.categories;
  const [activeCat, setActiveCat] = useState(0);

  // Every tool that has an icon, de-duplicated across experience + skills
  const allTools = Array.from(
    new Set([...resumeData.experience[0].technologies, ...categories.flatMap((c) => c.skills)])
  ).filter(hasTechIcon);
  const iconTools = Array.from(new Map(allTools.map((t) => [t.split(" ")[0].toLowerCase(), t])).values());

  return (
    <section ref={ref} className="relative mx-auto flex h-full w-full overflow-hidden py-10">
      <div className="h-full w-full">
        <div className="container relative mx-auto">
          <div className="mask-spinner h-[260px]">
            <motion.div style={{ rotate }} className="relative mx-auto w-[380px] will-change-transform md:w-[400px]">
              <div className="-mt-[60px] aspect-square w-full">
                <SteelFlower />
              </div>
            </motion.div>
          </div>
        </div>

        <SectionHeading eyebrow="My Skills" title="My Core" highlight="Abilities" className="container -translate-y-10 mb-2" />

        <div className="container relative flex flex-col items-center justify-center gap-10">
          {/* Icon grid */}
          <Reveal className="w-full max-w-5xl">
            <div className="flex flex-wrap justify-center gap-2">
              {iconTools.map((t, i) => (
                <motion.span
                  key={t}
                  title={t}
                  initial={{ opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03, type: "spring", stiffness: 260, damping: 18 }}
                  whileHover={{ y: -6, scale: 1.08 }}
                  className="group relative flex size-14 items-center justify-center rounded-xl bg-white/10 shadow-border md:size-16"
                >
                  <TechIcon name={t} className="size-7 md:size-8" />
                  <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md border border-white/10 bg-zinc-900 px-2 py-1 font-mono text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {t}
                  </span>
                </motion.span>
              ))}
            </div>
          </Reveal>

          {/* Category tabs */}
          <Reveal className="w-full max-w-5xl" delay={0.1}>
            <div className="mask-x -mx-4 flex gap-2 overflow-x-auto px-6 pb-2 [scrollbar-width:none] md:flex-wrap md:justify-center md:overflow-visible">
              {categories.map((c, i) => (
                <button
                  key={c.title}
                  onClick={() => setActiveCat(i)}
                  className={`relative shrink-0 rounded-full px-4 py-1.5 text-sm font-light transition-colors ${
                    activeCat === i ? "text-black" : "text-white/70 hover:text-white"
                  }`}
                >
                  {activeCat === i && (
                    <motion.span layoutId="skill-tab" className="absolute inset-0 -z-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                  )}
                  <span className="relative z-10">{c.title}</span>
                </button>
              ))}
            </div>

            <div className="relative mt-6 min-h-[140px] overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(94%_78%_at_50%_0%,rgba(39,61,180,0.35),rgba(15,9,38,0.2))] p-6 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCat}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="mb-4 text-center font-instrument text-2xl text-white md:text-3xl">{categories[activeCat].title}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {categories[activeCat].skills.map((s, i) => (
                      <motion.span
                        key={s}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-neutral-200 backdrop-blur"
                      >
                        {hasTechIcon(s) && <TechIcon name={s} className="size-4" />}
                        {s}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
