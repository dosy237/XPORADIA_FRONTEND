import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import { BriefcaseIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as employmentApi from "@/services/employment";
import type { ApplicationStatus } from "@/services/employment";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "En attente",
  viewed: "Vue",
  interview: "Entretien",
  accepted: "Acceptée",
  rejected: "Refusée",
  withdrawn: "Retirée",
};

const STATUS_VARIANTS: Record<ApplicationStatus, "navy-subtle" | "navy" | "orange" | "neutral"> = {
  pending: "neutral",
  viewed: "navy-subtle",
  interview: "orange",
  accepted: "navy",
  rejected: "neutral",
  withdrawn: "neutral",
};

export default function MyJobApplicationsScreen() {
  const { data: applications, isLoading } = useQuery({
    queryKey: ["my-job-applications"],
    queryFn: employmentApi.fetchMyApplications,
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
          Vous n&apos;avez encore postulé à aucune offre.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">Vos candidatures.</Text>
      {applications.map((application) => (
        <View key={application.id} className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-xporadia-text-primary flex-1">
              {application.listing.title}
            </Text>
            <Chip label={STATUS_LABELS[application.status]} variant={STATUS_VARIANTS[application.status]} />
          </View>
          <Text className="text-xs text-xporadia-text-secondary">
            {application.listing.school.school_name} · {application.listing.city}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
