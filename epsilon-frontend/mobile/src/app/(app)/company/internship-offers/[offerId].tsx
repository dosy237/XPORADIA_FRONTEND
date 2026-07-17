import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import * as internshipsApi from "@/services/internships";
import type { InternshipApplication } from "@/services/internships";

const STATUS_LABELS: Record<InternshipApplication["status"], string> = {
  pending: "En attente",
  accepted: "Acceptée",
  rejected: "Refusée",
};

export default function OfferApplicationsScreen() {
  const { offerId, title } = useLocalSearchParams<{ offerId: string; title?: string }>();
  const queryClient = useQueryClient();

  const queryKey = ["offer-applications", offerId];
  const { data: applications, isLoading } = useQuery({
    queryKey,
    queryFn: () => internshipsApi.fetchOfferApplications(String(offerId)),
    enabled: !!offerId,
  });

  const statusMutation = useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: "accepted" | "rejected" }) =>
      internshipsApi.updateInternshipApplicationStatus(applicationId, status),
    onSuccess: (application) => {
      queryClient.setQueryData<InternshipApplication[] | undefined>(queryKey, (prev) =>
        prev ? prev.map((a) => (a.id === application.id ? application : a)) : prev
      );
      if (application.status === "accepted") {
        Alert.alert("Stage confirmé", "La convention de stage a été générée.");
      }
    },
    onError: () => Alert.alert("Erreur", "Impossible de mettre à jour cette candidature."),
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Candidatures pour {title ?? "cette offre"}.
      </Text>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : (applications ?? []).length === 0 ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">
          Aucune candidature pour l&apos;instant.
        </Text>
      ) : (
        (applications ?? []).map((application) => (
          <View key={application.id} className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-xporadia-text-primary">
                {application.student.first_name}
              </Text>
              <Chip label={STATUS_LABELS[application.status]} variant="navy-subtle" />
            </View>
            <Text className="text-xs text-xporadia-text-secondary">
              {application.school.school_name} · {application.student.class_level}
            </Text>
            {application.motivation ? (
              <Text className="text-xs text-xporadia-text-secondary" numberOfLines={3}>
                {application.motivation}
              </Text>
            ) : null}

            {application.status === "pending" && (
              <View className="flex-row gap-2 mt-1">
                <Button
                  label="Accepter"
                  pill
                  onPress={() => statusMutation.mutate({ applicationId: application.id, status: "accepted" })}
                />
                <Button
                  label="Refuser"
                  variant="secondary"
                  pill
                  onPress={() => statusMutation.mutate({ applicationId: application.id, status: "rejected" })}
                />
              </View>
            )}
            {application.status === "accepted" && (
              <Button
                label="Voir mes conventions"
                variant="secondary"
                pill
                onPress={() => router.push("/(app)/internship-convention")}
              />
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}
