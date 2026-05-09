import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        blush: "#ffd6e8",
        lavender: "#c7b7ff",
        mint: "#b8f5d0",
        skysoft: "#b8e7ff",
        ink: "#172033"
      },
      boxShadow: {
        soft: "0 24px 60px rgba(104, 84, 180, 0.18)",
        card: "0 14px 35px rgba(31, 41, 55, 0.10)"
      }
    },
  },
  plugins: [],
};

export default config;
