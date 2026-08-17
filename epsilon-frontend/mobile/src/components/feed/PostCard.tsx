import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Dimensions, Pressable, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { HeartIcon, MoreIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import { FullscreenImageViewer } from "@/components/feed/FullscreenImageViewer";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import * as feedApi from "@/services/feed";
import type { Post } from "@/services/feed";
import { useAuthStore } from "@/store/authStore";

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onToggleLike?: () => void;
  onOpenComments?: () => void;
  /** Désactive la navigation vers le détail, utilisé sur l'écran détail lui-même. */
  disableNavigation?: boolean;
}

const IMAGE_WIDTH = Math.min(Dimensions.get("window").width - 48, 400);

function ImageCarousel({ images, onImagePress }: { images: Post["images"]; onImagePress: (index: number) => void }) {
  if (images.length === 0) return null;
  if (images.length === 1) {
    return (
      <Pressable onPress={() => onImagePress(0)} accessibilityRole="button" accessibilityLabel="Agrandir la photo">
        <Image
          source={{ uri: images[0].image }}
          style={{ width: "100%", height: 200, borderRadius: 14 }}
          contentFit="cover"
        />
      </Pressable>
    );
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
      {images.map((img, index) => (
        <Pressable
          key={img.id}
          onPress={() => onImagePress(index)}
          accessibilityRole="button"
          accessibilityLabel="Agrandir la photo"
        >
          <Image
            source={{ uri: img.image }}
            style={{ width: IMAGE_WIDTH * 0.8, height: 180, borderRadius: 14 }}
            contentFit="cover"
          />
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function PostCard({ post, onToggleLike, onOpenComments, disableNavigation }: PostCardProps) {
  const [firstName, ...rest] = post.author.full_name.split(" ");
  const lastName = rest.join(" ");
  const relativeTime = useRelativeTime(post.created_at);
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOwnPost = currentUser?.id === post.author.id;
  const isAdmin = currentUser?.primary_role === "admin";
  const canManage = isOwnPost || isAdmin;

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.body);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const followMutation = useMutation({
    mutationFn: () => feedApi.toggleFollow(post.author.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["my-following"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => feedApi.updatePost(post.id, draft.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setEditing(false);
    },
    onError: () => Alert.alert("Erreur", "Impossible de modifier cette publication."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => feedApi.deletePost(post.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
    onError: () => Alert.alert("Erreur", "Impossible de supprimer cette publication."),
  });

  const handleFollowPress = () => {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    followMutation.mutate();
  };

  const content = (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <Avatar firstName={firstName} lastName={lastName} imageUri={post.author.avatar} size={44} />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-xporadia-text-primary">{post.author.full_name}</Text>
          <Text className="text-xs text-xporadia-text-secondary">
            {post.author.role_label} · {relativeTime}
          </Text>
        </View>
        {!isOwnPost ? (
          <Pressable
            onPress={handleFollowPress}
            hitSlop={8}
            disabled={followMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel={post.author.is_followed_by_me ? "Ne plus suivre" : "Suivre"}
            className={`rounded-full px-3 py-1.5 border ${
              post.author.is_followed_by_me
                ? "border-xporadia-border bg-white"
                : "border-xporadia-orange bg-xporadia-orange/10"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                post.author.is_followed_by_me ? "text-xporadia-text-secondary" : "text-xporadia-orange-text"
              }`}
            >
              {post.author.is_followed_by_me ? "Suivi" : "Suivre"}
            </Text>
          </Pressable>
        ) : null}
        {canManage ? (
          <Pressable
            onPress={() => setMenuOpen((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Options de la publication"
          >
            <MoreIcon size={18} color={Colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {menuOpen ? (
        <View className="flex-row gap-4 -mt-1">
          <Text
            className="text-xs font-semibold text-xporadia-navy"
            onPress={() => {
              setDraft(post.body);
              setEditing(true);
              setMenuOpen(false);
            }}
            suppressHighlighting
          >
            Modifier
          </Text>
          <Text
            className="text-xs font-semibold text-xporadia-red"
            onPress={() => {
              setMenuOpen(false);
              Alert.alert("Supprimer cette publication ?", undefined, [
                { text: "Annuler", style: "cancel" },
                { text: "Supprimer", style: "destructive", onPress: () => deleteMutation.mutate() },
              ]);
            }}
            suppressHighlighting
          >
            Supprimer
          </Text>
        </View>
      ) : null}

      <ImageCarousel images={post.images} onImagePress={setViewerIndex} />
      <FullscreenImageViewer
        images={post.images}
        initialIndex={viewerIndex ?? 0}
        visible={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
      />

      {editing ? (
        <View className="gap-2">
          <Input value={draft} onChangeText={setDraft} multiline numberOfLines={3} />
          <View className="flex-row gap-3">
            <Text
              className="text-xs font-semibold text-xporadia-text-secondary"
              onPress={() => setEditing(false)}
              suppressHighlighting
            >
              Annuler
            </Text>
            <Text
              className="text-xs font-semibold text-xporadia-orange-text"
              onPress={() => draft.trim() && updateMutation.mutate()}
              suppressHighlighting
            >
              {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Text>
          </View>
        </View>
      ) : (
        <>
          {post.title ? (
            <Text className="text-base font-bold text-xporadia-text-primary">{post.title}</Text>
          ) : null}
          <Text className="text-sm text-xporadia-text-primary leading-6">{post.body}</Text>
        </>
      )}

      {post.hashtags.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5">
          {post.hashtags.map((tag) => (
            <Text key={tag} className="text-xs font-semibold text-xporadia-orange-text">
              #{tag}
            </Text>
          ))}
        </View>
      ) : null}

      <View className="flex-row items-center gap-5 pt-1">
        <Pressable
          onPress={onToggleLike}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={post.is_liked_by_me ? "Retirer le j'aime" : "Aimer cette publication"}
          className="flex-row items-center gap-1.5"
        >
          <HeartIcon size={18} color={post.is_liked_by_me ? Colors.orange : Colors.textSecondary} filled={post.is_liked_by_me} />
          <Text className="text-xs font-medium text-xporadia-text-secondary">{post.like_count}</Text>
        </Pressable>
        <Pressable
          onPress={onOpenComments ?? (() => !disableNavigation && router.push(`/(tabs)/actualites/${post.id}`))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voir les commentaires"
          className="flex-row items-center gap-1.5"
        >
          <Text className="text-xs font-medium text-xporadia-text-secondary">
            {post.comment_count} commentaire{post.comment_count !== 1 ? "s" : ""}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  if (disableNavigation) {
    return <Card variant="raised">{content}</Card>;
  }

  return (
    <Card
      variant="raised"
      onPress={() => router.push(`/(tabs)/actualites/${post.id}`)}
      accessibilityLabel={`Publication de ${post.author.full_name}`}
    >
      {content}
    </Card>
  );
}
