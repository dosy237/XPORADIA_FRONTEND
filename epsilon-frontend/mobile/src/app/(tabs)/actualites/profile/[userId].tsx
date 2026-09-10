import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { AuthorPostsList } from "@/components/feed/AuthorPostsList";
import { FollowButton, ProfileSocialStats } from "@/components/feed/ProfileSocialBar";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import * as feedApi from "@/services/feed";
import { useAuthStore } from "@/store/authStore";

/** Fiche de profil générique — accessible en tapant sur l'auteur de
 * n'importe quelle publication du fil, quel que soit son rôle. Les
 * annuaires dédiés (enseignant, établissement, entreprise) restent plus
 * complets pour ces rôles-là ; cette fiche couvre le socle commun
 * (identité, photo, abonnés, publications) pour tout le monde, y compris
 * parent, élève, formateur ou administrateur. */
export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [followersCount, setFollowersCount] = useState<number | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: () => feedApi.fetchPublicProfile(Number(userId)),
    enabled: !!userId,
  });

  if (isLoading || !profile) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  const [firstName, ...rest] = profile.full_name.split(" ");
  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="pb-12">
      <View className="items-center pt-10 pb-5">
        <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
          <View className="absolute -top-6 -left-10 h-44 w-44 rounded-full bg-xporadia-navy/[0.05]" />
          <View className="absolute -top-8 -right-12 h-32 w-32 rounded-full bg-xporadia-orange/[0.07]" />
        </View>
        <Avatar firstName={firstName} lastName={rest.join(" ")} imageUri={profile.avatar} />
        <Text className="text-xl font-bold text-xporadia-navy mt-3">{profile.full_name}</Text>
        <View className="mt-2">
          <Chip label={profile.role_label} variant="navy-subtle" />
        </View>
        {profile.subtitle && profile.subtitle !== profile.role_label ? (
          <Text className="text-sm text-xporadia-text-secondary mt-1">{profile.subtitle}</Text>
        ) : null}
        <View className="mt-4">
          <ProfileSocialStats
            postsCount={profile.posts_count}
            followersCount={followersCount ?? profile.followers_count}
            followingCount={profile.following_count}
          />
        </View>
        {isAuthenticated && !isOwnProfile ? (
          <View className="mt-4">
            <FollowButton
              userId={profile.id}
              initialIsFollowing={profile.is_following}
              onChange={(_isFollowing, count) => setFollowersCount(count)}
            />
          </View>
        ) : null}
        {!isAuthenticated ? (
          <Text
            className="text-xs font-semibold text-xporadia-orange-text mt-4"
            onPress={() => router.push("/(auth)/login")}
            suppressHighlighting
          >
            Connectez-vous pour suivre ce profil
          </Text>
        ) : null}
      </View>

      <View className="px-6 gap-3">
        <Text className="text-base font-bold text-xporadia-navy">
          Publications{profile.posts_count > 0 ? ` (${profile.posts_count})` : ""}
        </Text>
        <AuthorPostsList authorId={profile.id} />
      </View>
    </ScrollView>
  );
}
