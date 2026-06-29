"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import resumeData from "@/data/resumeData.json";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: "Portfolio Message",
      message: formData.get("message"),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus("success");
      } else {
        const err = await response.json();
        setErrorMessage(err.error || "Failed to deliver message.");
        setStatus("error");
      }
    } catch (err) {
      setErrorMessage("Something went wrong. Please check your network.");
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="py-24 relative overflow-hidden bg-background text-foreground transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Title Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16 text-center sm:text-left space-y-3"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Let&apos;s Connect.
          </h2>
          <div className="h-1 bg-gradient-accent rounded-full w-24 my-2" />
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            Reach out to Sai Krishna Bykani to schedule a technical session or discuss payment testing integrations.
          </p>
        </motion.div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left panel: Direct Contact Card */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="lg:col-span-5 flex flex-col justify-between"
          >
            <div className="p-8 rounded-2xl glass-premium border border-slate-200 dark:border-white/[0.06] space-y-8 flex-grow flex flex-col justify-center bg-card text-card-foreground">
              
              <div className="space-y-6 text-xs text-slate-400">
                <div className="border-b border-slate-200 dark:border-white/5 pb-4 mb-4">
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

              {/* Dynamic Social Icons */}
              <div className="flex items-center space-x-3 pt-6 border-t border-slate-200 dark:border-white/5">
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
          </motion.div>

          {/* Right panel: Submission Form */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <div className="p-8 rounded-2xl bg-card border border-slate-200 dark:border-white/[0.06] h-full flex flex-col justify-center overflow-hidden hover:border-blue-500/20 transition-colors duration-300">
              
              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center text-center py-10 space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-base font-extrabold text-white">Message Sent Successfully!</h4>
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                      Thank you for contacting Sai Krishna Bykani. Your message has been routed and an SMS alert was dispatched.
                    </p>
                    <button
                      onClick={() => setStatus("idle")}
                      className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Your Name</label>
                      <input 
                        type="text" 
                        id="name" 
                        name="name" 
                        required 
                        placeholder="John Doe"
                        className="w-full px-4 py-3 bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Email Address</label>
                      <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        required 
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-xl text-xs text-white placeholder:text-slate-650 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Message</label>
                      <textarea 
                        id="message" 
                        name="message" 
                        required 
                        rows={4}
                        placeholder="Hi Sai, I'd like to discuss..."
                        className="w-full px-4 py-3 bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-xl text-xs text-white placeholder:text-slate-650 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                      ></textarea>
                    </div>

                    {status === "error" && (
                      <p className="text-xs font-bold text-red-500">{errorMessage}</p>
                    )}

                    <motion.button 
                      whileHover={status === "loading" ? {} : { scale: 1.02, backgroundColor: "#e2e8f0" }}
                      whileTap={status === "loading" ? {} : { scale: 0.98 }}
                      type="submit"
                      disabled={status === "loading"}
                      className="w-full py-4 mt-2 bg-white text-black rounded-xl text-xs font-extrabold tracking-widest uppercase transition-all shadow-md hover:shadow-white/10 cursor-pointer disabled:opacity-50"
                    >
                      {status === "loading" ? "Sending Alert..." : "Send Message"}
                    </motion.button>
                  </form>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
