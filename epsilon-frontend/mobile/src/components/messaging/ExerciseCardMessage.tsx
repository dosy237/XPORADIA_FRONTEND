import { Pressable, Text, View } from "react-native";

import { CheckCircleIcon, ClockIcon, GraduationCapIcon, WarningIcon } from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import type { ExerciseCard } from "@/services/messaging";

function formatDeadline(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_LABEL: Record<string, string> = {
  submitted: "Soumis",
  graded: "Corrigé",
};

/** Carte distincte pour un devoir/examen publié dans un fil de discussion,
 * jamais une bulle de message classique — le tap ne propose jamais de
 * répondre ici : il bascule vers la DM avec l'enseignant (élève) ou vers
 * la vue d'ensemble des soumissions (enseignant), voir onPress. */
export function ExerciseCardMessage({ exercise, onPress }: { exercise: ExerciseCard; onPress: () => void }) {
  const myStatus = exercise.my_submission_status;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${exercise.kind === "exam" ? "Examen" : "Devoir"} : ${exercise.title}`}
      className="self-stretch bg-white rounded-2xl border border-xporadia-orange/25 p-3.5 my-2 gap-2 shadow-soft"
    >
      <View className="flex-row items-center gap-2.5">
        <View className="h-9 w-9 rounded-xl bg-xporadia-orange/10 items-center justify-center">
          <GraduationCapIcon size={17} color={Colors.orange} />
        </View>
        <View className="flex-1">
          <Text className="text-[10px] font-bold text-xporadia-orange-text uppercase tracking-wide">
            {exercise.kind === "exam" ? "Examen" : "Devoir"}
          </Text>
          <Text className="text-sm font-bold text-xporadia-text-primary" numberOfLines={2}>
            {exercise.title}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          {exercise.is_overdue ? (
            <WarningIcon size={12} color={Colors.red} />
          ) : (
            <ClockIcon size={12} color={Colors.textSecondary} />
          )}
          <Text
            className={`text-[11px] ${exercise.is_overdue ? "text-xporadia-red" : "text-xporadia-text-secondary"}`}
          >
            {formatDeadline(exercise.deadline) ?? "Pas d'échéance"}
          </Text>
        </View>
        {myStatus ? (
          <View className="flex-row items-center gap-1">
            <CheckCircleIcon size={12} color={myStatus === "graded" ? Colors.green : Colors.navy} />
            <Text className="text-[11px] font-semibold text-xporadia-text-secondary">
              {STATUS_LABEL[myStatus]}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
