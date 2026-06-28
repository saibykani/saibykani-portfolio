"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import resumeData from "@/data/resumeData.json";
import { ArrowRight, X, ChevronDown, Layers, Activity, Target, Network, CheckCircle2, Server, Database, LineChart, Code2, Briefcase, Zap, Star, LayoutGrid, Lightbulb } from "lucide-react";

type Project = typeof resumeData.projects[0];

const SvgArchitectureHorizontal = ({ nodes }: { nodes: string[] }) => {
  return (
    <div className="w-full bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 relative overflow-x-auto my-8 custom-scrollbar">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent pointer-events-none" />
      
      <div className="flex items-center min-w-max space-x-0 relative z-10 py-4 px-2">
        {nodes.map((node, index) => (
          <div key={node} className="flex items-center group">
            {/* Node as a Circle */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-white/20 bg-[#111116] shadow-[0_0_15px_rgba(255,255,255,0.05)] text-[10px] sm:text-xs font-bold tracking-wide text-white relative overflow-hidden flex-shrink-0 flex items-center justify-center text-center p-2"
            >
              <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 leading-tight">{node}</span>
            </motion.div>

            {/* Connector */}
            {index < nodes.length - 1 && (
              <div className="w-12 sm:w-16 h-px bg-white/20 relative mx-2 flex-shrink-0 flex items-center justify-center">
                <motion.div
                  initial={{ left: 0, opacity: 0 }}
                  animate={{ left: "100%", opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: index * 0.2 }}
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Accordion = ({ title, icon: Icon, children, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden mb-4 transition-colors hover:border-white/20">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-white/5">
            <Icon className="w-4 h-4 text-slate-300" />
          </div>
          <span className="text-sm font-bold text-white uppercase tracking-widest">{title}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-5 pt-0 text-sm text-slate-300 leading-relaxed border-t border-white/5 mt-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 text-center sm:text-left"
        >
          <h2 className="text-sm font-bold tracking-widest uppercase text-slate-500 mb-2">
            Projects
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
              transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="p-8 rounded-3xl glass-premium border border-white/10 relative flex flex-col group hover:border-white/20 transition-all duration-500"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <Server className="w-5 h-5 text-slate-300" />
                  </div>
                  <h4 className="text-xl font-bold text-white tracking-tight">
                    {project.title}
                  </h4>
                </div>
              </div>

              {/* Metric Cards Overview */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Domain</div>
                  <div className="text-xs font-semibold text-white">{project.category}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Impact</div>
                  <div className="text-xs font-semibold text-emerald-400 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                    {project.businessImpactBadge}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Role</div>
                  <div className="text-xs font-semibold text-white">{project.role}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tech Stack</div>
                  <div className="text-xs font-semibold text-white">{project.technologies.length} Core Tools</div>
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed font-medium mb-8 line-clamp-2">
                {project.summary}
              </p>

              <div className="mt-auto">
                <button
                  onClick={() => setSelectedProject(project)}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-white uppercase tracking-widest hover:bg-white/10 hover:text-blue-400 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Read Engineering Case Study</span>
                  <ArrowRight className="w-4 h-4" />
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
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-3xl overflow-y-auto p-4 sm:p-8"
          >
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full max-w-4xl bg-[#050508] border border-white/10 rounded-3xl shadow-2xl relative min-h-[90vh] flex flex-col"
            >
              
              {/* Modal Header */}
              <div className="sticky top-0 z-20 px-8 py-6 bg-[#050508]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between rounded-t-3xl">
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

              {/* Modal Content - Accordions & Flow */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 pb-24">
                
                {/* Architecture Flow Displayed Directly */}
                <div className="mb-10">
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center mb-4">
                    <Network className="w-4 h-4 mr-2 text-blue-400" /> 
                    Architecture Flow
                  </h4>
                  <SvgArchitectureHorizontal nodes={selectedProject.caseStudy.architecture.nodes} />
                </div>

                <Accordion title="Project Overview" icon={Target} defaultOpen={true}>
                  {selectedProject.caseStudy.overview}
                </Accordion>

                <Accordion title="Business Problem" icon={Zap}>
                  {selectedProject.caseStudy.businessProblem}
                </Accordion>

                <Accordion title="Business Context" icon={Layers}>
                  {selectedProject.caseStudy.businessContext}
                </Accordion>

                <Accordion title="My Role" icon={Briefcase}>
                  {selectedProject.role}
                </Accordion>

                <Accordion title="Testing Strategy" icon={CheckCircle2}>
                  {selectedProject.caseStudy.testingStrategy}
                </Accordion>

                <Accordion title="Technology Stack" icon={Code2}>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.technologies.map(tech => (
                      <span key={tech} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-300">
                        {tech}
                      </span>
                    ))}
                  </div>
                </Accordion>

                <Accordion title="Automation Workflow (Deep Dive)" icon={Activity}>
                  <div className="space-y-6">
                    {selectedProject.caseStudy.uiAutomation && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">UI Automation</span>
                        <p className="text-sm text-slate-300">{selectedProject.caseStudy.uiAutomation}</p>
                      </div>
                    )}
                    {selectedProject.caseStudy.apiAutomation && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">API Automation</span>
                        <p className="text-sm text-slate-300">{selectedProject.caseStudy.apiAutomation}</p>
                      </div>
                    )}
                    {selectedProject.caseStudy.performanceTesting && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Performance Testing</span>
                        <p className="text-sm text-slate-300">{selectedProject.caseStudy.performanceTesting}</p>
                      </div>
                    )}
                    {selectedProject.caseStudy.dbValidation && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Database Validation</span>
                        <p className="text-sm text-slate-300">{selectedProject.caseStudy.dbValidation}</p>
                      </div>
                    )}
                  </div>
                </Accordion>

                <Accordion title="Business Impact" icon={LineChart}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(selectedProject.metrics).map(([key, value]) => (
                      <div key={key} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <div className="text-xl font-extrabold text-emerald-400 mb-1">{value}</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{key}</div>
                      </div>
                    ))}
                  </div>
                </Accordion>

                <Accordion title="Lessons Learned" icon={Lightbulb}>
                  Focusing on creating loosely coupled framework components allowed us to scale test automation alongside the rapid feature development of the payment gateway.
                </Accordion>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
