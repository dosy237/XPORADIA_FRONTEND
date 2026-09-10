import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CloseIcon, TrashIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/theme";
import * as tuitionApi from "@/services/tuition";
import type { FeeInstallment } from "@/services/tuition";

function InstallmentRow({ installment, onDelete }: { installment: FeeInstallment; onDelete: () => void }) {
  return (
    <View className="flex-row items-center gap-3 border-b border-xporadia-border py-3">
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-semibold text-xporadia-text-primary">{installment.name}</Text>
        <Text className="text-xs text-xporadia-text-secondary">
          {installment.amount.toLocaleString("fr-FR")} FCFA · échéance le{" "}
          {new Date(installment.due_date).toLocaleDateString("fr-FR")}
        </Text>
      </View>
      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={`Supprimer la tranche ${installment.name}`}
        hitSlop={8}
      >
        <TrashIcon size={16} color={Colors.red} />
      </Pressable>
    </View>
  );
}

export default function FeeScheduleConfigScreen() {
  const { schoolYear } = useLocalSearchParams<{ schoolYear: string }>();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  const scheduleQueryKey = ["fee-schedule", schoolYear];
  const { data: schedule, isLoading } = useQuery({
    queryKey: scheduleQueryKey,
    queryFn: () => tuitionApi.fetchFeeSchedule(schoolYear),
    enabled: !!schoolYear,
  });

  const createScheduleMutation = useMutation({
    mutationFn: () => tuitionApi.createFeeSchedule(schoolYear),
    onSuccess: (created) => queryClient.setQueryData(scheduleQueryKey, created),
  });

  useEffect(() => {
    if (!isLoading && schedule === null && !createScheduleMutation.isPending) {
      createScheduleMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, schedule]);

  const addInstallmentMutation = useMutation({
    mutationFn: () =>
      tuitionApi.createFeeInstallment(schedule!.id, {
        name: name.trim(),
        amount: Number(amount),
        due_date: dueDate,
      }),
    onSuccess: (installment) => {
      queryClient.setQueryData<tuitionApi.FeeSchedule | null | undefined>(scheduleQueryKey, (prev) =>
        prev ? { ...prev, installments: [...prev.installments, installment] } : prev
      );
      setName("");
      setAmount("");
      setDueDate("");
      setAdding(false);
    },
    onError: () => Alert.alert("Erreur", "Vérifiez les champs (date au format AAAA-MM-JJ)."),
  });

  const deleteInstallmentMutation = useMutation({
    mutationFn: (installmentId: number) => tuitionApi.deleteFeeInstallment(installmentId),
    onSuccess: (_data, installmentId) => {
      queryClient.setQueryData<tuitionApi.FeeSchedule | null | undefined>(scheduleQueryKey, (prev) =>
        prev ? { ...prev, installments: prev.installments.filter((i) => i.id !== installmentId) } : prev
      );
    },
  });

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Text className="text-xs text-xporadia-text-secondary leading-5">
        Tranches de l&apos;échéancier de frais de scolarité pour {schoolYear}.
      </Text>

      <Card>
        {isLoading || !schedule ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-4">Chargement...</Text>
        ) : schedule.installments.length === 0 ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-4">
            Aucune tranche pour l&apos;instant.
          </Text>
        ) : (
          schedule.installments.map((installment) => (
            <InstallmentRow
              key={installment.id}
              installment={installment}
              onDelete={() => deleteInstallmentMutation.mutate(installment.id)}
            />
          ))
        )}
      </Card>

      {adding ? (
        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-xporadia-text-primary">Nouvelle tranche</Text>
            <Pressable onPress={() => setAdding(false)} accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={8}>
              <CloseIcon size={14} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <Input label="Nom" value={name} onChangeText={setName} placeholder="Inscription" />
          <Input label="Montant (FCFA)" value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="50000" />
          <Input
            label="Date d'échéance"
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2025-09-01"
          />
          <Button
            label="Ajouter la tranche"
            pill
            disabled={!name.trim() || !amount || !dueDate}
            loading={addInstallmentMutation.isPending}
            onPress={() => addInstallmentMutation.mutate()}
          />
        </Card>
      ) : (
        <Button label="Ajouter une tranche" pill onPress={() => setAdding(true)} disabled={!schedule} />
      )}
    </ScrollView>
  );
}
