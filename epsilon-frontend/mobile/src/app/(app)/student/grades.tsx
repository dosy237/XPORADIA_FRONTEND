import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";

import { BarChartIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as gradingApi from "@/services/grading";

const EVAL_TYPE_LABEL: Record<string, string> = {
  exam: "Composition",
  quiz: "Interrogation",
  homework: "Devoir",
};

/** Toutes les notes chiffrées de l'élève, groupées par matière puis par
 * trimestre — lecture seule. Distinct de "Bulletins" (documents figés,
 * publiés par l'enseignant) : ici les notes apparaissent dès leur saisie
 * dans le tableur, sans attendre une publication. Distinct aussi de "Mes
 * notes", qui reste dédiée aux notes de cours personnelles de l'élève. */
export default function GradesScreen() {
  const { data: subjects, isLoading } = useQuery({
    queryKey: ["my-grades"],
    queryFn: gradingApi.fetchMyGrades,
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Mes résultats</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Vos notes saisies par matière, dès qu'elles tombent, sans attendre le bulletin.
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : subjects && subjects.length > 0 ? (
        subjects.map((subject) => (
          <View key={subject.subject_id} className="bg-white rounded-3xl p-5 shadow-soft gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-xporadia-navy flex-1" numberOfLines={2}>
                {subject.subject_name}
              </Text>
              <Text className="text-[11px] text-xporadia-text-secondary">Coef {subject.coefficient}</Text>
            </View>

            {subject.terms.map((term) => (
              <View key={term.term_id} className="bg-xporadia-bg rounded-2xl p-3 gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-bold text-xporadia-orange-text uppercase tracking-wide flex-1" numberOfLines={1}>
                    {term.term_label}
                  </Text>
                  <Text className="text-sm font-bold text-xporadia-navy">
                    {term.subject_average != null ? `${term.subject_average}/20` : "Non noté"}
                  </Text>
                </View>
                <View className="gap-1.5">
                  {term.evaluations.map((ev) => (
                    <View key={ev.id} className="flex-row items-center justify-between gap-2">
                      <View className="flex-1 gap-0.5">
                        <Text className="text-sm text-xporadia-text-primary" numberOfLines={2}>
                          {ev.title}
                        </Text>
                        <Text className="text-[10px] text-xporadia-text-secondary">
                          {EVAL_TYPE_LABEL[ev.eval_type] ?? ev.eval_type} · coef {ev.coefficient} ·{" "}
                          {new Date(ev.date).toLocaleDateString("fr-FR")}
                        </Text>
                      </View>
                      <Text className="text-sm font-semibold text-xporadia-text-primary">
                        {ev.score}/{ev.max_score}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ))
      ) : (
        <View className="items-center gap-2 py-10">
          <BarChartIcon size={22} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary text-center">Aucune note saisie pour l'instant.</Text>
        </View>
      )}
    </ScrollView>
  );
}
