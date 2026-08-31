import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { CheckCircleIcon, MedalIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { ReportCardCard } from "@/components/grading/ReportCardCard";
import { Colors } from "@/constants/theme";
import * as gradingApi from "@/services/grading";
import type { ClassReportPreviewEntry, ReportCardDistinction, ReportCardSanction } from "@/services/grading";

export interface StudentReportDecisions {
  comment: string;
  distinction: ReportCardDistinction | ""; // "" = suggestion automatique du serveur, jamais forcée
  sanction: ReportCardSanction;
  justifiedAbsences: string;
  unjustifiedAbsences: string;
}

const EMPTY_DECISIONS: StudentReportDecisions = {
  comment: "", distinction: "", sanction: "none", justifiedAbsences: "", unjustifiedAbsences: "",
};

const DISTINCTION_OPTIONS: { value: ReportCardDistinction | ""; label: string }[] = [
  { value: "", label: "Auto" },
  { value: "none", label: "Aucune" },
  { value: "honor_roll", label: "Tableau d'honneur" },
  { value: "honor_roll_encouragement", label: "+ Encouragements" },
  { value: "honor_roll_congratulations", label: "+ Félicitations" },
  { value: "refused", label: "Refusé(e)" },
];

const SANCTION_OPTIONS: { value: ReportCardSanction; label: string }[] = [
  { value: "none", label: "Aucune" },
  { value: "work_warning", label: "Avert. travail" },
  { value: "work_reprimand", label: "Blâme travail" },
  { value: "conduct_warning", label: "Avert. conduite" },
  { value: "conduct_reprimand", label: "Blâme conduite" },
];

function StudentPreviewRow({
  entry,
  decisions,
  onChange,
}: {
  entry: ClassReportPreviewEntry;
  decisions: StudentReportDecisions;
  onChange: (decisions: StudentReportDecisions) => void;
}) {
  return (
    <View className="bg-white rounded-2xl p-4 shadow-soft gap-3">
      <View className="flex-row items-center gap-3">
        <Avatar firstName={entry.first_name} lastName={entry.last_name} imageUri={entry.avatar} size={38} />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-xporadia-text-primary">
            {entry.first_name} {entry.last_name}
          </Text>
          <Text className="text-xs text-xporadia-text-secondary">Rang {entry.rank}</Text>
        </View>
        <View className="flex-row items-baseline gap-0.5">
          <Text className="text-lg font-extrabold text-xporadia-navy">{entry.general_average}</Text>
          <Text className="text-[10px] font-semibold text-xporadia-text-secondary">/20</Text>
        </View>
      </View>
      <Input
        value={decisions.comment}
        onChangeText={(comment) => onChange({ ...decisions, comment })}
        placeholder="Appréciation générale du titulaire (optionnel)"
        multiline
        numberOfLines={2}
        style={{ height: 58, textAlignVertical: "top" }}
      />

      <View className="gap-1.5">
        <Text className="text-[10px] font-semibold text-xporadia-text-secondary uppercase">Distinction</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5">
          {DISTINCTION_OPTIONS.map((opt) => (
            <Chip
              key={opt.value || "auto"}
              label={opt.label}
              variant={decisions.distinction === opt.value ? "navy" : "neutral"}
              onPress={() => onChange({ ...decisions, distinction: opt.value })}
            />
          ))}
        </ScrollView>
      </View>

      <View className="gap-1.5">
        <Text className="text-[10px] font-semibold text-xporadia-text-secondary uppercase">Sanction</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5">
          {SANCTION_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              variant={decisions.sanction === opt.value ? "navy" : "neutral"}
              onPress={() => onChange({ ...decisions, sanction: opt.value })}
            />
          ))}
        </ScrollView>
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Input
            label="Absences just. (h)"
            value={decisions.justifiedAbsences}
            onChangeText={(justifiedAbsences) => onChange({ ...decisions, justifiedAbsences })}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
        <View className="flex-1">
          <Input
            label="Absences non just. (h)"
            value={decisions.unjustifiedAbsences}
            onChangeText={(unjustifiedAbsences) => onChange({ ...decisions, unjustifiedAbsences })}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
      </View>
    </View>
  );
}

/** Confirmation avant génération, avec récapitulatif — action irréversible
 * pour ce trimestre une fois publiée. Un vrai composant plutôt qu'Alert.alert
 * (no-op sur react-native-web, voir teacher/exercise-overview). */
