"use client";

import { motion } from "framer-motion";
import CountUp from "react-countup";
import Image from "next/image";
import resumeData from "@/data/resumeData.json";
import { Briefcase, Calendar, MapPin, Building2, CheckCircle2 } from "lucide-react";

export default function Experience() {
  const exp = resumeData.experience[0];

  const kpiData = [
    { label: "Automated Test Cases", value: 1000, suffix: "+" },
    { label: "APIs Tested", value: 750, suffix: "+" },
    { label: "Years Experience", value: 3, suffix: "+" },
    { label: "Regression Time Reduced", value: 40, suffix: "%" },
    { label: "Release Stability", value: 99.8, suffix: "%", decimals: 1 },
    { label: "Peak Load Testing", value: 3, suffix: "×" },
  ];

  return (
    <section id="experience" className="py-24 relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-sm font-bold tracking-widest uppercase text-slate-500 mb-2">
            Timeline
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Experience.
          </h3>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 sm:p-10 rounded-3xl glass-premium border border-white/10 relative overflow-hidden group shadow-2xl"
          >
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-all duration-500 group-hover:bg-white/[0.04]" />
            
            {/* Header: Logo, Company, Role */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10 relative z-10 border-b border-white/10 pb-8">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shrink-0">
                  <Image src="/logo.png" alt="Company Logo" width={48} height={48} className="object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <Building2 className="w-8 h-8 text-slate-400 absolute -z-10" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-white tracking-tight mb-1">{exp.company}</h4>
                  <div className="flex items-center text-sm font-semibold text-slate-400 uppercase tracking-wider space-x-3">
                    <span>{exp.industry}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span>{exp.duration}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-300 sm:text-right">
                <div className="flex items-center sm:justify-end">
                  <Briefcase className="w-4 h-4 mr-2 text-blue-400" />
                  <span className="font-bold text-white text-base">{exp.role}</span>
                </div>
                <div className="flex items-center sm:justify-end text-slate-400">
                  <MapPin className="w-4 h-4 mr-2 text-slate-500" />
                  <span>{exp.location}</span>
                </div>
              </div>
            </div>

            {/* Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Left Column: Domain & KPIs */}
              <div className="lg:col-span-1 space-y-8">
                <div>
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Domain Focus</h5>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {exp.domain}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {kpiData.map((kpi, index) => (
                    <div
                      key={kpi.label}
                      className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-center text-center"
                    >
                      <div className="text-xl font-extrabold text-white mb-1">
                        <CountUp 
                          end={kpi.value} 
                          suffix={kpi.suffix} 
                          decimals={kpi.decimals || 0}
                          duration={2.5} 
                          enableScrollSpy 
                          scrollSpyOnce
                        />
                      </div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        {kpi.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Engineering Contributions */}
              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {Object.entries(exp.contributions).map(([category, items], idx) => (
                    <div key={category} className="space-y-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest border-b border-white/10 pb-2 mb-3 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                        {category}
                      </h4>
                      <ul className="space-y-2">
                        {items.map((item, i) => (
                          <li key={i} className="flex items-start text-xs text-slate-300 leading-relaxed">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Tech Chips */}
                <div className="pt-4 border-t border-white/10">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Technologies Used</h5>
                  <div className="flex flex-wrap gap-2">
                    {exp.technologies.map(tech => (
                      <span 
                        key={tech} 
                        className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-semibold text-blue-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
