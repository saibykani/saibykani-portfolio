"use client";

import { useEffect, useState } from "react";

export default function SpotlightCursor() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCoords({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-500 ease-in-out"
      style={{
        background: `radial-gradient(600px at ${coords.x}px ${coords.y}px, rgba(59, 130, 246, 0.04), rgba(6, 182, 212, 0.02) 40%, transparent 80%)`
      }}
    />
  );
}
