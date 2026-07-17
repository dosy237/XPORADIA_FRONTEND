import { Text, View } from "react-native";

export function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <View className="gap-2 mb-2">
      <View className="flex-row gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            className={`flex-1 h-1.5 rounded-full ${i < step ? "bg-xporadia-orange" : "bg-xporadia-border"}`}
          />
        ))}
      </View>
      <Text className="text-xs text-xporadia-text-secondary">
        Étape {step}/{total}
      </Text>
    </View>
  );
}
