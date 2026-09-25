"use client";

import Monogram from "@/components/ui/Monogram";
import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import resumeData from "@/data/resumeData.json";

function go(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: id === "home" ? 0 : el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
}

export default function Footer() {
  const { name, linkedin, github, email } = resumeData.personal;

  const columns = [
    {
      title: "General",
      links: [
        { label: "Home", id: "home" },
        { label: "About", id: "about" },
        { label: "Experience", id: "experience" },
        { label: "Projects", id: "projects" },
      ],
    },
    {
      title: "Specifics",
      links: [
        { label: "Skills", id: "skills" },
        { label: "Contact", id: "contact" },
        { label: "Resume", href: "/resume" },
        { label: "Download CV", href: "/Sai_Krishna_Bykani_Resume.pdf" },
      ],
    },
    {
      title: "More",
      links: [
        { label: "LinkedIn", href: linkedin, external: true },
        { label: "GitHub", href: github, external: true },
        { label: "Email", href: `mailto:${email}`, external: true },
      ],
    },
  ];

  return (
    <footer className="relative z-20 border-t border-white/5 bg-black/75 no-print">
      <section className="container py-10">
        <div className="relative mb-10 flex flex-col items-center gap-6 md:flex-row">
          <div className="flex flex-1 flex-col items-start gap-4 md:flex-row md:justify-between">
            <div className="hidden flex-col gap-y-6 md:flex md:w-1/2">
              <button onClick={() => go("home")} className="flex h-10 w-fit items-center" aria-label="Back to top">
                <Monogram className="text-[32px]" />
              </button>
              <p className="w-64 text-base leading-5 text-gray-300">
                I&apos;m Sai — an SDET, automation engineer &amp; quality advocate. Thanks for checking out my site!
              </p>
            </div>
            <div className="flex w-full flex-col items-start justify-between gap-6 rounded-3xl p-5 max-sm:bg-white/5 sm:w-auto sm:flex-row sm:gap-16 lg:gap-24">
              {columns.map((col) => (
                <div key={col.title} className="flex flex-col gap-2 sm:gap-4">
                  <h4 className="font-mono text-sm uppercase text-neutral-400">{col.title}</h4>
                  <ul className="flex flex-wrap items-start gap-x-4 gap-y-2 text-base text-neutral-50 sm:flex-col sm:gap-y-3">
                    {col.links.map((l: any) => (
                      <li key={l.label}>
                        {l.id ? (
                          <button onClick={() => go(l.id)} className="link-underline group inline-flex items-center">
                            {l.label}
                          </button>
                        ) : l.external ? (
                          <a href={l.href} target="_blank" rel="noreferrer" className="link-underline group inline-flex items-center gap-1">
                            {l.label}
                            <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                          </a>
                        ) : (
                          <Link href={l.href} className="link-underline group inline-flex items-center">
                            {l.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-sm text-neutral-400">
            © {new Date().getFullYear()} {name}. All rights reserved. · Photography via Unsplash
          </p>
          <button
            onClick={() => go("home")}
            className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-neutral-300 transition hover:bg-white/10 hover:text-white"
          >
            Back to top <ArrowUp className="size-4 transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>

        {/* Big name wordmark */}
        <p className="pointer-events-none mt-10 select-none bg-gradient-to-b from-white/15 to-transparent bg-clip-text text-center font-instrument text-[16vw] leading-none text-transparent">
          Sai Bykani
        </p>
      </section>
    </footer>
  );
}
