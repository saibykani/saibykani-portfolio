"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import resumeData from "@/data/resumeData.json";
import { ArrowRight, Download } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-5xl mx-auto w-full relative z-10 flex flex-col items-center text-center">
        
        {/* Availability Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-slate-300 text-[10px] font-semibold tracking-widest uppercase mb-10 shadow-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span>Available for SDET Opportunities</span>
        </motion.div>

        {/* Name / Greeting */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-lg sm:text-xl text-slate-400 font-medium mb-3 flex items-center justify-center space-x-3 tracking-wide"
        >
          <span>{resumeData.personal.name}</span>
        </motion.div>

        {/* Animated Role - Premium Typography */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-white leading-tight max-w-4xl mx-auto">
            Engineering Quality <br className="hidden sm:block" />
            <span className="text-slate-400">At Enterprise Scale.</span>
          </h1>
        </motion.div>

        {/* Subtitle / Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Building robust automation frameworks for mission-critical payment systems, bridging the gap between velocity and absolute reliability.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mt-12"
        >
          <Link
            href="#projects"
            className="group relative px-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95"
          >
            <span className="relative z-10 flex items-center">
              View Case Studies
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          
          <a
            href="/Sai_Krishna_Bykani_Resume.pdf"
            download
            className="group px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-full border border-white/20 text-white hover:bg-white/5 transition-all flex items-center hover:border-white/40"
          >
            Download Resume
            <Download className="ml-2 w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </motion.div>

      </div>
    </section>
  );
}
