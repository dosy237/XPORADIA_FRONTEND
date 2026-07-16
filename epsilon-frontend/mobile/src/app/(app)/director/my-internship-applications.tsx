import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as internshipsApi from "@/services/internships";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  rejected: "Refusée",
};

export default function MyInternshipApplicationsScreen() {
  const { data: applications, isLoading } = useQuery({
    queryKey: ["my-internship-applications"],
    queryFn: internshipsApi.fetchMyInternshipApplications,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-6 gap-3">
        <BriefcaseIcon color={Colors.textSecondary} size={28} />
        <Text className="text-sm text-xporadia-text-secondary text-center">
          Aucune candidature de stage envoyée pour l&apos;instant.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Candidatures de stage envoyées au nom de vos élèves.
      </Text>
      {applications.map((application) => (
        <View key={application.id} className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-xporadia-text-primary flex-1" numberOfLines={1}>
              {application.student.first_name} — {application.offer.title}
            </Text>
            <Chip label={STATUS_LABELS[application.status]} variant="navy-subtle" />
          </View>
          <Text className="text-xs text-xporadia-text-secondary">{application.offer.company.company_name}</Text>
          {application.status === "accepted" && (
            <Button
              label="Voir mes conventions"
              variant="secondary"
              pill
              onPress={() => router.push("/(app)/internship-convention")}
            />
          )}
        </View>
      ))}
    </ScrollView>
  );
}
