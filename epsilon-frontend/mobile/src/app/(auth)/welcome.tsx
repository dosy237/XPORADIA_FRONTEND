import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-xporadia-navy">
      {/* Photo de fond */}
      <Image
        source={require("@/assets/images/brand/cover.jpg")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      {/* Voile bleu semi-transparent par-dessus la photo — laisse deviner l'image */}
      <View className="absolute inset-0 bg-xporadia-navy/75" />

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

        <View className="gap-4">
          <Button label="Se connecter" pill onPress={() => router.replace("/(auth)/login")} />
          <View className="flex-row justify-center items-center gap-1">
            <Text className="text-white/80">Pas de compte ?</Text>
            <Link href="/(auth)/register" asChild>
              <Text className="text-white font-semibold">S'inscrire</Text>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}
