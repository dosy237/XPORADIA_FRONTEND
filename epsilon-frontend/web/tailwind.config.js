/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ============================================
        // Design System Xporadia
        // Logo analysé : Navy #1B2A4A + Orange #E8510A
        // ============================================
        xporadia: {
          navy:           "#1B2A4A",  // Couleur principale — headers, texte fort
          orange:         "#E8510A",  // Accent — CTA, badges, icônes clés
          bg:             "#F5F6F7",  // Fond général pages intérieures
          white:          "#FFFFFF",
          green:          "#00C07F",  // Succès, certification validée
          red:            "#E53935",  // Erreur, expiration, actions destructives
          gold:           "#F5A623",  // Étoiles, notes, revenus, mérites
          purple:         "#7B2FFF",  // Certification Or/premium
          "text-primary": "#1A1A2E",  // Corps de texte sur fond clair
          "text-secondary":"#5A6A8A", // Labels, métadonnées
          "navy-light":   "#2D3F63",  // Navy allégé pour hover/états
          "orange-light": "#FF6B35",  // Orange hover
          "border":       "#E2E8F0",  // Bordures légères
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        xporadia: "8px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
      },
    },
  },
  plugins: [],
}