function ConfirmGenerateSheet({
  visible,
  studentCount,
  classAverage,
  loading,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  studentCount: number;
  classAverage: string | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!visible) return null;
  return (
    <Pressable
      className="absolute inset-0 bg-black/30 items-center justify-center px-8"
      style={{ zIndex: 20 }}
      onPress={onCancel}
    >
      <Pressable onPress={(e) => e.stopPropagation()} className="bg-white rounded-3xl w-full p-5 gap-3" style={{ maxWidth: 380 }}>
        <Text className="text-base font-bold text-xporadia-navy">Générer et publier les bulletins ?</Text>
        <Text className="text-sm text-xporadia-text-secondary leading-5">
          {studentCount} élève{studentCount !== 1 ? "s" : ""} recevront leur bulletin de ce trimestre
          {classAverage ? `, moyenne de classe ${classAverage}/20` : ""}. Cette action est irréversible pour ce
          trimestre : les familles seront notifiées immédiatement.
        </Text>
        <View className="flex-row gap-3 mt-1">
          <View className="flex-1">
            <Button label="Annuler" variant="secondary" pill onPress={onCancel} />
          </View>
          <View className="flex-1">
            <Button label="Publier" pill loading={loading} onPress={onConfirm} />
          </View>
        </View>
      </Pressable>
    </Pressable>
  );
}

