import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";

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
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-xporadia-text-primary">{subject.name}</Text>
            <Chip label={subject.school_class.school_year} variant="navy-subtle" />
          </View>
          <Text className="text-xs text-xporadia-text-secondary">
            {subject.school_class.name} · {subject.school_class.track.name} ·{" "}
            {subject.school_class.track.department.name}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
