"use client";

import { useEffect, useRef, useState } from "react";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let spotX = mouseX;
    let spotY = mouseY;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      }

      const target = e.target as HTMLElement | null;
      const isInteractive = target?.closest?.(
        'a, button, select, input, [data-cursor="hover"], .glow-border, .property-card, [role="button"]'
      );

      if (ringRef.current) {
        if (isInteractive) {
          ringRef.current.style.width = "64px";
          ringRef.current.style.height = "64px";
          ringRef.current.style.marginLeft = "-32px";
          ringRef.current.style.marginTop = "-32px";
          ringRef.current.style.borderColor = "rgba(232, 121, 249, 0.9)";
          ringRef.current.style.backgroundColor = "rgba(168, 85, 247, 0.08)";
        } else {
          ringRef.current.style.width = "40px";
          ringRef.current.style.height = "40px";
          ringRef.current.style.marginLeft = "-20px";
          ringRef.current.style.marginTop = "-20px";
          ringRef.current.style.borderColor = "rgba(168, 85, 247, 0.6)";
          ringRef.current.style.backgroundColor = "transparent";
        }
      }
    };

    const animate = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px)`;
      }

      spotX += (mouseX - spotX) * 0.12;
      spotY += (mouseY - spotY) * 0.12;
      if (spotRef.current) {
        spotRef.current.style.transform = `translate(${spotX}px, ${spotY}px)`;
      }

      animId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMouseMove);
    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  if (!isClient) return null;

  return (
    <>
      {/* Ambient Spotlight */}
      <div
        ref={spotRef}
        id="cursor-spotlight"
        className="pointer-events-none fixed left-0 top-0 z-[1] -ml-[300px] -mt-[300px] h-[600px] w-[600px] rounded-full opacity-45 blur-[120px] will-change-transform"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.3), transparent 65%)",
        }}
      />

      {/* Cursor Dot */}
      <div
        ref={dotRef}
        id="cursor-dot"
        className="pointer-events-none fixed left-0 top-0 z-[999999] -ml-1 -mt-1 h-2 w-2 rounded-full bg-fuchsia-400 shadow-[0_0_12px_rgba(232,121,249,0.95)] will-change-transform hidden md:block"
      />

      {/* Physics Ring */}
      <div
        ref={ringRef}
        id="cursor-ring"
        className="pointer-events-none fixed left-0 top-0 z-[999998] -ml-5 -mt-5 h-10 w-10 rounded-full border border-violet-400/60 transition-[width,height,margin,border-color,background-color] duration-250 ease-out will-change-transform hidden md:block"
      />
    </>
  );
}
