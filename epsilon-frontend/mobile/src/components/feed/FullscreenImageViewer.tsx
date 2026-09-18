import { Image } from "expo-image";
import { useState } from "react";
import { Dimensions, Modal, Pressable, ScrollView, View } from "react-native";

import { CloseIcon } from "@/components/ui/Icon";

interface FullscreenImageViewerProps {
  images: { id: number; image: string }[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/** Visionneuse plein écran avec zoom (pincer pour zoomer, natif via
 * ScrollView) et défilement horizontal entre les photos d'une même
 * publication. Pas de librairie tierce — le zoom natif de ScrollView
 * suffit largement pour ce besoin. */
export function FullscreenImageViewer({ images, initialIndex, visible, onClose }: FullscreenImageViewerProps) {
  const [index, setIndex] = useState(initialIndex);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          hitSlop={12}
          className="absolute top-14 right-6 z-10 h-10 w-10 rounded-full bg-white/15 items-center justify-center"
        >
          <CloseIcon size={18} color="#FFFFFF" />
        </Pressable>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initialIndex * SCREEN_WIDTH, y: 0 }}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
        >
          {images.map((img) => (
            <ScrollView
              key={img.id}
              style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
              maximumZoomScale={4}
              minimumZoomScale={1}
              centerContent
              showsVerticalScrollIndicator={false}
            >
              <Image
                source={{ uri: img.image }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                contentFit="contain"
              />
            </ScrollView>
          ))}
        </ScrollView>

        {images.length > 1 ? (
          <View className="absolute bottom-10 w-full flex-row items-center justify-center gap-1.5">
            {images.map((img, i) => (
              <View
                key={img.id}
                className={`h-1.5 rounded-full ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/40"}`}
              />
            ))}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
