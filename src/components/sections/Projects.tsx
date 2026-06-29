"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import resumeData from "@/data/resumeData.json";
import { ArrowRight, X, ChevronDown, Layers, Activity, Target, Network, CheckCircle2, Server, Database, LineChart, Code2, Briefcase, Zap, Star, LayoutGrid, Lightbulb } from "lucide-react";

type Project = typeof resumeData.projects[0];

const SvgArchitectureHorizontal = ({ nodes }: { nodes: string[] }) => {
  return (
    <div className="w-full bg-[#0a0a0c] border border-white/10 rounded-2xl p-4 relative overflow-x-auto my-4 custom-scrollbar">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent pointer-events-none" />
      
      <div className="flex items-center min-w-max space-x-0 relative z-10 py-2 px-1">
        {nodes.map((node, index) => (
          <div key={node} className="flex items-center group">
            {/* Node as a Circle */}
            <motion.div 
              whileHover={{ scale: 1.1, borderColor: "rgba(96,165,250,0.6)", boxShadow: "0 0 15px rgba(59,130,246,0.2)" }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-white/20 bg-[#111116] shadow-[0_0_10px_rgba(255,255,255,0.02)] text-[9px] sm:text-xs font-bold tracking-wide text-white relative overflow-hidden flex-shrink-0 flex items-center justify-center text-center p-2 cursor-pointer"
            >
              <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 leading-tight">{node}</span>
            </motion.div>

            {/* Connector */}
            {index < nodes.length - 1 && (
              <div className="w-10 sm:w-12 h-px bg-white/20 relative mx-1.5 flex-shrink-0 flex items-center justify-center">
                <motion.div
                  initial={{ left: 0, opacity: 0 }}
                  animate={{ left: "100%", opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: index * 0.2 }}
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
  };

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
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.15, duration: 0.6, type: "spring", stiffness: 100 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="p-8 rounded-3xl glass-premium border border-white/10 relative flex flex-col group hover:border-blue-500/30 transition-all duration-500 shadow-xl hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]"
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
              className="w-full max-w-[95vw] lg:max-w-7xl bg-[#050508] border border-white/10 rounded-3xl shadow-2xl relative h-[90vh] max-h-[90vh] flex flex-col"
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

              {/* Modal Content - Horizontal Layout */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 pb-24 space-y-8">
                
                {/* Architecture Flow Displayed Directly */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center mb-4">
                    <Network className="w-4 h-4 mr-2 text-blue-400" /> 
                    Architecture Flow
                  </h4>
                  <SvgArchitectureHorizontal nodes={selectedProject.caseStudy.architecture.nodes} />
                </div>

                {/* 3-Column Content Grid with Staggered Entrance Animations */}
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  
                  {/* Column 1: Context & Challenge */}
                  <div className="space-y-6">
                    {/* Project Overview */}
                    <motion.div 
                      variants={itemVariants}
                      whileHover={{ y: -4, scale: 1.01, borderColor: "rgba(255,255,255,0.15)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.7)" }}
                      className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] transition-all flex flex-col space-y-4"
                    >
                      <div className="flex items-center space-x-3 border-b border-white/10 pb-3">
                        <div className="p-2 rounded-lg bg-white/5">
                          <Target className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-sm font-bold text-white uppercase tracking-widest">Project Overview</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {selectedProject.caseStudy.overview}
                      </p>
                    </motion.div>

                    {/* Business Challenge */}
                    <motion.div 
                      variants={itemVariants}
                      whileHover={{ y: -4, scale: 1.01, borderColor: "rgba(255,255,255,0.15)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.7)" }}
                      className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] transition-all flex flex-col space-y-4"
                    >
                      <div className="flex items-center space-x-3 border-b border-white/10 pb-3">
                        <div className="p-2 rounded-lg bg-white/5">
                          <Zap className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-sm font-bold text-white uppercase tracking-widest">Business Challenge</span>
                      </div>
                      <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                        <p>{selectedProject.caseStudy.businessProblem}</p>
                        {selectedProject.caseStudy.businessContext && (
                          <div className="pt-3 border-t border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Business Context</span>
                            <p>{selectedProject.caseStudy.businessContext}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* My Role */}
                    <motion.div 
                      variants={itemVariants}
                      whileHover={{ y: -4, scale: 1.01, borderColor: "rgba(255,255,255,0.15)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.7)" }}
                      className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] transition-all flex flex-col space-y-4"
                    >
                      <div className="flex items-center space-x-3 border-b border-white/10 pb-3">
                        <div className="p-2 rounded-lg bg-white/5">
                          <Briefcase className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-sm font-bold text-white uppercase tracking-widest">My Role</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {selectedProject.role}
                      </p>
                    </motion.div>
                  </div>

                  {/* Column 2: Strategy & Testing */}
                  <div className="space-y-6">
                    {/* Testing Strategy */}
                    <motion.div 
                      variants={itemVariants}
                      whileHover={{ y: -4, scale: 1.01, borderColor: "rgba(255,255,255,0.15)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.7)" }}
                      className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] transition-all flex flex-col space-y-4"
                    >
                      <div className="flex items-center space-x-3 border-b border-white/10 pb-3">
                        <div className="p-2 rounded-lg bg-white/5">
                          <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-sm font-bold text-white uppercase tracking-widest">Testing Strategy</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {selectedProject.caseStudy.testingStrategy}
                      </p>
                    </motion.div>

                    {/* Automation Workflow (Deep Dive) */}
                    <motion.div 
                      variants={itemVariants}
                      whileHover={{ y: -4, scale: 1.01, borderColor: "rgba(255,255,255,0.15)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.7)" }}
                      className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] transition-all flex flex-col space-y-4"
                    >
                      <div className="flex items-center space-x-3 border-b border-white/10 pb-3">
                        <div className="p-2 rounded-lg bg-white/5">
                          <Activity className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-sm font-bold text-white uppercase tracking-widest">Automation Workflow</span>
                      </div>
                      <div className="space-y-4">
                        {selectedProject.caseStudy.uiAutomation && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">UI Automation</span>
                            <p className="text-xs text-slate-300 leading-relaxed">{selectedProject.caseStudy.uiAutomation}</p>
                          </div>
                        )}
                        {selectedProject.caseStudy.apiAutomation && (
                          <div className="pt-3 border-t border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">API Automation</span>
                            <p className="text-xs text-slate-300 leading-relaxed">{selectedProject.caseStudy.apiAutomation}</p>
                          </div>
                        )}
                        {selectedProject.caseStudy.performanceTesting && (
                          <div className="pt-3 border-t border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Performance Testing</span>
                            <p className="text-xs text-slate-300 leading-relaxed">{selectedProject.caseStudy.performanceTesting}</p>
                          </div>
                        )}
                        {selectedProject.caseStudy.dbValidation && (
                          <div className="pt-3 border-t border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Database Validation</span>
                            <p className="text-xs text-slate-300 leading-relaxed">{selectedProject.caseStudy.dbValidation}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  {/* Column 3: Technologies & Results */}
                  <div className="space-y-6">
                    {/* Technology Stack */}
                    <motion.div 
                      variants={itemVariants}
                      whileHover={{ y: -4, scale: 1.01, borderColor: "rgba(255,255,255,0.15)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.7)" }}
                      className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] transition-all flex flex-col space-y-4"
                    >
                      <div className="flex items-center space-x-3 border-b border-white/10 pb-3">
                        <div className="p-2 rounded-lg bg-white/5">
                          <Code2 className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-sm font-bold text-white uppercase tracking-widest">Technology Stack</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {selectedProject.technologies.map(tech => (
                          <span key={tech} className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-300">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </motion.div>

                    {/* Business Impact */}
                    <motion.div 
                      variants={itemVariants}
                      whileHover={{ y: -4, scale: 1.01, borderColor: "rgba(255,255,255,0.15)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.7)" }}
                      className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] transition-all flex flex-col space-y-4"
                    >
                      <div className="flex items-center space-x-3 border-b border-white/10 pb-3">
                        <div className="p-2 rounded-lg bg-white/5">
                          <LineChart className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-sm font-bold text-white uppercase tracking-widest">Business Impact</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 pt-2">
                        {Object.entries(selectedProject.metrics).map(([key, value]) => (
                          <div key={key} className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{key}</span>
                            <span className="text-xs font-black text-emerald-400">{value as string}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Lessons Learned */}
                    <motion.div 
                      variants={itemVariants}
                      whileHover={{ y: -4, scale: 1.01, borderColor: "rgba(255,255,255,0.15)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.7)" }}
                      className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] transition-all flex flex-col space-y-4"
                    >
                      <div className="flex items-center space-x-3 border-b border-white/10 pb-3">
                        <div className="p-2 rounded-lg bg-white/5">
                          <Lightbulb className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-sm font-bold text-white uppercase tracking-widest">Lessons Learned</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        {selectedProject.caseStudy.lessonsLearned}
                      </p>
                    </motion.div>
                  </div>

                </motion.div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
