"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import resumeData from "@/data/resumeData.json";
import { ArrowRight, X, ChevronDown, Layers, Activity, Target, Network, CheckCircle2, Server, Database, LineChart, Code2, Briefcase, Zap, Star, LayoutGrid, Lightbulb } from "lucide-react";

type Project = typeof resumeData.projects[0];

const SvgArchitectureCircular = ({ nodes }: { nodes: string[] }) => {
  const [activeNode, setActiveNode] = useState<number | null>(null);
  
  // Dynamic color changing of the nodes/perimeter line every 2 seconds
  const [colorIndex, setColorIndex] = useState(0);
  const colors = ["#3b82f6", "#f97316", "#a855f7", "#10b981"];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % colors.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const currentColor = colors[colorIndex];
  const N = nodes.length;
  const radius = 185; // radius of the circle
  const centerX = 265; // center X of the container
  const centerY = 265; // center Y of the container

  return (
    <div className="w-full bg-[#0a0a0c]/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-3xl p-6 relative flex items-center justify-center min-h-[570px] my-4 overflow-hidden">
      {/* Glow gradient matching current color */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-1000 opacity-20"
        style={{
          background: `radial-gradient(circle at center, ${currentColor}11, transparent 70%)`
        }}
      />
      
      {/* Desktop view: Circle Layout */}
      <div className="hidden sm:flex relative w-[530px] h-[530px] items-center justify-center shrink-0">
        
        {/* Pulse center core */}
        <div className="absolute w-32 h-32 rounded-full bg-slate-100/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center p-3 z-10 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
          <motion.div 
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full"
            style={{ border: `1.5px solid ${currentColor}`, opacity: 0.3 }}
          />
          <Network className="w-6 h-6 mb-1 transition-colors duration-1000" style={{ color: currentColor }} />
          <span className="text-[9px] font-bold text-white tracking-widest uppercase">Transaction</span>
          <span className="text-[8px] text-slate-500 uppercase font-semibold">Engine</span>
        </div>

        {/* SVG Circle Connections */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
          {/* Static circle track */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="1.5"
          />
          {/* Radial connector lines from core to nodes */}
          {nodes.map((node, index) => {
            const angle = (index / N) * 2 * Math.PI;
            const x2 = centerX + radius * Math.cos(angle);
            const y2 = centerY + radius * Math.sin(angle);
            const isHovered = activeNode === index;
            return (
              <line
                key={`line-${node}`}
                x1={centerX}
                y1={centerY}
                x2={x2}
                y2={y2}
                stroke={isHovered ? currentColor : "rgba(255, 255, 255, 0.02)"}
                strokeWidth={isHovered ? "1.5" : "0.5"}
                strokeDasharray={isHovered ? "4 4" : "none"}
                className={`transition-all duration-300 ${isHovered ? "animated-connector-line" : ""}`}
              />
            );
          })}
          {/* Circular polygon loop connecting adjacent nodes */}
          {nodes.map((node, index) => {
            const angle1 = (index / N) * 2 * Math.PI;
            const angle2 = (((index + 1) % N) / N) * 2 * Math.PI;
            const x1 = centerX + radius * Math.cos(angle1);
            const y1 = centerY + radius * Math.sin(angle1);
            const x2 = centerX + radius * Math.cos(angle2);
            const y2 = centerY + radius * Math.sin(angle2);
            return (
              <line
                key={`edge-${node}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={currentColor}
                strokeWidth="1"
                className="opacity-20 dark:opacity-10 transition-all duration-1000"
              />
            );
          })}
          {/* Animated gradient tracing light */}
          <motion.circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke={currentColor}
            strokeWidth="2.5"
            strokeDasharray="80 300"
            className="transition-colors duration-1000"
            animate={{
              strokeDashoffset: [0, -942.5], // 2 * Math.PI * radius = 942.5
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </svg>

        {/* Circular Nodes */}
        {nodes.map((node, index) => {
          const angle = (index / N) * 2 * Math.PI; // Angle in radians
          const x = centerX + radius * Math.cos(angle) - 40; // subtract half width (80/2)
          const y = centerY + radius * Math.sin(angle) - 40; // subtract half height (80/2)
          const isHovered = activeNode === index;

          return (
            <motion.div
              key={node}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 120 }}
              whileHover={{ scale: 1.1 }}
              onHoverStart={() => setActiveNode(index)}
              onHoverEnd={() => setActiveNode(null)}
              className="absolute w-20 h-20 rounded-full border border-white/10 bg-[#111116]/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex items-center justify-center text-center p-2.5 cursor-pointer select-none group transition-all duration-300"
              style={{
                left: x,
                top: y,
                borderColor: isHovered ? currentColor : "rgba(255, 255, 255, 0.1)"
              }}
            >
              {isHovered && (
                <div 
                  className="absolute inset-0 rounded-full animate-ping opacity-25"
                  style={{ backgroundColor: currentColor }}
                />
              )}
              <span 
                className="relative z-10 text-[9px] font-bold tracking-tight text-white leading-snug transition-colors duration-300"
                style={{ color: isHovered ? currentColor : "#ffffff" }}
              >
                {node}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile view: Horizontal Scrollable List */}
      <div className="sm:hidden w-full flex items-center overflow-x-auto py-4 px-1 min-w-max space-x-0 relative z-10 custom-scrollbar">
        {nodes.map((node, index) => (
          <div key={node} className="flex items-center group">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-16 h-16 rounded-full border border-white/20 bg-[#111116] shadow-md text-[9px] font-bold tracking-wide text-white relative overflow-hidden flex-shrink-0 flex items-center justify-center text-center p-2 cursor-pointer transition-colors duration-1000"
              style={{
                borderColor: activeNode === index ? currentColor : "rgba(255, 255, 255, 0.2)"
              }}
              onHoverStart={() => setActiveNode(index)}
              onHoverEnd={() => setActiveNode(null)}
            >
              <span className="relative z-10 leading-tight">{node}</span>
            </motion.div>

            {index < nodes.length - 1 && (
              <div className="w-8 h-px bg-white/20 relative mx-1 flex-shrink-0 flex items-center justify-center">
                <motion.div
                  initial={{ left: 0, opacity: 0 }}
                  animate={{ left: "100%", opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: index * 0.15 }}
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-1 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.8)] transition-colors duration-1000"
                  style={{ backgroundColor: currentColor }}
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
              className="w-full max-w-[95vw] lg:max-w-7xl bg-background dark:bg-[#050508] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl relative h-[90vh] max-h-[90vh] flex flex-col"
            >
              
              {/* Modal Header */}
              <div className="sticky top-0 z-20 px-8 py-6 bg-background/90 dark:bg-[#050508]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 flex items-center justify-between rounded-t-3xl">
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
                  <SvgArchitectureCircular nodes={selectedProject.caseStudy.architecture.nodes} />
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