export default function TeacherReportCardsScreen() {
  const { classId: classIdParam } = useLocalSearchParams<{ classId: string }>();
  const classId = Number(classIdParam);

  const { data: terms } = useQuery({
    queryKey: ["class-terms", classId],
    queryFn: () => gradingApi.fetchClassTerms(classId),
    enabled: !!classId,
  });

  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  useEffect(() => {
    if (selectedTermId || !terms || terms.length === 0) return;
    const active = terms.find((t) => t.is_active);
    setSelectedTermId((active ?? terms[0]).id);
  }, [terms, selectedTermId]);

  const { data: preview, isLoading } = useQuery({
    queryKey: ["class-report-preview", classId, selectedTermId],
    queryFn: () => gradingApi.fetchClassReportPreview(classId, selectedTermId as number),
    enabled: !!classId && !!selectedTermId,
    // L'aperçu de génération est réservé au titulaire/directeur — un
    // enseignant dédié qui vient uniquement CONSULTER les bulletins déjà
    // publiés n'y a pas droit (403 attendu) : on n'affiche alors que la
    // section "Bulletins déjà publiés" ci-dessous, sans faire planter l'écran.
    retry: false,
  });

  const queryClient = useQueryClient();
  const { data: publishedReportCards, isLoading: isLoadingPublished } = useQuery({
    queryKey: ["class-report-cards", classId, selectedTermId],
    queryFn: () => gradingApi.fetchClassReportCards(classId, selectedTermId as number),
    enabled: !!classId && !!selectedTermId,
  });

  const [decisions, setDecisions] = useState<Record<number, StudentReportDecisions>>({});
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [published, setPublished] = useState<number | null>(null);

  const generateMutation = useMutation({
    mutationFn: () => {
      const homeroom_comments: Record<string, string> = {};
      const distinctions: Record<string, ReportCardDistinction> = {};
      const sanctions: Record<string, ReportCardSanction> = {};
      const absences: Record<string, { justified?: number; unjustified?: number }> = {};
      for (const [childId, d] of Object.entries(decisions)) {
        homeroom_comments[childId] = d.comment;
        if (d.distinction) distinctions[childId] = d.distinction;
        if (d.sanction !== "none") sanctions[childId] = d.sanction;
        const justified = d.justifiedAbsences ? Number(d.justifiedAbsences) : 0;
        const unjustified = d.unjustifiedAbsences ? Number(d.unjustifiedAbsences) : 0;
        if (justified || unjustified) absences[childId] = { justified, unjustified };
      }
      return gradingApi.generateReportCards(classId, selectedTermId as number, {
        homeroom_comments, distinctions, sanctions, absences,
      });
    },
    onSuccess: (created) => {
      setConfirmVisible(false);
      setPublished(created.length);
      queryClient.invalidateQueries({ queryKey: ["class-report-cards", classId, selectedTermId] });
    },
  });

  if (published !== null) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-8 gap-4">
        <View className="h-16 w-16 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
          <CheckCircleIcon size={28} color={Colors.navy} />
        </View>
        <Text className="text-lg font-bold text-xporadia-navy text-center">Bulletins publiés</Text>
        <Text className="text-sm text-xporadia-text-secondary text-center">
          {published} bulletin{published !== 1 ? "s" : ""} généré{published !== 1 ? "s" : ""} et
          publié{published !== 1 ? "s" : ""} pour ce trimestre. Élèves et parents peuvent les consulter dès
          maintenant.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-xporadia-bg">
      <Stack.Screen options={{ title: "Bulletins du trimestre" }} />
      <ScrollView className="flex-1" contentContainerClassName="p-6 gap-4 pb-32">
        <View className="gap-2">
          <Text className="text-2xl font-bold text-xporadia-navy">Bulletins du trimestre</Text>
          <Text className="text-sm text-xporadia-text-secondary">
            Aperçu en direct. Rien n'est encore écrit tant que vous n'avez pas publié.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 py-1">
            {(terms ?? []).map((term) => (
              <Chip
                key={term.id}
                label={term.name || `Trimestre ${term.number}`}
                variant={selectedTermId === term.id ? "navy" : "navy-subtle"}
                onPress={() => setSelectedTermId(term.id)}
              />
            ))}
          </ScrollView>
        </View>

        {preview ? (
          <View className="bg-white rounded-2xl p-4 shadow-soft flex-row items-center justify-between">
            <View className="items-center flex-1">
              <Text className="text-lg font-extrabold text-xporadia-navy">{preview.ranked.length}</Text>
              <Text className="text-[10px] text-xporadia-text-secondary text-center">Élèves avec moyenne</Text>
            </View>
            <View className="w-px h-9 bg-xporadia-border" />
            <View className="items-center flex-1">
              <Text className="text-lg font-extrabold text-xporadia-navy">
                {preview.class_average ? `${preview.class_average}/20` : "N/A"}
              </Text>
              <Text className="text-[10px] text-xporadia-text-secondary text-center">Moyenne de classe</Text>
            </View>
          </View>
        ) : null}

        {isLoading ? (
          <Text className="text-sm text-xporadia-text-secondary text-center py-8">Chargement...</Text>
        ) : preview && preview.ranked.length > 0 ? (
          <View className="gap-3">
            {preview.ranked.map((entry) => (
              <StudentPreviewRow
                key={entry.child}
                entry={entry}
                decisions={decisions[entry.child] ?? EMPTY_DECISIONS}
                onChange={(value) => setDecisions((prev) => ({ ...prev, [entry.child]: value }))}
              />
            ))}
          </View>
        ) : (
          <View className="items-center gap-2 py-10">
            <MedalIcon size={22} color={Colors.textSecondary} />
            <Text className="text-xs text-xporadia-text-secondary text-center">
              Aucun élève n'a encore de moyenne calculable pour ce trimestre.
            </Text>
          </View>
        )}

        {preview && preview.without_average.length > 0 ? (
          <View className="bg-white rounded-2xl p-4 shadow-soft gap-2">
            <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
              Sans aucune note pour l'instant
            </Text>
            {preview.without_average.map((c) => (
              <Text key={c.child} className="text-sm text-xporadia-text-primary">
                {c.first_name} {c.last_name}
              </Text>
            ))}
          </View>
        ) : null}

        <View className="gap-3 mt-2">
          <Text className="text-lg font-bold text-xporadia-navy">Bulletins déjà publiés</Text>
          {isLoadingPublished ? (
            <Text className="text-sm text-xporadia-text-secondary text-center py-4">Chargement...</Text>
          ) : publishedReportCards && publishedReportCards.length > 0 ? (
            publishedReportCards.map((reportCard) => (
              <View key={reportCard.id} className="gap-0.5 px-1">
                <Text className="text-sm font-semibold text-xporadia-text-primary">
                  {reportCard.child_first_name} {reportCard.child_last_name}
                </Text>
                {reportCard.updated_by_name ? (
                  <Text className="text-[10px] text-xporadia-text-secondary">
                    Publié par {reportCard.updated_by_name}, le{" "}
                    {new Date(reportCard.updated_at).toLocaleDateString("fr-FR")}
                  </Text>
                ) : null}
                <View className="mt-1">
                  <ReportCardCard reportCard={reportCard} />
                </View>
              </View>
            ))
          ) : (
            <Text className="text-xs text-xporadia-text-secondary text-center py-4">
              Aucun bulletin publié pour ce trimestre.
            </Text>
          )}
        </View>
      </ScrollView>

      {preview && preview.ranked.length > 0 ? (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-xporadia-bg border-t border-xporadia-border">
          <Button label="Générer et publier les bulletins" pill onPress={() => setConfirmVisible(true)} />
        </View>
      ) : null}

      <ConfirmGenerateSheet
        visible={confirmVisible}
        studentCount={preview?.ranked.length ?? 0}
        classAverage={preview?.class_average ?? null}
        loading={generateMutation.isPending}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => generateMutation.mutate()}
      />
    </View>
  );
}
