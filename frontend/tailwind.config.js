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
        background: "#0D0D11",
        cardBg: "rgba(30, 30, 38, 0.7)",
        primaryRed: {
          light: "#A82C2C",
          DEFAULT: "#7A1C1C",
          dark: "#521010",
        },
        accentGold: {
          light: "#E5C158",
          DEFAULT: "#D4AF37",
          dark: "#AA7C11",
        },
        slateGray: {
          light: "#94A3B8",
          DEFAULT: "#475569",
          dark: "#1E293B",
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
