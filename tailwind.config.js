/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        brand: {
          DEFAULT: "#201895",
          mid: "#2E22B8",
          dark: "#181070",
        },
        msl: {
          bg: "var(--msl-bg)",
          surface: "var(--msl-surface)",
          "surface-elevated": "var(--msl-surface-elevated)",
          glass: "var(--msl-glass)",
          text: "var(--msl-text)",
          muted: "var(--msl-muted)",
          border: "var(--msl-border)",
          accent: "var(--msl-accent)",
          success: "var(--msl-success)",
          warning: "var(--msl-warning)",
          processing: "var(--msl-processing)",
          error: "var(--msl-error)",
        },
      },
      boxShadow: {
        "glow-indigo": "var(--glow-indigo)",
        "glow-indigo-soft": "var(--glow-indigo-soft)",
      },
      backgroundImage: {
        "gradient-cta": "linear-gradient(135deg, #201895, #2E22B8, #181070)",
      },
      borderRadius: {
        msl: "var(--msl-radius)",
      },
    },
  },
  plugins: [],
};
