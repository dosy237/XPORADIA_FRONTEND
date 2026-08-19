import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { Circle, Defs, RadialGradient, Stop, Svg } from "react-native-svg";

import { AvatarPicker } from "@/components/ui/AvatarPicker";

export interface HeroFact {
  icon: string;
  text: string;
}

interface DashboardHeroHeaderProps {
  firstName?: string;
  lastName?: string;
  avatarUri?: string | null;
  facts: HeroFact[];
}

const CYCLE_MS = 4200;
const FADE_MS = 260;

/** En-tête "carte d'identité vivante" du dashboard élève — silhouette
 * organique (jamais un rectangle droit) avec halo décoratif, et un fait
 * personnel qui change en fondu toutes les ~4s parmi la liste fournie
 * (classe/établissement, âge, objectif, point fort) plutôt que tout
 * afficher en même temps et surcharger la carte. */
export function DashboardHeroHeader({ firstName, lastName, avatarUri, facts }: DashboardHeroHeaderProps) {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (facts.length <= 1) return;
    const timer = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(() => {
        setIndex((i) => (i + 1) % facts.length);
        Animated.timing(opacity, { toValue: 1, duration: FADE_MS, useNativeDriver: true }).start();
      });
    }, CYCLE_MS);
    return () => clearInterval(timer);
  }, [facts.length, opacity]);

  useEffect(() => {
    if (index >= facts.length) setIndex(0);
  }, [facts.length, index]);

  const current = facts[index] ?? null;
  const shapeClasses = "rounded-tl-[52px] rounded-tr-3xl rounded-br-[52px] rounded-bl-3xl";

  return (
    <LinearGradient
      colors={["#0F172A", "#1E293B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={`${shapeClasses} px-6 pt-7 pb-8 gap-5`}
    >
      {/* Halos en dégradé radial (opaque au centre → transparent) plutôt que
          des disques teintés plats : sur un fond navy quasi noir, un orange
          translucide se mélange en brun terne (mathématique de l'alpha),
          jamais en lueur. Le dégradé radial donne le vrai effet "glow". */}
      <View className={`absolute inset-0 ${shapeClasses} overflow-hidden`} pointerEvents="none">
        <Svg width="100%" height="100%" style={{ position: "absolute" }}>
          <Defs>
            <RadialGradient id="heroOrangeGlow" cx="82%" cy="6%" r="60%">
              <Stop offset="0" stopColor="#FF7A33" stopOpacity={0.65} />
              <Stop offset="1" stopColor="#FF7A33" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="heroWhiteGlow" cx="2%" cy="102%" r="50%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.1} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx="82%" cy="6%" r="60%" fill="url(#heroOrangeGlow)" />
          <Circle cx="2%" cy="102%" r="50%" fill="url(#heroWhiteGlow)" />
        </Svg>
      </View>

      <View className="flex-row items-center gap-4">
        <AvatarPicker firstName={firstName} lastName={lastName} imageUri={avatarUri} size={92} />
        <View className="flex-1 gap-1">
          <Text className="text-white/60 text-xs font-semibold">Bonjour,</Text>
          <Text className="text-white text-xl font-bold" numberOfLines={1}>
            {[firstName, lastName].filter(Boolean).join(" ")}
          </Text>
        </View>
      </View>

      {current ? (
        <Animated.View
          style={{ opacity }}
          className="flex-row items-center gap-2.5 self-start max-w-full rounded-full bg-white/10 px-4 py-2.5"
        >
          <Text className="text-base">{current.icon}</Text>
          <Text className="flex-1 text-xs font-semibold text-white" numberOfLines={2}>
            {current.text}
          </Text>
        </Animated.View>
      ) : null}
    </LinearGradient>
  );
}
