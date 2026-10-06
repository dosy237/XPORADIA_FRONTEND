import { Modal, Pressable, View } from "react-native";

import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";

interface PopupProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** Vraie pop-up flottant par-dessus l'écran courant, sur toutes les
 * plateformes y compris le web (contrairement à `presentation: "modal"`
 * d'Expo Router, qui navigue vers un nouvel écran plein-page sur web au
 * lieu de superposer un calque). À utiliser pour les formulaires rapides
 * (créer/modifier) déclenchés depuis un bouton, sans quitter l'écran
 * d'origine.
 *
 * Le contenu défile via `KeyboardAwareScrollView` (et non un `ScrollView`
 * nu) pour que chaque `Input` remonte au-dessus du clavier à la saisie —
 * sans ça, un champ en bas de la pop-up (ex. après l'email dans un
 * formulaire de compte) reste masqué par le clavier et la saisie se fait
 * à l'aveugle. */
export function Popup({ visible, onClose, children }: PopupProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center p-6"
        style={{ backgroundColor: "rgba(10, 20, 40, 0.55)" }}
      >
        <Pressable onPress={() => {}} className="w-full" style={{ maxWidth: 420, maxHeight: "85%" }}>
          <View className="bg-white rounded-2xl overflow-hidden" style={{ maxHeight: "100%" }}>
            <KeyboardAwareScrollView contentContainerClassName="p-6">
              {children}
            </KeyboardAwareScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
