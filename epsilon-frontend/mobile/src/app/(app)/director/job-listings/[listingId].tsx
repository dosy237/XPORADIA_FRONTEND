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

interface AcceptPayload {
  salaryAgreed?: number;
  hourlyRateTeacher?: number;
  hourlyRateBilled?: number;
}

function ApplicationCard({
  application,
  onSetStatus,
  onAccept,
  isMutating,
}: {
  application: JobApplication;
  onSetStatus: (status: ApplicationStatus) => void;
  onAccept: (payload: AcceptPayload) => void;
  isMutating: boolean;
}) {
  const isCdi = application.listing.contract_type === "cdi";
  const [salary, setSalary] = useState("");
  const [hourlyTeacher, setHourlyTeacher] = useState("");
  const [hourlyBilled, setHourlyBilled] = useState("");
  const [accepting, setAccepting] = useState(false);

  const canConfirm = isCdi ? !!salary : !!hourlyTeacher && !!hourlyBilled;

  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft gap-2">
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
            <View className="gap-2">
              {isCdi ? (
                <Input
                  label="Salaire mensuel convenu (FCFA)"
                  value={salary}
                  onChangeText={setSalary}
                  keyboardType="numeric"
                  placeholder="Ex. 150000"
                />
              ) : (
                <>
                  <Text className="text-xs text-xporadia-text-secondary">
                    Contrat {application.listing.contract_type.toUpperCase()} — l&apos;enseignant sera payé
                    sur ses heures déclarées et validées.
                  </Text>
                  <Input
                    label="Tarif versé à l'enseignant (FCFA/heure)"
                    value={hourlyTeacher}
                    onChangeText={setHourlyTeacher}
                    keyboardType="numeric"
                    placeholder="Ex. 2000"
                  />
                  <Input
                    label="Tarif facturé à l'établissement (FCFA/heure)"
                    value={hourlyBilled}
                    onChangeText={setHourlyBilled}
                    keyboardType="numeric"
                    placeholder="Ex. 3000"
                  />
                </>
              )}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button label="Annuler" variant="secondary" pill onPress={() => setAccepting(false)} />
                </View>
                <View className="flex-1">
                  <Button
                    label="Confirmer"
                    pill
                    disabled={!canConfirm || isMutating}
                    onPress={() => {
                      onAccept(
                        isCdi
                          ? { salaryAgreed: Number(salary) }
                          : { hourlyRateTeacher: Number(hourlyTeacher), hourlyRateBilled: Number(hourlyBilled) }
                      );
                      setAccepting(false);
                    }}
                  />
                </View>
              </View>
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
      hourlyRateTeacher,
      hourlyRateBilled,
    }: {
      applicationId: string;
      status: ApplicationStatus;
      salaryAgreed?: number;
      hourlyRateTeacher?: number;
      hourlyRateBilled?: number;
    }) =>
      employmentApi.updateApplicationStatus(applicationId, {
        status,
        salary_agreed: salaryAgreed,
        hourly_rate_teacher: hourlyRateTeacher,
        hourly_rate_billed: hourlyRateBilled,
      }),
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
            onSetStatus={(status) => statusMutation.mutate({ applicationId: application.id, status })}
            onAccept={(payload) =>
              statusMutation.mutate({
                applicationId: application.id,
                status: "accepted",
                salaryAgreed: payload.salaryAgreed,
                hourlyRateTeacher: payload.hourlyRateTeacher,
                hourlyRateBilled: payload.hourlyRateBilled,
              })
            }
          />
        ))
      )}
    </ScrollView>
  );
}
