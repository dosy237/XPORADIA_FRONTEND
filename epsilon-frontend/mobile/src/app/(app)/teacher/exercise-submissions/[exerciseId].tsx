import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { MedalIcon, SearchIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as virtualClassesApi from "@/services/virtualClasses";
import type { Submission } from "@/services/virtualClasses";

type FilterTab = "all" | "to_grade" | "graded";

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <View className="items-center flex-1">
      <Text className="text-lg font-bold text-xporadia-navy">{value}</Text>
      <Text className="text-[10px] text-xporadia-text-secondary text-center">{label}</Text>
    </View>
  );
}

function SubmissionCard({ submission }: { submission: Submission }) {
  const queryClient = useQueryClient();
  const [grade, setGrade] = useState(submission.grade ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const isGraded = submission.status === "graded";

  const gradeMutation = useMutation({
    mutationFn: () =>
      virtualClassesApi.gradeSubmission(submission.id, { grade: Number(grade), feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercise-submissions", submission.exercise] });
      queryClient.invalidateQueries({ queryKey: ["exercise-submission-stats", submission.exercise] });
    },
  });

  return (
    <Card className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          {submission.child.first_name}
        </Text>
        <View className="flex-row gap-1.5">
          {submission.is_late ? <Chip label="En retard" variant="orange" /> : null}
          <Chip label={isGraded ? `Noté : ${submission.grade}/20` : "À corriger"} variant={isGraded ? "navy" : "orange"} />
        </View>
      </View>
      <Text className="text-[11px] text-xporadia-text-secondary">
        Rendu le {new Date(submission.submitted_at).toLocaleString("fr-FR")}
      </Text>
      <Text className="text-sm text-xporadia-text-primary">{submission.content}</Text>

      {isGraded ? (
        submission.feedback ? (
          <Text className="text-xs text-xporadia-text-secondary mt-1">
            Retour : {submission.feedback}
          </Text>
        ) : null
      ) : (
        <View className="gap-2 mt-1">
          <Input label="Note (/20)" value={String(grade)} onChangeText={setGrade} keyboardType="numeric" />
          <Input
            label="Retour"
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={2}
            style={{ height: 60, textAlignVertical: "top" }}
          />
          <Button
            label="Enregistrer la correction"
            pill
            disabled={grade === ""}
            loading={gradeMutation.isPending}
            onPress={() => gradeMutation.mutate()}
          />
        </View>
      )}
    </Card>
  );
}

export default function ExerciseSubmissionsScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState<"submitted_at" | "-submitted_at">("submitted_at");
  const [tab, setTab] = useState<FilterTab>("to_grade");

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["exercise-submissions", exerciseId, search, ordering],
    queryFn: () => virtualClassesApi.fetchExerciseSubmissions(exerciseId, { search, ordering }),
    enabled: !!exerciseId,
  });

  const { data: stats } = useQuery({
    queryKey: ["exercise-submission-stats", exerciseId],
    queryFn: () => virtualClassesApi.fetchExerciseSubmissionStats(exerciseId),
    enabled: !!exerciseId,
  });

  const filtered = (submissions ?? []).filter((s) => {
    if (tab === "to_grade") return s.status !== "graded";
    if (tab === "graded") return s.status === "graded";
    return true;
  });

  return (
    <View className="flex-1 bg-xporadia-bg">
      {stats ? (
        <View className="bg-white px-4 py-3 flex-row shadow-soft">
          <StatPill label="Rendus" value={stats.submitted_count} />
          <StatPill label="Non rendus" value={stats.not_submitted_count} />
          <StatPill label="En retard" value={stats.late_count} />
          <StatPill label="Corrigés" value={stats.graded_count} />
        </View>
      ) : null}

      <View className="px-4 pt-3">
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un élève..."
          leftIcon={<SearchIcon size={16} color={Colors.textSecondary} />}
        />
      </View>

      <View className="flex-row gap-2 px-4 py-3">
        <Chip label="À corriger" variant={tab === "to_grade" ? "navy" : "neutral"} onPress={() => setTab("to_grade")} />
        <Chip label="Corrigés" variant={tab === "graded" ? "navy" : "neutral"} onPress={() => setTab("graded")} />
        <Chip label="Tous" variant={tab === "all" ? "navy" : "neutral"} onPress={() => setTab("all")} />
        <Chip
          label={ordering === "submitted_at" ? "Plus anciens d'abord" : "Plus récents d'abord"}
          variant="neutral"
          onPress={() => setOrdering((o) => (o === "submitted_at" ? "-submitted_at" : "submitted_at"))}
        />
      </View>

      <ScrollView contentContainerClassName="px-4 gap-3 pb-12">
        {isLoading ? (
          <Text className="text-xporadia-text-secondary text-center py-8">Chargement...</Text>
        ) : filtered.length > 0 ? (
          filtered.map((submission) => <SubmissionCard key={submission.id} submission={submission} />)
        ) : (
          <View className="items-center gap-2 py-10">
            <MedalIcon size={24} color={Colors.textSecondary} />
            <Text className="text-xs text-xporadia-text-secondary text-center">
              Aucune copie dans cette catégorie.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
