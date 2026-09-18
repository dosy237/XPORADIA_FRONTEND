import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, View } from "react-native";

import { PostCard } from "@/components/feed/PostCard";
import * as feedApi from "@/services/feed";
import type { Post } from "@/services/feed";

/** Publications d'un compte donné — alimente l'onglet "Publications" d'un
 * profil public (enseignant, établissement, entreprise), tapé depuis
 * l'annuaire, la recherche ou n'importe quel post du fil. */
export function AuthorPostsList({ authorId }: { authorId: number }) {
  const queryClient = useQueryClient();
  const queryKey = ["posts", { author: authorId }];

  const { data: posts, isLoading } = useQuery({
    queryKey,
    queryFn: () => feedApi.fetchPosts({ authorId }),
  });

  const likeMutation = useMutation({
    mutationFn: (postId: number) => feedApi.togglePostLike(postId),
    onSuccess: (result, postId) => {
      queryClient.setQueryData<Post[]>(queryKey, (current) =>
        current?.map((p) =>
          p.id === postId ? { ...p, is_liked_by_me: result.liked, like_count: result.like_count } : p,
        ),
      );
    },
  });

  if (isLoading) return null;

  if (!posts || posts.length === 0) {
    return (
      <Text className="text-xs text-xporadia-text-secondary text-center py-4">
        Aucune publication pour l&apos;instant.
      </Text>
    );
  }

  return (
    <View className="gap-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onToggleLike={() => likeMutation.mutate(post.id)} />
      ))}
    </View>
  );
}
