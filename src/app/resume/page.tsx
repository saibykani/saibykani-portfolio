"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import { ArrowLeft, Award, BadgeCheck, Briefcase, Download, ExternalLink, GraduationCap, Mail, MapPin, Phone, Printer } from "lucide-react";
import resumeData from "@/data/resumeData.json";
import Monogram from "@/components/ui/Monogram";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/brandIcons";

const ease = [0.22, 1, 0.36, 1] as const;

const kpiLabels: Record<string, string> = {
  testCases: "Test Cases",
  apisTested: "APIs Tested",
  yearsExp: "Years Exp.",
  regressionReduced: "Regression ↓",
  stability: "Stability",
  peakLoad: "Peak Load",
  modules: "Modules",
  suites: "Suites",
};

function Section({ n, title, Icon, children }: { n: string; title: string; Icon: typeof Award; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease }}
      className="mb-10 print:mb-5 print:break-inside-avoid-page"
    >
      <div className="mb-5 flex items-center gap-3 print:mb-2">
        <span className="font-mono text-xs text-sky-400 print:text-slate-500">{n}</span>
        <Icon className="size-4 text-white/60 print:hidden" />
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-white/70 print:text-[10px] print:font-bold print:text-slate-900">{title}</h2>
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.2, ease }}
          className="h-px flex-1 origin-left bg-gradient-to-r from-white/25 to-transparent print:bg-slate-300"
        />
      </div>
      {children}
    </motion.section>
  );
}

/* Parse a KPI like "1000+", "99.8%", "3x" into a number + suffix for CountUp */
function Kpi({ value }: { value: string }) {
  const m = value.match(/^([\d.]+)(.*)$/);
  if (!m) return <>{value}</>;
  const num = parseFloat(m[1]);
  const decimals = m[1].includes(".") ? m[1].split(".")[1].length : 0;
  return (
    <>
      <CountUp end={num} decimals={decimals} duration={2} enableScrollSpy scrollSpyOnce />
      {m[2]}
    </>
  );
}

