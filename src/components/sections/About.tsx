"use client";

import { useEffect, useRef, useState } from "react";

export default function About() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const stats = [
    { value: "3+", label: "Years Experience" },
    { value: "2000+", label: "Automated Test Cases" },
    { value: "1250+", label: "APIs Validated" },
  ];

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-24 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden"
    >
      {/* Subtle ambient glow */}
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-blue-500/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Section Label */}
        <div className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            About Me
          </h2>
          <div className="w-12 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500 mt-4" />
        </div>

        {/* Content Grid: Text Left, Image Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text Content */}
          <div
            className={`space-y-6 transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <p className="text-[15px] text-gray-300 leading-[1.8]">
              I&apos;m a Software Development Engineer in Test (SDET) with over 3 years
              of experience building scalable automation frameworks and ensuring
              software quality for enterprise payment applications. My expertise
              spans UI automation, API testing, backend validation, and
              performance engineering, helping deliver reliable and secure digital
              payment solutions.
            </p>

            <p className="text-[15px] text-gray-400 leading-[1.8]">
              Throughout my journey at Toucan Payments, I&apos;ve worked on
              mission-critical payment systems, automating end-to-end workflows
              using Java, Selenium WebDriver, Cucumber, REST Assured, Postman,
              and Apache JMeter. I enjoy transforming complex testing challenges
              into robust automation solutions that improve release quality and
              reduce manual effort.
            </p>

            <p className="text-[15px] text-gray-400 leading-[1.8]">
              I believe quality is not just about finding defects — it&apos;s about
              engineering confidence into every release. By combining automation,
              API validation, database verification, and performance testing, I
              help teams ship faster while maintaining stability, scalability,
              and exceptional user experiences.
            </p>

            {/* Stats Row */}
            <div
              className={`flex items-center gap-10 pt-6 border-t border-white/[0.06] transition-all duration-1000 delay-300 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              {stats.map((st, i) => (
                <div key={st.label} className="space-y-1">
                  <span
                    className={`text-2xl sm:text-3xl font-extrabold block ${
                      i === 1
                        ? "text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400"
                        : "text-white"
                    }`}
                  >
                    {st.value}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-[0.15em] font-semibold block">
                    {st.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Portrait Image */}
          <div
            className={`flex justify-center lg:justify-end transition-all duration-1000 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="relative">
              {/* Image Container */}
              <div className="relative w-[320px] h-[420px] sm:w-[360px] sm:h-[480px] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/50 bg-[#0a0a0a]">

                {/* Portrait */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/portrait.png"
                  alt="Sai Krishna Bykani"
                  className="w-full h-full object-contain object-bottom transition-transform duration-700 hover:scale-[1.03]"
                  style={{ filter: "contrast(1.05) brightness(0.95)" }}
                />
              </div>

              {/* Floating name tag */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/[0.08] shadow-xl z-20">
                <span className="text-[11px] font-semibold text-gray-300 tracking-wide">
                  Sai Krishna Bykani
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
