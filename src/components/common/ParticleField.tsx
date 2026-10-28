"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  z: number;
  r: number;
  baseA: number;
  tw: number;
};

/**
 * Full-page galaxy particle field from the reference project.
 * Drifts slowly, twinkles, and gently parallaxes toward the cursor.
 * Ultra-lightweight with pre-rendered glow dot sprite.
 */
export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let raf = 0;
    let t = 0;

    // Pre-rendered glow dot sprite for 60fps performance without per-frame shadowBlur
    const sprite = document.createElement("canvas");
    const SPRITE = 32;
    sprite.width = SPRITE;
    sprite.height = SPRITE;
    const sctx = sprite.getContext("2d");
    if (sctx) {
      const sg = sctx.createRadialGradient(
        SPRITE / 2,
        SPRITE / 2,
        0,
        SPRITE / 2,
        SPRITE / 2,
        SPRITE / 2
      );
      sg.addColorStop(0, "rgba(232, 121, 249, 1)");
      sg.addColorStop(0.35, "rgba(192, 132, 252, 0.8)");
      sg.addColorStop(1, "rgba(168, 85, 247, 0)");
      sctx.fillStyle = sg;
      sctx.fillRect(0, 0, SPRITE, SPRITE);
    }

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(160, Math.floor((w * h) / 12000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 1 + 0.3,
        r: Math.random() * 1.6 + 0.3,
        baseA: Math.random() * 0.5 + 0.15,
        tw: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      t += 0.005;
      mouse.current.x += (mouse.current.tx - mouse.current.x) * 0.05;
      mouse.current.y += (mouse.current.ty - mouse.current.y) * 0.05;
      const px = (mouse.current.x - 0.5) * 40;
      const py = (mouse.current.y - 0.5) * 40;

      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.y -= p.z * 0.12;
        if (p.y < -5) {
          p.y = h + 5;
          p.x = Math.random() * w;
        }
        const twinkle = reduce ? 1 : 0.6 + Math.sin(t * 2 + p.tw) * 0.4;
        const a = p.baseA * twinkle;
        const dx = p.x + px * p.z;
        const dy = p.y + py * p.z;

        const s = p.r * p.z * 7;
        ctx.globalAlpha = a;
        ctx.drawImage(sprite, dx - s / 2, dy - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    const onMove = (e: MouseEvent) => {
      mouse.current.tx = e.clientX / w;
      mouse.current.ty = e.clientY / h;
    };

    build();
    draw();
    window.addEventListener("resize", build);
    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-60"
    />
  );
}
