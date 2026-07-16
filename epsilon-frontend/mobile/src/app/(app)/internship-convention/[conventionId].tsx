import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import * as internshipsApi from "@/services/internships";
import type { InternshipConvention, InternshipJournalEntry } from "@/services/internships";
import { useAuthStore } from "@/store/authStore";

const STATUS_LABELS: Record<string, string> = {
  generated: "Générée",
  signed_sch: "Signée école",
  signed_ent: "Signée entreprise",
  complete: "Complète",
};

export default function ConventionDetailScreen() {
  const { conventionId } = useLocalSearchParams<{ conventionId: string }>();
  const user = useAuthStore((s) => s.user);
  const isCompany = user?.all_roles?.includes("company") ?? false;
  const queryClient = useQueryClient();

  const [journalDate, setJournalDate] = useState("");
  const [journalContent, setJournalContent] = useState("");
  const [evalPunctuality, setEvalPunctuality] = useState("");
  const [evalInitiative, setEvalInitiative] = useState("");
  const [evalIntegration, setEvalIntegration] = useState("");
  const [evalSkills, setEvalSkills] = useState("");
  const [evalGlobal, setEvalGlobal] = useState("");
  const [evalComment, setEvalComment] = useState("");

  const { data: conventions } = useQuery({
    queryKey: ["my-internship-conventions"],
    queryFn: internshipsApi.fetchMyConventions,
  });
  const convention = conventions?.find((c) => c.id === conventionId);

  const journalQueryKey = ["convention-journal", conventionId];
  const { data: journal } = useQuery({
    queryKey: journalQueryKey,
    queryFn: () => internshipsApi.fetchConventionJournal(String(conventionId)),
    enabled: !!conventionId,
  });

  const evaluationsQueryKey = ["convention-evaluations", conventionId];
  const { data: evaluations } = useQuery({
    queryKey: evaluationsQueryKey,
    queryFn: () => internshipsApi.fetchConventionEvaluations(String(conventionId)),
    enabled: !!conventionId,
  });

  const signMutation = useMutation({
    mutationFn: () => internshipsApi.signConvention(String(conventionId)),
    onSuccess: (updated) => {
      queryClient.setQueryData<InternshipConvention[] | undefined>(["my-internship-conventions"], (prev) =>
        prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev
      );
    },
    onError: () => Alert.alert("Erreur", "Impossible de signer cette convention."),
  });

  const journalMutation = useMutation({
    mutationFn: () => internshipsApi.createJournalEntry(String(conventionId), journalDate, journalContent),
    onSuccess: (entry) => {
      queryClient.setQueryData<InternshipJournalEntry[] | undefined>(journalQueryKey, (prev) =>
        prev ? [...prev, entry] : [entry]
      );
      setJournalDate("");
      setJournalContent("");
    },
    onError: () => Alert.alert("Erreur", "Impossible d'ajouter cette entrée de journal."),
  });

  const evaluationMutation = useMutation({
    mutationFn: () =>
      internshipsApi.createEvaluation(String(conventionId), {
        punctuality: Number(evalPunctuality),
        initiative: Number(evalInitiative),
        integration: Number(evalIntegration),
        skills: Number(evalSkills),
        global_rating: Number(evalGlobal),
        comment: evalComment,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationsQueryKey });
      setEvalPunctuality("");
      setEvalInitiative("");
      setEvalIntegration("");
      setEvalSkills("");
      setEvalGlobal("");
      setEvalComment("");
    },
    onError: () => Alert.alert("Erreur", "Impossible d'enregistrer cette évaluation."),
  });

  if (!convention) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  const hasEvaluation = (evaluations ?? []).length > 0;

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-xporadia-text-primary">
            {convention.application.student.first_name}
          </Text>
          <Chip label={STATUS_LABELS[convention.status] ?? convention.status} variant="navy-subtle" />
        </View>
        <Text className="text-xs text-xporadia-text-secondary">
          {convention.application.offer.title} · {convention.application.offer.company.company_name} ·{" "}
          {convention.application.school.school_name}
        </Text>
        {convention.status !== "complete" && (
          <Button
            label="Signer la convention"
            pill
            loading={signMutation.isPending}
            onPress={() => signMutation.mutate()}
          />
        )}
      </View>

      <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-3">
        <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
          Journal de stage
        </Text>
        {(journal ?? []).length === 0 ? (
          <Text className="text-xs text-xporadia-text-secondary">Aucune entrée pour l&apos;instant.</Text>
        ) : (
          (journal ?? []).map((entry) => (
            <View key={entry.id} className="border-b border-xporadia-border pb-2 gap-1">
              <Text className="text-xs font-semibold text-xporadia-text-primary">{entry.date}</Text>
              <Text className="text-xs text-xporadia-text-secondary">{entry.content}</Text>
            </View>
          ))
        )}

        {isCompany && (
          <View className="gap-2 mt-1">
            <Input
              label="Date (AAAA-MM-JJ)"
              value={journalDate}
              onChangeText={setJournalDate}
              placeholder="2026-02-01"
            />
            <Input
              label="Notes du jour"
              value={journalContent}
              onChangeText={setJournalContent}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: "top" }}
            />
            <Button
              label="Ajouter au journal"
              pill
              disabled={!journalDate || !journalContent}
              loading={journalMutation.isPending}
              onPress={() => journalMutation.mutate()}
            />
          </View>
        )}
      </View>

      <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-3">
        <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
          Évaluation de fin de stage
        </Text>
        {(evaluations ?? []).map((evaluation) => (
          <View key={evaluation.id} className="gap-1">
            <Text className="text-sm font-semibold text-xporadia-text-primary">
              Note globale : {evaluation.global_rating}/5
            </Text>
            {evaluation.comment ? (
              <Text className="text-xs text-xporadia-text-secondary">{evaluation.comment}</Text>
            ) : null}
          </View>
        ))}

        {isCompany && !hasEvaluation && (
          <View className="gap-2">
            <Input
              label="Ponctualité (1-5)"
              value={evalPunctuality}
              onChangeText={setEvalPunctuality}
              keyboardType="numeric"
            />
            <Input
              label="Initiative (1-5)"
              value={evalInitiative}
              onChangeText={setEvalInitiative}
              keyboardType="numeric"
            />
            <Input
              label="Intégration (1-5)"
              value={evalIntegration}
              onChangeText={setEvalIntegration}
              keyboardType="numeric"
            />
            <Input
              label="Compétences (1-5)"
              value={evalSkills}
              onChangeText={setEvalSkills}
              keyboardType="numeric"
            />
            <Input
              label="Note globale (1-5)"
              value={evalGlobal}
              onChangeText={setEvalGlobal}
              keyboardType="numeric"
            />
            <Input label="Commentaire" value={evalComment} onChangeText={setEvalComment} multiline />
            <Button
              label="Enregistrer l'évaluation"
              pill
              disabled={!evalPunctuality || !evalInitiative || !evalIntegration || !evalSkills || !evalGlobal}
              loading={evaluationMutation.isPending}
              onPress={() => evaluationMutation.mutate()}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
