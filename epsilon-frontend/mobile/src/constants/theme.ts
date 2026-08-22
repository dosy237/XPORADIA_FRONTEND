import "@/global.css";

// Design System Xporadia — couleurs exactes extraites du logo fourni (voir tailwind.config.js)
export const Colors = {
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
  platinum: "#38BDF8",
  teal: "#0D9488",
  zeroLevel: "#CBD5E1",
  textPrimary: "#0F172A",
  textSecondary: "#4A5B78",
  navyLight: "#1E293B",
  orangeLight: "#FF7A33",
  border: "#E2E8F0",
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// Échelle typographique — usage : `text-display`, `font-bold` etc. via
// NativeWind (voir tailwind.config.js) ou directement ces valeurs en style
// inline pour les rares cas hors classes (mesures dynamiques, etc.).
// Rythme : display (hero), h1 (titre d'écran), h2 (section), body, caption, micro.
export const Typography = {
  display: { fontSize: 30, lineHeight: 36 },
  h1: { fontSize: 24, lineHeight: 30 },
  h2: { fontSize: 18, lineHeight: 24 },
  body: { fontSize: 15, lineHeight: 22 },
  caption: { fontSize: 13, lineHeight: 18 },
  micro: { fontSize: 11, lineHeight: 14 },
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  full: 999,
} as const;
