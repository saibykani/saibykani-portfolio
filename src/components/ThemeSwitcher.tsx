"use client";

import { useEffect, useState } from "react";
import { Paintbrush, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("blue"); // default
  const [autoShift, setAutoShift] = useState(false);

  const themes = [
    { id: "blue", name: "Classic Blue", color: "#3b82f6" },
    { id: "orange", name: "Solar Orange", color: "#f97316" },
    { id: "purple", name: "Royal Purple", color: "#a855f7" },
    { id: "emerald", name: "Cyber Emerald", color: "#10b981" },
  ];

  const applyTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    
    // Remove other theme classes
    document.documentElement.classList.remove(
      "theme-orange",
      "theme-purple",
      "theme-emerald"
    );
    
    // Add current theme class
    if (themeId !== "blue") {
      document.documentElement.classList.add(`theme-${themeId}`);
    }
  };

  // Handle auto-shifting theme color every 2 seconds
  useEffect(() => {
    if (!autoShift) return;
    
    const interval = setInterval(() => {
      const currentIndex = themes.findIndex((t) => t.id === currentTheme);
      const nextIndex = (currentIndex + 1) % themes.length;
      applyTheme(themes[nextIndex].id);
    }, 2000);

    return () => clearInterval(interval);
  }, [autoShift, currentTheme]);

  return (
    <div className="fixed bottom-6 left-6 z-50 no-print">
      <div className="flex items-center space-x-2">
        {/* Toggle Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 rounded-full bg-[#0a0a0c]/85 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white shadow-2xl backdrop-blur-md cursor-pointer hover:border-white/20 transition-colors"
        >
          <Paintbrush className="w-5 h-5" style={{ color: themes.find(t => t.id === currentTheme)?.color }} />
        </motion.button>

        {/* Panel Container */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              className="flex items-center space-x-3 bg-[#0a0a0c]/90 border border-white/10 rounded-full px-4 py-2 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-left-4 duration-300"
            >
              {/* Color Circles */}
              <div className="flex items-center space-x-2 border-r border-white/10 pr-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      applyTheme(theme.id);
                      setAutoShift(false); // turn off auto-shift if user manually selects
                    }}
                    className={`w-5 h-5 rounded-full border transition-all cursor-pointer relative flex items-center justify-center`}
                    style={{ 
                      backgroundColor: theme.color,
                      borderColor: currentTheme === theme.id ? "#ffffff" : "transparent"
                    }}
                    title={theme.name}
                  >
                    {currentTheme === theme.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    )}
                  </button>
                ))}
              </div>

              {/* Auto Shift Controls */}
              <button
                onClick={() => setAutoShift(!autoShift)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest cursor-pointer transition-all ${
                  autoShift 
                    ? "bg-white text-black hover:bg-slate-200" 
                    : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {autoShift ? (
                  <>
                    <Pause className="w-2.5 h-2.5 fill-black text-black" />
                    <span>Auto</span>
                  </>
                ) : (
                  <>
                    <Play className="w-2.5 h-2.5 fill-slate-400 text-slate-400" />
                    <span>Cycle 2s</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
