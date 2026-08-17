import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon, ClockIcon, PinIcon, UsersIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as internshipsApi from "@/services/internships";

const LEVEL_LABELS: Record<string, string> = {
  "3e": "Troisième",
  "2nde": "Seconde",
  "1ere": "Première",
  terminale: "Terminale",
};

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-1 bg-xporadia-bg rounded-2xl p-3 gap-2 items-center">
      <View className="h-9 w-9 rounded-full bg-white items-center justify-center shadow-soft">{icon}</View>
      <Text className="text-sm font-bold text-xporadia-navy" numberOfLines={1}>
        {value}
      </Text>
      <Text className="text-[11px] text-xporadia-text-secondary">{label}</Text>
    </View>
  );
}

export default function InternshipOfferDetailScreen() {
  const { offerId } = useLocalSearchParams<{ offerId: string }>();

  const { data: offer, isLoading } = useQuery({
    queryKey: ["internship-offer", offerId],
    queryFn: () => internshipsApi.fetchInternshipOffer(offerId),
    enabled: !!offerId,
  });

  if (isLoading || !offer) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-5 pb-12">
      {offer.cover_image ? (
        <Image source={{ uri: offer.cover_image }} style={{ width: "100%", height: 180, borderRadius: 16 }} contentFit="cover" />
      ) : null}

      <View className="gap-2">
        <View className="flex-row items-start justify-between gap-3">
          <Text className="text-xl font-bold text-xporadia-navy flex-1">{offer.title}</Text>
          {offer.is_premium && <Chip label="Premium" variant="orange" />}
        </View>
        <Text className="text-sm text-xporadia-text-secondary">{offer.company.company_name}</Text>
        <View className="flex-row gap-2">
          <Chip label={LEVEL_LABELS[offer.level] ?? offer.level} variant="navy-subtle" />
          <Chip label={offer.domain} variant="navy-subtle" />
        </View>
      </View>

      <View className="bg-white rounded-3xl p-6 shadow-soft gap-5">
        <View className="flex-row gap-3">
          <StatBox icon={<PinIcon color={Colors.navy} size={18} />} label="Ville" value={offer.city} />
          <StatBox icon={<ClockIcon color={Colors.navy} size={18} />} label="Durée" value={`${offer.duration_weeks} sem.`} />
          <StatBox icon={<UsersIcon color={Colors.navy} size={18} />} label="Places" value={String(offer.places)} />
        </View>

        <View className="gap-2">
          <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Missions</Text>
          <Text className="text-sm text-xporadia-text-primary leading-6">{offer.missions}</Text>
        </View>

        {offer.skills_wanted.length > 0 && (
          <View className="gap-2">
            <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Compétences recherchées</Text>
            <View className="flex-row flex-wrap gap-2">
              {offer.skills_wanted.map((skill) => (
                <Chip key={skill} label={skill} variant="neutral" />
              ))}
            </View>
          </View>
        )}

        <View className="flex-row items-center gap-2 pt-1">
          <BriefcaseIcon size={14} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">
            Période du {new Date(offer.period_start).toLocaleDateString("fr-FR")} au{" "}
            {new Date(offer.period_end).toLocaleDateString("fr-FR")}
          </Text>
        </View>
      </View>

      <Text className="text-xs text-xporadia-text-secondary text-center leading-5">
        Cette offre est publiée par un établissement pour ses élèves. La candidature se fait via votre
        établissement, dans l'onglet Stages du tableau de bord Directeur.
      </Text>
    </ScrollView>
  );
}
