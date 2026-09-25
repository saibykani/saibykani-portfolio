"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Award, BadgeCheck, ChevronDown, Command, Download, FileText, GraduationCap } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/brandIcons";
import resumeData from "@/data/resumeData.json";
import CommandMenu, { scrollToId } from "@/components/CommandMenu";
import Monogram from "@/components/ui/Monogram";

const navLinks = [
  { name: "Home", id: "home" },
  { name: "About", id: "about" },
  { name: "Work", id: "projects" },
  { name: "Experience", id: "experience" },
  { name: "Skills", id: "skills" },
];

function Indicator() {
  return (
    <motion.span
      layoutId="nav-active"
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="absolute inset-0 -z-10 w-full rounded-full bg-white/15"
    >
      <span className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-white">
        <span className="absolute -top-2 -left-2 h-6 w-12 rounded-full bg-white/20 blur-md" />
        <span className="absolute -top-1 h-6 w-8 rounded-full bg-white/20 blur-md" />
        <span className="absolute top-0 left-2 h-4 w-4 rounded-full bg-white/20 blur-sm" />
      </span>
    </motion.span>
  );
}

function MoreMenu({ onPick }: { onPick: () => void }) {
  const { linkedin, github } = resumeData.personal;
  const edu = resumeData.education[0];
  const list = [
    { Icon: FileText, title: "Resume", desc: "Printable one-page resume", href: "/resume" },
    { Icon: Download, title: "Download CV", desc: "Get the PDF version", href: "/Sai_Krishna_Bykani_Resume.pdf", download: true },
    { Icon: Award, title: "Achievements", desc: "Milestones worth celebrating", href: "/#achievements" },
    { Icon: LinkedInIcon, title: "LinkedIn", desc: "Let's connect professionally", href: linkedin, external: true },
    { Icon: GitHubIcon, title: "GitHub", desc: "Code & automation frameworks", href: github, external: true },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -8, scale: 0.98, filter: "blur(6px)" }}
      transition={{ duration: 0.2 }}
      className="grid w-[650px] grid-cols-2 gap-4 rounded-2xl border border-white/[0.08] bg-zinc-900/[0.98] p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
    >
      <div className="flex flex-col gap-4">
        <button
          onClick={() => {
            onPick();
            scrollToId("certifications");
          }}
          className="group relative h-[188px] overflow-hidden rounded-xl border border-white/10 text-left"
        >
          <Image src="/certs/ibm-ai-fundamentals.jpg" alt="" fill sizes="300px" className="object-cover object-top transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
          <div className="absolute bottom-4 left-4">
            <p className="flex items-center gap-2 text-lg font-semibold text-white">
              <BadgeCheck className="size-5 text-sky-400" /> Certifications
            </p>
            <p className="text-sm text-white/70">IBM &amp; Google AI credentials</p>
          </div>
        </button>
        <button
          onClick={() => {
            onPick();
            scrollToId("about");
          }}
          className="group relative h-[188px] overflow-hidden rounded-xl border border-white/10 text-left"
        >
          <Image src="/portrait.png" alt="" fill sizes="300px" className="object-cover object-[50%_25%] transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <p className="flex items-center gap-2 text-lg font-semibold text-white">
              <GraduationCap className="size-5" /> Education
            </p>
            <p className="text-sm text-white/70">{edu.degree.split(",")[0]} · {edu.duration.split("–")[1]?.trim()}</p>
          </div>
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {list.map(({ Icon, title, desc, href, external, download }) => (
          <Link
            key={title}
            href={href}
            onClick={onPick}
            {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
            {...(download ? { download: "Sai_Krishna_Bykani_Resume.pdf" } : {})}
            className="group flex flex-1 items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.08]"
          >
            <span className="flex size-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-transform duration-300 group-hover:scale-110">
              <Icon className="size-5 text-white" />
            </span>
            <span>
              <span className="block font-medium text-white">{title}</span>
              <span className="block text-sm text-white/60">{desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

export default function Navbar() {
  const [active, setActive] = useState("home");
  const [hovered, setHovered] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [cmd, setCmd] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ids = [...navLinks.map((l) => l.id), "contact"];
    const onScroll = () => {
      const sy = window.scrollY;
      const y = sy + window.innerHeight * 0.35;
      let current = "home";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y) current = id;
      }
      setActive(current);
      // hide on fast scroll down, reveal on scroll up
      setHidden(sy > 400 && sy > lastY.current + 4);
      if (sy < lastY.current - 4 || sy < 400) setHidden(false);
      lastY.current = sy;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd((c) => !c);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMore(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const go = (id: string) => {
    setOpen(false);
    setMore(false);
    scrollToId(id);
  };

  const highlighted = hovered ?? active;

  return (
    <>
      <motion.header
        animate={{ y: hidden && !more ? -100 : 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-2.5 z-[5000] w-full md:top-4 no-print"
      >
        <motion.nav
          initial={{ opacity: 0, y: -20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full items-center justify-between px-4 py-1.5 md:px-6"
        >
          {/* Logo */}
          <button onClick={() => go("home")} className="hidden h-10 items-center transition-transform duration-300 hover:scale-110 md:flex" aria-label="Home">
            <Monogram className="text-[32px]" />
          </button>

          {/* Mobile pill */}
          <div className="relative mx-auto flex justify-center md:hidden">
            <div className="relative flex min-h-10 flex-col items-center justify-center rounded-[22px] bg-black/30 px-1 py-1 shadow-border backdrop-blur-2xl">
              <button onClick={() => setOpen((o) => !o)} className="flex min-w-[11.5rem] cursor-pointer select-none items-center justify-between gap-2 px-4">
                <Monogram className="text-[22px]" />
                <span className="text-[18px] font-medium text-white">Sai Krishna</span>
                <ChevronDown className={`size-4 text-white/70 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {open && (
                  <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="w-full overflow-hidden">
                    {[...navLinks, { name: "Contact", id: "contact" }].map((l, i) => (
                      <motion.li key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                        <button
                          onClick={() => go(l.id)}
                          className={`w-full rounded-2xl px-4 py-2.5 text-left text-sm font-light transition-colors ${
                            active === l.id ? "bg-white/10 text-white" : "text-white/70 hover:text-white"
                          }`}
                        >
                          {l.name}
                        </button>
                      </motion.li>
                    ))}
                    <li>
                      <Link href="/resume" className="block w-full rounded-2xl px-4 py-2.5 text-left text-sm font-light text-white/70 hover:text-white">
                        Resume
                      </Link>
                    </li>
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Desktop pill */}
          <div ref={moreRef} className="relative hidden md:flex">
            <div
              onMouseLeave={() => setHovered(null)}
              className="relative flex items-center justify-center gap-1 rounded-[22px] bg-white/10 px-1 py-1 shadow-border backdrop-blur-2xl"
            >
              {navLinks.map((link) => (
                <div key={link.id} className="relative">
                  <button
                    onMouseEnter={() => setHovered(link.id)}
                    onClick={() => go(link.id)}
                    className="relative block cursor-pointer px-4 py-1.5 text-sm font-light text-white transition hover:text-white"
                  >
                    <span className={highlighted === link.id ? "text-white" : "text-white/80"}>{link.name}</span>
                  </button>
                  {highlighted === link.id && <Indicator />}
                </div>
              ))}
              <div className="relative">
                <button
                  onMouseEnter={() => setHovered("more")}
                  onClick={() => setMore((m) => !m)}
                  className="flex cursor-pointer items-center gap-1 px-4 py-1.5 text-sm font-light text-white/80 transition hover:text-white"
                >
                  More <ChevronDown className={`size-3.5 transition-transform duration-300 ${more ? "rotate-180" : ""}`} />
                </button>
                {highlighted === "more" && <Indicator />}
              </div>
              <div className="relative">
                <button
                  onMouseEnter={() => setHovered("contact")}
                  onClick={() => go("contact")}
                  className={`relative block cursor-pointer rounded-full px-4 py-1.5 text-sm font-light text-white transition ${
                    highlighted === "contact" ? "" : "bg-white/15 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                  }`}
                >
                  Contact
                </button>
                {highlighted === "contact" && <Indicator />}
              </div>
            </div>
            <div className="absolute left-1/2 top-full z-50 mt-3 -translate-x-1/2">
              <AnimatePresence>{more && <MoreMenu onPick={() => setMore(false)} />}</AnimatePresence>
            </div>
          </div>

          {/* Command menu trigger */}
          <button
            onClick={() => setCmd(true)}
            aria-label="Open command menu"
            className="group hidden size-10 items-center justify-center rounded-full text-white transition hover:bg-white/10 md:flex"
          >
            <Command className="size-6 transition-transform duration-300 group-hover:rotate-90" />
          </button>
        </motion.nav>
      </motion.header>

      <CommandMenu open={cmd} onClose={() => setCmd(false)} />
    </>
  );
}
