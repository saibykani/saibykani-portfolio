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
            02 // Timeline
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Professional Experience.
          </h3>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          {/* Left Column: Company & KPIs */}
          <div className="xl:col-span-5 space-y-8">
            
            {/* Company Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl glass-premium relative overflow-hidden group"
            >
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.03] rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-all duration-500 group-hover:bg-white/[0.05]" />
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2">
                  <Building2 className="w-6 h-6 text-slate-300" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white tracking-tight">{exp.company}</h4>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{exp.industry}</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-300">
                <div className="flex items-center">
                  <Briefcase className="w-4 h-4 mr-3 text-slate-500" />
                  <span className="font-semibold text-white">{exp.role}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-3 text-slate-500" />
                  <span>{exp.duration}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-3 text-slate-500" />
                  <span>{exp.location}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Domain Focus</h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {exp.domain}
                </p>
              </div>
            </motion.div>

            {/* KPI Counters */}
            <div className="grid grid-cols-2 gap-4">
              {kpiData.map((kpi, index) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-center"
                >
                  <div className="text-2xl font-extrabold text-white mb-1">
                    <CountUp 
                      end={kpi.value} 
                      suffix={kpi.suffix} 
                      decimals={kpi.decimals || 0}
                      duration={2.5} 
                      enableScrollSpy 
                      scrollSpyOnce
                    />
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {kpi.label}
                  </div>
                </motion.div>
              ))}
            </div>

          </div>

          {/* Right Column: Engineering Contributions */}
          <div className="xl:col-span-7 space-y-6">
            {Object.entries(exp.contributions).map(([category, items], idx) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl glass-premium"
              >
                <h4 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/10 pb-3 mb-4 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                  {category}
                </h4>
                <ul className="space-y-3">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start text-sm text-slate-300 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-slate-500 mr-3 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}

            {/* Tech Chips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="pt-4 flex flex-wrap gap-2"
            >
              {exp.technologies.map(tech => (
                <span 
                  key={tech} 
                  className="px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs font-semibold text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  {tech}
                </span>
              ))}
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
