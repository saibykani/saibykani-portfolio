"use client";

import { useState, useEffect } from "react";
import { ArrowRight, X, Layers, Target, Award, HelpCircle, CheckCircle, GitBranch, Cpu, Workflow, Shield, Zap, ExternalLink } from "lucide-react";
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

const projectIcons: Record<string, React.ReactNode> = {
  psp: <Shield className="w-5 h-5" />,
  rwa: <Layers className="w-5 h-5" />,
  ppms: <Workflow className="w-5 h-5" />,
  vcip: <Cpu className="w-5 h-5" />,
};

const projectAccents: Record<string, { border: string; glow: string; text: string; bg: string; dot: string; gradient: string; ring: string }> = {
  psp:  { border: "border-orange-500/20", glow: "from-orange-500/10 via-amber-500/5", text: "text-orange-400", bg: "bg-orange-500/10", dot: "bg-orange-400", gradient: "from-orange-500 to-amber-500", ring: "ring-orange-500/20" },
  rwa:  { border: "border-cyan-500/20",   glow: "from-cyan-500/10 via-teal-500/5",   text: "text-cyan-400",   bg: "bg-cyan-500/10",   dot: "bg-cyan-400",   gradient: "from-cyan-500 to-teal-500",   ring: "ring-cyan-500/20" },
  ppms: { border: "border-violet-500/20", glow: "from-violet-500/10 via-purple-500/5", text: "text-violet-400", bg: "bg-violet-500/10", dot: "bg-violet-400", gradient: "from-violet-500 to-purple-500", ring: "ring-violet-500/20" },
  vcip: { border: "border-emerald-500/20",glow: "from-emerald-500/10 via-green-500/5",text: "text-emerald-400",bg: "bg-emerald-500/10",dot: "bg-emerald-400",gradient: "from-emerald-500 to-green-500",ring: "ring-emerald-500/20" },
};

const defaultAccent = { border: "border-white/10", glow: "from-white/5 via-white/2", text: "text-slate-400", bg: "bg-white/5", dot: "bg-white", gradient: "from-white to-slate-400", ring: "ring-white/20" };

