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
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      colors: {
        brand: {
          50: "#fdf4f3",
          100: "#fbe8e6",
          200: "#f7d5d1",
          300: "#f0b7b0",
          400: "#e68d82",
          500: "#d96759",
          600: "#c54c3d",
          700: "#a53c2f",
          800: "#89352b",
          900: "#723129",
          950: "#421611",
        },
      },
    },
  },
  plugins: [],
};
export default config;
