import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { ClockIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as employmentApi from "@/services/employment";
import type { WorkedHoursStatus } from "@/services/employment";

const STATUS_LABELS: Record<WorkedHoursStatus, string> = {
  pending: "En attente",
  approved: "Validée",
  rejected: "Rejetée",
};

const STATUS_VARIANTS: Record<WorkedHoursStatus, "neutral" | "navy" | "orange"> = {
  pending: "neutral",
  approved: "navy",
  rejected: "orange",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function RecruitmentDetailScreen() {
  const { recruitmentId } = useLocalSearchParams<{ recruitmentId: string }>();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayISO());
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");

  const { data: entries, isLoading } = useQuery({
    queryKey: ["worked-hours", recruitmentId],
    queryFn: () => employmentApi.fetchWorkedHours(recruitmentId),
    enabled: !!recruitmentId,
  });

  const declareMutation = useMutation({
    mutationFn: () =>
      employmentApi.declareWorkedHours(recruitmentId, { date, hours: Number(hours), note: note.trim() || undefined }),
    onSuccess: () => {
      setHours("");
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["worked-hours", recruitmentId] });
    },
  });

  const monthTotal = (entries ?? [])
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => sum + Number(e.hours), 0);

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <Card className="items-center py-5 gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">{`${monthTotal}h`}</Text>
        <Text className="text-xs text-xporadia-text-secondary">Heures validées, tous mois confondus</Text>
      </Card>

      <Card className="gap-3">
        <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
          Déclarer une journée
        </Text>
        <Input label="Date" value={date} onChangeText={setDate} placeholder="AAAA-MM-JJ" />
        <Input label="Heures travaillées" value={hours} onChangeText={setHours} keyboardType="numeric" placeholder="Ex. 4" />
        <Input label="Note (optionnel)" value={note} onChangeText={setNote} placeholder="Ex. Cours de 3e, remplacement..." />
        {declareMutation.error ? (
          <Text className="text-xs text-xporadia-red">
            Une déclaration existe peut-être déjà pour cette date.
          </Text>
        ) : null}
        <Button
          label="Déclarer"
          pill
          onPress={() => declareMutation.mutate()}
          loading={declareMutation.isPending}
          disabled={!date || !hours}
        />
      </Card>

      <View className="gap-3">
        <Text className="text-base font-bold text-xporadia-navy">Historique</Text>
        {isLoading ? (
          <Text className="text-xporadia-text-secondary text-center py-8">Chargement...</Text>
        ) : entries && entries.length > 0 ? (
          entries.map((entry) => (
            <Card key={entry.id} variant="flat" className="flex-row items-center gap-3 bg-white">
              <View className="h-9 w-9 rounded-full bg-xporadia-bg items-center justify-center">
                <ClockIcon size={16} color={Colors.navy} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-xporadia-text-primary">
                  {`${new Date(entry.date).toLocaleDateString("fr-FR")} — ${entry.hours}h`}
                </Text>
                {entry.note ? <Text className="text-xs text-xporadia-text-secondary">{entry.note}</Text> : null}
                {entry.status === "rejected" && entry.rejection_reason ? (
                  <Text className="text-xs text-xporadia-red">{entry.rejection_reason}</Text>
                ) : null}
              </View>
              <Chip label={STATUS_LABELS[entry.status]} variant={STATUS_VARIANTS[entry.status]} />
            </Card>
          ))
        ) : (
          <Text className="text-xs text-xporadia-text-secondary text-center py-6">
            Aucune heure déclarée pour l'instant.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
