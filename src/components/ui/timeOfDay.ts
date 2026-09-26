/* Time-of-day for the hero sky, from the visitor's own system clock. */

export type SkyPhase = "sunrise" | "day" | "sunset" | "night";

export const PHASE_META: Record<SkyPhase, { greet: string; emoji: string; label: string }> = {
  sunrise: { greet: "Good morning", emoji: "🌅", label: "Sunrise" },
  day: { greet: "Good afternoon", emoji: "☀️", label: "Sunny day" },
  sunset: { greet: "Good evening", emoji: "🌇", label: "Sunset" },
  night: { greet: "Good night", emoji: "🌙", label: "Moonlit night" },
};

/* Fractional local hour (0..24). `?sky=sunrise|day|sunset|night` previews a phase. */
export function localHour(): number {
  if (typeof window !== "undefined") {
    const forced = new URLSearchParams(window.location.search).get("sky");
    const preview: Record<string, number> = { sunrise: 6.6, day: 12.5, sunset: 17.6, night: 22 };
    if (forced && forced in preview) return preview[forced];
  }
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

/* Greeting by the clock (separate from the sky phase): 11:05 AM is still morning. */
export function greetForHour(h: number) {
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
}

export function phaseForHour(h: number): SkyPhase {
  if (h >= 5 && h < 8.5) return "sunrise";
  if (h >= 8.5 && h < 16.5) return "day";
  if (h >= 16.5 && h < 19) return "sunset";
  return "night";
}

/* Sun (day) or moon (night) position across the sky for the given hour.
 * x: -1 (left/east) .. 1 (right/west); y: 0 at horizon .. 1 at zenith. */
export function celestial(h: number): { kind: "sun" | "moon"; x: number; y: number } {
  if (h >= 5.5 && h < 18.8) {
    const k = (h - 5.5) / (18.8 - 5.5);
    return { kind: "sun", x: -0.9 + k * 1.8, y: Math.sin(Math.PI * k) };
  }
  const k = (((h - 18.8 + 24) % 24) / (24 - 18.8 + 5.5));
  return { kind: "moon", x: -0.9 + k * 1.8, y: Math.sin(Math.PI * k) };
}

export function formatTime(d: Date, timeZone?: string) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone });
}
