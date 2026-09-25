"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

/* ------------------------------------------------------------------ */
/* Text that decodes from random glyphs when it scrolls into view       */
/* ------------------------------------------------------------------ */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/<>";
export function ScrambleText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const total = 22;
    const id = setInterval(() => {
      frame++;
      const reveal = Math.floor((frame / total) * text.length);
      setOut(
        text
          .split("")
          .map((ch, i) => (i < reveal || ch === " " ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join("")
      );
      if (frame >= total) clearInterval(id);
    }, 38);
    return () => clearInterval(id);
  }, [inView, text]);
  return (
    <span ref={ref} className={className} aria-label={text}>
      {out}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Section heading: mono eyebrow + Instrument Serif title + aurora word */
/* ------------------------------------------------------------------ */
export function SectionHeading({
  eyebrow,
  title,
  highlight,
  align = "center",
  className = "",
}: {
  eyebrow: string;
  title: string;
  highlight: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`heading-glow relative z-10 text-balance font-medium text-4xl tracking-tight sm:text-5xl md:text-6xl ${
        align === "center" ? "text-center" : "text-center lg:text-left"
      } ${className}`}
    >
      <span className="mb-3 block font-mono font-normal text-xs uppercase tracking-widest text-white/70 md:text-sm [text-shadow:none]">
        <ScrambleText text={eyebrow} />
      </span>
      <span className="font-instrument text-white">
        <span>{title}</span>
        <span className="relative inline-block ps-2 italic tracking-tight">
          <span className="text-aurora animate-aurora">{highlight}</span>
        </span>
      </span>
    </motion.h2>
  );
}

/* ------------------------------------------------------------------ */
/* Shiny pill button with a sweeping highlight                          */
/* ------------------------------------------------------------------ */
export function ShinyButton({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.span
      initial={{ "--x": "100%", scale: 0.8 } as any}
      animate={{ "--x": "-100%", scale: 1 } as any}
      whileTap={{ scale: 0.95 }}
      transition={{
        repeat: Infinity,
        repeatType: "loop",
        repeatDelay: 1,
        type: "spring",
        stiffness: 20,
        damping: 15,
        mass: 2,
        scale: { type: "spring", stiffness: 200, damping: 5, mass: 0.5 },
      }}
      className={`shiny-btn relative inline-flex cursor-pointer rounded-full border border-gray-600 px-6 py-2 font-medium backdrop-blur-xl transition-shadow duration-300 ease-in-out hover:shadow-[0_0_20px_rgba(229,229,229,0.1)] ${className}`}
    >
      <span className="shiny-text relative block size-full text-sm uppercase tracking-wide font-light text-white/90">
        {children}
      </span>
      <span className="shiny-border" />
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/* Pill button with an expanding fill + arrow (used for CTAs)           */
/* ------------------------------------------------------------------ */
export function ArrowPillButton({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`group relative inline-flex cursor-pointer items-center justify-between overflow-hidden rounded-full border border-white/10 bg-white/10 py-1 pr-1 pl-3 font-medium text-base backdrop-blur-sm transition-all hover:bg-transparent ${className}`}
    >
      <span className="z-10 px-3 text-white transition-colors duration-300 group-hover:text-black">{children}</span>
      <span className="absolute inset-0 translate-x-[45%] scale-0 rounded-full bg-white opacity-0 transition-all duration-300 ease-in-out group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100" />
      <span className="z-10 flex items-center justify-center overflow-hidden rounded-full bg-white p-2.5 transition-colors duration-300 group-hover:bg-transparent">
        <svg
          className="size-4 text-black transition-transform duration-300 group-hover:translate-x-5 group-hover:opacity-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
        <svg
          className="absolute size-4 -translate-x-5 text-black opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Infinite marquee                                                     */
/* ------------------------------------------------------------------ */
export function Marquee({
  children,
  reverse = false,
  vertical = false,
  pauseOnHover = false,
  duration = "40s",
  gap = "1rem",
  repeat = 4,
  className = "",
}: {
  children: ReactNode;
  reverse?: boolean;
  vertical?: boolean;
  pauseOnHover?: boolean;
  duration?: string;
  gap?: string;
  repeat?: number;
  className?: string;
}) {
  return (
    <div
      style={{ "--duration": duration, "--gap": gap } as CSSProperties}
      className={`group flex overflow-hidden p-2 [gap:var(--gap)] ${vertical ? "flex-col" : "flex-row"} ${className}`}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          aria-hidden={i > 0}
          className={`flex shrink-0 justify-around [gap:var(--gap)] ${
            vertical ? "flex-col animate-marquee-vertical" : "flex-row animate-marquee"
          } ${pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""} ${
            reverse ? "[animation-direction:reverse]" : ""
          }`}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Blur-fade reveal on scroll                                           */
/* ------------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
