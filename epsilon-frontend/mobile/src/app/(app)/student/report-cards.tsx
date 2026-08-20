import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";

import { ReportCardCard } from "@/components/grading/ReportCardCard";
import { MedalIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as gradingApi from "@/services/grading";

export default function StudentReportCardsScreen() {
  const { data: reportCards, isLoading } = useQuery({
    queryKey: ["my-report-cards"],
    queryFn: gradingApi.fetchMyReportCards,
  });

  const sorted = [...(reportCards ?? [])].sort((a, b) => b.term - a.term);

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Bulletins</Text>
        <Text className="text-sm text-xporadia-text-secondary">Un bulletin par trimestre, publié par votre établissement.</Text>
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : sorted.length > 0 ? (
        <View className="gap-4">
          {sorted.map((reportCard) => (
            <ReportCardCard key={reportCard.id} reportCard={reportCard} />
          ))}
        </View>
      ) : (
        <View className="items-center gap-2 py-10">
          <MedalIcon size={22} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary text-center">
            Aucun bulletin publié pour l'instant.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
