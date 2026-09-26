"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { animate, motion, useInView, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight, Gauge, ShieldCheck, Trophy, type LucideIcon } from "lucide-react";
import resumeData from "@/data/resumeData.json";
import { Reveal, SectionHeading } from "@/components/ui/primitives";

type Award = { title: string; metric: number; prefix?: string; suffix: string; caption: string; icon: LucideIcon; hue: [string, string] };

const AWARDS: Award[] = [
  { title: "Regression stability up ~40%", metric: 40, prefix: "~", suffix: "%", caption: "more stable regression", icon: Trophy, hue: ["#fbbf24", "#f97316"] },
  { title: "Validated at 2x–3x peak load", metric: 3, suffix: "x", caption: "peak load validated", icon: Gauge, hue: ["#22d3ee", "#3b82f6"] },
  { title: "Release sign-offs you can trust", metric: 100, suffix: "%", caption: "end-to-end coverage", icon: ShieldCheck, hue: ["#a78bfa", "#ec4899"] },
];

/* Number that counts up when scrolled into view. */
function CountUp({ to, prefix = "", suffix }: { to: number; prefix?: string; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 1.8, ease: [0.22, 1, 0.36, 1], onUpdate: (x) => setV(x) });
    return () => c.stop();
  }, [inView, to]);
  return (
    <span ref={ref}>
      {prefix}
      {to < 10 ? v.toFixed(1).replace(/\.0$/, "") : Math.round(v)}
      {suffix}
    </span>
  );
}

/* Confetti burst from the click point (DOM particles, auto-removed). */
function burst(host: HTMLElement, x: number, y: number, colors: string[]) {
  for (let i = 0; i < 26; i++) {
    const p = document.createElement("span");
    const a = Math.random() * Math.PI * 2;
    const d = 60 + Math.random() * 110;
    p.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${4 + Math.random() * 5}px;height:${6 + Math.random() * 8}px;border-radius:2px;background:${colors[i % colors.length]};pointer-events:none;z-index:50;`;
    host.appendChild(p);
    p.animate(
      [
        { transform: "translate(-50%,-50%) rotate(0deg)", opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 60}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.3,1)" }
    ).onfinish = () => p.remove();
  }
}

function AwardCard({ award, text, index, company, duration }: { award: Award; text: string; index: number; company: string; duration: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [10, -10]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-12, 12]), { stiffness: 180, damping: 18 });
  const gx = useTransform(mx, (v) => `${v * 100}%`);
  const gy = useTransform(my, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${gx} ${gy}, rgba(255,255,255,0.16), transparent 45%)`;
  const Icon = award.icon;

  const onMove = (e: RPointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  return (
    <motion.div
      initial={{ opacity: 0, rotateX: 55, y: 60 }}
      whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.9, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="h-full [perspective:1200px]"
    >
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onClick={(e) => {
          const r = ref.current!.getBoundingClientRect();
          burst(ref.current!, e.clientX - r.left, e.clientY - r.top, [award.hue[0], award.hue[1], "#ffffff", "#fde68a"]);
        }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="group relative h-full cursor-pointer rounded-2xl p-[1.5px]"
      >
        {/* animated conic border */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div
            className="absolute -inset-[60%] animate-[spin_6s_linear_infinite] opacity-70 transition-opacity group-hover:opacity-100"
            style={{ background: `conic-gradient(from 0deg, transparent 0%, ${award.hue[0]} 12%, transparent 25%, transparent 50%, ${award.hue[1]} 62%, transparent 75%)` }}
          />
        </div>

        <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-[#07080f]/90 p-6 [transform-style:preserve-3d] lg:p-7">
          {/* ambient color + pointer glare */}
          <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: `radial-gradient(90% 70% at 50% 0%, ${award.hue[0]}33, transparent 70%)` }} />
          <motion.div className="pointer-events-none absolute inset-0" style={{ background: glare }} />

          {/* floating 3D medal */}
          <div className="relative mb-6 flex items-center justify-between [transform:translateZ(60px)]">
            <motion.div
              animate={{ y: [0, -8, 0], rotateY: [0, 18, 0, -18, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: index * 0.7 }}
              className="relative flex size-16 items-center justify-center rounded-2xl shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)]"
              style={{ background: `linear-gradient(145deg, ${award.hue[0]}, ${award.hue[1]})` }}
            >
              <span className="absolute inset-[3px] rounded-[14px] bg-gradient-to-b from-white/35 to-transparent" />
              <Icon className="relative size-8 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]" strokeWidth={2.2} />
              <span className="absolute -inset-3 -z-10 rounded-3xl opacity-60 blur-xl" style={{ background: award.hue[0] }} />
            </motion.div>
            <div className="text-right">
              <div className="font-outfit text-4xl font-semibold tracking-tight text-white md:text-5xl" style={{ textShadow: `0 0 30px ${award.hue[0]}66` }}>
                <CountUp to={award.metric} prefix={award.prefix} suffix={award.suffix} />
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">{award.caption}</div>
            </div>
          </div>

          <div className="relative [transform:translateZ(35px)]">
            <h4 className="mb-2 font-instrument text-xl font-bold tracking-wide text-white md:text-2xl">{award.title}</h4>
            <p className="mb-6 text-base font-extralight tracking-tight text-white/80 md:text-lg">{text}</p>
          </div>

          <div className="relative mt-1 flex items-center gap-3 [transform:translateZ(25px)]">
            <span className="relative size-10 overflow-hidden rounded-full bg-white">
              <Image src="/logo.png" alt="" fill sizes="40px" className="object-contain" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium tracking-wide text-white/95">{company}</span>
              <span className="text-xs text-white/60">{duration}</span>
            </div>
            <span className="ml-auto hidden whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-white/40 xl:inline transition-colors group-hover:text-white/80">click to celebrate</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Achievements() {
  const track = useRef<HTMLDivElement>(null);
  const items = resumeData.achievements;
  const exp = resumeData.experience[0];

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="py-10">
      <SectionHeading eyebrow="Recognition" title="Milestones worth" highlight="celebrating" className="container mx-auto mb-16 md:mb-20" />

      <Reveal className="container relative">
        <div ref={track} className="-ml-4 flex snap-x snap-mandatory overflow-x-auto py-6 [scrollbar-width:none] lg:overflow-visible">
          {items.map((a, i) => (
            <div key={i} className="min-w-0 shrink-0 grow-0 basis-full snap-start pl-4 sm:basis-1/2 lg:basis-1/3">
              <div className="mx-1 h-full sm:mx-2">
                <AwardCard award={AWARDS[i % AWARDS.length]} text={a} index={i} company={exp.company} duration={exp.duration} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center gap-3 lg:hidden">
          <button onClick={() => scroll(-1)} aria-label="Previous" className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => scroll(1)} aria-label="Next" className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </Reveal>
    </section>
  );
}
