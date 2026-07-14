import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { LEVEL_LABELS } from "@/constants/certificationLevels";
import * as directoryApi from "@/services/teacherDirectory";
import type { TeacherDirectoryCard } from "@/services/teacherDirectory";

function TeacherFeedCard({ teacher }: { teacher: TeacherDirectoryCard }) {
  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/feed/${teacher.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Voir le profil de ${teacher.first_name} ${teacher.last_name}`}
      className="bg-white rounded-2xl p-4 border border-xporadia-border flex-row items-center gap-3"
    >
      <Avatar firstName={teacher.first_name} lastName={teacher.last_name} size={52} />
      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          {teacher.first_name} {teacher.last_name}
        </Text>
        <Text className="text-xs text-xporadia-text-secondary" numberOfLines={1}>
          {teacher.subjects.join(", ") || "Matières non renseignées"}
          {teacher.location ? ` · ${teacher.location}` : ""}
        </Text>
        <View className="flex-row gap-1.5 mt-1">
          <Chip
            label={teacher.current_level ? LEVEL_LABELS[teacher.current_level] : "Non certifié"}
            variant="navy-subtle"
          />
        </View>
      </View>
    </Pressable>
  );
}

export default function FeedScreen() {
  const [subject, setSubject] = useState("");

  const { data: teachers, isLoading } = useQuery({
    queryKey: ["feed-teachers", subject],
    queryFn: () => directoryApi.fetchTeacherDirectory(subject ? { subject } : undefined),
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Découvrez les enseignants accrédités Xporadia et les établissements partenaires.
      </Text>
      <Input
        placeholder="Rechercher par matière (ex. Maths)"
        value={subject}
        onChangeText={setSubject}
        accessibilityLabel="Rechercher un enseignant par matière"
      />

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : teachers && teachers.length > 0 ? (
        <View className="gap-3">
          {teachers.map((teacher) => (
            <TeacherFeedCard key={teacher.id} teacher={teacher} />
          ))}
        </View>
      ) : (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">
          Aucun enseignant à afficher pour l&apos;instant.
        </Text>
      )}
    </ScrollView>
  );
}
