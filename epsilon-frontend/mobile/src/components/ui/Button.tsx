import { ActivityIndicator, Pressable, Text } from "react-native";

type Variant = "primary" | "secondary" | "navy" | "danger";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  pill?: boolean;
  accessibilityLabel?: string;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-xporadia-orange active:bg-xporadia-orange-light shadow-deep-orange",
  secondary: "bg-white border border-xporadia-border active:bg-xporadia-bg",
  navy: "bg-xporadia-navy active:bg-xporadia-navy-light",
  danger: "bg-xporadia-red active:opacity-90",
};

const VARIANT_TEXT_CLASSES: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-xporadia-text-primary",
  navy: "text-white",
  danger: "text-white",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  pill,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={4}
      className={`${pill ? "rounded-full" : "rounded-xl"} items-center justify-center py-4 px-5 ${
        VARIANT_CLASSES[variant]
      } ${isDisabled ? "opacity-50 shadow-none" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? "#0F172A" : "#FFFFFF"} />
      ) : (
        <Text className={`font-semibold text-base ${VARIANT_TEXT_CLASSES[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
