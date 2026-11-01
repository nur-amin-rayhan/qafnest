"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const variantsMap: Record<string, Variants> = {
  up: {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0 },
  },
  down: {
    hidden: { opacity: 0, y: -40 },
    show: { opacity: 1, y: 0 },
  },
  left: {
    hidden: { opacity: 0, x: 60 },
    show: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: -60 },
    show: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1 },
  },
};

export default function Reveal({
  children,
  as = "div",
  variant = "up",
  delay = 0,
  className,
  amount = 0.1,
}: {
  children: ReactNode;
  as?: "div" | "section" | "li" | "span";
  variant?: keyof typeof variantsMap;
  delay?: number;
  className?: string;
  amount?: number;
}) {
  const MotionTag = (motion[as] as typeof motion.div) || motion.div;
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={variantsMap[variant]}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
