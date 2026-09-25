"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Hand, Moon, Satellite, Sun } from "lucide-react";
import { SectionHeading } from "@/components/ui/primitives";
import { moonState, subsolarPoint } from "@/components/three/astro";
import { CITIES, type SceneLabel } from "@/components/three/EarthScene";

const EarthScene = dynamic(() => import("@/components/three/EarthScene"), { ssr: false });


const fmtLat = (v: number) => `${Math.abs(v).toFixed(1)}°${v >= 0 ? "N" : "S"}`;
const fmtLon = (v: number) => `${Math.abs(v).toFixed(1)}°${v >= 0 ? "E" : "W"}`;

export default function GlobalMission() {
  const [labels, setLabels] = useState<SceneLabel[]>([]);
  const [now, setNow] = useState<Date | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setArmed(true), io.disconnect()), { rootMargin: "100% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const sun = now ? subsolarPoint(now) : null;
  const moon = now ? moonState(now) : null;
  const clockCities = CITIES.filter((c) => ["Hyderabad", "London", "New York", "San Francisco", "Dubai", "Singapore"].includes(c.name));

  return (
    <section className="relative pt-12">
      <SectionHeading eyebrow="Mission Control" title="Around the world," highlight="around the clock" className="container mb-8" />

      <div ref={trackRef} data-earth-track className="relative h-[260vh]">
      <div className="sticky top-0 mx-auto flex h-[100svh] w-full items-center overflow-hidden md:px-5">
        <div className="relative h-[92svh] w-full overflow-hidden rounded-none bg-[radial-gradient(80%_70%_at_50%_45%,#0b1638_0%,#03040a_70%)] md:rounded-3xl md:shadow-border">
          {armed && <EarthScene onLabels={setLabels} />}

          {/* city labels that follow the globe */}
          <div className="pointer-events-none absolute inset-0">
            {labels.map((l) => (
              <span
                key={l.name}
                className={`absolute -translate-x-1/2 -translate-y-[160%] whitespace-nowrap rounded-full px-2 py-0.5 font-mono transition-opacity duration-500 ${
                  l.planet ? "text-[11px] tracking-widest " : "text-[10px] "
                }${l.home ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/40" : l.planet ? "bg-white/10 text-white/90 ring-1 ring-white/15 backdrop-blur" : "bg-black/40 text-white/75"}`}
                style={{ left: l.x, top: l.y, opacity: l.visible ? 1 : 0 }}
              >
                {l.home ? "● " : ""}
                {l.name}
              </span>
            ))}
          </div>

          {/* live clocks */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="absolute left-3 top-3 z-10 w-40 rounded-2xl border border-white/10 bg-black/45 p-2.5 font-mono text-[10px] sm:w-52 sm:p-3 sm:text-[11px] text-white shadow-2xl backdrop-blur-md md:left-8 md:top-8 md:w-60"
          >
            <p className="mb-2 text-[9px] uppercase tracking-[0.25em] text-white/50">Live · local time</p>
            {now &&
              clockCities.map((c, i) => (
                <div key={c.name} className={`items-center justify-between py-0.5 ${i > 2 ? "hidden sm:flex" : "flex"}`}>
                  <span className={c.home ? "text-emerald-300" : "text-white/80"}>{c.name}</span>
                  <span className="tabular-nums text-white">
                    {new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: c.tz }).format(now)}
                  </span>
                </div>
              ))}
          </motion.div>

          {/* sun & moon, real time */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="absolute bottom-3 right-3 z-10 hidden w-60 rounded-2xl border border-white/10 bg-black/45 p-3 font-mono text-[11px] text-white shadow-2xl backdrop-blur-md sm:block md:bottom-8 md:right-8"
          >
            <p className="mb-2 text-[9px] uppercase tracking-[0.25em] text-white/50">Real-time sky</p>
            {sun && (
              <div className="flex items-start gap-2 py-1">
                <Sun className="mt-0.5 size-4 text-amber-300" />
                <div>
                  <p className="text-white/85">Sun overhead</p>
                  <p className="text-white/55">
                    {fmtLat(sun.lat)} · {fmtLon(sun.lon)}
                  </p>
                </div>
              </div>
            )}
            {moon && (
              <div className="flex items-start gap-2 py-1">
                <Moon className="mt-0.5 size-4 text-sky-200" />
                <div>
                  <p className="text-white/85">{moon.phase}</p>
                  <p className="text-white/55">{Math.round(moon.illum * 100)}% illuminated</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2 py-1">
              <Satellite className="mt-0.5 size-4 text-violet-300" />
              <p className="text-white/70">130+ satellites · 28 flights · 14 ships</p>
            </div>
          </motion.div>

          <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/40 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white/60 backdrop-blur">
            <Hand className="size-3.5" /> Drag to explore · scroll to zoom out
          </p>
        </div>
      </div>
      </div>
    </section>
  );
}
