"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AIChatbot from "@/components/AIChatbot";
import { ArrowLeft, Printer, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";
import resumeData from "@/data/resumeData.json";

export default function ResumePage() {
  const [atsMode, setAtsMode] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className={`min-h-screen relative font-sans text-xs transition-colors duration-300 ${atsMode ? "bg-white text-slate-900" : "bg-[#020204] text-slate-100"}`}>
      {/* Navbar hide on print */}
      <div className="no-print">
        <Navbar />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-20 relative z-10 print:pt-0 print:pb-0">
        
        {/* Navigation Toolbar (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 no-print">
          <Link href="/" className="inline-flex items-center space-x-1.5 text-slate-500 hover:text-orange-500 transition-colors text-[10px] font-bold tracking-widest uppercase">
            <ArrowLeft className="w-4 h-4" />
            <span>Return Home</span>
          </Link>

          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            {/* ATS Mode Toggle */}
            <button
              onClick={() => setAtsMode(!atsMode)}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full border text-[10px] font-bold transition-all ${
                atsMode
                  ? "bg-slate-100 border-slate-350 text-slate-800"
                  : "bg-white/5 border-white/10 text-slate-450 hover:text-slate-200"
              }`}
            >
              <span>{atsMode ? "Visual Dark Mode" : "Light Print Mode"}</span>
              {atsMode ? <ToggleRight className="w-4 h-4 text-blue-500" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Print Trigger */}
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold transition-all text-[10px] tracking-wider uppercase"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print CV</span>
            </button>

            {/* Direct Download Trigger */}
            <a
              href="/Sai_Krishna_Bykani_Resume.pdf"
              download="Sai_Krishna_Bykani_Resume.pdf"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-all shadow-md text-[10px] tracking-wider uppercase"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download PDF</span>
            </a>
          </div>
        </div>

        {/* Resume Sheet */}
        <div
          className={`p-8 sm:p-12 rounded-3xl border transition-all duration-300 print-page print:border-none print:p-0 ${
            atsMode
              ? "bg-white border-slate-200 text-slate-900 shadow-md"
              : "bg-[#020204]/60 border-white/5 text-slate-300 shadow-xl"
          }`}
        >
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-6 mb-8 print-header print:border-slate-900">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
              <div>
                <h1 className={`text-3xl font-extrabold uppercase tracking-tight ${atsMode ? "text-slate-900" : "text-white"}`}>
                  {resumeData.personal.name}
                </h1>
                <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mt-1.5">
                  {resumeData.personal.title}
                </p>
              </div>
              <div className="space-y-1 text-[10px] sm:text-right text-slate-500 print:text-slate-700 font-sans">
                <p>Location: {resumeData.personal.location}</p>
                <p>Cell: {resumeData.personal.phone}</p>
                <p>Email: {resumeData.personal.email}</p>
                <p className="no-print">
                  LinkedIn: <a href={resumeData.personal.linkedin} target="_blank" rel="noreferrer" className="underline text-orange-500">saibykani</a>
                </p>
                <p className="no-print">
                  GitHub: <a href={resumeData.personal.github} target="_blank" rel="noreferrer" className="underline text-orange-500">saibykani</a>
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 mb-8">
            <h2 className={`text-[10px] font-bold tracking-widest uppercase pb-1.5 border-b border-slate-850 print-section-title print:border-slate-300 ${atsMode ? "text-slate-900" : "text-orange-500"}`}>
              Professional Summary
            </h2>
            <p className="text-xs leading-relaxed text-justify font-normal text-slate-400 print:text-slate-800">
              {resumeData.personal.summary}
            </p>
          </div>

          {/* Core Skills */}
          <div className="space-y-3 mb-8">
            <h2 className={`text-[10px] font-bold tracking-widest uppercase pb-1.5 border-b border-slate-850 print-section-title print:border-slate-300 ${atsMode ? "text-slate-900" : "text-orange-500"}`}>
              Technical Skills Matrix
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs font-normal">
              <div className="space-y-1.5 text-slate-400 print:text-slate-855">
                <p><span className="font-bold text-slate-350 print:text-slate-900">Programming:</span> {resumeData.skills.programming.join(", ")}</p>
                <p><span className="font-bold text-slate-350 print:text-slate-900">UI Automation:</span> {resumeData.skills.automation.join(", ")}</p>
                <p><span className="font-bold text-slate-350 print:text-slate-900">API Testing:</span> {resumeData.skills.api.join(", ")}</p>
              </div>
              <div className="space-y-1.5 text-slate-400 print:text-slate-855">
                <p><span className="font-bold text-slate-350 print:text-slate-900">Performance:</span> {resumeData.skills.performance.join(", ")}</p>
                <p><span className="font-bold text-slate-350 print:text-slate-900">CI/CD & Cloud:</span> {resumeData.skills.cicd.join(", ")}, {resumeData.skills.cloud.join(", ")}</p>
                <p><span className="font-bold text-slate-350 print:text-slate-900">Database & Tools:</span> {resumeData.skills.database.join(", ")}, {resumeData.skills.defect.join(", ")}</p>
              </div>
            </div>
          </div>

          {/* Experience */}
          <div className="space-y-6 mb-8">
            <h2 className={`text-[10px] font-bold tracking-widest uppercase pb-1.5 border-b border-slate-850 print-section-title print:border-slate-300 ${atsMode ? "text-slate-900" : "text-orange-500"}`}>
              Work History
            </h2>
            {resumeData.experience.map((exp) => (
              <div key={exp.company} className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 font-bold text-xs">
                  <h3 className={atsMode ? "text-slate-900" : "text-white"}>
                    {exp.role} — {exp.company}
                  </h3>
                  <span className="text-[10px] text-slate-550 font-normal">{exp.duration} | {exp.location}</span>
                </div>
                <ul className="space-y-2 list-disc pl-5 text-xs text-slate-400 print:text-slate-800 leading-relaxed font-normal">
                  {exp.bulletPoints.map((bullet, idx) => (
                    <li key={idx} className="print-bullet">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Key Projects */}
          <div className="space-y-4 mb-8">
            <h2 className={`text-[10px] font-bold tracking-widest uppercase pb-1.5 border-b border-slate-850 print-section-title print:border-slate-300 ${atsMode ? "text-slate-900" : "text-orange-500"}`}>
              Featured QA Projects
            </h2>
            <div className="space-y-4">
              {resumeData.projects.map((proj) => (
                <div key={proj.id} className="space-y-1 text-slate-400 print:text-slate-800 font-normal">
                  <div className="flex justify-between font-bold text-xs">
                    <h3 className={atsMode ? "text-slate-900" : "text-white"}>
                      {proj.title}
                    </h3>
                    <span className="text-[9px] text-slate-550 font-normal uppercase tracking-wider">
                      {proj.techStack.slice(0, 3).join(" | ")}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {proj.brief} {proj.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="space-y-3 mb-8">
            <h2 className={`text-[10px] font-bold tracking-widest uppercase pb-1.5 border-b border-slate-850 print-section-title print:border-slate-300 ${atsMode ? "text-slate-900" : "text-orange-500"}`}>
              Education
            </h2>
            {resumeData.education.map((edu) => (
              <div key={edu.school} className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 text-xs">
                <div>
                  <span className={`font-bold ${atsMode ? "text-slate-900" : "text-white"}`}>{edu.school}</span>
                  <span className="text-slate-500 text-[10px] pl-1.5">({edu.degree} in {edu.major})</span>
                </div>
                <span className="text-[10px] text-slate-550">{edu.duration} | {edu.location}</span>
              </div>
            ))}
          </div>

          {/* Certifications */}
          <div className="space-y-2">
            <h2 className={`text-[10px] font-bold tracking-widest uppercase pb-1.5 border-b border-slate-850 print-section-title print:border-slate-300 ${atsMode ? "text-slate-900" : "text-orange-500"}`}>
              Certifications
            </h2>
            <ul className="list-disc pl-5 text-xs text-slate-455 print:text-slate-850 leading-relaxed font-normal">
              {resumeData.certifications.map((c) => (
                <li key={c.name} className="print-bullet">
                  <span className={`font-bold ${atsMode ? "text-slate-900" : "text-slate-350"}`}>{c.name}</span> — {c.issuer} ({c.year})
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>

      {/* Footer hide on print */}
      <div className="no-print">
        <Footer />
        <AIChatbot />
      </div>
    </main>
  );
}
