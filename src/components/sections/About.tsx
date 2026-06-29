"use client";

import { motion } from "framer-motion";
import resumeData from "@/data/resumeData.json";
import Image from "next/image";
import { Terminal, Database, Code2 } from "lucide-react";

export default function About() {
  return (
    <section id="about" className="py-24 relative border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center lg:items-start">
          
          {/* Left Column: Portrait & Title */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center lg:items-start lg:w-1/3"
          >
            <div className="relative w-56 h-[280px] sm:w-64 sm:h-[320px] mb-6 group">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-accent-theme/20 to-accent-gradient-from/20 blur-xl group-hover:blur-2xl transition-all duration-500" />
              <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0a]">
                {/* Fallback to generic image styling if portrait fails to load */}
                <Image 
                  src="/portrait.png" 
                  alt="Sai Krishna Bykani"
                  fill
                  className="object-cover transition-all duration-500"
                  sizes="(max-width: 768px) 224px, 256px"
                />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight mb-2 text-center lg:text-left">
              {resumeData.personal.name}
            </h3>
          </motion.div>

          {/* Right Column: Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:w-2/3 space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-sm font-bold tracking-widest uppercase text-slate-500">
                Professional Summary
              </h2>
              <p className="text-lg text-slate-300 leading-relaxed font-medium">
                {resumeData.personal.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-white/10">
              
              <div className="space-y-3">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h4 className="text-xs font-bold text-white tracking-wider uppercase">Architecture</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Building scalable Page Object Model frameworks for both UI and headless API tests.
                </p>
              </div>

              <div className="space-y-3">
                <Database className="w-5 h-5 text-blue-400" />
                <h4 className="text-xs font-bold text-white tracking-wider uppercase">Validation</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Deep assertions checking database ledger synchronicity and payload contracts.
                </p>
              </div>

              <div className="space-y-3">
                <Code2 className="w-5 h-5 text-purple-400" />
                <h4 className="text-xs font-bold text-white tracking-wider uppercase">Performance</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Load injection simulating peak production volumes to trace system bottlenecks.
                </p>
              </div>

            </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
