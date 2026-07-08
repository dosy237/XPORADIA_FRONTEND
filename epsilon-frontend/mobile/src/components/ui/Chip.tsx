import { ReactNode } from "react";
import { Text, View } from "react-native";

type ChipVariant = "orange" | "navy" | "neutral";

const VARIANT_CLASSES: Record<ChipVariant, string> = {
  orange: "bg-xporadia-orange/12 border-xporadia-orange/25",
  navy: "bg-xporadia-navy border-xporadia-navy",
  neutral: "bg-xporadia-bg border-xporadia-border",
};

const VARIANT_TEXT_CLASSES: Record<ChipVariant, string> = {
  orange: "text-xporadia-orange-text",
  navy: "text-white",
  neutral: "text-xporadia-text-secondary",
};

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  icon?: ReactNode;
}

export function Chip({ label, variant = "orange", icon }: ChipProps) {
  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${VARIANT_CLASSES[variant]}`}
    >
      {icon}
      <Text className={`text-xs font-semibold ${VARIANT_TEXT_CLASSES[variant]}`}>{label}</Text>
    </View>
  );
}
