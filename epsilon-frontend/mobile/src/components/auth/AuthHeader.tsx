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

// TODO: une fois le logo détouré fourni (assets/images/logo.png), remplacer ce
// badge texte par <Image source={require("@/assets/images/logo.png")} />.
// Metro résout les require() statiquement : on ne peut pas le référencer avant
// que le fichier existe réellement dans le repo.
function LogoBadge({ size }: { size: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-white items-center justify-center shadow-lg"
    >
      <Text style={{ fontSize: size * 0.42 }} className="font-bold text-xporadia-orange">
        X
      </Text>
    </View>
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
        {!compact && <LogoBadge size={64} />}
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
