import { ActivityIndicator, Pressable, Text } from "react-native";

type Variant = "primary" | "secondary" | "navy" | "danger";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  pill?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-xporadia-orange active:bg-xporadia-orange-light",
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

export function Button({ label, onPress, variant = "primary", loading, disabled, pill }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`${pill ? "rounded-full" : "rounded-xporadia"} items-center justify-center py-3.5 px-4 ${
        VARIANT_CLASSES[variant]
      } ${isDisabled ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? "#1B2A4A" : "#FFFFFF"} />
      ) : (
        <Text className={`font-semibold text-base ${VARIANT_TEXT_CLASSES[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
