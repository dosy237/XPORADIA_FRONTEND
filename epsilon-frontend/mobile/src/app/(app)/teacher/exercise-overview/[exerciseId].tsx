import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { CheckCircleIcon, ClockIcon, UsersIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as virtualClassesApi from "@/services/virtualClasses";
import type { ExerciseStudentStatus } from "@/services/virtualClasses";

const STATUS_LABEL: Record<string, string> = {
  not_submitted: "Pas soumis",
  submitted: "Soumis",
  graded: "Corrigé",
};

function StudentRow({
  student,
  exerciseId,
  exerciseTitle,
  exerciseDeadline,
}: {
  student: ExerciseStudentStatus;
  exerciseId: string;
  exerciseTitle: string;
  exerciseDeadline: string | null;
}) {
  const canOpenDm = student.status !== "not_submitted" && !!student.channel_id;

  return (
    <Pressable
      disabled={!canOpenDm}
      onPress={() => {
        if (!canOpenDm) return;
        const query = new URLSearchParams({
          exerciseId,
          exerciseTitle,
          exerciseDeadline: exerciseDeadline ?? "",
          submissionId: String(student.submission_id),
        });
        router.push(`/(app)/messages/${student.channel_id}?${query.toString()}`);
      }}
      accessibilityRole={canOpenDm ? "button" : undefined}
      className="flex-row items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-soft"
    >
      <Avatar firstName={student.first_name} lastName={student.last_name} imageUri={student.avatar} size={38} />
      <View className="flex-1">
        <Text className="text-sm font-semibold text-xporadia-text-primary">
          {student.first_name} {student.last_name}
        </Text>
        {student.grade ? (
          <Text className="text-xs text-xporadia-text-secondary">Note : {student.grade}/20</Text>
        ) : null}
      </View>
      <View className="flex-row items-center gap-1.5">
        {student.status === "graded" ? <CheckCircleIcon size={13} color={Colors.green} /> : null}
        <Text
          className={`text-xs font-semibold ${
            student.status === "not_submitted"
              ? "text-xporadia-text-secondary"
              : student.status === "graded"
                ? "text-xporadia-green"
                : "text-xporadia-navy"
          }`}
        >
          {STATUS_LABEL[student.status]}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ExerciseOverviewScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();

  const { data: exercise } = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: () => virtualClassesApi.fetchExercise(exerciseId),
    enabled: !!exerciseId,
  });

  const { data: stats } = useQuery({
    queryKey: ["exercise-stats", exerciseId],
    queryFn: () => virtualClassesApi.fetchExerciseSubmissionStats(exerciseId),
    enabled: !!exerciseId,
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ["exercise-student-status", exerciseId],
    queryFn: () => virtualClassesApi.fetchExerciseStudentStatus(exerciseId),
    enabled: !!exerciseId,
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      {exercise ? (
        <Card className="gap-2">
          <View className="flex-row items-center gap-2">
            <Chip label={exercise.kind === "exam" ? "Examen" : "Devoir"} variant="orange" />
            {exercise.deadline ? (
              <View className="flex-row items-center gap-1">
                <ClockIcon size={12} color={Colors.textSecondary} />
                <Text className="text-xs text-xporadia-text-secondary">
                  {new Date(exercise.deadline).toLocaleDateString("fr-FR", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="text-base font-bold text-xporadia-navy">{exercise.title}</Text>
          <Text className="text-xs text-xporadia-text-secondary leading-5">{exercise.instructions}</Text>
        </Card>
      ) : null}

      {stats ? (
        <View className="flex-row gap-2">
          <View className="flex-1 bg-white rounded-2xl p-3 items-center gap-1 shadow-soft">
            <Text className="text-lg font-bold text-xporadia-navy">
              {stats.submitted_count}/{stats.total_enrolled}
            </Text>
            <Text className="text-[10px] text-xporadia-text-secondary text-center">Ont soumis</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-3 items-center gap-1 shadow-soft">
            <Text className="text-lg font-bold text-xporadia-orange-text">{stats.late_count}</Text>
            <Text className="text-[10px] text-xporadia-text-secondary text-center">En retard</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-3 items-center gap-1 shadow-soft">
            <Text className="text-lg font-bold text-xporadia-green">{stats.graded_count}</Text>
            <Text className="text-[10px] text-xporadia-text-secondary text-center">Corrigés</Text>
          </View>
        </View>
      ) : null}

      <Text className="text-sm font-bold text-xporadia-navy">Élèves de la classe</Text>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : (students ?? []).length === 0 ? (
        <View className="items-center gap-2 py-8">
          <UsersIcon size={22} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Aucun élève inscrit.</Text>
        </View>
      ) : (
        <View className="gap-2">
          {(students ?? []).map((student) => (
            <StudentRow
              key={student.child_id}
              student={student}
              exerciseId={exerciseId}
              exerciseTitle={exercise?.title ?? ""}
              exerciseDeadline={exercise?.deadline ?? null}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
