"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Download, Mail } from "lucide-react";
import resumeData from "@/data/resumeData.json";

const ROTATING_TITLES = [
  "Software Development Engineer in Test (SDET)",
  "QA Automation Engineer",
  "Automation Test Engineer",
  "API Automation Engineer",
  "Performance Test Engineer",
  "Automation Framework Engineer",
  "Quality Assurance Engineer",
  "Quality Engineering Specialist",
  "UI & API Test Automation Engineer",
  "Performance & Reliability Engineer",
];

export default function Hero() {
  const [displayText, setDisplayText] = useState("");
  const [titleIndex, setTitleIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

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
      // Typing
      if (displayText.length < currentTitle.length) {
        return setTimeout(() => {
          setDisplayText(currentTitle.substring(0, displayText.length + 1));
        }, 60 + Math.random() * 40);
      } else {
        // Pause then start deleting
        return setTimeout(() => setIsDeleting(true), 2500);
      }
    } else {
      // Deleting
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

  const stats = [
    { value: "3+", label: "Years Experience" },
    { value: "2000+", label: "Automated Test Cases" },
    { value: "1250+", label: "APIs Validated" },
    { value: "50+", label: "Automation Suites" },
  ];

  const techBadges = [
    "Java", "Selenium", "REST Assured", "Postman", "JMeter",
    "Docker", "Cucumber", "Jenkins", "GitHub", "Azure DevOps",
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-black">
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none" />

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full relative z-10">
        {/* Status pill */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/[0.06] border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Available for Opportunities</span>
        </div>

        {/* Name */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white leading-[1.05] mb-6">
          Sai Krishna
          <br />
          <span className="text-white/90">Bykani</span>
        </h1>

        {/* Typewriter Title */}
        <div className="h-10 sm:h-12 mb-6 flex items-center">
          <span className="text-lg sm:text-xl md:text-2xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
            {displayText}
          </span>
          <span
            className={`inline-block w-[2px] h-6 sm:h-7 bg-cyan-400 ml-1 transition-opacity duration-100 ${
              cursorVisible ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* Tagline */}
        <p className="text-sm sm:text-base text-gray-400 max-w-2xl leading-relaxed mb-10">
          Building enterprise-grade automation frameworks, validating mission-critical APIs, and engineering reliable software for modern payment systems.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center gap-4 mb-12">
          <Link
            href="#projects"
            className="px-7 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-[11px] tracking-wider uppercase transition-all hover:scale-[1.02] flex items-center space-x-2 shadow-lg shadow-cyan-500/20"
          >
            <span>Explore My Work</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/resume"
            className="px-7 py-3.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-300 font-bold text-[11px] tracking-wider uppercase transition-all hover:scale-[1.02] flex items-center space-x-2"
          >
            <span>Download Resume</span>
            <Download className="w-4 h-4" />
          </Link>

          {/* Social icons */}
          <div className="flex items-center space-x-3 pl-1">
            <a
              href={resumeData.personal.github}
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-gray-500 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>
            <a
              href={resumeData.personal.linkedin}
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-gray-500 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a
              href={`mailto:${resumeData.personal.email}`}
              className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-gray-500 hover:text-white transition-all"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-8 border-t border-white/[0.06] mb-10">
          {stats.map((st) => (
            <div key={st.label} className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-white block">{st.value}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-[0.15em] font-semibold block">
                {st.label}
              </span>
            </div>
          ))}
        </div>

        {/* Tech Badges */}
        <div className="space-y-3">
          <span className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] block">
            Core Technologies
          </span>
          <div className="flex flex-wrap gap-2">
            {techBadges.map((badge) => (
              <span
                key={badge}
                className="px-3.5 py-1.5 rounded-full text-[10px] font-semibold bg-white/[0.03] border border-white/[0.06] text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-all cursor-default"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
