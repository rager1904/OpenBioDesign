import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      boxShadow: {
        lab: "0 24px 70px rgba(2, 12, 32, 0.42)",
        glow: "0 0 34px rgba(34, 211, 238, 0.2)",
        "glow-sm": "0 0 16px rgba(34, 211, 238, 0.15)",
        "glow-lg": "0 0 60px rgba(34, 211, 238, 0.25)",
        "glow-cyan": "0 0 20px rgba(34, 211, 238, 0.3), 0 0 40px rgba(34, 211, 238, 0.1)",
        "glow-emerald": "0 0 20px rgba(52, 211, 153, 0.3), 0 0 40px rgba(52, 211, 153, 0.1)",
        "glow-amber": "0 0 20px rgba(245, 158, 11, 0.3), 0 0 40px rgba(245, 158, 11, 0.1)",
        "glow-purple": "0 0 20px rgba(167, 139, 250, 0.3), 0 0 40px rgba(167, 139, 250, 0.1)",
        "depth-sm": "0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.15)",
        "depth-md": "0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)",
        "depth-lg": "0 10px 25px rgba(0, 0, 0, 0.35), 0 4px 10px rgba(0, 0, 0, 0.2)",
        "depth-xl": "0 20px 50px rgba(0, 0, 0, 0.4), 0 8px 20px rgba(0, 0, 0, 0.25)",
        "inner-glow": "inset 0 0 30px rgba(34, 211, 238, 0.05)",
        "inner-depth": "inset 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.03)",
      },
      keyframes: {
        "pulse-line": {
          "0%, 100%": { opacity: "0.35", transform: "translateX(-8%)" },
          "50%": { opacity: "0.9", transform: "translateX(18%)" },
        },
        "molecular-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(34, 211, 238, 0.05)" },
          "50%": { boxShadow: "0 0 40px rgba(34, 211, 238, 0.15)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "rotate-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "pulse-line": "pulse-line 3.8s ease-in-out infinite",
        "molecular-pulse": "molecular-pulse 4s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "scan-line": "scan-line 6s linear infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "rotate-slow": "rotate-slow 20s linear infinite",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "scale-in": "scale-in 0.3s ease-out",
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionDuration: {
        400: "400ms",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
