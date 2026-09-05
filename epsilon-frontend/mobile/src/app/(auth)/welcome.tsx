import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/Icon";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const canGoBack = router.canGoBack();

  return (
    <View className="flex-1 bg-xporadia-navy">
      <Image
        source={require("@/assets/images/brand/cover.jpg")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      {/* Dégradé progressif du haut vers le bas, le logo reste lisible sur
          la photo tout en la laissant respirer en haut, le texte et les CTA
          en bas gagnent le contraste dont ils ont besoin. */}
      <LinearGradient
        colors={["rgba(15,23,42,0.55)", "rgba(15,23,42,0.55)", "rgba(15,23,42,0.94)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {canGoBack ? (
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={12}
          className="absolute right-6 h-10 w-10 rounded-full bg-white/15 items-center justify-center"
          style={{ top: insets.top + 12 }}
        >
          <CloseIcon size={18} color="#FFFFFF" />
        </Pressable>
      ) : null}

      <View
        className="flex-1 px-8"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
      >
        <View className="flex-1 items-center justify-center">
          <Image
            source={require("@/assets/images/brand/logo-white.png")}
            style={{ width: 220, height: (220 * 506) / 1200 }}
            contentFit="contain"
          />
        </View>

        <View className="gap-8">
          <View className="gap-2">
            <Text className="text-white font-bold text-3xl text-center leading-tight">
              L'excellence pédagogique{"\n"}certifiée.
            </Text>
            <Text className="text-white/70 text-base text-center leading-relaxed">
              Rejoignez la plateforme de certification pour les enseignants du privé en Afrique.
            </Text>
          </View>

          <View className="gap-4">
            <Button label="Commencer" pill onPress={() => router.push("/(auth)/register")} />
            <View className="flex-row justify-center items-center gap-1">
              <Text className="text-white/70">Déjà un compte ?</Text>
              <Link href="/(auth)/login" asChild>
                <Text className="text-white font-semibold">Se connecter</Text>
              </Link>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
