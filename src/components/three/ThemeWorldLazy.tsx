"use client";

import dynamic from "next/dynamic";

// Client-only, code-split so three.js worlds never block first paint.
const ThemeWorld = dynamic(() => import("@/components/three/ThemeWorld"), { ssr: false });

export default function ThemeWorldLazy() {
  return <ThemeWorld />;
}
