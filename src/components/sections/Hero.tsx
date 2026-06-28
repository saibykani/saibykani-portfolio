"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Download, Mail } from "lucide-react";
import resumeData from "@/data/resumeData.json";

const ROTATING_TITLES = [
  "Software Development Engineer in Test (SDET)",
  "QA Automation Engineer",
  "UI Automation Engineer",
  "API Automation Engineer",
  "Performance Test Engineer",
  "Selenium Automation Engineer",
  "Java Automation Engineer",
  "Payment Systems Test Engineer",
];

export default function Hero() {
  const [displayText, setDisplayText] = useState("");
  const [titleIndex, setTitleIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Blinking cursor
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  // Typewriter effect
  const typewrite = useCallback(() => {
    const currentTitle = ROTATING_TITLES[titleIndex];

    if (!isDeleting) {
      if (displayText.length < currentTitle.length) {
        return setTimeout(() => {
          setDisplayText(currentTitle.substring(0, displayText.length + 1));
        }, 60 + Math.random() * 40);
      } else {
        return setTimeout(() => setIsDeleting(true), 2500);
      }
    } else {
      if (displayText.length > 0) {
        return setTimeout(() => {
          setDisplayText(displayText.substring(0, displayText.length - 1));
        }, 30);
      } else {
        setIsDeleting(false);
        setTitleIndex((prev) => (prev + 1) % ROTATING_TITLES.length);
        return undefined;
      }
    }
  }, [displayText, isDeleting, titleIndex]);

  useEffect(() => {
    const timeout = typewrite();
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [typewrite]);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#09090b]">
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      {/* Premium ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/[0.04] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/[0.04] rounded-full blur-[140px] pointer-events-none" />

      <div className={`max-w-4xl mx-auto w-full relative z-10 flex flex-col items-center text-center transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Availability Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-500/[0.08] border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold tracking-widest uppercase mb-10 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span>Available for SDET Opportunities</span>
        </div>

        {/* Greeting */}
        <div className="text-xl sm:text-2xl text-gray-400 font-medium mb-4 flex items-center justify-center space-x-3">
          <span className="animate-[wave_2s_ease-in-out_infinite_origin-bottom-right] inline-block">👋</span>
          <span>Hi, I&apos;m</span>
        </div>

        {/* Animated Role - Main Focus */}
        <div className="h-[100px] sm:h-[120px] md:h-[140px] flex items-center justify-center w-full px-4 mb-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 leading-tight py-2">
            {displayText}
            <span
              className={`inline-block w-[3px] h-[36px] sm:h-[48px] md:h-[60px] bg-indigo-400 ml-2 sm:ml-3 align-middle transition-opacity duration-100 ${
                cursorVisible ? "opacity-100" : "opacity-0"
              }`}
            />
          </h1>
        </div>

        {/* Description */}
        <p className="text-base sm:text-lg text-gray-400 max-w-2xl leading-relaxed mb-12 font-light">
          I build scalable automation frameworks, automate APIs, validate payment systems, and ensure enterprise applications are reliable, performant, and production-ready.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-5 mb-14">
          <Link
            href="#projects"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center space-x-2"
          >
            <span>View Projects</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/resume"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 font-bold text-xs tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] flex items-center justify-center space-x-2"
          >
            <span>Download Resume</span>
            <Download className="w-4 h-4" />
          </Link>
        </div>

        {/* Social Icons */}
        <div className="flex items-center justify-center space-x-6">
          <a
            href={resumeData.personal.github}
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 hover:text-white transition-colors duration-300 hover:scale-110"
            aria-label="GitHub"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </a>
          <a
            href={resumeData.personal.linkedin}
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 hover:text-white transition-colors duration-300 hover:scale-110"
            aria-label="LinkedIn"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>
          <a
            href={`mailto:${resumeData.personal.email}`}
            className="text-gray-500 hover:text-white transition-colors duration-300 hover:scale-110"
            aria-label="Email"
          >
            <Mail className="w-6 h-6" />
          </a>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes wave {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
          60% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </section>
  );
}
