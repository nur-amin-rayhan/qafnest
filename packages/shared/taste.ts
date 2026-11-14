/**
 * Taste Skill Principles: Boldness, Motion Intensity, and Visual Density
 * Applied to QafNest interfaces for natural, physics-based UI dynamism.
 */

export interface TastePreset {
  boldness: number; // 1-10
  motionIntensity: number; // 1-10
  density: "compact" | "balanced" | "airy";
}

export const TASTE_CONFIGS: Record<"guest" | "host" | "admin", TastePreset> = {
  guest: {
    boldness: 8.5,
    motionIntensity: 7.0,
    density: "airy",
  },
  host: {
    boldness: 7.5,
    motionIntensity: 6.0,
    density: "balanced",
  },
  admin: {
    boldness: 6.5,
    motionIntensity: 4.5,
    density: "compact",
  },
};

/**
 * Spring configurations calibrated for natural micro-interactions
 */
export const TASTE_SPRINGS = {
  snappy: {
    type: "spring",
    stiffness: 450,
    damping: 30,
    mass: 0.8,
  },
  gentle: {
    type: "spring",
    stiffness: 300,
    damping: 26,
    mass: 1.0,
  },
  bouncy: {
    type: "spring",
    stiffness: 500,
    damping: 22,
    mass: 0.9,
  },
} as const;

/**
 * Framer Motion Animation Variants conforming to Taste and A11y
 */
export const TASTE_VARIANTS = {
  // Staggered list container
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.05,
      },
    },
  },

  // Item fade & slide
  item: {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 28,
      },
    },
  },

  // Interactive card hover
  cardHover: {
    rest: { y: 0, scale: 1 },
    hover: {
      y: -3,
      scale: 1.008,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
    tap: {
      y: 0,
      scale: 0.99,
      transition: {
        type: "spring",
        stiffness: 600,
        damping: 30,
      },
    },
  },

  // Interactive button press
  buttonPress: {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.97 },
  },
} as const;

/**
 * Density class mappings for responsive padding and spacing
 */
export const TASTE_DENSITY_CLASSES = {
  airy: {
    card: "p-6 sm:p-7 lg:p-8",
    section: "py-12 sm:py-16 lg:py-24",
    gap: "gap-6 lg:gap-8",
    input: "px-4 py-3.5 text-base min-h-[48px]",
  },
  balanced: {
    card: "p-4 sm:p-5 lg:p-6",
    section: "py-8 sm:py-12 lg:py-16",
    gap: "gap-4 lg:gap-6",
    input: "px-3.5 py-2.5 text-sm min-h-[44px]",
  },
  compact: {
    card: "p-3 sm:p-4",
    section: "py-4 sm:py-6 lg:py-8",
    gap: "gap-3",
    input: "px-3 py-2 text-xs sm:text-sm min-h-[40px] sm:min-h-[44px]",
  },
} as const;

