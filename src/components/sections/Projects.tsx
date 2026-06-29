"use client";

import { useState } from "react";
import { ArrowRight, X, Layers, Target, Award, HelpCircle, CheckCircle, GitBranch, Cpu, Workflow, Shield } from "lucide-react";
import resumeData from "@/data/resumeData.json";

interface CaseStudy {
  overview?: string;
  businessDomain?: string;
  businessProblem?: string;
  businessContext?: string;
  architecture?: { type?: string; nodes?: string[] };
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

/* Map each project to an icon for visual identity */
const projectIcons: Record<string, React.ReactNode> = {
  psp: <Shield className="w-5 h-5" />,
  rwa: <Layers className="w-5 h-5" />,
  ppms: <Workflow className="w-5 h-5" />,
  vcip: <Cpu className="w-5 h-5" />,
};

/* Map each project to an accent color class */
const projectAccents: Record<string, { border: string; glow: string; text: string; bg: string; dot: string }> = {
  psp:  { border: "border-orange-500/20", glow: "from-orange-500/8", text: "text-orange-400", bg: "bg-orange-500/10", dot: "bg-orange-400" },
  rwa:  { border: "border-cyan-500/20",   glow: "from-cyan-500/8",   text: "text-cyan-400",   bg: "bg-cyan-500/10",   dot: "bg-cyan-400" },
  ppms: { border: "border-violet-500/20", glow: "from-violet-500/8", text: "text-violet-400", bg: "bg-violet-500/10", dot: "bg-violet-400" },
  vcip: { border: "border-emerald-500/20",glow: "from-emerald-500/8",text: "text-emerald-400",bg: "bg-emerald-500/10",dot: "bg-emerald-400" },
};

const defaultAccent = { border: "border-white/10", glow: "from-white/5", text: "text-slate-400", bg: "bg-white/5", dot: "bg-white" };

export default function Projects() {
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const projectsList = (resumeData.projects ?? []) as ProjectData[];

  return (
    <section id="projects" className="py-28 relative overflow-hidden">
      
      {/* Ambient background effects */}
      <div className="absolute top-[10%] left-[-8%] w-[500px] h-[500px] rounded-full bg-orange-500/[0.03] filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[-5%] w-[400px] h-[400px] rounded-full bg-violet-500/[0.03] filter blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-20 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-gradient-to-r from-orange-500 to-transparent" />
            <span className="text-orange-500 text-[10px] font-bold tracking-[0.2em] uppercase">Engineering Portfolio</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
            Project Overview
          </h2>
          <p className="text-sm text-slate-500 max-w-lg leading-relaxed">
            Enterprise-grade QA automation frameworks built across FinTech, Banking, Community, and NGO domains.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {projectsList.map((project) => {
            const accent = projectAccents[project.id] ?? defaultAccent;
            const icon = projectIcons[project.id] ?? <Layers className="w-5 h-5" />;
            const techList = project.techStack ?? project.technologies ?? [];

            return (
              <div
                key={project.id}
                className={`group relative rounded-2xl bg-[#080c18] border ${accent.border} hover:border-white/20 transition-all duration-500 hover:-translate-y-1 overflow-hidden`}
              >
                {/* Hover gradient glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${accent.glow} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

                <div className="relative z-10 p-7 flex flex-col h-full">

                  {/* Top row: Icon + Title + Badge */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl ${accent.bg} ${accent.text} shrink-0`}>
                        {icon}
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-white leading-snug group-hover:text-white/90 transition-colors">
                          {project.title}
                        </h3>
                        <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">{project.category}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${accent.bg} ${accent.text} flex items-center gap-1 shrink-0`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${accent.dot}`} />
                      {project.businessImpactBadge}
                    </span>
                  </div>

                  {/* Role */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Role</span>
                    <span className="text-[11px] text-slate-400 font-medium">{project.role}</span>
                  </div>

                  {/* Summary */}
                  <p className="text-[12px] text-slate-500 leading-relaxed mb-5 flex-grow">
                    {project.summary}
                  </p>

                  {/* Architecture Flow — horizontal node chain */}
                  {project.caseStudy?.architecture?.nodes && (
                    <div className="mb-5">
                      <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest block mb-2.5">Architecture Flow</span>
                      <div className="flex flex-wrap items-center gap-1">
                        {project.caseStudy.architecture.nodes.slice(0, 6).map((node, i, arr) => (
                          <div key={node} className="flex items-center gap-1">
                            <span className="px-2 py-1 rounded-md text-[9px] font-semibold bg-white/[0.03] border border-white/[0.06] text-slate-400 whitespace-nowrap">
                              {node}
                            </span>
                            {i < arr.length - 1 && (
                              <ArrowRight className="w-2.5 h-2.5 text-slate-700 shrink-0" />
                            )}
                          </div>
                        ))}
                        {project.caseStudy.architecture.nodes.length > 6 && (
                          <span className="text-[9px] text-slate-600 ml-1">+{project.caseStudy.architecture.nodes.length - 6} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {Object.entries(project.metrics).slice(0, 3).map(([key, val]) => (
                      <div key={key} className="text-center p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-[15px] font-extrabold text-white block">{val}</span>
                        <span className="text-[8px] text-slate-600 uppercase tracking-wider font-semibold">{key}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tech pills */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {techList.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-white hover:bg-white/[0.08] transition-colors"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => setSelectedProject(project)}
                    className={`w-full py-3 rounded-xl border ${accent.border} bg-white/[0.02] text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/[0.06] hover:text-white transition-all group/btn`}
                  >
                    View Project Details
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ──────────── Full-Screen Project Detail Modal ──────────── */}
      {selectedProject && (() => {
        const accent = projectAccents[selectedProject.id] ?? defaultAccent;
        const cs = selectedProject.caseStudy;
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-[#030508]/95 backdrop-blur-2xl flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[92vh] rounded-3xl bg-[#080c18] border border-white/[0.06] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
              
              {/* Header */}
              <div className="px-8 py-6 bg-[#060a14] border-b border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${accent.bg} ${accent.text}`}>
                    {projectIcons[selectedProject.id] ?? <Layers className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Project Details</h4>
                    <h3 className="text-lg font-extrabold text-white mt-0.5">{selectedProject.title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-10 text-slate-400">
                
                {/* Overview */}
                {cs?.overview && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 block">Overview</span>
                    <p className="text-slate-300 text-[13px] leading-relaxed">{cs.overview}</p>
                  </div>
                )}

                {/* Problem / Context row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-white/[0.04] pb-8">
                  {cs?.businessProblem && (
                    <div className="space-y-3 p-5 rounded-2xl bg-red-500/[0.03] border border-red-500/[0.08]">
                      <div className="flex items-center gap-1.5 text-red-400">
                        <Target className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Business Problem</span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">{cs.businessProblem}</p>
                    </div>
                  )}
                  {cs?.businessContext && (
                    <div className={`space-y-3 p-5 rounded-2xl ${accent.bg.replace('/10', '/[0.03]')} border ${accent.border}`}>
                      <div className={`flex items-center gap-1.5 ${accent.text}`}>
                        <Award className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Context</span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">{cs.businessContext}</p>
                    </div>
                  )}
                </div>

                {/* Architecture Flow */}
                {cs?.architecture?.nodes && cs.architecture.nodes.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4 text-slate-600" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Architecture Flow</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-[#060a14] border border-white/[0.04] overflow-x-auto">
                      <div className="flex items-center gap-2 min-w-max">
                        {cs.architecture.nodes.map((node, i, arr) => (
                          <div key={node} className="flex items-center gap-2">
                            <div className={`px-3 py-2 rounded-lg text-[10px] font-semibold border ${i === 0 ? `${accent.border} ${accent.text} ${accent.bg}` : 'border-white/[0.06] text-slate-400 bg-white/[0.02]'}`}>
                              {node}
                            </div>
                            {i < arr.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-slate-700 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Responsibilities */}
                {cs?.responsibilities && cs.responsibilities.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 block">Key Responsibilities</span>
                    <ul className="space-y-2">
                      {cs.responsibilities.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                          <CheckCircle className={`w-3.5 h-3.5 ${accent.text} mt-0.5 shrink-0`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Modules */}
                {cs?.modules && cs.modules.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 block">Modules Tested</span>
                    <div className="flex flex-wrap gap-2">
                      {cs.modules.map((mod) => (
                        <span key={mod} className={`px-3 py-1 rounded-full text-[10px] font-semibold border ${accent.border} ${accent.text} bg-white/[0.02]`}>
                          {mod}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Framework & Strategy */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-b border-white/[0.04] py-8">
                  {cs?.framework && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 block">Framework Design</span>
                      <p className="text-slate-300 text-xs leading-relaxed p-4 rounded-xl bg-[#060a14] border border-white/[0.04]">
                        {cs.framework}
                      </p>
                    </div>
                  )}
                  {cs?.testingStrategy && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 block">Testing Strategy</span>
                      <p className="text-slate-300 text-xs leading-relaxed p-4 rounded-xl bg-[#060a14] border border-white/[0.04]">
                        {cs.testingStrategy}
                      </p>
                    </div>
                  )}
                </div>

                {/* Challenges */}
                {cs?.challenges && cs.challenges.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <HelpCircle className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Engineering Challenges</span>
                    </div>
                    <ul className="space-y-1.5">
                      {cs.challenges.map((c, i) => (
                        <li key={i} className="text-slate-300 text-xs leading-relaxed pl-4 border-l-2 border-amber-500/20 py-1">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Metrics */}
                {selectedProject.metrics && Object.keys(selectedProject.metrics).length > 0 && (
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 block">Verification Metrics</span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(selectedProject.metrics).map(([key, val]) => (
                        <div key={key} className={`p-4 rounded-xl border ${accent.border} bg-[#060a14] text-center`}>
                          <span className="text-xl font-extrabold text-white block">{val}</span>
                          <span className="text-[9px] text-slate-600 uppercase tracking-wider font-semibold mt-1 block">{key}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Impact */}
                {cs?.impact && (
                  <div className={`p-5 rounded-2xl border ${accent.border} ${accent.bg.replace('/10', '/[0.05]')} space-y-2`}>
                    <span className={`text-[10px] ${accent.text} font-bold uppercase tracking-widest block`}>Business Impact</span>
                    <p className="text-slate-300 text-xs leading-relaxed">{cs.impact}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-5 bg-[#060a14] border-t border-white/[0.04] flex justify-end">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-6 py-2.5 rounded-full bg-white text-black hover:bg-slate-200 font-bold text-xs tracking-wider uppercase transition-all"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </section>
  );
}
