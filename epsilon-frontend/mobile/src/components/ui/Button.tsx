import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

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

const VARIANT_SHADOW_CLASSES: Record<Variant, string> = {
  primary: "shadow-deep-orange",
  secondary: "shadow-soft",
  navy: "shadow-card",
  danger: "shadow-card",
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
  const shape = pill ? "rounded-full" : "rounded-xl";

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

  if (variant === "primary") {
    return (
      <Pressable
        {...sharedProps}
        className={`${shape} overflow-hidden active:opacity-90 ${
          isDisabled ? "opacity-50" : VARIANT_SHADOW_CLASSES.primary
        }`}
      >
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
      className={`${shape} overflow-hidden items-center justify-center py-4 px-5 active:opacity-80 ${
        variant === "secondary" ? "border border-xporadia-border" : ""
      } ${isDisabled ? "opacity-50" : VARIANT_SHADOW_CLASSES[variant]}`}
      style={{ backgroundColor: FLAT_BG[variant] }}
    >
      {content}
      {!isDisabled ? <TopGloss /> : null}
    </Pressable>
  );
}
