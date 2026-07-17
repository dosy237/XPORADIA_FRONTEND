import { Colors } from "@/constants/theme";
import type { CertificationLevel } from "@/services/certification";

export const LEVEL_ORDER: CertificationLevel[] = ["bronze", "silver", "gold"];

export const LEVEL_LABELS: Record<CertificationLevel, string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
};

export const LEVEL_COLORS: Record<CertificationLevel, string> = {
  bronze: Colors.bronze,
  silver: Colors.silver,
  gold: Colors.gold,
};

export const CATEGORY_LABELS: Record<string, string> = {
  pedagogy: "Pédagogie générale",
  didactics: "Didactique disciplinaire",
  management: "Gestion de classe",
  ethics: "Éthique professionnelle",
  leadership: "Leadership pédagogique",
};
