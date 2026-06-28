"use client";

import { CheckCircle2, LayoutTemplate, Box, Server, CheckSquare, Target, Activity } from "lucide-react";
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
  const projectsList = (resumeData.projects as unknown) as ProjectData[];

  return (
    <section id="projects" className="py-24 relative overflow-hidden bg-black">
      
      {/* Background ambients */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/[0.03] filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/[0.03] filter blur-[150px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="max-w-3xl mb-20 text-center sm:text-left space-y-4">
          <div className="text-blue-500 text-[10px] font-bold tracking-widest uppercase">
            Enterprise Case Studies
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Engineering Quality at Scale
          </h2>
          <div className="w-16 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 my-4" />
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            A deep dive into the architecture, testing strategies, and business impact of the core platforms I have engineered automation for.
          </p>
        </div>

        {/* Stacked Case Studies */}
        <div className="space-y-24">
          {projectsList.map((project, index) => (
            <div key={project.id} className="relative group">
              
              {/* Connection line between projects */}
              {index !== projectsList.length - 1 && (
                <div className="absolute left-[27px] top-[100px] bottom-[-100px] w-[1px] bg-gradient-to-b from-white/10 to-transparent hidden md:block" />
              )}

              <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
                
                {/* Number Indicator (Left Column) */}
                <div className="hidden md:flex flex-col items-center shrink-0 w-14 mt-1">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-xl font-bold text-slate-500 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all duration-500 shadow-xl shadow-black/50">
                    0{index + 1}
                  </div>
                </div>

                {/* Content Block */}
                <div className="flex-1 space-y-8 p-1 rounded-3xl transition-all duration-500">
                  
                  {/* Title & Domain */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                        {project.category}
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold leading-relaxed">
                      {project.domain}
                    </p>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                    {project.overview}
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left side info */}
                    <div className="space-y-6">
                      {/* Business Problem */}
                      <div className="p-6 rounded-2xl bg-[#09090b] border border-white/[0.06] hover:border-white/[0.1] transition-colors h-full">
                        <div className="flex items-center gap-2 mb-4">
                          <Target className="w-4 h-4 text-red-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Business Challenge</h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {project.businessProblem}
                        </p>
                      </div>
                    </div>

                    {/* Right side info */}
                    <div className="space-y-6">
                      {/* Business Impact */}
                      <div className="p-6 rounded-2xl bg-blue-950/10 border border-blue-500/10 hover:border-blue-500/20 transition-colors h-full">
                        <div className="flex items-center gap-2 mb-4">
                          <Activity className="w-4 h-4 text-blue-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Business Impact</h4>
                        </div>
                        <ul className="space-y-3">
                          {project.businessImpact.map((impact, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                              <span>{impact}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Testing Strategy / Responsibilities */}
                  <div className="p-6 rounded-2xl bg-[#09090b] border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-6">
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Testing Strategy & Execution</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                      {project.responsibilities.map((task, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                          <span>{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tech Stack */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Technology Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/[0.02] border border-white/[0.05] text-slate-300 hover:bg-white/[0.05] hover:text-white transition-colors"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