export default function ResumePage() {
  const { personal, experience, projects, skills, education, achievements, certifications } = resumeData;
  const exp = experience[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-black px-4 py-8 text-slate-100 sm:px-6 lg:px-8 print:bg-white print:p-0 print:text-slate-900">
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-0 print:hidden">
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-blue-700/20 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[520px] w-[520px] rounded-full bg-fuchsia-700/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      </div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="no-print relative z-10 mx-auto mb-8 flex max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/[0.06] p-3 pl-5 shadow-border backdrop-blur-xl"
      >
        <div className="flex items-center gap-5">
          <Link href="/" aria-label="Home">
            <Monogram className="text-[26px]" />
          </Link>
          <Link href="/" className="group inline-flex items-center text-sm text-white/70 transition-colors hover:text-white">
            <ArrowLeft className="mr-1.5 size-4 transition-transform group-hover:-translate-x-1" />
            Back to portfolio
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/Sai_Krishna_Bykani_Resume.pdf"
            download="Sai_Krishna_Bykani_Resume.pdf"
            className="group inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            <Download className="size-4 transition-transform group-hover:translate-y-0.5" /> PDF
          </a>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:scale-[1.03] active:scale-95"
          >
            <Printer className="size-4" /> Print / Save
          </button>
        </div>
      </motion.div>

      {/* Document */}
      <motion.main
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease }}
        className="print-page relative z-10 mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-[#f2f2f20c] p-1.5 shadow-border print:rounded-none print:bg-white print:p-0 print:shadow-none"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(0,0,0,0)_5%,rgba(255,255,255,0.8)_35%,rgb(255,255,255)_50%,rgba(255,255,255,0.8)_65%,rgba(0,0,0,0)_95%)] print:hidden" />
        <div className="rounded-[1.6rem] bg-gradient-to-b from-zinc-950 to-black p-6 sm:p-10 print:rounded-none print:bg-white print:p-0">
          {/* Header */}
          <header className="print-header mb-10 flex flex-col gap-6 sm:flex-row sm:items-center print:mb-4">
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.3 }}
              className="relative size-28 shrink-0 print:hidden"
            >
              <span className="absolute -inset-1 animate-spin-slow rounded-full bg-[conic-gradient(from_0deg,#FF0080,#7928CA,#0070F3,#38bdf8,#FF0080)] [animation-duration:6s]" />
              <span className="absolute inset-0 overflow-hidden rounded-full border-4 border-black bg-zinc-900">
                <Image src="/portrait.png" alt={personal.name} fill sizes="112px" className="object-cover object-[50%_20%]" priority />
              </span>
            </motion.div>
            <div className="min-w-0 flex-1">
              <motion.h1
                initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.8, delay: 0.35, ease }}
                className="font-instrument text-4xl leading-none text-white sm:text-5xl print:text-3xl print:text-slate-900"
              >
                {personal.name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="mt-2 font-mono text-xs uppercase tracking-[0.2em] print:text-[10px] print:text-slate-700"
              >
                <span className="text-aurora animate-aurora print:[-webkit-text-fill-color:#334155]">{personal.title}</span>
              </motion.p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs print:mt-2 print:gap-x-4 print:text-[9px]">
                {[
                  { Icon: MapPin, text: personal.location },
                  { Icon: Phone, text: personal.phone, href: `tel:${personal.phone.replace(/\s/g, "")}` },
                  { Icon: Mail, text: personal.email, href: `mailto:${personal.email}` },
                  { Icon: LinkedInIcon as any, text: "linkedin.com/in/saibykani", href: personal.linkedin },
                  { Icon: GitHubIcon as any, text: "github.com/saibykani", href: personal.github },
                ].map(({ Icon, text, href }, i) => (
                  <motion.a
                    key={text}
                    href={href}
                    target={href?.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.06 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-neutral-300 transition hover:border-white/25 hover:text-white print:border-none print:bg-transparent print:p-0 print:text-slate-700"
                  >
                    <Icon className="size-3.5" />
                    {text}
                  </motion.a>
                ))}
              </div>
            </div>
          </header>

          {/* KPIs */}
          <div className="mb-10 grid grid-cols-4 gap-2 sm:grid-cols-8 print:hidden">
            {Object.entries(exp.kpis).map(([k, v], i) => (
              <motion.div
                key={k}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.05 }}
                whileHover={{ y: -4 }}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-3 text-center"
              >
                <div className="font-outfit text-lg font-semibold text-white">
                  <Kpi value={v} />
                </div>
                <div className="font-mono text-[8px] uppercase tracking-widest text-neutral-500">{kpiLabels[k] ?? k}</div>
              </motion.div>
            ))}
          </div>

          <Section n="01" title="Professional Summary" Icon={Award}>
            <p className="text-[15px] font-light leading-relaxed text-neutral-300 print:text-[10px] print:text-slate-800">{personal.summary}</p>
          </Section>

          <Section n="02" title="Experience" Icon={Briefcase}>
            <div className="relative border-l border-white/10 pl-6 print:border-slate-300 print:pl-4">
              <span className="absolute -left-[5px] top-1.5 flex size-2.5 print:hidden">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-400 opacity-70" />
                <span className="relative inline-flex size-2.5 rounded-full bg-sky-400" />
              </span>
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white print:text-xs print:text-slate-900">{exp.role}</h3>
                  <p className="mt-1 flex items-center gap-2 text-sm text-neutral-300 print:text-[10px] print:text-slate-700">
                    <span className="relative size-5 overflow-hidden rounded-full bg-white print:hidden">
                      <Image src="/logo.png" alt={`${exp.company} logo`} fill sizes="20px" className="object-contain" />
                    </span>
                    {exp.company}
                  </p>
                </div>
                <div className="text-left font-mono text-xs text-neutral-400 sm:text-right print:text-[9px] print:text-slate-600">
                  <p>{exp.duration}</p>
                  <p>{exp.location}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-neutral-500 print:text-[9px] print:text-slate-600">
                <span className="text-sky-400 print:text-slate-700">Domains:</span> {exp.domain}
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 print:mt-2 print:block print:space-y-2">
                {Object.entries(exp.contributions).map(([area, points], i) => (
                  <motion.div
                    key={area}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.04] print:border-none print:bg-transparent print:p-0"
                  >
                    <h4 className="mb-2 text-sm font-semibold text-white print:mb-0.5 print:text-[9.5px] print:text-slate-800">{area}</h4>
                    <ul className="space-y-1.5 print:space-y-0.5">
                      {(points as string[]).map((pt) => (
                        <li key={pt} className="flex gap-2 text-xs leading-relaxed text-neutral-400 print:text-[9px] print:text-slate-700">
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-sky-400 print:hidden" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>

          <Section n="03" title="Projects" Icon={Briefcase}>
            <div className="grid gap-4 sm:grid-cols-2 print:block print:space-y-2">
              {projects.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -3 }}
                  className="rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-4 print:border-none print:bg-none print:p-0"
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 print:hidden">{p.category}</p>
                  <h3 className="mt-1 font-semibold text-white print:text-[10px] print:text-slate-900">{p.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-neutral-400 print:text-[9px] print:text-slate-700">{p.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5 print:hidden">
                    {Object.entries(p.metrics).map(([k, v]) => (
                      <span key={k} className="rounded-md bg-sky-400/10 px-2 py-0.5 text-[10px] text-sky-300">
                        {v} <span className="text-sky-300/60">{k}</span>
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-neutral-500 print:text-[8.5px] print:text-slate-600">Stack: {p.technologies.join(", ")}</p>
                </motion.div>
              ))}
            </div>
          </Section>

          <Section n="04" title="Core Competencies" Icon={Award}>
            <div className="space-y-3 print:space-y-1">
              {skills.categories.map((cat) => (
                <div key={cat.title} className="flex flex-col gap-2 sm:flex-row sm:items-start print:block">
                  <h3 className="w-56 shrink-0 pt-1 text-xs font-semibold text-white print:inline print:text-[9.5px] print:text-slate-800">
                    {cat.title}
                    <span className="hidden print:inline">: </span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5 print:inline">
                    {cat.skills.map((s, i) => (
                      <motion.span
                        key={s}
                        initial={{ opacity: 0, scale: 0.85 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.025 }}
                        className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-neutral-300 transition hover:border-sky-400/40 hover:text-white print:border-none print:bg-transparent print:p-0 print:text-[9px] print:text-slate-700 print:after:content-[',_'] print:last:after:content-['']"
                      >
                        {s}
                      </motion.span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section n="05" title="Certifications" Icon={BadgeCheck}>
            <div className="grid gap-4 sm:grid-cols-2 print:block print:space-y-1.5">
              {certifications.map((c) => (
                <a
                  key={c.id}
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-3 transition hover:border-white/25 hover:bg-white/[0.05] print:border-none print:bg-transparent print:p-0"
                >
                  <span className="relative aspect-[1287/994] w-24 shrink-0 overflow-hidden rounded-md bg-white print:hidden">
                    <Image src={c.image} alt="" fill sizes="96px" className="object-cover object-top transition-transform duration-500 group-hover:scale-110" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white print:text-[9.5px] print:text-slate-900">{c.name}</span>
                    <span className="block text-xs text-neutral-400 print:text-[9px] print:text-slate-700">
                      {c.issuer} · {c.platform} · {c.issued}
                    </span>
                    <span className="mt-1 block truncate font-mono text-[10px] text-neutral-500 print:text-[8px]">ID {c.credentialId}</span>
                  </span>
                  <ExternalLink className="ml-auto size-4 shrink-0 text-neutral-500 transition group-hover:text-white print:hidden" />
                </a>
              ))}
            </div>
          </Section>

          <Section n="06" title="Achievements" Icon={Award}>
            <ul className="space-y-2">
              {achievements.map((a) => (
                <li key={a} className="flex gap-3 text-sm font-light leading-relaxed text-neutral-300 print:text-[9.5px] print:text-slate-800">
                  <Award className="mt-0.5 size-4 shrink-0 text-amber-300 print:hidden" />
                  {a}
                </li>
              ))}
            </ul>
          </Section>

          <Section n="07" title="Education" Icon={GraduationCap}>
            {education.map((e) => (
              <div key={e.degree} className="flex flex-col justify-between gap-1 sm:flex-row">
                <div>
                  <h3 className="font-semibold text-white print:text-[10px] print:text-slate-900">{e.degree}</h3>
                  <p className="text-sm text-neutral-400 print:text-[9px] print:text-slate-700">{e.institution}</p>
                </div>
                <p className="font-mono text-xs text-neutral-400 print:text-[9px] print:text-slate-600">{e.duration}</p>
              </div>
            ))}
          </Section>
        </div>
      </motion.main>

      <p className="no-print relative z-10 mt-8 text-center font-mono text-xs text-neutral-600">Tip: use “Print / Save” and choose “Save as PDF”.</p>
    </div>
  );
}
