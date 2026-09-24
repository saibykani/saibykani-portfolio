"use client";

import { motion } from "framer-motion";
import { Briefcase, CalendarDays, CheckCircle2, MapPin } from "lucide-react";
import resumeData from "@/data/resumeData.json";
import { Reveal, SectionHeading } from "@/components/ui/primitives";
import { TechIcon } from "@/components/ui/techIcons";

const kpiLabels: Record<string, string> = {
  testCases: "Test Cases",
  apisTested: "APIs Tested",
  yearsExp: "Years Exp.",
  regressionReduced: "Regression Reduced",
  stability: "Stability",
  peakLoad: "Peak Load",
  modules: "Modules",
  suites: "Suites",
};

// Radial backgrounds borrowed from the testimonial cards style
const cardBgs = [
  "bg-[radial-gradient(94.21%_78.4%_at_50%_29.91%,rgba(39,61,180,0.7),rgba(15,9,38,0.4))]",
  "bg-[radial-gradient(84.35%_70.19%_at_50%_38.11%,rgba(2,96,101,0.57),rgba(5,136,178,0.06))]",
  "bg-[radial-gradient(90%_75%_at_50%_30%,rgba(126,34,206,0.55),rgba(20,8,38,0.3))]",
  "bg-[radial-gradient(88%_72%_at_50%_32%,rgba(219,39,119,0.45),rgba(30,8,24,0.3))]",
  "bg-[radial-gradient(90%_75%_at_50%_30%,rgba(20,184,166,0.45),rgba(4,30,30,0.3))]",
];

export default function Experience() {
  return (
    <section className="relative py-10">
      <SectionHeading eyebrow="Professional Journey" title="Where I've" highlight="made impact" className="container mb-16 md:mb-20" />

      <div className="container flex flex-col gap-10">
        {resumeData.experience.map((exp) => (
          <div key={exp.company} className="flex flex-col gap-6">
            {/* Header card */}
            <Reveal>
              <div className="relative overflow-hidden rounded-2xl bg-[#f2f2f20c] p-1 shadow-border lg:rounded-3xl lg:p-2">
                <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(0,0,0,0)_5%,rgba(255,255,255,0.8)_35%,rgb(255,255,255)_50%,rgba(255,255,255,0.8)_65%,rgba(0,0,0,0)_95%)]" />
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-zinc-900 to-black p-6 md:p-10 lg:rounded-2xl">
                  <div className="absolute -right-24 -top-24 size-72 rounded-full bg-blue-600/25 blur-3xl" />
                  <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-emerald-300">
                        <span className="relative flex size-2">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                        </span>
                        Current
                      </span>
                      <h3 className="mt-4 font-instrument text-3xl text-white md:text-5xl">{exp.role}</h3>
                      <p className="mt-2 text-lg text-white/80">{exp.company}</p>
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-light text-neutral-400">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-4" /> {exp.duration}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-4" /> {exp.location}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Briefcase className="size-4" /> {exp.industry}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[46%]">
                      {Object.entries(exp.kpis).map(([k, v], i) => (
                        <motion.div
                          key={k}
                          initial={{ opacity: 0, y: 12 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05 }}
                          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center"
                        >
                          <div className="font-outfit text-2xl font-semibold text-white">{v}</div>
                          <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">{kpiLabels[k] ?? k}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="relative mt-8 border-t border-white/10 pt-6">
                    <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-neutral-500">Domain</p>
                    <div className="flex flex-wrap gap-2">
                      {exp.domain.split(",").map((d) => (
                        <span key={d} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-neutral-300">
                          {d.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Contributions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(exp.contributions).map(([title, items], i) => (
                <Reveal key={title} delay={i * 0.06} className={i === 0 ? "lg:col-span-2" : ""}>
                  <div
                    className={`${cardBgs[i % cardBgs.length]} relative flex h-full flex-col overflow-hidden rounded-xl bg-black p-5 shadow-border md:rounded-2xl lg:p-6`}
                  >
                    <h4 className="mb-3 font-instrument text-2xl font-bold tracking-wide text-white/95">{title}</h4>
                    <ul className="flex flex-col gap-2.5">
                      {(items as string[]).map((it) => (
                        <li key={it} className="flex gap-2 text-sm font-extralight leading-relaxed text-white/85 md:text-base">
                          <CheckCircle2 className="mt-1 size-4 shrink-0 text-white/60" />
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Stack */}
            <Reveal>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {exp.technologies.map((t) => (
                  <span key={t} className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-neutral-900 px-3 py-1 text-sm text-neutral-200">
                    <TechIcon name={t} className="size-4" />
                    {t}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}
