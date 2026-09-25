"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// three.js + the world controller are only downloaded once the visitor starts scrolling
// (or the browser goes idle), so the first paint ships no 3D code at all.
const ThemeWorld = dynamic(() => import("@/components/three/ThemeWorld"), { ssr: false });

export default function ThemeWorldLazy() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      setReady(true);
      window.removeEventListener("scroll", onScroll);
    };
    const onScroll = () => window.scrollY > window.innerHeight * 0.25 && go();
    window.addEventListener("scroll", onScroll, { passive: true });
    const timer = setTimeout(() => ((window as any).requestIdleCallback ?? ((cb: () => void) => cb()))(go), 3500);
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);
  return ready ? <ThemeWorld /> : null;
}
