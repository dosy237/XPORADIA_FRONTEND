import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { MedalIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as virtualClassesApi from "@/services/virtualClasses";

export default function GradesScreen() {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["my-submissions"],
    queryFn: virtualClassesApi.fetchMySubmissions,
  });

  const graded = (submissions ?? []).filter((s) => s.status === "graded" && s.grade !== null);
  const average =
    graded.length > 0
      ? (graded.reduce((sum, s) => sum + Number(s.grade), 0) / graded.length).toFixed(1)
      : null;

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Mes résultats</Text>
        <Text className="text-sm text-xporadia-text-secondary">Toutes vos copies notées, toutes matières.</Text>
      </View>

      {average ? (
        <Card className="items-center py-6 gap-1">
          <Text className="text-3xl font-bold text-xporadia-navy">{average}/20</Text>
          <Text className="text-xs text-xporadia-text-secondary">Moyenne générale</Text>
        </Card>
      ) : null}

      {isLoading ? (
        <Text className="text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : graded.length > 0 ? (
        <View className="gap-3">
          {graded.map((submission) => (
            <Card
              key={submission.id}
              onPress={() => router.push(`/(app)/student/assignments/${submission.exercise}`)}
              className="flex-row items-center justify-between gap-3"
            >
              <View className="flex-1">
                <Text className="text-sm font-semibold text-xporadia-text-primary">
                  {submission.exercise_title}
                </Text>
                <Text className="text-xs text-xporadia-text-secondary">
                  Corrigé le {submission.graded_at ? new Date(submission.graded_at).toLocaleDateString("fr-FR") : "Date inconnue"}
                </Text>
              </View>
              <Chip label={`${submission.grade}/20`} variant="orange" />
            </Card>
          ))}
        </View>
      ) : (
        <View className="items-center gap-2 py-10">
          <MedalIcon size={24} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Aucune copie corrigée pour l'instant.</Text>
        </View>
      )}
    </ScrollView>
  );
}
