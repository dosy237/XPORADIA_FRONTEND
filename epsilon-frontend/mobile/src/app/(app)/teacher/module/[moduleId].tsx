import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ClockIcon } from "@/components/ui/Icon";
import { CATEGORY_LABELS, LEVEL_LABELS } from "@/constants/certificationLevels";
import { Colors } from "@/constants/theme";
import * as certificationApi from "@/services/certification";

export default function ModuleDetailScreen() {
  const { moduleId, from } = useLocalSearchParams<{ moduleId: string; from?: string }>();

  const { data: module, isLoading } = useQuery({
    queryKey: ["training-module", moduleId],
    queryFn: () => certificationApi.fetchTrainingModule(moduleId),
  });

  const { data: sessions } = useQuery({
    queryKey: ["training-sessions", moduleId],
    queryFn: () => certificationApi.fetchTrainingSessions({ module: moduleId }),
    enabled: !!moduleId,
  });

  if (isLoading || !module) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-5 pb-12">
      {from ? (
        <View className="bg-xporadia-navy/[0.06] rounded-2xl p-3">
          <Text className="text-xs text-xporadia-navy">
            Vous avez découvert ce module via le profil de {from}.
          </Text>
        </View>
      ) : null}

      <View className="bg-white rounded-3xl p-6 shadow-deep border border-xporadia-border gap-4">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="text-xl font-bold text-xporadia-navy flex-1">{module.title}</Text>
          <Chip label={LEVEL_LABELS[module.target_level]} variant="navy-subtle" />
        </View>
        <Text className="text-xs text-xporadia-text-secondary">
          {CATEGORY_LABELS[module.category] ?? module.category}
        </Text>
        <Text className="text-sm text-xporadia-text-primary leading-5">{module.description}</Text>

        {module.objectives.length > 0 && (
          <View className="gap-2">
            <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
              Objectifs pédagogiques
            </Text>
            {module.objectives.map((objective) => (
              <Text key={objective} className="text-sm text-xporadia-text-primary">
                • {objective}
              </Text>
            ))}
          </View>
        )}

        <View className="flex-row items-center gap-4 pt-1">
          <View className="flex-row items-center gap-1.5">
            <ClockIcon size={14} color={Colors.textSecondary} />
            <Text className="text-xs text-xporadia-text-secondary">{module.duration_hours}h</Text>
          </View>
          <Text className="text-sm font-semibold text-xporadia-navy">
            {module.price.toLocaleString("fr-FR")} FCFA
          </Text>
        </View>
      </View>

      {sessions && sessions.length > 0 && (
        <View className="gap-3">
          <Text className="text-base font-bold text-xporadia-navy">Prochaines sessions</Text>
          {sessions.map((session) => (
            <View key={session.id} className="bg-white rounded-2xl p-4 border border-xporadia-border gap-1">
              <Text className="text-sm font-semibold text-xporadia-text-primary">
                {session.city} · {new Date(session.date).toLocaleDateString("fr-FR")}
              </Text>
              <Text className="text-xs text-xporadia-text-secondary">
                {session.location} · {session.places_left} places restantes
              </Text>
            </View>
          ))}
        </View>
      )}

      <Button
        label="S'inscrire à ce module"
        pill
        onPress={() =>
          Alert.alert("Bientôt disponible", "L'inscription et le paiement en ligne arrivent prochainement.")
        }
      />
    </ScrollView>
  );
}
