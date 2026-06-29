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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
  };

  const [logoError, setLogoError] = useState(false);
  const [modalLogoError, setModalLogoError] = useState(false);

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
    { 
      id: "UI Automation", 
      title: "UI Automation & E2E Testing", 
      content: [
        "Architected scalable Selenium WebDriver frameworks using Java, implementing Page Object Model (POM) and BDD approaches to maintain 1000+ UI test cases.",
        "Engineered robust handling for dynamic iframes in payment gateway pages, ensuring seamless cross-tab workflow testing for merchant onboarding.",
        "Integrated OCR and advanced assertions to validate dynamic financial reporting charts across Safari, Chrome, and Edge browsers.",
        "Achieved a 40% reduction in regression cycles by implementing parallel test execution workflows via Selenium Grid and Docker containers."
      ] 
    },
    { 
      id: "API Automation", 
      title: "API Automation & Backend Validation", 
      content: [
        "Designed comprehensive REST Assured test suites, validating over 750+ complex payment gateway and clearing APIs with deep JSON schema verification.",
        "Implemented custom POJO serialization and deserialization via Jackson to simulate thousands of dynamic merchant transaction payloads in real-time.",
        "Engineered automated database validation wrappers using JDBC to cross-verify MongoDB transaction logs against MySQL settlement ledgers, ensuring zero data loss.",
        "Automated OAuth2 token management and webhook verifications for asynchronous acquiring bank responses."
      ] 
    },
    { 
      id: "Performance Engineering", 
      title: "Performance & Load Testing", 
      content: [
        "Led performance engineering initiatives by designing massive distributed load testing architectures using Apache JMeter and Azure VMs.",
        "Successfully simulated 3x peak production load (5,000+ TPS) to identify and isolate critical memory leaks and database connection bottlenecks before Black Friday.",
        "Integrated Grafana and Telegraf for real-time performance observability during stress testing, mapping throughput degradation directly to JVM heap spikes.",
        "Established baseline performance SLAs for all Tier-1 payment authorization microservices."
      ] 
    },
    { 
      id: "Framework Development", 
      title: "Framework Development & CI/CD", 
      content: [
        "Built centralized, tightly integrated CI/CD pipelines in Azure DevOps, shifting quality engineering to the absolute left of the development lifecycle.",
        "Developed custom reporting dashboards using ExtentReports and Allure, providing executive stakeholders with real-time analytics on release stability (99.8%).",
        "Created scalable framework utilities for dynamic test data generation, reducing test flakiness by 85% across volatile environments.",
        "Mentored QA teams on shifting from manual exploratory testing to code-first automation strategies."
      ] 
    },
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
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Impact & Milestones.
          </h2>
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
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shrink-0 group-hover:bg-white/10 transition-colors relative">
                {!logoError ? (
                  <Image 
                    src="/logo.png" 
                    alt="Company Logo" 
                    width={48} 
                    height={48} 
                    className="object-contain" 
                    onError={() => setLogoError(true)} 
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div>
                <h4 className="text-2xl font-extrabold text-white tracking-tight mb-1 group-hover:translate-x-1 transition-transform duration-300">{exp.company}</h4>
                <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider space-x-3 mb-2">
                  <span className="text-blue-500 font-black tracking-widest">{exp.industry}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span>{exp.duration}</span>
                </div>
                <div className="flex items-center text-sm font-bold">
                  <Briefcase className="w-4 h-4 mr-2 text-blue-500" />
                  <span className="text-blue-500 font-extrabold tracking-wide">{exp.role}</span>
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
              className="w-full max-w-[95vw] lg:max-w-7xl bg-background dark:bg-[#050508] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl relative h-[85vh] max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-20 px-8 py-6 bg-background/90 dark:bg-[#050508]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 flex items-center justify-between rounded-t-3xl">
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

              {/* Modal Content - Horizontal Layout */}
              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                
                {/* Full-width Company Header Banner */}
                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-3 relative shrink-0">
                      {!modalLogoError ? (
                        <Image 
                          src="/logo.png" 
                          alt="Logo" 
                          fill 
                          className="object-contain p-3" 
                          onError={() => setModalLogoError(true)} 
                        />
                      ) : (
                        <Building2 className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-1.5">
                        <h4 className="text-2xl font-bold text-white leading-none">{exp.company}</h4>
                        <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          {exp.industry}
                        </span>
                      </div>
                      <p className="text-base font-semibold text-blue-400">{exp.role}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400">
                        <div className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-2 text-slate-500" />
                          <span>{exp.duration}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-2 text-slate-500" />
                          <span>{exp.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tech Stack Banner Section */}
                  <div className="md:max-w-md w-full">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Core Tech Stack</h5>
                    <div className="flex flex-wrap gap-2">
                      {exp.technologies.map(tech => (
                        <span key={tech} className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-300">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Engineering Milestones Horizontal Grid */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Impact & Milestones</h4>
                  
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                  >
                    {milestones.map((milestone) => (
                      <motion.div 
                        key={milestone.id} 
                        variants={itemVariants}
                        whileHover={{ y: -4, scale: 1.01, borderColor: "rgba(255,255,255,0.15)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.7)" }}
                        className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] transition-all flex flex-col justify-between cursor-default"
                      >
                        <div>
                          <h5 className="text-sm font-bold tracking-tight text-white mb-4 border-b border-white/10 pb-3 flex items-center min-h-[40px]">
                            <span className="w-2 h-2 rounded-full bg-blue-400 mr-2.5 shrink-0" />
                            {milestone.title}
                          </h5>
                          
                          <ul className="space-y-3">
                            {milestone.content.map((item, i) => (
                              <li key={i} className="flex items-start text-xs text-slate-300 leading-relaxed">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400/80 mr-2.5 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
