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
const TypewriterText = () => {
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentRole = ROLES[roleIndex];
    const typingSpeed = 60;
    const deletingSpeed = 30;
    const pauseBeforeDelete = 3500;
    const pauseBeforeType = 300;

    let timeout: NodeJS.Timeout;

    if (isDeleting) {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(currentRole.substring(0, displayText.length - 1));
        }, deletingSpeed);
      } else {
        setIsDeleting(false);
        setRoleIndex((prev) => (prev + 1) % ROLES.length);
        timeout = setTimeout(() => {}, pauseBeforeType);
      }
    } else {
      if (displayText.length < currentRole.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentRole.substring(0, displayText.length + 1));
        }, typingSpeed);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, pauseBeforeDelete);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, roleIndex]);

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
    <span className="bg-gradient-accent bg-clip-text text-transparent font-black tracking-tight text-[32px] sm:text-[48px] md:text-[60px] lg:text-[70px] leading-tight flex items-center justify-center flex-wrap max-w-[90vw] transition-all duration-300">
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        className="inline-block w-1 md:w-2 h-[40px] sm:h-[60px] md:h-[70px] lg:h-[80px] bg-accent-theme ml-2"
      />
    </span>
  );
};

export default function Hero() {
  const headingLines = ["Engineering Quality", "At Enterprise Scale."];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden z-10">
      
      <div className="max-w-5xl mx-auto w-full relative z-10 flex flex-col items-center text-center -mt-10">
        
        {/* Availability Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md mb-6"
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
          className="text-lg sm:text-xl font-bold text-slate-400 mb-2 mt-4"
        >
          👋 Hi, I&apos;m Sai Krishna Bykani
        </motion.div>

        {/* Typewriter Role as Main Focus */}
        <div className="mb-12 mt-4 min-h-[120px] flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <TypewriterText />
          </motion.div>
        </div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-2xl mx-auto mt-2 mb-12"
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
