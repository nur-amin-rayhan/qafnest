/**
 * QafNest Design System Tokens
 * Conforming to VoltAgent Awesome DESIGN.md and Vercel Web Design Guidelines.
 */

export const DESIGN_TOKENS = {
  colors: {
    dark: {
      bg: "#06060B",
      bgSoft: "#0A0A14",
      bgCard: "#0E0E1A",
      bgCardHover: "#161626",
      fgPrimary: "#FFFFFF",
      fgSecondary: "rgba(255, 255, 255, 0.88)",
      fgMuted: "#94A3B8",
      fgSubtle: "#64748B",
      lineSubtle: "rgba(255, 255, 255, 0.08)",
      lineFocus: "rgba(168, 85, 247, 0.50)",
    },
    light: {
      bg: "#FFFFFF",
      bgSoft: "#F8FAFC",
      bgCard: "#FFFFFF",
      bgCardHover: "#F1F5F9",
      fgPrimary: "#0F172A",
      fgSecondary: "#334155",
      fgMuted: "#64748B",
      fgSubtle: "#94A3B8",
      lineSubtle: "#E2E8F0",
      lineFocus: "rgba(124, 58, 237, 0.50)",
    },
    brand: {
      violet50: "#F5F0FF",
      violet200: "#E9D8FF",
      violet300: "#C084FC",
      violet400: "#A855F7",
      violet500: "#9333EA",
      violet600: "#7C3AED",
      violet700: "#6D28D9",
      violet900: "#3B0764",
      glow: "rgba(124, 58, 237, 0.25)",
    },
    status: {
      emerald: "#059669",
      emeraldGlow: "rgba(5, 150, 105, 0.20)",
      amber: "#D97706",
      amberGlow: "rgba(217, 119, 6, 0.20)",
      rose: "#E11D48",
      roseGlow: "rgba(225, 29, 72, 0.20)",
    },
  },

  typography: {
    fontFamilies: {
      display: "var(--font-display, var(--font-geist, system-ui))",
      body: "var(--font-body, var(--font-geist, system-ui))",
      arabic: "var(--font-arabic, 'DINNextLTArabic', system-ui)",
      mono: "var(--font-mono, 'GeistMonoVF', 'JetBrains Mono', monospace)",
    },
    scale: {
      heroDisplay: { size: "3.5rem", lineHeight: "1.1", letterSpacing: "-0.025em" },
      h1: { size: "2.5rem", lineHeight: "1.2", letterSpacing: "-0.02em" },
      h2: { size: "1.75rem", lineHeight: "1.3", letterSpacing: "-0.015em" },
      h3: { size: "1.25rem", lineHeight: "1.4", letterSpacing: "-0.01em" },
      bodyLarge: { size: "1.125rem", lineHeight: "1.6", letterSpacing: "normal" },
      body: { size: "0.9375rem", lineHeight: "1.6", letterSpacing: "normal" },
      caption: { size: "0.8125rem", lineHeight: "1.4", letterSpacing: "0.01em" },
      micro: { size: "0.6875rem", lineHeight: "1.3", letterSpacing: "0.04em" },
    },
  },

  spacing: {
    1: "0.25rem",   // 4px
    2: "0.5rem",    // 8px
    3: "0.75rem",   // 12px
    4: "1rem",      // 16px
    5: "1.25rem",   // 20px
    6: "1.5rem",    // 24px
    8: "2rem",      // 32px
    10: "2.5rem",   // 40px
    12: "3rem",     // 48px
    16: "4rem",     // 64px
    20: "5rem",     // 80px
    24: "6rem",     // 96px
  },

  radii: {
    sm: "0.25rem",   // 4px
    md: "0.375rem",  // 6px - micro tags, dropdown items
    lg: "0.5rem",    // 8px - buttons, inputs
    xl: "0.75rem",   // 12px - sub-cards
    "2xl": "1rem",   // 16px - property cards
    "3xl": "1.5rem", // 24px - modals, hero containers
    full: "9999px",  // pills, avatars
  },

  shadows: {
    card: "0 4px 20px -2px rgba(0, 0, 0, 0.45)",
    cardHover: "0 12px 32px -4px rgba(0, 0, 0, 0.65), 0 0 24px -2px rgba(124, 58, 237, 0.18)",
    popover: "0 20px 48px -8px rgba(0, 0, 0, 0.75)",
    brandGlow: "0 0 40px rgba(168, 85, 247, 0.35)",
  },

  // Vercel Web Design Guidelines: Minimum 44px Touch Targets
  accessibility: {
    minTouchTargetSizePx: 44,
    minTouchTargetClass: "min-h-[44px] min-w-[44px]",
    focusRingClass: "focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060B] focus-visible:outline-none",
    reducedMotionClass: "motion-reduce:transition-none motion-reduce:transform-none",
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;

