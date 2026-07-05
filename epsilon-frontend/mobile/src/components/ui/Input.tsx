import { forwardRef } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({ label, error, className, ...props }, ref) => {
  return (
    <View className="gap-1.5">
      {label ? <Text className="text-sm font-medium text-xporadia-text-secondary">{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#5A6A8A"
        className={`rounded-xporadia border px-4 py-3 text-base text-xporadia-text-primary ${
          error ? "border-xporadia-red" : "border-xporadia-border"
        } ${className ?? ""}`}
        {...props}
      />
      {error ? <Text className="text-xs text-xporadia-red">{error}</Text> : null}
    </View>
  );
});
Input.displayName = "Input";
