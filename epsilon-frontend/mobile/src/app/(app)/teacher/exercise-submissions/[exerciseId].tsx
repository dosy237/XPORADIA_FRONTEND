import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import * as virtualClassesApi from "@/services/virtualClasses";
import type { Submission } from "@/services/virtualClasses";

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
    },
  });

  return (
    <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          {submission.child.first_name}
        </Text>
        <Chip label={isGraded ? `Noté : ${submission.grade}/20` : "À corriger"} variant={isGraded ? "navy" : "orange"} />
      </View>
      <Text className="text-sm text-xporadia-text-primary">{submission.content}</Text>

      {isGraded ? (
        submission.feedback ? (
          <Text className="text-xs text-xporadia-text-secondary mt-1">
            Feedback : {submission.feedback}
          </Text>
        ) : null
      ) : (
        <View className="gap-2 mt-1">
          <Input label="Note (/20)" value={String(grade)} onChangeText={setGrade} keyboardType="numeric" />
          <Input
            label="Feedback"
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
    </View>
  );
}

export default function ExerciseSubmissionsScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["exercise-submissions", exerciseId],
    queryFn: () => virtualClassesApi.fetchExerciseSubmissions(exerciseId),
    enabled: !!exerciseId,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-6">
        <Text className="text-sm text-xporadia-text-secondary text-center">
          Aucune copie reçue pour l&apos;instant.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      {submissions.map((submission) => (
        <SubmissionCard key={submission.id} submission={submission} />
      ))}
    </ScrollView>
  );
}
