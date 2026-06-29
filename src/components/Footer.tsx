"use client";

import Link from "next/link";
import Image from "next/image";
import resumeData from "@/data/resumeData.json";
import { ArrowUp, Mail, Download } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-[#050508]/90 backdrop-blur-2xl pt-20 pb-10 z-20 overflow-hidden font-sans border-t border-white/5">
      {/* Subtle top gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Grid Area */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-12 lg:gap-8 mb-16">
          
          {/* Left: Brand */}
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">{resumeData.personal.name}</h3>
          </div>

          {/* Right: Professional Links */}
          <div>
            <ul className="flex items-center space-x-6">
              <li>
                <a href={resumeData.personal.linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-blue-400 transition-all group">
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </li>
              <li>
                <a href={resumeData.personal.github} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white transition-all group">
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                </a>
              </li>
              <li>
                <a href={`mailto:${resumeData.personal.email}`} className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-blue-400 transition-all group">
                  <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </a>
              </li>
              <li>
                <button 
                  onClick={() => alert("Please manually copy your actual resume PDF into the 'public' folder and name it 'Sai_Krishna_Bykani_Resume.pdf'. The current file is empty!")}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white hover:bg-white/20 hover:scale-105 transition-all shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Resume</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Area */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-slate-500 font-semibold tracking-wider">
            &copy; {new Date().getFullYear()} {resumeData.personal.name}. All Rights Reserved.
          </p>
          
          <button 
            onClick={scrollToTop}
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-slate-400 hover:text-white"
            aria-label="Back to top"
          >
            <ArrowUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>

      </div>
    </footer>
  );
}
