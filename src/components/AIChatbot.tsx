"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot } from "lucide-react";
import resumeData from "@/data/resumeData.json";

interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Hello! I am Sai's AI Assistant. Ask me anything about his test automation experience, tech stack, key projects, or how to hire him!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const quickQuestions = [
    { label: "Core Skills", query: "What are your technical automation skills?" },
    { label: "Key Projects", query: "What projects have you built?" },
    { label: "Experience", query: "Where do you work currently?" },
    { label: "Contact Info", query: "How can I contact you?" },
  ];

  const getResponse = (query: string): string => {
    const q = query.toLowerCase();
    
    if (q.includes("who") || q.includes("summary") || q.includes("about") || q.includes("intro")) {
      return resumeData.personal.summary;
    }
    
    if (q.includes("skill") || q.includes("technology") || q.includes("stack") || q.includes("languages") || q.includes("java") || q.includes("selenium")) {
      return `Sai has expert capabilities across several domains:\n\n` +
        resumeData.skills.categories.map((c) => `• **${c.title}**: ${c.skills.join(", ")}`).join("\n");
    }

    if (q.includes("project") || q.includes("case study") || q.includes("portfolio")) {
      return `Sai has built several high-performance test frameworks:\n\n` +
        resumeData.projects.map((p) => `• **${p.title}**: ${p.summary} (Stack: ${p.technologies.join(", ")})`).join("\n") +
        `\n\nScroll to the projects section to explore detailed case studies!`;
    }

    if (q.includes("experience") || q.includes("work") || q.includes("job") || q.includes("company") || q.includes("history") || q.includes("toucan")) {
      const exp = resumeData.experience[0];
      const bullets = Object.values(exp.contributions).flat() as string[];
      return `Sai is currently working at **${exp.company}** as a **${exp.role}** (${exp.duration}).\n\n` +
        `Key focus areas:\n` +
        bullets.slice(0, 3).map((bullet) => `• ${bullet}`).join("\n") +
        `\n\nHe has ${exp.kpis.yearsExp} years of professional payments domain QA experience.`;
    }

    if (q.includes("contact") || q.includes("email") || q.includes("phone") || q.includes("linkedin") || q.includes("reach") || q.includes("hire") || q.includes("mail")) {
      return `You can connect with Sai directly through:\n\n` +
        `• **Email**: ${resumeData.personal.email}\n` +
        `• **Phone**: ${resumeData.personal.phone}\n` +
        `• **LinkedIn**: [LinkedIn Profile](${resumeData.personal.linkedin})\n` +
        `• **GitHub**: [GitHub Repositories](${resumeData.personal.github})\n\n` +
        `Or use the contact form at the bottom of the page, and download the CV from the resume page.`;
    }

    if (q.includes("education") || q.includes("college") || q.includes("degree") || q.includes("btech") || q.includes("study")) {
      const edu = resumeData.education[0];
      return `Sai holds a **${edu.degree}** from **${edu.institution}** (${edu.duration}).`;
    }

    if (q.includes("certif") || q.includes("cert") || q.includes("course") || q.includes("ibm") || q.includes("google")) {
      return `Sai is certified in:\n\n` +
        resumeData.certifications.map((c) => `• **${c.name}** (${c.issuer}, ${c.issued}) [Verify](${c.url})`).join("\n");
    }

    if (q.includes("achievement") || q.includes("award") || q.includes("recogni")) {
      return `Highlights:\n\n` + resumeData.achievements.map((a) => `• ${a}`).join("\n");
    }
    
    return `I can help you with Sai Krishna's portfolio details. Try asking me about: "skills", "experience", "projects", "certifications", "achievements", or "how to contact him"!`;
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const newMsg: Message = {
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getResponse(text);
      const botMsg: Message = {
        sender: "bot",
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-base text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-500/50 active:scale-95 focus:outline-none md:bottom-6 md:right-6 md:px-5 md:text-lg no-print"
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full border-2 border-emerald-400" />
          </span>
        )}
        <span className="hidden sm:inline">{isOpen ? "Close chat" : "Chat with me, I am online!"}</span>
        {!isOpen && <MessageSquare className="w-5 h-5 sm:hidden" />}
      </button>

      {/* Chat Drawer Dialog */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:right-6 w-[360px] max-w-[90vw] h-[480px] rounded-2xl bg-[#09090b] border border-white/[0.06] z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 shadow-2xl shadow-black/80">
          {/* Header */}
          <div className="px-5 py-4 bg-[#050508]/90 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wider">Sai's Assistant</h4>
                <div className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Log */}
          <div data-lenis-prevent className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none"
                      : "bg-white/[0.04] border border-white/[0.06] text-slate-200 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed text-xs">
                    {msg.text}
                  </p>
                  <span className="block text-[8px] text-slate-500 text-right mt-1.5 uppercase font-bold tracking-wider">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-none px-4 py-3 flex items-center space-x-1">
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce delay-75" />
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce delay-150" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length === 1 && (
            <div className="p-3 border-t border-white/[0.06] bg-[#050508]/20 flex flex-wrap gap-2">
              {quickQuestions.map((qq) => (
                <button
                  key={qq.label}
                  onClick={() => handleSend(qq.query)}
                  className="px-3 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[10px] text-blue-400 font-bold transition-all font-sans"
                >
                  {qq.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Panel */}
          <div className="p-3.5 border-t border-white/[0.06] bg-[#050508]/90 flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(inputValue)}
              placeholder="Ask a question..."
              className="flex-1 min-w-0 bg-black/40 border border-white/[0.06] rounded-full px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20"
            />
            <button
              onClick={() => handleSend(inputValue)}
              className="p-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
