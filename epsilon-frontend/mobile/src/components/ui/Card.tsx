import { Pressable, View, ViewProps } from "react-native";

import { Colors } from "@/constants/theme";

interface CardProps extends ViewProps {
  onPress?: () => void;
  selected?: boolean;
  /** "flat" = discret, bordure fine (listes denses). "raised" = card flottante, ombre douce (défaut, look premium). */
  variant?: "flat" | "raised";
}

// Équivalent RN natif de `shadow-soft` (voir tailwind.config.js, boxShadow).
const RAISED_SHADOW = {
  shadowColor: Colors.navy,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 2,
};

/** `onPress` fait de cette Card un Pressable — className y reste toujours
 * littérale (jamais interpolée avec un fragment conditionnel lié à
 * `selected`/`variant`) : un bug amont connu de NativeWind casse le
 * contexte de navigation d'Expo Router sur Android dès qu'un Pressable
 * reçoit une classe shadow ou opacity conditionnelle (voir
 * nativewind/nativewind#1557, #1712 — jamais reproductible sur web, ce
 * qui l'a longtemps caché). Tout ce qui dépend de `selected`/`variant`
 * passe donc par `style`, jamais par la className du Pressable lui-même. */
export function Card({ children, onPress, selected, variant = "raised", className, style, ...props }: CardProps) {
  const base = "rounded-xl bg-white p-4";
  const classes = `${base} ${className ?? ""}`;

  const dynamicStyle = [
    variant === "raised" ? RAISED_SHADOW : { borderWidth: 1, borderColor: Colors.border },
    selected ? { borderWidth: 1, borderColor: Colors.orange } : null,
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${classes} active:opacity-90`} style={dynamicStyle} {...props}>
        {children}
      </Pressable>
    );
  }
  return (
    <View className={classes} style={dynamicStyle} {...props}>
      {children}
    </View>
  );
}
