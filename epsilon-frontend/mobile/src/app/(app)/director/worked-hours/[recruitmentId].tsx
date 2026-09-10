import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { ClockIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as employmentApi from "@/services/employment";
import type { WorkedHours } from "@/services/employment";

function PendingHoursCard({ entry, onReviewed }: { entry: WorkedHours; onReviewed: () => void }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: (payload: { approve: boolean; rejection_reason?: string }) =>
      employmentApi.reviewWorkedHours(entry.id, payload),
    onSuccess: onReviewed,
  });

  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-xporadia-text-primary">
          {new Date(entry.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </Text>
        <Chip label={`${entry.hours}h`} variant="orange" />
      </View>
      {entry.note ? <Text className="text-xs text-xporadia-text-secondary">{entry.note}</Text> : null}

      {rejecting ? (
        <View className="gap-2 mt-1">
          <Input label="Motif du rejet" value={reason} onChangeText={setReason} placeholder="Ex. horaire incohérent" />
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
        <View className="flex-row gap-2 mt-1">
          <View className="flex-1">
            <Button label="Rejeter" variant="secondary" pill onPress={() => setRejecting(true)} />
          </View>
          <View className="flex-1">
            <Button
              label="Valider"
              pill
              loading={mutation.isPending}
              onPress={() => mutation.mutate({ approve: true })}
            />
          </View>
        </View>
      )}
    </View>
  );
}

export default function ReviewWorkedHoursScreen() {
  const { recruitmentId } = useLocalSearchParams<{ recruitmentId: string }>();
  const queryClient = useQueryClient();

  const queryKey = ["worked-hours", recruitmentId];
  const { data: entries, isLoading } = useQuery({
    queryKey,
    queryFn: () => employmentApi.fetchWorkedHours(recruitmentId),
    enabled: !!recruitmentId,
  });

  const pending = (entries ?? []).filter((e) => e.status === "pending");
  const history = (entries ?? []).filter((e) => e.status !== "pending");

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-base font-bold text-xporadia-navy">En attente de validation</Text>
        <Text className="text-xs text-xporadia-text-secondary">
          Seules les heures validées entreront dans la paie de fin de mois.
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : pending.length > 0 ? (
        <View className="gap-3">
          {pending.map((entry) => (
            <PendingHoursCard
              key={entry.id}
              entry={entry}
              onReviewed={() => queryClient.invalidateQueries({ queryKey })}
            />
          ))}
        </View>
      ) : (
        <View className="items-center gap-2 py-6">
          <ClockIcon size={22} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Rien en attente pour l&apos;instant.</Text>
        </View>
      )}

      {history.length > 0 ? (
        <View className="gap-3 mt-2">
          <Text className="text-base font-bold text-xporadia-navy">Historique</Text>
          {history.map((entry) => (
            <View key={entry.id} className="bg-white rounded-2xl p-4 shadow-soft flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-xporadia-text-primary">
                  {new Date(entry.date).toLocaleDateString("fr-FR")}
                </Text>
                {entry.status === "rejected" && entry.rejection_reason ? (
                  <Text className="text-xs text-xporadia-red">{entry.rejection_reason}</Text>
                ) : null}
              </View>
              <Chip
                label={entry.status === "approved" ? `Validée · ${entry.hours}h` : "Rejetée"}
                variant={entry.status === "approved" ? "navy-subtle" : "neutral"}
              />
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
