import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { CheckCircleIcon, UsersIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";
import type { BatchTransitionEntry, Enrollment } from "@/services/academics";

type Decision = "promoted" | "repeating" | "withdrawn";

const DECISION_LABELS: Record<Decision, string> = {
  promoted: "Passe",
  repeating: "Redouble",
  withdrawn: "Part",
};

function StudentDecisionRow({
  enrollment,
  decision,
  onChange,
}: {
  enrollment: Enrollment;
  decision: Decision;
  onChange: (decision: Decision) => void;
}) {
  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft gap-2">
      <Text className="text-sm font-semibold text-xporadia-text-primary">
        {enrollment.child.first_name}
      </Text>
      <View className="flex-row gap-2">
        {(Object.keys(DECISION_LABELS) as Decision[]).map((option) => (
          <Pressable key={option} onPress={() => onChange(option)}>
            <Chip label={DECISION_LABELS[option]} variant={decision === option ? "navy" : "neutral"} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function YearEndPromotionScreen() {
  const { classId, className } = useLocalSearchParams<{ classId: string; className?: string }>();
  const [defaultTargetClassId, setDefaultTargetClassId] = useState<number | null>(null);
  const [decisions, setDecisions] = useState<Record<number, Decision>>({});
  const [result, setResult] = useState<{ processed: number; failed: number } | null>(null);

  const { data: roster, isLoading } = useQuery({
    queryKey: ["class-roster", classId],
    queryFn: () => academicsApi.fetchClassRoster(Number(classId)),
    enabled: !!classId,
  });

  const { data: allClasses } = useQuery({
    queryKey: ["all-my-classes"],
    queryFn: academicsApi.fetchAllMyClasses,
  });
  const otherClasses = (allClasses ?? []).filter((c) => c.id !== Number(classId));

  const getDecision = (childId: number): Decision => decisions[childId] ?? "promoted";

  const mutation = useMutation({
    mutationFn: () => {
      const entries: BatchTransitionEntry[] = (roster ?? []).map((e) => ({
        child_id: e.child.id,
        status: getDecision(e.child.id),
      }));
      return academicsApi.batchTransitionRoster(Number(classId), {
        default_target_class_id: defaultTargetClassId ?? undefined,
        entries,
      });
    },
    onSuccess: (data) => setResult({ processed: data.processed, failed: data.failed }),
    onError: () => Alert.alert("Erreur", "Impossible de traiter le passage pour cette classe."),
  });

  if (result) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-8 gap-4">
        <View className="h-16 w-16 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
          <CheckCircleIcon size={28} color={Colors.navy} />
        </View>
        <Text className="text-lg font-bold text-xporadia-navy text-center">Passage traité</Text>
        <Text className="text-sm text-xporadia-text-secondary text-center">
          {result.processed} élève(s) traité(s)
          {result.failed > 0 ? `, ${result.failed} échec(s) — vérifiez le détail.` : "."}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Fin d&apos;année</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          {className ?? "Cette classe"} — décidez pour chaque élève, en un seul envoi.
        </Text>
      </View>

      <View className="bg-white rounded-2xl p-4 shadow-soft gap-2">
        <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
          Classe cible par défaut (pour ceux qui passent)
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {otherClasses.map((c) => (
            <Pressable key={c.id} onPress={() => setDefaultTargetClassId(c.id)}>
              <Chip
                label={`${c.name} (${c.school_year})`}
                variant={defaultTargetClassId === c.id ? "navy" : "neutral"}
              />
            </Pressable>
          ))}
        </View>
        {!defaultTargetClassId ? (
          <Text className="text-[11px] text-xporadia-red">
            Requis pour tout élève marqué &quot;Passe&quot; ou &quot;Redouble&quot;.
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
      ) : (roster ?? []).length === 0 ? (
        <View className="items-center gap-2 py-8">
          <UsersIcon size={22} color={Colors.textSecondary} />
          <Text className="text-xs text-xporadia-text-secondary">Aucun élève dans cette classe.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {(roster ?? []).map((enrollment) => (
            <StudentDecisionRow
              key={enrollment.id}
              enrollment={enrollment}
              decision={getDecision(enrollment.child.id)}
              onChange={(decision) =>
                setDecisions((prev) => ({ ...prev, [enrollment.child.id]: decision }))
              }
            />
          ))}
        </View>
      )}

      {(roster ?? []).length > 0 && (
        <Button
          label={`Valider pour ${(roster ?? []).length} élève(s)`}
          pill
          disabled={!defaultTargetClassId || mutation.isPending}
          loading={mutation.isPending}
          onPress={() =>
            Alert.alert(
              "Confirmer le passage",
              "Cette action met à jour la scolarité de toute la classe. Continuer ?",
              [
                { text: "Annuler", style: "cancel" },
                { text: "Confirmer", onPress: () => mutation.mutate() },
              ]
            )
          }
        />
      )}
    </ScrollView>
  );
}
