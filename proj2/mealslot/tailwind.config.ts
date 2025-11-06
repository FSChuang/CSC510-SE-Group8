// --- path: tailwind.config.ts ---
import type { Config } from "tailwindcss";

const config: Config = {
  // Use class strategy so next-themes can flip <html class="dark">
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
};

export default config;
