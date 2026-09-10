import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";

import { BookIcon } from "@/components/ui/Icon";

interface ResourceCoverProps {
  uri: string | null;
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
}

/** Couverture d'une ressource — la vraie image si elle existe, sinon un
 * visuel de repli aux couleurs de marque (jamais une image cassée, jamais
 * un carré gris vide) : toutes les ressources n'ont pas encore de
 * couverture dédiée. */
export function ResourceCover({ uri, width, height, borderRadius = 0 }: ResourceCoverProps) {
  if (uri) {
    return (
      <Image source={{ uri }} style={{ width, height, borderRadius }} contentFit="cover" />
    );
  }

  return (
    <LinearGradient
      colors={["#0F172A", "#1E293B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width, height, borderRadius, alignItems: "center", justifyContent: "center" }}
    >
      <BookIcon size={typeof height === "number" ? Math.min(height, 96) * 0.34 : 28} color="#FF7A33" />
    </LinearGradient>
  );
}
