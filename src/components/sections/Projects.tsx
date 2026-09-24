"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowUpRight, CheckCircle2, CircleCheck, Terminal, X } from "lucide-react";
import resumeData from "@/data/resumeData.json";
import { SectionHeading } from "@/components/ui/primitives";
import { TechIcon } from "@/components/ui/techIcons";

interface CaseStudy {
  overview?: string;
  businessDomain?: string;
  businessProblem?: string;
  businessContext?: string;
  architecture?: { type?: string; nodes?: string[] };
  responsibilities?: string[];
  modules?: string[];
  testingStrategy?: string;
  framework?: string;
  uiAutomation?: string;
  apiAutomation?: string;
  dbValidation?: string;
  performanceTesting?: string;
  cicd?: string;
  challenges?: string[];
  impact?: string;
  achievements?: string[];
  testingMetrics?: string[];
  lessonsLearned?: string;
}

interface ProjectData {
  id: string;
  title: string;
  category: string;
  summary: string;
  role: string;
  testingTypes?: string[];
  technologies: string[];
  businessImpactBadge: string;
  metrics: Record<string, string>;
  caseStudy: CaseStudy;
}

const layers: Record<string, { bg: string; accent: string }> = {
  psp: { bg: "linear-gradient(10deg, #2932CB 49.9%, #2932CB 81.7%, #7980FF 99.88%, #F9D793 113.5%)", accent: "#7980FF" },
  rwa: { bg: "linear-gradient(10deg, #14B8A6 49.9%, #14B8A6 81.7%, #5EEAD4 99.88%, #F9D793 113.5%)", accent: "#5EEAD4" },
  ppms: { bg: "linear-gradient(10deg, #DB2777 49.9%, #DB2777 81.7%, #F472B6 99.88%, #F9D793 113.5%)", accent: "#F472B6" },
  vcip: { bg: "linear-gradient(10deg, #7E22CE 49.9%, #7E22CE 81.7%, #C084FC 99.88%, #F9D793 113.5%)", accent: "#C084FC" },
};
const fallbackLayer = layers.psp;

