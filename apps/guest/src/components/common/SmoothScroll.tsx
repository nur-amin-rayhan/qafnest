"use client";

import { useEffect } from "react";

/**
 * Lazily enables Lenis smooth wheel scrolling on fine-pointer desktop screens only.
 * Mobile and touch devices bypass loading the library entirely for native 60fps scrolling.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 1024) return;

    let disposed = false;
    let raf = 0;
    let isRunning = true;
    let cleanupLenis: (() => void) | undefined;

    void import("lenis").then(({ default: Lenis }) => {
      if (disposed) return;

      const lenis = new Lenis({
        duration: 1.0,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      const loop = (time: number) => {
        if (isRunning && !disposed) {
          lenis.raf(time);
          raf = requestAnimationFrame(loop);
        }
      };
      raf = requestAnimationFrame(loop);

      const onVisibilityChange = () => {
        if (document.hidden) {
          isRunning = false;
          cancelAnimationFrame(raf);
        } else if (!isRunning && !disposed) {
          isRunning = true;
          raf = requestAnimationFrame(loop);
        }
      };

      document.addEventListener("visibilitychange", onVisibilityChange);
      cleanupLenis = () => {
        isRunning = false;
        cancelAnimationFrame(raf);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        lenis.destroy();
      };
    });

    return () => {
      disposed = true;
      isRunning = false;
      cancelAnimationFrame(raf);
      cleanupLenis?.();
    };
  }, []);

  return null;
}
