"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// Inertia smooth scrolling; native window.scrollTo calls still work because Lenis syncs to them.
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });

    // Route programmatic smooth scrolls through Lenis so they share the same easing
    const nativeScrollTo = window.scrollTo.bind(window);
    window.scrollTo = ((arg: any, y?: number) => {
      if (typeof arg === "object" && arg?.behavior === "smooth" && typeof arg.top === "number") {
        lenis.scrollTo(arg.top);
      } else if (typeof arg === "number") {
        nativeScrollTo(arg, y ?? 0);
      } else {
        nativeScrollTo(arg);
      }
    }) as typeof window.scrollTo;

    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    document.documentElement.classList.add("lenis");
    return () => {
      cancelAnimationFrame(raf);
      window.scrollTo = nativeScrollTo;
      lenis.destroy();
    };
  }, []);
  return null;
}
