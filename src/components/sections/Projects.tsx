"use client";

import { useState } from "react";
import { ArrowRight, X, Calendar, DollarSign, Award, Target, HelpCircle, CheckCircle, CheckCircle2, Server, LayoutTemplate, Activity, CheckSquare } from "lucide-react";
import resumeData from "@/data/resumeData.json";

interface ProjectData {
  id: string;
  title: string;
  category: string;
  domain: string;
  overview: string;
  businessProblem: string;
  responsibilities: string[];
  modules: string[];
  techStack: string[];
  businessImpact: string[];
}

export default function Projects() {
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  const projectsList = (resumeData.projects as unknown) as ProjectData[];

  return (
    <section id="projects" className="py-24 relative overflow-hidden bg-black">
      
      {/* Background ambients */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/[0.03] filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/[0.03] filter blur-[150px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Title Header */}
        <div className="max-w-3xl mb-16 text-center sm:text-left space-y-3">
          <h2 className="text-3xl sm:text-4.5xl font-extrabold tracking-tight text-white leading-tight">
            Projects
          </h2>
          <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full w-24 my-2" />
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            <strong className="text-white">PSP – Enterprise Payment Services Platform</strong>
            <br />
            Worked as a Software Development Engineer in Test (SDET) on a large-scale enterprise Payment Services Platform responsible for high-volume transactions.
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
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-wider inline-block">
                  {project.category}
                </span>
                <h3 className="text-xl font-extrabold text-white group-hover:text-orange-450 transition-colors">
                  {project.title}
                </h3>
                
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  {project.overview.substring(0, 120)}...
                </p>

                {/* Tech tag lists */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {project.techStack.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.techStack.length > 4 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-transparent text-slate-500">
                      +{project.techStack.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-8 relative z-10">
                <button
                  onClick={() => setSelectedProject(project)}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-orange-500 group-hover:text-orange-400 transition-colors uppercase tracking-wider"
                >
                  <span>Explore Project Insights</span>
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
                <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Project Overview</h4>
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
              
              <div className="space-y-2">
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  {selectedProject.overview}
                </p>
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest pt-2">{selectedProject.domain}</p>
              </div>

              {/* Context Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-b border-white/5 py-8">
                <div className="space-y-3">
                  <div className="flex items-center space-x-1 text-red-400">
                    <Target className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Business Challenge</span>
                  </div>
                  <p className="text-slate-350 leading-relaxed text-xs">
                    {selectedProject.businessProblem}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-1 text-orange-400">
                    <CheckSquare className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Testing Strategy</span>
                  </div>
                  <ul className="space-y-2 text-xs">
                    {selectedProject.responsibilities.map((task, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-350">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Tech Stack */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Technology Stack</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-white/[0.02] border border-white/[0.05] text-slate-300 hover:bg-white/[0.05] hover:text-white transition-colors"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Modules */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Key Modules Tested</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.modules.map((mod) => (
                      <span
                        key={mod}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-300"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-orange-950/10 p-5 rounded-2xl border border-orange-500/10 space-y-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-400" />
                  <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest block">Business Impact</span>
                </div>
                <ul className="space-y-3">
                  {selectedProject.businessImpact.map((impact, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50 mt-1.5 shrink-0" />
                      <span>{impact}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-[#0a0f20]/95 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-6 py-2.5 rounded-full bg-white text-black hover:bg-slate-100 font-bold text-xs tracking-wider uppercase transition-all"
              >
                Close Project Overview
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