/* A rendered "screenshot" of a test run dashboard for each project */
function ProjectMock({ project }: { project: ProjectData }) {
  const accent = (layers[project.id] ?? fallbackLayer).accent;
  const flow = project.caseStudy.architecture?.nodes ?? project.caseStudy.modules ?? [];
  const metrics = Object.entries(project.metrics ?? {});
  return (
    <div className="relative aspect-[1203/753] w-full max-w-[85%] translate-y-5 overflow-hidden rounded-t-lg border border-white/10 bg-[#0c0c0f] text-left shadow-2xl">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <span className="size-2 rounded-full bg-red-400/80" />
        <span className="size-2 rounded-full bg-yellow-400/80" />
        <span className="size-2 rounded-full bg-green-400/80" />
        <span className="ml-3 truncate font-mono text-[9px] text-white/40 sm:text-[10px]">
          qa-dashboard / {project.id} / regression-suite
        </span>
      </div>
      <div className="grid h-full grid-cols-5 gap-2 p-2 sm:gap-3 sm:p-3">
        {/* metrics column */}
        <div className="col-span-2 flex flex-col gap-2">
          {metrics.slice(0, 3).map(([k, v]) => (
            <div key={k} className="rounded-md border border-white/10 bg-white/[0.03] p-1.5 sm:p-2.5">
              <div className="font-outfit text-sm font-semibold sm:text-xl" style={{ color: accent }}>
                {v}
              </div>
              <div className="truncate font-mono text-[7px] uppercase tracking-wider text-white/40 sm:text-[9px]">{k}</div>
            </div>
          ))}
          <div className="hidden flex-1 rounded-md border border-white/10 bg-white/[0.03] p-2 sm:block">
            <div className="flex h-full items-end gap-1">
              {[40, 65, 52, 80, 72, 90, 85, 96].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: accent, opacity: 0.25 + i * 0.08 }} />
              ))}
            </div>
          </div>
        </div>
        {/* flow + log column */}
        <div className="col-span-3 flex flex-col gap-2">
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-1.5 sm:p-2.5">
            <div className="mb-1.5 font-mono text-[7px] uppercase tracking-wider text-white/40 sm:text-[9px]">Validated flow</div>
            <div className="flex flex-wrap gap-1">
              {flow.slice(0, 8).map((n) => (
                <span key={n} className="inline-flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[7px] text-white/70 sm:text-[9px]">
                  <CircleCheck className="size-2 text-emerald-400 sm:size-2.5" />
                  {n}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-hidden rounded-md border border-white/10 bg-black/60 p-1.5 font-mono text-[7px] leading-relaxed sm:p-2.5 sm:text-[9px]">
            <div className="flex items-center gap-1 text-white/40">
              <Terminal className="size-2.5" /> mvn test -Dsuite={project.id}
            </div>
            {(project.testingTypes ?? []).slice(0, 5).map((t) => (
              <div key={t} className="text-white/60">
                <span className="text-emerald-400">✔ PASS</span> {t}
              </div>
            ))}
            <div className="mt-1 text-sky-300">BUILD SUCCESS · {project.businessImpactBadge}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TechChips({ techs, small = false }: { techs: string[]; small?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {techs.map((t) => (
        <span
          key={t}
          className={`inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 ${
            small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
          } text-white/80`}
        >
          <TechIcon name={t} className={small ? "size-3.5" : "size-4"} />
          {t}
        </span>
      ))}
    </div>
  );
}

function ProjectCard({
  project,
  index,
  onOpen,
  onActive,
}: {
  project: ProjectData;
  index: number;
  onOpen: () => void;
  onActive: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 400, damping: 35 });
  const sy = useSpring(my, { stiffness: 400, damping: 35 });
  const layer = layers[project.id] ?? fallbackLayer;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && onActive(index), {
      rootMargin: "-45% 0px -45% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [onActive, index]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full flex-col lg:pr-10"
    >
      <button
        onClick={onOpen}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mx.set(e.clientX - r.left);
          my.set(e.clientY - r.top);
        }}
        className="group relative block overflow-hidden rounded-2xl bg-[#f2f2f20c] p-1 text-left shadow-border lg:cursor-none lg:rounded-3xl lg:p-2"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(0,0,0,0)_5%,rgba(255,255,255,0.8)_35%,rgb(255,255,255)_50%,rgba(255,255,255,0.8)_65%,rgba(0,0,0,0)_95%)]" />
        <div className="relative z-0 flex size-full flex-col items-center justify-between overflow-hidden rounded-xl bg-gradient-to-b from-black/35 to-black/45 max-lg:pt-4 lg:rounded-2xl">
          <div
            className="absolute inset-0 -z-10 transition-transform duration-500 ease-in-out group-hover:scale-105"
            style={{ background: layer.bg }}
          />
          <div className="absolute inset-x-0 top-0 z-10 h-[0.8px] bg-[linear-gradient(90deg,rgba(0,0,0,0)_20%,rgb(255,255,255)_50%,rgba(0,0,0,0)_80%)] opacity-70" />
          <div className="hidden w-full flex-row items-center justify-between gap-8 px-10 py-8 text-white/80 lg:flex">
            <h3 className="text-xl tracking-tight xl:text-2xl">{project.summary}</h3>
            <ArrowUpRight className="size-6 shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
          </div>
          <ProjectMock project={project} />
        </div>

        {/* custom follow cursor */}
        <motion.span
          style={{ left: sx, top: sy }}
          animate={{ scale: hover ? 1 : 0, opacity: hover ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none absolute z-30 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-medium text-black shadow-xl lg:flex"
        >
          View case study <ArrowUpRight className="size-4" />
        </motion.span>
      </button>

      {/* Mobile meta */}
      <button onClick={onOpen} className="mb-12 mt-6 flex flex-col text-left lg:hidden">
        <h3 className="line-clamp-1 text-base text-white/80">{project.title}</h3>
        <p className="mt-1 text-sm text-white/50">{project.summary}</p>
        <div className="mt-3">
          <TechChips techs={project.technologies} small />
        </div>
      </button>
    </motion.div>
  );
}

function DetailPanel({ project }: { project: ProjectData }) {
  const cs = project.caseStudy;
  const accent = (layers[project.id] ?? fallbackLayer).accent;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={project.id}
        initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-5"
      >
        <div className="flex items-center gap-2">
          <span className="h-px w-8" style={{ background: accent }} />
          <span className="font-mono text-xs uppercase tracking-widest text-white/60">{project.category}</span>
        </div>
        <h3 className="font-instrument text-4xl text-white">{project.title}</h3>
        <p className="text-sm font-light leading-relaxed text-neutral-300">{cs.overview ?? project.summary}</p>
        {cs.responsibilities && (
          <ul className="flex flex-col gap-2.5">
            {cs.responsibilities.slice(0, 4).map((r) => (
              <li key={r} className="flex gap-2 text-sm font-light text-neutral-300">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" style={{ color: accent }} />
                {r}
              </li>
            ))}
          </ul>
        )}
        <TechChips techs={project.technologies} small />
      </motion.div>
    </AnimatePresence>
  );
}

