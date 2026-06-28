"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const navLinks = [
  { name: "Overview", href: "/", id: "home" },
  { name: "About Me", href: "#about", id: "about" },
  { name: "Professional Experience", href: "#experience", id: "experience" },
  { name: "Tech Stack", href: "#skills", id: "skills" },
  { name: "Case Studies", href: "#projects", id: "projects" },
  { name: "Contact", href: "#contact", id: "contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const pathname = usePathname();

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Section observer for active nav link
  useEffect(() => {
    if (pathname !== "/") return;
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
    
    navLinks.forEach((link) => {
      if (link.id !== "home") {
        const el = document.getElementById(link.id);
        if (el) observer.observe(el);
      }
    });
    
    const homeEl = document.getElementById("home");
    if (homeEl) observer.observe(homeEl);

    return () => observer.disconnect();
  }, [pathname]);

  const handleLinkClick = (href: string, id: string) => {
    setActiveSection(id);
    if (href.startsWith("#")) {
      const el = document.getElementById(href.substring(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const isLinkActive = (id: string) => {
    if (id === "home" && activeSection === "home" && pathname === "/") return true;
    return activeSection === id;
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 transition-all duration-500`}
    >
      <div 
        className={`flex items-center px-2 py-2 rounded-full border transition-all duration-500 ${
          scrolled 
            ? "bg-[#0a0a0c]/80 backdrop-blur-md border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]" 
            : "bg-transparent border-transparent"
        }`}
      >
        <ul className="flex items-center space-x-1" onMouseLeave={() => setHoveredSection(null)}>
          {navLinks.map((link) => {
            const active = isLinkActive(link.id);
            const isHovered = hoveredSection === link.id;

            return (
              <li key={link.id} className="relative z-10">
                <Link
                  href={link.href}
                  onClick={(e) => {
                    if (link.href.startsWith("#")) {
                      e.preventDefault();
                    }
                    handleLinkClick(link.href, link.id);
                  }}
                  onMouseEnter={() => setHoveredSection(link.id)}
                  className={`relative block px-4 py-2 text-[11px] font-semibold tracking-widest uppercase transition-colors duration-300 ${
                    active || isHovered ? "text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {link.name}
                </Link>

                {/* Hover Background (Magnetic effect) */}
                {isHovered && !active && (
                  <motion.div
                    layoutId="nav-hover"
                    className="absolute inset-0 bg-white/[0.04] rounded-full -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                {/* Active Indicator */}
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-white/[0.08] border border-white/[0.1] rounded-full -z-10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  >
                    {/* Glowing dot underneath */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  </motion.div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
