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
          // Orange de marque en texte sur fond clair : #FB5406 ne tient qu'à
          // ~3.3:1 (limite WCAG AA). #C2410C tient 5.2:1 — utilisé pour les
          // liens/texte, le orange plein reste réservé aux fonds/boutons.
          "orange-text": "#C2410C",
          border: "#E2E8F0",
        },
      },
      borderRadius: {
        xporadia: "8px",
      },
      boxShadow: {
        card: "0 4px 16px 0 rgb(27 42 74 / 0.12)",
        // Ombre plus prononcée pour les écrans "feature" (profil, futurs
        // modules) — profondeur marquée plutôt que discrète.
        deep: "0 16px 40px 0 rgb(15 23 42 / 0.28)",
        "deep-orange": "0 10px 28px 0 rgb(251 84 6 / 0.35)",
      },
    },
  },
  plugins: [],
};
