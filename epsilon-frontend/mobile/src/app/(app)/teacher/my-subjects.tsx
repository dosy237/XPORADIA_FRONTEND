import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { BookIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";

export default function MySubjectsScreen() {
  const { data: subjects, isLoading } = useQuery({
    queryKey: ["my-dedicated-subjects"],
    queryFn: academicsApi.fetchMyDedicatedSubjects,
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
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-6 gap-3">
        <BookIcon color={Colors.textSecondary} size={28} />
        <Text className="text-sm text-xporadia-text-secondary text-center">
          Aucun titulaire ne vous a encore affecté à une matière en tant qu&apos;enseignant dédié.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Matières où vous êtes l&apos;enseignant dédié.
      </Text>
      {subjects.map((subject) => (
        <View key={subject.id} className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(app)/teacher/subject/[subjectId]",
                params: { subjectId: String(subject.id), editable: "1" },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`Gérer les cours et exercices de ${subject.name}`}
            className="gap-2"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-xporadia-text-primary">{subject.name}</Text>
              <Chip label={subject.school_class.school_year} variant="navy-subtle" />
            </View>
            <Text className="text-xs text-xporadia-text-secondary">
              {subject.school_class.name} · {subject.school_class.track.name} ·{" "}
              {subject.school_class.track.department.name}
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(app)/teacher/report-cards/[classId]",
                params: { classId: String(subject.school_class.id) },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`Voir les bulletins de ${subject.school_class.name}`}
            className="self-start"
            hitSlop={8}
          >
            <Text className="text-xs font-semibold text-xporadia-orange">Voir les bulletins →</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
