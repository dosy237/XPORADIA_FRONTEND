import "@/global.css";

// Design System Xporadia — mêmes tokens que le web (voir tailwind.config.js)
export const Colors = {
  navy: "#1B2A4A",
  orange: "#E8510A",
  bg: "#F5F6F7",
  white: "#FFFFFF",
  green: "#00C07F",
  red: "#E53935",
  gold: "#F5A623",
  purple: "#7B2FFF",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6A8A",
  navyLight: "#2D3F63",
  orangeLight: "#FF6B35",
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
