import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { EducationPattern } from "@/components/auth/EducationPattern";
import { Colors } from "@/constants/theme";

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  compact?: boolean;
  showBack?: boolean;
}

// Logo réel (fichier fourni, fond supprimé — voir assets/images/brand).
// Variante blanche : lisible sur le fond navy du header.
const LOGO_ASPECT_RATIO = 1200 / 506;

function Wordmark({ height }: { height: number }) {
  return (
    <Image
      source={require("@/assets/images/brand/logo-white.png")}
      style={{ width: height * LOGO_ASPECT_RATIO, height }}
      contentFit="contain"
    />
  );
}

export function AuthHeader({ title, subtitle, compact, showBack }: AuthHeaderProps) {
  return (
    <View
      className="bg-xporadia-navy overflow-hidden"
      style={{
        paddingTop: 56,
        paddingBottom: compact ? 20 : 36,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
      }}
    >
      <EducationPattern />

      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="absolute left-5 z-10"
          style={{ top: 56 }}
        >
          <Text style={{ color: Colors.white, fontSize: 22 }}>←</Text>
        </Pressable>
      ) : null}

      <View className="items-center gap-3 px-6">
        {!compact && <Wordmark height={40} />}
        <Text className={`text-white font-bold text-center ${compact ? "text-lg" : "text-xl"}`}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-white/70 text-center text-sm">{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}
