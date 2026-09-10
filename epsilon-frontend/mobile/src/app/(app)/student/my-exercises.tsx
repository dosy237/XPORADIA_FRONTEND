import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { CheckCircleIcon, ClockIcon, GraduationCapIcon, WarningIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as virtualClassesApi from "@/services/virtualClasses";
import type { ChildExercise } from "@/services/virtualClasses";

type Filter = "en_cours" | "soumis" | "corrige";

interface FlatExercise extends ChildExercise {
  subject_name: string;
}

function formatDeadline(iso: string | null) {
  if (!iso) return "Pas d'échéance";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function ExerciseRow({ exercise }: { exercise: FlatExercise }) {
  const status = exercise.my_submission?.status ?? null;
  const canOpenDm = !!exercise.my_dm_channel_id;

  return (
    <Pressable
      disabled={!canOpenDm}
      onPress={() => {
        if (!canOpenDm) return;
        const query = new URLSearchParams({
          exerciseId: exercise.id,
          exerciseTitle: exercise.title,
          exerciseDeadline: exercise.deadline ?? "",
        });
        router.push(`/(app)/messages/${exercise.my_dm_channel_id}?${query.toString()}`);
      }}
      className="bg-white rounded-2xl p-3.5 gap-2 shadow-soft"
    >
      <View className="flex-row items-center gap-2.5">
        <View className="h-9 w-9 rounded-xl bg-xporadia-orange/10 items-center justify-center">
          <GraduationCapIcon size={16} color={Colors.orange} />
        </View>
        <View className="flex-1">
          <Text className="text-[10px] font-bold text-xporadia-orange-text uppercase tracking-wide">
            {exercise.subject_name}
          </Text>
          <Text className="text-sm font-bold text-xporadia-text-primary" numberOfLines={2}>
            {exercise.title}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          {exercise.is_overdue ? (
            <WarningIcon size={12} color={Colors.red} />
          ) : (
            <ClockIcon size={12} color={Colors.textSecondary} />
          )}
          <Text className={`text-[11px] ${exercise.is_overdue ? "text-xporadia-red" : "text-xporadia-text-secondary"}`}>
            {formatDeadline(exercise.deadline)}
          </Text>
        </View>
        {status === "graded" && exercise.my_submission?.grade ? (
          <View className="flex-row items-center gap-1">
            <CheckCircleIcon size={12} color={Colors.green} />
            <Text className="text-xs font-bold text-xporadia-green">{exercise.my_submission.grade}/20</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function MyExercisesScreen() {
  const [filter, setFilter] = useState<Filter>("en_cours");

  const { data: subjects, isLoading } = useQuery({
    queryKey: ["my-subjects"],
    queryFn: virtualClassesApi.fetchMySubjects,
  });

  const allExercises: FlatExercise[] = useMemo(
    () =>
      (subjects ?? []).flatMap((subject) =>
        subject.exercises.map((exercise) => ({ ...exercise, subject_name: subject.name }))
      ),
    [subjects]
  );

  const filtered = useMemo(() => {
    if (filter === "en_cours") {
      return allExercises
        .filter((e) => !e.my_submission)
        .sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
    }
    if (filter === "soumis") {
      return allExercises.filter((e) => e.my_submission?.status === "submitted");
    }
    return allExercises.filter((e) => e.my_submission?.status === "graded");
  }, [allExercises, filter]);

  return (
    <View className="flex-1 bg-xporadia-bg">
      <View className="flex-row gap-2 px-6 pt-5 pb-1">
        <Pressable onPress={() => setFilter("en_cours")}>
          <Chip label="En cours" variant={filter === "en_cours" ? "navy" : "navy-subtle"} />
        </Pressable>
        <Pressable onPress={() => setFilter("soumis")}>
          <Chip label="Soumis" variant={filter === "soumis" ? "navy" : "navy-subtle"} />
        </Pressable>
        <Pressable onPress={() => setFilter("corrige")}>
          <Chip label="Corrigé" variant={filter === "corrige" ? "navy" : "navy-subtle"} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="p-6 gap-3 pb-16">
        {isLoading ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
        ) : filtered.length === 0 ? (
          <View className="items-center gap-2 py-10">
            <GraduationCapIcon size={22} color={Colors.textSecondary} />
            <Text className="text-xs text-xporadia-text-secondary">Aucun devoir dans cette catégorie.</Text>
          </View>
        ) : (
          filtered.map((exercise) => <ExerciseRow key={exercise.id} exercise={exercise} />)
        )}
      </ScrollView>
    </View>
  );
}
