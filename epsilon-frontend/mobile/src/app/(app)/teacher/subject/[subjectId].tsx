import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { CloseIcon, FileTextIcon, ImageIcon, NewspaperIcon, PencilIcon, PlusIcon, TrashIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import type { LocalFileAsset } from "@/lib/formDataAsset";
import { Colors } from "@/constants/theme";
import * as gradingApi from "@/services/grading";
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
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<LocalFileAsset[]>([]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setAttachments((prev) => [...prev, { uri: asset.uri, name: asset.fileName ?? "image.jpg", mimeType: asset.mimeType }]);
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], multiple: true });
    if (result.canceled) return;
    setAttachments((prev) => [
      ...prev,
      ...result.assets.map((asset) => ({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType })),
    ]);
  };

  const removeAttachment = (index: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== index));

  const termsQuery = useQuery({
    queryKey: ["subject-terms", subjectId],
    queryFn: () => gradingApi.fetchSubjectTerms(Number(subjectId)),
    enabled: !!subjectId && adding,
  });

  useEffect(() => {
    if (selectedTermId || !termsQuery.data || termsQuery.data.length === 0) return;
    const active = termsQuery.data.find((t) => t.is_active);
    setSelectedTermId((active ?? termsQuery.data[0]).id);
  }, [termsQuery.data, selectedTermId]);

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
    mutationFn: () =>
      virtualClassesApi.createExercise(Number(subjectId), {
        title,
        instructions,
        kind,
        term: selectedTermId as number,
        attachments,
      }),
    onSuccess: (exercise) => {
      queryClient.setQueryData<Exercise[] | undefined>(exercisesQueryKey, (prev) =>
        prev ? [exercise, ...prev] : [exercise]
      );
      setTitle("");
      setInstructions("");
      setKind("homework");
      setSelectedTermId(null);
      setAttachments([]);
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
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-xporadia-text-secondary">Trimestre</Text>
              <Text className="text-[11px] text-xporadia-text-secondary">
                Détermine dans quel trimestre la correction alimentera le tableur de notes.
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {(termsQuery.data ?? []).map((term) => (
                  <Chip
                    key={term.id}
                    label={term.name || `Trimestre ${term.number}`}
                    variant={selectedTermId === term.id ? "navy" : "neutral"}
                    onPress={() => setSelectedTermId(term.id)}
                  />
                ))}
              </View>
            </View>
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-xporadia-text-secondary">
                Images et documents (optionnel)
              </Text>
              {attachments.length > 0 ? (
                <View className="gap-2">
                  {attachments.map((asset, index) => (
                    <View
                      key={`${asset.uri}-${index}`}
                      className="flex-row items-center gap-2 border border-xporadia-border rounded-2xl px-4 py-3"
                    >
                      {asset.mimeType?.startsWith("image/") ? (
                        <ImageIcon size={14} color={Colors.orange} />
                      ) : (
                        <FileTextIcon size={14} color={Colors.orange} />
                      )}
                      <Text className="text-sm text-xporadia-text-primary flex-1" numberOfLines={1}>
                        {asset.name}
                      </Text>
                      <Pressable
                        onPress={() => removeAttachment(index)}
                        accessibilityRole="button"
                        accessibilityLabel={`Retirer ${asset.name}`}
                        hitSlop={8}
                      >
                        <CloseIcon size={14} color={Colors.textSecondary} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
              <View className="flex-row gap-2">
                <Pressable
                  onPress={pickImage}
                  className="flex-1 flex-row items-center justify-center gap-2 border border-dashed border-xporadia-border rounded-2xl py-3"
                >
                  <ImageIcon size={14} color={Colors.textSecondary} />
                  <Text className="text-xs font-semibold text-xporadia-text-secondary">Photo</Text>
                </Pressable>
                <Pressable
                  onPress={pickDocument}
                  className="flex-1 flex-row items-center justify-center gap-2 border border-dashed border-xporadia-border rounded-2xl py-3"
                >
                  <FileTextIcon size={14} color={Colors.textSecondary} />
                  <Text className="text-xs font-semibold text-xporadia-text-secondary">Document</Text>
                </Pressable>
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button
                  label="Annuler"
                  variant="secondary"
                  pill
                  onPress={() => {
                    setAdding(false);
                    setSelectedTermId(null);
                    setAttachments([]);
                  }}
                />
              </View>
              <View className="flex-1">
                <Button
                  label="Créer"
                  pill
                  disabled={!title || !instructions || !selectedTermId}
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
