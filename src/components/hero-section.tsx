"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export function HeroSection({ children }: { children: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    function updateViewportHeight() {
      if (!sectionRef.current) return;

      // The computed 100svh stays stable while mobile browser controls hide.
      // Measure the minimum, since localized content can make the hero taller.
      setViewportHeight(
        Number.parseFloat(getComputedStyle(sectionRef.current).minHeight),
      );
    }

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    return () => window.removeEventListener("resize", updateViewportHeight);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="hero-section relative flex min-h-[100svh] items-start overflow-hidden sm:items-center"
      aria-labelledby="hero-title"
      data-short-viewport={viewportHeight !== null && viewportHeight <= 740}
      data-tiny-viewport={viewportHeight !== null && viewportHeight <= 640}
    >
      {children}
    </section>
  );
}
