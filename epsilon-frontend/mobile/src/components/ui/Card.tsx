import { Pressable, View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  onPress?: () => void;
  selected?: boolean;
}

export function Card({ children, onPress, selected, className, ...props }: CardProps) {
  const classes = `rounded-xporadia bg-white border p-4 ${
    selected ? "border-xporadia-orange" : "border-xporadia-border"
  } ${className ?? ""}`;

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={classes} {...props}>
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
