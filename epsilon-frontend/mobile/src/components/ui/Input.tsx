import { forwardRef, useState } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Icône affichée à gauche du champ (ex. loupe pour un champ de recherche). */
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, leftIcon, className, onFocus, onBlur, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    const borderClass = error
      ? "border-xporadia-red"
      : focused
        ? "border-xporadia-navy"
        : "border-transparent";

    return (
      <View className="gap-1.5">
        {label ? <Text className="text-sm font-medium text-xporadia-text-secondary">{label}</Text> : null}
        <View className="relative justify-center">
          {leftIcon ? <View className="absolute left-4 z-10">{leftIcon}</View> : null}
          <TextInput
            ref={ref}
            placeholderTextColor="#94A3B8"
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={leftIcon ? [{ paddingLeft: 44 }, style] : style}
            className={`rounded-xl border-2 bg-xporadia-bg px-4 py-3.5 text-base text-xporadia-text-primary ${borderClass} ${className ?? ""}`}
            {...props}
          />
        </View>
        {error ? <Text className="text-xs text-xporadia-red">{error}</Text> : null}
      </View>
    );
  },
);
Input.displayName = "Input";
