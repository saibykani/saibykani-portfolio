"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Check, Copy, FileText, Mail } from "lucide-react";
import resumeData from "@/data/resumeData.json";
import { ShinyButton } from "@/components/ui/primitives";
import TimeSky, { PHASE_META, type SkyPhase } from "@/components/ui/TimeSky";

const ease = [0.22, 1, 0.36, 1] as const;

const ROLES = [
  "Software Development Engineer in Test",
  "QA Automation Engineer",
  "API Automation Engineer",
  "Performance Test Engineer",
  "Payment Systems QA Engineer",
  "FinTech Quality Engineer",
  "Automation Framework Architect",
  "Selenium & Cucumber BDD Specialist",
  "REST Assured API Tester",
  "JMeter Load Testing Specialist",
  "Backend & Database Validation Engineer",
  "CI/CD Test Automation Engineer",
  "UPI & Card Transaction Tester",
  "Regression Automation Expert",
  "End-to-End Testing Architect",
  "Release Quality Guardian",
];

const HEADLINES = [
  "I help teams ship payment systems",
  "I break software before users do",
  "I turn flaky suites into green pipelines",
  "I automate what matters most",
  "I guard every transaction end to end",
];

const TAGLINES = [
  "zero-defect confidence",
  "production-ready quality",
  "bulletproof automation",
  "flawless releases",
  "rock-solid reliability",
  "lightning-fast regression",
  "confidence at every release",
  "data-driven test coverage",
  "millions of transactions validated",
];

function useRotator(length: number, ms: number, delay = 0) {
  const [i, setI] = useState(0);
  useEffect(() => {
    let id: ReturnType<typeof setInterval>;
    const start = setTimeout(() => (id = setInterval(() => setI((x) => (x + 1) % length), ms)), delay);
    return () => {
      clearTimeout(start);
      clearInterval(id);
    };
  }, [length, ms, delay]);
  return i;
}

/* Word that swaps with a vertical slide + fade. */
function Rotating({ items, index, className = "" }: { items: string[]; index: number; className?: string }) {
  return (
    <span className="relative inline-grid overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={items[index]}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.55, ease }}
          className={`col-start-1 row-start-1 whitespace-nowrap ${className}`}
        >
          {items[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* Classic typewriter: types a role, holds, deletes, moves to the next. */
function Typewriter({ items, className = "" }: { items: string[]; className?: string }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const full = items[idx];
    let ms = deleting ? 28 : 55;
    if (!deleting && text === full) ms = 1700;
    if (deleting && text === "") ms = 250;
    const id = setTimeout(() => {
      if (!deleting && text === full) setDeleting(true);
      else if (deleting && text === "") {
        setDeleting(false);
        setIdx((i) => (i + 1) % items.length);
      } else setText(full.slice(0, text.length + (deleting ? -1 : 1)));
    }, ms);
    return () => clearTimeout(id);
  }, [text, deleting, idx, items]);
  return (
    <span className={`sm:whitespace-nowrap ${className}`}>
      {text}
      <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] animate-pulse bg-sky-300" />
    </span>
  );
}

/* Self-contained rotator so only this word re-renders. */
function AutoRotating({ items, ms, delay = 0, className = "" }: { items: string[]; ms: number; delay?: number; className?: string }) {
  const i = useRotator(items.length, ms, delay);
  return <Rotating items={items} index={i} className={className} />;
}

export default function Hero() {
  const [copied, setCopied] = useState(false);
  const [phase, setPhase] = useState<SkyPhase | null>(null);
  const onPhase = useCallback((p: SkyPhase) => setPhase(p), []);
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
    <section className="relative grid min-h-[100svh] place-content-center overflow-hidden px-4 py-24 text-white">
      <TimeSky onPhase={onPhase} />

      <div className="relative z-10 flex flex-col items-center [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]">
        {/* time-of-day greeting + availability */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mb-8 flex flex-col items-center gap-3">
          {phase && (
            <span className="rounded-full bg-black/30 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.25em] text-white/85 ring-1 ring-white/15">
              {PHASE_META[phase].emoji} {PHASE_META[phase].greet}
            </span>
          )}
          <button
            onClick={() => scrollTo("projects")}
            className="group relative hidden items-center gap-2 overflow-hidden rounded-full border border-white/15 bg-black/25 px-1 py-1 pr-3 transition-colors hover:bg-black/40 md:inline-flex"
          >
            <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">Open to Work</span>
            <span className="text-sm font-medium text-white/90 [text-shadow:none]">SDET · Fintech &amp; Payments QA</span>
            <ArrowRight className="size-4 text-white/80 transition-transform group-hover:translate-x-0.5" />
          </button>
        </motion.div>

        {/* Headline with a rotating tagline */}
        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease }}
          className="text-center font-outfit text-4xl font-medium leading-tight text-white sm:text-5xl lg:text-6xl"
        >
          <AutoRotating items={HEADLINES} ms={4200} delay={3000} className="max-md:whitespace-normal" />
          <br />
          with <AutoRotating items={TAGLINES} ms={2800} delay={1500} className="pr-1 font-instrument font-normal italic text-white/95" />
        </motion.h2>

        {/* Intro line with rotating roles */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease }}
          className="relative z-20 mt-10 flex flex-col items-center justify-center gap-2 text-center text-xl tracking-tight text-white/90 sm:flex-row sm:gap-0 lg:text-2xl"
        >
          <span className="flex items-center justify-center">
            Hello, I&apos;m {name}
            <span className="group relative z-30">
              <span className="relative mx-2 block aspect-[854/425] w-16 cursor-pointer overflow-hidden rounded-3xl border border-white/20 transition-all duration-500 group-hover:w-24 md:w-20 lg:mx-3">
                <Image src="/portrait.png" alt={name} fill sizes="96px" priority className="object-cover object-[50%_22%]" />
              </span>
              <span className="pointer-events-none absolute left-1/2 top-full z-40 mt-3 w-44 -translate-x-1/2 scale-90 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 opacity-0 shadow-2xl transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                <span className="relative block aspect-[4/5] w-full">
                  <Image src="/portrait.png" alt="" fill sizes="176px" className="object-cover object-top" />
                </span>
              </span>
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span>a</span>
            <Typewriter items={ROLES} className="font-semibold text-sky-200" />
          </span>
        </motion.h1>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5, ease }} className="mt-10 flex flex-col items-center gap-5">
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 [text-shadow:none]">
            <button onClick={() => scrollTo("contact")}>
              <ShinyButton>Let&apos;s Connect</ShinyButton>
            </button>
            <a href="/resume">
              <ShinyButton>
                <span className="flex items-center justify-center gap-2">
                  <FileText className="size-4 text-sky-300" />
                  <span>See Resume</span>
                </span>
              </ShinyButton>
            </a>
          </div>
          <button
            type="button"
            onClick={copyEmail}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-black/20 px-3 py-1.5 text-sm text-white/85 transition-colors hover:bg-black/35 hover:text-white"
          >
            {copied ? <Check className="size-4 text-emerald-400" /> : <Mail className="size-4" />}
            {copied ? "Copied to clipboard!" : email}
            {!copied && <Copy className="size-3.5 opacity-60" />}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
