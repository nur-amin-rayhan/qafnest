"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Lenis smooth scroll from the reference project.
 * Adds silky inertia momentum to window scrolling, making all Framer Motion
 * scroll reveals glide smoothly without abrupt jumps.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let raf = 0;
    let isRunning = true;

    const loop = (time: number) => {
      if (isRunning) {
        lenis.raf(time);
        raf = requestAnimationFrame(loop);
      }
    };
    raf = requestAnimationFrame(loop);

    const onVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(raf);
      } else {
        if (!isRunning) {
          isRunning = true;
          raf = requestAnimationFrame(loop);
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isRunning = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      lenis.destroy();
    };
  }, []);

  return null;
}
