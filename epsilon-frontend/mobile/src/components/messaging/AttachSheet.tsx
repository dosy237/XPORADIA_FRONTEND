import { Pressable, Text, View } from "react-native";

import { FileTextIcon, GraduationCapIcon, ImageIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";

/** Menu "+" du composeur de message — deux familles d'actions visuellement
 * séparées : les actions de message normal (photo, fichier) et, seulement
 * si `onAddExercise` est fourni (enseignant dédié dans un canal de
 * matière), l'action réservée "Ajouter un devoir". */
export function AttachSheet({
  visible,
  onClose,
  onPickPhotos,
  onPickFile,
  onAddExercise,
}: {
  visible: boolean;
  onClose: () => void;
  onPickPhotos: () => void;
  onPickFile: () => void;
  onAddExercise?: () => void;
}) {
  if (!visible) return null;
  return (
    <Pressable
      className="absolute inset-0 bg-black/20 items-stretch justify-end"
      style={{ zIndex: 20 }}
      onPress={onClose}
    >
      <Pressable className="bg-white rounded-t-3xl overflow-hidden pb-6" onPress={(e) => e.stopPropagation()}>
        <View className="h-1 w-10 bg-xporadia-border rounded-full self-center mt-3 mb-1" />

        <Pressable
          onPress={onPickPhotos}
          className="flex-row items-center gap-3 px-5 py-3.5 active:bg-xporadia-bg"
          accessibilityRole="button"
        >
          <View className="h-9 w-9 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
            <ImageIcon size={16} color={Colors.navy} />
          </View>
          <Text className="text-sm font-medium text-xporadia-text-primary">Envoyer une photo</Text>
        </Pressable>

        <Pressable
          onPress={onPickFile}
          className="flex-row items-center gap-3 px-5 py-3.5 active:bg-xporadia-bg"
          accessibilityRole="button"
        >
          <View className="h-9 w-9 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
            <FileTextIcon size={16} color={Colors.navy} />
          </View>
          <Text className="text-sm font-medium text-xporadia-text-primary">Envoyer un fichier</Text>
        </Pressable>

        {onAddExercise ? (
          <>
            <View className="h-px bg-xporadia-border mx-5 my-1.5" />
            <Pressable
              onPress={onAddExercise}
              className="flex-row items-center gap-3 px-5 py-3.5 active:bg-xporadia-bg"
              accessibilityRole="button"
            >
              <View className="h-9 w-9 rounded-full bg-xporadia-orange/10 items-center justify-center">
                <GraduationCapIcon size={16} color={Colors.orange} />
              </View>
              <Text className="text-sm font-semibold text-xporadia-orange-text">Ajouter un devoir</Text>
            </Pressable>
          </>
        ) : null}
      </Pressable>
    </Pressable>
  );
}
