import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { useImageViewerStore } from "@/store/imageViewerStore";

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  size?: number;
  /** URL de la photo de profil — si absente/nulle, affiche les initiales. */
  imageUri?: string | null;
}

export function Avatar({ firstName, lastName, size = 88, imageUri }: AvatarProps) {
  const openImage = useImageViewerStore((s) => s.open);
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    shadowColor: "#FB5406",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 10,
  };

  if (imageUri) {
    return (
      <Pressable
        onPress={() => openImage(imageUri)}
        accessibilityRole="imagebutton"
        accessibilityLabel="Voir la photo de profil"
        className="border-4 border-white overflow-hidden bg-xporadia-navy"
        style={containerStyle}
      >
        <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
      </Pressable>
    );
  }

  return (
    <View className="bg-xporadia-navy items-center justify-center border-4 border-white" style={containerStyle}>
      <Text style={{ fontSize: size * 0.36 }} className="text-white font-bold">
        {initials}
      </Text>
    </View>
  );
}
