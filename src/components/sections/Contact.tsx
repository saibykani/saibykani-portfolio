"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Mail, MapPin, Phone, Send } from "lucide-react";
import resumeData from "@/data/resumeData.json";
import { ArrowPillButton, Reveal } from "@/components/ui/primitives";

function Wing({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 160 90" className={`h-14 w-28 md:h-20 md:w-40 ${flip ? "-scale-x-100" : ""}`} fill="none">
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M158 ${70 - i * 4} C ${120 - i * 6} ${62 - i * 12}, ${70 - i * 10} ${48 - i * 10}, ${6 + i * 8} ${40 - i * 8}`}
          stroke="url(#wing-grad)"
          strokeWidth={2.4 - i * 0.3}
          strokeLinecap="round"
        />
      ))}
      <defs>
        <linearGradient id="wing-grad" x1="160" y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.9" />
          <stop offset="1" stopColor="white" stopOpacity="0.05" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-600 transition-all focus:border-white/30 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-white/10";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { email, phone, location, name } = resumeData.personal;

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

  return (
    <div id="contact">
      {/* CTA */}
      <section className="relative z-0 mt-10 flex w-full justify-center overflow-x-hidden px-4 py-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_40%,rgba(37,99,235,0.35),transparent_70%)]" />
        <div className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />

        <Reveal className="container relative z-10 mx-auto flex w-full flex-col items-center justify-center gap-y-2 py-10 text-center">
          <div className="relative flex items-center justify-center">
            <Wing flip />
            <motion.span
              animate={{ y: [0, -6, 0] }}
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
          <button onClick={scrollToForm} className="my-10 transition-transform hover:scale-110">
            <ArrowPillButton className="py-1 opacity-90">Get In Touch</ArrowPillButton>
          </button>
          <p className="text-base font-semibold text-white lg:text-2xl">I&apos;m available for full-time SDET &amp; QA automation roles.</p>
          <p className="my-2 text-balance text-sm font-extralight tracking-wide text-white/75 lg:text-xl">
            I thrive on building reliable automation frameworks and
            <br className="hidden sm:block" /> shipping payment systems with confidence.
          </p>
        </Reveal>
      </section>

      {/* Form */}
      <section id="contact-form" className="container pb-20">
        <Reveal>
          <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-5">
            {/* Contact details */}
            <div className="relative overflow-hidden rounded-2xl bg-[radial-gradient(94.21%_78.4%_at_50%_29.91%,rgba(39,61,180,0.7),rgba(15,9,38,0.4))] p-6 shadow-border lg:col-span-2 lg:p-8">
              <p className="font-mono text-xs uppercase tracking-widest text-white/60">Contact</p>
              <h3 className="mt-2 font-instrument text-4xl text-white">{name}</h3>
              <p className="mt-2 text-sm font-light text-white/70">
                Reach out to discuss an opportunity, a testing engagement, or payment-systems QA.
              </p>
              <div className="mt-8 flex flex-col gap-5">
                {[
                  { Icon: Mail, label: "Email", value: email, href: `mailto:${email}` },
                  { Icon: Phone, label: "Phone", value: phone, href: `tel:${phone.replace(/\s/g, "")}` },
                  { Icon: MapPin, label: "Location", value: location },
                ].map(({ Icon, label, value, href }) => (
                  <div key={label} className="group flex items-center gap-4">
                    <span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-white/80 transition-colors group-hover:bg-white group-hover:text-black">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">{label}</p>
                      {href ? (
                        <a href={href} className="text-sm text-white hover:underline">
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm text-white">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form card */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md lg:col-span-3 lg:p-8">
              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex h-full flex-col items-center justify-center gap-4 py-12 text-center"
                  >
                    <span className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/30">
                      <Check className="size-8" />
                    </span>
                    <h4 className="font-instrument text-3xl text-white">Message delivered!</h4>
                    <p className="max-w-xs text-sm text-neutral-400">Thank you for reaching out. I&apos;ll get back to you shortly.</p>
                    <button
                      onClick={() => setStatus("idle")}
                      className="mt-2 rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm text-white transition hover:bg-white/10"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Your Name</span>
                        <input name="name" required placeholder="John Doe" className={inputCls} />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Email Address</span>
                        <input type="email" name="email" required placeholder="john@example.com" className={inputCls} />
                      </label>
                    </div>
                    <label className="flex flex-col gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Mobile Number</span>
                      <input type="tel" name="phone" placeholder="+91 98765 43210" className={inputCls} />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Message</span>
                      <textarea name="message" required rows={4} placeholder="Hello Sai, I'd like to discuss an opportunity..." className={`${inputCls} resize-none`} />
                    </label>
                    {status === "error" && (
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-xs text-red-400">{errorMessage}</div>
                    )}
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="group relative mt-2 flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white py-3 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-70"
                    >
                      {status === "loading" ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <Send className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
