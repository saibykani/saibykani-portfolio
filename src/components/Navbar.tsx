"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const navLinks = [
  { name: "Home", id: "home" },
  { name: "About", id: "about" },
  { name: "Experience", id: "experience" },
  { name: "Work", id: "projects" },
  { name: "Skills", id: "skills" },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: id === "home" ? 0 : el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
}

export default function Navbar() {
  const [active, setActive] = useState("home");
  const [hovered, setHovered] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const ids = [...navLinks.map((l) => l.id), "contact"];
    const onScroll = () => {
      const y = window.scrollY + window.innerHeight * 0.35;
      let current = "home";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  const highlighted = hovered ?? active;

  return (
    <header className="fixed top-2.5 z-[5000] w-full md:top-4 no-print">
      <motion.nav
        initial={{ opacity: 0, y: -20, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="container flex justify-between py-1.5"
      >
        {/* Logo */}
        <button onClick={() => go("home")} className="relative hidden h-10 w-10 md:block" aria-label="Home">
          <Image src="/logo.png" alt="Sai Krishna Bykani logo" fill sizes="40px" className="rounded-full object-contain" />
        </button>

        {/* Mobile pill */}
        <div className="relative mx-auto flex justify-center md:hidden">
          <div className="relative flex min-h-10 flex-col items-center justify-center rounded-[22px] bg-black/30 px-1 py-1 shadow-border backdrop-blur-2xl">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex min-w-[11.5rem] cursor-pointer select-none items-center justify-between gap-2 px-4"
            >
              <span className="relative h-[30px] w-[30px] shrink-0">
                <Image src="/logo.png" alt="Logo" fill sizes="30px" className="rounded-full object-contain" />
              </span>
              <span className="text-[18px] font-medium text-white">Sai Krishna</span>
              <ChevronDown className={`size-4 text-white/70 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {open && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="w-full overflow-hidden"
                >
                  {[...navLinks, { name: "Contact", id: "contact" }].map((l) => (
                    <li key={l.id}>
                      <button
                        onClick={() => go(l.id)}
                        className={`w-full rounded-2xl px-4 py-2.5 text-left text-sm font-light transition-colors ${
                          active === l.id ? "bg-white/10 text-white" : "text-white/70 hover:text-white"
                        }`}
                      >
                        {l.name}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop pill */}
        <div className="relative hidden justify-between md:flex">
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
                  <span className={highlighted === link.id ? "text-white" : "text-white/75"}>{link.name}</span>
                </button>
                {highlighted === link.id && (
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
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <button
          onClick={() => go("contact")}
          className="relative hidden cursor-pointer items-center rounded-full bg-white/10 px-5 py-2 text-sm font-light text-white shadow-border backdrop-blur-2xl transition-colors hover:bg-white/20 md:inline-flex"
        >
          Contact
        </button>
      </motion.nav>
    </header>
  );
}
