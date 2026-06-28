"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, User, Briefcase, Code2, FolderKanban, Mail } from "lucide-react";

const COLOR_PALETTES = [
  { from: "#f97316", to: "#ef4444" },   // orange → red
  { from: "#06b6d4", to: "#3b82f6" },   // cyan → blue
  { from: "#a855f7", to: "#ec4899" },   // purple → pink
  { from: "#10b981", to: "#06b6d4" },   // emerald → cyan
  { from: "#f59e0b", to: "#f97316" },   // amber → orange
  { from: "#8b5cf6", to: "#6366f1" },   // violet → indigo
  { from: "#14b8a6", to: "#22d3ee" },   // teal → cyan
  { from: "#f43f5e", to: "#e879f9" },   // rose → fuchsia
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [colorIndex, setColorIndex] = useState(0);
  const pathname = usePathname();

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Color cycling every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % COLOR_PALETTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Section observer for active nav link
  useEffect(() => {
    if (pathname !== "/") return;
    const sections = ["about", "skills", "projects", "experience"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-80px 0px 0px 0px" }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [pathname]);

  const navLinks = [
    { name: "Home", href: "/", id: "home", icon: Home },
    { name: "About", href: "#about", id: "about", icon: User },
    { name: "Experience", href: "#experience", id: "experience", icon: Briefcase },
    { name: "Skills", href: "#skills", id: "skills", icon: Code2 },
    { name: "Projects", href: "#projects", id: "projects", icon: FolderKanban },
    { name: "Contact", href: "#contact", id: "contact", icon: Mail },
  ];

  const handleLinkClick = (href: string, id: string) => {
    setIsOpen(false);
    setActiveSection(id);
    if (href.startsWith("#")) {
      const el = document.getElementById(href.substring(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const isLinkActive = (link: { href: string; id: string }) => {
    if (pathname === "/resume" || pathname === "/recruiter") {
      return link.href === pathname;
    }
    if (link.id === "home" && activeSection === "home" && pathname === "/") return true;
    return activeSection === link.id;
  };

  const currentPalette = COLOR_PALETTES[colorIndex];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-black/80 backdrop-blur-xl shadow-2xl shadow-black/50" : "bg-transparent"
      }`}
    >
      {/* Gradient bottom line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px] transition-all duration-[2000ms]"
        style={{
          background: `linear-gradient(90deg, transparent, ${currentPalette.from}, ${currentPalette.to}, transparent)`,
          opacity: scrolled ? 0.6 : 0.3,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        
        {/* Brand Logo + Name */}
        <Link href="/" className="flex items-center space-x-3 group">
          {/* Animated Logo Icon */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-700"
            style={{
              background: `linear-gradient(135deg, ${currentPalette.from}, ${currentPalette.to})`,
              boxShadow: `0 0 20px ${currentPalette.from}33`,
              transition: "background 2s ease, box-shadow 2s ease, transform 0.7s ease",
            }}
          >
            {/* Custom bolt/code icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>

          {/* Name with animated color */}
          <div className="flex flex-col">
            <span
              className="text-sm sm:text-base font-bold bg-clip-text text-transparent transition-all duration-[2000ms]"
              style={{
                backgroundImage: `linear-gradient(90deg, ${currentPalette.from}, ${currentPalette.to})`,
              }}
            >
              Sai Krishna Bykani
            </span>
            <span className="text-[9px] text-gray-500 font-medium uppercase tracking-[0.2em]">
              QA Automation Engineer
            </span>
          </div>
        </Link>

        {/* Navigation Links — Pill Container */}
        <div className="hidden md:flex items-center bg-white/[0.03] backdrop-blur-sm rounded-full border border-white/[0.08] px-1.5 py-1.5">
          {navLinks.map((link) => {
            const active = isLinkActive(link);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => handleLinkClick(link.href, link.id)}
                className="relative group"
              >
                <div
                  className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium tracking-wide transition-all duration-300 ${
                    active
                      ? "text-white bg-white/[0.08]"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.name}</span>
                </div>

                {/* Active dot indicator */}
                {active && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-[2000ms]"
                    style={{
                      backgroundColor: currentPalette.from,
                      boxShadow: `0 0 6px ${currentPalette.from}`,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white p-2.5 rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/[0.1] hover:bg-white/[0.1] transition-all"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden absolute top-[60px] left-4 right-4 z-40 bg-black/95 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-3 shadow-2xl space-y-1">
          {navLinks.map((link) => {
            const active = isLinkActive(link);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => handleLinkClick(link.href, link.id)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium tracking-wide transition-all ${
                  active
                    ? "text-white bg-white/[0.06]"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
                {active && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: currentPalette.from }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
