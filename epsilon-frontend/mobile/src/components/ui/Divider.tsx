import { Text, View } from "react-native";

export function Divider({ label }: { label: string }) {
  return (
    <View className="flex-row items-center gap-3 my-1">
      <View className="flex-1 h-px bg-xporadia-border" />
      <Text className="text-xporadia-text-secondary text-xs uppercase tracking-wide">{label}</Text>
      <View className="flex-1 h-px bg-xporadia-border" />
    </View>
  );
}
