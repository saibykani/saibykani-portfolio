"use client";

import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, GraduationCap, Mail } from "lucide-react";
import resumeData from "@/data/resumeData.json";
import { Reveal, SectionHeading } from "@/components/ui/primitives";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/brandIcons";

function PortraitTile() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 150, damping: 15 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 150, damping: 15 });

  return (
    <div
      className="relative aspect-square w-60 [perspective:1000px] lg:me-10 lg:mt-20 lg:w-[460px]"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }} className="group relative size-full">
        {/* back glow + logo */}
        <div className="absolute inset-[8%] rounded-[2.5rem] bg-gradient-to-br from-[#6799fe] via-[#7928CA] to-[#FF0080] opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-70" />
        <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950 shadow-2xl" style={{ transform: "translateZ(20px)" }}>
          <Image src="/portrait.png" alt={resumeData.personal.name} fill sizes="(max-width: 1024px) 240px, 460px" className="object-cover object-[50%_20%] transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/90 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div>
              <p className="font-instrument text-xl text-white lg:text-2xl">{resumeData.personal.name}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/60">SDET · Hyderabad</p>
            </div>
            <span className="relative size-9 overflow-hidden rounded-full bg-white lg:size-11">
              <Image src="/logo.png" alt="" fill sizes="44px" className="object-contain" />
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function About() {
  const { summary, linkedin, github, email } = resumeData.personal;
  const sentences = summary.match(/[^.]+\.(\s|$)/g) ?? [summary];
  const paragraphs = [sentences.slice(0, 2).join(""), sentences.slice(2, 4).join(""), sentences.slice(4).join("")].filter((p) => p.trim());
  const edu = resumeData.education[0];

  return (
    <section className="container relative overflow-hidden py-10 lg:max-w-full">
      <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-center gap-8 py-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="lg:max-w-[60%]">
          <SectionHeading
            eyebrow="Know About Me"
            title="Quality Engineer and a little bit of"
            highlight="everything"
            align="left"
            className="mb-8 md:mb-12 md:mt-20"
          />
          <Reveal>
            <div className="relative z-[5] mx-auto flex max-w-xl flex-col gap-y-8 text-center text-base font-light tracking-wider text-neutral-300 lg:mx-0 lg:max-w-[560px] lg:text-left lg:text-lg">
              {paragraphs.map((p) => (
                <p key={p}>{p.trim()}</p>
              ))}

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                  <GraduationCap className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium tracking-normal text-white">{edu.degree}</p>
                  <p className="text-xs tracking-normal text-neutral-400">
                    {edu.institution} · {edu.duration}
                  </p>
                </div>
              </div>

              <div className="mx-auto -mt-2 flex w-fit gap-4 lg:mx-0">
                <a href={linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-neutral-300 transition-colors hover:text-white">
                  <LinkedInIcon />
                </a>
                <a href={github} target="_blank" rel="noreferrer" aria-label="GitHub" className="text-neutral-300 transition-colors hover:text-white">
                  <GitHubIcon />
                </a>
                <a href={`mailto:${email}`} aria-label="Email" className="text-neutral-300 transition-colors hover:text-white">
                  <Mail className="size-6" />
                </a>
              </div>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById("experience");
                if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
              }}
              className="group mx-auto mt-10 flex w-fit items-center justify-center gap-2 font-mono text-white transition-colors lg:mx-0 lg:justify-start"
            >
              See Work Experience
              <span className="size-[25px] overflow-hidden rounded-full border border-white/10 bg-white/5 transition-all duration-500 group-hover:bg-white/10">
                <span className="flex w-12 -translate-x-1/2 transition-transform duration-500 ease-in-out group-hover:translate-x-0">
                  <span className="flex size-6 items-center justify-center">
                    <ArrowRight className="size-3.5" />
                  </span>
                  <span className="flex size-6 items-center justify-center">
                    <ArrowRight className="size-3.5" />
                  </span>
                </span>
              </span>
            </button>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <PortraitTile />
        </Reveal>
      </div>
    </section>
  );
}
