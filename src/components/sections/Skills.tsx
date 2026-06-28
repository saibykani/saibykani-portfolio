"use client";

import { useEffect, useRef, useState } from "react";
import { Wrench, Rocket, Zap, Shield } from "lucide-react";

interface TechSkill {
  name: string;
  icon: React.ReactNode;
  barColor: string;
  progress: string;
}

interface SkillCategory {
  title: string;
  label: string;
  skills: TechSkill[];
}

export default function Skills() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const categories: SkillCategory[] = [
    {
      title: "Programming & Automation",
      label: "AUTOMATION",
      skills: [
        {
          name: "Java",
          progress: "w-[92%]",
          barColor: "bg-[#f89820]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#f89820">
              <path d="M8.851 18.56s-.917.534.653.714c.575.085 1.239.134 1.913.134 1.084 0 2.138-.125 3.149-.363l-.093.018c.374.228.809.442 1.273.596l.065.019c-4.524 1.934-10.234-.112-6.961-1.118zm-.575-2.572s-1.031.762.542.924c.687.086 1.482.106 2.26.058l-.052.003c.822-.044 1.61-.156 2.369-.33l-.075.016c.399.228.852.442 1.337.596l.065.019c-5.476 1.872-11.559.148-6.446-1.286z"/>
              <path d="M13.288 10.845c1.313 1.511-.345 2.871-.345 2.871s3.334-1.721 1.803-3.876c-1.428-2.012-2.521-3.012 3.404-6.463 0 0-9.303 2.321-4.862 7.468z"/>
              <path d="M18.489 20.458s.679.559-.747.991c-2.712.822-11.288 1.069-13.669.033-.856-.373.75-.89 1.254-.998.527-.113.828-.092.828-.092-.953-.671-6.156 1.317-2.643 1.887 9.58 1.553 17.462-.7 14.977-1.821zm-9.727-6.932s-4.359 1.034-1.544 1.411c1.185.159 3.545.123 5.748-.062 1.8-.152 3.606-.477 3.606-.477s-.635.272-1.094.585c-4.418 1.163-12.949.621-10.491-.567 2.079-1.003 3.775-.89 3.775-.89zm7.798 4.363c4.487-2.332 2.413-4.573.964-4.271-.355.074-.514.138-.514.138s.132-.207.384-.296c2.867-1.008 5.072 2.975-.924 4.554 0 0 .069-.062.09-.125z"/>
              <path d="M14.401 0s2.494 2.494-2.365 6.338c-3.896 3.083-.889 4.844-.001 6.854-2.274-2.052-3.943-3.858-2.824-5.541 1.644-2.469 6.197-3.665 5.19-7.651z"/>
              <path d="M9.734 23.924c4.322.277 10.959-.154 11.116-2.198 0 0-.302.775-3.572 1.391-3.688.694-8.239.613-10.937.168 0 0 .553.457 3.393.639z"/>
            </svg>
          ),
        },
        {
          name: "Selenium",
          progress: "w-[90%]",
          barColor: "bg-[#43b02a]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#43b02a">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#43b02a" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
        },
        {
          name: "Cucumber BDD",
          progress: "w-[88%]",
          barColor: "bg-[#23d96c]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="4" fill="#23d96c" opacity="0.15"/>
              <path d="M7 12l3 3 7-7" stroke="#23d96c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
        },
        {
          name: "TestNG",
          progress: "w-[85%]",
          barColor: "bg-[#cd6839]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="4" fill="#cd6839"/>
              <text x="12" y="16" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif">TN</text>
            </svg>
          ),
        },
        {
          name: "Maven",
          progress: "w-[82%]",
          barColor: "bg-[#c71a36]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="4" fill="#c71a36"/>
              <text x="12" y="16" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="sans-serif">MVN</text>
            </svg>
          ),
        },
        {
          name: "POM",
          progress: "w-[88%]",
          barColor: "bg-[#8b5cf6]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="4" fill="#8b5cf6" opacity="0.15"/>
              <path d="M8 4v16M4 8h16M4 16h16M16 4v16" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.6"/>
              <rect x="6" y="6" width="5" height="5" rx="1" fill="#8b5cf6" opacity="0.8"/>
              <rect x="13" y="13" width="5" height="5" rx="1" fill="#8b5cf6" opacity="0.5"/>
            </svg>
          ),
        },
      ],
    },
    {
      title: "API Testing",
      label: "API",
      skills: [
        {
          name: "REST Assured",
          progress: "w-[90%]",
          barColor: "bg-[#49cc90]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h10" stroke="#49cc90" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="20" cy="18" r="3" fill="#49cc90"/>
            </svg>
          ),
        },
        {
          name: "Postman",
          progress: "w-[92%]",
          barColor: "bg-[#ff6c37]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#ff6c37">
              <circle cx="12" cy="12" r="10" fill="#ff6c37" opacity="0.15"/>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3.5l1.5 4.5H9l1.5-4.5H12zm-3.5 6h7l-1.5 4.5h-4L8.5 11.5z" fill="#ff6c37"/>
            </svg>
          ),
        },
        {
          name: "Newman",
          progress: "w-[80%]",
          barColor: "bg-[#ff6c37]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" fill="#ff6c37" opacity="0.12"/>
              <path d="M8 12l2 2 4-4" stroke="#ff6c37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 7h10M7 17h6" stroke="#ff6c37" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            </svg>
          ),
        },
        {
          name: "REST API",
          progress: "w-[90%]",
          barColor: "bg-[#61affe]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path d="M4 12h16" stroke="#61affe" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9 6l-5 6 5 6" stroke="#61affe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 6l5 6-5 6" stroke="#61affe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
        },
        {
          name: "JSON",
          progress: "w-[92%]",
          barColor: "bg-[#a0a0a0]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <text x="12" y="16" textAnchor="middle" fill="#a0a0a0" fontSize="7" fontWeight="bold" fontFamily="monospace">{`{}`}</text>
            </svg>
          ),
        },
        {
          name: "XML",
          progress: "w-[85%]",
          barColor: "bg-[#f0ad4e]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <text x="12" y="16" textAnchor="middle" fill="#f0ad4e" fontSize="6" fontWeight="bold" fontFamily="monospace">{`</>`}</text>
            </svg>
          ),
        },
      ],
    },
    {
      title: "Performance Testing",
      label: "PERFORMANCE",
      skills: [
        {
          name: "Apache JMeter",
          progress: "w-[88%]",
          barColor: "bg-[#d22128]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#d22128" strokeWidth="2" fill="none"/>
              <path d="M12 7v5l3 3" stroke="#d22128" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="1.5" fill="#d22128"/>
            </svg>
          ),
        },
        {
          name: "Load Testing",
          progress: "w-[85%]",
          barColor: "bg-[#f97316]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path d="M3 20h18M5 20V10M9 20V6M13 20V10M17 20V4" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          ),
        },
        {
          name: "Stress Testing",
          progress: "w-[82%]",
          barColor: "bg-[#ef4444]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#ef4444" opacity="0.15" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
        },
        {
          name: "Spike Testing",
          progress: "w-[78%]",
          barColor: "bg-[#f59e0b]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <polyline points="3,18 8,18 10,6 12,18 14,3 16,18 21,18" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
        },
        {
          name: "Endurance Testing",
          progress: "w-[80%]",
          barColor: "bg-[#06b6d4]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#06b6d4" strokeWidth="2" fill="none"/>
              <path d="M12 6v6h6" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ),
        },
      ],
    },
    {
      title: "Database & Backend",
      label: "DATABASE",
      skills: [
        {
          name: "MongoDB",
          progress: "w-[85%]",
          barColor: "bg-[#47a248]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#47a248">
              <path d="M12.5 2c-.3 1.5-.8 2.6-1.6 3.5C9.7 7 9 8.3 9 10c0 2.2 1.3 4 3 4.8V22h1v-7.2c1.7-.8 3-2.6 3-4.8 0-1.7-.7-3-1.9-4.5-.8-.9-1.3-2-1.6-3.5z"/>
            </svg>
          ),
        },
        {
          name: "MySQL",
          progress: "w-[88%]",
          barColor: "bg-[#4479a1]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <ellipse cx="12" cy="7" rx="8" ry="3" stroke="#4479a1" strokeWidth="2" fill="none"/>
              <path d="M4 7v10c0 1.66 3.58 3 8 3s8-1.34 8-3V7" stroke="#4479a1" strokeWidth="2" fill="none"/>
              <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" stroke="#4479a1" strokeWidth="2" fill="none"/>
            </svg>
          ),
        },
        {
          name: "Azure SQL",
          progress: "w-[80%]",
          barColor: "bg-[#0078d4]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" fill="#0078d4" opacity="0.12"/>
              <ellipse cx="12" cy="9" rx="6" ry="2.5" stroke="#0078d4" strokeWidth="1.5" fill="none"/>
              <path d="M6 9v6c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5V9" stroke="#0078d4" strokeWidth="1.5" fill="none"/>
            </svg>
          ),
        },
        {
          name: "Backend Validation",
          progress: "w-[86%]",
          barColor: "bg-[#10b981]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="5" rx="2" stroke="#10b981" strokeWidth="1.5"/>
              <rect x="3" y="14" width="18" height="5" rx="2" stroke="#10b981" strokeWidth="1.5"/>
              <circle cx="7" cy="7.5" r="1" fill="#10b981"/>
              <circle cx="7" cy="16.5" r="1" fill="#10b981"/>
            </svg>
          ),
        },
        {
          name: "Log Analysis",
          progress: "w-[82%]",
          barColor: "bg-[#a78bfa]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 10h12M4 14h14M4 18h8" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="19" cy="17" r="3" stroke="#a78bfa" strokeWidth="1.5"/>
              <path d="M21.5 19.5l1.5 1.5" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ),
        },
      ],
    },
    {
      title: "CI/CD & DevOps",
      label: "CI/CD",
      skills: [
        {
          name: "Jenkins",
          progress: "w-[85%]",
          barColor: "bg-[#d33833]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="10" r="8" fill="#d33833" opacity="0.12"/>
              <circle cx="12" cy="10" r="5" stroke="#d33833" strokeWidth="1.5"/>
              <path d="M12 7v3l2 1" stroke="#d33833" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M8 18h8M10 18v3M14 18v3" stroke="#d33833" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ),
        },
        {
          name: "Git",
          progress: "w-[88%]",
          barColor: "bg-[#f05032]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#f05032">
              <path d="M23.5 11.5l-11-11a1.5 1.5 0 00-2.12 0L8.44 2.44l2.68 2.68a1.78 1.78 0 012.26 2.26l2.58 2.58a1.78 1.78 0 11-1.06 1.06L12.4 8.52v5.7a1.78 1.78 0 11-1.5-.08V8.35a1.78 1.78 0 01-.96-2.34L7.3 3.37.5 10.18a1.5 1.5 0 000 2.12l11 11a1.5 1.5 0 002.12 0l9.88-9.88a1.5 1.5 0 000-2.12z"/>
            </svg>
          ),
        },
        {
          name: "GitHub",
          progress: "w-[90%]",
          barColor: "bg-[#e6edf3]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#e6edf3">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.607.069-.607 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
          ),
        },
        {
          name: "Gitea",
          progress: "w-[75%]",
          barColor: "bg-[#609926]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" fill="#609926" opacity="0.12"/>
              <path d="M8 12l3 3 5-5" stroke="#609926" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
        },
        {
          name: "Grafana",
          progress: "w-[78%]",
          barColor: "bg-[#f46800]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#f46800" strokeWidth="1.5" fill="none"/>
              <circle cx="12" cy="12" r="4" stroke="#f46800" strokeWidth="1.5" fill="none"/>
              <circle cx="12" cy="12" r="1" fill="#f46800"/>
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="#f46800" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ),
        },
      ],
    },
    {
      title: "Test Management",
      label: "MANAGEMENT",
      skills: [
        {
          name: "Jira",
          progress: "w-[90%]",
          barColor: "bg-[#0052cc]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#0052cc">
              <path d="M12.005 2c-5.263 8.304-1.456 12 0 13.456C13.456 14 17.263 10.304 12.005 2zM5.5 16.5L12 10l6.5 6.5c-3.5 3.5-9.5 3.5-13 0z"/>
            </svg>
          ),
        },
        {
          name: "Spira",
          progress: "w-[82%]",
          barColor: "bg-[#6366f1]",
          icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="4" fill="#6366f1" opacity="0.12"/>
              <path d="M8 8h8M8 12h6M8 16h4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="18" cy="16" r="2" fill="#6366f1"/>
            </svg>
          ),
        },
      ],
    },
  ];

  const metrics = [
    { title: "Technologies", value: "28+ Core Tools", icon: Wrench, color: "text-[#a78bfa] bg-[#a78bfa]/10" },
    { title: "Frameworks", value: "4+ Custom Built", icon: Rocket, color: "text-[#fb7185] bg-[#fb7185]/10" },
    { title: "Experience", value: "3+ Years Professional", icon: Zap, color: "text-[#fb923c] bg-[#fb923c]/10" },
    { title: "Quality", value: "Enterprise-Grade", icon: Shield, color: "text-[#22d3ee] bg-[#22d3ee]/10" },
  ];

  return (
    <section ref={sectionRef} id="skills" className="py-24 relative overflow-hidden bg-black">
      {/* Background glows */}
      <div className="absolute top-1/3 left-[-10%] w-[350px] h-[350px] rounded-full bg-cyan-500/[0.02] filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-[-5%] w-[300px] h-[300px] rounded-full bg-purple-500/[0.02] filter blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="mb-16">
          <span className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">02</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Skills & Technologies
          </h2>
          <div className="w-12 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500 mt-4" />
          <p className="text-sm text-gray-500 max-w-xl leading-relaxed mt-4">
            A comprehensive toolkit spanning automation, API testing, performance engineering, and CI/CD — built for enterprise-grade quality assurance.
          </p>
        </div>

        {/* Skill Categories */}
        <div className="space-y-14">
          {categories.map((category, catIdx) => (
            <div
              key={category.title}
              className={`transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${catIdx * 150}ms` }}
            >
              {/* Category Label */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.25em]">
                  {category.label}
                </span>
                <div className="flex-1 h-[1px] bg-white/[0.04]" />
              </div>

              {/* Skills Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {category.skills.map((skill) => (
                  <div
                    key={skill.name}
                    className="group relative p-5 rounded-2xl bg-[#09090b] border border-white/[0.06] flex flex-col items-center justify-between space-y-3 hover:border-white/[0.12] hover:bg-white/[0.02] transition-all duration-300 hover:shadow-lg hover:shadow-black/30"
                  >
                    {/* Hover glow */}
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% 30%, ${skill.barColor.replace("bg-[", "").replace("]", "")}11, transparent 70%)`,
                      }}
                    />

                    {/* Icon */}
                    <div className="w-12 h-12 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-300">
                      {skill.icon}
                    </div>

                    {/* Name */}
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center relative z-10 group-hover:text-gray-200 transition-colors">
                      {skill.name}
                    </span>

                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden relative z-10">
                      <div
                        className={`h-full ${skill.progress} rounded-full transition-all duration-1000 ${
                          isVisible ? "opacity-100" : "opacity-0 w-0"
                        }`}
                        style={{ backgroundColor: skill.barColor.replace("bg-[", "").replace("]", "") }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="p-6 rounded-2xl bg-[#09090b] border border-white/[0.06] flex flex-col items-center text-center space-y-3 hover:border-white/[0.1] transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">
                  {m.title}
                </h4>
                <span className="text-xs font-bold text-white">{m.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
