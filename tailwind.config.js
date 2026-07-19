/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        universeA: {
          DEFAULT: "#00f3ff",
          glow: "rgba(0, 243, 255, 0.4)",
          dim: "#008891",
        },
        universeB: {
          DEFAULT: "#ff007f",
          glow: "rgba(255, 0, 127, 0.4)",
          dim: "#910048",
        },
        space: {
          950: "#03050c",
          900: "#05070f",
          800: "#0b0f19",
          700: "#131b2e",
          600: "#1d2842",
        },

      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      animation: {
        "pulse-glow": "pulseGlow 2s infinite ease-in-out",
        "radar-spin": "radarSpin 4s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: 0.6, transform: "scale(1)" },
          "50%": { opacity: 1, transform: "scale(1.05)" },
        },
        radarSpin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};
