import { Pressable, View } from "react-native";

import { StarIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";

interface StarRatingProps {
  /** Moyenne (ou note choisie) sur 5, peut être décimale pour l'affichage. */
  value: number;
  size?: number;
  /** Fourni uniquement sur la fiche détail — rend les étoiles tactiles. */
  onChange?: (score: number) => void;
}

/** Cinq étoiles pleines/vides, arrondi à l'entier le plus proche pour
 * l'affichage d'une moyenne — cohérent avec le style d'icônes du projet
 * (StarIcon n'a pas de variante demi-étoile, mieux vaut une lecture nette
 * qu'une fausse précision). */
export function StarRating({ value, size = 14, onChange }: StarRatingProps) {
  const roundedValue = Math.round(value);
  return (
    <View className="flex-row items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const star = <StarIcon size={size} color={Colors.gold} filled={n <= roundedValue} />;
        if (!onChange) return <View key={n}>{star}</View>;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Noter ${n} étoile${n > 1 ? "s" : ""}`}
          >
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}
