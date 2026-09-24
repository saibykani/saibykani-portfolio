"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { BadgeCheck, Check, Copy, ExternalLink, Gem, Maximize2, X } from "lucide-react";
import resumeData from "@/data/resumeData.json";
import { Reveal, SectionHeading } from "@/components/ui/primitives";

type Cert = (typeof resumeData.certifications)[number] & { courses?: string[] };

function IssuerLogo({ issuer }: { issuer: string }) {
  if (issuer === "Google") {
    return (
      <svg viewBox="0 0 48 48" className="size-9" aria-label="Google">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
    );
  }
  return (
    <span className="flex h-9 items-center font-mono text-2xl font-black tracking-[0.12em] text-[#4589ff] [text-shadow:0_0_12px_rgba(69,137,255,0.5)]" aria-label="IBM">
      IBM
    </span>
  );
}

function CertCard({ cert, index, onOpen }: { cert: Cert; index: number; onOpen: () => void }) {
  const [copied, setCopied] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 160, damping: 16 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 160, damping: 16 });
  const glowX = useTransform(mx, [-0.5, 0.5], ["0%", "100%"]);
  const glowY = useTransform(my, [-0.5, 0.5], ["0%", "100%"]);
  const glow = useTransform(
    [glowX, glowY] as any,
    ([x, y]: any) => `radial-gradient(400px circle at ${x} ${y}, ${cert.accent}33, transparent 60%)`
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cert.credentialId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <Reveal delay={index * 0.12} className="min-w-0 [perspective:1200px]">
      <motion.article
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width - 0.5);
          my.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onMouseLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="group relative h-full overflow-hidden rounded-3xl bg-[#f2f2f20c] p-1.5 shadow-border"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(0,0,0,0)_5%,rgba(255,255,255,0.8)_35%,rgb(255,255,255)_50%,rgba(255,255,255,0.8)_65%,rgba(0,0,0,0)_95%)]" />
        {/* cursor glow */}
        <motion.div
          className="pointer-events-none absolute -inset-px z-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glow }}
        />
        <div className="relative z-10 flex h-full flex-col rounded-[1.3rem] bg-gradient-to-b from-zinc-900/90 to-black p-5 sm:p-6">
          {/* certificate preview */}
          <button
            onClick={onOpen}
            className="relative block aspect-[1287/994] w-full overflow-hidden rounded-xl border border-white/10 bg-white"
            style={{ transform: "translateZ(30px)" }}
            aria-label={`View ${cert.name} certificate`}
          >
            <Image
              src={cert.image}
              alt={`${cert.name} certificate`}
              fill
              sizes="(max-width: 768px) 100vw, 560px"
              className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
            {/* shine sweep */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs text-white opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
              <Maximize2 className="size-3.5" /> View
            </span>
          </button>

          <div className="mt-6 flex items-start gap-4" style={{ transform: "translateZ(20px)" }}>
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <IssuerLogo issuer={cert.issuer} />
            </span>
            <div className="min-w-0">
              <h3 className="font-instrument text-2xl leading-tight text-white md:text-3xl">{cert.name}</h3>
              <p className="mt-1 text-sm text-neutral-300">
                {cert.issuer} <span className="text-neutral-500">· {cert.platform}</span>
              </p>
              <p className="text-sm text-neutral-500">Issued {cert.issued}</p>
            </div>
            <BadgeCheck className="ml-auto size-6 shrink-0" style={{ color: cert.accent }} />
          </div>

          <button
            onClick={copy}
            className="mt-4 flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-left font-mono text-xs text-neutral-400 transition hover:border-white/20 hover:text-neutral-200"
          >
            <span className="truncate">
              <span className="text-neutral-600">Credential ID </span>
              {cert.credentialId}
            </span>
            {copied ? <Check className="size-4 shrink-0 text-emerald-400" /> : <Copy className="size-4 shrink-0" />}
          </button>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Gem className="size-4 text-neutral-400" />
            {cert.skills.map((s) => (
              <span key={s} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-neutral-200">
                {s}
              </span>
            ))}
            {cert.moreSkills ? <span className="text-xs text-neutral-500">+{cert.moreSkills} skills</span> : null}
          </div>

          {cert.courses && (
            <ul className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {cert.courses.map((c, i) => (
                <motion.li
                  key={c}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  className="flex items-center gap-2 text-xs text-neutral-400"
                >
                  <span className="size-1.5 rounded-full" style={{ background: cert.accent }} />
                  {c}
                </motion.li>
              ))}
            </ul>
          )}

          <div className="mt-auto flex flex-wrap gap-3 pt-6">
            <a
              href={cert.url}
              target="_blank"
              rel="noreferrer"
              className="group/btn inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm text-white transition-all hover:border-white hover:bg-white hover:text-black"
            >
              Show credential
              <ExternalLink className="size-4 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
            </a>
            <button onClick={onOpen} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white">
              <Maximize2 className="size-4" /> Preview
            </button>
          </div>
        </div>
      </motion.article>
    </Reveal>
  );
}

function Lightbox({ cert, onClose }: { cert: Cert; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[6500] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.85, rotateX: 20, opacity: 0, y: 40 }}
        animate={{ scale: 1, rotateX: 0, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl"
      >
        <div className="relative aspect-[1287/994] w-full overflow-hidden rounded-2xl bg-white shadow-[0_0_80px_rgba(255,255,255,0.15)]">
          <Image src={cert.image} alt={`${cert.name} certificate`} fill sizes="900px" className="object-contain" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-instrument text-2xl text-white">{cert.name}</p>
          <a href={cert.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-black">
            Verify <ExternalLink className="size-4" />
          </a>
        </div>
        <button onClick={onClose} aria-label="Close" className="absolute -top-3 -right-3 flex size-10 items-center justify-center rounded-full bg-white text-black shadow-xl transition hover:rotate-90">
          <X className="size-5" />
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function Certifications() {
  const certs = resumeData.certifications as Cert[];
  const [open, setOpen] = useState<Cert | null>(null);
  return (
    <section className="container relative py-10">
      <div className="pointer-events-none absolute left-1/2 top-40 -z-10 h-72 w-[70%] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[100px]" />
      <SectionHeading eyebrow="Licenses & Certifications" title="Certified in" highlight="AI" className="mb-16 md:mb-20" />
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
        {certs.map((c, i) => (
          <CertCard key={c.id} cert={c} index={i} onOpen={() => setOpen(c)} />
        ))}
      </div>
      <AnimatePresence>{open && <Lightbox cert={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </section>
  );
}
