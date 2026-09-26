"use client";

import Image from "next/image";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Copy, FileText, Mail, MapPin } from "lucide-react";
import { formatTime, greetForHour, localHour, PHASE_META, phaseForHour, type SkyPhase } from "@/components/ui/timeOfDay";
import resumeData from "@/data/resumeData.json";
import { ShinyButton } from "@/components/ui/primitives";
import SkyCanvas from "@/components/ui/SkyCanvas";
import dynamic from "next/dynamic";
import { useWeather } from "@/components/weather/WeatherContext";

const Hero3D = dynamic(() => import("@/components/three/Hero3D"), { ssr: false });

function Words({ text, delay = 0, className = "" }: { text: string; delay?: number; className?: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: delay + i * 0.07, ease }}
          className={`inline-block ${className}`}
        >
          {w}
          {" "}
        </motion.span>
      ))}
    </>
  );
}

const ease = [0.22, 1, 0.36, 1] as const;

const HEADLINES = [
  "I help teams ship payment systems",
  "I break software before users do",
  "I turn flaky suites into green pipelines",
  "I guard every transaction end to end",
];
const TAGLINES = ["zero-defect confidence", "bulletproof automation", "production-ready quality", "lightning-fast regression", "rock-solid reliability"];
const ROLES = [
  "Software Development Engineer in Test",
  "QA Automation Engineer",
  "API Automation Engineer",
  "Performance Test Engineer",
  "Payment Systems QA Engineer",
  "FinTech Quality Engineer",
  "Automation Framework Architect",
  "Selenium & Cucumber BDD Specialist",
  "JMeter Load Testing Specialist",
  "CI/CD Test Automation Engineer",
  "UPI & Card Transaction Tester",
  "End-to-End Testing Architect",
];

/* Word/phrase that swaps with a vertical slide. */
function Rotator({ items, ms, delay = 0, className = "" }: { items: string[]; ms: number; delay?: number; className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    let id: ReturnType<typeof setInterval>;
    const start = setTimeout(() => (id = setInterval(() => setI((x) => (x + 1) % items.length), ms)), delay);
    return () => {
      clearTimeout(start);
      clearInterval(id);
    };
  }, [items.length, ms, delay]);
  return (
    <span className="relative inline-grid overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={items[i]}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.55, ease }}
          className={`col-start-1 row-start-1 ${className}`}
        >
          {items[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* Typewriter: types a role, holds, deletes, next. */
function Typewriter({ items, className = "" }: { items: string[]; className?: string }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const full = items[idx];
    const ms = !del && text === full ? 1700 : del && text === "" ? 250 : del ? 28 : 55;
    const id = setTimeout(() => {
      if (!del && text === full) setDel(true);
      else if (del && text === "") {
        setDel(false);
        setIdx((i) => (i + 1) % items.length);
      } else setText(full.slice(0, text.length + (del ? -1 : 1)));
    }, ms);
    return () => clearTimeout(id);
  }, [text, del, idx, items]);
  return (
    <span className={className}>
      {text}
      <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.12em] animate-pulse bg-sky-300" />
    </span>
  );
}

