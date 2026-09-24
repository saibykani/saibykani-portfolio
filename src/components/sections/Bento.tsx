"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import createGlobe from "cobe";
import { motion } from "framer-motion";
import { ArrowRight, Check, Copy, MapPin, PanelsTopLeft, UserRound } from "lucide-react";
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

function useCopyEmail() {
  const [copied, setCopied] = useState(false);
  const email = resumeData.personal.email;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };
  return { copied, copy, email };
}

/* Icon + eyebrow + title at the bottom of a card; lifts on hover to reveal a CTA */
function CardFooter({
  Icon,
  eyebrow,
  title,
  cta,
  target,
}: {
  Icon: typeof UserRound;
  eyebrow: string;
  title: string;
  cta?: string;
  target?: string;
}) {
  return (
    <div className="relative z-10 p-4 md:p-6">
      <div className="pointer-events-none flex transform-gpu flex-col gap-1 transition-all duration-300 lg:group-hover:-translate-y-8">
        <Icon className="mb-2 size-12 origin-left stroke-[1.25] text-neutral-400 transition-all duration-300 ease-in-out group-hover:scale-75" />
        <p className="max-w-lg text-neutral-400">{eyebrow}</p>
        <h3 className="text-lg font-semibold text-neutral-300 md:text-xl">{title}</h3>
      </div>
      {cta && target && (
        <button
          onClick={() => scrollTo(target)}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-white/80 transition-all duration-300 hover:text-white lg:pointer-events-none lg:absolute lg:bottom-4 lg:mt-0 lg:translate-y-6 lg:opacity-0 lg:group-hover:pointer-events-auto lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
        >
          {cta}
          <ArrowRight className="size-4" />
        </button>
      )}
    </div>
  );
}

/* ---------------- Trust & Reliability: chain of rings with portrait ---------------- */
const floatingTools = [
  { name: "Selenium", top: "55%", left: "22%", size: "w-12 h-12" },
  { name: "Postman", top: "50%", left: "70%", size: "w-14 h-14" },
  { name: "Java", top: "6%", left: "30%", size: "w-12 h-12" },
  { name: "Jenkins", top: "10%", left: "74%", size: "w-11 h-11" },
  { name: "MySQL", top: "14%", left: "12%", size: "w-10 h-10" },
  { name: "Grafana", top: "58%", left: "86%", size: "w-10 h-10" },
];

function TrustCard() {
  return (
    <div className={`${cardBase} col-span-6 max-md:h-[22rem] md:col-span-3 lg:col-span-4`}>
      <div className="absolute inset-x-0 top-0 h-[240px] [mask-image:linear-gradient(to_right,transparent,black_25%,black_75%,transparent)]">
        {/* ring chain */}
        <div className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: Math.abs(i - 2) * 0.12, duration: 0.6 }}
              className="-mx-3 block size-[190px] shrink-0 rounded-full border-[10px] border-[#161616] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),0_0_0_1px_rgba(255,255,255,0.05),inset_0_8px_24px_rgba(0,0,0,0.9)]"
            />
          ))}
        </div>
        {/* portrait */}
        <span className="absolute left-1/2 top-[48px] -translate-x-1/2">
          <span className="relative block">
            <span className="absolute -inset-3 rounded-full bg-blue-600/30 opacity-60 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
            <span className="relative block size-[146px] overflow-hidden rounded-full border-[6px] border-[#1b1b1b] bg-gradient-to-b from-blue-500 to-blue-800 shadow-[0_0_0_1px_rgba(255,255,255,0.1)] transition-transform duration-500 group-hover:scale-105">
              <Image src="/portrait.png" alt="Sai Krishna Bykani" fill sizes="146px" className="object-cover object-[50%_18%]" />
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
      <div className="h-[150px]" />
      <CardFooter
        Icon={UserRound}
        eyebrow="Trust & Reliability"
        title="I ship stable releases, communicate clearly, and catch defects long before production."
        cta="About Me"
        target="about"
      />
    </div>
  );
}

/* ---------------- Tech card (tall): mono chips marquee + mockup ---------------- */
const rows = [
  ["Java", "Selenium", "Cucumber (BDD)", "TestNG", "Maven", "REST Assured", "Postman"],
  ["Apache JMeter", "MySQL", "MongoDB", "Azure SQL", "Grafana", "JSON Validation"],
  ["Jenkins", "GitHub", "Git", "Docker", "Azure DevOps", "Jira", "Spira"],
];

function Chip({ name }: { name: string }) {
  return (
    <span className="inline-flex w-fit shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 bg-neutral-900 px-3 py-1.5 font-mono text-sm text-neutral-200">
      <TechIcon name={name} className="size-4" />
      <span>{name.replace(" (BDD)", "")}</span>
    </span>
  );
}

