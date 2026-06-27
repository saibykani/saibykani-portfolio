"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Mail, Download } from "lucide-react";
import resumeData from "@/data/resumeData.json";

interface TechNode {
  name: string;
  short: string;
  color: string;
  glow: string;
}

export default function Hero() {
  const [angle, setAngle] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const dynamicPhrases = [
    { verb: "Automate", target: "UI Checkout Regressions.", color: "from-yellow-400 to-orange-500" },
    { verb: "Verify", target: "API Signatures & Webhooks.", color: "from-emerald-400 to-teal-500" },
    { verb: "Inject", target: "High-Volume Load Spikes.", color: "from-red-400 to-pink-500" },
    { verb: "Reconcile", target: "MySQL & MongoDB Ledgers.", color: "from-blue-400 to-indigo-500" },
    { verb: "Deploy", target: "Jenkins CI/CD Release Gates.", color: "from-purple-400 to-fuchsia-500" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentPhrase((prev) => (prev + 1) % dynamicPhrases.length);
        setIsFading(false);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  
  // Orbiting technology nodes configuration
  const techNodes: TechNode[] = [
    { name: "Java", short: "Java", color: "from-orange-500 to-amber-500", glow: "rgba(249,115,22,0.3)" },
    { name: "Selenium", short: "Se", color: "from-emerald-500 to-green-600", glow: "rgba(16,185,129,0.3)" },
    { name: "REST Assured", short: "RA", color: "from-blue-500 to-indigo-600", glow: "rgba(59,130,246,0.3)" },
    { name: "Postman", short: "Pm", color: "from-orange-600 to-red-500", glow: "rgba(234,88,12,0.3)" },
    { name: "JMeter", short: "JM", color: "from-red-600 to-pink-600", glow: "rgba(220,38,38,0.3)" },
    { name: "Docker", short: "Dk", color: "from-sky-500 to-blue-600", glow: "rgba(14,165,233,0.3)" },
    { name: "GitHub", short: "Git", color: "from-slate-400 to-slate-600", glow: "rgba(148,163,184,0.3)" },
    { name: "Azure", short: "Az", color: "from-blue-600 to-sky-500", glow: "rgba(37,99,235,0.3)" },
    { name: "Jenkins", short: "Jk", color: "from-red-500 to-amber-600", glow: "rgba(239,68,68,0.3)" },
    { name: "Cucumber", short: "Cu", color: "from-green-500 to-emerald-600", glow: "rgba(34,197,94,0.3)" }
  ];

  // Orbit rotation loop
  useEffect(() => {
    let animationFrameId: number;
    const updateOrbit = () => {
      setAngle((prev) => (prev + 0.15) % 360);
      animationFrameId = requestAnimationFrame(updateOrbit);
    };
    animationFrameId = requestAnimationFrame(updateOrbit);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Mouse follow event listener
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / 30;
      const y = (e.clientY - rect.top - rect.height / 2) / 30;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const stats = [
    { value: "3+", label: "Years Experience" },
    { value: "1000+", label: "Test Cases Automated" },
    { value: "750+", label: "APIs Validated" },
    { value: "50+", label: "Automation Suites" }
  ];

  const bottomChips = [
    "Java", "Selenium", "REST Assured", "Postman", "JMeter", 
    "Docker", "GitHub", "Azure", "Cucumber", "Jenkins"
  ];

  // Helper to compute node relative position on a 2D orbit
  const getNodeCoords = (index: number, total: number, currentAngle: number) => {
    const baseAngle = (index * 360) / total;
    const rad = ((baseAngle + currentAngle) * Math.PI) / 180;
    // Oval shape orbit path
    const rx = 190;
    const ry = 195;
    return {
      x: rx * Math.cos(rad),
      y: ry * Math.sin(rad)
    };
  };

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center pt-28 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-black"
    >
      {/* Background Circuit-Traces & motherboards layout */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none select-none overflow-hidden">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Circuit Lines */}
          <path d="M -100 100 L 250 100 L 350 200 L 600 200" fill="none" stroke="white" strokeWidth="1" />
          <path d="M 150 700 L 400 700 L 480 620 L 900 620" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4,4" />
          <path d="M 800 150 L 950 150 L 1050 250 L 1300 250" fill="none" stroke="white" strokeWidth="1" />
          
          {/* Animated signal dots */}
          <circle r="3" fill="#f97316">
            <animateMotion dur="7s" repeatCount="indefinite" path="M -100 100 L 250 100 L 350 200 L 600 200" />
          </circle>
          <circle r="3" fill="#ef4444">
            <animateMotion dur="9s" repeatCount="indefinite" path="M 800 150 L 950 150 L 1050 250 L 1300 250" />
          </circle>
        </svg>
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none" />

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 pt-8">
        
        {/* Left Side: Copy parameters, stats, CTAs */}
        <div className="lg:col-span-7 space-y-8 select-none text-left">
          
          {/* Green Indicator Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SDET • QA AUTOMATION ENGINEER</span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] text-white min-h-[125px] sm:min-h-[185px]">
              <span className={`block transition-all duration-300 ${isFading ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
                I <span className={`bg-gradient-to-r ${dynamicPhrases[currentPhrase].color} bg-clip-text text-transparent`}>
                  {dynamicPhrases[currentPhrase].verb}
                </span>
                <br />
                <span className="text-slate-300">
                  {dynamicPhrases[currentPhrase].target}
                </span>
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl font-normal leading-relaxed pt-2">
              I build intelligent automation frameworks and testing solutions that ensure reliability, performance, and seamless user experiences at scale.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-2 border-t border-white/5 border-b pb-6">
            {stats.map((st) => (
              <div key={st.label} className="space-y-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white block">
                  {st.value}
                </span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block leading-snug">
                  {st.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTAs and social drawer */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="#projects"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-650 hover:from-orange-600 hover:to-red-700 text-white font-bold text-[10px] tracking-wider uppercase transition-all hover:scale-[1.02] flex items-center space-x-1.5 shadow-lg shadow-orange-500/10"
            >
              <span>Explore My Work</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            
            <Link
              href="/resume"
              className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-350 font-bold text-[10px] tracking-wider uppercase transition-all hover:scale-[1.02] flex items-center space-x-1.5"
            >
              <span>Download Resume</span>
              <Download className="w-3.5 h-3.5" />
            </Link>

            {/* Social circle triggers */}
            <div className="flex items-center space-x-3.5 pl-2">
              <a
                href={resumeData.personal.github}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
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
                className="w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a
                href={`mailto:${resumeData.personal.email}`}
                className="w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Elegant Technology chips */}
          <div className="space-y-2.5 pt-4">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Main Tech Capabilities</span>
            <div className="flex flex-wrap gap-1.5">
              {bottomChips.map((chip) => (
                <span
                  key={chip}
                  className="px-3 py-1 rounded-full text-[9px] font-semibold bg-white/5 border border-white/10 text-slate-400"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Portrait Image with Orbiting Badges */}
        <div className="lg:col-span-5 flex items-center justify-center relative min-h-[460px] sm:min-h-[500px]">
          
          {/* Volumetric background lights and glows */}
          <div className="absolute w-[360px] h-[360px] rounded-full bg-blue-500/5 filter blur-3xl z-0 pointer-events-none" />
          <div className="absolute w-[240px] h-[240px] rounded-full bg-orange-500/5 filter blur-2xl z-0 pointer-events-none translate-x-12 translate-y-12" />

          {/* SVG Connector Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
            {techNodes.map((node, idx) => {
              const coords = getNodeCoords(idx, techNodes.length, angle);
              return (
                <g key={`line-${node.name}`}>
                  {/* Glowing connector path */}
                  <line
                    x1="50%"
                    y1="50%"
                    x2={`calc(50% + ${coords.x}px)`}
                    y2={`calc(50% + ${coords.y}px)`}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1.5"
                    strokeDasharray="4,6"
                  />
                  {/* Dynamic pulse overlay */}
                  <line
                    x1="50%"
                    y1="50%"
                    x2={`calc(50% + ${coords.x}px)`}
                    y2={`calc(50% + ${coords.y}px)`}
                    stroke={node.glow.replace(",0.3)", ",0.85)")}
                    strokeWidth="1.5"
                    strokeDasharray="5,15"
                    className="animate-[dashPulse_4s_infinite_linear]"
                  />
                </g>
              );
            })}
          </svg>

          <style jsx global>{`
            @keyframes dashPulse {
              to {
                stroke-dashoffset: -30;
              }
            }
          `}</style>

          {/* Interactive Portrait Container */}
          <div 
            className="w-64 h-80 sm:w-72 sm:h-96 rounded-3xl relative overflow-hidden border border-white/10 shadow-2xl z-10 bg-gradient-to-b from-[#111] to-[#020204]"
            style={{
              transform: `perspective(1000px) rotateY(${mousePos.x}deg) rotateX(${-mousePos.y}deg) translateY(${Math.sin(angle / 15) * 5}px)`,
              transition: "transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)",
              boxShadow: "0 30px 60px -15px rgba(0,0,0,0.8), 0 0 50px -10px rgba(59,130,246,0.15)"
            }}
          >
            {/* Soft Ambient lighting behind image */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020204] via-transparent to-transparent z-10" />
            <div className="absolute -inset-4 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12)_0%,transparent_75%)] z-0" />
            
            {/* The Cut-Out Portrait photo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/portrait.png" 
              alt="Sai Krishna Bykani Profile"
              className="w-full h-full object-cover relative z-0 transition-transform duration-700 hover:scale-[1.02]"
              style={{
                filter: "contrast(1.05) brightness(0.98)"
              }}
            />
          </div>

          {/* Orbiting Badges */}
          {techNodes.map((node, idx) => {
            const coords = getNodeCoords(idx, techNodes.length, angle);
            return (
              <div
                key={node.name}
                className="absolute w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-premium flex items-center justify-center select-none shadow-lg z-25 hover:scale-110 active:scale-95 transition-all duration-300 pointer-events-auto cursor-pointer"
                style={{
                  transform: `translate(${coords.x}px, ${coords.y}px)`,
                  borderColor: `rgba(255,255,255,0.06)`,
                  boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.4), 0 0 15px 0 ${node.glow}`
                }}
              >
                {/* Custom Tech Badge Logo/Initials */}
                <div className={`w-full h-full rounded-xl bg-gradient-to-br ${node.color} opacity-90 flex items-center justify-center text-[10px] sm:text-xs font-black tracking-wider text-white uppercase`}>
                  {node.short}
                </div>
              </div>
            );
          })}

        </div>

      </div>

    </section>
  );
}
