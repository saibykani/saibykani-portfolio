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

const TypewriterText = () => {
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentRole = ROLES[roleIndex];
    const typingSpeed = 70;
    const deletingSpeed = 40;
    const pauseBeforeDelete = 2500;
    const pauseBeforeType = 500;

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

  return (
    <span className="text-[#60A5FA] font-semibold text-[18px] sm:text-[22px] md:text-[26px] lg:text-[32px] flex items-center">
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        className="inline-block w-0.5 h-6 sm:h-8 bg-[#60A5FA] ml-1"
      />
    </span>
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

        {/* Main Heading */}
        <div className="mb-6">
          {headingLines.map((line, idx) => (
            <div key={idx} className="overflow-hidden">
              <motion.h1 
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 + idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-[48px] sm:text-[70px] md:text-[90px] lg:text-[120px] font-[900] tracking-tighter leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400"
              >
                {line}
              </motion.h1>
            </div>
          ))}
        </div>

        {/* Typewriter Role */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-8 min-h-[40px] flex items-center justify-center"
        >
          <TypewriterText />
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
          className="text-base sm:text-lg md:text-xl text-slate-400 max-w-[700px] mx-auto leading-relaxed font-medium mb-12"
        >
          Building enterprise-grade automation frameworks, validating mission-critical payment systems, and delivering reliable software through UI automation, API testing, backend validation, and performance engineering.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-20"
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
            download
            className="group px-8 py-4 text-sm font-bold rounded-full border border-white/10 bg-white/[0.03] text-white hover:bg-white/10 transition-all flex items-center backdrop-blur-md shadow-lg"
          >
            Download Resume
            <Download className="ml-2 w-4 h-4 group-hover:-translate-y-1 transition-transform" />
          </a>
        </motion.div>

        {/* Floating Technology Chips */}
        <div className="relative w-full max-w-4xl mx-auto flex flex-wrap justify-center gap-3">
          {TECHNOLOGIES.map((tech, idx) => (
            <motion.div
              key={tech}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 1 + idx * 0.05,
                ease: "easeOut"
              }}
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: Math.random() * 2
                }}
                className="px-4 py-2 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-md text-slate-300 text-xs font-medium shadow-sm hover:border-white/20 transition-colors"
              >
                {tech}
              </motion.div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
