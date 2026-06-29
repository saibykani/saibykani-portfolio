"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Download, Eye, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import resumeData from "@/data/resumeData.json";

const ROLES = [
  "Software Development Engineer in Test",
  "QA Automation Engineer",
  "API Automation Engineer",
  "Performance Test Engineer",
  "Quality Engineering Specialist",
  "Automation Framework Architect",
  "Backend Test Engineer",
  "UI Automation Expert",
  "Mobile Automation Engineer",
  "Security Test Engineer",
  "CI/CD Automation Engineer",
  "Load Testing Specialist",
  "Site Reliability Engineer (QA)",
  "Cloud Automation Engineer",
  "Microservices Test Engineer",
  "Data Quality Engineer",
  "E2E Testing Architect",
  "Agile Test Lead",
  "System Integration Tester",
  "Release QA Engineer",
  "Test Automation Strategist",
  "Platform QA Engineer",
  "Database Test Engineer",
  "API Integration Specialist",
  "Test Environment Engineer",
  "QA Operations Engineer",
  "Automation Tooling Engineer",
  "Payment Systems QA Engineer",
  "FinTech QA Engineer",
  "Transaction Validation Expert",
  "Scalability Test Engineer",
  "Chaos Engineering Tester",
  "DevSecOps QA Engineer",
  "AI/ML QA Engineer",
  "Web3 QA Engineer",
  "Performance Engineering Lead"
];

// Provide 40 distinct animations
const ANIMATIONS: any[] = [
  { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -30 } },
  { initial: { opacity: 0, y: -30 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 30 } },
  { initial: { opacity: 0, x: 50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -50 } },
  { initial: { opacity: 0, x: -50 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 50 } },
  { initial: { opacity: 0, filter: "blur(20px)" }, animate: { opacity: 1, filter: "blur(0px)" }, exit: { opacity: 0, filter: "blur(20px)" } },
  { initial: { opacity: 0, scale: 0.5 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.5 } },
  { initial: { opacity: 0, scale: 1.5 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.5 } },
  { initial: { opacity: 0, rotateX: 90 }, animate: { opacity: 1, rotateX: 0 }, exit: { opacity: 0, rotateX: -90 } },
  { initial: { opacity: 0, rotateY: 90 }, animate: { opacity: 1, rotateY: 0 }, exit: { opacity: 0, rotateY: -90 } },
  { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1, transition: { type: "spring", bounce: 0.7 } }, exit: { opacity: 0, scale: 0.8 } },
  { initial: { opacity: 0, skewX: 20, x: 20 }, animate: { opacity: 1, skewX: 0, x: 0 }, exit: { opacity: 0, skewX: -20, x: -20 } },
  { initial: { opacity: 0, y: -100, scale: 1.2 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 100, scale: 0.8 } },
  { initial: { opacity: 0, rotateZ: 30, transformOrigin: "top" }, animate: { opacity: 1, rotateZ: 0 }, exit: { opacity: 0, rotateZ: -30 } },
  { initial: { opacity: 0, rotateX: 90, transformOrigin: "bottom" }, animate: { opacity: 1, rotateX: 0 }, exit: { opacity: 0, rotateX: -90 } },
  { initial: { opacity: 0 }, animate: { opacity: [0, 1.2, 1], scale: [0.8, 1.1, 1] }, exit: { opacity: 0, scale: 0.9 } },
  { initial: { opacity: 0, x: -10, skewX: 10 }, animate: { opacity: 1, x: [10, -5, 5, 0], skewX: [20, -10, 0] }, exit: { opacity: 0, filter: "blur(10px)" } },
  { initial: { opacity: 0, x: -100 }, animate: { opacity: 1, x: 0, transition: { type: "spring", bounce: 0.6 } }, exit: { opacity: 0, x: 100 } },
  { initial: { opacity: 0, scale: 0.1 }, animate: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 10 } }, exit: { opacity: 0, scale: 1.2 } },
  { initial: { opacity: 0, scaleX: 0, scaleY: 2 }, animate: { opacity: 1, scaleX: 1, scaleY: 1 }, exit: { opacity: 0, scaleX: 2, scaleY: 0 } },
  { initial: { opacity: 0, filter: "brightness(0) blur(10px)" }, animate: { opacity: 1, filter: "brightness(1) blur(0px)" }, exit: { opacity: 0, filter: "brightness(2) blur(10px)" } },
  { initial: { opacity: 0, rotate: 10, y: 50 }, animate: { opacity: 1, rotate: 0, y: 0 }, exit: { opacity: 0, rotate: -10, y: -50 } },
  { initial: { opacity: 0, rotate: -45, x: -100 }, animate: { opacity: 1, rotate: 0, x: 0 }, exit: { opacity: 0, rotate: 45, x: 100 } },
  { initial: { opacity: 0, rotateX: 90, scaleY: 0 }, animate: { opacity: 1, rotateX: 0, scaleY: 1 }, exit: { opacity: 0, rotateX: -90, scaleY: 0 } },
  { initial: { opacity: 0, letterSpacing: "1em" }, animate: { opacity: 1, letterSpacing: "normal" }, exit: { opacity: 0, letterSpacing: "-0.5em" } },
  { initial: { opacity: 0, y: 100, scale: 0.5 }, animate: { opacity: 1, y: [-20, 0], scale: 1 }, exit: { opacity: 0, y: -100 } },
  { initial: { opacity: 0, x: 10, filter: "blur(5px)" }, animate: { opacity: 1, x: 0, filter: "blur(0px)", transition: { ease: "linear" } }, exit: { opacity: 0, x: -10 } },
  { initial: { opacity: 0, scale: 1.1, filter: "blur(15px)" }, animate: { opacity: 1, scale: 1, filter: "blur(0px)" }, exit: { opacity: 0, scale: 0.9, filter: "blur(15px)" } },
  { initial: { opacity: 0 }, animate: { opacity: 1, x: [2, -2, 0], y: [-1, 1, 0] }, exit: { opacity: 0 } },
  { initial: { opacity: 0, scaleY: 0.01, scaleX: 3 }, animate: { opacity: 1, scaleY: 1, scaleX: 1 }, exit: { opacity: 0, scaleY: 0, scaleX: 0 } },
  { initial: { opacity: 0, rotateZ: 180, scale: 0 }, animate: { opacity: 1, rotateZ: 0, scale: 1 }, exit: { opacity: 0, rotateZ: -180, scale: 0 } },
  { initial: { opacity: 0, y: -50, rotateX: -90 }, animate: { opacity: 1, y: 0, rotateX: 0 }, exit: { opacity: 0, y: 50, rotateX: 90 } },
  { initial: { opacity: 0, x: -50, rotateY: -90 }, animate: { opacity: 1, x: 0, rotateY: 0 }, exit: { opacity: 0, x: 50, rotateY: 90 } },
  { initial: { opacity: 0, clipPath: "circle(0% at 50% 50%)" }, animate: { opacity: 1, clipPath: "circle(100% at 50% 50%)" }, exit: { opacity: 0, clipPath: "circle(0% at 50% 50%)" } },
  { initial: { opacity: 0, clipPath: "inset(100% 0 0 0)" }, animate: { opacity: 1, clipPath: "inset(0% 0 0 0)" }, exit: { opacity: 0, clipPath: "inset(0 0 100% 0)" } },
  { initial: { opacity: 0, clipPath: "polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)" }, animate: { opacity: 1, clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }, exit: { opacity: 0, clipPath: "polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)" } },
  { initial: { opacity: 0, scaleX: -1 }, animate: { opacity: 1, scaleX: 1 }, exit: { opacity: 0, scaleX: -1 } },
  { initial: { opacity: 0, scaleY: -1 }, animate: { opacity: 1, scaleY: 1 }, exit: { opacity: 0, scaleY: -1 } },
  { initial: { opacity: 0, y: 10, filter: "contrast(200%) brightness(150%) blur(5px)" }, animate: { opacity: 1, y: 0, filter: "contrast(100%) brightness(100%) blur(0px)" }, exit: { opacity: 0, y: -10, filter: "contrast(200%) brightness(150%) blur(5px)" } },
  { initial: { opacity: 0, rotate: 3, scale: 1.05 }, animate: { opacity: 1, rotate: 0, scale: 1, transition: { type: "spring", stiffness: 50 } }, exit: { opacity: 0, rotate: -3, scale: 0.95 } },
  { initial: { opacity: 0, skewY: 10, y: 20 }, animate: { opacity: 1, skewY: 0, y: 0 }, exit: { opacity: 0, skewY: -10, y: -20 } },
];

