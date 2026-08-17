import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { BookIcon, ClockIcon, DownloadIcon, UsersIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as gradingApi from "@/services/grading";
import * as parentApi from "@/services/parentProfile";
import * as virtualClassesApi from "@/services/virtualClasses";
import type { ChildExercise } from "@/services/virtualClasses";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function SectionTitle({ title }: { title: string }) {
  return <Text className="text-base font-bold text-xporadia-navy">{title}</Text>;
}

function ExerciseCard({ childId, exercise }: { childId: number; exercise: ChildExercise }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const submission = exercise.my_submission;

  const submitMutation = useMutation({
    mutationFn: () => virtualClassesApi.submitExercise(exercise.id, { child_id: childId, content }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["child-subjects", childId] }),
  });

  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-xporadia-text-primary flex-1">
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

  const { data: classInfo } = useQuery({
    queryKey: ["child-class", id],
    queryFn: () => parentApi.fetchChildClass(id),
    enabled: !!id,
  });

  const { data: timetable } = useQuery({
    queryKey: ["child-timetable", id],
    queryFn: () => parentApi.fetchChildTimetable(id),
    enabled: !!id,
  });

  const { data: reportCards } = useQuery({
    queryKey: ["child-report-cards", id],
    queryFn: () => gradingApi.fetchChildReportCards(id),
    enabled: !!id,
  });

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ["child-subjects", id],
    queryFn: () => virtualClassesApi.fetchChildSubjects(id),
    enabled: !!id,
  });

  const contactMutation = useMutation({
    mutationFn: (teacherId: number) => parentApi.contactChildTeacher(id, teacherId),
    onSuccess: (channel) => router.push(`/(app)/messages/${channel.id}`),
    onError: () => Alert.alert("Erreur", "Impossible d'ouvrir la conversation."),
  });

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1; // lundi = 0
  const todaySlots = (timetable ?? [])
    .filter((s) => s.weekday === todayIndex)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-5 pb-12">
      {classInfo?.school_class_name ? (
        <View className="bg-white rounded-2xl p-4 shadow-soft gap-1">
          <Text className="text-lg font-bold text-xporadia-navy">{classInfo.school_class_name}</Text>
          {classInfo.homeroom_teacher ? (
            <Text className="text-xs text-xporadia-text-secondary">
              Titulaire : {classInfo.homeroom_teacher.first_name} {classInfo.homeroom_teacher.last_name}
            </Text>
          ) : null}
        </View>
      ) : (
        <View className="items-center gap-2 py-6">
          <UsersIcon size={22} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary text-center">
            Cet enfant n&apos;est inscrit dans aucune classe pour l&apos;instant.
          </Text>
        </View>
      )}

      {todaySlots.length > 0 && (
        <View className="gap-3">
          <SectionTitle title="Aujourd'hui" />
          <View className="gap-2">
            {todaySlots.map((slot) => (
              <View key={slot.id} className="bg-white rounded-2xl p-4 shadow-soft flex-row items-center gap-3">
                <View className="items-center w-14">
                  <Text className="text-sm font-bold text-xporadia-navy">{slot.start_time.slice(0, 5)}</Text>
                  <Text className="text-[10px] text-xporadia-text-secondary">{slot.end_time.slice(0, 5)}</Text>
                </View>
                <View className="w-px h-9 bg-xporadia-border" />
                <Text className="text-sm font-semibold text-xporadia-text-primary flex-1">
                  {slot.subject_name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {reportCards && reportCards.length > 0 && (
        <View className="gap-3">
          <SectionTitle title="Bulletins" />
          {reportCards.map((rc) => (
            <View key={rc.id} className="bg-white rounded-2xl p-4 shadow-soft flex-row items-center gap-3">
              <View className="h-10 w-10 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
                <DownloadIcon size={16} color={Colors.navy} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-xporadia-text-primary">{rc.term_label}</Text>
                <Text className="text-xs text-xporadia-text-secondary">
                  Moyenne {rc.general_average}/20 — rang {rc.rank}/{rc.class_size}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View className="gap-3">
        <SectionTitle title="Devoirs" />
        {subjectsLoading ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
        ) : !subjects || subjects.length === 0 ? (
          <Text className="text-xs text-xporadia-text-secondary text-center py-4">
            Aucune classe active trouvée pour cet enfant pour l&apos;instant.
          </Text>
        ) : (
          subjects.map((subject) => (
            <View key={subject.id} className="gap-3">
              <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
                {subject.name}
              </Text>
              {subject.exercises.length === 0 ? (
                <Text className="text-xs text-xporadia-text-secondary">Aucun devoir publié.</Text>
              ) : (
                subject.exercises.map((exercise) => (
                  <ExerciseCard key={exercise.id} childId={id} exercise={exercise} />
                ))
              )}
            </View>
          ))
        )}
      </View>

      {classInfo && classInfo.teachers.length > 0 && (
        <View className="gap-3">
          <SectionTitle title="Enseignants" />
          {classInfo.teachers.map((teacher) => (
            <View key={teacher.id} className="bg-white rounded-2xl p-4 shadow-soft flex-row items-center gap-3">
              <View className="h-10 w-10 rounded-full bg-xporadia-bg items-center justify-center">
                <BookIcon size={16} color={Colors.navy} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-xporadia-text-primary">
                  {teacher.first_name} {teacher.last_name}
                </Text>
                <Text className="text-xs text-xporadia-text-secondary">{teacher.role_label}</Text>
              </View>
              <Pressable
                onPress={() => contactMutation.mutate(teacher.id)}
                accessibilityRole="button"
                accessibilityLabel={`Contacter ${teacher.first_name} ${teacher.last_name}`}
                className="bg-xporadia-orange/10 rounded-full px-3 py-1.5"
              >
                <Text className="text-xs font-semibold text-xporadia-orange-text">Contacter</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
