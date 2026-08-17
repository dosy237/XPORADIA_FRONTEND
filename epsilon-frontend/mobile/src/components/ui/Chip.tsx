import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type ChipVariant = "orange" | "navy" | "navy-subtle" | "neutral";

const VARIANT_CLASSES: Record<ChipVariant, string> = {
  orange: "bg-xporadia-orange/12 border-xporadia-orange/25",
  navy: "bg-xporadia-navy border-xporadia-navy",
  "navy-subtle": "bg-xporadia-navy/[0.06] border-xporadia-navy/15",
  neutral: "bg-xporadia-bg border-xporadia-border",
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
  const classes = `flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${VARIANT_CLASSES[variant]}`;
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
        className={`${classes} active:opacity-70`}
      >
        {content}
      </Pressable>
    );
  }

  return <View className={classes}>{content}</View>;
}
