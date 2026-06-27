import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import Skills from "@/components/sections/Skills";
import Projects from "@/components/sections/Projects";
import Experience from "@/components/sections/Experience";
import Expertise from "@/components/sections/Expertise";
import Certifications from "@/components/sections/Certifications";
import Blog from "@/components/sections/Blog";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/Footer";
import AIChatbot from "@/components/AIChatbot";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-[#050816]">
      {/* Sticky Pill Navigation Header */}
      <Navbar />

      {/* Hero Intro Section & Drift Tech Badges */}
      <Hero />

      {/* Skills Orbit Grid */}
      <div id="skills">
        <Skills />
      </div>

      {/* Projects Case Studies */}
      <div id="projects">
        <Projects />
      </div>

      {/* Experience Timeline */}
      <div id="experience">
        <Experience />
      </div>

      {/* QA Verification Dials */}
      <Expertise />

      {/* Certifications & Key Metrics */}
      <Certifications />

      {/* Engineering Blog */}
      <Blog />

      {/* Contact Panel */}
      <Contact />

      {/* Footer */}
      <Footer />

      {/* Dynamic AI floating Bot */}
      <AIChatbot />
    </main>
  );
}
