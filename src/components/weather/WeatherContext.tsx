"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Weather = "night" | "winter" | "summer" | "rain" | "autumn";

type RGB = [number, number, number];
export type SkyPalette = {
  gap: RGB; // dark sky between clouds
  sky: RGB; // open sky
  cloud: RGB; // cloud body
  rim: RGB; // lit cloud edges
  stars: number; // 0..1 star visibility
  cover: number; // extra cloud coverage
  glow: RGB; // horizon glow colour (sun / city)
  glowAmt: number;
};

export const PALETTES: Record<Weather, SkyPalette> = {
  night: { gap: [0.006, 0.06, 0.19], sky: [0.04, 0.13, 0.37], cloud: [0.07, 0.2, 0.46], rim: [0.24, 0.4, 0.78], stars: 1, cover: 0, glow: [0.2, 0.35, 0.9], glowAmt: 0.08 },
  winter: { gap: [0.03, 0.06, 0.12], sky: [0.09, 0.16, 0.28], cloud: [0.32, 0.4, 0.52], rim: [0.75, 0.85, 1.0], stars: 0.6, cover: 0.06, glow: [0.55, 0.7, 1.0], glowAmt: 0.12 },
  summer: { gap: [0.07, 0.02, 0.09], sky: [0.26, 0.08, 0.2], cloud: [0.68, 0.3, 0.26], rim: [1.0, 0.72, 0.42], stars: 0.25, cover: -0.04, glow: [1.0, 0.5, 0.18], glowAmt: 0.6 },
  rain: { gap: [0.015, 0.02, 0.035], sky: [0.06, 0.08, 0.12], cloud: [0.16, 0.18, 0.23], rim: [0.38, 0.42, 0.52], stars: 0, cover: 0.3, glow: [0.3, 0.35, 0.5], glowAmt: 0.05 },
  autumn: { gap: [0.05, 0.02, 0.015], sky: [0.2, 0.08, 0.045], cloud: [0.46, 0.22, 0.1], rim: [0.95, 0.6, 0.28], stars: 0.35, cover: 0.04, glow: [1.0, 0.42, 0.14], glowAmt: 0.4 },
};

export const WEATHER_META: Record<Weather, { label: string; particle: "none" | "snow" | "rain" | "leaves" | "fireflies" }> = {
  night: { label: "Clear sky", particle: "none" },
  winter: { label: "Winter", particle: "snow" },
  summer: { label: "Summer", particle: "fireflies" },
  rain: { label: "Monsoon storm", particle: "rain" },
  autumn: { label: "Autumn", particle: "leaves" },
};

const KEY = "sb-weather";
const Ctx = createContext<{ weather: Weather; setWeather: (w: Weather) => void }>({ weather: "night", setWeather: () => {} });

/* Lightning event bus: the weather system emits strikes; sky, 3D scene and overlay react. */
export function emitLightning(x = Math.random()) {
  window.dispatchEvent(new CustomEvent("sb-lightning", { detail: { x } }));
}
export function onLightning(cb: (x: number) => void) {
  const h = (e: Event) => cb((e as CustomEvent).detail?.x ?? 0.5);
  window.addEventListener("sb-lightning", h);
  return () => window.removeEventListener("sb-lightning", h);
}

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [weather, setWeatherState] = useState<Weather>("night");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Weather | null;
      if (saved && saved in PALETTES) setWeatherState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.dataset.weather = weather;
    if (weather !== "rain") return;
    // storm: random lightning strikes
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        emitLightning();
        if (Math.random() < 0.45) setTimeout(() => emitLightning(), 180); // double strike
        schedule();
      }, 3500 + Math.random() * 5500);
    };
    const first = setTimeout(() => emitLightning(0.7), 900);
    schedule();
    return () => {
      clearTimeout(t);
      clearTimeout(first);
    };
  }, [weather]);

  const setWeather = (w: Weather) => {
    setWeatherState(w);
    try {
      localStorage.setItem(KEY, w);
    } catch {}
  };

  return <Ctx.Provider value={{ weather, setWeather }}>{children}</Ctx.Provider>;
}

export const useWeather = () => useContext(Ctx);
