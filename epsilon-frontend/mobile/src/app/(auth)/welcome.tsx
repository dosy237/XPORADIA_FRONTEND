import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EducationPattern } from "@/components/auth/EducationPattern";
import { GlassButton } from "@/components/ui/GlassButton";

// Halos de couleur en fond — remplacent la texture d'une vraie photo en
// attendant le fichier, et créent la profondeur/l'ambiance "glassmorphism".
function GlowOrbs() {
  return (
    <>
      <View className="absolute -top-16 -right-24 w-80 h-80 rounded-full bg-xporadia-orange/10" />
      <View className="absolute -top-10 -right-16 w-56 h-56 rounded-full bg-xporadia-orange/10" />
      <View className="absolute top-1/3 -left-32 w-72 h-72 rounded-full bg-blue-400/5" />
      <View className="absolute top-1/3 -left-20 w-48 h-48 rounded-full bg-blue-400/5" />
      <View className="absolute bottom-24 -right-20 w-60 h-60 rounded-full bg-xporadia-orange/5" />
    </>
  );
}

// TODO: dès que la photo de fond (fichier réel) est fournie, remplacer le
// <LinearGradient> ci-dessous par :
//   <ImageBackground source={require("@/assets/images/brand/cover.jpg")} style={StyleSheet.absoluteFill} resizeMode="cover">
// puis garder le voile bleu + les halos + le logo + le bouton tels quels par-dessus.
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-xporadia-navy overflow-hidden">
      <LinearGradient colors={["#0F172A", "#1E293B", "#0F172A"]} style={StyleSheet.absoluteFill} />
      <GlowOrbs />
      <EducationPattern />
      {/* Voile bleu léger — le "flou bleu" demandé sur l'image de fond */}
      <View className="absolute inset-0 bg-xporadia-navy/30" />

      <View
        className="flex-1 px-8"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
      >
        <View className="flex-1 items-center justify-center gap-10">
          <View
            style={{
              shadowColor: "#FFFFFF",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.2,
              shadowRadius: 30,
            }}
          >
            <Image
              source={require("@/assets/images/brand/logo-white.png")}
              style={{ width: 240, height: (240 * 506) / 1200 }}
              contentFit="contain"
            />
          </View>

          <Text className="text-white/85 text-center text-base leading-6 px-2">
            La plateforme de certification professionnelle des enseignants du secteur privé
            africain
          </Text>
        </View>

        <GlassButton label="Commencer" onPress={() => router.replace("/(auth)/login")} />
      </View>
    </View>
  );
}
