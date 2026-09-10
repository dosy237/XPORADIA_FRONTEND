import { useMutation, useQuery } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { CheckCircleIcon, UploadIcon, WarningIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as gradingApi from "@/services/grading";
import type { AdmissionReportProposal } from "@/services/grading";

type LineDecision = { approve: boolean; classId: number | null; included: boolean };

function MatchedLineRow({
  proposal,
  decision,
  onChange,
}: {
  proposal: AdmissionReportProposal;
  decision: LineDecision;
  onChange: (decision: LineDecision) => void;
}) {
  const { data: classes } = useQuery({
    queryKey: ["classes-for-join-requests"],
    queryFn: gradingApi.fetchClassesForJoinRequestPlacement,
    enabled: decision.approve,
  });

  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft gap-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-xporadia-text-primary">
            {proposal.matched_child_name}
          </Text>
          <Text className="text-[11px] text-xporadia-text-secondary">
            Ligne du rapport : &quot;{proposal.extracted_name}&quot; · confiance {Math.round(proposal.match_score * 100)}%
          </Text>
        </View>
        <Pressable onPress={() => onChange({ ...decision, included: !decision.included })}>
          <Chip label={decision.included ? "Inclus" : "Ignoré"} variant={decision.included ? "navy" : "neutral"} />
        </Pressable>
      </View>

      {decision.included && (
        <>
          <View className="flex-row gap-2">
            <Pressable onPress={() => onChange({ ...decision, approve: true })}>
              <Chip label="Admis" variant={decision.approve ? "navy" : "neutral"} />
            </Pressable>
            <Pressable onPress={() => onChange({ ...decision, approve: false })}>
              <Chip label="Rejeté" variant={!decision.approve ? "orange" : "neutral"} />
            </Pressable>
          </View>

          {decision.approve && (
            <View className="gap-1">
              <Text className="text-[11px] font-semibold text-xporadia-text-secondary uppercase">
                Classe (optionnel)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {(classes ?? []).map((c) => (
                  <Pressable key={c.id} onPress={() => onChange({ ...decision, classId: c.id })}>
                    <Chip label={c.name} variant={decision.classId === c.id ? "navy-subtle" : "neutral"} />
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

export default function AdmissionReportScreen() {
  const [proposals, setProposals] = useState<AdmissionReportProposal[] | null>(null);
  const [decisions, setDecisions] = useState<Record<number, LineDecision>>({});
  const [result, setResult] = useState<{ processed: number; failed: number } | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: { uri: string; name: string; mimeType?: string | null }) =>
      gradingApi.parseAdmissionReport(file),
    onSuccess: (data) => {
      setProposals(data.proposals);
      const initial: Record<number, LineDecision> = {};
      data.proposals.forEach((p) => {
        if (p.matched_join_request_id) {
          initial[p.matched_join_request_id] = {
            approve: p.extracted_status !== "rejected",
            classId: null,
            included: true,
          };
        }
      });
      setDecisions(initial);
    },
    onError: () => Alert.alert("Erreur", "Impossible de lire ce fichier. Formats acceptés : .csv ou .pdf."),
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      gradingApi.confirmAdmissionReport(
        Object.entries(decisions)
          .filter(([, d]) => d.included)
          .map(([joinRequestId, d]) => ({
            join_request_id: Number(joinRequestId),
            approve: d.approve,
            class_id: d.classId ?? undefined,
          }))
      ),
    onSuccess: (data) => setResult({ processed: data.processed, failed: data.failed }),
    onError: () => Alert.alert("Erreur", "Impossible d'appliquer les décisions."),
  });

  const pickFile = async () => {
    const doc = await DocumentPicker.getDocumentAsync({
      type: ["text/csv", "application/pdf", "text/comma-separated-values"],
    });
    if (doc.canceled || !doc.assets?.[0]) return;
    uploadMutation.mutate(doc.assets[0]);
  };

  const matched = (proposals ?? []).filter((p) => p.matched_join_request_id);
  const unmatched = (proposals ?? []).filter((p) => !p.matched_join_request_id);
  const includedCount = Object.values(decisions).filter((d) => d.included).length;

  if (result) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-8 gap-4">
        <View className="h-16 w-16 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
          <CheckCircleIcon size={28} color={Colors.navy} />
        </View>
        <Text className="text-lg font-bold text-xporadia-navy text-center">Rapport appliqué</Text>
        <Text className="text-sm text-xporadia-text-secondary text-center">
          {result.processed} décision(s) appliquée(s)
          {result.failed > 0 ? `, ${result.failed} échec(s).` : "."}
        </Text>
        <Button label="Voir les demandes de rattachement" pill onPress={() => router.replace("/(app)/director/join-requests")} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-2xl font-bold text-xporadia-navy">Rapport d&apos;admission</Text>
        <Text className="text-sm text-xporadia-text-secondary leading-5">
          Déposez la liste des résultats de concours (CSV ou PDF) : Xporadia propose un
          rapprochement avec vos demandes en attente, à vous de valider avant application.
        </Text>
      </View>

      {!proposals ? (
        <Pressable
          onPress={pickFile}
          accessibilityRole="button"
          accessibilityLabel="Déposer un rapport d'admission"
          className="bg-white rounded-2xl p-8 shadow-soft items-center gap-3 border-2 border-dashed border-xporadia-border"
        >
          <UploadIcon size={28} color={Colors.navy} />
          <Text className="text-sm font-semibold text-xporadia-text-primary">
            {uploadMutation.isPending ? "Lecture en cours..." : "Choisir un fichier .csv ou .pdf"}
          </Text>
        </Pressable>
      ) : (
        <>
          {matched.length > 0 ? (
            <View className="gap-3">
              <Text className="text-base font-bold text-xporadia-navy">
                Rapprochements proposés ({matched.length})
              </Text>
              {matched.map((p) => (
                <MatchedLineRow
                  key={p.matched_join_request_id}
                  proposal={p}
                  decision={
                    decisions[p.matched_join_request_id!] ?? { approve: true, classId: null, included: true }
                  }
                  onChange={(d) =>
                    setDecisions((prev) => ({ ...prev, [p.matched_join_request_id!]: d }))
                  }
                />
              ))}
              <Button
                label={`Appliquer pour ${includedCount} élève(s)`}
                pill
                disabled={includedCount === 0 || confirmMutation.isPending}
                loading={confirmMutation.isPending}
                onPress={() =>
                  Alert.alert("Confirmer", `Appliquer les décisions pour ${includedCount} élève(s) ?`, [
                    { text: "Annuler", style: "cancel" },
                    { text: "Confirmer", onPress: () => confirmMutation.mutate() },
                  ])
                }
              />
            </View>
          ) : (
            <View className="items-center gap-2 py-6">
              <WarningIcon size={22} color={Colors.orange} />
              <Text className="text-xs text-xporadia-text-secondary text-center">
                Aucune ligne du rapport n&apos;a pu être rapprochée d&apos;une demande en attente.
              </Text>
            </View>
          )}

          {unmatched.length > 0 && (
            <View className="gap-2">
              <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
                Non rapprochées ({unmatched.length})
              </Text>
              {unmatched.map((p, i) => (
                <Text key={i} className="text-xs text-xporadia-text-secondary">
                  &quot;{p.extracted_name}&quot;, aucune demande en attente ne correspond
                </Text>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
