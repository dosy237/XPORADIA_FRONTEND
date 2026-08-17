import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon, ClockIcon, MedalIcon, PinIcon } from "@/components/ui/Icon";
import { CATEGORY_LABELS, LEVEL_LABELS } from "@/constants/certificationLevels";
import { Colors } from "@/constants/theme";
import * as certificationApi from "@/services/certification";
import type { CertificationLevel, TrainingModule } from "@/services/certification";
import * as internshipsApi from "@/services/internships";
import type { InternshipOffer } from "@/services/internships";

type CatalogTab = "certifications" | "internships";

const LEVEL_FILTERS: CertificationLevel[] = ["bronze", "silver", "gold"];

function ModuleCard({ module }: { module: TrainingModule }) {
  return (
    <Card
      onPress={() => router.push(`/(tabs)/certifications/${module.id}`)}
      accessibilityLabel={`Voir le module ${module.title}`}
      className="gap-2"
    >
      <View className="flex-row items-start justify-between gap-2">
        <Text className="text-base font-semibold text-xporadia-text-primary flex-1">{module.title}</Text>
        <Chip label={LEVEL_LABELS[module.target_level]} variant="navy-subtle" />
      </View>
      <Text className="text-xs text-xporadia-text-secondary">
        {CATEGORY_LABELS[module.category] ?? module.category}
      </Text>
      <Text className="text-sm text-xporadia-text-secondary leading-5" numberOfLines={2}>
        {module.description}
      </Text>
      <View className="flex-row items-center gap-4 pt-1">
        <View className="flex-row items-center gap-1.5">
          <ClockIcon size={14} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">{module.duration_hours}h</Text>
        </View>
        <Text className="text-xs font-semibold text-xporadia-navy">
          {module.price.toLocaleString("fr-FR")} FCFA
        </Text>
      </View>
    </Card>
  );
}

function InternshipOfferCard({ offer }: { offer: InternshipOffer }) {
  return (
    <Card
      onPress={() => router.push(`/(tabs)/certifications/stage/${offer.id}`)}
      accessibilityLabel={`Voir l'offre de stage ${offer.title}`}
      className="gap-2"
    >
      <View className="flex-row items-start justify-between gap-2">
        <Text className="text-base font-semibold text-xporadia-text-primary flex-1">{offer.title}</Text>
        {offer.is_premium && <Chip label="Premium" variant="orange" />}
      </View>
      <Text className="text-xs text-xporadia-text-secondary">{offer.company.company_name}</Text>
      <Text className="text-sm text-xporadia-text-secondary leading-5" numberOfLines={2}>
        {offer.missions}
      </Text>
      <View className="flex-row items-center gap-4 pt-1">
        <View className="flex-row items-center gap-1.5">
          <PinIcon size={14} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">{offer.city}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <ClockIcon size={14} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">{offer.duration_weeks} sem.</Text>
        </View>
        <Text className="text-xs font-semibold text-xporadia-navy">{offer.places} place(s)</Text>
      </View>
    </Card>
  );
}

export default function CatalogScreen() {
  const [tab, setTab] = useState<CatalogTab>("certifications");
  const [level, setLevel] = useState<CertificationLevel | null>(null);

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ["public-certification-modules", level],
    queryFn: () => certificationApi.fetchTrainingModules(level ? { target_level: level } : undefined),
    enabled: tab === "certifications",
  });

  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ["public-internship-offers"],
    queryFn: () => internshipsApi.fetchInternshipOffers(),
    enabled: tab === "internships",
  });

  const isLoading = tab === "certifications" ? modulesLoading : offersLoading;

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Certifications & Stages</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Le catalogue des parcours de certification et des offres de stage disponibles.
        </Text>
      </View>

      <View className="flex-row bg-white rounded-full p-1 shadow-soft">
        <Pressable
          onPress={() => setTab("certifications")}
          className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-full ${
            tab === "certifications" ? "bg-xporadia-navy" : "bg-transparent"
          }`}
        >
          <MedalIcon size={16} color={tab === "certifications" ? Colors.white : Colors.textSecondary} />
          <Text
            className={`text-sm font-semibold ${tab === "certifications" ? "text-white" : "text-xporadia-text-secondary"}`}
          >
            Certifications
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("internships")}
          className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-full ${
            tab === "internships" ? "bg-xporadia-navy" : "bg-transparent"
          }`}
        >
          <BriefcaseIcon size={16} color={tab === "internships" ? Colors.white : Colors.textSecondary} />
          <Text
            className={`text-sm font-semibold ${tab === "internships" ? "text-white" : "text-xporadia-text-secondary"}`}
          >
            Stages
          </Text>
        </Pressable>
      </View>

      {tab === "certifications" && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          <Chip label="Tous niveaux" variant={level === null ? "navy" : "neutral"} onPress={() => setLevel(null)} />
          {LEVEL_FILTERS.map((lvl) => (
            <Chip key={lvl} label={LEVEL_LABELS[lvl]} variant={level === lvl ? "navy" : "neutral"} onPress={() => setLevel(lvl)} />
          ))}
        </ScrollView>
      )}

      {isLoading ? (
        <View className="gap-3">
          {[0, 1, 2].map((i) => (
            <View key={i} className="h-[100px] rounded-xl bg-white/60" />
          ))}
        </View>
      ) : tab === "certifications" ? (
        modules && modules.length > 0 ? (
          <View className="gap-3">
            {modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </View>
        ) : (
          <Text className="text-sm text-xporadia-text-secondary text-center py-6">
            Aucune certification à afficher.
          </Text>
        )
      ) : offers && offers.length > 0 ? (
        <View className="gap-3">
          {offers.map((offer) => (
            <InternshipOfferCard key={offer.id} offer={offer} />
          ))}
        </View>
      ) : (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">
          Aucune offre de stage à afficher.
        </Text>
      )}
    </ScrollView>
  );
}
