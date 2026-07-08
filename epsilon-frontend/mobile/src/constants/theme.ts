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
  purple: "#7B2FFF",
  textPrimary: "#0F172A",
  textSecondary: "#5A6A8A",
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