function CaseStudyModal({ project, onClose }: { project: ProjectData; onClose: () => void }) {
  const cs = project.caseStudy;
  const accent = (layers[project.id] ?? fallbackLayer).accent;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const text: [string, string | undefined][] = [
    ["Business Problem", cs.businessProblem],
    ["Business Context", cs.businessContext],
    ["Testing Strategy", cs.testingStrategy],
    ["Framework", cs.framework],
    ["UI Automation", cs.uiAutomation],
    ["API Automation", cs.apiAutomation],
    ["DB Validation", cs.dbValidation],
    ["Performance Testing", cs.performanceTesting],
    ["CI/CD", cs.cicd],
  ];
  const lists: [string, string[] | undefined][] = [
    ["Key Responsibilities", cs.responsibilities],
    ["Challenges Solved", cs.challenges],
    ["Achievements", cs.achievements],
    ["Testing Metrics", cs.testingMetrics],
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[6000] flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-white/10 bg-zinc-950 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] sm:rounded-3xl"
      >
        <div className="relative overflow-hidden p-6 sm:p-10" style={{ background: (layers[project.id] ?? fallbackLayer).bg }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
          <div className="relative">
            <span className="rounded-full bg-black/40 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-white/80 backdrop-blur">
              {project.category}
            </span>
            <h3 className="mt-4 font-instrument text-4xl text-white sm:text-5xl">{project.title}</h3>
            <p className="mt-2 text-sm text-white/80">{project.role}</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.entries(project.metrics ?? {}).map(([k, v]) => (
                <div key={k} className="rounded-xl border border-white/15 bg-black/30 p-3 backdrop-blur">
                  <div className="font-outfit text-2xl font-semibold text-white">{v}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-white/60">{k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 p-6 sm:p-10">
          {cs.overview && <p className="text-base font-light leading-relaxed text-neutral-300">{cs.overview}</p>}

          {cs.architecture?.nodes && (
            <div>
              <h4 className="mb-3 font-mono text-xs uppercase tracking-widest text-white/50">Architecture Flow</h4>
              <div className="flex flex-wrap items-center gap-2">
                {cs.architecture.nodes.map((n, i) => (
                  <span key={n} className="flex items-center gap-2">
                    <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">{n}</span>
                    {i < cs.architecture!.nodes!.length - 1 && <span style={{ color: accent }}>→</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {cs.modules && (
            <div>
              <h4 className="mb-3 font-mono text-xs uppercase tracking-widest text-white/50">Modules Covered</h4>
              <div className="flex flex-wrap gap-2">
                {cs.modules.map((m) => (
                  <span key={m} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/70">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {text
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h4 className="mb-2 font-mono text-[11px] uppercase tracking-widest" style={{ color: accent }}>
                    {k}
                  </h4>
                  <p className="text-sm font-light leading-relaxed text-neutral-300">{v}</p>
                </div>
              ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {lists
              .filter(([, v]) => v && v.length)
              .map(([k, v]) => (
                <div key={k}>
                  <h4 className="mb-3 font-mono text-xs uppercase tracking-widest text-white/50">{k}</h4>
                  <ul className="flex flex-col gap-2">
                    {v!.map((item) => (
                      <li key={item} className="flex gap-2 text-sm font-light text-neutral-300">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0" style={{ color: accent }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>

          {cs.impact && (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-6">
              <h4 className="mb-2 font-mono text-xs uppercase tracking-widest text-white/50">Impact</h4>
              <p className="font-instrument text-2xl leading-snug text-white">{cs.impact}</p>
            </div>
          )}

          {cs.lessonsLearned && (
            <p className="border-l-2 pl-4 text-sm italic text-neutral-400" style={{ borderColor: accent }}>
              {cs.lessonsLearned}
            </p>
          )}

          <div>
            <h4 className="mb-3 font-mono text-xs uppercase tracking-widest text-white/50">Tech Stack</h4>
            <TechChips techs={project.technologies} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Projects() {
  const projects = (resumeData.projects ?? []) as unknown as ProjectData[];
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<ProjectData | null>(null);

  return (
    <section className="container relative z-[2] w-full py-10">
      <SectionHeading eyebrow="Featured Highlights" title="Polished" highlight="work" className="mb-20 md:mb-24" />

      <div className="relative mx-auto flex w-full max-lg:max-w-xl">
        <div className="mx-auto flex flex-col lg:max-w-[65%] lg:gap-y-28">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} onOpen={() => setOpen(p)} index={i} onActive={setActive} />
          ))}
        </div>

        {/* Sticky details */}
        <div className="relative hidden w-[35%] lg:block">
          <div className="sticky top-32 pl-6 pr-2">
            {projects[active] && <DetailPanel project={projects[active]} />}
            <button
              onClick={() => projects[active] && setOpen(projects[active])}
              className="group mt-8 inline-flex items-center gap-2 font-mono text-sm text-white"
            >
              Read full case study
              <span className="flex size-[25px] items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all duration-500 group-hover:bg-white/10">
                <ArrowUpRight className="size-3.5 transition-transform group-hover:rotate-45" />
              </span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>{open && <CaseStudyModal project={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </section>
  );
}
