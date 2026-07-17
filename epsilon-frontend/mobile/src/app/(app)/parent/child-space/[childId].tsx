import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import * as virtualClassesApi from "@/services/virtualClasses";
import type { ChildExercise } from "@/services/virtualClasses";

function ExerciseCard({ childId, exercise }: { childId: number; exercise: ChildExercise }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const submission = exercise.my_submission;

  const submitMutation = useMutation({
    mutationFn: () => virtualClassesApi.submitExercise(exercise.id, { child_id: childId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["child-subjects", childId] });
    },
  });

  return (
    <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-xporadia-text-primary flex-1" numberOfLines={1}>
          {exercise.title}
        </Text>
        {submission ? (
          <Chip
            label={submission.status === "graded" ? `Noté : ${submission.grade}/20` : "Soumis"}
            variant={submission.status === "graded" ? "navy" : "navy-subtle"}
          />
        ) : (
          <Chip label="À faire" variant="orange" />
        )}
      </View>
      <Text className="text-xs text-xporadia-text-secondary">{exercise.instructions}</Text>

      {submission ? (
        <View className="gap-1 mt-1">
          <Text className="text-xs text-xporadia-text-secondary">Réponse envoyée :</Text>
          <Text className="text-sm text-xporadia-text-primary">{submission.content}</Text>
          {submission.status === "graded" && submission.feedback ? (
            <View className="bg-xporadia-navy/[0.06] rounded-xl p-3 mt-2">
              <Text className="text-xs font-semibold text-xporadia-navy mb-1">
                Correction de l&apos;enseignant
              </Text>
              <Text className="text-sm text-xporadia-text-primary">{submission.feedback}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View className="gap-2 mt-1">
          <Input
            value={content}
            onChangeText={setContent}
            placeholder="Écrire la réponse de votre enfant..."
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: "top" }}
          />
          <Button
            label="Envoyer la copie"
            pill
            disabled={!content.trim()}
            loading={submitMutation.isPending}
            onPress={() => submitMutation.mutate()}
          />
        </View>
      )}
    </View>
  );
}

export default function ChildSpaceScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const id = Number(childId);

  const { data: subjects, isLoading } = useQuery({
    queryKey: ["child-subjects", id],
    queryFn: () => virtualClassesApi.fetchChildSubjects(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  if (!subjects || subjects.length === 0) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-6">
        <Text className="text-sm text-xporadia-text-secondary text-center">
          Aucune classe active trouvée pour cet enfant pour l&apos;instant.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-5 pb-12">
      {subjects.map((subject) => (
        <View key={subject.id} className="gap-3">
          <View>
            <Text className="text-base font-bold text-xporadia-navy">{subject.name}</Text>
            <Text className="text-xs text-xporadia-text-secondary">{subject.school_class_name}</Text>
          </View>
          {subject.exercises.length === 0 ? (
            <Text className="text-xs text-xporadia-text-secondary">Aucun devoir publié pour l&apos;instant.</Text>
          ) : (
            subject.exercises.map((exercise) => (
              <ExerciseCard key={exercise.id} childId={id} exercise={exercise} />
            ))
          )}
        </View>
      ))}
    </ScrollView>
  );
}
