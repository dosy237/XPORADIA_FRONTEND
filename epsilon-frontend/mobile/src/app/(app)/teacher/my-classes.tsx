import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { BuildingIcon, UsersIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";

export default function MyClassesScreen() {
  const { data: classes, isLoading } = useQuery({
    queryKey: ["my-homeroom-classes"],
    queryFn: academicsApi.fetchMyHomeroomClasses,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-6 gap-3">
        <BuildingIcon color={Colors.textSecondary} size={28} />
        <Text className="text-sm text-xporadia-text-secondary text-center">
          Vous n&apos;êtes titulaire d&apos;aucune classe pour l&apos;instant. Un établissement
          vous y affectera.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Classes dont vous êtes l&apos;enseignant titulaire.
      </Text>
      {classes.map((schoolClass) => (
        <View key={schoolClass.id} className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-xporadia-text-primary">
              {schoolClass.name}
            </Text>
            <Chip label={schoolClass.school_year} variant="navy-subtle" />
          </View>
          <Text className="text-xs text-xporadia-text-secondary">
            {schoolClass.track.name} · {schoolClass.track.department.name}
          </Text>
          {schoolClass.capacity ? (
            <View className="flex-row items-center gap-2">
              <UsersIcon color={Colors.textSecondary} size={14} />
              <Text className="text-xs text-xporadia-text-secondary">
                Effectif maximum : {schoolClass.capacity}
              </Text>
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}