export default function Projects() {
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const projectsList = (resumeData.projects ?? []) as ProjectData[];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    const el = document.getElementById("projects");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedProject]);

  return (
    <section id="projects" className="py-32 relative overflow-hidden">

      {/* Ambient blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
      <div className="absolute top-[5%] left-[-10%] w-[600px] h-[600px] rounded-full bg-orange-500/[0.02] filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-8%] w-[500px] h-[500px] rounded-full bg-violet-500/[0.02] filter blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ── Section Header ── */}
        <div
          className={`max-w-3xl mb-20 space-y-5 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/[0.08] border border-orange-500/20">
              <Zap className="w-3 h-3 text-orange-400" />
              <span className="text-orange-400 text-[10px] font-bold tracking-[0.15em] uppercase">Engineering Portfolio</span>
            </div>
          </div>
          <h2 className="text-4xl sm:text-[3.25rem] font-black tracking-tight text-white leading-[1.08]">
            Project<br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              Overview
            </span>
          </h2>
          <p className="text-[13px] text-slate-500 max-w-md leading-relaxed font-medium">
            Enterprise-grade QA automation frameworks built across FinTech, Banking, Community, and NGO domains — delivering measurable impact at scale.
          </p>
        </div>

        {/* ── Projects Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {projectsList.map((project, idx) => {
            const accent = projectAccents[project.id] ?? defaultAccent;
            const icon = projectIcons[project.id] ?? <Layers className="w-5 h-5" />;
            const techList = project.techStack ?? project.technologies ?? [];

            return (
              <div
                key={project.id}
                className={`group relative rounded-[20px] transition-all duration-700 hover:-translate-y-1.5 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: isVisible ? `${idx * 150}ms` : "0ms" }}
              >
                {/* Animated gradient border */}
                <div className={`absolute -inset-[1px] rounded-[20px] bg-gradient-to-br ${accent.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                {/* Card body */}
                <div className={`relative rounded-[20px] bg-[#070b16]/95 border ${accent.border} group-hover:border-white/[0.12] backdrop-blur-sm transition-all duration-500 overflow-hidden`}>

                  {/* Floating shimmer line on hover */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="p-7 flex flex-col h-full relative z-10">

                    {/* ── Header: Icon + Title + Badge ── */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-3.5">
                        <div className={`p-2.5 rounded-2xl ${accent.bg} ${accent.text} ring-1 ${accent.ring} transition-transform duration-500 group-hover:scale-110`}>
                          {icon}
                        </div>
                        <div>
                          <h3 className="text-[16px] font-extrabold text-white leading-tight tracking-[-0.01em]">
                            {project.title}
                          </h3>
                          <span className="text-[10px] text-slate-600 font-semibold mt-1 block tracking-wide uppercase">{project.category}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-[9px] font-bold ${accent.bg} ${accent.text} flex items-center gap-1.5 shrink-0 ring-1 ${accent.ring}`}>
                        <span className={`w-[5px] h-[5px] rounded-full ${accent.dot} animate-pulse`} />
                        {project.businessImpactBadge}
                      </span>
                    </div>

                    {/* ── Role ── */}
                    <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-white/[0.04]">
                      <span className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.15em]">Role</span>
                      <div className="h-3 w-[1px] bg-white/[0.06]" />
                      <span className="text-[11px] text-slate-400 font-medium">{project.role}</span>
                    </div>

                    {/* ── Summary ── */}
                    <p className="text-[12px] text-slate-500 leading-[1.7] mb-6 font-medium flex-grow">
                      {project.summary}
                    </p>

                    {/* ── Architecture Flow ── */}
                    {project.caseStudy?.architecture?.nodes && (
                      <div className="mb-6">
                        <div className="flex items-center gap-1.5 mb-3">
                          <GitBranch className="w-3 h-3 text-slate-700" />
                          <span className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.15em]">Architecture Flow</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          {project.caseStudy.architecture.nodes.slice(0, 5).map((node, i, arr) => (
                            <div key={node} className="flex items-center gap-1">
                              <span className={`px-2 py-1 rounded-md text-[9px] font-semibold border whitespace-nowrap transition-colors ${i === 0 ? `${accent.border} ${accent.text} ${accent.bg}` : "border-white/[0.05] text-slate-500 bg-white/[0.02] group-hover:border-white/[0.08]"}`}>
                                {node}
                              </span>
                              {i < arr.length - 1 && (
                                <ArrowRight className="w-2.5 h-2.5 text-slate-800 shrink-0" />
                              )}
                            </div>
                          ))}
                          {project.caseStudy.architecture.nodes.length > 5 && (
                            <span className="text-[9px] text-slate-700 ml-1 font-medium">+{project.caseStudy.architecture.nodes.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Metrics ── */}
                    <div className={`grid gap-2 mb-6 ${Object.keys(project.metrics).length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                      {Object.entries(project.metrics).slice(0, 3).map(([key, val]) => (
                        <div key={key} className="text-center py-3 px-2 rounded-xl bg-white/[0.02] border border-white/[0.04] group-hover:border-white/[0.07] transition-colors">
                          <span className="text-[17px] font-black text-white block tracking-tight">{val}</span>
                          <span className="text-[7px] text-slate-600 uppercase tracking-[0.12em] font-bold mt-0.5 block">{key}</span>
                        </div>
                      ))}
                    </div>

                    {/* ── Tech pills ── */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {techList.map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-[3px] rounded-full text-[9px] font-semibold bg-white/[0.03] border border-white/[0.05] text-slate-600 hover:text-slate-300 hover:border-white/[0.12] hover:bg-white/[0.06] transition-all duration-300 cursor-default"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* ── CTA ── */}
                    <button
                      onClick={() => setSelectedProject(project)}
                      className={`w-full py-3.5 rounded-2xl border ${accent.border} bg-gradient-to-r from-white/[0.02] to-white/[0.01] text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] flex items-center justify-center gap-2.5 hover:from-white/[0.06] hover:to-white/[0.03] hover:text-white hover:border-white/[0.15] transition-all duration-500 group/btn`}
                    >
                      View Project Details
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════════════ Full-Screen Project Detail Modal ════════════════ */}
      {selectedProject && (() => {
        const accent = projectAccents[selectedProject.id] ?? defaultAccent;
        const cs = selectedProject.caseStudy;
        const techList = selectedProject.techStack ?? selectedProject.technologies ?? [];

        return (
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-2xl flex items-start sm:items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedProject(null); }}
          >
            <div className="w-full max-w-4xl max-h-[94vh] rounded-3xl bg-[#070b16] border border-white/[0.06] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl shadow-black/50">

              {/* ── Modal Header ── */}
              <div className="px-8 py-6 bg-gradient-to-r from-[#070b16] to-[#0a0f1e] border-b border-white/[0.04] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${accent.bg} ${accent.text} ring-1 ${accent.ring}`}>
                    {projectIcons[selectedProject.id] ?? <Layers className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.15em]">Project Details</span>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${accent.bg} ${accent.text} flex items-center gap-1`}>
                        <span className={`w-1 h-1 rounded-full ${accent.dot}`} />
                        {selectedProject.businessImpactBadge}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white tracking-[-0.02em]">{selectedProject.title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-600 hover:text-white hover:bg-white/[0.08] transition-all duration-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── Modal Content ── */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-8 space-y-8">

                  {/* Quick stats bar */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Domain</span>
                      <span className="text-[11px] text-slate-300 font-semibold">{selectedProject.category}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Role</span>
                      <span className="text-[11px] text-slate-300 font-semibold">{selectedProject.role}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Stack</span>
                      <span className="text-[11px] text-slate-300 font-semibold">{techList.length} Tools</span>
                    </div>
                  </div>

                  {/* Overview */}
                  {cs?.overview && (
                    <div className="space-y-3">
                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600 block">Overview</span>
                      <p className="text-slate-300 text-[13px] leading-[1.8] font-medium">{cs.overview}</p>
                    </div>
                  )}

                  {/* Problem / Context */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cs?.businessProblem && (
                      <div className="p-5 rounded-2xl bg-red-500/[0.04] border border-red-500/[0.1] space-y-3">
                        <div className="flex items-center gap-2 text-red-400">
                          <Target className="w-4 h-4" />
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em]">Business Problem</span>
                        </div>
                        <p className="text-slate-300 text-[12px] leading-[1.7]">{cs.businessProblem}</p>
                      </div>
                    )}
                    {cs?.businessContext && (
                      <div className={`p-5 rounded-2xl bg-white/[0.02] border ${accent.border} space-y-3`}>
                        <div className={`flex items-center gap-2 ${accent.text}`}>
                          <Award className="w-4 h-4" />
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em]">Context</span>
                        </div>
                        <p className="text-slate-300 text-[12px] leading-[1.7]">{cs.businessContext}</p>
                      </div>
                    )}
                  </div>

                  {/* Architecture Flow */}
                  {cs?.architecture?.nodes && cs.architecture.nodes.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-slate-600" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">Architecture Flow</span>
                      </div>
                      <div className="p-5 rounded-2xl bg-[#060a14] border border-white/[0.04] overflow-x-auto">
                        <div className="flex items-center gap-2 min-w-max">
                          {cs.architecture.nodes.map((node, i, arr) => (
                            <div key={node} className="flex items-center gap-2">
                              <div className={`px-3.5 py-2 rounded-xl text-[10px] font-semibold border transition-colors ${i === 0 ? `${accent.border} ${accent.text} ${accent.bg}` : "border-white/[0.06] text-slate-500 bg-white/[0.02]"}`}>
                                {node}
                              </div>
                              {i < arr.length - 1 && (
                                <div className="flex items-center">
                                  <div className="w-4 h-[1px] bg-white/[0.06]" />
                                  <ArrowRight className="w-3 h-3 text-slate-700" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Responsibilities */}
                  {cs?.responsibilities && cs.responsibilities.length > 0 && (
                    <div className="space-y-4">
                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600 block">Key Responsibilities</span>
                      <div className="space-y-2.5">
                        {cs.responsibilities.map((item, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/[0.03] hover:border-white/[0.06] transition-colors">
                            <CheckCircle className={`w-4 h-4 ${accent.text} mt-0.5 shrink-0`} />
                            <span className="text-[12px] text-slate-300 leading-[1.6]">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Modules */}
                  {cs?.modules && cs.modules.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600 block">Modules Tested</span>
                      <div className="flex flex-wrap gap-2">
                        {cs.modules.map((mod) => (
                          <span key={mod} className={`px-3.5 py-1.5 rounded-full text-[10px] font-semibold border ${accent.border} ${accent.text} bg-white/[0.02]`}>
                            {mod}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Framework & Strategy */}
                  {(cs?.framework || cs?.testingStrategy) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-white/[0.04] py-6">
                      {cs?.framework && (
                        <div className="space-y-2">
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600 block">Framework Design</span>
                          <div className="p-4 rounded-xl bg-[#060a14] border border-white/[0.04]">
                            <p className="text-slate-300 text-[12px] leading-[1.7]">{cs.framework}</p>
                          </div>
                        </div>
                      )}
                      {cs?.testingStrategy && (
                        <div className="space-y-2">
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600 block">Testing Strategy</span>
                          <div className="p-4 rounded-xl bg-[#060a14] border border-white/[0.04]">
                            <p className="text-slate-300 text-[12px] leading-[1.7]">{cs.testingStrategy}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Challenges */}
                  {cs?.challenges && cs.challenges.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-amber-500">
                        <HelpCircle className="w-4 h-4" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em]">Engineering Challenges</span>
                      </div>
                      <div className="space-y-2">
                        {cs.challenges.map((c, i) => (
                          <div key={i} className="pl-4 py-2.5 border-l-2 border-amber-500/20 bg-amber-500/[0.02] rounded-r-xl">
                            <p className="text-slate-300 text-[12px] leading-[1.6]">{c}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metrics */}
                  {selectedProject.metrics && Object.keys(selectedProject.metrics).length > 0 && (
                    <div className="space-y-4">
                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600 block">Verification Metrics</span>
                      <div className={`grid gap-3 ${Object.keys(selectedProject.metrics).length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                        {Object.entries(selectedProject.metrics).map(([key, val]) => (
                          <div key={key} className={`p-5 rounded-2xl border ${accent.border} bg-[#060a14] text-center`}>
                            <span className="text-2xl font-black text-white block tracking-tight">{val}</span>
                            <span className="text-[8px] text-slate-600 uppercase tracking-[0.12em] font-bold mt-1.5 block">{key}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tech Stack */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600 block">Technology Stack</span>
                    <div className="flex flex-wrap gap-2">
                      {techList.map((tech) => (
                        <span key={tech} className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold border ${accent.border} text-slate-400 bg-white/[0.02]`}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Impact */}
                  {cs?.impact && (
                    <div className={`p-6 rounded-2xl bg-gradient-to-br ${accent.glow} to-transparent border ${accent.border} space-y-2.5`}>
                      <div className="flex items-center gap-2">
                        <Zap className={`w-4 h-4 ${accent.text}`} />
                        <span className={`text-[9px] ${accent.text} font-bold uppercase tracking-[0.15em]`}>Business Impact</span>
                      </div>
                      <p className="text-slate-200 text-[13px] leading-[1.7] font-medium">{cs.impact}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Modal Footer ── */}
              <div className="px-8 py-5 bg-[#060a14] border-t border-white/[0.04] flex items-center justify-between shrink-0">
                <span className="text-[10px] text-slate-700 font-medium">{selectedProject.category} • {selectedProject.role}</span>
                <button
                  onClick={() => setSelectedProject(null)}
                  className={`px-7 py-2.5 rounded-full bg-gradient-to-r ${accent.gradient} text-black font-bold text-[11px] tracking-wider uppercase hover:opacity-90 transition-all duration-300 shadow-lg`}
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
