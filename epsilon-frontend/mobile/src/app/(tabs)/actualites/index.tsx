import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { PostCard } from "@/components/feed/PostCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PlusIcon, SearchIcon, UsersIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import { useFeedSocket } from "@/hooks/useFeedSocket";
import * as feedApi from "@/services/feed";
import type { Post } from "@/services/feed";
import { useAuthStore } from "@/store/authStore";

function peopleSearchRoute(result: feedApi.PeopleSearchResult) {
  if (result.type === "teacher") return `/(tabs)/directory/${result.id}` as const;
  if (result.type === "establishment") return `/(tabs)/directory/establishment/${result.id}` as const;
  return `/(tabs)/directory/company/${result.id}` as const;
}

function PeopleSearchResults({ query }: { query: string }) {
  const { data: results, isLoading } = useQuery({
    queryKey: ["people-search", query],
    queryFn: () => feedApi.searchPeople(query),
    enabled: query.trim().length > 0,
  });

  if (isLoading) {
    return (
      <View className="py-10 items-center">
        <ActivityIndicator color={Colors.navy} />
      </View>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Text className="text-xs text-xporadia-text-secondary text-center py-6">
        Aucun résultat pour « {query} ».
      </Text>
    );
  }

  return (
    <View className="gap-2">
      {results.map((result) => (
        <Pressable
          key={`${result.type}-${result.id}`}
          onPress={() => router.push(peopleSearchRoute(result))}
          accessibilityRole="button"
          accessibilityLabel={`Voir le profil de ${result.name}`}
          className="bg-white rounded-xl p-3 shadow-soft flex-row items-center gap-3"
        >
          <Avatar firstName={result.name} lastName="" imageUri={result.avatar} size={40} />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-xporadia-text-primary" numberOfLines={1}>
              {result.name}
            </Text>
            <Text className="text-xs text-xporadia-text-secondary">{result.subtitle}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function ComposePrompt() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <Pressable
      onPress={() => router.push("/(tabs)/actualites/compose")}
      className="bg-white rounded-xl p-4 shadow-soft flex-row items-center gap-3"
    >
      <Avatar firstName={user.first_name} lastName={user.last_name} imageUri={user.avatar} size={40} />
      <Text className="flex-1 text-sm text-xporadia-text-secondary">
        Partagez une actualité avec la communauté...
      </Text>
    </Pressable>
  );
}

function UnverifiedNotice() {
  return (
    <View className="bg-xporadia-orange/10 rounded-xl p-4">
      <Text className="text-xs text-xporadia-orange-text leading-5">
        Vérifiez votre compte pour publier et commenter sur le fil d'actualité.
      </Text>
    </View>
  );
}

function GuestComposerPrompt() {
  return (
    <Card className="items-center gap-3 py-6">
      <Text className="text-sm text-xporadia-text-secondary text-center">
        Connectez-vous pour publier une actualité depuis votre profil.
      </Text>
      <Button label="Se connecter" pill onPress={() => router.push("/(auth)/login")} />
    </Card>
  );
}

export default function ActualitesScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isVerified = useAuthStore((s) => s.user?.is_verified);
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => feedApi.fetchPosts(),
  });

  useFeedSocket(undefined, {
    onPostCreated: (post) => {
      queryClient.setQueryData<Post[]>(["posts"], (current) => {
        if (!current) return current;
        if (current.some((p) => p.id === post.id)) return current;
        return [post, ...current];
      });
    },
    onPostDeleted: (postId) => {
      queryClient.setQueryData<Post[]>(["posts"], (current) => current?.filter((p) => p.id !== postId));
    },
    onLikeUpdated: (postId, likeCount) => {
      queryClient.setQueryData<Post[]>(["posts"], (current) =>
        current?.map((p) => (p.id === postId ? { ...p, like_count: likeCount } : p)),
      );
    },
    onCommentCountUpdated: (postId, commentCount) => {
      queryClient.setQueryData<Post[]>(["posts"], (current) =>
        current?.map((p) => (p.id === postId ? { ...p, comment_count: commentCount } : p)),
      );
    },
  });

  const likeMutation = useMutation({
    mutationFn: (postId: number) => feedApi.togglePostLike(postId),
    onSuccess: (result, postId) => {
      queryClient.setQueryData<typeof posts>(["posts"], (current) =>
        current?.map((p) =>
          p.id === postId ? { ...p, is_liked_by_me: result.liked, like_count: result.like_count } : p,
        ),
      );
    },
  });

  const handleComposePress = () => {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    router.push("/(tabs)/actualites/compose");
  };

  return (
    <View className="flex-1 bg-xporadia-bg">
      <ScrollView contentContainerClassName="p-6 gap-4 pb-24">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-xporadia-navy">Actualités</Text>
          <Text className="text-sm text-xporadia-text-secondary">
            Ce que la communauté Xporadia partage en ce moment.
          </Text>
        </View>

        <Input
          placeholder="Rechercher un enseignant, un établissement, une entreprise..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Rechercher une personne ou un compte"
          leftIcon={<SearchIcon size={18} color={Colors.textSecondary} />}
        />

        {searchQuery.trim().length > 0 ? (
          <PeopleSearchResults query={searchQuery.trim()} />
        ) : (
          <>
            {isAuthenticated ? (isVerified ? <ComposePrompt /> : <UnverifiedNotice />) : <GuestComposerPrompt />}

            {isLoading ? (
              <View className="py-10 items-center">
                <ActivityIndicator color={Colors.navy} />
              </View>
            ) : posts && posts.length > 0 ? (
              <View className="gap-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} onToggleLike={() => likeMutation.mutate(post.id)} />
                ))}
              </View>
            ) : (
              <View className="items-center gap-3 py-10">
                <View className="h-14 w-14 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
                  <UsersIcon color={Colors.textSecondary} size={26} />
                </View>
                <Text className="text-sm font-semibold text-xporadia-text-primary">
                  Aucune actualité pour l'instant
                </Text>
                <Text className="text-xs text-xporadia-text-secondary text-center px-8">
                  Soyez le premier à partager quelque chose avec la communauté.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Pressable
        onPress={handleComposePress}
        accessibilityRole="button"
        accessibilityLabel="Publier une actualité"
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-xporadia-orange items-center justify-center shadow-deep-orange"
      >
        <PlusIcon size={22} color={Colors.white} />
      </Pressable>
    </View>
  );
}
