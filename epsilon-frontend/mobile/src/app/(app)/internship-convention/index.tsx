import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import * as internshipsApi from "@/services/internships";

const STATUS_LABELS: Record<string, string> = {
  generated: "Générée",
  signed_sch: "Signée école",
  signed_ent: "Signée entreprise",
  complete: "Complète",
};

export default function MyConventionsScreen() {
  const { data: conventions, isLoading } = useQuery({
    queryKey: ["my-internship-conventions"],
    queryFn: internshipsApi.fetchMyConventions,
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">Vos conventions de stage.</Text>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : (conventions ?? []).length === 0 ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">
          Aucune convention pour l&apos;instant.
        </Text>
      ) : (
        (conventions ?? []).map((convention) => (
          <Pressable
            key={convention.id}
            onPress={() =>
              router.push({
                pathname: "/(app)/internship-convention/[conventionId]",
                params: { conventionId: convention.id },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`Voir la convention de ${convention.application.student.first_name}`}
            className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-xporadia-text-primary">
                {convention.application.student.first_name}
              </Text>
              <Chip label={STATUS_LABELS[convention.status] ?? convention.status} variant="navy-subtle" />
            </View>
            <Text className="text-xs text-xporadia-text-secondary">
              {convention.application.offer.title} · {convention.application.offer.company.company_name}
            </Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
