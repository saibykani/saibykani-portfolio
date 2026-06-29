"use client";

import { useState } from "react";
import { ArrowRight, X, FileText, Target, Award, HelpCircle, CheckCircle } from "lucide-react";
import resumeData from "@/data/resumeData.json";

interface CaseStudy {
  overview?: string;
  businessDomain?: string;
  businessProblem?: string;
  businessContext?: string;
  responsibilities?: string[];
  modules?: string[];
  testingStrategy?: string;
  framework?: string;
  uiAutomation?: string;
  apiAutomation?: string;
  dbValidation?: string;
  performanceTesting?: string;
  cicd?: string;
  challenges?: string[];
  impact?: string;
  achievements?: string[];
  testingMetrics?: string[];
  lessonsLearned?: string;
}

interface ProjectData {
  id: string;
  title: string;
  category: string;
  summary: string;
  role: string;
  testingTypes?: string[];
  technologies: string[];
  techStack?: string[];
  businessImpactBadge: string;
  metrics: Record<string, string>;
  caseStudy: CaseStudy;
}

export default function Projects() {
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  const projectsList = (resumeData.projects ?? []) as ProjectData[];

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
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              Case Studies &amp; Projects
            </span>
          </h2>
          <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full w-24 my-2" />
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            A detailed review of framework architectures, database integrity reconciliation models, and concurrent performance load benchmarks.
          </p>
        </div>

        {/* Projects Cards Grid — matches the image layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projectsList.map((project) => (
            <div
              key={project.id}
              className="p-6 rounded-2xl bg-[#0a0f1a]/80 border border-white/[0.06] flex flex-col justify-between hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="space-y-5 relative z-10">

                {/* Title row */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] mt-0.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white leading-snug group-hover:text-orange-400 transition-colors">
                    {project.title}
                  </h3>
                </div>

                {/* 2x2 badge grid: DOMAIN, IMPACT, ROLE, TECH STACK */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Domain</span>
                    <span className="text-[11px] text-white font-semibold leading-tight block">{project.category}</span>
                  </div>
                  <div className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Impact</span>
                    <span className="text-[11px] text-emerald-400 font-semibold leading-tight block flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      {project.businessImpactBadge}
                    </span>
                  </div>
                  <div className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Role</span>
                    <span className="text-[11px] text-white font-semibold leading-tight block">{project.role}</span>
                  </div>
                  <div className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Tech Stack</span>
                    <span className="text-[11px] text-white font-semibold leading-tight block">{project.technologies.length} Core Tools</span>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-400 leading-relaxed">
                  {project.summary}
                </p>

                {/* Tech tags */}
                <div className="flex flex-wrap gap-1.5">
                  {(project.techStack ?? project.technologies ?? []).map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-6 relative z-10">
                <button
                  onClick={() => setSelectedProject(project)}
                  className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/[0.08] transition-all group/btn"
                >
                  Read Engineering Case Study
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Full-Screen Case Study Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#050508]/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[92vh] rounded-3xl bg-[#0a0f1a]/95 border border-white/[0.06] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
            
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
              
              {/* Overview */}
              {selectedProject.caseStudy?.overview && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Overview</span>
                  <p className="text-slate-300 text-xs leading-relaxed">{selectedProject.caseStudy.overview}</p>
                </div>
              )}

              {/* Context Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-white/5 pb-8">
                {selectedProject.caseStudy?.businessProblem && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-1 text-red-400">
                      <Target className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Business Problem</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-xs">
                      {selectedProject.caseStudy.businessProblem}
                    </p>
                  </div>
                )}
                {selectedProject.caseStudy?.businessContext && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-1 text-orange-400">
                      <Award className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Context</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-xs">
                      {selectedProject.caseStudy.businessContext}
                    </p>
                  </div>
                )}
              </div>

              {/* Responsibilities */}
              {selectedProject.caseStudy?.responsibilities && selectedProject.caseStudy.responsibilities.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Key Responsibilities</span>
                  <ul className="space-y-1.5">
                    {selectedProject.caseStudy.responsibilities.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Modules */}
              {selectedProject.caseStudy?.modules && selectedProject.caseStudy.modules.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Modules Tested</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.caseStudy.modules.map((mod) => (
                      <span key={mod} className="px-3 py-1 rounded-full text-[10px] font-semibold bg-white/[0.04] border border-white/[0.08] text-slate-300">
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Framework & Strategy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-b border-white/5 py-8">
                {selectedProject.caseStudy?.framework && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Framework Design</span>
                    <p className="text-slate-300 text-xs leading-relaxed bg-[#0a0f20]/60 p-4 rounded-2xl border border-white/5">
                      {selectedProject.caseStudy.framework}
                    </p>
                  </div>
                )}
                {selectedProject.caseStudy?.testingStrategy && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Testing Strategy</span>
                    <p className="text-slate-300 text-xs leading-relaxed bg-[#0a0f20]/60 p-4 rounded-2xl border border-white/5">
                      {selectedProject.caseStudy.testingStrategy}
                    </p>
                  </div>
                )}
              </div>

              {/* Challenges */}
              {selectedProject.caseStudy?.challenges && selectedProject.caseStudy.challenges.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest flex items-center space-x-1">
                    <HelpCircle className="w-4 h-4" />
                    <span>Engineering Challenges</span>
                  </span>
                  <ul className="space-y-1.5">
                    {selectedProject.caseStudy.challenges.map((c, i) => (
                      <li key={i} className="text-slate-300 text-xs leading-relaxed">• {c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Metrics */}
              {selectedProject.metrics && Object.keys(selectedProject.metrics).length > 0 && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Verification Metrics</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(selectedProject.metrics).map(([key, val]) => (
                      <div key={key} className="p-5 rounded-2xl border border-white/5 bg-[#0a0f20]/40 text-center">
                        <span className="text-[9px] text-slate-500 uppercase block mb-1 tracking-wider font-semibold">{key}</span>
                        <span className="text-xl font-extrabold text-white block">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Impact */}
              {selectedProject.caseStudy?.impact && (
                <div className="bg-orange-950/10 p-5 rounded-2xl border border-orange-500/10 space-y-2">
                  <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest block">Release & Business Impact</span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {selectedProject.caseStudy.impact}
                  </p>
                </div>
              )}

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
