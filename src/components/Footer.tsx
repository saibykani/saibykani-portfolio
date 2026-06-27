"use client";

import Link from "next/link";
import resumeData from "@/data/resumeData.json";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative border-t border-white/5 bg-[#050508]/90 backdrop-blur-xl py-12 z-20 overflow-hidden font-sans">
      {/* Background radial glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/10 to-transparent" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-extrabold tracking-wider text-white">
              SAI KRISHNA
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span className="text-[10px] text-slate-500 tracking-wider font-semibold uppercase pl-2 border-l border-white/10">
              SDET & Quality Architect
            </span>
          </div>

          {/* Nav tags */}
          <div className="flex items-center space-x-6 text-[10px] font-bold tracking-widest uppercase">
            <Link href="#about" className="text-slate-400 hover:text-white transition-colors">About</Link>
            <Link href="#skills" className="text-slate-400 hover:text-white transition-colors">Skills</Link>
            <Link href="#projects" className="text-slate-400 hover:text-white transition-colors">Projects</Link>
            <Link href="/resume" className="text-slate-400 hover:text-white transition-colors">Resume</Link>
          </div>

          {/* Socials */}
          <div className="flex items-center space-x-3">
            <a
              href={resumeData.personal.linkedin}
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full border border-white/10 bg-white/5 hover:bg-orange-600 hover:border-orange-500/30 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-300"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a
              href={resumeData.personal.github}
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full border border-white/10 bg-white/5 hover:bg-orange-600 hover:border-orange-500/30 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-300"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>
          </div>

        </div>

        {/* Copy Sign */}
        <div className="pt-8 mt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-[9px] text-slate-500 font-semibold tracking-wider">
          <p>&copy; {new Date().getFullYear()} Sai Krishna Bykani. Reconstructed in luxury space-dark styling.</p>
          <button
            onClick={scrollToTop}
            className="mt-4 sm:mt-0 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-450 hover:text-white transition-colors"
          >
            Back to Top
          </button>
        </div>
      </div>
    </footer>
  );
}
