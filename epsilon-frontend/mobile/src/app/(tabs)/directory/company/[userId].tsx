import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { AdminModerationBar } from "@/components/admin/AdminModerationBar";
import { AuthorPostsList } from "@/components/feed/AuthorPostsList";
import { FollowButton, ProfileSocialStats } from "@/components/feed/ProfileSocialBar";
import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon, PinIcon } from "@/components/ui/Icon";
import { StatBox } from "@/components/ui/StatBox";
import { Colors } from "@/constants/theme";
import { openInMaps } from "@/lib/openInMaps";
import * as companyApi from "@/services/companyDirectory";
import { useAuthStore } from "@/store/authStore";

export default function CompanyDirectoryDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUser = useAuthStore((s) => s.user);
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  // Seul un directeur candidate au nom d'un élève — l'établissement reste
  // le médiateur de la candidature (voir InternshipApplication.school côté
  // backend). Pour les autres rôles, on ouvre simplement la fiche publique.
  const isDirector = currentUser?.primary_role === "director";

  const { data: company, isLoading } = useQuery({
    queryKey: ["company-directory-detail", userId],
    queryFn: () => companyApi.fetchCompanyDirectoryDetail(Number(userId)),
    enabled: !!userId,
  });

  if (isLoading || !company) {
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
        <Avatar firstName={company.company_name} lastName="" imageUri={company.avatar} />
        <Text className="text-xl font-bold text-xporadia-navy mt-3 text-center px-6">
          {company.company_name}
        </Text>
        <View className="mt-2 flex-row gap-2">
          <Chip label="Entreprise" variant="navy-subtle" />
          {company.is_partner && <Chip label="Partenaire Xporadia" variant="orange" />}
          {company.average_rating !== null && (
            <Chip label={`${company.average_rating}/5 (${company.review_count} avis)`} variant="orange" />
          )}
        </View>
        <View className="mt-4">
          <ProfileSocialStats
            postsCount={company.posts_count}
            followersCount={followersCount ?? company.followers_count}
            followingCount={company.following_count}
          />
        </View>
        {isAuthenticated && currentUser?.id !== company.id ? (
          <View className="mt-4">
            <FollowButton
              userId={company.id}
              initialIsFollowing={company.is_following}
              onChange={(_isFollowing, count) => setFollowersCount(count)}
            />
          </View>
        ) : null}
      </View>

      <View className="px-6 gap-5">
        <AdminModerationBar
          userId={Number(userId)}
          isPartner={company.is_partner}
          invalidateKey={["company-directory-detail", userId]}
        />

        <View className="bg-white rounded-3xl p-6 shadow-soft gap-5">
          <View className="flex-row gap-3">
            <StatBox
              icon={<PinIcon color={Colors.navy} size={18} />}
              label="Adresse"
              value={company.address || "Non renseigné"}
              onPress={company.address ? () => openInMaps(company.address) : undefined}
            />
            <StatBox
              icon={<BriefcaseIcon color={Colors.navy} size={18} />}
              label="Secteur"
              value={company.sector || "Non renseigné"}
            />
            <StatBox
              icon={<BriefcaseIcon color={Colors.navy} size={18} />}
              label="Stages ouverts"
              value={String(company.open_internship_offers.length)}
            />
          </View>
        </View>

        {company.open_internship_offers.length > 0 && (
          <View className="gap-3">
            <Text className="text-base font-bold text-xporadia-navy">Offres de stage ouvertes</Text>
            {company.open_internship_offers.map((offer) => (
              <Pressable
                key={offer.id}
                onPress={() =>
                  router.push(
                    isDirector
                      ? `/(app)/director/internship-offers/${offer.id}`
                      : `/(tabs)/certifications/stage/${offer.id}`,
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={isDirector ? `Postuler à l'offre ${offer.title}` : `Voir l'offre ${offer.title}`}
                className="bg-white rounded-2xl p-4 shadow-soft gap-1.5"
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-sm font-semibold text-xporadia-text-primary flex-1">{offer.title}</Text>
                  {offer.is_premium && <Chip label="Premium" variant="orange" />}
                </View>
                <Text className="text-xs text-xporadia-text-secondary">
                  {offer.domain} · {offer.city}
                </Text>
                {isDirector && (
                  <Text className="text-xs font-semibold text-xporadia-orange-text mt-1">
                    Postuler pour un élève →
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        )}

        <View className="gap-3">
          <Text className="text-base font-bold text-xporadia-navy">
            Publications{company.posts_count > 0 ? ` (${company.posts_count})` : ""}
          </Text>
          <AuthorPostsList authorId={company.id} />
        </View>
      </View>
    </ScrollView>
  );
}
