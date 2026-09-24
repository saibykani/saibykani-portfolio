"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Copy, FileText, Mail } from "lucide-react";
import resumeData from "@/data/resumeData.json";
import { ShinyButton } from "@/components/ui/primitives";

const ease = [0.22, 1, 0.36, 1] as const;

function Stars() {
  // Deterministic pseudo-random star field (avoids hydration mismatch)
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const r = (n: number) => ((Math.sin(i * 928.37 + n * 13.1) + 1) / 2);
        return { top: r(1) * 70, left: r(2) * 100, size: r(3) * 1.8 + 0.6, delay: r(4) * 4 };
      }),
    []
  );
  return (
    <div className="absolute inset-0">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
        />
      ))}
    </div>
  );
}

function Clouds() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[55%]">
      <div className="absolute -bottom-24 -left-[10%] h-72 w-[60%] rounded-[50%] bg-white/[0.07] blur-3xl animate-drift" />
      <div
        className="absolute -bottom-32 left-[25%] h-80 w-[55%] rounded-[50%] bg-blue-200/[0.08] blur-3xl animate-drift"
        style={{ animationDelay: "-6s", animationDuration: "22s" }}
      />
      <div
        className="absolute -bottom-20 -right-[10%] h-64 w-[50%] rounded-[50%] bg-white/[0.06] blur-3xl animate-drift"
        style={{ animationDelay: "-12s", animationDuration: "26s" }}
      />
      <div className="absolute bottom-10 left-[10%] h-24 w-[30%] rounded-[50%] bg-white/[0.05] blur-2xl" />
      <div className="absolute bottom-16 right-[15%] h-20 w-[25%] rounded-[50%] bg-white/[0.05] blur-2xl" />
    </div>
  );
}

export default function Hero() {
  const [copied, setCopied] = useState(false);
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
    <section className="relative grid min-h-screen place-content-center overflow-hidden bg-gradient-to-b from-blue-900 to-black px-4 py-24 text-gray-200">
      <div className="relative z-10 flex flex-col items-center">
        {/* Announcement badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-8 hidden md:block"
        >
          <button
            onClick={() => scrollTo("projects")}
            className="group relative inline-flex animate-bounce items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.04] px-1 py-1 pr-3 transition-all hover:bg-white/10"
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
        <motion.h2
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 0.9, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.1, ease }}
          className="mt-2 text-center font-outfit text-4xl leading-tight text-zinc-100 sm:text-5xl md:mt-5 lg:text-6xl"
        >
          <span className="md:whitespace-nowrap">I help teams ship payment systems</span>
          <br className="hidden md:block" /> with
          <span className="bg-gradient-to-b from-zinc-700 via-zinc-200 to-zinc-50 bg-clip-text font-instrument italic tracking-tight text-transparent">
            {" "}
            zero-defect confidence
          </span>
        </motion.h2>

        {/* Intro line */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease }}
          className="relative z-20 mt-10 flex flex-col items-center justify-center text-center text-xl tracking-tight sm:flex-row lg:text-2xl"
        >
          <span className="flex items-center justify-center bg-gradient-to-t from-gray-600 to-white bg-clip-text text-transparent">
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
          <span className="bg-gradient-to-t from-gray-600 to-white bg-clip-text leading-relaxed text-transparent">
            {" "}
            a Software Development Engineer in Test
          </span>
        </motion.h1>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease }}
          className="mt-10 flex flex-col items-center gap-5"
        >
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <button onClick={() => scrollTo("contact")}>
              <ShinyButton>Let&apos;s Connect</ShinyButton>
            </button>
            <a href="/Sai_Krishna_Bykani_Resume.pdf" download="Sai_Krishna_Bykani_Resume.pdf">
              <ShinyButton>
                <span className="flex items-center justify-center gap-2">
                  <FileText className="size-4" />
                  <span>See Resume</span>
                </span>
              </ShinyButton>
            </a>
          </div>
          <button
            type="button"
            onClick={copyEmail}
            className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm font-light text-zinc-400 transition-all duration-300 hover:bg-white/5 hover:text-white"
          >
            {copied ? <Check className="size-4 text-emerald-400" /> : <Mail className="size-4" />}
            {copied ? "Copied to clipboard!" : email}
            {!copied && <Copy className="size-3.5 opacity-60" />}
          </button>
        </motion.div>
      </div>

      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden">
        <Stars />
        <div className="absolute left-1/2 top-[-20%] h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[120px]" />
        <Clouds />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-black" />
      </div>
    </section>
  );
}
