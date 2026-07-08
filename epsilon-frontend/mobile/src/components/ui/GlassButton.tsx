import { BlurView } from "expo-blur";
import { Pressable, Text, View } from "react-native";

interface GlassButtonProps {
  label: string;
  onPress: () => void;
}

// Bouton "verre dépoli" pour les écrans posés sur une image/photo (cover,
// hero) — inspiré du rendu des boutons de la maquette Taxo, adapté en verre
// translucide plutôt qu'en aplat de couleur.
export function GlassButton({ label, onPress }: GlassButtonProps) {
  return (
    <Pressable onPress={onPress} className="w-full">
      <View
        className="overflow-hidden rounded-full border border-white/40"
        style={{
          shadowColor: "#FB5406",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        <BlurView intensity={50} tint="light" className="items-center justify-center py-4">
          <Text className="text-white font-bold text-base tracking-wide">{label}</Text>
        </BlurView>
      </View>
    </Pressable>
  );
}
