import { Pressable, View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  onPress?: () => void;
  selected?: boolean;
  /** "flat" = discret, bordure fine (listes denses). "raised" = card flottante, ombre douce (défaut, look premium). */
  variant?: "flat" | "raised";
}

export function Card({ children, onPress, selected, variant = "raised", className, ...props }: CardProps) {
  const base = "rounded-xl bg-white p-4";
  const surface =
    variant === "raised"
      ? `shadow-soft ${selected ? "border border-xporadia-orange" : ""}`
      : `border ${selected ? "border-xporadia-orange" : "border-xporadia-border"}`;
  const classes = `${base} ${surface} ${className ?? ""}`;

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${classes} active:opacity-90`} {...props}>
        {children}
      </Pressable>
    );
  }
  return (
    <View className={classes} {...props}>
      {children}
    </View>
  );
}
