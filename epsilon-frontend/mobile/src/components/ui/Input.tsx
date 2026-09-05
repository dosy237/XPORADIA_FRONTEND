import { forwardRef, useState } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

import { Colors } from "@/constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Icône affichée à gauche du champ (ex. loupe pour un champ de recherche). */
  leftIcon?: React.ReactNode;
}

// La couleur de bordure (erreur / focus / neutre) passe par `style`, jamais
// par un fragment conditionnel dans la className : même précaution que sur
// Button/Card/Chip (voir Card.tsx) — évite tout risque lié au bug amont
// NativeWind sur Android avec une className interpolée conditionnellement.
const BORDER_COLOR = {
  error: Colors.red,
  focused: Colors.navy,
  idle: "transparent",
};

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, leftIcon, className, onFocus, onBlur, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    const borderColor = error ? BORDER_COLOR.error : focused ? BORDER_COLOR.focused : BORDER_COLOR.idle;

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
            style={[{ borderColor }, leftIcon ? { paddingLeft: 44 } : null, style]}
            className={`rounded-xl border-2 bg-xporadia-bg px-4 py-3.5 text-base text-xporadia-text-primary ${className ?? ""}`}
            {...props}
          />
        </View>
        {error ? <Text className="text-xs text-xporadia-red">{error}</Text> : null}
      </View>
    );
  },
);
Input.displayName = "Input";
