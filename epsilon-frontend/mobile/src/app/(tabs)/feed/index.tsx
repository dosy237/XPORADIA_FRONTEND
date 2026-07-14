import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { BuildingIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { LEVEL_LABELS } from "@/constants/certificationLevels";
import { Colors } from "@/constants/theme";
import * as establishmentApi from "@/services/establishmentDirectory";
import type { EstablishmentDirectoryCard } from "@/services/establishmentDirectory";
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

function EstablishmentFeedCard({ establishment }: { establishment: EstablishmentDirectoryCard }) {
  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/feed/establishment/${establishment.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Voir l'établissement ${establishment.school_name}`}
      className="bg-white rounded-2xl p-4 border border-xporadia-border flex-row items-center gap-3"
    >
      <View className="h-[52px] w-[52px] rounded-full bg-xporadia-navy/[0.08] items-center justify-center">
        <BuildingIcon color={Colors.navy} size={24} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          {establishment.school_name}
        </Text>
        <Text className="text-xs text-xporadia-text-secondary" numberOfLines={1}>
          {establishment.address || "Établissement"}
          {establishment.student_count ? ` · ${establishment.student_count} élèves` : ""}
        </Text>
        <View className="flex-row gap-1.5 mt-1">
          <Chip label="Établissement" variant="navy-subtle" />
          {establishment.is_partner && <Chip label="Partenaire" variant="orange" />}
        </View>
      </View>
    </Pressable>
  );
}

type FeedItem =
  | { type: "teacher"; data: TeacherDirectoryCard }
  | { type: "establishment"; data: EstablishmentDirectoryCard };

function interleave(teachers: TeacherDirectoryCard[], establishments: EstablishmentDirectoryCard[]): FeedItem[] {
  const items: FeedItem[] = [];
  const max = Math.max(teachers.length, establishments.length);
  for (let i = 0; i < max; i++) {
    if (teachers[i]) items.push({ type: "teacher", data: teachers[i] });
    if (establishments[i]) items.push({ type: "establishment", data: establishments[i] });
  }
  return items;
}

export default function FeedScreen() {
  const [subject, setSubject] = useState("");

  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ["feed-teachers", subject],
    queryFn: () => directoryApi.fetchTeacherDirectory(subject ? { subject } : undefined),
  });

  const { data: establishments, isLoading: establishmentsLoading } = useQuery({
    queryKey: ["feed-establishments"],
    queryFn: () => establishmentApi.fetchEstablishmentDirectory(),
  });

  const isLoading = teachersLoading || establishmentsLoading;
  const items = interleave(teachers ?? [], establishments ?? []);

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
      ) : items.length > 0 ? (
        <View className="gap-3">
          {items.map((item) =>
            item.type === "teacher" ? (
              <TeacherFeedCard key={`teacher-${item.data.id}`} teacher={item.data} />
            ) : (
              <EstablishmentFeedCard key={`establishment-${item.data.id}`} establishment={item.data} />
            )
          )}
        </View>
      ) : (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">
          Rien à afficher pour l&apos;instant.
        </Text>
      )}
    </ScrollView>
  );
}
