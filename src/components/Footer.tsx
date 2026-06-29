"use client";

import Link from "next/link";
import { ArrowUp, Mail, Download, Heart, Compass, ShieldCheck } from "lucide-react";
import resumeData from "@/data/resumeData.json";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-[#050508] pt-24 pb-12 z-20 overflow-hidden font-sans border-t border-white/5">
      {/* Dynamic top gradient line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-theme/40 to-transparent" />
      
      {/* Background glow overlay */}
      <div className="absolute bottom-0 right-[-10%] w-[300px] h-[300px] rounded-full bg-accent-theme-glow filter blur-[120px] pointer-events-none opacity-40" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Footer Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-white/5">
          
          {/* Column 1: Brand & Tagline (5 Cols) */}
          <div className="md:col-span-5 space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {resumeData.personal.name}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Software Development Engineer in Test (SDET) specializing in distributed API performance testing, checkout UI automation, and payment database reconciliations.
            </p>
            <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-theme" />
              <span>Fintech Quality Assured</span>
            </div>
          </div>

          {/* Column 2: Navigation Links (3 Cols) */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
              <Compass className="w-3 h-3 mr-1.5 text-accent-theme" />
              Navigation
            </h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-slate-400">
              <li>
                <a href="#home" className="hover:text-white transition-colors">Overview</a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">About Me</a>
              </li>
              <li>
                <a href="#experience" className="hover:text-white transition-colors">Experience</a>
              </li>
              <li>
                <a href="#skills" className="hover:text-white transition-colors">Tech Stack</a>
              </li>
              <li>
                <a href="#projects" className="hover:text-white transition-colors">Projects</a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors">Connect</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Professional Connect (4 Cols) */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Professional Assets
            </h4>
            
            <div className="flex items-center space-x-3 pb-2">
              <a 
                href={resumeData.personal.linkedin} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-accent-theme transition-all"
                title="LinkedIn"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a 
                href={resumeData.personal.github} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-accent-theme transition-all"
                title="GitHub"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
              <a 
                href={`mailto:${resumeData.personal.email}`}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-accent-theme transition-all"
                title="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>

            <Link 
              href="/resume" 
              target="_blank"
              className="inline-flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-black text-xs font-extrabold uppercase tracking-widest hover:bg-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-white/5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              <span>View & Print Resume</span>
            </Link>
          </div>

        </div>

        {/* Footer Bottom Metadata */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
          <p>
            &copy; {new Date().getFullYear()} {resumeData.personal.name}. All Rights Reserved.
          </p>
          
          <div className="flex items-center space-x-1">
            <span>Built with</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
            <span>&amp; Next.js</span>
          </div>

          <button 
            onClick={scrollToTop}
            className="group flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-slate-400 hover:text-white cursor-pointer"
            aria-label="Back to top"
          >
            <ArrowUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
}
