import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";

// TODO: dès que la photo de fond (fichier réel) est fournie, remplacer le
// <LinearGradient> ci-dessous par :
//   <ImageBackground source={require("@/assets/images/brand/cover.jpg")} style={StyleSheet.absoluteFill} resizeMode="cover">
// et ajouter un voile bleu semi-transparent par-dessus pour la lisibilité.
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-xporadia-navy">
      <LinearGradient colors={["#0F172A", "#1E293B", "#0F172A"]} style={StyleSheet.absoluteFill} />

      <View
        className="flex-1 px-8"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
      >
        <View className="flex-1 items-center justify-center">
          <Image
            source={require("@/assets/images/brand/logo-white.png")}
            style={{ width: 240, height: (240 * 506) / 1200 }}
            contentFit="contain"
          />
        </View>

        <Button label="Commencer" pill onPress={() => router.replace("/(auth)/login")} />
      </View>
    </View>
  );
}
