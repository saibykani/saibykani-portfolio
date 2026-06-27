"use client";

import { Calendar, MapPin, Briefcase, ChevronRight, Award } from "lucide-react";
import resumeData from "@/data/resumeData.json";

export default function Experience() {
  const exp = resumeData.experience[0];

  const milestones = [
    {
      title: "UI Automation & Web Validation",
      desc: "Designed and maintained scalable UI regression scripts using Selenium, Java, Cucumber, and TestNG. Automated merchant onboarding flow redirects, improving release cycle regressions by 40%.",
      tech: "Java, Selenium, Cucumber, TestNG, POM"
    },
    {
      title: "API Verification & Signature Checks",
      desc: "Validated transaction callback channels and payout APIs using REST Assured. Integrated deep assertions checking dynamic payload contracts and SHA-256 HMAC encryption signatures.",
      tech: "REST Assured, Postman, Newman, JSON Schema"
    },
    {
      title: "Performance Load & Stress Injectors",
      desc: "Analyzed backend latencies and resolved transactional database lock issues. Simulated load generation pipelines scaling concurrency up to 3x peak volumes using JMeter master-slave setups.",
      tech: "Apache JMeter, Distributed Testing, Grafana"
    },
    {
      title: "Database Reconciliation Checks",
      desc: "Conducted automated ledger reconciliation checks checking data sync across UI frontends, API endpoints, MySQL transactional tables, and MongoDB collections.",
      tech: "MySQL, MongoDB, JDBC validation"
    }
  ];

  return (
    <section id="experience" className="py-24 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-[30%] right-[-10%] w-[350px] h-[350px] rounded-full bg-orange-500/5 filter blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Title Header */}
        <div className="max-w-3xl mb-16 text-center sm:text-left space-y-3">
          <div className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">
            Professional Timeline
          </div>
          <h2 className="text-3xl sm:text-4.5xl font-extrabold tracking-tight text-white leading-tight">
            <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              Work Experience
            </span>
          </h2>
          <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full w-24 my-2" />
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            Leading QA engineering and automation strategies at Toucan Payments.
          </p>
        </div>

        {/* Experience layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left panel: Company details */}
          <div className="lg:col-span-5">
            <div className="p-8 rounded-2xl glass-premium space-y-6">
              
              <div className="space-y-2">
                <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">// CURRENT_ROLE</span>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  {exp.role}
                </h3>
                <h4 className="text-sm font-semibold text-slate-450">
                  {exp.company}
                </h4>
              </div>

              {/* Location/Date tags */}
              <div className="flex flex-col space-y-2 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold text-white">{exp.duration}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>{exp.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-slate-500" />
                  <span>Quality Assurance & SDET</span>
                </div>
              </div>

              <p className="text-xs text-slate-450 leading-relaxed border-t border-white/5 pt-4">
                Responsible for full-lifecycle test planning, code analysis, framework building, load script injections, database validations, and weekly release sign-offs in payments environments.
              </p>

              {/* Key Highlight */}
              <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-start space-x-3">
                <Award className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h5 className="text-[10px] font-bold text-white uppercase tracking-wider">Stability Milestone</h5>
                  <p className="text-[10px] text-slate-450 leading-relaxed font-normal">
                    Improved core regression pipeline runs reliability by 40% and verified high-volume transaction pathways.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Right panel: Vertical Timeline List */}
          <div className="lg:col-span-7 space-y-6">
            <h4 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              Core Technical Contributions
            </h4>

            <div className="space-y-6 relative pl-6 border-l border-white/10">
              {milestones.map((ms, index) => (
                <div key={ms.title} className="relative space-y-2 group">
                  {/* Circle dot marker */}
                  <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[#050508] border-2 border-white/20 group-hover:border-orange-500 group-hover:bg-orange-500 transition-colors" />

                  <h5 className="text-sm font-bold text-white group-hover:text-orange-450 transition-colors">
                    {ms.title}
                  </h5>
                  
                  <p className="text-xs text-slate-450 leading-relaxed font-normal">
                    {ms.desc}
                  </p>

                  <div className="flex items-center space-x-1.5 text-[9px] text-slate-500 font-bold uppercase pt-1">
                    <ChevronRight className="w-3 h-3 text-orange-500" />
                    <span>Tech:</span>
                    <span className="text-slate-400 tracking-wider font-semibold">{ms.tech}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
