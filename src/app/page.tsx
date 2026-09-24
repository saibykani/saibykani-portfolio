import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import Bento from "@/components/sections/Bento";
import Projects from "@/components/sections/Projects";
import Skills from "@/components/sections/Skills";
import Ribbon from "@/components/sections/Ribbon";
import About from "@/components/sections/About";
import Experience from "@/components/sections/Experience";
import Achievements from "@/components/sections/Achievements";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/Footer";
import AIChatbot from "@/components/AIChatbot";

export default function Home() {
  return (
    <>
      <Navbar />

      <div id="home">
        <Hero />
      </div>

      <main className="w-full bg-black">
        <Bento />

        <div id="projects">
          <Projects />
        </div>

        <div id="skills">
          <Skills />
        </div>

        <Ribbon />

        <div id="about">
          <About />
        </div>

        <div id="experience">
          <Experience />
        </div>

        <Achievements />

        <Contact />
      </main>

      <Footer />

      {/* Floating resume pill */}
      <div className="fixed bottom-[14px] left-[12px] z-40 animate-bounce select-none md:bottom-[20px] md:left-[20px] no-print">
        <Link
          href="/resume"
          className="group relative inline-flex cursor-pointer items-center justify-between overflow-hidden rounded-full border border-white/10 bg-white/10 py-1.5 pl-3.5 pr-1.5 font-mono text-xs font-medium shadow-lg shadow-black/40 backdrop-blur-md transition-all duration-300 hover:border-white/20 sm:text-[13px]"
        >
          <span className="z-10 flex items-center gap-2 pr-3 text-white transition-colors duration-300 group-hover:text-black">
            <span className="font-bold text-sky-400 transition-colors duration-300 group-hover:text-black">&gt;_</span>
            <span className="font-semibold tracking-tight">~/resume</span>
          </span>
          <span className="absolute inset-0 translate-x-[45%] scale-0 rounded-full bg-white opacity-0 transition-all duration-300 ease-in-out group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100" />
          <span className="relative z-10 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white text-black transition-colors duration-300 group-hover:bg-transparent">
            <ArrowRight className="size-3.5" />
          </span>
        </Link>
      </div>

      <AIChatbot />
    </>
  );
}
