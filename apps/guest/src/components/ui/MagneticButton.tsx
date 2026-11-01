"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "ghost";
  className?: string;
  strength?: number;
  rounded?: string;
}

/**
 * Magnetic physics button from the reference project.
 * Gently eases toward the cursor on hover using Framer Motion springs.
 */
export default function MagneticButton({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  strength = 0.35,
  rounded = "rounded-full",
}: Props) {
  const ref = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16 });
  const sy = useSpring(y, { stiffness: 220, damping: 16 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - (rect.left + rect.width / 2);
    const my = e.clientY - (rect.top + rect.height / 2);
    x.set(mx * strength);
    y.set(my * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const base = `group relative inline-flex items-center justify-center gap-2 ${rounded} px-6 py-3.5 text-xs sm:text-sm font-bold tracking-wider transition-all duration-300 cursor-pointer`;
  const styles =
    variant === "primary"
      ? "text-white bg-luxe-gradient shadow-glow hover:shadow-glow-lg"
      : "text-muted glass hover:border-violet-400/40 hover:text-fg";

  const inner = (
    <>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {variant === "primary" && (
        <span className={`absolute inset-0 ${rounded} bg-white/0 transition-colors duration-300 group-hover:bg-white/10`} />
      )}
    </>
  );

  if (href) {
    return (
      <motion.a
        ref={ref}
        href={href}
        onClick={onClick}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        style={{ x: sx, y: sy }}
        className={`${base} ${styles} ${className}`}
      >
        {inner}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      className={`${base} ${styles} ${className}`}
    >
      {inner}
    </motion.button>
  );
}
