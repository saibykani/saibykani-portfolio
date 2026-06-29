"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import resumeData from "@/data/resumeData.json";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    
    // Add necessary config for formsubmit.co
    formData.append("_subject", "New Portfolio Message!");
    formData.append("_captcha", "false"); // disable captcha for seamless UX

    try {
      // POST directly to formsubmit.co which will email saibykani07@gmail.com
      const response = await fetch("https://formsubmit.co/ajax/saibykani07@gmail.com", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setStatus("success");
      } else {
        setErrorMessage("Failed to deliver message.");
        setStatus("error");
      }
    } catch (err) {
      setErrorMessage("Something went wrong. Please check your network.");
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="py-24 sm:py-32 relative bg-[#030303] text-foreground">
      {/* Lightweight Premium Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-900/10 via-[#030303] to-[#030303] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Title Header */}
        <div className="max-w-3xl mx-auto mb-16 sm:mb-20 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-black tracking-widest uppercase mb-4 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Get In Touch</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-white leading-[1.1]">
            Let&apos;s Build <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
              Something Great.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Reach out to schedule a technical session, discuss payment testing integrations, or explore exciting opportunities.
          </p>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch max-w-6xl mx-auto">
          
          {/* Left panel: Direct Contact Card */}
          <div className="lg:col-span-5 flex flex-col justify-between relative group">
            {/* Animated Glow Border */}
            <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/30 via-purple-500/10 to-blue-500/30 rounded-[2rem] blur opacity-30 group-hover:opacity-100 transition duration-700" />
            
            <div className="p-8 sm:p-10 rounded-[2rem] bg-[#0a0a0c]/90 border border-white/10 space-y-10 flex-grow flex flex-col justify-center relative z-10 shadow-2xl">
              
              <div className="space-y-10 text-xs text-slate-400">
                <div className="pb-8 mb-4 border-b border-white/10 relative">
                  <div className="absolute bottom-0 left-0 h-[2px] w-[40%] bg-gradient-to-r from-blue-500 to-transparent" />
                  <h3 className="text-3xl font-black text-white tracking-tight">Sai Krishna <br/>Bykani</h3>
                </div>

                {/* Contact Items */}
                <div className="space-y-8">
                  {/* Email */}
                  <div className="flex items-center space-x-5 group/item transition-transform hover:translate-x-2 duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-300 group-hover/item:text-blue-400 group-hover/item:border-blue-500/40 group-hover/item:bg-blue-500/20 group-hover/item:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-500 block uppercase font-black tracking-[0.2em]">Email</span>
                      <a href={`mailto:${resumeData.personal.email}`} className="text-white font-bold text-sm lg:text-base hover:text-blue-400 transition-colors">
                        {resumeData.personal.email}
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center space-x-5 group/item transition-transform hover:translate-x-2 duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-300 group-hover/item:text-blue-400 group-hover/item:border-blue-500/40 group-hover/item:bg-blue-500/20 group-hover/item:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-500 block uppercase font-black tracking-[0.2em]">Phone</span>
                      <a href={`tel:${resumeData.personal.phone}`} className="text-white font-bold text-sm lg:text-base hover:text-blue-400 transition-colors">
                        {resumeData.personal.phone}
                      </a>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center space-x-5 group/item transition-transform hover:translate-x-2 duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-300 group-hover/item:text-blue-400 group-hover/item:border-blue-500/40 group-hover/item:bg-blue-500/20 group-hover/item:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-500 block uppercase font-black tracking-[0.2em]">Location</span>
                      <p className="text-white font-bold text-sm lg:text-base">
                        {resumeData.personal.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Icons */}
              <div className="flex items-center space-x-4 pt-6 mt-4 border-t border-white/5">
                <a
                  href={resumeData.personal.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[11px] font-bold text-slate-300 hover:text-white hover:bg-[#0077b5]/20 hover:border-[#0077b5]/50 hover:shadow-[0_0_20px_rgba(0,119,181,0.3)] transition-all hover:-translate-y-1"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  className="flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[11px] font-bold text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:-translate-y-1"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <div className="p-8 sm:p-12 rounded-[2rem] bg-[#0a0a0c]/80 border border-white/[0.08] h-full flex flex-col justify-center overflow-hidden hover:border-blue-500/30 transition-colors duration-500 relative shadow-2xl group">
              
              {/* Form Glow Effect */}
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="flex flex-col items-center justify-center text-center py-20 space-y-8"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full" />
                      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center text-white relative z-10 shadow-[0_0_50px_rgba(16,185,129,0.5)] border border-emerald-300/50">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-2xl sm:text-3xl font-black text-white">Check Your Email!</h4>
                      <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed">
                        The very first time you use this form, you will receive an activation email at <b>saibykani07@gmail.com</b>. Please click 'Activate' in that email to start receiving form submissions seamlessly!
                      </p>
                    </div>
                    <button
                      onClick={() => setStatus("idle")}
                      className="px-10 py-4 mt-6 rounded-full bg-white/[0.05] border border-white/10 text-sm font-bold text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-lg hover:shadow-white/5"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form 
                    key="form"
                    onSubmit={handleSubmit} 
                    className="space-y-6 relative z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2.5 group/field">
                        <label htmlFor="name" className="text-[11px] text-slate-400 font-black tracking-[0.15em] uppercase ml-1 group-focus-within/field:text-blue-400 transition-colors">Your Name</label>
                        <input 
                          type="text" 
                          id="name" 
                          name="name" 
                          required 
                          placeholder="John Doe"
                          className="w-full px-6 py-4 bg-[#111113]/80 border border-white/[0.08] rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:bg-[#151518] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
                        />
                      </div>
                      
                      <div className="space-y-2.5 group/field">
                        <label htmlFor="email" className="text-[11px] text-slate-400 font-black tracking-[0.15em] uppercase ml-1 group-focus-within/field:text-blue-400 transition-colors">Email Address</label>
                        <input 
                          type="email" 
                          id="email" 
                          name="email" 
                          required 
                          placeholder="john@example.com"
                          className="w-full px-6 py-4 bg-[#111113]/80 border border-white/[0.08] rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:bg-[#151518] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5 group/field">
                      <label htmlFor="phone" className="text-[11px] text-slate-400 font-black tracking-[0.15em] uppercase ml-1 group-focus-within/field:text-blue-400 transition-colors">Mobile Number</label>
                      <input 
                        type="tel" 
                        id="phone" 
                        name="phone" 
                        placeholder="+91 8522807300"
                        className="w-full px-6 py-4 bg-[#111113]/80 border border-white/[0.08] rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:bg-[#151518] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
                      />
                    </div>

                    <div className="space-y-2.5 group/field">
                      <label htmlFor="message" className="text-[11px] text-slate-400 font-black tracking-[0.15em] uppercase ml-1 group-focus-within/field:text-blue-400 transition-colors">Message</label>
                      <textarea 
                        id="message" 
                        name="message" 
                        required 
                        rows={4}
                        placeholder="Hello Sai, I'd like to discuss an opportunity..."
                        className="w-full px-6 py-4 bg-[#111113]/80 border border-white/[0.08] rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:bg-[#151518] focus:ring-4 focus:ring-blue-500/10 transition-all resize-none shadow-inner"
                      ></textarea>
                    </div>

                    {status === "error" && (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm font-bold text-red-400 text-center shadow-inner">
                        {errorMessage}
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={status === "loading"}
                      className="w-full py-5 mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-black tracking-[0.2em] uppercase transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden group/btn border border-blue-400/20 active:scale-[0.98]"
                    >
                      {/* Button shine effect */}
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                      
                      {status === "loading" ? (
                        <span className="flex items-center space-x-3 relative z-10">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Processing...</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-2 relative z-10">
                          <span>Send Message</span>
                          <Send className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                        </span>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
