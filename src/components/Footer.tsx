"use client";

import { ArrowUp, Mail } from "lucide-react";
import resumeData from "@/data/resumeData.json";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-[#050508] py-8 z-20 overflow-hidden font-sans border-t border-white/5 no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          {/* Left: Brand Name */}
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {resumeData.personal.name}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-1">
              All Rights Reserved &copy; {new Date().getFullYear()}
            </p>
          </div>

          {/* Right: Social icons & Scroll to top */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3.5">
              <a 
                href={resumeData.personal.linkedin} 
                target="_blank" 
                rel="noreferrer" 
                className="text-slate-400 hover:text-white transition-colors"
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
                className="text-slate-400 hover:text-white transition-colors"
                title="GitHub"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
              <a 
                href={`mailto:${resumeData.personal.email}`}
                className="text-slate-400 hover:text-white transition-colors"
                title="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>

            <button 
              onClick={scrollToTop}
              className="group flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-slate-400 hover:text-white cursor-pointer"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
