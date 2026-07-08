/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Design System Xporadia — couleurs exactes extraites du fichier logo
        // fourni (Xporadia_logo_original_vectorise.svg : #0F172A / #FB5406),
        // corrigées par rapport à l'estimation initiale du web (#1B2A4A / #E8510A).
        xporadia: {
          navy: "#0F172A",
          orange: "#FB5406",
          bg: "#F8F8F8",
          white: "#FFFFFF",
          green: "#00C07F",
          red: "#E53935",
          gold: "#F5A623",
          purple: "#7B2FFF",
          "text-primary": "#0F172A",
          "text-secondary": "#5A6A8A",
          "navy-light": "#1E293B",
          "orange-light": "#FF7A33",
          border: "#E2E8F0",
        },
      },
      borderRadius: {
        xporadia: "8px",
      },
      boxShadow: {
        card: "0 4px 16px 0 rgb(27 42 74 / 0.12)",
      },
    },
  },
  plugins: [],
};
