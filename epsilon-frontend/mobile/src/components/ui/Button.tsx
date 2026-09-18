import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { Colors } from "@/constants/theme";

type Variant = "primary" | "secondary" | "navy" | "danger";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  pill?: boolean;
  accessibilityLabel?: string;
}

// Deux familles, cohérentes dans toute l'app :
// - "primary" est L'action principale d'un écran (publier, payer, se
//   connecter...) : dégradé orange + reflet + ombre marquée. Le seul
//   bouton "glossy" — s'il y en avait plusieurs par écran, plus aucun
//   ne ressortirait vraiment.
// - "secondary" / "navy" / "danger" restent des surfaces plates (pas de
//   dégradé) mais partagent le même reflet du haut et une ombre douce,
//   pour rester dans le même langage visuel sans jamais concurrencer le
//   bouton principal.
const PRIMARY_GRADIENT: [string, string] = ["#FF7A33", "#FB5406"];

const FLAT_BG: Record<Exclude<Variant, "primary">, string> = {
  secondary: "#FFFFFF",
  navy: "#0F172A",
  danger: "#E53935",
};

const VARIANT_TEXT_CLASSES: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-xporadia-text-primary",
  navy: "text-white",
  danger: "text-white",
};

// Équivalents RN natifs des utilitaires `shadow-*` (voir tailwind.config.js,
// boxShadow) — appliqués via `style`, jamais via une classe NativeWind
// conditionnelle sur ce Pressable. Bug amont connu : une className
// construite par template literal avec un fragment shadow-*/opacity-*
// conditionnel sur Pressable/TouchableOpacity casse le contexte de
// navigation d'Expo Router sur Android (voir nativewind/nativewind#1557,
// #1712) — jamais reproductible sur web, ce qui l'a longtemps caché.
// Solution : className toujours statique sur ce composant, ombre et
// opacité pilotées en JS.
const VARIANT_SHADOW_STYLE: Record<Variant, { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number; elevation: number }> = {
  primary: { shadowColor: "#FB5406", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 28, elevation: 10 },
  secondary: { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  navy: { shadowColor: "#1B2A4A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 4 },
  danger: { shadowColor: "#1B2A4A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 4 },
};

/** Reflet du haut — un dégradé blanc→transparent plaqué sur le tiers
 * supérieur du bouton. React Native ne supporte qu'une seule ombre
 * portée par vue (pas d'ombre interne, pas de double-ombre comme sur
 * le web) : c'est ce reflet, pas une deuxième ombre, qui donne l'effet
 * de surface bombée demandé sur tous les boutons stylés. */
function TopGloss() {
  return (
    <LinearGradient
      colors={["rgba(255,255,255,0.32)", "rgba(255,255,255,0)"]}
      className="absolute inset-x-0 top-0 h-[60%]"
      pointerEvents="none"
    />
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  pill,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const borderRadius = pill ? 9999 : 24;

  const content = loading ? (
    <ActivityIndicator color={variant === "secondary" ? "#0F172A" : "#FFFFFF"} />
  ) : (
    <Text className={`font-semibold text-base ${VARIANT_TEXT_CLASSES[variant]}`}>{label}</Text>
  );

  const sharedProps = {
    onPress,
    disabled: isDisabled,
    accessibilityRole: "button" as const,
    accessibilityLabel: accessibilityLabel ?? label,
    accessibilityState: { disabled: isDisabled, busy: loading },
    hitSlop: 4,
  };

  // className reste toujours une chaîne littérale, jamais interpolée avec
  // un fragment conditionnel (shape/ombre/opacité) : voir le commentaire
  // sur VARIANT_SHADOW_STYLE ci-dessus.
  const dynamicStyle = {
    borderRadius,
    opacity: isDisabled ? 0.5 : 1,
    ...(isDisabled ? {} : VARIANT_SHADOW_STYLE[variant]),
  };

  if (variant === "primary") {
    return (
      <Pressable {...sharedProps} className="overflow-hidden active:opacity-90" style={dynamicStyle}>
        <LinearGradient colors={PRIMARY_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View className="items-center justify-center py-4 px-5">{content}</View>
        </LinearGradient>
        {!isDisabled ? <TopGloss /> : null}
      </Pressable>
    );
  }

  return (
    <Pressable
      {...sharedProps}
      className="overflow-hidden items-center justify-center py-4 px-5 active:opacity-80"
      style={{
        ...dynamicStyle,
        backgroundColor: FLAT_BG[variant],
        ...(variant === "secondary" ? { borderWidth: 1, borderColor: Colors.border } : null),
      }}
    >
      {content}
      {!isDisabled ? <TopGloss /> : null}
    </Pressable>
  );
}
