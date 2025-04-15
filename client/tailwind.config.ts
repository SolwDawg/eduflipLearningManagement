import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      colors: {
        // Các màu nền và đường viền tổng quát
        border: "#E0E0E0",
        input: "#FFFFFF",
        ring: "#91A7FF",
        background: "#FFFBF0", // màu nền chính sáng và ấm áp
        foreground: "#333333",
        destructive: {
          DEFAULT: "#FF8A80",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F1F1F1",
          foreground: "#777777",
        },
        accent: {
          DEFAULT: "#FFCC80", // màu cam pastel tươi sáng
          foreground: "#663300",
        },
        popover: {
          DEFAULT: "#FFE9B6", // vàng nhạt pastel
          foreground: "#663300",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#333333",
        },
        sidebar: {
          DEFAULT: "#FFF7E6",
          foreground: "#333333",
          primary: "#A7C7E7", // xanh dương pastel
          "primary-foreground": "#FFFFFF",
          accent: "#F7A4A4", // hồng nhạt pastel
          "accent-foreground": "#FFFFFF",
          border: "#FFE4C4",
          ring: "#FFDFBA",
        },
        customgreys: {
          primarybg: "#FFFBF0", // beige rất nhẹ
          secondarybg: "#FFF1E0",
          darkGrey: "#CCCCCC",
          darkerGrey: "#B3B3B3",
          dirtyGrey: "#A9A9A9",
        },
        // Palette màu chính với dải tông pastel
        primary: {
          "50": "#EFF6FF",
          "100": "#DBEDFF",
          "200": "#B7DBFF",
          "300": "#8AC8FF",
          "400": "#5DB6FF",
          "500": "#42A0FF",
          "600": "#2B8AFF",
          "700": "#1574FF",
          "750": "#005CFF",
          "800": "#0047CC",
          "900": "#003399",
          "950": "#002366",
          DEFAULT: "#5DB6FF",
          foreground: "#FFFFFF",
        },
        secondary: {
          "50": "#F3E5F5",
          "100": "#E1BEE7",
          "200": "#CE93D8",
          "300": "#BA68C8",
          "400": "#AB47BC",
          "500": "#9C27B0",
          "600": "#8E24AA",
          "700": "#7B1FA2",
          "800": "#6A1B9A",
          "900": "#4A148C",
          "950": "#3E1279",
          DEFAULT: "#AB47BC",
          foreground: "#FFFFFF",
        },
        white: {
          "50": "#F5F5F5",
          "100": "#FFFFFF",
        },
        tertiary: {
          "50": "#FFF9C4", // vàng nhạt pastel
        },
        chart: {
          "1": "#FFD54F", // vàng
          "2": "#4FC3F7", // xanh da trời nhạt
          "3": "#81C784", // xanh lá cây nhẹ
          "4": "#BA68C8", // tím nhạt
          "5": "#FF8A65", // cam hồng
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        sans: ["var(--font-roboto)"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        md: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
      },
    },
  },
  plugins: [require("tailwindcss-animate"), "prettier-plugin-tailwindcss"],
} satisfies Config;

export default config;
