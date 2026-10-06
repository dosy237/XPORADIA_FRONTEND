import { Modal, Pressable, ScrollView, View } from "react-native";

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
 * d'origine. */
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
            <ScrollView contentContainerClassName="p-6" keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
