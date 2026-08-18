import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View, ScrollView } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { AdminModerationBar } from "@/components/admin/AdminModerationBar";
import { AuthorPostsList } from "@/components/feed/AuthorPostsList";
import { FollowButton, ProfileSocialStats } from "@/components/feed/ProfileSocialBar";
import { Chip } from "@/components/ui/Chip";
import { BuildingIcon, PinIcon, UsersIcon } from "@/components/ui/Icon";
import { StatBox } from "@/components/ui/StatBox";
import { Colors } from "@/constants/theme";
import { openInMaps } from "@/lib/openInMaps";
import * as establishmentApi from "@/services/establishmentDirectory";
import { useAuthStore } from "@/store/authStore";

export default function FeedEstablishmentDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUser = useAuthStore((s) => s.user);
  const [followersCount, setFollowersCount] = useState<number | null>(null);

  const { data: establishment, isLoading } = useQuery({
    queryKey: ["establishment-directory-detail", userId],
    queryFn: () => establishmentApi.fetchEstablishmentDirectoryDetail(Number(userId)),
    enabled: !!userId,
  });

  if (isLoading || !establishment) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="pb-12">
      <View className="items-center pt-10 pb-5">
        <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
          <View className="absolute -top-6 -left-10 h-44 w-44 rounded-full bg-xporadia-navy/[0.05]" />
          <View className="absolute -top-8 -right-12 h-32 w-32 rounded-full bg-xporadia-orange/[0.07]" />
        </View>
        <Avatar firstName={establishment.school_name} lastName="" imageUri={establishment.avatar} />
        <Text className="text-xl font-bold text-xporadia-navy mt-3 text-center px-6">
          {establishment.school_name}
        </Text>
        <View className="mt-2 flex-row gap-2">
          <Chip label="Établissement" variant="navy-subtle" />
          {establishment.is_partner && <Chip label="Partenaire Xporadia" variant="orange" />}
          {establishment.average_rating !== null && (
            <Chip label={`${establishment.average_rating}/5 (${establishment.review_count} avis)`} variant="orange" />
          )}
        </View>
        <View className="mt-4">
          <ProfileSocialStats
            postsCount={establishment.posts_count}
            followersCount={followersCount ?? establishment.followers_count}
            followingCount={establishment.following_count}
          />
        </View>
        {isAuthenticated && currentUser?.id !== establishment.id ? (
          <View className="mt-4">
            <FollowButton
              userId={establishment.id}
              initialIsFollowing={establishment.is_following}
              onChange={(_isFollowing, count) => setFollowersCount(count)}
            />
          </View>
        ) : null}
      </View>

      <View className="px-6 gap-5">
        <AdminModerationBar
          userId={Number(userId)}
          isPartner={establishment.is_partner}
          invalidateKey={["establishment-directory-detail", userId]}
        />

        <View className="bg-white rounded-3xl p-6 shadow-soft gap-5">
          <View className="flex-row gap-3">
            <StatBox
              icon={<PinIcon color={Colors.navy} size={18} />}
              label="Adresse"
              value={establishment.address || "Non renseigné"}
              onPress={establishment.address ? () => openInMaps(establishment.address) : undefined}
            />
            <StatBox
              icon={<UsersIcon color={Colors.navy} size={18} />}
              label="Élèves"
              value={String(establishment.student_count)}
            />
            <StatBox
              icon={<BuildingIcon color={Colors.navy} size={18} />}
              label="Départements"
              value={String(establishment.departments.length)}
            />
          </View>

          {establishment.levels_taught.length > 0 && (
            <View className="gap-2">
              <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
                Niveaux enseignés
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {establishment.levels_taught.map((level) => (
                  <Chip key={level} label={level} variant="navy-subtle" />
                ))}
              </View>
            </View>
          )}
        </View>

        {establishment.departments.length > 0 && (
          <View className="gap-3">
            <Text className="text-base font-bold text-xporadia-navy">Départements</Text>
            {establishment.departments.map((dept) => (
              <View key={dept.id} className="bg-white rounded-2xl p-4 shadow-soft gap-1">
                <Text className="text-sm font-semibold text-xporadia-text-primary">{dept.name}</Text>
                {dept.description ? (
                  <Text className="text-xs text-xporadia-text-secondary leading-5">
                    {dept.description}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        <View className="gap-3">
          <Text className="text-base font-bold text-xporadia-navy">
            Publications{establishment.posts_count > 0 ? ` (${establishment.posts_count})` : ""}
          </Text>
          <AuthorPostsList authorId={establishment.id} />
        </View>
      </View>
    </ScrollView>
  );
}
