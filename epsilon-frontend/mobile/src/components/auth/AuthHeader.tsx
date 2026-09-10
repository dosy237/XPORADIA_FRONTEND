import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  /** Affiche le wordmark Xporadia au-dessus du titre, réservé aux écrans d'entrée (pas de répétition sur chaque étape d'un flow). */
  showLogo?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

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

export function AuthHeader({ title, subtitle, showLogo, showBack, onBack }: AuthHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="px-6" style={{ paddingTop: insets.top + 12 }}>
      {showBack ? (
        <Pressable
          onPress={onBack ?? (() => router.back())}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          className="mb-6 h-10 w-10 items-center justify-center rounded-full bg-xporadia-bg self-start"
        >
          <Text className="text-xporadia-navy text-lg">←</Text>
        </Pressable>
      ) : (
        <View className="h-6" />
      )}

      {showLogo ? (
        <View className="mb-4">
          <Wordmark height={30} />
        </View>
      ) : null}

      <View className="gap-1.5">
        <Text className="text-xporadia-navy font-bold text-3xl">{title}</Text>
        {subtitle ? <Text className="text-xporadia-text-secondary text-base">{subtitle}</Text> : null}
      </View>
    </View>
  );
}
