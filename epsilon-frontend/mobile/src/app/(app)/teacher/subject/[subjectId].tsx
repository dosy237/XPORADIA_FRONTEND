import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PlusIcon, TrashIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import * as virtualClassesApi from "@/services/virtualClasses";
import type { Exercise, ExerciseStatus } from "@/services/virtualClasses";

const STATUS_LABELS: Record<ExerciseStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
  closed: "Clôturé",
};

function ExerciseCard({
  exercise,
  editable,
  onPublish,
  onClose,
  onDelete,
}: {
  exercise: Exercise;
  editable: boolean;
  onPublish: (id: string) => void;
  onClose: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-xporadia-text-primary flex-1" numberOfLines={1}>
          {exercise.title}
        </Text>
        <Chip label={STATUS_LABELS[exercise.status]} variant="navy-subtle" />
      </View>
      <Text className="text-xs text-xporadia-text-secondary" numberOfLines={2}>
        {exercise.instructions}
      </Text>

      {editable && (
        <View className="flex-row items-center gap-2 mt-1">
          {exercise.status === "draft" && (
            <Button label="Publier" pill onPress={() => onPublish(exercise.id)} />
          )}
          {exercise.status === "published" && (
            <Button label="Clôturer" pill variant="secondary" onPress={() => onClose(exercise.id)} />
          )}
          <Pressable
            onPress={() => onDelete(exercise.id)}
            accessibilityRole="button"
            accessibilityLabel={`Supprimer l'exercice ${exercise.title}`}
            hitSlop={8}
            className="ml-auto"
          >
            <TrashIcon size={16} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function SubjectVirtualClassScreen() {
  const { subjectId, editable: editableParam } = useLocalSearchParams<{
    subjectId: string;
    editable?: string;
  }>();
  const editable = editableParam === "1";
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");

  const virtualClassQuery = useQuery({
    queryKey: ["subject-virtual-class", subjectId],
    queryFn: () => virtualClassesApi.fetchSubjectVirtualClass(Number(subjectId)),
    enabled: !!subjectId,
  });

  const exercisesQueryKey = ["subject-exercises", subjectId];
  const exercisesQuery = useQuery({
    queryKey: exercisesQueryKey,
    queryFn: () => virtualClassesApi.fetchExercises(Number(subjectId)),
    enabled: !!subjectId,
  });

  const createMutation = useMutation({
    mutationFn: () => virtualClassesApi.createExercise(Number(subjectId), { title, instructions }),
    onSuccess: (exercise) => {
      queryClient.setQueryData<Exercise[] | undefined>(exercisesQueryKey, (prev) =>
        prev ? [exercise, ...prev] : [exercise]
      );
      setTitle("");
      setInstructions("");
      setAdding(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ExerciseStatus }) =>
      virtualClassesApi.updateExercise(id, { status }),
    onSuccess: (exercise) => {
      queryClient.setQueryData<Exercise[] | undefined>(exercisesQueryKey, (prev) =>
        prev ? prev.map((e) => (e.id === exercise.id ? exercise : e)) : prev
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => virtualClassesApi.deleteExercise(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Exercise[] | undefined>(exercisesQueryKey, (prev) =>
        prev ? prev.filter((e) => e.id !== id) : prev
      );
    },
  });

  const virtualClass = virtualClassQuery.data;

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      {virtualClass ? (
        <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-1">
          <Text className="text-base font-semibold text-xporadia-text-primary">
            {virtualClass.subject_name}
          </Text>
          <Text className="text-xs text-xporadia-text-secondary">{virtualClass.school_class_name}</Text>
          {virtualClass.description ? (
            <Text className="text-sm text-xporadia-text-primary mt-2 leading-5">
              {virtualClass.description}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Cours et exercices de cette matière.
      </Text>

      {exercisesQuery.isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : (exercisesQuery.data ?? []).length === 0 ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">
          Aucun cours ni exercice pour l&apos;instant.
        </Text>
      ) : (
        (exercisesQuery.data ?? []).map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            editable={editable}
            onPublish={(id) => updateStatusMutation.mutate({ id, status: "published" })}
            onClose={(id) => updateStatusMutation.mutate({ id, status: "closed" })}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))
      )}

      {editable &&
        (adding ? (
          <View className="bg-white rounded-2xl p-4 border border-xporadia-orange/30 gap-3">
            <Input label="Titre" value={title} onChangeText={setTitle} placeholder="Devoir n°1" />
            <Input
              label="Consignes"
              value={instructions}
              onChangeText={setInstructions}
              placeholder="Faire les exercices 1 à 5 page 12"
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: "top" }}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button label="Annuler" variant="secondary" pill onPress={() => setAdding(false)} />
              </View>
              <View className="flex-1">
                <Button
                  label="Créer"
                  pill
                  disabled={!title || !instructions}
                  loading={createMutation.isPending}
                  onPress={() => createMutation.mutate()}
                />
              </View>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setAdding(true)}
            accessibilityRole="button"
            accessibilityLabel="Ajouter un cours ou exercice"
            className="flex-row items-center justify-center gap-2 bg-xporadia-orange rounded-full py-3.5"
          >
            <PlusIcon size={16} />
            <Text className="text-white font-semibold">Ajouter un cours / exercice</Text>
          </Pressable>
        ))}
    </ScrollView>
  );
}
