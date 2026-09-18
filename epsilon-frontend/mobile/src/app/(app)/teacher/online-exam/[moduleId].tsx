import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { LEVEL_LABELS } from "@/constants/certificationLevels";
import * as certificationApi from "@/services/certification";

export default function OnlineExamScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const { data: module } = useQuery({
    queryKey: ["training-module", moduleId],
    queryFn: () => certificationApi.fetchTrainingModule(moduleId),
  });

  const { data: questions, isLoading } = useQuery({
    queryKey: ["online-exam-questions", moduleId],
    queryFn: () => certificationApi.fetchOnlineExamQuestions(moduleId),
    enabled: !!moduleId,
  });

  const submit = useMutation({
    mutationFn: () => certificationApi.submitOnlineExam(moduleId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-certification-status"] });
    },
  });

  if (isLoading || !questions) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-6">
        <Text className="text-sm text-xporadia-text-secondary text-center">
          Aucun examen en ligne n&apos;est disponible pour ce module pour l&apos;instant.
        </Text>
      </View>
    );
  }

  if (submit.data) {
    const result = submit.data;
    const passed = result.status === "passed";
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-6 gap-4">
        <Chip label={passed ? "Réussi" : "Non validé"} variant={passed ? "navy" : "neutral"} />
        <Text className="text-2xl font-bold text-xporadia-navy">{Number(result.score_total)}%</Text>
        <Text className="text-sm text-xporadia-text-secondary text-center">
          {passed
            ? `Félicitations, votre certification pour « ${module?.title} » a été délivrée.`
            : `Le seuil de réussite n'a pas été atteint pour « ${module?.title} ». Vous pouvez retenter l'examen.`}
        </Text>
        {result.leveled_up && result.new_level && (
          <View className="bg-xporadia-orange/12 border border-xporadia-orange/25 rounded-2xl p-4">
            <Text className="text-sm font-semibold text-xporadia-orange-text text-center">
              Nouveau niveau atteint : {LEVEL_LABELS[result.new_level]} !
            </Text>
          </View>
        )}
        <Button label="Retour à ma certification" pill onPress={() => router.replace("/(app)/teacher/certification")} />
      </View>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Examen en ligne auto-corrigé : {module?.title}. Répondez à toutes les questions puis
        soumettez pour obtenir votre résultat immédiatement.
      </Text>

      {questions.map((question, index) => (
        <View key={question.id} className="bg-white rounded-2xl p-4 border border-xporadia-border gap-3">
          <Text className="text-sm font-semibold text-xporadia-text-primary">
            {index + 1}. {question.text}
          </Text>
          <View className="gap-2">
            {(question.question_type === "tf" ? ["Vrai", "Faux"] : question.options).map((option) => {
              const isSelected = answers[question.id] === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                  className={`rounded-xl border px-4 py-3 ${
                    isSelected
                      ? "bg-xporadia-navy border-xporadia-navy"
                      : "bg-white border-xporadia-border"
                  }`}
                >
                  <Text className={`text-sm ${isSelected ? "text-white font-semibold" : "text-xporadia-text-primary"}`}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      {submit.isError && (
        <Text className="text-xs text-xporadia-red text-center">
          Une erreur est survenue lors de la soumission. Réessayez.
        </Text>
      )}

      <Button
        label={`Soumettre (${answeredCount}/${questions.length} répondues)`}
        pill
        loading={submit.isPending}
        disabled={answeredCount < questions.length}
        onPress={() => submit.mutate()}
      />
    </ScrollView>
  );
}
