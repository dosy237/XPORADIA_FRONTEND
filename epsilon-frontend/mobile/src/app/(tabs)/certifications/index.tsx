import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { ClockIcon } from "@/components/ui/Icon";
import { CATEGORY_LABELS, LEVEL_LABELS } from "@/constants/certificationLevels";
import { Colors } from "@/constants/theme";
import * as certificationApi from "@/services/certification";
import type { CertificationLevel, TrainingModule } from "@/services/certification";

const LEVEL_FILTERS: CertificationLevel[] = ["bronze", "silver", "gold"];

function ModuleCard({ module }: { module: TrainingModule }) {
  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/certifications/${module.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Voir le module ${module.title}`}
      className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2"
    >
      <View className="flex-row items-start justify-between gap-2">
        <Text className="text-base font-semibold text-xporadia-text-primary flex-1">
          {module.title}
        </Text>
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
    </Pressable>
  );
}

export default function CertificationsScreen() {
  const [level, setLevel] = useState<CertificationLevel | null>(null);

  const { data: modules, isLoading } = useQuery({
    queryKey: ["public-certification-modules", level],
    queryFn: () => certificationApi.fetchTrainingModules(level ? { target_level: level } : undefined),
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Catalogue des certifications Xporadia — filtrez par niveau visé.
      </Text>

      <View className="flex-row flex-wrap gap-2">
        <Pressable onPress={() => setLevel(null)}>
          <Chip label="Tous niveaux" variant={level === null ? "navy" : "neutral"} />
        </Pressable>
        {LEVEL_FILTERS.map((lvl) => (
          <Pressable key={lvl} onPress={() => setLevel(lvl)}>
            <Chip label={LEVEL_LABELS[lvl]} variant={level === lvl ? "navy" : "neutral"} />
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : modules && modules.length > 0 ? (
        <View className="gap-3">
          {modules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </View>
      ) : (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">
          Aucune certification à afficher.
        </Text>
      )}
    </ScrollView>
  );
}
