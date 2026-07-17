import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { LevelBadge, LevelPath } from "@/components/certification/LevelBadge";
import { Chip } from "@/components/ui/Chip";
import { ClockIcon, MedalIcon } from "@/components/ui/Icon";
import { CATEGORY_LABELS, LEVEL_LABELS } from "@/constants/certificationLevels";
import { Colors } from "@/constants/theme";
import * as certificationApi from "@/services/certification";

function ModuleCard({ module }: { module: certificationApi.TrainingModule }) {
  return (
    <Pressable
      onPress={() => router.push(`/(app)/teacher/module/${module.id}`)}
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

export default function TeacherCertificationScreen() {
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["certification-status"],
    queryFn: certificationApi.fetchMyCertificationStatus,
  });

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ["certification-modules"],
    queryFn: () => certificationApi.fetchTrainingModules(),
  });

  if (statusLoading || !status) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="pb-12">
      <View className="px-6 pt-6 gap-5">
        <View className="bg-white rounded-3xl p-6 shadow-deep border border-xporadia-border gap-5 overflow-hidden">
          <View className="flex-row items-center gap-4">
            {status.current_level ? (
              <LevelBadge level={status.current_level} />
            ) : (
              <View className="h-10 w-10 rounded-full bg-xporadia-bg items-center justify-center">
                <MedalIcon color={Colors.textSecondary} size={20} />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
                Statut actuel
              </Text>
              <Text className="text-lg font-bold text-xporadia-navy">
                {status.current_level ? LEVEL_LABELS[status.current_level] : "Non certifié"}
              </Text>
            </View>
          </View>

          <LevelPath current={status.current_level} />

          {status.next_level && (
            <Text className="text-xs text-xporadia-text-secondary text-center">
              Prochain niveau visé : {LEVEL_LABELS[status.next_level]}
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => router.push("/(app)/teacher/my-session-enrollments")}
          accessibilityRole="button"
          accessibilityLabel="Voir mes inscriptions aux sessions de formation"
          className="bg-white rounded-2xl p-4 border border-xporadia-border flex-row items-center justify-between"
        >
          <Text className="text-sm font-semibold text-xporadia-text-primary">
            Mes inscriptions aux sessions
          </Text>
          <Text className="text-xs text-xporadia-navy">Voir →</Text>
        </Pressable>

        {status.certifications.length > 0 && (
          <View className="gap-3">
            <Text className="text-base font-bold text-xporadia-navy">Mes certifications</Text>
            {status.certifications.map((cert) => (
              <View key={cert.id} className="bg-white rounded-2xl p-4 border border-xporadia-border gap-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-xporadia-text-primary">
                    {cert.module.title}
                  </Text>
                  <Chip label={LEVEL_LABELS[cert.level]} variant="navy-subtle" />
                </View>
                <Text className="text-xs text-xporadia-text-secondary">
                  Score {cert.score_total} · Expire le{" "}
                  {new Date(cert.expires_at).toLocaleDateString("fr-FR")}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View className="gap-3">
          <Text className="text-base font-bold text-xporadia-navy">Catalogue des modules</Text>
          {modulesLoading ? (
            <Text className="text-sm text-xporadia-text-secondary">Chargement du catalogue...</Text>
          ) : (
            (modules ?? []).map((module) => <ModuleCard key={module.id} module={module} />)
          )}
        </View>
      </View>
    </ScrollView>
  );
}
