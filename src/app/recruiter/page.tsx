"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AIChatbot from "@/components/AIChatbot";
import { Calendar, Download, MapPin, User, Clock, FileText, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import resumeData from "@/data/resumeData.json";

export default function RecruiterHub() {
  const [bookingStatus, setBookingStatus] = useState<"idle" | "booked">("idle");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate || !bookingTime) return;
    setBookingStatus("booked");
  };

  const recruiterFacts = [
    { label: "Current Location", value: "Hyderabad, India", icon: MapPin },
    { label: "Relocation Preference", value: "Open / Remote Friendly", icon: MapPin },
    { label: "Experience Level", value: "2.6+ Years Professional QA/SDET", icon: User },
    { label: "Notice Period", value: "30 Days (Negotiable)", icon: Clock },
    { label: "Primary Domain", value: "Fintech Payments & API Automation", icon: FileText },
    { label: "Key Stack", value: "Java, Selenium, REST Assured, JMeter", icon: FileText },
  ];

  const valueProps = [
    {
      title: "FinTech & Payments Domain",
      desc: "Deep knowledge of payment routing gateways, transaction ledgers validation, and HMAC dynamic signature check implementations."
    },
    {
      title: "Continuous Regression Stability",
      desc: "Proven track record of improving pipeline suite execution stability by ~40% and deploying nightly Jenkins trigger runners."
    },
    {
      title: "Distributed Load Execution",
      desc: "Simulated load limits up to 3x normal peak concurrency using master-slave JMeter nodes deployed in Docker environments."
    }
  ];

  return (
    <main className="min-h-screen bg-[#020204] text-slate-100 relative font-sans text-xs">
      <Navbar />

      {/* Background glow effects */}
      <div className="absolute top-[10%] left-[-5%] w-[350px] h-[350px] rounded-full bg-orange-500/5 filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-5%] w-[350px] h-[350px] rounded-full bg-orange-500/5 filter blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 relative z-10">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center space-x-1.5 text-slate-500 hover:text-orange-500 mb-8 transition-colors text-[10px] font-bold tracking-widest uppercase">
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>

        {/* Title Header */}
        <div className="max-w-3xl mb-12 space-y-2">
          <div className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">
            Recruiter Workspace
          </div>
          <h1 className="text-3xl sm:text-4.5xl font-extrabold tracking-tight text-white leading-tight">
            <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              Hiring Portal
            </span>
          </h1>
          <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full w-24 my-2" />
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">
            Review employment parameters, fintech capabilities, print PDF resumes, and request technical interviews directly.
          </p>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Quick Facts Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-2xl glass-premium space-y-6">
              
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] text-slate-550 uppercase tracking-widest font-bold">Employment Parameters</span>
                <h3 className="text-sm font-bold text-white mt-1">Sai Krishna Bykani</h3>
              </div>

              {/* Facts List */}
              <div className="space-y-4">
                {recruiterFacts.map((fact) => {
                  const Icon = fact.icon;
                  return (
                    <div key={fact.label} className="space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{fact.label}</span>
                      <div className="flex items-center space-x-2 text-white">
                        <Icon className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <span className="font-semibold text-xs">{fact.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resume download triggers */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <Link
                  href="/resume"
                  className="w-full py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-650 hover:from-orange-600 hover:to-red-700 text-white font-bold flex items-center justify-center space-x-2 transition-all shadow-lg text-[10px] tracking-wider uppercase"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Online CV</span>
                </Link>
                
                <button
                  onClick={() => window.print()}
                  className="w-full py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-350 font-bold flex items-center justify-center space-x-2 transition-all shadow-inner text-[10px] tracking-wider uppercase"
                >
                  <Download className="w-4 h-4" />
                  <span>Print CV to PDF</span>
                </button>
              </div>

            </div>
          </div>

          {/* Right panel: Value props & Scheduling */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Value props cards */}
            <div className="p-6 rounded-2xl glass-premium">
              <h3 className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-4">
                Capabilities Summary
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {valueProps.map((vp) => (
                  <div key={vp.title} className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <h4 className="font-bold text-white text-[11px] leading-tight">{vp.title}</h4>
                    <p className="text-[10px] text-slate-450 leading-relaxed font-normal">
                      {vp.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock Interview booking card */}
            <div className="p-6 rounded-2xl glass-premium relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-950/25 border border-emerald-500/25 text-emerald-400 text-[8px] font-bold tracking-widest uppercase">
                Active Calendar
              </div>

              <h3 className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-4">
                Schedule Technical Interview
              </h3>

              {bookingStatus === "booked" ? (
                // Booked success state
                <div className="text-center py-6 space-y-4 animate-in fade-in duration-300">
                  <div className="flex justify-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-5 h-5 animate-bounce" />
                    </div>
                  </div>
                  <h4 className="font-bold text-white uppercase text-xs">Interview Requested</h4>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed font-normal">
                    Slot reserved for **{bookingDate}** at **{bookingTime}**. A calendar coordinator payload has been queued.
                  </p>
                  <button
                    onClick={() => setBookingStatus("idle")}
                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold text-orange-400 transition-all uppercase"
                  >
                    Reset Form
                  </button>
                </div>
              ) : (
                // Booking form
                <form onSubmit={handleBook} className="space-y-4 max-w-md">
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    Select a date and time to dispatch an interview slot request.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Select Date *</label>
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-[#050508]/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Select Time *</label>
                      <input
                        type="time"
                        required
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full bg-[#050508]/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-red-650 hover:from-orange-600 hover:to-red-700 text-white font-bold uppercase transition-all shadow-md flex items-center space-x-2 text-[10px] tracking-wider"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Send Invitation</span>
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>

      </div>

      <Footer />
      <AIChatbot />
    </main>
  );
}
