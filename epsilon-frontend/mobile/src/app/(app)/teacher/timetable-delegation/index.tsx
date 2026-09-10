import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { ClockIcon, UsersIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";

export default function TimetableDelegationClassesScreen() {
  const { data: classes, isLoading } = useQuery({
    queryKey: ["my-timetable-delegation-classes"],
    queryFn: academicsApi.fetchMyTimetableDelegationClasses,
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Emplois du temps</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Toutes les classes de l&apos;établissement — choisissez celle à modifier.
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : classes && classes.length > 0 ? (
        <View className="gap-3">
          {classes.map((schoolClass) => (
            <Pressable
              key={schoolClass.id}
              onPress={() =>
                router.push({
                  pathname: "/(app)/teacher/timetable-editor/[classId]",
                  params: { classId: String(schoolClass.id), className: schoolClass.name },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Gérer l'emploi du temps de ${schoolClass.name}`}
              className="bg-white rounded-2xl p-4 shadow-soft flex-row items-center gap-3"
            >
              <View className="h-10 w-10 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
                <ClockIcon size={16} color={Colors.navy} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-xporadia-text-primary">{schoolClass.name}</Text>
                <Text className="text-xs text-xporadia-text-secondary">
                  {schoolClass.homeroom_teacher
                    ? `Titulaire : ${schoolClass.homeroom_teacher.first_name} ${schoolClass.homeroom_teacher.last_name}`
                    : "Aucun titulaire affecté"}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View className="items-center gap-2 py-10">
          <UsersIcon size={24} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary text-center">
            Aucune classe dans cet établissement pour l&apos;instant.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
