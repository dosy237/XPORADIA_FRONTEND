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
          bronze: "#B45309",
          silver: "#94A3B8",
          purple: "#7B2FFF",
          teal: "#0D9488",
          "text-primary": "#0F172A",
          // #5A6A8A tenait déjà ~5.4:1 sur fond blanc (limite WCAG AA pour
          // texte normal) mais sans marge une fois affiché en petite taille
          // sur un écran réel — #4A5B78 tient ~6.9:1, une marge confortable.
          "text-secondary": "#4A5B78",
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
        // Échelle premium — cards flottantes, pas de coins vifs. Inspirée
        // des UI kits de référence (Belt, Schedula, Logistics) : radius
        // généreux sur les surfaces, pill sur les CTA.
        sm: "10px",
        md: "16px",
        lg: "20px",
        xl: "24px",
        "2xl": "28px",
      },
      boxShadow: {
        // Ombre très diffuse, quasi imperceptible — sépare la card du fond
        // sans jamais paraître "posée dessus". C'est la clé du look premium
        // observé dans les inspirations (peu de contraste d'ombre).
        soft: "0 2px 12px 0 rgb(15 23 42 / 0.06)",
        card: "0 4px 16px 0 rgb(27 42 74 / 0.12)",
        // Ombre plus prononcée pour les écrans "feature" (profil, futurs
        // modules) — profondeur marquée plutôt que discrète.
        deep: "0 16px 40px 0 rgb(15 23 42 / 0.28)",
        "deep-orange": "0 10px 28px 0 rgb(251 84 6 / 0.35)",
      },
      fontFamily: {
        // Placeholder tant qu'aucune police custom n'est chargée dans
        // app.json — à remplacer par une famille chargée via useFonts
        // (ex. Manrope / Plus Jakarta Sans) pour un rendu vraiment premium.
        // Voir note en fin de réponse.
      },
    },
  },
  plugins: [],
};
