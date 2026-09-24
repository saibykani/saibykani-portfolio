"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloudLightning, Leaf, MoonStar, Snowflake, Sun } from "lucide-react";
import { useWeather, WEATHER_META, type Weather } from "@/components/weather/WeatherContext";

const OPTIONS: { id: Weather; Icon: typeof Sun; color: string }[] = [
  { id: "night", Icon: MoonStar, color: "#93c5fd" },
  { id: "winter", Icon: Snowflake, color: "#e0f2fe" },
  { id: "summer", Icon: Sun, color: "#fbbf24" },
  { id: "rain", Icon: CloudLightning, color: "#a5b4fc" },
  { id: "autumn", Icon: Leaf, color: "#fb923c" },
];

/* Small weather/season switcher tucked in the top-right corner. */
export default function ThemeSwitcher() {
  const { weather, setWeather } = useWeather();
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find((o) => o.id === weather) ?? OPTIONS[0];

  return (
    <div
      className="fixed right-3 top-[68px] z-[4900] flex flex-col items-end gap-2 md:right-5 md:top-20 no-print"
      onMouseLeave={() => setOpen(false)}
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        aria-label={`Weather theme: ${WEATHER_META[weather].label}`}
        className="relative flex size-10 items-center justify-center rounded-full bg-white/10 shadow-border backdrop-blur-xl transition hover:bg-white/20"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={weather}
            initial={{ rotate: -90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <current.Icon className="size-5" style={{ color: current.color }} />
          </motion.span>
        </AnimatePresence>
        <span className="absolute inset-0 animate-ping rounded-full border border-white/20 [animation-duration:3s]" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            className="flex flex-col gap-1 rounded-2xl bg-zinc-900/90 p-1.5 shadow-border backdrop-blur-xl"
          >
            {OPTIONS.map(({ id, Icon, color }, i) => (
              <motion.button
                key={id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => {
                  setWeather(id);
                  setOpen(false);
                }}
                className={`flex items-center justify-end gap-2 rounded-xl px-3 py-1.5 text-xs transition ${
                  weather === id ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {WEATHER_META[id].label}
                <Icon className="size-4" style={{ color }} />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
