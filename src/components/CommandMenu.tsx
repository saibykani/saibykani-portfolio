"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Gamepad2,
  BadgeCheck,
  Briefcase,
  Code2,
  Copy,
  Download,
  FileText,
  FolderKanban,
  Home,
  Mail,
  Search,
  User,
} from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/brandIcons";
import resumeData from "@/data/resumeData.json";

type Action = { label: string; group: string; Icon: typeof Home; run: () => void; hint?: string };

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: id === "home" ? 0 : el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
}

export default function CommandMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { email, linkedin, github } = resumeData.personal;

  const actions: Action[] = useMemo(
    () => [
      { group: "Navigate", label: "Home", Icon: Home, run: () => scrollToId("home") },
      { group: "Navigate", label: "About", Icon: User, run: () => scrollToId("about") },
      { group: "Navigate", label: "Work", Icon: FolderKanban, run: () => scrollToId("projects") },
      { group: "Navigate", label: "Experience", Icon: Briefcase, run: () => scrollToId("experience") },
      { group: "Navigate", label: "Skills", Icon: Code2, run: () => scrollToId("skills") },
      { group: "Navigate", label: "Achievements", Icon: Award, run: () => scrollToId("achievements") },
      { group: "Navigate", label: "Certifications", Icon: BadgeCheck, run: () => scrollToId("certifications") },
      { group: "Navigate", label: "Contact", Icon: Mail, run: () => scrollToId("contact") },
      { group: "Fun", label: "Play Bug Hunt", Icon: Gamepad2, run: () => scrollToId("game") },
      { group: "Resume", label: "Open resume page", Icon: FileText, run: () => (window.location.href = "/resume") },
      {
        group: "Resume",
        label: "Download CV (PDF)",
        Icon: Download,
        run: () => {
          const a = document.createElement("a");
          a.href = "/Sai_Krishna_Bykani_Resume.pdf";
          a.download = "Sai_Krishna_Bykani_Resume.pdf";
          a.click();
        },
      },
      { group: "Connect", label: "Copy email", hint: email, Icon: Copy, run: () => navigator.clipboard?.writeText(email) },
      { group: "Connect", label: "LinkedIn", Icon: LinkedInIcon as any, run: () => window.open(linkedin, "_blank") },
      { group: "Connect", label: "GitHub", Icon: GitHubIcon as any, run: () => window.open(github, "_blank") },
    ],
    [email, linkedin, github]
  );

  const filtered = actions.filter((a) => (a.label + " " + a.group).toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    setQ("");
    setSel(0);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => setSel(0), [q]);

  const runAt = (i: number) => {
    const a = filtered[i];
    if (!a) return;
    onClose();
    setTimeout(a.run, 60);
  };

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[7000] flex items-start justify-center bg-black/60 px-4 pt-[15vh] backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.96, y: -10, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <Search className="size-4 text-neutral-500" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSel((s) => Math.min(s + 1, filtered.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSel((s) => Math.max(s - 1, 0));
                  } else if (e.key === "Enter") {
                    runAt(sel);
                  } else if (e.key === "Escape") {
                    onClose();
                  }
                }}
                placeholder="Type a command or search..."
                className="h-12 w-full bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
              />
              <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">ESC</kbd>
            </div>
            <div data-lenis-prevent className="max-h-[50vh] overflow-y-auto p-2">
              {filtered.length === 0 && <p className="py-8 text-center text-sm text-neutral-500">No results found.</p>}
              {filtered.map((a, i) => {
                const header = a.group !== lastGroup ? a.group : null;
                lastGroup = a.group;
                return (
                  <div key={a.label}>
                    {header && <p className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-widest text-neutral-500">{header}</p>}
                    <button
                      onMouseEnter={() => setSel(i)}
                      onClick={() => runAt(i)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        sel === i ? "bg-white/10 text-white" : "text-neutral-300"
                      }`}
                    >
                      <a.Icon className="size-4 text-neutral-400" />
                      <span className="flex-1">{a.label}</span>
                      {a.hint && <span className="text-xs text-neutral-500">{a.hint}</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
