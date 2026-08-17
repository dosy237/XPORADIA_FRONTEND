import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { ClockIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as employmentApi from "@/services/employment";

const CONTRACT_LABELS: Record<string, string> = {
  cdd: "CDD", vacation: "Vacation", interim: "Intérim",
};

export default function WorkedHoursOverviewScreen() {
  const { data: recruitments, isLoading } = useQuery({
    queryKey: ["my-school-recruitments"],
    queryFn: employmentApi.fetchMySchoolRecruitments,
  });

  const hourlyRecruitments = (recruitments ?? []).filter((r) => r.requires_declared_hours);

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Heures à valider</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Vos enseignants en CDD, Vacation ou Intérim déclarent leurs heures ici.
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : hourlyRecruitments.length > 0 ? (
        <View className="gap-3">
          {hourlyRecruitments.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => router.push(`/(app)/director/worked-hours/${r.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Valider les heures de ${r.teacher.first_name}`}
              className="bg-white rounded-2xl p-4 shadow-soft flex-row items-center gap-3"
            >
              <Avatar firstName={r.teacher.first_name} lastName={r.teacher.last_name} size={40} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-xporadia-text-primary">
                  {r.teacher.first_name} {r.teacher.last_name}
                </Text>
                <Text className="text-xs text-xporadia-text-secondary">
                  {r.hourly_rate_teacher?.toLocaleString("fr-FR")} FCFA/heure
                </Text>
              </View>
              <Chip label={CONTRACT_LABELS[r.contract_type] ?? r.contract_type} variant="navy-subtle" />
            </Pressable>
          ))}
        </View>
      ) : (
        <View className="items-center gap-2 py-10">
          <ClockIcon size={24} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary text-center">
            Aucun enseignant en contrat aux heures pour l&apos;instant.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
