import { Image } from "expo-image";
import { Dimensions, Modal, Pressable, ScrollView, View } from "react-native";

import { CloseIcon } from "@/components/ui/Icon";
import { useImageViewerStore } from "@/store/imageViewerStore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/** Visionneuse plein écran générique, montée une seule fois à la racine de
 * l'app (voir le layout racine). N'importe quelle image de l'app peut
 * l'ouvrir via useImageViewerStore().open(uri) au lieu de gérer sa propre
 * Modal. Même mécanisme de zoom que FullscreenImageViewer (fil
 * d'actualité) : le zoom natif de ScrollView (pincer pour zoomer), pas de
 * librairie tierce. */
export function ImageViewerOverlay() {
  const uri = useImageViewerStore((s) => s.uri);
  const close = useImageViewerStore((s) => s.close);

  if (!uri) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 bg-black">
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          hitSlop={12}
          className="absolute top-14 right-6 z-10 h-10 w-10 rounded-full bg-white/15 items-center justify-center"
        >
          <CloseIcon size={18} color="#FFFFFF" />
        </Pressable>

        <ScrollView
          style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={{ uri }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            contentFit="contain"
          />
        </ScrollView>
      </View>
    </Modal>
  );
}
