"use client";

import { useEffect, useState } from "react";

export type SkyPhase = "sunrise" | "day" | "sunset" | "night";

export const PHASE_META: Record<SkyPhase, { greet: string; emoji: string; overlay: string }> = {
  sunrise: { greet: "Good morning", emoji: "🌅", overlay: "rgba(20,10,30,0.38)" },
  day: { greet: "Good afternoon", emoji: "☀️", overlay: "rgba(5,20,45,0.42)" },
  sunset: { greet: "Good evening", emoji: "🌇", overlay: "rgba(20,8,20,0.4)" },
  night: { greet: "Good night", emoji: "🌙", overlay: "rgba(0,4,18,0.3)" },
};

export function phaseForHour(h: number): SkyPhase {
  if (h >= 5 && h < 9) return "sunrise";
  if (h >= 9 && h < 16) return "day";
  if (h >= 16 && h < 19) return "sunset";
  return "night";
}

/* Hero sky: a real photograph matched to the visitor's local time of day,
 * with a slow cinematic drift (pure CSS transforms, GPU-composited). */
export default function TimeSky({ onPhase }: { onPhase?: (p: SkyPhase) => void }) {
  const [phase, setPhase] = useState<SkyPhase | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const update = () => {
      const forced = new URLSearchParams(window.location.search).get("sky") as SkyPhase | null;
      const p = forced && forced in PHASE_META ? forced : phaseForHour(new Date().getHours());
      setPhase((prev) => (prev === p ? prev : p));
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (phase) onPhase?.(phase);
  }, [phase, onPhase]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#07102e]">
      {phase && (
        <picture key={phase}>
          <source media="(max-width: 767px)" srcSet={`/photos/hero-${phase}-m.webp`} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/photos/hero-${phase}.webp`}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`kenburns absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        </picture>
      )}
      {/* readability: soft darkening behind the headline + fade into the page */}
      <div className="absolute inset-0" style={{ background: phase ? PHASE_META[phase].overlay : "transparent" }} />
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_50%,rgba(0,0,0,0.35),transparent_75%)]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-black" />
    </div>
  );
}
