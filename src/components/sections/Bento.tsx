"use client";

import Image from "next/image";
import { useState } from "react";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Check, Copy, Database, Gauge, GitMerge, MonitorCheck, ShieldCheck, Webhook } from "lucide-react";
import resumeData from "@/data/resumeData.json";
import { Marquee } from "@/components/ui/primitives";
import { TechIcon } from "@/components/ui/techIcons";

const exp = resumeData.experience[0];

const cardBase =
  "group relative flex size-full flex-col justify-between overflow-hidden rounded-xl bg-[#0b0b0b] transform-gpu [border:1px_solid_rgba(255,255,255,.1)] [box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]";

function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
}

function CardFooter({ eyebrow, title, cta, target }: { eyebrow: string; title: string; cta: string; target: string }) {
  return (
    <div className="relative z-10 p-4 md:p-6">
      <div className="pointer-events-none flex transform-gpu flex-col gap-1 transition-all duration-300 lg:group-hover:-translate-y-8">
        <p className="max-w-lg text-neutral-400">{eyebrow}</p>
        <h3 className="text-lg font-semibold text-neutral-300 md:text-xl">{title}</h3>
      </div>
      <button
        onClick={() => scrollTo(target)}
        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-white/80 transition-all duration-300 hover:text-white lg:pointer-events-none lg:absolute lg:bottom-4 lg:mt-0 lg:translate-y-6 lg:opacity-0 lg:group-hover:pointer-events-auto lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
      >
        {cta}
        <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

/* ---------------- Trust & Reliability ---------------- */
const floatingTools = [
  { name: "Selenium", top: "55%", left: "22%", size: "w-12 h-12" },
  { name: "Postman", top: "50%", left: "70%", size: "w-16 h-16" },
  { name: "Java", top: "6%", left: "30%", size: "w-14 h-14" },
  { name: "Jenkins", top: "10%", left: "76%", size: "w-11 h-11" },
  { name: "MySQL", top: "12%", left: "10%", size: "w-10 h-10" },
  { name: "Grafana", top: "60%", left: "88%", size: "w-10 h-10" },
];

function TrustCard() {
  return (
    <div className={`${cardBase} col-span-6 max-md:h-[22rem] md:col-span-3 lg:col-span-4`}>
      <div className="absolute inset-x-0 top-0 h-[300px] [mask-image:linear-gradient(to_right,transparent,black_40%,black_60%,transparent)]">
        {/* Concentric rings */}
        <svg className="absolute left-1/2 top-0 h-full -translate-x-1/2" viewBox="0 0 600 300" fill="none">
          {[60, 100, 140, 180, 220].map((r, i) => (
            <circle key={r} cx="300" cy="120" r={r} stroke="white" strokeOpacity={0.09 - i * 0.012} />
          ))}
        </svg>
        <span className="absolute left-1/2 top-2.5 -translate-x-1/2">
          <span className="relative mt-9 block">
            <span className="absolute -inset-6 rounded-full bg-blue-500/20 blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-60" />
            <span className="relative block size-28 overflow-hidden rounded-full border border-white/10 bg-[#161616] p-1">
              <span className="relative block size-full overflow-hidden rounded-full">
                <Image src="/portrait.png" alt="Sai Krishna Bykani" fill sizes="112px" className="object-cover object-[50%_18%]" />
              </span>
            </span>
          </span>
        </span>
        <span className="hidden lg:block">
          {floatingTools.map((t, i) => (
            <span
              key={t.name}
              className={`absolute z-10 ${t.size} scale-0 opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100`}
              style={{ top: t.top, left: t.left, transitionDelay: `${i * 60}ms` }}
            >
              <span className="flex size-full items-center justify-center rounded-full border border-white/5 bg-[#2A2A2A] p-2.5">
                <TechIcon name={t.name} className="size-full" />
              </span>
            </span>
          ))}
        </span>
      </div>
      <div className="h-[230px]" />
      <CardFooter
        eyebrow="Trust & Reliability"
        title="I ship stable releases, communicate clearly, and catch defects long before production."
        cta="About Me"
        target="about"
      />
    </div>
  );
}

/* ---------------- Toolkit marquee ---------------- */
const rows = [
  ["Java", "Selenium", "Cucumber (BDD)", "TestNG", "Maven", "REST Assured", "Postman"],
  ["Apache JMeter", "MySQL", "MongoDB", "Azure SQL", "Grafana", "JSON Validation"],
  ["Jenkins", "GitHub", "Git", "Docker", "Azure DevOps", "Jira", "Spira"],
];

function Chip({ name }: { name: string }) {
  return (
    <span className="inline-flex w-fit shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 bg-neutral-900 px-3 py-1 text-sm text-neutral-200">
      <TechIcon name={name} className="size-4" />
      <span>{name.replace(" (BDD)", "")}</span>
    </span>
  );
}

function ToolkitCard() {
  return (
    <div className={`${cardBase} col-span-6 max-md:h-[22rem] md:col-span-3 lg:col-span-2`}>
      <div className="absolute inset-0">
        <h3 className="absolute top-6 w-full select-none bg-gradient-to-b from-[#fd81e298] to-[#da7bda] bg-clip-text px-6 pb-2 text-center font-instrument text-2xl font-bold leading-tight text-transparent">
          Engineering quality with a battle-tested toolkit
        </h3>
        <div className="relative flex h-full flex-col items-center justify-end">
          <div className="absolute -bottom-32 size-48 rounded-full bg-pink-600 blur-3xl" />
          <div className="z-20 mb-4 flex w-full flex-col gap-y-1 mask-x">
            {rows.map((row, i) => (
              <Marquee key={i} pauseOnHover reverse={i % 2 === 1} duration="35s" className="p-1">
                {row.map((n) => (
                  <Chip key={n} name={n} />
                ))}
              </Marquee>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- KPI card ---------------- */
function KpiCard() {
  const kpis = [
    { value: 1000, suffix: "+", label: "Test cases" },
    { value: 750, suffix: "+", label: "APIs tested" },
    { value: 99.8, suffix: "%", label: "Stability", decimals: 1 },
    { value: 40, suffix: "%", label: "Faster regression" },
  ];
  return (
    <div className={`${cardBase} col-span-6 md:col-span-3 lg:col-span-2`}>
      <div className="absolute -right-16 -top-16 size-56 rounded-full bg-blue-600/25 blur-3xl transition-all duration-700 group-hover:bg-blue-500/35" />
      <div className="relative z-10 flex h-full flex-col justify-between p-6">
        <div>
          <h3 className="font-instrument text-3xl leading-tight text-white md:text-4xl">
            Quality that stands out
            <span className="block italic text-white/60">and makes a difference</span>
          </h3>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <div className="font-outfit text-2xl font-semibold text-white">
                <CountUp end={k.value} decimals={k.decimals ?? 0} duration={2.2} enableScrollSpy scrollSpyOnce />
                {k.suffix}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">{k.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Location / time zones ---------------- */
function Globe() {
  return (
    <div className="relative mx-auto size-44 md:size-48">
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-sky-400/20 to-transparent blur-xl" />
      <svg viewBox="0 0 200 200" className="relative size-full">
        <defs>
          <radialGradient id="globe-fill" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#020617" stopOpacity="1" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="90" fill="url(#globe-fill)" stroke="rgba(255,255,255,0.15)" />
        {[-60, -30, 0, 30, 60].map((lat) => (
          <ellipse key={lat} cx="100" cy={100 + lat} rx={Math.cos((lat / 90) * (Math.PI / 2)) * 90} ry="6" fill="none" stroke="rgba(255,255,255,0.08)" />
        ))}
        <g className="origin-center animate-spin-slow" style={{ transformBox: "fill-box" }}>
          {[20, 45, 70, 90].map((rx) => (
            <ellipse key={rx} cx="100" cy="100" rx={rx} ry="90" fill="none" stroke="rgba(125,211,252,0.18)" />
          ))}
        </g>
        {/* Hyderabad */}
        <circle cx="128" cy="92" r="4" fill="#38bdf8" />
        <circle cx="128" cy="92" r="9" fill="none" stroke="#38bdf8" strokeOpacity="0.6">
          <animate attributeName="r" from="4" to="16" dur="2s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

function LocationCard() {
  const [copied, setCopied] = useState(false);
  const email = resumeData.personal.email;
  const zones = [
    { flag: "🇮🇳", label: "India" },
    { flag: "🇬🇧", label: "UK" },
    { flag: "🇺🇸", label: "USA" },
    { flag: "🌐", label: "Remote" },
  ];
  return (
    <div className={`${cardBase} col-span-6 md:col-span-3 lg:col-span-2`}>
      <div className="relative z-10 flex h-full flex-col p-6">
        <p className="text-center text-base text-neutral-300 md:text-lg">I&apos;m very flexible with time zone communications</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {zones.map((z) => (
            <span key={z.label} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-neutral-300">
              <span>{z.flag}</span>
              {z.label}
            </span>
          ))}
        </div>
        <div className="flex flex-1 items-center justify-center py-3">
          <Globe />
        </div>
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">{resumeData.personal.location}</p>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(email);
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              } catch {
                window.location.href = `mailto:${email}`;
              }
            }}
            className="mt-2 inline-flex items-center gap-2 text-sm text-neutral-300 transition hover:text-white"
          >
            {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
            {copied ? "Copied!" : email}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Services (vertical marquee) ---------------- */
const serviceIcons = [MonitorCheck, Webhook, Gauge, Database, GitMerge, ShieldCheck, BadgeCheck];

function ServicesCard() {
  const services = Object.entries(exp.contributions).map(([title, bullets]) => ({
    title,
    body: (bullets as string[])[0],
  }));
  return (
    <div className={`${cardBase} col-span-6 h-[22rem] md:col-span-3 md:h-auto lg:col-span-2`}>
      <div className="absolute inset-0 mask-y">
        <Marquee vertical pauseOnHover duration="30s" className="h-full" repeat={3}>
          {services.map((s, i) => {
            const Icon = serviceIcons[i % serviceIcons.length];
            return (
              <div
                key={s.title}
                className="mx-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.07]"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-md bg-sky-500/15 text-sky-300">
                    <Icon className="size-4" />
                  </span>
                  <h4 className="text-sm font-semibold text-white">{s.title}</h4>
                </div>
                <p className="mt-2 text-xs font-light leading-relaxed text-neutral-400">{s.body}</p>
              </div>
            );
          })}
        </Marquee>
      </div>
    </div>
  );
}

export default function Bento() {
  return (
    <section className="container py-10">
      <motion.div
        initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto grid w-full grid-cols-6 gap-4 md:auto-rows-[19rem]"
      >
        <TrustCard />
        <ToolkitCard />
        <KpiCard />
        <LocationCard />
        <ServicesCard />
      </motion.div>
    </section>
  );
}
