import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { GraduationCapIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";
import * as gradingApi from "@/services/grading";
import type { JoinRequest } from "@/services/grading";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Rejetée",
};

function JoinRequestCard({ request }: { request: JoinRequest }) {
  const queryClient = useQueryClient();
  const [placing, setPlacing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const { data: classes } = useQuery({
    queryKey: ["all-my-classes"],
    queryFn: academicsApi.fetchAllMyClasses,
    enabled: placing,
  });

  const mutation = useMutation({
    mutationFn: (payload: { approve: boolean; rejection_reason?: string; class_id?: number }) =>
      gradingApi.reviewJoinRequest(request.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["director-join-requests"] });
      setPlacing(false);
      setRejecting(false);
    },
    onError: () => Alert.alert("Erreur", "Impossible de traiter cette demande."),
  });

  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft gap-3">
      <View className="flex-row items-center gap-3">
        <Avatar firstName={request.child_first_name} lastName={request.child_last_name} size={40} />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-xporadia-text-primary">
            {request.child_first_name} {request.child_last_name}
          </Text>
          <Text className="text-xs text-xporadia-text-secondary">Niveau déclaré : {request.declared_level}</Text>
        </View>
        <Chip
          label={STATUS_LABELS[request.status]}
          variant={request.status === "pending" ? "orange" : "navy-subtle"}
        />
      </View>

      {request.status === "rejected" && request.rejection_reason ? (
        <Text className="text-xs text-xporadia-text-secondary">Motif : {request.rejection_reason}</Text>
      ) : null}

      {request.status === "pending" && (
        <>
          {placing ? (
            <View className="gap-2">
              <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
                Approuver et placer dans
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {(classes ?? []).map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => mutation.mutate({ approve: true, class_id: c.id })}
                    disabled={mutation.isPending}
                  >
                    <Chip label={`${c.name} (${c.school_year})`} variant="neutral" />
                  </Pressable>
                ))}
              </View>
              <Text
                className="text-xs text-xporadia-text-secondary"
                onPress={() => setPlacing(false)}
                suppressHighlighting
              >
                Annuler
              </Text>
            </View>
          ) : rejecting ? (
            <View className="gap-2">
              <Input
                label="Motif du rejet (optionnel)"
                value={reason}
                onChangeText={setReason}
                placeholder="Ex. effectif complet"
              />
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button label="Annuler" variant="secondary" pill onPress={() => setRejecting(false)} />
                </View>
                <View className="flex-1">
                  <Button
                    label="Confirmer le rejet"
                    pill
                    loading={mutation.isPending}
                    onPress={() => mutation.mutate({ approve: false, rejection_reason: reason })}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button label="Rejeter" variant="secondary" pill onPress={() => setRejecting(true)} />
              </View>
              <View className="flex-1">
                <Button label="Approuver et placer" pill onPress={() => setPlacing(true)} />
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

export default function JoinRequestsScreen() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ["director-join-requests"],
    queryFn: gradingApi.fetchDirectorJoinRequests,
  });

  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const history = (requests ?? []).filter((r) => r.status !== "pending");

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Demandes de rattachement</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Des élèves demandent à rejoindre votre établissement.
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : pending.length > 0 ? (
        <View className="gap-3">
          {pending.map((r) => (
            <JoinRequestCard key={r.id} request={r} />
          ))}
        </View>
      ) : (
        <View className="items-center gap-2 py-8">
          <GraduationCapIcon size={22} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Aucune demande en attente.</Text>
        </View>
      )}

      {history.length > 0 && (
        <View className="gap-3 mt-2">
          <Text className="text-base font-bold text-xporadia-navy">Historique</Text>
          {history.map((r) => (
            <JoinRequestCard key={r.id} request={r} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
