/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Sunsama-inspired calm palette. See ../DESIGN_GUIDELINES.md.
        canvas: "#f7f6f3", // warm off-white app background
        surface: "#ffffff", // cards, panels
        ink: {
          DEFAULT: "#2b2a35", // primary text — soft near-black
          muted: "#6b6a78", // secondary text
          subtle: "#9b9aa6", // tertiary / placeholder
        },
        line: "#ebe9e4", // hairline borders
        primary: {
          DEFAULT: "#6c5ce7", // signature indigo/violet
          hover: "#5a4bd4",
          soft: "#efedfd", // tinted background for selected/hover
        },
        accent: "#ff7a59", // warm coral for highlights / focus moments
        success: "#3bbf86",
        warning: "#f2b34a",
        danger: "#e5604d",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "14px",
        control: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(43, 42, 53, 0.04), 0 4px 16px rgba(43, 42, 53, 0.06)",
        pop: "0 8px 30px rgba(43, 42, 53, 0.12)",
      },
      fontSize: {
        // Comfortable, slightly tightened type scale.
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],
        base: ["0.9375rem", { lineHeight: "1.5rem" }],
      },
    },
  },
  plugins: [],
};
