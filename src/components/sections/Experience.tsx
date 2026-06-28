"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import Image from "next/image";
import resumeData from "@/data/resumeData.json";
import { Briefcase, Calendar, MapPin, Building2, CheckCircle2, ChevronRight, X } from "lucide-react";

export default function Experience() {
  const exp = resumeData.experience[0];
  const [isModalOpen, setIsModalOpen] = useState(false);

  const kpiData = [
    { label: "Automated Test Cases", value: 1000, suffix: "+" },
    { label: "APIs Tested", value: 750, suffix: "+" },
    { label: "Years Experience", value: 3, suffix: "+" },
    { label: "Regression Time Reduced", value: 40, suffix: "%" },
    { label: "Release Stability", value: 99.8, suffix: "%", decimals: 1 },
    { label: "Peak Load Verified", value: 3, suffix: "×" },
  ];

  const badges = ["UI Automation", "API Automation", "Performance Testing", "Backend Validation"];

  const summary = "Building enterprise automation frameworks for payment gateway systems, merchant acquiring, API validation, performance testing and release automation.";

  const milestones = [
    { id: "UI Automation", title: "UI Automation", content: exp.contributions["UI & E2E Automation"] || [] },
    { id: "API Automation", title: "API Automation", content: exp.contributions["API & Backend Validation"] || [] },
    { id: "Performance Engineering", title: "Performance Engineering", content: exp.contributions["Performance & Load Testing"] || [] },
    { id: "Framework Development", title: "Framework Development", content: exp.contributions["Infrastructure & CI/CD"] || [] },
  ];

  return (
    <section id="experience" className="py-24 relative border-t border-white/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 text-center"
        >
          <h2 className="text-sm font-bold tracking-widest uppercase text-slate-500 mb-2">
            Experience
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineering Milestones.
          </h3>
        </motion.div>

        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="p-8 sm:p-10 rounded-3xl glass-premium border border-white/10 relative overflow-hidden group shadow-2xl bg-[#0a0a0c]"
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-all duration-500 group-hover:bg-white/[0.04]" />
          
          {/* Header: Logo & Company Info */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10">
            <div className="flex items-start space-x-5">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shrink-0 group-hover:bg-white/10 transition-colors">
                <Image src="/logo.png" alt="Company Logo" width={48} height={48} className="object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <Building2 className="w-8 h-8 text-slate-400 absolute -z-10" />
              </div>
              <div>
                <h4 className="text-2xl font-extrabold text-white tracking-tight mb-1">{exp.company}</h4>
                <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider space-x-3 mb-2">
                  <span className="text-emerald-400">{exp.industry}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span>{exp.duration}</span>
                </div>
                <div className="flex items-center text-sm font-medium text-slate-300">
                  <Briefcase className="w-4 h-4 mr-2 text-blue-400" />
                  <span>{exp.role}</span>
                </div>
                <div className="flex items-center text-sm font-medium text-slate-400 mt-1">
                  <MapPin className="w-4 h-4 mr-2 text-slate-500" />
                  <span>{exp.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="mt-8 flex flex-wrap gap-2 relative z-10">
            {badges.map(badge => (
              <span key={badge} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold tracking-wider text-slate-300 uppercase">
                {badge}
              </span>
            ))}
          </div>

          {/* Summary */}
          <p className="mt-6 text-sm text-slate-400 leading-relaxed font-medium max-w-2xl relative z-10">
            {summary}
          </p>

          {/* KPIs */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 relative z-10">
            {kpiData.map((kpi, index) => (
              <div key={kpi.label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center">
                <div className="text-2xl font-black text-white mb-1">
                  <CountUp end={kpi.value} suffix={kpi.suffix} decimals={kpi.decimals || 0} duration={2} enableScrollSpy scrollSpyOnce />
                </div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  {kpi.label}
                </div>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <div className="mt-10 text-center relative z-10">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="group relative inline-flex items-center justify-center px-8 py-3 bg-white text-black text-sm font-bold rounded-full overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-white/20"
            >
              View Complete Experience
              <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Complete Experience Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-3xl overflow-y-auto p-4 sm:p-8"
          >
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full max-w-6xl bg-[#050508] border border-white/10 rounded-3xl shadow-2xl relative min-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-20 px-8 py-6 bg-[#050508]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between rounded-t-3xl">
                <div>
                  <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                    Complete Experience
                  </h4>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {exp.company}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content - Two Columns */}
              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Left Side: Company Card */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 text-center">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-3 mb-6 relative">
                      <Image src="/logo.png" alt="Logo" fill className="object-contain p-3" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      <Building2 className="w-8 h-8 text-slate-400 absolute -z-10" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">{exp.company}</h4>
                    <p className="text-sm font-semibold text-blue-400 mb-6">{exp.role}</p>
                    
                    <div className="space-y-4 text-left text-sm border-t border-white/10 pt-6">
                      <div className="flex items-center text-slate-300">
                        <Calendar className="w-4 h-4 mr-3 text-slate-500" />
                        <span>{exp.duration}</span>
                      </div>
                      <div className="flex items-center text-slate-300">
                        <MapPin className="w-4 h-4 mr-3 text-slate-500" />
                        <span>{exp.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Tech Stack</h5>
                    <div className="flex flex-wrap gap-2">
                      {exp.technologies.map(tech => (
                        <span key={tech} className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-300">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Engineering Milestones Timeline */}
                <div className="lg:col-span-8">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Engineering Milestones</h4>
                  
                  <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                    {milestones.map((milestone, idx) => {
                      return (
                        <div key={milestone.id} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-blue-400 bg-[#0a0a0c] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
                            <div className="w-3 h-3 rounded-full bg-blue-400" />
                          </div>
                          
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.03] transition-all">
                            <h5 className="text-base font-bold tracking-tight text-white mb-4 border-b border-white/10 pb-3">{milestone.title}</h5>
                            
                            <ul className="space-y-3">
                              {milestone.content.map((item, i) => (
                                <li key={i} className="flex items-start text-xs text-slate-300 leading-relaxed">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400/80 mr-3 shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
