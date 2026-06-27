"use client";

import { useState } from "react";
import { ArrowRight, X, Calendar, DollarSign, Award, Target, HelpCircle, CheckCircle } from "lucide-react";
import resumeData from "@/data/resumeData.json";

interface ProjectData {
  id: string;
  title: string;
  brief: string;
  description: string;
  problem: string;
  context: string;
  techStack: string[];
  metrics: Record<string, string>;
  results: string;
  challenges: string;
  solution: string;
  frameworkDesign: string;
  folderStructure: string;
}

export default function Projects() {
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  const projectsList = (resumeData.projects as unknown) as ProjectData[];

  const renderArchitectureDiagram = (projectId: string) => {
    switch (projectId) {
      case "payment-gateway-automation":
        return (
          <svg viewBox="0 0 600 160" className="w-full h-auto bg-slate-900/60 rounded-xl p-4 border border-white/5 font-sans text-[10px]">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(255, 255, 255, 0.2)" />
              </marker>
            </defs>
            {/* Steps */}
            <rect x="20" y="50" width="100" height="60" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
            <text x="70" y="80" fill="white" textAnchor="middle" fontWeight="bold">Gherkin BDD</text>
            <text x="70" y="95" fill="rgba(255,255,255,0.4)" textAnchor="middle">Cucumber Scenarios</text>

            <path d="M 120 80 L 160 80" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" markerEnd="url(#arrow)" />

            <rect x="170" y="50" width="110" height="60" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
            <text x="225" y="80" fill="white" textAnchor="middle" fontWeight="bold">TestNG runner</text>
            <text x="225" y="95" fill="rgba(255,255,255,0.4)" textAnchor="middle">Parallel Executes</text>

            <path d="M 280 80 L 320 80" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" markerEnd="url(#arrow)" />

            <rect x="330" y="50" width="110" height="60" rx="8" fill="rgba(249,115,22,0.05)" stroke="rgba(249,115,22,0.2)" />
            <text x="385" y="80" fill="white" textAnchor="middle" fontWeight="bold">DriverFactory</text>
            <text x="385" y="95" fill="rgba(249,115,22,0.6)" textAnchor="middle">Chrome instances</text>

            <path d="M 440 80 L 480 80" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" markerEnd="url(#arrow)" />

            <rect x="490" y="50" width="90" height="60" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
            <text x="535" y="80" fill="white" textAnchor="middle" fontWeight="bold">3DS Sandbox</text>
            <text x="535" y="95" fill="rgba(255,255,255,0.4)" textAnchor="middle">Mocks Redirect</text>
          </svg>
        );
      case "performance-testing-framework":
        return (
          <svg viewBox="0 0 600 160" className="w-full h-auto bg-slate-900/60 rounded-xl p-4 border border-white/5 font-sans text-[10px]">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(255, 255, 255, 0.2)" />
              </marker>
            </defs>
            <rect x="20" y="50" width="110" height="60" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
            <text x="75" y="80" fill="white" textAnchor="middle" fontWeight="bold">JMeter Master</text>
            <text x="75" y="95" fill="rgba(255,255,255,0.4)" textAnchor="middle">Test Plan Config</text>

            <path d="M 130 80 L 170 80" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" markerEnd="url(#arrow)" />

            <rect x="180" y="50" width="110" height="60" rx="8" fill="rgba(249,115,22,0.05)" stroke="rgba(249,115,22,0.2)" />
            <text x="235" y="80" fill="white" textAnchor="middle" fontWeight="bold">Docker Slaves</text>
            <text x="235" y="95" fill="rgba(249,115,22,0.6)" textAnchor="middle">Distributed Load</text>

            <path d="M 290 80 L 330 80" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" markerEnd="url(#arrow)" />

            <rect x="340" y="50" width="110" height="60" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
            <text x="395" y="80" fill="white" textAnchor="middle" fontWeight="bold">UPI gateway</text>
            <text x="395" y="95" fill="rgba(255,255,255,0.4)" textAnchor="middle">Target services</text>

            <path d="M 450 80 L 490 80" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" markerEnd="url(#arrow)" />

            <rect x="500" y="50" width="80" height="60" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
            <text x="540" y="80" fill="white" textAnchor="middle" fontWeight="bold">Grafana</text>
            <text x="540" y="95" fill="rgba(255,255,255,0.4)" textAnchor="middle">Telemetry</text>
          </svg>
        );
      case "api-automation-framework":
        return (
          <svg viewBox="0 0 600 160" className="w-full h-auto bg-slate-900/60 rounded-xl p-4 border border-white/5 font-sans text-[10px]">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(255, 255, 255, 0.2)" />
              </marker>
            </defs>
            <rect x="20" y="50" width="110" height="60" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
            <text x="75" y="80" fill="white" textAnchor="middle" fontWeight="bold">Payload Factory</text>
            <text x="75" y="95" fill="rgba(255,255,255,0.4)" textAnchor="middle">Jackson Jackson</text>

            <path d="M 130 80 L 170 80" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" markerEnd="url(#arrow)" />

            <rect x="180" y="50" width="110" height="60" rx="8" fill="rgba(249,115,22,0.05)" stroke="rgba(249,115,22,0.2)" />
            <text x="235" y="80" fill="white" textAnchor="middle" fontWeight="bold">HMAC Spec</text>
            <text x="235" y="95" fill="rgba(249,115,22,0.6)" textAnchor="middle">SHA-255 header</text>

            <path d="M 290 80 L 330 80" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" markerEnd="url(#arrow)" />

            <rect x="340" y="50" width="110" height="60" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
            <text x="395" y="80" fill="white" textAnchor="middle" fontWeight="bold">REST Assured</text>
            <text x="395" y="95" fill="rgba(255,255,255,0.4)" textAnchor="middle">Client execute</text>

            <path d="M 450 80 L 490 80" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" markerEnd="url(#arrow)" />

            <rect x="500" y="50" width="80" height="60" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
            <text x="540" y="85" fill="white" textAnchor="middle" fontWeight="bold">Assertions</text>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <section id="projects" className="py-24 relative overflow-hidden">
      
      {/* Dynamic background glow */}
      <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] rounded-full bg-orange-500/5 filter blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Title Header */}
        <div className="max-w-3xl mb-16 text-center sm:text-left space-y-3">
          <div className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">
            Product Studies
          </div>
          <h2 className="text-3xl sm:text-4.5xl font-extrabold tracking-tight text-white leading-tight">
            <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              Case Studies &amp; Projects
            </span>
          </h2>
          <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full w-24 my-2" />
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            A detailed review of framework architectures, database integrity reconciliation models, and concurrent performance load benchmarks.
          </p>
        </div>

        {/* Projects Cards Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projectsList.map((project) => (
            <div
              key={project.id}
              className="p-8 rounded-2xl glass-premium flex flex-col justify-between hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden"
            >
              {/* Subtle mesh background highlight on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="space-y-4 relative z-10">
                <h3 className="text-xl font-extrabold text-white group-hover:text-orange-450 transition-colors">
                  {project.title}
                </h3>
                
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  {project.brief}
                </p>

                {/* Tech tag lists */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-8 relative z-10">
                <button
                  onClick={() => setSelectedProject(project)}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-orange-500 group-hover:text-orange-400 transition-colors uppercase tracking-wider"
                >
                  <span>Explore Case Study</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* Full-Screen Reading Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#050508]/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[92vh] rounded-3xl glass-premium overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
            
            {/* Header Toolbar */}
            <div className="px-8 py-5 bg-[#0a0f20]/95 border-b border-white/5 flex items-center justify-between">
              <div>
                <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Case Overview</h4>
                <h3 className="text-base font-extrabold text-white mt-0.5">{selectedProject.title}</h3>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-2 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Editorial Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 text-xs sm:text-sm text-slate-400 font-sans">
              
              {/* Context Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-white/5 pb-8">
                <div className="space-y-3">
                  <div className="flex items-center space-x-1 text-red-400">
                    <Target className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Business Problem</span>
                  </div>
                  <p className="text-slate-350 leading-relaxed text-xs">
                    {selectedProject.problem}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-1 text-orange-400">
                    <Award className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Context</span>
                  </div>
                  <p className="text-slate-350 leading-relaxed text-xs">
                    {selectedProject.context}
                  </p>
                </div>
              </div>

              {/* Minimal SVG flowchart */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Framework Architecture Flow</span>
                <div className="p-4 rounded-2xl bg-black/30 border border-white/5">
                  {renderArchitectureDiagram(selectedProject.id)}
                </div>
              </div>

              {/* Folder directory structure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-b border-white/5 py-8">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Framework Package Outline</span>
                  <pre className="p-4 rounded-xl bg-slate-950/80 border border-white/5 text-orange-400 text-xs font-mono overflow-x-auto leading-relaxed">
                    {selectedProject.folderStructure}
                  </pre>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest flex items-center space-x-1">
                      <HelpCircle className="w-4 h-4" />
                      <span>Engineering Challenge</span>
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {selectedProject.challenges}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Technical Solution</span>
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed bg-[#0a0f20]/60 p-4 rounded-2xl border border-white/5">
                      {selectedProject.solution}
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Metrics & Impact */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Verification Metrics</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(selectedProject.metrics).map(([key, val]) => (
                    <div key={key} className="p-5 rounded-2xl border border-white/5 bg-[#0a0f20]/40 text-center">
                      <span className="text-[9px] text-slate-550 uppercase block mb-1 tracking-wider font-semibold">{key}</span>
                      <span className="text-xl font-extrabold text-white block">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-orange-950/10 p-5 rounded-2xl border border-orange-500/10 space-y-2">
                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest block">Release & Business Impact</span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {selectedProject.results}
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-[#0a0f20]/95 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-6 py-2.5 rounded-full bg-white text-black hover:bg-slate-100 font-bold text-xs tracking-wider uppercase transition-all"
              >
                Close Case Study
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
