import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { NewspaperIcon, PencilIcon, PlusIcon, TrashIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as messagingApi from "@/services/messaging";
import * as virtualClassesApi from "@/services/virtualClasses";
import type { Exercise, ExerciseKind, ExerciseStatus } from "@/services/virtualClasses";

const STATUS_LABELS: Record<ExerciseStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
  closed: "Clôturé",
};

const KIND_LABELS: Record<ExerciseKind, string> = {
  homework: "Devoir",
  exam: "Examen",
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
    <Card className="gap-2">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-base font-semibold text-xporadia-text-primary flex-1">
          {exercise.title}
        </Text>
        <View className="flex-row gap-1.5">
          <Chip label={KIND_LABELS[exercise.kind]} variant="orange" />
          <Chip label={STATUS_LABELS[exercise.status]} variant="navy-subtle" />
        </View>
      </View>
      <Text className="text-xs text-xporadia-text-secondary" numberOfLines={2}>
        {exercise.instructions}
      </Text>

      {exercise.status !== "draft" && (
        <Button
          label="Voir les copies"
          variant="secondary"
          pill
          onPress={() => router.push(`/(app)/teacher/exercise-submissions/${exercise.id}`)}
        />
      )}

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
            <TrashIcon size={16} color={Colors.red} />
          </Pressable>
        </View>
      )}
    </Card>
  );
}

function SubjectChannelBanner({ subjectId }: { subjectId: number }) {
  const queryClient = useQueryClient();
  const { data: channels } = useQuery({ queryKey: ["channels"], queryFn: messagingApi.fetchChannels });
  const existingChannel = channels?.find((c) => c.channel_type === "subject" && c.subject_id === subjectId);

  const createMutation = useMutation({
    mutationFn: () => messagingApi.createSubjectChannel(subjectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["channels"] }),
  });

  if (existingChannel) {
    return (
      <Card
        onPress={() => router.push(`/(app)/messages/${existingChannel.id}`)}
        className="flex-row items-center gap-3"
      >
        <View className="h-10 w-10 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
          <NewspaperIcon size={16} color={Colors.navy} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-xporadia-text-primary">Canal de la matière</Text>
          <Text className="text-xs text-xporadia-text-secondary">Ouvrir la discussion avec vos élèves</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card onPress={() => createMutation.mutate()} className="flex-row items-center gap-3">
      <View className="h-10 w-10 rounded-full bg-xporadia-orange/10 items-center justify-center">
        <PlusIcon size={16} color={Colors.orange} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-xporadia-text-primary">
          {createMutation.isPending ? "Création en cours..." : "Créer le canal de discussion"}
        </Text>
        <Text className="text-xs text-xporadia-text-secondary">
          Ouvre un fil d'échange public avec tous les élèves de la classe.
        </Text>
      </View>
    </Card>
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
  const [kind, setKind] = useState<ExerciseKind>("homework");

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
    mutationFn: () => virtualClassesApi.createExercise(Number(subjectId), { title, instructions, kind }),
    onSuccess: (exercise) => {
      queryClient.setQueryData<Exercise[] | undefined>(exercisesQueryKey, (prev) =>
        prev ? [exercise, ...prev] : [exercise]
      );
      setTitle("");
      setInstructions("");
      setKind("homework");
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
        <Card className="gap-1">
          <Text className="text-base font-semibold text-xporadia-text-primary">
            {virtualClass.subject_name}
          </Text>
          <Text className="text-xs text-xporadia-text-secondary">{virtualClass.school_class_name}</Text>
          {virtualClass.description ? (
            <Text className="text-sm text-xporadia-text-primary mt-2 leading-5">
              {virtualClass.description}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {editable && subjectId ? (
        <Card
          onPress={() => router.push(`/(app)/teacher/grade-grid/${subjectId}`)}
          className="flex-row items-center gap-3"
        >
          <View className="h-10 w-10 rounded-full bg-xporadia-teal/10 items-center justify-center">
            <PencilIcon size={16} color={Colors.teal} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-xporadia-text-primary">Saisir les notes</Text>
            <Text className="text-xs text-xporadia-text-secondary">
              Tableur des évaluations et des notes de cette matière, trimestre par trimestre.
            </Text>
          </View>
        </Card>
      ) : null}

      {editable && subjectId ? <SubjectChannelBanner subjectId={Number(subjectId)} /> : null}

      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Cours, devoirs et examens de cette matière.
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
          <Card className="gap-3">
            <View className="flex-row gap-2">
              <Chip label="Devoir" variant={kind === "homework" ? "navy" : "neutral"} onPress={() => setKind("homework")} />
              <Chip label="Examen" variant={kind === "exam" ? "navy" : "neutral"} onPress={() => setKind("exam")} />
            </View>
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
          </Card>
        ) : (
          <Button label="Ajouter un cours / devoir / examen" pill onPress={() => setAdding(true)} />
        ))}
    </ScrollView>
  );
}
