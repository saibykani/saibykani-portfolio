"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import resumeData from "@/data/resumeData.json";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("idle");
        alert("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setStatus("idle");
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      
      {/* Background radial glow */}
      <div className="absolute top-[10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-blue-500/[0.04] filter blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Title Header */}
        <div className="max-w-3xl mb-16 text-center sm:text-left space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Contact Me
          </h2>
          <div className="w-12 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 my-4" />
          <p className="text-sm text-gray-500 max-w-xl leading-relaxed">
            Please submit a request to schedule a technical interview session or discuss automation frameworks.
          </p>
        </div>

        {/* Contact Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left panel: Info anchors */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-2xl bg-[#09090b] border border-white/[0.06] h-full flex flex-col justify-between">
              
              <div className="space-y-6 text-xs text-slate-400">
                <div className="border-b border-white/[0.06] pb-4 mb-4">
                  <span className="text-[9px] text-slate-500 tracking-widest uppercase font-bold">Contact details</span>
                  <h3 className="text-sm font-extrabold text-white mt-1">Sai Krishna Bykani</h3>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Email Address</span>
                    <a href={`mailto:${resumeData.personal.email}`} className="text-white hover:text-blue-400 transition-colors text-xs font-semibold">
                      {resumeData.personal.email}
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Phone number</span>
                    <a href={`tel:${resumeData.personal.phone}`} className="text-white hover:text-blue-400 transition-colors text-xs font-semibold">
                      {resumeData.personal.phone}
                    </a>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Base Location</span>
                    <p className="text-white text-xs font-semibold">
                      {resumeData.personal.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Social links row */}
              <div className="border-t border-white/[0.06] pt-6 mt-8 flex items-center space-x-4">
                <a
                  href={resumeData.personal.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px] font-bold text-slate-400 hover:text-white transition-all hover:bg-blue-500/10 hover:border-blue-500/20"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                  <span>LINKEDIN</span>
                </a>
                <a
                  href={resumeData.personal.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px] font-bold text-slate-400 hover:text-white transition-all hover:bg-blue-500/10 hover:border-blue-500/20"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                  <span>GITHUB</span>
                </a>
              </div>

            </div>
          </div>

          {/* Right panel: Submission Form */}
          <div className="lg:col-span-7">
            <div className="p-8 rounded-2xl bg-[#09090b] border border-white/[0.06] h-full flex flex-col justify-center overflow-hidden">
              
              {status === "success" ? (
                // Success trigger state
                <div className="text-center space-y-4 py-8 animate-in fade-in duration-300">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CheckCircle className="w-6 h-6 animate-bounce" />
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Message Sent Successfully
                  </h3>
                  
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Thank you! I will get back to you as soon as possible.
                  </p>

                  <button
                    onClick={() => setStatus("idle")}
                    className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] text-xs font-bold text-blue-400 transition-all font-sans"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                // Submission form panel
                <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Your Name *</label>
                      <input
                        type="text"
                        required
                        disabled={status === "sending"}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="E.g. Hiring Manager"
                        className="w-full bg-[#050508]/60 border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                      />
                    </div>
                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Your Email *</label>
                      <input
                        type="email"
                        required
                        disabled={status === "sending"}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="E.g. manager@company.com"
                        className="w-full bg-[#050508]/60 border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Subject</label>
                    <input
                      type="text"
                      disabled={status === "sending"}
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="E.g. Technical Interview Schedule"
                      className="w-full bg-[#050508]/60 border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* Message body */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Message *</label>
                    <textarea
                      required
                      rows={4}
                      disabled={status === "sending"}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Compose message..."
                      className="w-full bg-[#050508]/60 border border-white/[0.06] rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none disabled:opacity-50"
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold tracking-wider uppercase transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 hover:scale-[1.01] disabled:opacity-70 disabled:cursor-wait"
                  >
                    <span>{status === "sending" ? "Sending..." : "Send Message Directly"}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>

                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
