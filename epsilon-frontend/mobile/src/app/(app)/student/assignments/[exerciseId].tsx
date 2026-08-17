import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import * as virtualClassesApi from "@/services/virtualClasses";
import { useAuthStore } from "@/store/authStore";

const KIND_LABEL: Record<string, string> = { homework: "Devoir", exam: "Examen" };

export default function AssignmentDetailScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const queryClient = useQueryClient();
  const childId = useAuthStore((s) => s.user?.child_id);
  const [draft, setDraft] = useState<string | null>(null);

  const { data: subjects } = useQuery({ queryKey: ["my-subjects"], queryFn: virtualClassesApi.fetchMySubjects });
  const exercise = subjects
    ?.flatMap((s) => s.exercises.map((ex) => ({ ...ex, subjectName: s.name })))
    .find((ex) => ex.id === exerciseId);

  const submitMutation = useMutation({
    mutationFn: (content: string) => {
      if (!childId) throw new Error("Compte élève requis.");
      return virtualClassesApi.submitExercise(exerciseId, { child_id: childId, content });
    },
    onSuccess: () => {
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ["my-subjects"] });
    },
  });

  const editMutation = useMutation({
    mutationFn: (content: string) => {
      if (!exercise?.my_submission) throw new Error("Aucune soumission à modifier.");
      return virtualClassesApi.editSubmission(exercise.my_submission.id, { content });
    },
    onSuccess: () => {
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ["my-subjects"] });
    },
  });

  if (!exercise) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  const submission = exercise.my_submission;
  const canEdit = submission && exercise.status === "published" && !exercise.is_overdue;
  const canSubmit = !submission && exercise.status === "published";
  const mutation = submission ? editMutation : submitMutation;
  const error = submitMutation.error || editMutation.error;

  return (
    <KeyboardAvoidingView className="flex-1 bg-xporadia-bg" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerClassName="p-6 gap-4 pb-12">
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Chip label={KIND_LABEL[exercise.kind] ?? exercise.kind} variant="navy-subtle" />
            {exercise.status === "closed" && <Chip label="Corrigé" variant="orange" />}
          </View>
          <Text className="text-xl font-bold text-xporadia-navy">{exercise.title}</Text>
          <Text className="text-sm text-xporadia-text-secondary">{exercise.subjectName}</Text>
          {exercise.deadline ? (
            <Text className="text-xs text-xporadia-text-secondary">
              À rendre avant le {new Date(exercise.deadline).toLocaleString("fr-FR")}
            </Text>
          ) : null}
        </View>

        <Card className="gap-2">
          <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Instructions</Text>
          <Text className="text-sm text-xporadia-text-primary leading-6">{exercise.instructions}</Text>
        </Card>

        {submission ? (
          <Card className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Ma copie</Text>
              {submission.is_late ? <Chip label="Rendu en retard" variant="orange" /> : null}
            </View>
            {draft !== null ? (
              <TextInput
                value={draft}
                onChangeText={setDraft}
                multiline
                className="text-sm text-xporadia-text-primary min-h-[100px] bg-xporadia-bg rounded-xl p-3"
              />
            ) : (
              <Text className="text-sm text-xporadia-text-primary leading-6">{submission.content}</Text>
            )}
            <Text className="text-[11px] text-xporadia-text-secondary">
              Rendu le {new Date(submission.submitted_at).toLocaleString("fr-FR")}
              {submission.updated_at !== submission.submitted_at
                ? ` · modifié le ${new Date(submission.updated_at).toLocaleString("fr-FR")}`
                : ""}
            </Text>

            {submission.status === "graded" ? (
              <View className="bg-xporadia-orange/10 rounded-xl p-3 gap-1">
                <Text className="text-sm font-bold text-xporadia-navy">Note : {submission.grade}/20</Text>
                {submission.feedback ? (
                  <Text className="text-sm text-xporadia-text-primary">{submission.feedback}</Text>
                ) : null}
              </View>
            ) : canEdit ? (
              draft !== null ? (
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Button label="Annuler" variant="secondary" pill onPress={() => setDraft(null)} />
                  </View>
                  <View className="flex-1">
                    <Button
                      label="Enregistrer"
                      pill
                      onPress={() => editMutation.mutate(draft)}
                      loading={editMutation.isPending}
                    />
                  </View>
                </View>
              ) : (
                <Button label="Modifier ma copie" variant="secondary" pill onPress={() => setDraft(submission.content)} />
              )
            ) : (
              <Text className="text-xs text-xporadia-text-secondary">
                {exercise.status === "closed"
                  ? "La correction a commencé. La copie ne peut plus être modifiée."
                  : "La date limite est passée. La copie ne peut plus être modifiée."}
              </Text>
            )}
          </Card>
        ) : canSubmit ? (
          <Card className="gap-3">
            <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Rendre ma copie</Text>
            <TextInput
              value={draft ?? ""}
              onChangeText={setDraft}
              placeholder="Rédigez votre réponse ici..."
              placeholderTextColor="#94A3B8"
              multiline
              className="text-sm text-xporadia-text-primary min-h-[120px] bg-xporadia-bg rounded-xl p-3"
            />
            {error ? <Text className="text-xs text-xporadia-red">Une erreur est survenue.</Text> : null}
            <Button
              label="Rendre ma copie"
              pill
              onPress={() => submitMutation.mutate(draft ?? "")}
              loading={submitMutation.isPending}
              disabled={!draft || draft.trim().length === 0}
            />
          </Card>
        ) : (
          <Text className="text-xs text-xporadia-text-secondary text-center py-4">
            Ce devoir n'accepte plus de nouvelle soumission.
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
