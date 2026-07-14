import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Share, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PlusIcon, TrashIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import * as academicsApi from "@/services/academics";
import type { Subject } from "@/services/academics";

function shareInvitation(token: string, email: string) {
  const link = Linking.createURL(`/invite/${token}`);
  Share.share({
    message: `Vous êtes invité(e) à rejoindre Xporadia en tant qu'enseignant(e) dédié(e). Ouvrez ce lien (${email}) : ${link}`,
  });
}

function SubjectCard({
  subject,
  onReassign,
  onDelete,
  isMutating,
}: {
  subject: Subject;
  onReassign: (subjectId: number, email: string) => void;
  onDelete: (subjectId: number) => void;
  isMutating: boolean;
}) {
  const [email, setEmail] = useState("");

  return (
    <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-xporadia-text-primary">{subject.name}</Text>
        <Pressable
          onPress={() => onDelete(subject.id)}
          accessibilityRole="button"
          accessibilityLabel={`Supprimer la matière ${subject.name}`}
          hitSlop={8}
        >
          <TrashIcon size={16} />
        </Pressable>
      </View>

      {subject.teacher ? (
        <Chip
          label={`Dédié(e) : ${subject.teacher.first_name} ${subject.teacher.last_name}`}
          variant="navy-subtle"
        />
      ) : subject.pending_invitation_email ? (
        <View className="gap-2">
          <Chip label={`Invitation envoyée : ${subject.pending_invitation_email}`} variant="orange" />
          <View className="flex-row items-center gap-2">
            <Button
              label="Partager le lien"
              variant="secondary"
              pill
              onPress={() =>
                subject.pending_invitation_token &&
                shareInvitation(subject.pending_invitation_token, subject.pending_invitation_email!)
              }
            />
          </View>
        </View>
      ) : (
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <Input
              placeholder="Email de l'enseignant à ajouter"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              accessibilityLabel={`Email de l'enseignant dédié pour ${subject.name}`}
            />
          </View>
          <Button
            label="Inviter"
            pill
            disabled={!email || isMutating}
            onPress={() => onReassign(subject.id, email)}
          />
        </View>
      )}

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/(app)/teacher/subject/[subjectId]",
            params: { subjectId: String(subject.id), editable: "0" },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`Voir les cours et exercices de ${subject.name}`}
      >
        <Text className="text-xs font-semibold text-xporadia-orange">Voir les cours et exercices →</Text>
      </Pressable>
    </View>
  );
}

export default function ClassSubjectsScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");

  const queryKey = ["subjects", classId];

  const { data: subjects, isLoading } = useQuery({
    queryKey,
    queryFn: () => academicsApi.fetchSubjects(Number(classId)),
    enabled: !!classId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      academicsApi.createSubject(Number(classId), {
        name,
        teacher_email: teacherEmail || undefined,
      }),
    onSuccess: (subject) => {
      queryClient.setQueryData<Subject[] | undefined>(queryKey, (prev) =>
        prev ? [...prev, subject] : [subject]
      );
      setName("");
      setTeacherEmail("");
      setAdding(false);
    },
    onError: () => {
      Alert.alert("Erreur", "Impossible de créer cette matière. Vérifiez l'email de l'enseignant.");
    },
  });

  const reassignMutation = useMutation({
    mutationFn: ({ subjectId, email }: { subjectId: number; email: string }) =>
      academicsApi.updateSubjectTeacher(subjectId, email),
    onSuccess: (subject) => {
      queryClient.setQueryData<Subject[] | undefined>(queryKey, (prev) =>
        prev ? prev.map((s) => (s.id === subject.id ? subject : s)) : prev
      );
    },
    onError: () => {
      Alert.alert("Erreur", "Impossible d'affecter cet enseignant. Vérifiez son email.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (subjectId: number) => academicsApi.deleteSubject(subjectId),
    onSuccess: (_data, subjectId) => {
      queryClient.setQueryData<Subject[] | undefined>(queryKey, (prev) =>
        prev ? prev.filter((s) => s.id !== subjectId) : prev
      );
    },
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Matières de cette classe. Ajoutez un enseignant dédié par matière : s&apos;il a déjà un compte
        Xporadia, il est notifié immédiatement ; sinon il reçoit une invitation par email pour créer
        son compte.
      </Text>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : (subjects ?? []).length === 0 ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">
          Aucune matière pour l&apos;instant.
        </Text>
      ) : (
        (subjects ?? []).map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            isMutating={reassignMutation.isPending}
            onReassign={(subjectId, email) => reassignMutation.mutate({ subjectId, email })}
            onDelete={(subjectId) => deleteMutation.mutate(subjectId)}
          />
        ))
      )}

      {adding ? (
        <View className="bg-white rounded-2xl p-4 border border-xporadia-orange/30 gap-3">
          <Input label="Nom de la matière" value={name} onChangeText={setName} placeholder="Mathématiques" />
          <Input
            label="Email de l'enseignant dédié (optionnel)"
            value={teacherEmail}
            onChangeText={setTeacherEmail}
            placeholder="enseignant@exemple.ci"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label="Annuler" variant="secondary" pill onPress={() => setAdding(false)} />
            </View>
            <View className="flex-1">
              <Button
                label="Créer"
                pill
                disabled={!name}
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
          accessibilityLabel="Ajouter une matière"
          className="flex-row items-center justify-center gap-2 bg-xporadia-orange rounded-full py-3.5"
        >
          <PlusIcon size={16} />
          <Text className="text-white font-semibold">Ajouter une matière</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
