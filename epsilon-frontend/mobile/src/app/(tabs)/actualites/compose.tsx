import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PlusIcon, TrashIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as feedApi from "@/services/feed";
import { useAuthStore } from "@/store/authStore";

const MAX_LENGTH = 2000;
const MAX_IMAGES = 6;

export default function ComposeScreen() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const mutation = useMutation({
    mutationFn: () =>
      feedApi.createPost(
        body.trim(),
        images.map((img) => ({ uri: img.uri, name: img.fileName ?? "photo.jpg", mimeType: img.mimeType })),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      router.back();
    },
  });

  const pickImages = async () => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (!user) return null;

  return (
    <KeyboardAvoidingView className="flex-1 bg-xporadia-bg" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerClassName="p-6 gap-4 pb-8" keyboardShouldPersistTaps="handled">
        <View className="flex-row items-start gap-3">
          <Avatar firstName={user.first_name} lastName={user.last_name} size={44} />
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Partagez une actualité avec la communauté Xporadia. Utilisez #hashtags pour la retrouver facilement."
            placeholderTextColor="#94A3B8"
            multiline
            autoFocus
            maxLength={MAX_LENGTH}
            className="flex-1 text-base text-xporadia-text-primary min-h-[120px] pt-2"
          />
        </View>

        {images.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {images.map((img, index) => (
              <View key={img.uri} className="relative">
                <Image source={{ uri: img.uri }} style={{ width: 100, height: 100, borderRadius: 12 }} contentFit="cover" />
                <Pressable
                  onPress={() => removeImage(index)}
                  className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-xporadia-navy items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Retirer cette photo"
                >
                  <TrashIcon size={12} color={Colors.white} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={pickImages}
            disabled={images.length >= MAX_IMAGES}
            className="flex-row items-center gap-2 border border-xporadia-border rounded-full px-4 py-2"
          >
            <PlusIcon size={14} color={images.length >= MAX_IMAGES ? Colors.textSecondary : Colors.navy} />
            <Text
              className={`text-xs font-semibold ${
                images.length >= MAX_IMAGES ? "text-xporadia-text-secondary" : "text-xporadia-navy"
              }`}
            >
              Photos ({images.length}/{MAX_IMAGES})
            </Text>
          </Pressable>
          <Text className="text-xs text-xporadia-text-secondary">{body.length}/{MAX_LENGTH}</Text>
        </View>

        <Button
          label="Publier"
          pill
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={body.trim().length === 0}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
