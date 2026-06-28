"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import resumeData from "@/data/resumeData.json";
import { ArrowRight, X, Layers, Activity, Target, Network, CheckCircle2, Server, Database, LineChart } from "lucide-react";

// Types
type Project = typeof resumeData.projects[0];

// SVG Architecture Component
const SvgArchitecture = ({ type, nodes }: { type: string, nodes: string[] }) => {
  // We simulate an animated glowing data packet flowing through nodes
  return (
    <div className="w-full bg-[#0a0a0c] border border-white/10 rounded-2xl p-8 relative overflow-hidden my-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent pointer-events-none" />
      
      <div className="flex flex-col items-center space-y-6 relative z-10">
        {nodes.map((node, index) => (
          <div key={node} className="flex flex-col items-center relative">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="px-6 py-3 rounded-lg border border-white/20 bg-white/[0.02] backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.05)] text-sm font-semibold tracking-wide text-white min-w-[200px] text-center relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10">{node}</span>
            </motion.div>

            {index < nodes.length - 1 && (
              <div className="h-10 w-px bg-white/10 relative my-1">
                {/* Glowing Data Packet Animation */}
                <motion.div
                  initial={{ top: 0, opacity: 0 }}
                  animate={{ top: "100%", opacity: [0, 1, 0] }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "linear",
                    delay: index * 0.2 // Stagger the flow
                  }}
                  className="absolute left-1/2 -translate-x-1/2 w-1.5 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Projects() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <section id="projects" className="py-24 relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center sm:text-left"
        >
          <h2 className="text-sm font-bold tracking-widest uppercase text-slate-500 mb-2">
            03 // Case Studies
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineering Platforms.
          </h3>
        </motion.div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {resumeData.projects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              whileHover={{ y: -5 }}
              className="p-8 rounded-3xl glass-premium border border-white/10 relative flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {project.category}
                  </span>
                  <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full flex items-center shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                    {project.businessImpactBadge}
                  </div>
                </div>

                <h4 className="text-2xl font-bold text-white mb-3 tracking-tight">
                  {project.title}
                </h4>
                
                <p className="text-sm text-slate-300 leading-relaxed font-medium mb-6">
                  {project.summary}
                </p>

                <div className="space-y-6">
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Role</h5>
                    <p className="text-xs font-semibold text-white">{project.role}</p>
                  </div>

                  <div>
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Testing Types</h5>
                    <div className="flex flex-wrap gap-2">
                      {project.testingTypes.map(type => (
                        <span key={type} className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-300">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Technology</h5>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map(tech => (
                        <span key={tech} className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-semibold text-blue-300">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-auto relative z-10">
                <button
                  onClick={() => setSelectedProject(project)}
                  className="inline-flex items-center space-x-2 text-xs font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-wider"
                >
                  <span>Read Engineering Case Study</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Full-Screen Case Study Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-3xl overflow-y-auto p-4 sm:p-8"
          >
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-5xl bg-[#050508] border border-white/10 rounded-3xl shadow-2xl relative min-h-[90vh] flex flex-col"
            >
              
              {/* Modal Header */}
              <div className="sticky top-0 z-20 px-8 py-6 bg-[#050508]/90 backdrop-blur-xl border-b border-white/10 flex items-start justify-between rounded-t-3xl">
                <div>
                  <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                    Engineering Case Study
                  </h4>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {selectedProject.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-8 space-y-12 pb-24">
                
                {/* Context Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center"><Target className="w-4 h-4 mr-2" /> Project Overview</h4>
                      <p className="text-sm text-slate-300 leading-relaxed font-medium">{selectedProject.caseStudy.overview}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center"><Layers className="w-4 h-4 mr-2" /> Business Context</h4>
                      <p className="text-sm text-slate-300 leading-relaxed">{selectedProject.caseStudy.businessContext}</p>
                    </div>
                  </div>

                  <div className="space-y-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Business Problem</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{selectedProject.caseStudy.businessProblem}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Testing Strategy</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{selectedProject.caseStudy.testingStrategy}</p>
                    </div>
                  </div>
                </div>

                {/* SVG Architecture Diagram */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center">
                    <Network className="w-4 h-4 mr-2 text-blue-400" /> 
                    Application Architecture Flow
                  </h4>
                  <SvgArchitecture 
                    type={selectedProject.caseStudy.architecture.type} 
                    nodes={selectedProject.caseStudy.architecture.nodes} 
                  />
                </div>

                {/* Responsibilities & Impact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                  <div className="space-y-6">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> 
                      Core Responsibilities
                    </h4>
                    <ul className="space-y-3">
                      {selectedProject.caseStudy.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start text-sm text-slate-300 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-3 shrink-0 mt-1.5" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-orange-400" /> 
                      Engineering Deep Dive
                    </h4>
                    <div className="space-y-4">
                      {selectedProject.caseStudy.uiAutomation && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">UI Automation</span>
                          <p className="text-xs text-slate-300">{selectedProject.caseStudy.uiAutomation}</p>
                        </div>
                      )}
                      {selectedProject.caseStudy.apiAutomation && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">API Automation</span>
                          <p className="text-xs text-slate-300">{selectedProject.caseStudy.apiAutomation}</p>
                        </div>
                      )}
                      {selectedProject.caseStudy.performanceTesting && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Performance Testing</span>
                          <p className="text-xs text-slate-300">{selectedProject.caseStudy.performanceTesting}</p>
                        </div>
                      )}
                      {selectedProject.caseStudy.dbValidation && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Database Validation</span>
                          <p className="text-xs text-slate-300">{selectedProject.caseStudy.dbValidation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics Bottom Bar */}
                <div className="pt-8 border-t border-white/5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(selectedProject.metrics).map(([key, value]) => (
                      <div key={key} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <div className="text-xl font-extrabold text-white mb-1">{value}</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{key}</div>
                      </div>
                    ))}
                    {selectedProject.caseStudy.testingMetrics.map((metric, i) => (
                      <div key={i} className="p-4 rounded-xl bg-blue-500/[0.05] border border-blue-500/10 text-center flex flex-col justify-center items-center">
                        <LineChart className="w-5 h-5 text-blue-400 mb-2" />
                        <div className="text-[10px] font-bold text-blue-300 leading-tight">{metric}</div>
                      </div>
                    ))}
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
