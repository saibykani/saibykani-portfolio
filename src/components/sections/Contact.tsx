"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import resumeData from "@/data/resumeData.json";

// Particle component for background VFX
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-500/30 rounded-full blur-[1px]"
          initial={{
            x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000),
            opacity: Math.random() * 0.5 + 0.2
          }}
          animate={{
            y: [null, Math.random() * -200],
            x: [null, Math.random() * 100 - 50],
            opacity: [null, 0],
            scale: [1, 2]
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;
    
    // Format the message for WhatsApp
    const whatsappText = `*New Portfolio Contact*\n\n*Name:* ${name}\n*Email:* ${email}\n\n*Message:*\n${message}`;
    const whatsappUrl = `https://wa.me/${resumeData.personal.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappText)}`;
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, "_blank");
    
    setTimeout(() => {
      setStatus("success");
    }, 1000);
  };

  return (
    <section ref={containerRef} id="contact" className="py-32 relative overflow-hidden bg-[#050505] text-foreground">
      {/* Background VFX */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-900/10 via-[#050505] to-[#050505] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
      <FloatingParticles />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Title Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl mb-20 text-center sm:text-left space-y-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-2"
          >
            <MessageSquare className="w-3 h-3" />
            <span>Get In Touch</span>
          </motion.div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Let&apos;s Build <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Something Great.
            </span>
          </h2>
          <p className="text-base text-slate-400 max-w-xl leading-relaxed font-medium">
            Reach out to Sai Krishna Bykani to schedule a technical session, discuss payment testing integrations, or explore exciting opportunities.
          </p>
        </motion.div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          
          {/* Left panel: Direct Contact Card */}
          <motion.div 
            style={{ y }}
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className="lg:col-span-5 flex flex-col justify-between relative group"
          >
            {/* Animated Glow Border */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-3xl blur opacity-30 group-hover:opacity-70 transition duration-1000 group-hover:duration-200" />
            
            <div className="p-10 rounded-3xl bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/[0.08] space-y-10 flex-grow flex flex-col justify-center relative z-10">
              
              <div className="space-y-8 text-xs text-slate-400">
                <div className="pb-6 mb-2 border-b border-white/5 relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "30%" }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-blue-500 to-transparent" 
                  />
                  <h3 className="text-2xl font-black text-white tracking-tight">Sai Krishna Bykani</h3>
                </div>

                {/* Contact Items */}
                <div className="space-y-6">
                  {/* Email */}
                  <motion.div whileHover={{ x: 5 }} className="flex items-center space-x-4 cursor-pointer group/item">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-300 group-hover/item:text-blue-400 group-hover/item:border-blue-500/30 group-hover/item:bg-blue-500/10 transition-all duration-300 shadow-lg">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest">Email</span>
                      <a href={`mailto:${resumeData.personal.email}`} className="text-white font-semibold text-sm">
                        {resumeData.personal.email}
                      </a>
                    </div>
                  </motion.div>

                  {/* Phone */}
                  <motion.div whileHover={{ x: 5 }} className="flex items-center space-x-4 cursor-pointer group/item">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-300 group-hover/item:text-blue-400 group-hover/item:border-blue-500/30 group-hover/item:bg-blue-500/10 transition-all duration-300 shadow-lg">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest">Phone</span>
                      <a href={`tel:${resumeData.personal.phone}`} className="text-white font-semibold text-sm">
                        {resumeData.personal.phone}
                      </a>
                    </div>
                  </motion.div>

                  {/* Location */}
                  <motion.div whileHover={{ x: 5 }} className="flex items-center space-x-4 group/item">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-300 group-hover/item:text-blue-400 group-hover/item:border-blue-500/30 group-hover/item:bg-blue-500/10 transition-all duration-300 shadow-lg">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest">Location</span>
                      <p className="text-white font-semibold text-sm">
                        {resumeData.personal.location}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Social Icons */}
              <div className="flex items-center space-x-4 pt-4">
                <motion.a
                  whileHover={{ y: -3, scale: 1.05 }}
                  href={resumeData.personal.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] font-bold text-slate-300 hover:text-white hover:bg-[#0077b5]/20 hover:border-[#0077b5]/50 transition-all shadow-lg"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                  <span>LINKEDIN</span>
                </motion.a>
                <motion.a
                  whileHover={{ y: -3, scale: 1.05 }}
                  href={resumeData.personal.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] font-bold text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-lg"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                  <span>GITHUB</span>
                </motion.a>
              </div>

            </div>
          </motion.div>

          {/* Right panel: Submission Form */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.2 }}
            className="lg:col-span-7"
          >
            <div className="p-8 sm:p-10 rounded-3xl bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/[0.05] h-full flex flex-col justify-center overflow-hidden hover:border-blue-500/20 transition-colors duration-500 relative shadow-2xl">
              
              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="flex flex-col items-center justify-center text-center py-16 space-y-6"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                      <motion.div 
                        initial={{ rotate: -180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: "spring", damping: 12, delay: 0.1 }}
                        className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-300 flex items-center justify-center text-white relative z-10 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                      >
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black text-white">Message Delivered!</h4>
                      <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                        Thank you for reaching out. Your message has been routed via email and WhatsApp. I will get back to you shortly.
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStatus("idle")}
                      className="px-8 py-3 mt-4 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-lg"
                    >
                      Send Another Message
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.form 
                    key="form"
                    onSubmit={handleSubmit} 
                    className="space-y-6 relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2 group">
                        <label htmlFor="name" className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase ml-1 group-focus-within:text-blue-400 transition-colors">Your Name</label>
                        <input 
                          type="text" 
                          id="name" 
                          name="name" 
                          required 
                          placeholder="John Doe"
                          className="w-full px-5 py-4 bg-[#111113] border border-white/[0.05] rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-[#151518] focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                        />
                      </div>
                      
                      <div className="space-y-2 group">
                        <label htmlFor="email" className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase ml-1 group-focus-within:text-blue-400 transition-colors">Email Address</label>
                        <input 
                          type="email" 
                          id="email" 
                          name="email" 
                          required 
                          placeholder="john@example.com"
                          className="w-full px-5 py-4 bg-[#111113] border border-white/[0.05] rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-[#151518] focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 group">
                      <label htmlFor="message" className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase ml-1 group-focus-within:text-blue-400 transition-colors">Message</label>
                      <textarea 
                        id="message" 
                        name="message" 
                        required 
                        rows={5}
                        placeholder="Hello Sai, I'd like to discuss an opportunity..."
                        className="w-full px-5 py-4 bg-[#111113] border border-white/[0.05] rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-[#151518] focus:ring-1 focus:ring-blue-500/50 transition-all resize-none shadow-inner"
                      ></textarea>
                    </div>

                    {status === "error" && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400">
                        {errorMessage}
                      </motion.div>
                    )}

                    <motion.button 
                      whileHover={status === "loading" ? {} : { scale: 1.02 }}
                      whileTap={status === "loading" ? {} : { scale: 0.98 }}
                      type="submit"
                      disabled={status === "loading"}
                      className="w-full py-5 mt-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-2xl text-xs font-black tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden"
                    >
                      {status === "loading" ? (
                        <span className="flex items-center space-x-2">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center space-x-2">
                          <span>Send Message</span>
                          <Send className="w-4 h-4 ml-2" />
                        </span>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
