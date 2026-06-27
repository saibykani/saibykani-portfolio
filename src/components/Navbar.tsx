"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, Code } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "#about" },
    { name: "Skills", href: "#skills" },
    { name: "Projects", href: "#projects" },
    { name: "Experience", href: "#experience" },
    { name: "Resume", href: "/resume" },
  ];

  const handleLinkClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith("#")) {
      const el = document.getElementById(href.substring(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/20 border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        
        {/* Brand Monogram Avatar */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-650 flex items-center justify-center shadow-lg group-hover:shadow-orange-500/20 group-hover:scale-105 group-hover:rotate-[360deg] transition-all duration-500">
            <Code className="text-white w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent group-hover:scale-[1.01] transition-transform">
              Sai Krishna Bykani
            </span>
            <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">
              QA Automation Engineer
            </span>
          </div>
        </Link>

        {/* Navigation links inside centered bar */}
        <div className="hidden md:flex items-center bg-white/5 backdrop-blur-sm rounded-full border border-white/10 px-2 py-1.5 space-x-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href.startsWith("#") && pathname === "/");
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => handleLinkClick(link.href)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/10"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Action button on the right */}
        <div className="hidden md:flex items-center">
          <Link
            href="/recruiter"
            className="px-5 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-md shadow-orange-500/10 hover:scale-[1.02] flex items-center space-x-1"
          >
            <span>Hire Me</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white hover:text-orange-400 transition-colors p-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-4 right-4 z-40 bg-[#050508]/95 border border-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl space-y-2 animate-in fade-in slide-in-from-top-5 duration-300">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => handleLinkClick(link.href)}
              className="block px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2">
            <Link
              href="/recruiter"
              onClick={() => setIsOpen(false)}
              className="w-full text-center block py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-xs tracking-wider uppercase shadow-lg"
            >
              Hire Me
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
