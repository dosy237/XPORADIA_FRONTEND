import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { ClockIcon, MedalIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as virtualClassesApi from "@/services/virtualClasses";
import type { ChildExercise } from "@/services/virtualClasses";

type Category = "ongoing" | "submitted" | "exams" | "graded";

const CATEGORY_TABS: { value: Category; label: string }[] = [
  { value: "ongoing", label: "En cours" },
  { value: "submitted", label: "Rendus" },
  { value: "exams", label: "Examens" },
  { value: "graded", label: "Corrigés" },
];

function categorize(ex: ChildExercise & { subjectName: string }): Category | null {
  if (ex.kind === "exam") return "exams";
  if (ex.my_submission?.status === "graded") return "graded";
  if (ex.my_submission || ex.is_overdue) return "submitted";
  return "ongoing";
}

function ExerciseCard({ exercise }: { exercise: ChildExercise & { subjectName: string } }) {
  const late = exercise.my_submission?.is_late;
  return (
    <Card onPress={() => router.push(`/(app)/student/assignments/${exercise.id}`)} className="gap-1.5">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="text-sm font-semibold text-xporadia-text-primary flex-1">{exercise.title}</Text>
        {exercise.my_submission?.status === "graded" && exercise.my_submission.grade ? (
          <Chip label={`${exercise.my_submission.grade}/20`} variant="orange" />
        ) : null}
      </View>
      <Text className="text-xs text-xporadia-text-secondary">{exercise.subjectName}</Text>
      <View className="flex-row items-center gap-3 pt-0.5">
        {exercise.deadline ? (
          <View className="flex-row items-center gap-1">
            <ClockIcon size={12} color={Colors.textSecondary} />
            <Text className="text-[11px] text-xporadia-text-secondary">
              {new Date(exercise.deadline).toLocaleDateString("fr-FR")}
            </Text>
          </View>
        ) : null}
        {late ? <Chip label="Rendu en retard" variant="orange" /> : null}
        {!exercise.my_submission && exercise.is_overdue ? <Chip label="Non rendu" variant="navy-subtle" /> : null}
      </View>
    </Card>
  );
}

export default function AssignmentsScreen() {
  const [category, setCategory] = useState<Category>("ongoing");
  const { data: subjects, isLoading } = useQuery({
    queryKey: ["my-subjects"],
    queryFn: virtualClassesApi.fetchMySubjects,
  });

  const allExercises = (subjects ?? []).flatMap((s) =>
    s.exercises.map((ex) => ({ ...ex, subjectName: s.name })),
  );
  const filtered = allExercises.filter((ex) => categorize(ex) === category);

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Mes devoirs</Text>
        <Text className="text-sm text-xporadia-text-secondary">Toutes vos matières, triées par échéance.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {CATEGORY_TABS.map((tab) => (
          <Chip
            key={tab.value}
            label={tab.label}
            variant={category === tab.value ? "navy" : "neutral"}
            onPress={() => setCategory(tab.value)}
          />
        ))}
      </ScrollView>

      {isLoading ? (
        <Text className="text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : filtered.length > 0 ? (
        <View className="gap-3">
          {filtered
            .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""))
            .map((ex) => (
              <ExerciseCard key={ex.id} exercise={ex} />
            ))}
        </View>
      ) : (
        <View className="items-center gap-2 py-10">
          <MedalIcon size={24} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Rien dans cette catégorie.</Text>
        </View>
      )}
    </ScrollView>
  );
}
