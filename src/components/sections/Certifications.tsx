"use client";

import { Award, ShieldCheck, CheckCircle2, Zap } from "lucide-react";
import resumeData from "@/data/resumeData.json";

export default function Certifications() {
  const achievements = resumeData.achievements;
  const certs = resumeData.certifications;

  const achievementIcons = [Award, Zap, CheckCircle2];

  return (
    <section className="py-24 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-[20%] left-[-10%] w-[350px] h-[350px] rounded-full bg-orange-500/5 filter blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Achievements */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <div className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">
                Proven Outcomes
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-orange-500 to-red-650 bg-clip-text text-transparent">
                  Key Contributions
                </span>
              </h2>
              <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full w-24 my-2" />
            </div>

            <div className="space-y-4">
              {achievements.map((ach, idx) => {
                const Icon = achievementIcons[idx % achievementIcons.length];
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl glass-premium flex items-start space-x-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                      <Icon className="w-5 h-5 animate-pulse" />
                    </div>
                    
                    <div className="space-y-1 flex-1 text-xs">
                      <h4 className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                        Achievement Code 0{idx + 1}
                      </h4>
                      <p className="text-slate-400 leading-relaxed text-xs font-normal">
                        {ach}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Certifications */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <div className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">
                Verified Credentials
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-orange-500 to-red-650 bg-clip-text text-transparent">
                  Certifications
                </span>
              </h2>
              <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full w-24 my-2" />
            </div>

            <div className="space-y-4">
              {certs.map((cert) => (
                <div
                  key={cert.name}
                  className="p-5 rounded-2xl glass-premium flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/5 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-xs">
                      CR
                    </div>
                    
                    <div className="text-xs space-y-0.5">
                      <h4 className="text-white font-bold group-hover:text-orange-450 transition-colors">
                        {cert.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 block">
                        Issued by {cert.issuer}
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-[10px] text-slate-500 pl-4 shrink-0 font-sans">
                    <span className="block text-orange-500 font-bold uppercase text-[8px] tracking-widest">Year</span>
                    <span className="font-semibold">{cert.year}</span>
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
