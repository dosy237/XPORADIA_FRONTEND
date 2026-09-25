import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { CheckCircleIcon, ClockIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as tuitionApi from "@/services/tuition";
import type { InstallmentStatusEntry, InstallmentStatusValue, PaymentChannel } from "@/services/tuition";

const STATUS_LABELS: Record<InstallmentStatusValue, string> = {
  paid: "Payée",
  partial: "Partielle",
  late: "En retard",
  pending: "À venir",
};

const STATUS_COLORS: Record<InstallmentStatusValue, { bg: string; text: string }> = {
  paid: { bg: "bg-xporadia-green/15", text: "text-xporadia-green" },
  partial: { bg: "bg-xporadia-gold/15", text: "text-xporadia-gold" },
  late: { bg: "bg-xporadia-red/10", text: "text-xporadia-red" },
  pending: { bg: "bg-xporadia-border/60", text: "text-xporadia-text-secondary" },
};

const CHANNEL_LABELS: Record<PaymentChannel, string> = {
  cash: "Espèces",
  mobile_money: "Mobile Money",
  bank_transfer: "Virement",
  other: "Autre",
};

function InstallmentCard({
  entry,
  childId,
}: {
  entry: InstallmentStatusEntry;
  childId: number;
}) {
  const queryClient = useQueryClient();
  const [recording, setRecording] = useState(false);
  const [amount, setAmount] = useState("");
  const [channel, setChannel] = useState<PaymentChannel>("cash");
  const colors = STATUS_COLORS[entry.status];

  const payMutation = useMutation({
    mutationFn: () =>
      tuitionApi.recordFeePayment(childId, entry.installment.id, {
        amount_paid: Number(amount),
        payment_channel: channel,
      }),
    onSuccess: () => {
      setAmount("");
      setRecording(false);
      queryClient.invalidateQueries({ queryKey: ["child-fee-status", childId] });
    },
    onError: () => Alert.alert("Erreur", "Montant invalide."),
  });

  return (
    <Card className="gap-2">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-sm font-semibold text-xporadia-text-primary flex-1">
          {entry.installment.name}
        </Text>
        <View className={`rounded-full px-2.5 py-1 ${colors.bg}`}>
          <Text className={`text-[10px] font-bold uppercase ${colors.text}`}>
            {STATUS_LABELS[entry.status]}
          </Text>
        </View>
      </View>
      <Text className="text-xs text-xporadia-text-secondary">
        {entry.amount_paid.toLocaleString("fr-FR")} / {entry.installment.amount.toLocaleString("fr-FR")} FCFA
        {entry.amount_due > 0 ? ` · reste ${entry.amount_due.toLocaleString("fr-FR")} FCFA` : ""}
      </Text>

      {recording ? (
        <View className="gap-2 mt-1">
          <Input
            label="Montant reçu (FCFA)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            placeholder={String(entry.amount_due)}
          />
          <View className="flex-row flex-wrap gap-2">
            {(Object.keys(CHANNEL_LABELS) as PaymentChannel[]).map((key) => (
              <Chip
                key={key}
                label={CHANNEL_LABELS[key]}
                variant={channel === key ? "navy" : "neutral"}
                onPress={() => setChannel(key)}
              />
            ))}
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button label="Annuler" variant="secondary" pill onPress={() => setRecording(false)} />
            </View>
            <View className="flex-1">
              <Button
                label="Enregistrer"
                pill
                disabled={!amount}
                loading={payMutation.isPending}
                onPress={() => payMutation.mutate()}
              />
            </View>
          </View>
        </View>
      ) : entry.status !== "paid" ? (
        <Button label="Enregistrer un paiement" variant="secondary" pill onPress={() => setRecording(true)} />
      ) : null}
    </Card>
  );
}

export default function ChildFeeStatusScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["child-fee-status", Number(childId)],
    queryFn: () => tuitionApi.fetchChildFeeStatus(Number(childId)),
    enabled: !!childId,
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-3 pb-12">
      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-6">Chargement...</Text>
      ) : !data?.schedule ? (
        <Card>
          <Text className="text-sm text-xporadia-text-secondary text-center py-4">
            Aucun échéancier de frais de scolarité configuré pour la classe de cet élève.
          </Text>
        </Card>
      ) : (
        <>
          <Text className="text-xs text-xporadia-text-secondary">
            Échéancier {data.schedule.school_year}
          </Text>
          {data.installments.map((entry) => (
            <InstallmentCard key={entry.installment.id} entry={entry} childId={Number(childId)} />
          ))}

          {data.payments.length > 0 ? (
            <Card className="gap-2">
              <View className="flex-row items-center gap-2">
                <CheckCircleIcon size={14} color={Colors.green} />
                <Text className="text-sm font-semibold text-xporadia-text-primary">Historique des versements</Text>
              </View>
              {data.payments.map((payment) => (
                <View key={payment.id} className="flex-row items-center gap-2">
                  <ClockIcon size={12} color={Colors.textSecondary} />
                  <Text className="text-xs text-xporadia-text-secondary flex-1">
                    {payment.amount_paid.toLocaleString("fr-FR")} FCFA · {CHANNEL_LABELS[payment.payment_channel]} ·{" "}
                    {new Date(payment.paid_at).toLocaleDateString("fr-FR")} · {payment.recorded_by_name}
                  </Text>
                </View>
              ))}
            </Card>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
