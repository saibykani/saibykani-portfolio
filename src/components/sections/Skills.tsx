"use client";

import { Wrench, Rocket, Zap, Coffee } from "lucide-react";

interface TechSkill {
  name: string;
  icon: React.ReactNode;
  barColor: string;
  progress: string; // e.g. "w-4/5" for visual completeness
}

interface MetricCard {
  title: string;
  value: string;
  icon: any;
  color: string;
}

export default function Skills() {
  const skillsList: TechSkill[] = [
    {
      name: "Next.js",
      progress: "w-[90%]",
      barColor: "bg-white",
      icon: (
        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 15.5L12 11.8V17H10.5V9h1.3l4.35 5.75V9H17.5v8.5h-1z" />
        </svg>
      )
    },
    {
      name: "React",
      progress: "w-[85%]",
      barColor: "bg-[#00d8ff]",
      icon: (
        <svg className="w-8 h-8 text-[#00d8ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(0 12 12)" />
          <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(120 12 12)" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      )
    },
    {
      name: "TypeScript",
      progress: "w-[80%]",
      barColor: "bg-[#3178c6]",
      icon: (
        <svg className="w-8 h-8 text-[#3178c6]" viewBox="0 0 24 24" fill="currentColor">
          <rect x="2" y="2" width="20" height="20" rx="3" />
          <text x="13" y="18" fill="black" fontSize="8" fontWeight="bold" fontFamily="sans-serif">TS</text>
        </svg>
      )
    },
    {
      name: "Tailwind CSS",
      progress: "w-[90%]",
      barColor: "bg-[#06b6d4]",
      icon: (
        <svg className="w-8 h-8 text-[#06b6d4]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.91,0.23,1.57,0.9,2.29,1.63C13.676,10.6,15.26,12.2,18.801,12.2c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.91-0.23-1.57-0.9-2.29-1.63C17.126,6.4,15.541,4.8,12.001,4.8z M6.001,12.2c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.91,0.23,1.57,0.9,2.29,1.63c1.176,1.17,2.76,2.77,6.301,2.77c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.91-0.23-1.57-0.9-2.29-1.63C11.126,13.8,9.541,12.2,6.001,12.2z" />
        </svg>
      )
    },
    {
      name: "JavaScript",
      progress: "w-[88%]",
      barColor: "bg-[#f7df1e]",
      icon: (
        <svg className="w-8 h-8 text-[#f7df1e]" viewBox="0 0 24 24" fill="currentColor">
          <rect x="2" y="2" width="20" height="20" rx="3" />
          <text x="14" y="18" fill="black" fontSize="9" fontWeight="bold" fontFamily="sans-serif">JS</text>
        </svg>
      )
    },
    {
      name: "HTML",
      progress: "w-[95%]",
      barColor: "bg-[#e34f26]",
      icon: (
        <svg className="w-8 h-8 text-[#e34f26]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.8 2h18.4l-1.7 18.8L12 22l-7.5-1.2L2.8 2zm13.1 7.2h-7.8l.2 1.6h7.4l-.5 5.8L12 17.5l-3.2-.9-.2-2.3H6.4l.4 4.5 5.2 1.4 5.2-1.4.9-9.7z" />
        </svg>
      )
    },
    {
      name: "CSS",
      progress: "w-[90%]",
      barColor: "bg-[#1572b6]",
      icon: (
        <svg className="w-8 h-8 text-[#1572b6]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.8 2h18.4l-1.7 18.8L12 22l-7.5-1.2L2.8 2zm4.3 6.1l.3 3.6h7.5l-.3 3.6-2.6.7-2.6-.7-.2-2.1H7l.4 4.1 4.6 1.3 4.6-1.3 1-10.2H7.1z" />
        </svg>
      )
    },
    {
      name: "Git",
      progress: "w-[80%]",
      barColor: "bg-[#f05032]",
      icon: (
        <svg className="w-8 h-8 text-[#f05032]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="18" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="6" r="3" />
          <path d="M18 9V6M6 15v-3M12 15V9" />
          <path d="M12 9c0-1.657 1.343-3 3-3h3" />
        </svg>
      )
    },
    {
      name: "Node.js",
      progress: "w-[82%]",
      barColor: "bg-[#339933]",
      icon: (
        <svg className="w-8 h-8 text-[#339933]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L4 6.5v11L12 22l8-4.5v-11L12 2zm6 14.5l-6 3.4-6-3.4v-6.8l6-3.4 6 3.4v6.8z" />
        </svg>
      )
    },
    {
      name: "Docker",
      progress: "w-[78%]",
      barColor: "bg-[#2496ed]",
      icon: (
        <svg className="w-8 h-8 text-[#2496ed]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.9 11h2.4v2.4h-2.4V11zm-3.2 0h2.4v2.4h-2.4V11zm-3.2 0h2.4v2.4H7.5V11zm-3.2 0H6.7v2.4H4.3V11zM10.7 7.8h2.4v2.4h-2.4V7.8zm-3.2 0h2.4v2.4H7.5V7.8zm3.2-3.2h2.4v2.4h-2.4V4.6zM22.5 12c-1.1 0-2.1.9-2.1 2.1 0 .2.05.4.1.6-.4 1.1-1.3 1.8-2.5 1.8H6.5c-.7 0-1.4-.3-1.8-.8-.4-.4-.5-1-.5-1.6V8.2c0-.5-.4-.9-.9-.9s-.9.4-.9.9v4.2c0 1.2.4 2.3 1.2 3.1.8.8 1.9 1.2 3.1 1.2h11.1c2 0 3.7-1.3 4.2-3.2.1-.2.2-.5.2-.8-.1-1.1-1-2-2.1-2z" />
        </svg>
      )
    },
    {
      name: "C",
      progress: "w-[75%]",
      barColor: "bg-[#a8b9cc]",
      icon: (
        <svg className="w-8 h-8 text-[#a8b9cc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9a4 4 0 1 0 0 6" />
        </svg>
      )
    },
    {
      name: "C++",
      progress: "w-[72%]",
      barColor: "bg-[#00599c]",
      icon: (
        <svg className="w-8 h-8 text-[#00599c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M13 9a4 4 0 1 0 0 6" />
          <path d="M16 12h3M17.5 10.5v3M19.5 12h3M21 10.5v3" />
        </svg>
      )
    }
  ];

  const metrics: MetricCard[] = [
    { title: "Technologies", value: "12+ Core stacks", icon: Wrench, color: "text-[#a78bfa] bg-[#a78bfa]/10" },
    { title: "Projects", value: "4+ Custom Frameworks", icon: Rocket, color: "text-[#fb7185] bg-[#fb7185]/10" },
    { title: "Experience", value: "3 Years Professional", icon: Zap, color: "text-[#fb923c] bg-[#fb923c]/10" },
    { title: "Coffee Cups", value: "800+ Cups Consumed", icon: Coffee, color: "text-[#c084fc] bg-[#c084fc]/10" }
  ];

  return (
    <section id="skills" className="py-24 relative overflow-hidden bg-black">
      
      {/* Background glow node */}
      <div className="absolute top-1/2 left-[-10%] w-[350px] h-[350px] rounded-full bg-orange-500/5 filter blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Title Header */}
        <div className="max-w-3xl mb-16 text-center sm:text-left space-y-3">
          <div className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">
            Specialized Capabilities
          </div>
          <h2 className="text-3xl sm:text-4.5xl font-extrabold tracking-tight text-white leading-tight">
            <span className="bg-gradient-to-r from-orange-500 to-red-650 bg-clip-text text-transparent">
              Skills &amp; Technologies
            </span>
          </h2>
          <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full w-24 my-2" />
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            A premium matrix representing the core technologies, tools, and languages utilized in my testing and development workflow.
          </p>
        </div>

        {/* Skills Cards Grid (12 Cards - matching mockup grid layout) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5 mb-16">
          {skillsList.map((skill) => (
            <div
              key={skill.name}
              className="p-5 rounded-2xl glass-premium flex flex-col items-center justify-between space-y-4 hover:border-white/20 hover:bg-white/[0.03] transition-all duration-300"
            >
              <div className="w-14 h-14 flex items-center justify-center">
                {skill.icon}
              </div>
              
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center">
                {skill.name}
              </span>

              {/* Glowing active progress line (matching uploaded layout) */}
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className={`h-full ${skill.progress} ${skill.barColor} rounded-full`} />
              </div>
            </div>
          ))}
        </div>

        {/* 4 Summary Status Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="p-6 rounded-2xl glass-premium flex flex-col items-center text-center space-y-3 hover:border-orange-500/20 transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {m.title}
                </h4>
                
                <span className="text-xs font-bold text-white leading-tight">
                  {m.value}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
