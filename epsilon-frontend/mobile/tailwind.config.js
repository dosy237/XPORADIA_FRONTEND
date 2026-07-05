/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Design System Xporadia — mêmes tokens que le web (epsilon-frontend/web/tailwind.config.js)
        xporadia: {
          navy: "#1B2A4A",
          orange: "#E8510A",
          bg: "#F5F6F7",
          white: "#FFFFFF",
          green: "#00C07F",
          red: "#E53935",
          gold: "#F5A623",
          purple: "#7B2FFF",
          "text-primary": "#1A1A2E",
          "text-secondary": "#5A6A8A",
          "navy-light": "#2D3F63",
          "orange-light": "#FF6B35",
          border: "#E2E8F0",
        },
      },
      borderRadius: {
        xporadia: "8px",
      },
    },
  },
  plugins: [],
};
