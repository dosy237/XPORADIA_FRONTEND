import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { EducationPattern } from "@/components/auth/EducationPattern";
import { LogoMark } from "@/components/auth/LogoMark";
import { Colors } from "@/constants/theme";

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  compact?: boolean;
  showBack?: boolean;
}

// LogoMark est une reconstitution vectorielle du logo (fichier source pas
// encore reçu en pièce jointe exploitable). TODO : une fois le PNG détouré
// disponible dans assets/images/logo.png, remplacer par
// <Image source={require("@/assets/images/logo.png")} /> — Metro résout les
// require() statiquement, donc ce swap ne peut se faire qu'une fois le fichier
// réellement présent dans le repo.
function LogoBadge({ size }: { size: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-white items-center justify-center shadow-lg"
    >
      <LogoMark size={size * 0.62} />
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