/* Greeting from the visitor's own clock + Sai's local time in Hyderabad. */
function TimeBadge({ onPhase }: { onPhase: (p: SkyPhase) => void }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // check every second, re-render only when the minute changes -> always matches the system clock
    let last = -1;
    const tick = () => {
      const d = new Date();
      if (d.getMinutes() !== last) {
        last = d.getMinutes();
        setNow(d);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const phase = now ? phaseForHour(localHour()) : null;
  useEffect(() => {
    if (phase) onPhase(phase);
  }, [phase, onPhase]);
  if (!now || !phase) return <span className="h-7" />;
  const meta = PHASE_META[phase];
  return (
    <span className="flex flex-wrap items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/85">
      <span className="rounded-full bg-black/30 px-3 py-1 ring-1 ring-white/15">
        {meta.emoji} {greetForHour(localHour())} · {formatTime(now)}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 ring-1 ring-white/15">
        <MapPin className="size-3 text-rose-300" /> Hyderabad · {formatTime(now, "Asia/Kolkata")} IST
      </span>
    </span>
  );
}

export default function Hero() {
  const [copied, setCopied] = useState(false);
  const [phase, setPhase] = useState<SkyPhase | null>(null);
  const { weather } = useWeather();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const skyScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const { email, name } = resumeData.personal;

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      className="relative grid min-h-screen place-content-center overflow-hidden bg-gradient-to-b from-[#0a1a4a] via-[#07102e] to-black px-4 py-24 text-gray-200"
    >
      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative z-10 flex flex-col items-center [filter:drop-shadow(0_2px_18px_rgba(0,0,0,0.45))]">
        {/* Announcement badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-8 flex flex-col items-center gap-3"
        >
          <TimeBadge onPhase={setPhase} />
          <button
            onClick={() => scrollTo("projects")}
            className="group relative hidden animate-bounce items-center md:inline-flex gap-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.04] px-1 py-1 pr-3 transition-all hover:bg-white/10"
          >
            <span className="relative inline-flex shrink-0 items-center justify-center rounded-full bg-blue-700 px-3 py-1 text-xs font-medium text-white">
              Open to Work
            </span>
            <span className="text-sm font-medium text-zinc-200">SDET · Fintech &amp; Payments QA</span>
            <ArrowRight className="size-4 text-zinc-300 transition-transform group-hover:translate-x-0.5" />
            <span className="absolute inset-0 -z-10 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </button>
        </motion.div>

        {/* Headline */}
        <h2 className="mt-2 text-center font-outfit text-4xl leading-tight text-zinc-100/90 sm:text-5xl md:mt-5 lg:text-6xl">
          <motion.span initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15, ease }} className="block">
            <Rotator items={HEADLINES} ms={4200} delay={3500} className="md:whitespace-nowrap" />
          </motion.span>
          <Words text="with" delay={0.5} />
          <Rotator items={TAGLINES} ms={2800} delay={2000} className="whitespace-nowrap pr-1 font-instrument italic tracking-tight text-white" />
        </h2>

        {/* Intro line */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.85, ease }}
          className="relative z-20 mt-10 flex flex-col items-center justify-center text-center text-xl tracking-tight sm:flex-row lg:text-2xl"
        >
          <span className="flex items-center justify-center text-white">
            Hello, I&apos;m {name}
            <span className="group relative z-30">
              <span className="relative mx-2 block aspect-[854/425] w-16 cursor-pointer overflow-hidden rounded-3xl border border-white/10 transition-all duration-500 group-hover:w-24 md:w-20 lg:mx-3">
                <Image
                  src="/portrait.png"
                  alt={name}
                  fill
                  sizes="96px"
                  priority
                  className="object-cover object-[50%_22%] transition-transform duration-500 group-hover:scale-110"
                />
              </span>
              {/* Hover preview */}
              <span className="pointer-events-none absolute left-1/2 top-full z-40 mt-3 w-44 -translate-x-1/2 scale-90 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 opacity-0 shadow-2xl transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                <span className="relative block aspect-[4/5] w-full">
                  <Image src="/portrait.png" alt="" fill sizes="176px" className="object-cover object-top" />
                </span>
              </span>
            </span>
          </span>
          <span className="leading-relaxed text-zinc-200">
            {" "}
            a <Typewriter items={ROLES} className="font-semibold text-sky-200" />
          </span>
        </motion.h1>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.05, ease }}
          className="mt-10 flex flex-col items-center gap-5"
        >
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <button onClick={() => scrollTo("contact")}>
              <ShinyButton>Let&apos;s Connect</ShinyButton>
            </button>
            <a href="/resume">
              <ShinyButton>
                <span className="flex items-center justify-center gap-2">
                  <FileText className="size-4 text-sky-400" />
                  <span>See Resume</span>
                </span>
              </ShinyButton>
            </a>
          </div>
          <button
            type="button"
            onClick={copyEmail}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 text-sm text-white/85 transition-all duration-300 hover:bg-black/40 hover:text-white"
          >
            {copied ? <Check className="size-4 text-emerald-400" /> : <Mail className="size-4" />}
            {copied ? "Copied to clipboard!" : email}
            {!copied && <Copy className="size-3.5 opacity-60" />}
          </button>
        </motion.div>
      </motion.div>

      {/* Atmosphere: live shader sky */}
      <motion.div style={{ scale: skyScale }} className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden">
        <SkyCanvas weather={weather} />
        <Hero3D weather={weather} />
        <div className={`absolute inset-0 transition-colors duration-1000 ${phase === "day" ? "bg-[#06122a]/30" : phase === "sunrise" || phase === "sunset" ? "bg-black/15" : "bg-transparent"}`} />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-black" />
      </motion.div>
    </section>
  );
}
