import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import * as employmentApi from "@/services/employment";
import type { ApplicationStatus, JobApplication } from "@/services/employment";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "En attente",
  viewed: "Vue",
  interview: "Entretien",
  accepted: "Acceptée",
  rejected: "Refusée",
  withdrawn: "Retirée",
};

function ApplicationCard({
  application,
  onSetStatus,
  isMutating,
}: {
  application: JobApplication;
  onSetStatus: (status: ApplicationStatus, salaryAgreed?: number) => void;
  isMutating: boolean;
}) {
  const [salary, setSalary] = useState("");
  const [accepting, setAccepting] = useState(false);

  return (
    <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          {application.teacher.first_name} {application.teacher.last_name}
        </Text>
        <Chip label={STATUS_LABELS[application.status]} variant="navy-subtle" />
      </View>
      {application.cover_letter ? (
        <Text className="text-xs text-xporadia-text-secondary" numberOfLines={3}>
          {application.cover_letter}
        </Text>
      ) : null}

      {application.status !== "accepted" && application.status !== "rejected" && (
        <View className="gap-2 mt-1">
          {accepting ? (
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <Input
                  placeholder="Salaire convenu (FCFA)"
                  value={salary}
                  onChangeText={setSalary}
                  keyboardType="numeric"
                />
              </View>
              <Button
                label="Confirmer"
                pill
                disabled={!salary || isMutating}
                onPress={() => {
                  onSetStatus("accepted", Number(salary));
                  setAccepting(false);
                }}
              />
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {application.status === "pending" && (
                <Button label="Marquer vue" pill variant="secondary" onPress={() => onSetStatus("viewed")} />
              )}
              <Button
                label="Inviter à un entretien"
                pill
                variant="secondary"
                onPress={() => onSetStatus("interview")}
              />
              <Button label="Recruter" pill onPress={() => setAccepting(true)} />
              <Button
                label="Refuser"
                pill
                variant="secondary"
                onPress={() =>
                  Alert.alert("Refuser la candidature", "Confirmer le refus ?", [
                    { text: "Annuler", style: "cancel" },
                    { text: "Refuser", style: "destructive", onPress: () => onSetStatus("rejected") },
                  ])
                }
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function ListingApplicationsScreen() {
  const { listingId, title } = useLocalSearchParams<{ listingId: string; title?: string }>();
  const queryClient = useQueryClient();

  const queryKey = ["listing-applications", listingId];
  const { data: applications, isLoading } = useQuery({
    queryKey,
    queryFn: () => employmentApi.fetchListingApplications(String(listingId)),
    enabled: !!listingId,
  });

  const statusMutation = useMutation({
    mutationFn: ({
      applicationId,
      status,
      salaryAgreed,
    }: {
      applicationId: string;
      status: ApplicationStatus;
      salaryAgreed?: number;
    }) => employmentApi.updateApplicationStatus(applicationId, { status, salary_agreed: salaryAgreed }),
    onSuccess: (application) => {
      queryClient.setQueryData<JobApplication[] | undefined>(queryKey, (prev) =>
        prev ? prev.map((a) => (a.id === application.id ? application : a)) : prev
      );
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
          <ApplicationCard
            key={application.id}
            application={application}
            isMutating={statusMutation.isPending}
            onSetStatus={(status, salaryAgreed) =>
              statusMutation.mutate({ applicationId: application.id, status, salaryAgreed })
            }
          />
        ))
      )}
    </ScrollView>
  );
}
