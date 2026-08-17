import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { PostCard } from "@/components/feed/PostCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { HeartIcon, TrashIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import { useFeedSocket } from "@/hooks/useFeedSocket";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import * as feedApi from "@/services/feed";
import { useAuthStore } from "@/store/authStore";

function CommentRow({
  comment,
  canDelete,
  onDelete,
  onToggleLike,
}: {
  comment: feedApi.PostComment;
  canDelete: boolean;
  onDelete: () => void;
  onToggleLike: () => void;
}) {
  const [firstName, ...rest] = comment.author.full_name.split(" ");
  const relativeTime = useRelativeTime(comment.created_at);
  return (
    <View className="flex-row items-start gap-3">
      <Avatar firstName={firstName} lastName={rest.join(" ")} imageUri={comment.author.avatar} size={36} />
      <View className="flex-1 bg-white rounded-2xl px-4 py-3 shadow-soft">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-xs font-semibold text-xporadia-text-primary flex-1" numberOfLines={1}>
            {comment.author.full_name}
          </Text>
          <View className="flex-row items-center gap-2 flex-shrink-0">
            <Text className="text-[10px] text-xporadia-text-secondary">{relativeTime}</Text>
            {canDelete ? (
              <Pressable
                onPress={onDelete}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Supprimer ce commentaire"
              >
                <TrashIcon size={12} color={Colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        </View>
        <Text className="text-sm text-xporadia-text-primary mt-1">{comment.body}</Text>
        <Pressable
          onPress={onToggleLike}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={comment.is_liked_by_me ? "Ne plus aimer ce commentaire" : "Aimer ce commentaire"}
          className="flex-row items-center gap-1 mt-2 self-start"
        >
          <HeartIcon
            size={13}
            color={comment.is_liked_by_me ? Colors.orange : Colors.textSecondary}
            filled={comment.is_liked_by_me}
          />
          {comment.like_count > 0 ? (
            <Text className="text-[10px] text-xporadia-text-secondary">{comment.like_count}</Text>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isVerified = useAuthStore((s) => s.user?.is_verified);
  const [comment, setComment] = useState("");

  const { data: posts } = useQuery({ queryKey: ["posts"], queryFn: () => feedApi.fetchPosts() });
  const post = posts?.find((p) => p.id === Number(postId));

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: () => feedApi.fetchPostComments(Number(postId)),
    enabled: !!postId,
  });

  useFeedSocket(Number(postId) || undefined, {
    onCommentCreated: (newComment) => {
      queryClient.setQueryData<feedApi.PostComment[]>(["post-comments", postId], (current) => {
        if (!current) return current;
        if (current.some((c) => c.id === newComment.id)) return current;
        return [...current, newComment];
      });
    },
    onLikeUpdated: (_postId, likeCount) => {
      queryClient.setQueryData<typeof posts>(["posts"], (current) =>
        current?.map((p) => (p.id === Number(postId) ? { ...p, like_count: likeCount } : p)),
      );
    },
    onCommentDeleted: (commentId) => {
      queryClient.setQueryData<feedApi.PostComment[]>(["post-comments", postId], (current) =>
        current?.filter((c) => c.id !== commentId),
      );
    },
    onCommentLikeUpdated: (commentId, likeCount) => {
      queryClient.setQueryData<feedApi.PostComment[]>(["post-comments", postId], (current) =>
        current?.map((c) => (c.id === commentId ? { ...c, like_count: likeCount } : c)),
      );
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => feedApi.deletePostComment(Number(postId), commentId),
    onSuccess: (_data, commentId) => {
      queryClient.setQueryData<feedApi.PostComment[]>(["post-comments", postId], (current) =>
        current?.filter((c) => c.id !== commentId),
      );
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: () => Alert.alert("Erreur", "Impossible de supprimer ce commentaire."),
  });

  const likeMutation = useMutation({
    mutationFn: () => feedApi.togglePostLike(Number(postId)),
    onSuccess: (result) => {
      queryClient.setQueryData<typeof posts>(["posts"], (current) =>
        current?.map((p) =>
          p.id === Number(postId) ? { ...p, is_liked_by_me: result.liked, like_count: result.like_count } : p,
        ),
      );
    },
  });

  const commentLikeMutation = useMutation({
    mutationFn: (commentId: number) => feedApi.toggleCommentLike(Number(postId), commentId),
    onSuccess: (result, commentId) => {
      queryClient.setQueryData<feedApi.PostComment[]>(["post-comments", postId], (current) =>
        current?.map((c) =>
          c.id === commentId ? { ...c, is_liked_by_me: result.liked, like_count: result.like_count } : c,
        ),
      );
    },
  });

  const commentMutation = useMutation({
    mutationFn: () => feedApi.createPostComment(Number(postId), comment.trim()),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => feedApi.deletePost(Number(postId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      router.back();
    },
  });

  const currentUser = useAuthStore((s) => s.user);
  const isAuthor = post?.author.id === currentUser?.id;

  if (!post) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <ActivityIndicator color={Colors.navy} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-xporadia-bg" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerClassName="p-6 gap-4 pb-6">
        <PostCard post={post} onToggleLike={() => likeMutation.mutate()} disableNavigation />

        {isAuthor ? (
          <Text
            className="text-xs text-xporadia-red font-semibold text-center"
            onPress={() =>
              Alert.alert("Supprimer la publication", "Cette action est définitive.", [
                { text: "Annuler", style: "cancel" },
                { text: "Supprimer", style: "destructive", onPress: () => deleteMutation.mutate() },
              ])
            }
            suppressHighlighting
          >
            Supprimer ma publication
          </Text>
        ) : null}

        <Text className="text-sm font-bold text-xporadia-navy mt-2">
          Commentaires {comments ? `(${comments.length})` : ""}
        </Text>

        {commentsLoading ? (
          <ActivityIndicator color={Colors.navy} />
        ) : comments && comments.length > 0 ? (
          <View className="gap-3">
            {comments.map((c) => (
              <CommentRow
                key={c.id}
                comment={c}
                canDelete={c.author.id === currentUser?.id || currentUser?.primary_role === "admin"}
                onDelete={() =>
                  Alert.alert("Supprimer ce commentaire ?", undefined, [
                    { text: "Annuler", style: "cancel" },
                    { text: "Supprimer", style: "destructive", onPress: () => deleteCommentMutation.mutate(c.id) },
                  ])
                }
                onToggleLike={() => commentLikeMutation.mutate(c.id)}
              />
            ))}
          </View>
        ) : (
          <Text className="text-xs text-xporadia-text-secondary text-center py-4">
            Aucun commentaire pour l'instant.
          </Text>
        )}
      </ScrollView>

      {isAuthenticated && isVerified ? (
        <View className="flex-row items-center gap-3 px-6 py-3 bg-white border-t border-xporadia-border">
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Ajouter un commentaire..."
            placeholderTextColor="#94A3B8"
            className="flex-1 bg-xporadia-bg rounded-full px-4 py-3 text-sm text-xporadia-text-primary"
          />
          <Button
            label="Envoyer"
            pill
            onPress={() => commentMutation.mutate()}
            loading={commentMutation.isPending}
            disabled={comment.trim().length === 0}
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
