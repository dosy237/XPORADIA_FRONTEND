import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

import { PostCard } from "@/components/feed/PostCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CloseIcon, EyeIcon, PlusIcon, TrashIcon, VideoIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as feedApi from "@/services/feed";
import { useAuthStore } from "@/store/authStore";

const MAX_LENGTH = 2000;
const MAX_TITLE_LENGTH = 150;
const MAX_IMAGES = 6;
const MAX_VIDEO_SECONDS = 60;
// Doit rester cohérent avec MAX_VIDEO_SIZE_BYTES côté backend
// (apps/feed/serializers.py) — vérifié ici pour prévenir tout de suite
// plutôt que de laisser échouer un envoi de plusieurs dizaines de Mo.
const MAX_VIDEO_SIZE_BYTES = 80 * 1024 * 1024;

const ROLE_LABELS: Record<string, string> = {
  teacher: "Enseignant",
  director: "Directeur d'établissement",
  parent: "Parent d'élève",
  company: "Entreprise",
  trainer: "Formateur partenaire",
  admin: "Administrateur Xporadia",
  student: "Élève",
};

export default function ComposeScreen() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [video, setVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const videoPlayer = useVideoPlayer(video?.uri ?? null, (player) => {
    player.loop = true;
  });

  const mutation = useMutation({
    mutationFn: () =>
      feedApi.createPost(
        body.trim(),
        images.map((img) => ({ uri: img.uri, name: img.fileName ?? "photo.jpg", mimeType: img.mimeType })),
        "public",
        title.trim() || undefined,
        video
          ? {
              uri: video.uri,
              name: video.fileName ?? "video.mp4",
              mimeType: video.mimeType,
              durationSeconds: (video.duration ?? 0) / 1000,
            }
          : undefined,
      ),
    onSuccess: (newPost) => {
      // Le fil principal est classé par activité côté backend (voir
      // _rank_for_feed) et l'app ne récupère que la première page — une
      // simple invalidation pouvait renvoyer une liste où la publication
      // qu'on vient de créer (auteur peu actif, encore aucun like/
      // commentaire) tombe au-delà de cette page et semble "ne pas
      // s'afficher". On l'insère donc directement en tête du cache local,
      // comme le fait déjà le websocket pour les publications des autres.
      queryClient.setQueryData<feedApi.Post[]>(["posts"], (current) => {
        if (!current) return current;
        if (current.some((p) => p.id === newPost.id)) return current;
        return [newPost, ...current];
      });
      router.back();
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.video ?? error?.response?.data?.detail;
      Alert.alert(
        "Publication impossible",
        Array.isArray(detail) ? detail.join(" ") : detail ?? "Une erreur est survenue. Réessayez.",
      );
    },
  });

  const pickImages = async () => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
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

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: MAX_VIDEO_SECONDS,
      // `quality` ne s'applique qu'aux photos (voir doc expo-image-picker) —
      // c'est `videoQuality` qui compresse la vidéo, iOS uniquement (pas
      // d'équivalent Android côté sélecteur de galerie).
      videoQuality: Platform.OS === "ios" ? ImagePicker.UIImagePickerControllerQualityType.Medium : undefined,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const durationSeconds = (asset.duration ?? 0) / 1000;
    if (durationSeconds > MAX_VIDEO_SECONDS) {
      Alert.alert(
        "Vidéo trop longue",
        `Les vidéos sont limitées à ${MAX_VIDEO_SECONDS} secondes. Choisissez un extrait plus court.`,
      );
      return;
    }
    if (asset.fileSize && asset.fileSize > MAX_VIDEO_SIZE_BYTES) {
      Alert.alert(
        "Vidéo trop volumineuse",
        "Cette vidéo dépasse la taille maximale autorisée (80 Mo). Choisissez un extrait plus court ou moins lourd.",
      );
      return;
    }
    setVideo(asset);
  };

  if (!user) return null;

  const previewPost: feedApi.Post = {
    id: -1,
    author: {
      id: user.id,
      full_name: `${user.first_name} ${user.last_name}`,
      avatar: user.avatar,
      primary_role: user.primary_role,
      role_label: ROLE_LABELS[user.primary_role] ?? user.primary_role,
      is_followed_by_me: false,
      followers_count: 0,
    },
    title: title.trim(),
    body: body.trim(),
    hashtags: Array.from(new Set(Array.from(body.matchAll(/#(\w+)/g), (m) => m[1]))),
    images: images.map((img, order) => ({ id: order, image: img.uri, order })),
    video: video?.uri ?? null,
    video_duration_seconds: video?.duration ? Math.round(video.duration / 1000) : null,
    visibility: "public",
    like_count: 0,
    comment_count: 0,
    is_liked_by_me: false,
    created_at: new Date().toISOString(),
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-xporadia-bg" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerClassName="p-6 gap-4 pb-8" keyboardShouldPersistTaps="handled">
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="Titre (optionnel)"
          maxLength={MAX_TITLE_LENGTH}
        />

        <View className="flex-row items-start gap-3">
          <Avatar firstName={user.first_name} lastName={user.last_name} imageUri={user.avatar} size={44} />
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

        {video ? (
          <View className="relative">
            <VideoView
              player={videoPlayer}
              style={{ width: "100%", height: 420, borderRadius: 14, backgroundColor: "#000" }}
              contentFit="contain"
              nativeControls
            />
            <Pressable
              onPress={() => setVideo(null)}
              className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-xporadia-navy items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Retirer cette vidéo"
            >
              <TrashIcon size={12} color={Colors.white} />
            </Pressable>
          </View>
        ) : null}

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={pickImages}
              disabled={images.length >= MAX_IMAGES || !!video}
              className="flex-row items-center gap-2 border border-xporadia-border rounded-full px-4 py-2"
            >
              <PlusIcon size={14} color={images.length >= MAX_IMAGES || video ? Colors.textSecondary : Colors.navy} />
              <Text
                className={`text-xs font-semibold ${
                  images.length >= MAX_IMAGES || video ? "text-xporadia-text-secondary" : "text-xporadia-navy"
                }`}
              >
                Photos ({images.length}/{MAX_IMAGES})
              </Text>
            </Pressable>
            <Pressable
              onPress={pickVideo}
              disabled={!!video || images.length > 0}
              className="flex-row items-center gap-2 border border-xporadia-border rounded-full px-4 py-2"
            >
              <VideoIcon size={14} color={video || images.length > 0 ? Colors.textSecondary : Colors.navy} />
              <Text
                className={`text-xs font-semibold ${
                  video || images.length > 0 ? "text-xporadia-text-secondary" : "text-xporadia-navy"
                }`}
              >
                Vidéo (1 min max)
              </Text>
            </Pressable>
          </View>
          <Text className="text-xs text-xporadia-text-secondary">{body.length}/{MAX_LENGTH}</Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Prévisualiser"
              variant="secondary"
              pill
              onPress={() => setPreviewing(true)}
              disabled={body.trim().length === 0}
            />
          </View>
          <View className="flex-1">
            <Button
              label="Publier"
              pill
              onPress={() => mutation.mutate()}
              loading={mutation.isPending}
              disabled={body.trim().length === 0}
            />
          </View>
        </View>
      </ScrollView>

      <Modal visible={previewing} animationType="slide" onRequestClose={() => setPreviewing(false)}>
        <View className="flex-1 bg-xporadia-bg">
          <View className="flex-row items-center justify-between px-6 pt-14 pb-4 bg-white border-b border-xporadia-border">
            <View className="flex-row items-center gap-2">
              <EyeIcon size={16} color={Colors.textSecondary} />
              <Text className="text-sm font-semibold text-xporadia-text-secondary">Aperçu — pas encore publié</Text>
            </View>
            <Pressable
              onPress={() => setPreviewing(false)}
              accessibilityRole="button"
              accessibilityLabel="Fermer l'aperçu"
              hitSlop={8}
            >
              <CloseIcon size={18} color={Colors.navy} />
            </Pressable>
          </View>
          <ScrollView contentContainerClassName="p-6 gap-4 pb-8">
            <PostCard post={previewPost} disableNavigation />
          </ScrollView>
          <View className="p-6 pt-0 gap-3">
            <Button
              label="Publier"
              pill
              onPress={() => {
                setPreviewing(false);
                mutation.mutate();
              }}
              loading={mutation.isPending}
            />
            <Button label="Continuer à modifier" variant="secondary" pill onPress={() => setPreviewing(false)} />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
