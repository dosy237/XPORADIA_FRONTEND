import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { WarningIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as disputesApi from "@/services/disputes";
import type { Dispute } from "@/services/disputes";

const STATUS_LABELS: Record<string, string> = {
  open: "Ouvert",
  reviewed: "En révision",
  resolved: "Résolu",
  closed: "Clôturé",
};

function DisputeCard({ dispute }: { dispute: Dispute }) {
  const queryClient = useQueryClient();
  const [resolving, setResolving] = useState(false);
  const [resolution, setResolution] = useState("");

  const mutation = useMutation({
    mutationFn: (status: "resolved" | "closed") => disputesApi.resolveDispute(dispute.id, { status, resolution }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
  });

  const isOpen = dispute.status === "open" || dispute.status === "reviewed";

  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-xporadia-text-primary">{dispute.opened_by_name}</Text>
        <Chip label={STATUS_LABELS[dispute.status]} variant={isOpen ? "orange" : "navy-subtle"} />
      </View>
      <Text className="text-xs text-xporadia-text-secondary">
        {dispute.payment_amount.toLocaleString("fr-FR")} FCFA · {dispute.payment_type}
      </Text>
      <Text className="text-sm text-xporadia-text-primary">{dispute.reason}</Text>

      {dispute.resolution ? (
        <View className="bg-xporadia-navy/[0.06] rounded-xl p-3 mt-1">
          <Text className="text-xs font-semibold text-xporadia-navy mb-1">Résolution</Text>
          <Text className="text-sm text-xporadia-text-primary">{dispute.resolution}</Text>
        </View>
      ) : isOpen ? (
        resolving ? (
          <View className="gap-2 mt-1">
            <Input
              label="Résolution"
              value={resolution}
              onChangeText={setResolution}
              placeholder="Ex. vérifié, montant correct"
              multiline
              numberOfLines={2}
            />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button
                  label="Clôturer sans suite"
                  variant="secondary"
                  pill
                  loading={mutation.isPending}
                  onPress={() => mutation.mutate("closed")}
                />
              </View>
              <View className="flex-1">
                <Button
                  label="Marquer résolu"
                  pill
                  disabled={!resolution.trim()}
                  loading={mutation.isPending}
                  onPress={() => mutation.mutate("resolved")}
                />
              </View>
            </View>
          </View>
        ) : (
          <Text
            className="text-xs font-semibold text-xporadia-orange-text mt-1"
            onPress={() => setResolving(true)}
            suppressHighlighting
          >
            Traiter ce litige
          </Text>
        )
      ) : null}
    </View>
  );
}

export default function DisputesScreen() {
  const { data: disputes, isLoading } = useQuery({
    queryKey: ["admin-disputes"],
    queryFn: () => disputesApi.fetchAdminDisputes(),
  });

  const open = (disputes ?? []).filter((d) => d.status === "open" || d.status === "reviewed");
  const closed = (disputes ?? []).filter((d) => d.status === "resolved" || d.status === "closed");

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Litiges de paiement</Text>
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : open.length === 0 && closed.length === 0 ? (
        <View className="items-center gap-2 py-10">
          <WarningIcon size={24} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Aucun litige pour l&apos;instant.</Text>
        </View>
      ) : (
        <>
          {open.length > 0 && (
            <View className="gap-3">
              {open.map((d) => (
                <DisputeCard key={d.id} dispute={d} />
              ))}
            </View>
          )}
          {closed.length > 0 && (
            <View className="gap-3 mt-2">
              <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">Traités</Text>
              {closed.map((d) => (
                <DisputeCard key={d.id} dispute={d} />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
