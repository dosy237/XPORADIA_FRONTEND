import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Circle, Defs, Path, RadialGradient, Stop, Svg } from "react-native-svg";

import { Avatar } from "@/components/ui/Avatar";
import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { HeaderActions } from "@/components/layout/HeaderActions";

type IconComponent = (props: { color?: string; size?: number }) => React.ReactElement;

export interface HeroFact {
  icon: IconComponent;
  text: string;
}

interface DashboardHeroHeaderProps {
  firstName?: string;
  lastName?: string;
  avatarUri?: string | null;
  facts: HeroFact[];
}

/** Bande d'identité fine, hors ScrollView (comme `DashboardHeader` pour les
 * autres rôles) : photo + prénom restent visibles pendant tout le défilement
 * du tableau de bord, la grande carte "vivante" ci-dessous continuant elle
 * de défiler normalement avec le reste du contenu. */
export function DashboardFixedHeader({ firstName, lastName, avatarUri }: Pick<DashboardHeroHeaderProps, "firstName" | "lastName" | "avatarUri">) {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-xporadia-navy" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-2.5 gap-3">
        <Avatar firstName={firstName} lastName={lastName} imageUri={avatarUri} size={34} />
        <Text className="flex-1 text-white font-bold text-sm" numberOfLines={1}>
          {[firstName, lastName].filter(Boolean).join(" ")}
        </Text>
        <HeaderActions />
      </View>
    </View>
  );
}

// Cadence lente et respirante, jamais un carrousel énergique — un fait
// toutes les ~6.5s, avec un fondu long plutôt qu'un cut.
const CYCLE_MS = 6500;
const FADE_MS = 480;

/** En-tête "carte d'identité vivante" du dashboard élève — silhouette
 * organique (jamais un rectangle droit) avec halo décoratif et silhouette
 * d'arbre en transparence, et un fait personnel qui change en fondu lent
 * toutes les ~6.5s parmi la liste fournie (classe/établissement, âge,
 * objectif, point fort, régularité) plutôt que tout afficher en même
 * temps et surcharger la carte. */
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
      // Lumière qui traverse une matière plutôt qu'un aplat coupé au
      // cutter : navy profond en haut, glissant vers un ton chaud (brun
      // ambré, dérivé de l'orange de marque) en bas — jamais un bloc de
      // couleur franc.
      colors={["#0F172A", "#1B1522", "#3A2417"]}
      locations={[0, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
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
        {/* Silhouette d'arbre miniature, en transparence légère, juste
            derrière l'avatar — symbole compact du profil de compétences
            (voir le radar plus bas / le futur écran "Mon arbre"). Une
            invitation discrète à explorer, pas une scène. */}
        <Svg width="86" height="86" viewBox="0 0 64 64" style={{ position: "absolute", left: 4, top: 2, opacity: 0.16 }}>
          <Path d="M32 62 V38" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
          <Circle cx="32" cy="24" r="15" fill="#FFFFFF" />
          <Circle cx="19" cy="32" r="10" fill="#FFFFFF" />
          <Circle cx="45" cy="32" r="10" fill="#FFFFFF" />
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
          <current.icon size={15} color="#FFFFFF" />
          <Text className="flex-1 text-xs font-semibold text-white" numberOfLines={2}>
            {current.text}
          </Text>
        </Animated.View>
      ) : null}
    </LinearGradient>
  );
}
