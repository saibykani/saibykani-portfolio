"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Download, Eye, Mail } from "lucide-react";
import { useState, useEffect } from "react";

const ROLES = [
  "Software Development Engineer in Test (SDET)",
  "QA Automation Engineer",
  "API Automation Engineer",
  "Performance Test Engineer",
  "Automation Framework Engineer",
  "Quality Engineering Specialist"
];

const TECHNOLOGIES = [
  "Java", "Selenium", "REST Assured", "Apache JMeter", "Postman",
  "MySQL", "MongoDB", "Jenkins", "Docker", "GitHub", "Azure DevOps"
];

const RoleAnimator = () => {
  const [roleIndex, setRoleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % ROLES.length);
    }, 4000); // changes every 4 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const roleThemes = ["blue", "orange", "purple", "emerald", "cyan", "rose"];
    const theme = roleThemes[roleIndex % roleThemes.length];
    
    document.documentElement.classList.remove(
      "theme-blue",
      "theme-orange",
      "theme-purple",
      "theme-emerald",
      "theme-cyan",
      "theme-rose"
    );
    
    if (theme !== "blue") {
      document.documentElement.classList.add(`theme-${theme}`);
    }
  }, [roleIndex]);

  return (
    <div className="h-[100px] sm:h-[130px] md:h-[150px] flex items-center justify-center overflow-hidden w-full">
      <AnimatePresence mode="wait">
        <motion.span
          key={roleIndex}
          initial={{ opacity: 0, y: 40, filter: "blur(10px)", scale: 0.9 }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
          exit={{ opacity: 0, y: -40, filter: "blur(10px)", scale: 1.1 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 120, damping: 20 }}
          className="bg-gradient-accent bg-clip-text text-transparent font-black tracking-tight text-[32px] sm:text-[48px] md:text-[60px] lg:text-[70px] leading-tight text-center max-w-[90vw]"
        >
          {ROLES[roleIndex]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

export default function Hero() {
  const headingLines = ["Engineering Quality", "At Enterprise Scale."];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden z-10">
      
      <div className="max-w-5xl mx-auto w-full relative z-10 flex flex-col items-center text-center">
        
        {/* Availability Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md text-slate-300 text-xs font-semibold tracking-wider mb-10 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span>Available for SDET Opportunities</span>
        </motion.div>

        {/* Introduction */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-[28px] sm:text-[36px] md:text-[40px] text-slate-300 font-medium mb-2 tracking-tight"
        >
          👋 Hi, I&apos;m Sai Krishna Bykani
        </motion.div>

        {/* Role Animator */}
        <div className="mb-8 w-full flex justify-center">
          <RoleAnimator />
        </div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="text-base sm:text-lg md:text-xl text-slate-400 max-w-[700px] mx-auto leading-relaxed font-medium mb-12"
        >
          Building enterprise-grade automation frameworks, validating mission-critical payment systems, and delivering reliable software through UI automation, API testing, backend validation, and performance engineering.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4"
        >
          <Link
            href="#projects"
            className="group relative px-8 py-4 bg-white text-black text-sm font-bold rounded-full overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center"
          >
            Explore My Work
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <a
            href="/Sai_Krishna_Bykani_Resume.txt"
            download="Sai_Krishna_Bykani_Resume.txt"
            className="group px-8 py-4 text-sm font-bold rounded-full border border-white/10 bg-white/[0.03] text-white hover:bg-white/10 transition-all flex items-center backdrop-blur-md shadow-lg cursor-pointer"
          >
            Download Resume
            <Download className="ml-2 w-4 h-4 group-hover:-translate-y-1 transition-transform" />
          </a>
        </motion.div>

      </div>
    </section>
  );
}
