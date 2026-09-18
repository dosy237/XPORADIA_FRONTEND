import { Colors } from "@/constants/theme";
import type { CertificationLevel } from "@/services/certification";

export const LEVEL_ORDER: CertificationLevel[] = ["zero", "bronze", "silver", "gold", "platinum", "diamond"];

export const LEVEL_LABELS: Record<CertificationLevel, string> = {
  zero: "Zéro",
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
  platinum: "Platine",
  diamond: "Diamant",
};

export const LEVEL_COLORS: Record<CertificationLevel, string> = {
  zero: Colors.zeroLevel,
  bronze: Colors.bronze,
  silver: Colors.silver,
  gold: Colors.gold,
  platinum: Colors.platinum,
  diamond: Colors.purple,
};

export const CATEGORY_LABELS: Record<string, string> = {
  pedagogy: "Pédagogie générale",
  didactics: "Didactique disciplinaire",
  management: "Gestion de classe",
  ethics: "Éthique professionnelle",
  leadership: "Leadership pédagogique",
};
