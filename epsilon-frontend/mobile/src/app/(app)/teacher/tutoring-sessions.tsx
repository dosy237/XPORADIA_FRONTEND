import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import * as tutoringApi from "@/services/tutoring";
import type { TutoringSession, TutoringSessionStatus } from "@/services/tutoring";

const STATUS_LABELS: Record<TutoringSessionStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  ongoing: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
  disputed: "En litige",
};

function SessionCard({ session }: { session: TutoringSession }) {
  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: () => tutoringApi.updateTutoringSessionStatus(session.id, { status: "completed" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher-tutoring-sessions"] }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => tutoringApi.updateTutoringSessionStatus(session.id, { status: "cancelled" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher-tutoring-sessions"] }),
  });

  return (
    <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-xporadia-text-primary flex-1" numberOfLines={1}>
          {session.subject} — {session.parent.first_name} {session.parent.last_name}
        </Text>
        <Chip label={STATUS_LABELS[session.status]} variant="navy-subtle" />
      </View>
      <Text className="text-xs text-xporadia-text-secondary">
        {session.date} à {session.start_time} · {session.child_name} ({session.child_level})
      </Text>
      <Text className="text-xs text-xporadia-text-secondary">
        Vous recevrez {session.net_amount} FCFA après la séance.
      </Text>

      {session.status === "confirmed" && (
        <View className="flex-row gap-2 mt-1">
          <View className="flex-1">
            <Button label="Marquer terminée" pill loading={completeMutation.isPending} onPress={() => completeMutation.mutate()} />
          </View>
          <View className="flex-1">
            <Button label="Annuler" variant="secondary" pill loading={cancelMutation.isPending} onPress={() => cancelMutation.mutate()} />
          </View>
        </View>
      )}
    </View>
  );
}

export default function TeacherTutoringSessionsScreen() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["teacher-tutoring-sessions"],
    queryFn: tutoringApi.fetchMyTutoringSessions,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-6">
        <Text className="text-sm text-xporadia-text-secondary text-center">
          Aucune réservation de cours particulier pour l&apos;instant.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </ScrollView>
  );
}
