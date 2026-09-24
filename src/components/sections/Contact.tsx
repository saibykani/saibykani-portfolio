"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Check, Copy, HelpCircle, Loader2, Mail, MapPin, Phone, Send } from "lucide-react";
import resumeData from "@/data/resumeData.json";
import { ArrowPillButton, Reveal, SectionHeading } from "@/components/ui/primitives";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/brandIcons";

/* Crumpled dark fabric texture, generated with SVG lighting (no image asset needed) */
function FabricTexture() {
  return (
    <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      <filter id="fabric" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.0022 0.0038" numOctaves="3" seed="11" result="noise" />
        <feDiffuseLighting in="noise" lightingColor="#ffffff" surfaceScale="18" diffuseConstant="1" result="light">
          <feDistantLight azimuth="235" elevation="38" />
        </feDiffuseLighting>
        <feColorMatrix
          type="matrix"
          values="0.1 0.1 0.1 0 -0.12  0.1 0.1 0.1 0 -0.12  0.104 0.104 0.104 0 -0.115  0 0 0 1 0"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#fabric)" />
    </svg>
  );
}

function Wing({ flip = false }: { flip?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 160 90"
      className={`h-14 w-28 md:h-20 md:w-40 ${flip ? "-scale-x-100" : ""}`}
      fill="none"
      style={{ originX: flip ? 0 : 1 }}
      animate={{ rotate: flip ? [0, 6, 0] : [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.path
          key={i}
          d={`M158 ${70 - i * 4} C ${120 - i * 6} ${62 - i * 12}, ${70 - i * 10} ${48 - i * 10}, ${6 + i * 8} ${40 - i * 8}`}
          stroke="url(#wing-grad)"
          strokeWidth={2.4 - i * 0.3}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: i * 0.12, ease: "easeOut" }}
        />
      ))}
      <defs>
        <linearGradient id="wing-grad" x1="160" y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.9" />
          <stop offset="1" stopColor="white" stopOpacity="0.05" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-base text-white placeholder:text-neutral-500 transition-all focus:border-white/30 focus:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white/10";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const { email, phone, location, linkedin, github } = resumeData.personal;

  const wrapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start end", "end start"] });
  const textureY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    const formData = new FormData(e.currentTarget);
    formData.append("_subject", "New Portfolio Message!");
    formData.append("_captcha", "false");
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${email}`, { method: "POST", body: formData });
      if (response.ok) {
        setStatus("success");
      } else {
        setErrorMessage("Failed to deliver message.");
        setStatus("error");
      }
    } catch {
      setErrorMessage("Something went wrong. Please check your network.");
      setStatus("error");
    }
  };

  const scrollToForm = () => {
    const el = document.getElementById("contact-form");
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
  };

  const cards = [
    { Icon: Mail, title: "Email me", value: email, href: `mailto:${email}` },
    { Icon: Phone, title: "Call me", value: phone, href: `tel:${phone.replace(/\s/g, "")}` },
    { Icon: MapPin, title: "My location", value: location, href: `https://www.google.com/maps/search/${encodeURIComponent(location)}` },
  ];

  return (
    <div id="contact" ref={wrapRef} className="relative isolate overflow-hidden">
      {/* Fabric background with parallax */}
      <motion.div style={{ y: textureY }} className="absolute -inset-y-[10%] inset-x-0 -z-10">
        <FabricTexture />
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(70%_45%_at_50%_18%,rgba(37,99,235,0.18),transparent_70%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-56 bg-gradient-to-b from-black to-transparent" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-72 bg-gradient-to-t from-black to-transparent" />

      {/* CTA */}
      <section className="relative flex w-full justify-center px-4 pb-10 pt-24">
        <Reveal className="container relative mx-auto flex w-full flex-col items-center justify-center gap-y-2 py-10 text-center">
          <div className="relative flex items-center justify-center">
            <Wing flip />
            <motion.span
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative mx-1 block size-14 overflow-hidden rounded-full bg-white shadow-[0_0_40px_rgba(255,255,255,0.35)] md:size-16"
            >
              <Image src="/logo.png" alt="Logo" fill sizes="64px" className="object-contain" />
            </motion.span>
            <Wing />
          </div>
          <div className="mt-4 text-[18px] font-light tracking-wide text-white sm:text-4xl lg:text-5xl">
            <h3 className="text-nowrap">
              FROM TEST PLAN TO <span className="font-extrabold">PRODUCTION</span>
            </h3>
            <h3 className="mt-3 text-nowrap">
              LET&apos;S SHIP IT <span className="font-extrabold">RIGHT!</span>
            </h3>
          </div>
          <button onClick={scrollToForm} className="my-10 transition-transform duration-300 hover:scale-110">
            <ArrowPillButton className="py-1 opacity-90">Get In Touch</ArrowPillButton>
          </button>
          <p className="text-base font-semibold text-white lg:text-2xl">I&apos;m available for full-time SDET &amp; QA automation roles.</p>
          <p className="my-2 text-balance text-sm font-extralight tracking-wide text-white/75 lg:text-xl">
            I thrive on building reliable automation frameworks and
            <br className="hidden sm:block" /> shipping payment systems with confidence.
          </p>
        </Reveal>
      </section>

      {/* Let's Get In Touch */}
      <section className="container relative flex flex-col items-center pb-16 pt-10">
        <SectionHeading eyebrow="Contact" title="Let's Get" highlight="In Touch" />
        <Reveal delay={0.1} className="mt-8 flex flex-col items-center gap-5">
          <button onClick={copyEmail} className="flex items-center gap-2 rounded-full px-3 py-1.5 text-lg text-white/90 transition hover:bg-white/5">
            {copied ? <Check className="size-5 text-emerald-400" /> : <Copy className="size-5" />}
            {copied ? "Copied to clipboard!" : email}
          </button>
          <div className="flex items-center gap-4 text-white/80">
            <motion.a whileHover={{ y: -3, scale: 1.1 }} href={linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-white">
              <LinkedInIcon />
            </motion.a>
            <motion.a whileHover={{ y: -3, scale: 1.1 }} href={github} target="_blank" rel="noreferrer" aria-label="GitHub" className="hover:text-white">
              <GitHubIcon />
            </motion.a>
            <motion.a whileHover={{ y: -3, scale: 1.1 }} href={`mailto:${email}`} aria-label="Email" className="hover:text-white">
              <Mail className="size-6" />
            </motion.a>
          </div>
        </Reveal>
      </section>

      {/* Work together + form */}
      <section id="contact-form" className="container relative pb-24">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/90">
              <HelpCircle className="size-4 text-white/60" /> Contact
            </span>
            <h3 className="mt-5 text-4xl font-semibold tracking-tight text-white">Let&apos;s Work Together</h3>
            <p className="mt-5 text-lg font-light leading-relaxed text-neutral-300">
              I&apos;m always open to new opportunities, collaborations, and QA engagements. Whether you have a role, a
              testing challenge, or just want to say hi, feel free to reach out.
            </p>
            <div className="mt-10 flex flex-col gap-5">
              {cards.map(({ Icon, title, value, href }, i) => (
                <motion.a
                  key={title}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors duration-300 group-hover:bg-white group-hover:text-black">
                    <Icon className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-semibold text-white">{title}</span>
                    <span className="block truncate text-neutral-300">{value}</span>
                  </span>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-300 group-hover:rotate-45 group-hover:bg-white group-hover:text-black">
                    <ArrowUpRight className="size-4" />
                  </span>
                </motion.a>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/50 p-6 backdrop-blur-md sm:p-10">
              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center gap-4 py-16 text-center"
                  >
                    <motion.span
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 15 }}
                      className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/30"
                    >
                      <Check className="size-8" />
                    </motion.span>
                    <h4 className="font-instrument text-3xl text-white">Message delivered!</h4>
                    <p className="max-w-xs text-sm text-neutral-400">Thank you for reaching out. I&apos;ll get back to you shortly.</p>
                    <button onClick={() => setStatus("idle")} className="mt-2 rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm text-white transition hover:bg-white/10">
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">
                    <label className="flex flex-col gap-3">
                      <span className="text-white/90">Name</span>
                      <input name="name" required placeholder="Ex. John Doe" className={inputCls} />
                    </label>
                    <label className="flex flex-col gap-3">
                      <span className="text-white/90">Email</span>
                      <input type="email" name="email" required placeholder="Ex. john@example.com" className={inputCls} />
                    </label>
                    <label className="flex flex-col gap-3">
                      <span className="text-white/90">Message</span>
                      <textarea name="message" required rows={6} placeholder="Type your message..." className={`${inputCls} resize-none`} />
                    </label>
                    {status === "error" && (
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-xs text-red-400">{errorMessage}</div>
                    )}
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-white py-4 text-base font-medium text-black transition hover:bg-neutral-200 disabled:opacity-70"
                    >
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent group-hover:animate-shimmer" />
                      {status === "loading" ? (
                        <>
                          <Loader2 className="size-5 animate-spin" /> Sending...
                        </>
                      ) : (
                        <>
                          <Send className="size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          Send Message
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
