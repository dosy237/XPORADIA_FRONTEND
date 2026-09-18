import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface StatBoxProps {
  icon: ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
}

/** Tuile icône + valeur + libellé, utilisée sur tous les écrans de profil
 * (enseignant, directeur, entreprise, annuaire, offre de stage). `onPress`
 * optionnel — utilisé pour la localisation, qui ouvre Google Maps. */
export function StatBox({ icon, label, value, onPress }: StatBoxProps) {
  const content = (
    <>
      <View className="h-9 w-9 rounded-full bg-white items-center justify-center shadow-card">{icon}</View>
      <Text className="text-sm font-bold text-xporadia-navy text-center" numberOfLines={2}>
        {value}
      </Text>
      <Text className="text-[11px] text-xporadia-text-secondary">{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label} : ${value}`}
        className="flex-1 bg-xporadia-bg rounded-2xl p-3 gap-2 items-center active:opacity-70"
      >
        {content}
      </Pressable>
    );
  }

  return <View className="flex-1 bg-xporadia-bg rounded-2xl p-3 gap-2 items-center">{content}</View>;
}
