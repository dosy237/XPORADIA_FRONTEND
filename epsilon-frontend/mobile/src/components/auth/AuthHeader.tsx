import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { Colors } from "@/constants/theme";

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  compact?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

// Logo réel (fichier fourni, fond supprimé — voir assets/images/brand).
// Variante navy : lisible sur le fond clair des écrans de formulaire.
const LOGO_ASPECT_RATIO = 1200 / 506;

function Wordmark({ height }: { height: number }) {
  return (
    <Image
      source={require("@/assets/images/brand/logo-navy.png")}
      style={{ width: height * LOGO_ASPECT_RATIO, height }}
      contentFit="contain"
    />
  );
}

export function AuthHeader({ title, subtitle, compact, showBack, onBack }: AuthHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="px-6" style={{ paddingTop: insets.top + 16 }}>
      {showBack ? (
        <Pressable onPress={onBack ?? (() => router.back())} hitSlop={12} className="mb-4 self-start">
          <Text style={{ color: Colors.navy, fontSize: 22 }}>←</Text>
        </Pressable>
      ) : null}

      <View className="items-center gap-2 mb-2">
        {!compact && <Wordmark height={36} />}
        <Text className={`text-xporadia-navy font-bold text-center ${compact ? "text-lg" : "text-xl"}`}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-xporadia-text-secondary text-center text-sm">{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}
