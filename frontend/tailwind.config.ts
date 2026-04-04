import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Synapse design system — from synapse_uiux.md
        space:   "#050505",
        obsidian: "#0F0F0F",
        steel:   "#1F1F1F",
        cyan:    "#00F0FF",
        purple:  "#7000FF",
        lime:    "#39FF14",
        "text-primary": "#F5F5F5",
        "text-muted":   "#808080",
      },
      fontFamily: {
        sans: ["Inter", "Satoshi", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "IBM Plex Mono", "ui-monospace"],
      },
      letterSpacing: {
        tight: "-0.02em",
      },
      boxShadow: {
        cyan: "0 0 15px rgba(0, 240, 255, 0.1)",
        "cyan-md": "0 0 30px rgba(0, 240, 255, 0.15)",
        purple: "0 0 15px rgba(112, 0, 255, 0.15)",
      },
      backgroundImage: {
        "radial-purple":
          "radial-gradient(circle at top, rgba(112, 0, 255, 0.05), transparent)",
        "radial-cyan":
          "radial-gradient(circle at bottom right, rgba(0, 240, 255, 0.04), transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
