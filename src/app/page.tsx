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
import Certifications from "@/components/sections/Certifications";
import BugHunt from "@/components/sections/BugHunt";
import RaceShowcase from "@/components/sections/RaceShowcase";
import ScrollScene from "@/components/ui/ScrollScene";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/Footer";
import AIChatbot from "@/components/AIChatbot";
import SmoothScroll from "@/components/SmoothScroll";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import Preloader from "@/components/Preloader";
import WeatherOverlay from "@/components/weather/WeatherOverlay";
import { WeatherProvider } from "@/components/weather/WeatherContext";
import ScrollProgress from "@/components/ScrollProgress";

export default function Home() {
  return (
    <WeatherProvider>
      <Preloader />
      <SmoothScroll />
      <WeatherOverlay />
      <ThemeSwitcher />
      <ScrollProgress />
      <Navbar />

      <div id="home">
        <Hero />
      </div>

      <main className="w-full bg-black">
        <ScrollScene>
          <Bento />
        </ScrollScene>

        <RaceShowcase />

        <div id="projects">
          <Projects />
        </div>

        <div id="skills">
          <ScrollScene>
            <Skills />
          </ScrollScene>
        </div>

        <Ribbon />

        <div id="about">
          <ScrollScene>
            <About />
          </ScrollScene>
        </div>

        <div id="experience">
          <ScrollScene>
            <Experience />
          </ScrollScene>
        </div>


        <div id="achievements">
          <ScrollScene>
            <Achievements />
          </ScrollScene>
        </div>

        <div id="certifications">
          <Certifications />
        </div>

        <div id="game">
          <ScrollScene>
            <BugHunt />
          </ScrollScene>
        </div>

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
    </WeatherProvider>
  );
}