const AnimatedRole = () => {
  const [roleIndex, setRoleIndex] = useState(0);
  const [animIndex, setAnimIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % ROLES.length);
      
      // Ensure the next animation is randomly selected but different from the current one
      setAnimIndex((prevAnim) => {
        let nextAnim;
        do {
          nextAnim = Math.floor(Math.random() * ANIMATIONS.length);
        } while (nextAnim === prevAnim);
        return nextAnim;
      });
      
    }, 3500); // changes every 3.5 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const roleThemes = ["blue", "orange", "purple", "emerald", "cyan", "rose"];
    const theme = roleThemes[roleIndex % roleThemes.length];
    
    document.documentElement.classList.remove(
      "theme-blue", "theme-orange", "theme-purple",
      "theme-emerald", "theme-cyan", "theme-rose"
    );
    
    if (theme !== "blue") {
      document.documentElement.classList.add(`theme-${theme}`);
    }
  }, [roleIndex]);

  return (
    <div className="h-[100px] sm:h-[130px] md:h-[150px] flex items-center justify-center overflow-hidden w-full relative">
      <AnimatePresence mode="wait">
        <motion.span
          key={roleIndex}
          initial={ANIMATIONS[animIndex].initial}
          animate={ANIMATIONS[animIndex].animate}
          exit={ANIMATIONS[animIndex].exit}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="bg-gradient-accent bg-clip-text text-transparent font-black tracking-tight text-[32px] sm:text-[48px] md:text-[60px] lg:text-[70px] leading-tight text-center max-w-[90vw] absolute"
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold tracking-widest text-slate-300 uppercase">
            Available for Opportunities
          </span>
        </motion.div>

        {/* Name / Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-lg sm:text-xl font-bold text-slate-400 mb-2"
        >
          👋 Hi, I&apos;m Sai Krishna Bykani
        </motion.div>

        {/* Role Animator */}
        <div className="mb-8 w-full flex justify-center">
          <AnimatedRole />
        </div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-2xl mx-auto mt-6 mb-12"
        >
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Building enterprise-grade automation frameworks, validating mission-critical payment systems, and delivering reliable software through UI automation, API testing, backend validation, and performance engineering.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
        >
          <Link
            href="#projects"
            className="group relative px-8 py-4 bg-white text-black text-sm font-bold rounded-full overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center"
          >
            Explore My Work
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <a
            href="/Sai_Krishna_Bykani_Resume.pdf"
            download="Sai_Krishna_Bykani_Resume.pdf"
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
