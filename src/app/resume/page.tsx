"use client";

import Link from "next/link";
import { ArrowLeft, Printer, Download } from "lucide-react";
import resumeData from "@/data/resumeData.json";

export default function ResumePage() {
  const handlePrint = () => {
    window.print();
  };

  const personal = resumeData.personal;
  const exp = resumeData.experience[0];
  const projects = resumeData.projects;

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans print:bg-white print:text-slate-900 print:py-0 print:px-0">
      
      {/* Top action header (hidden during printing) */}
      <div className="max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4 no-print backdrop-blur-md">
        <Link 
          href="/" 
          className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Portfolio
        </Link>
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-extrabold uppercase tracking-widest hover:bg-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Save to PDF</span>
          </button>
        </div>
      </div>

      {/* Resume Document A4 Container */}
      <div className="max-w-4xl mx-auto bg-[#09090b] border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl relative print:border-none print:shadow-none print:bg-white print:text-black print:p-0 print:my-0 print:rounded-none">
        
        {/* Document Header */}
        <div className="border-b border-white/10 pb-6 mb-6 print:border-slate-800 print:pb-4 print:mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight print:text-slate-900 print:text-2xl">
                {personal.name}
              </h1>
              <p className="text-sm font-bold text-accent-theme uppercase tracking-widest mt-1.5 print:text-slate-700 print:text-xs">
                {personal.title}
              </p>
            </div>
            <div className="text-xs text-slate-400 space-y-1 text-left sm:text-right print:text-slate-700 print:text-[10px]">
              <p>{personal.location}</p>
              <p>{personal.phone}</p>
              <p>
                <a href={`mailto:${personal.email}`} className="hover:underline">
                  {personal.email}
                </a>
              </p>
              <div className="flex flex-wrap gap-2 pt-1 sm:justify-end no-print">
                <a href={personal.linkedin} target="_blank" rel="noreferrer" className="text-accent-theme hover:underline">
                  LinkedIn
                </a>
                <span>•</span>
                <a href={personal.github} target="_blank" rel="noreferrer" className="text-accent-theme hover:underline">
                  GitHub
                </a>
              </div>
              <div className="hidden print:block space-y-0.5">
                <p>LinkedIn: linkedin.com/in/saibykani</p>
                <p>GitHub: github.com/saibykani</p>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Summary */}
        <div className="mb-8 print:mb-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5 print:text-slate-800 print:text-xs print:border-b print:border-slate-300 print:pb-1">
            Professional Summary
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed print:text-slate-850 print:text-[10px]">
            {personal.summary}
          </p>
        </div>

        {/* Technical Skills */}
        <div className="mb-8 print:mb-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 print:text-slate-800 print:text-xs print:border-b print:border-slate-300 print:pb-1">
            Core Competencies & Tooling
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-2">
            {resumeData.skills.categories.map((cat) => (
              <div key={cat.title} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 print:bg-transparent print:border-none print:p-0">
                <h3 className="text-xs font-extrabold text-white mb-2 uppercase tracking-wider print:text-slate-800 print:text-[9.5px]">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed print:text-slate-700 print:text-[9px]">
                  {cat.skills.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Work Experience */}
        <div className="mb-8 print:mb-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 print:text-slate-800 print:text-xs print:border-b print:border-slate-300 print:pb-1">
            Professional Experience
          </h2>
          <div className="space-y-6 print:space-y-4">
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 mb-2">
                <div>
                  <h3 className="text-base font-bold text-white print:text-slate-900 print:text-xs">
                    {exp.company}
                  </h3>
                  <p className="text-xs font-bold text-accent-theme uppercase tracking-wider print:text-slate-700 print:text-[9.5px]">
                    {exp.role}
                  </p>
                </div>
                <div className="text-xs text-slate-400 text-left sm:text-right print:text-slate-700 print:text-[9.5px]">
                  <p className="font-semibold">{exp.duration}</p>
                  <p className="text-[10px] print:text-[9px]">{exp.location}</p>
                </div>
              </div>
              
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 print:text-slate-600 print:text-[8px] print:mb-1.5">
                <span className="text-accent-theme">Domains:</span> {exp.domain}
              </p>

              <div className="space-y-3.5 print:space-y-2">
                {Object.entries(exp.contributions).map(([area, points]) => (
                  <div key={area} className="space-y-1">
                    <h4 className="text-xs font-extrabold text-white tracking-wide print:text-slate-800 print:text-[9px]">
                      {area}
                    </h4>
                    <ul className="list-disc list-inside space-y-1 pl-1">
                      {(points as string[]).map((pt, idx) => (
                        <li key={idx} className="text-xs text-slate-400 leading-relaxed print:text-slate-700 print:text-[9px] print:list-item print:ml-3">
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enterprise Projects */}
        <div className="mb-8 print:mb-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 print:text-slate-800 print:text-xs print:border-b print:border-slate-300 print:pb-1">
            Engineering Projects & Validations
          </h2>
          <div className="space-y-4 print:space-y-3">
            {projects.map((proj) => (
              <div key={proj.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 print:bg-transparent print:border-none print:p-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 mb-1.5">
                  <h3 className="text-sm font-bold text-white print:text-slate-900 print:text-[10px]">
                    {proj.title}
                  </h3>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider print:text-slate-600">
                    Stack: {proj.technologies.join(", ")}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed print:text-slate-700 print:text-[9px]">
                  {proj.caseStudy.overview}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
