import { Pressable, Text } from "react-native";

interface SocialButtonProps {
  label: string;
  onPress: () => void;
}

// Connexion Google/Apple pas encore câblée côté backend (OAuth hors scope
// EP-01 Sprint 1) — le bouton reste visible pour respecter la maquette mais
// affiche un message honnête plutôt que de simuler une action.
export function SocialButton({ label, onPress }: SocialButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-xporadia-border bg-white py-3 active:bg-xporadia-bg"
    >
      <Text className="font-medium text-xporadia-text-primary">{label}</Text>
    </Pressable>
  );
}
