import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#090909",
        panel: "#141414",
        panelSoft: "#1c1b1f",
        line: "#303036",
        accent: "#4fd1c5",
        rose: "#ff6b8b",
        gold: "#ffd166"
      },
      boxShadow: {
        glow: "0 0 40px rgba(79, 209, 197, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
