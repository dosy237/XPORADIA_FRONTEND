import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { CheckCircleIcon, ClockIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";

export default function YearEndReadinessScreen() {
  const { data: classes, isLoading } = useQuery({
    queryKey: ["year-end-readiness"],
    queryFn: academicsApi.fetchYearEndReadiness,
  });

  const completeCount = (classes ?? []).filter((c) => c.is_complete).length;
  const totalCount = (classes ?? []).length;

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Suivi de fin d&apos;année</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Chaque titulaire décide du passage pour sa classe. Une fois toutes les classes
          complètes, vous pouvez recréer les classes de l&apos;année suivante et réaffecter les
          titulaires en toute confiance.
        </Text>
      </View>

      {!isLoading && totalCount > 0 && (
        <View className="bg-xporadia-navy rounded-2xl p-5 items-center gap-1">
          <Text className="text-3xl font-bold text-white">
            {completeCount}/{totalCount}
          </Text>
          <Text className="text-xs text-white/60 uppercase tracking-wide">Classes complètes</Text>
        </View>
      )}

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : (
        <View className="gap-3">
          {(classes ?? []).map((c) => (
            <View key={c.school_class} className="bg-white rounded-2xl p-4 shadow-soft flex-row items-center gap-3">
              <View
                className={`h-10 w-10 rounded-full items-center justify-center ${
                  c.is_complete ? "bg-xporadia-navy/[0.06]" : "bg-xporadia-orange/10"
                }`}
              >
                {c.is_complete ? (
                  <CheckCircleIcon size={18} color={Colors.navy} />
                ) : (
                  <ClockIcon size={18} color={Colors.orange} />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-xporadia-text-primary">
                  {c.name} ({c.school_year})
                </Text>
                <Text className="text-xs text-xporadia-text-secondary">
                  {c.homeroom_teacher ?? "Aucun titulaire affecté"}
                </Text>
              </View>
              <Chip
                label={c.is_complete ? "Complète" : `${c.students_remaining} en attente`}
                variant={c.is_complete ? "navy-subtle" : "orange"}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