function TechCard() {
  return (
    <div className={`${cardBase} col-span-6 h-[40rem] md:col-span-3 md:row-span-2 md:h-auto lg:col-span-2`}>
      <h3 className="relative z-10 mt-10 select-none bg-gradient-to-b from-[#fd81e2] to-[#da7bda] bg-clip-text px-6 text-center font-instrument text-3xl leading-tight text-transparent md:text-[2.1rem]">
        Engineering quality powered by next-gen tooling
      </h3>

      <div className="mask-x relative z-10 mt-8 flex w-full flex-col gap-y-6">
        {rows.map((row, i) => (
          <Marquee key={i} pauseOnHover reverse={i % 2 === 1} duration="35s" className="p-1">
            {row.map((n) => (
              <Chip key={n} name={n} />
            ))}
          </Marquee>
        ))}
      </div>

      {/* mockup */}
      <div className="relative mt-auto h-[260px] w-full">
        <div className="absolute -bottom-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(219,39,119,0.35)_0%,rgba(219,39,119,0.12)_35%,transparent_65%)]" />
        {[220, 300, 380, 460].map((s, i) => (
          <span
            key={s}
            className="absolute left-1/2 top-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-pink-400/10"
            style={{ width: s, height: s, opacity: 1 - i * 0.2 }}
          />
        ))}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-0 left-[10%] w-[80%] overflow-hidden rounded-t-lg border border-b-0 border-white/10 bg-[#1a1a1a] transition-transform duration-500 group-hover:-translate-y-2"
        >
          <div className="flex items-center gap-1.5 border-b border-white/5 px-3 py-2">
            <span className="size-2 rounded-full bg-red-400" />
            <span className="size-2 rounded-full bg-yellow-400" />
            <span className="size-2 rounded-full bg-green-400" />
          </div>
          <div className="flex flex-col items-center px-4 pb-8 pt-4 text-center">
            <span className="mb-4 flex h-5 w-24 items-center justify-end rounded-full bg-neutral-700 px-1">
              <span className="size-3 rounded-full bg-neutral-400" />
            </span>
            <p className="text-lg font-semibold leading-snug text-neutral-200">
              Releases that stand out
              <span className="block font-medium text-neutral-400">and ship with confidence</span>
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => scrollTo("projects")} className="rounded-md bg-violet-600 px-3 py-1 text-[10px] font-medium text-white transition hover:bg-violet-500">
                See work
              </button>
              <button onClick={() => scrollTo("experience")} className="rounded-md border border-white/15 px-3 py-1 text-[10px] font-medium text-white transition hover:bg-white/10">
                Read More
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ---------------- Time zones: dotted glowing globe ---------------- */
function DotGlobe() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const size = canvas.offsetWidth;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let phi = 3.7; // start with India facing the viewer
    let globe: ReturnType<typeof createGlobe> | null = null;
    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: size * dpr,
        height: size * dpr,
        phi,
        theta: 0.28,
        dark: 1,
        diffuse: 1.4,
        mapSamples: 14000,
        mapBrightness: 5,
        mapBaseBrightness: 0,
        baseColor: [0.08, 0.2, 0.32],
        markerColor: [0.3, 0.9, 0.5],
        glowColor: [0.12, 0.45, 0.8],
        markers: [
          { location: [17.385, 78.4867], size: 0.07 }, // Hyderabad
          { location: [51.5072, -0.1276], size: 0.04 }, // London
          { location: [40.7128, -74.006], size: 0.04 }, // New York
        ],
        opacity: 0.95,
      });
    } catch {
      return;
    }
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      phi += 0.0015;
      globe?.update({ phi });
    };
    loop();
    requestAnimationFrame(() => (canvas.style.opacity = "1"));
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      globe?.destroy();
    };
  }, []);
  return <canvas ref={ref} className="aspect-square w-full opacity-0 transition-opacity duration-1000" />;
}

