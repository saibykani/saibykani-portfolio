"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight, Check, Copy, FileCheck2, FileText, Mail } from "lucide-react";
import resumeData from "@/data/resumeData.json";
import { ShinyButton } from "@/components/ui/primitives";
import SkyCanvas from "@/components/ui/SkyCanvas";
import FlightLayer from "@/components/ui/FlightLayer";

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

export default function Hero() {
  const [copied, setCopied] = useState(false);
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
      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative z-10 flex flex-col items-center">
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
        <h2 className="mt-2 text-center font-outfit text-4xl leading-tight text-zinc-100/90 sm:text-5xl md:mt-5 lg:text-6xl">
          <span className="md:whitespace-nowrap">
            <Words text="I help teams ship payment systems" delay={0.15} />
          </span>
          <br className="hidden md:block" />
          <Words text="with" delay={0.5} />
          <Words
            text="zero-defect confidence"
            delay={0.6}
            className="bg-gradient-to-b from-zinc-400 via-zinc-100 to-white bg-clip-text pr-1 font-instrument italic tracking-tight text-transparent"
          />
        </h2>

        {/* Intro line */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.85, ease }}
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
            <a href="/Sai_Krishna_Bykani_Resume.pdf" download="Sai_Krishna_Bykani_Resume.pdf">
              <ShinyButton>
                <span className="flex items-center justify-center gap-2">
                  <FileCheck2 className="size-4 text-emerald-400" />
                  <span>View CV</span>
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
      </motion.div>

      {/* Atmosphere: live shader sky */}
      <motion.div style={{ scale: skyScale }} className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden">
        <SkyCanvas />
        <FlightLayer />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-black" />
      </motion.div>
    </section>
  );
}
