import { useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

interface OtpInputProps {
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
}

export function OtpInput({ value, onChangeText, length = 6, autoFocus }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Pressable onPress={() => inputRef.current?.focus()} className="relative">
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(v) => onChangeText(v.replace(/\D/g, "").slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        className="absolute inset-0 opacity-0"
        accessibilityLabel="Code de vérification"
      />
      <View className="flex-row justify-between" pointerEvents="none">
        {digits.map((digit, i) => {
          const isActive = i === activeIndex && value.length < length;
          const isFilled = digit !== "";
          return (
            <View
              key={i}
              className={`h-14 w-12 items-center justify-center rounded-xl border-2 ${
                isFilled
                  ? "border-xporadia-navy bg-white"
                  : isActive
                    ? "border-xporadia-orange bg-white"
                    : "border-transparent bg-xporadia-bg"
              }`}
            >
              <Text className="text-xl font-bold text-xporadia-navy">{digit}</Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}
