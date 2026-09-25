import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { Colors } from "@/constants/theme";

type ChipVariant = "orange" | "navy" | "navy-subtle" | "neutral";

function withAlpha(hex: string, alpha: number) {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

// Équivalents RN natifs de VARIANT_CLASSES ci-dessous — appliqués via
// `style`, jamais via une classe NativeWind conditionnelle sur ce
// Pressable. Bug amont connu : une className construite par template
// literal avec un fragment shadow-*/opacity-* conditionnel sur
// Pressable/TouchableOpacity casse le contexte de navigation d'Expo
// Router sur Android (voir nativewind/nativewind#1557, #1712) — jamais
// reproductible sur web, ce qui l'a longtemps caché.
const VARIANT_STYLE: Record<ChipVariant, { backgroundColor: string; borderColor: string }> = {
  orange: { backgroundColor: withAlpha(Colors.orange, 0.12), borderColor: withAlpha(Colors.orange, 0.25) },
  navy: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  "navy-subtle": { backgroundColor: withAlpha(Colors.navy, 0.06), borderColor: withAlpha(Colors.navy, 0.15) },
  neutral: { backgroundColor: Colors.bg, borderColor: Colors.border },
};

const VARIANT_TEXT_CLASSES: Record<ChipVariant, string> = {
  orange: "text-xporadia-orange-text",
  navy: "text-white",
  "navy-subtle": "text-xporadia-navy",
  neutral: "text-xporadia-text-secondary",
};

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  icon?: ReactNode;
  onPress?: () => void;
}

export function Chip({ label, variant = "orange", icon, onPress }: ChipProps) {
  const style = { borderWidth: 1, ...VARIANT_STYLE[variant] };
  const content = (
    <>
      {icon}
      <Text className={`text-xs font-semibold ${VARIANT_TEXT_CLASSES[variant]}`}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={4}
        className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 active:opacity-70"
        style={style}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5" style={style}>
      {content}
    </View>
  );
}