function TimezoneCard() {
  const zones = [
    { code: "GB", label: "UK" },
    { code: "IN", label: "India", active: true },
    { code: "US", label: "USA" },
  ];
  return (
    <div className={`${cardBase} col-span-6 h-[36rem] md:col-span-3 md:row-span-2 md:h-auto lg:col-span-2`}>
      <div className="relative z-10 px-6 pt-10 text-center">
        <h3 className="font-instrument text-3xl leading-tight text-neutral-200 md:text-[2.1rem]">
          I&apos;m very flexible with time <span className="text-sky-300">zone communications</span>
        </h3>
        <div className="mt-5 flex justify-center gap-3">
          {zones.map((z) => (
            <span
              key={z.label}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-sm ${
                z.active ? "border-sky-400/50 bg-sky-400/10 text-sky-300 shadow-[0_0_14px_rgba(56,189,248,0.25)]" : "border-white/10 bg-white/[0.03] text-neutral-400"
              }`}
            >
              <span className="text-xs opacity-80">{z.code}</span> {z.label}
            </span>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-[14%] left-1/2 w-[150%] max-w-[540px] -translate-x-1/2 transition-transform duration-700 group-hover:scale-105 md:w-[140%]">
        <DotGlobe />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/50 to-transparent" />
      <div className="relative z-10 mt-auto">
        <CardFooter Icon={MapPin} eyebrow="Remote friendly" title="Hyderabad, India" />
      </div>
    </div>
  );
}

/* ---------------- Let's work together: sparkles + email ---------------- */
function Sparkles() {
  const dots = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => {
        const r = (n: number) => (Math.sin(i * 311.7 + n * 57.3) + 1) / 2;
        return { top: r(1) * 100, left: r(2) * 100, size: r(3) * 2 + 1, delay: r(4) * 3, dur: 2 + r(5) * 3 };
      }),
    []
  );
  return (
    <div className="absolute inset-0">
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ top: `${d.top}%`, left: `${d.left}%`, width: d.size, height: d.size }}
          animate={{ opacity: [0.1, 0.9, 0.1], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {[
        { top: "14%", left: "46%" },
        { top: "44%", left: "16%" },
        { top: "40%", left: "82%" },
      ].map((p, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute size-4 fill-white"
          style={p}
          animate={{ rotate: [0, 90, 180], scale: [0.7, 1.1, 0.7], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 4, delay: i * 0.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0Z" />
        </motion.svg>
      ))}
    </div>
  );
}

function WorkTogetherCard() {
  const { copied, copy, email } = useCopyEmail();
  return (
    <div className={`${cardBase} col-span-6 h-[19rem] md:col-span-3 md:h-auto lg:col-span-2`}>
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.1),transparent_70%)]" />
      <Sparkles />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <h3 className="font-instrument text-4xl leading-tight text-white [text-shadow:0_0_24px_rgba(255,255,255,0.45)] md:text-[2.6rem]">
          Let&apos;s work together
          <span className="block">on your next release</span>
        </h3>
        <button
          onClick={copy}
          className="mt-6 flex w-full max-w-[320px] items-center justify-center gap-3 rounded-md border border-white/15 bg-white/[0.06] px-4 py-2.5 text-white/90 backdrop-blur transition hover:bg-white/10"
        >
          {copied ? <Check className="size-5 text-emerald-400" /> : <Copy className="size-5" />}
          <span className="truncate">{copied ? "Copied to clipboard!" : email}</span>
        </button>
      </div>
    </div>
  );
}

/* ---------------- Inside my workspace: faded service cards marquee ---------------- */
function WorkspaceCard() {
  const services = Object.entries(exp.contributions).map(([title, bullets]) => ({
    title,
    body: (bullets as string[])[0],
  }));
  return (
    <div className={`${cardBase} col-span-6 h-[22rem] md:col-span-6 md:h-auto lg:col-span-4`}>
      <div className="absolute inset-x-0 top-8 [mask-image:linear-gradient(to_bottom,black_30%,transparent_85%)]">
        <Marquee pauseOnHover duration="30s" className="[--gap:1.25rem]">
          {services.map((s) => (
            <figure
              key={s.title}
              className="relative h-40 w-44 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 blur-[0.6px] transition-all duration-300 ease-out hover:bg-white/[0.08] hover:blur-none"
            >
              <figcaption className="font-instrument text-lg leading-tight text-white/80">{s.title}</figcaption>
              <p className="mt-2 line-clamp-4 font-instrument text-sm leading-snug text-white/45">{s.body}</p>
            </figure>
          ))}
        </Marquee>
      </div>
      <div className="relative z-10 mt-auto">
        <CardFooter
          Icon={PanelsTopLeft}
          eyebrow="Inside My Workspace"
          title={`Currently engineering quality for payment systems at ${exp.company.replace(" Private Limited", "")}`}
          cta="See Experience"
          target="experience"
        />
      </div>
    </div>
  );
}

export default function Bento() {
  return (
    <section className="w-full px-4 py-10 md:px-5">
      <motion.div
        initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto grid w-full grid-cols-6 gap-4 md:auto-rows-[19rem]"
      >
        <TrustCard />
        <TechCard />
        <TimezoneCard />
        <WorkTogetherCard />
        <WorkspaceCard />
      </motion.div>
    </section>
  );
}
