import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        violet: {
          50: '#F5F0FF',
          200: '#E9D8FF',
          300: '#C084FC',
          400: '#A855F7',
          500: '#9333EA',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        fuchsia: {
          400: '#E879F9',
          500: '#D946EF',
        },
        ink: {
          DEFAULT: 'rgb(var(--bg) / <alpha-value>)',
          soft: 'rgb(var(--bg-soft) / <alpha-value>)',
          card: 'rgb(var(--bg-card) / <alpha-value>)',
        },
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--fg-muted) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        contrast: 'rgb(var(--on-brand) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'luxe-gradient': 'linear-gradient(135deg, #6D28D9, #9333EA, #A855F7, #C084FC)',
        'radial-glow': 'radial-gradient(circle at center, rgba(168, 85, 247, 0.35), transparent 70%)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(168, 85, 247, 0.35)',
        'glow-lg': '0 0 80px rgba(168, 85, 247, 0.5)',
        luxe: '0 30px 80px -30px rgba(88, 28, 135, 0.6)',
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-18px)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.06)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        marquee: "marquee 35s linear infinite",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin-slow 22s linear infinite",
        "spin-slower": "spin-slow 40s linear infinite reverse",
        pulseGlow: "pulseGlow 5s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
