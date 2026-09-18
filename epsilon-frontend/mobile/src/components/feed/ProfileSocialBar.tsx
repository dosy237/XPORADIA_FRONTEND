import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { Colors } from "@/constants/theme";
import * as feedApi from "@/services/feed";

/** Bouton suivre/ne plus suivre — gère sa propre mutation pour rester
 * réutilisable sur n'importe quelle fiche de profil (enseignant,
 * établissement, entreprise) sans dupliquer la logique à chaque écran. */
export function FollowButton({
  userId,
  initialIsFollowing,
  onChange,
}: {
  userId: number;
  initialIsFollowing: boolean;
  onChange?: (isFollowing: boolean, followersCount: number) => void;
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [pending, setPending] = useState(false);

  const handlePress = async () => {
    if (pending) return;
    setPending(true);
    try {
      const result = await feedApi.toggleFollow(userId);
      setIsFollowing(result.following);
      onChange?.(result.following, result.followers_count);
    } finally {
      setPending(false);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={pending}
      accessibilityRole="button"
      accessibilityLabel={isFollowing ? "Ne plus suivre" : "Suivre"}
      className={`px-6 py-2.5 rounded-full flex-row items-center justify-center gap-2 min-w-[120px] ${
        isFollowing ? "bg-white border border-xporadia-border" : "bg-xporadia-navy"
      }`}
    >
      {pending ? (
        <ActivityIndicator size="small" color={isFollowing ? Colors.navy : Colors.white} />
      ) : (
        <Text className={`text-sm font-semibold ${isFollowing ? "text-xporadia-text-primary" : "text-white"}`}>
          {isFollowing ? "Abonné(e)" : "Suivre"}
        </Text>
      )}
    </Pressable>
  );
}

/** Ligne de compteurs sociaux (publications / abonnés / abonnements) —
 * même trio sur les trois types de profil, comme les fiches Instagram. */
export function ProfileSocialStats({
  postsCount,
  followersCount,
  followingCount,
}: {
  postsCount: number;
  followersCount: number;
  followingCount: number;
}) {
  return (
    <View className="flex-row justify-center gap-10">
      <View className="items-center">
        <Text className="text-base font-bold text-xporadia-navy">{postsCount}</Text>
        <Text className="text-[11px] text-xporadia-text-secondary">Publications</Text>
      </View>
      <View className="items-center">
        <Text className="text-base font-bold text-xporadia-navy">{followersCount}</Text>
        <Text className="text-[11px] text-xporadia-text-secondary">Abonnés</Text>
      </View>
      <View className="items-center">
        <Text className="text-base font-bold text-xporadia-navy">{followingCount}</Text>
        <Text className="text-[11px] text-xporadia-text-secondary">Abonnements</Text>
      </View>
    </View>
  );
}
