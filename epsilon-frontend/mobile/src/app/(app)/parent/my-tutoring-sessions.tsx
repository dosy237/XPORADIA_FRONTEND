import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
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
  const [reviewing, setReviewing] = useState(false);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");

  const { data: reviews } = useQuery({
    queryKey: ["session-reviews", session.id],
    queryFn: () => tutoringApi.fetchSessionReviews(session.id),
    enabled: session.status === "completed",
  });

  const cancelMutation = useMutation({
    mutationFn: () => tutoringApi.updateTutoringSessionStatus(session.id, { status: "cancelled" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-tutoring-sessions"] }),
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      tutoringApi.createSessionReview(session.id, { rating: Number(rating), comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-reviews", session.id] });
      setReviewing(false);
    },
  });

  const hasReview = (reviews ?? []).length > 0;

  return (
    <View className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-xporadia-text-primary flex-1" numberOfLines={1}>
          {session.subject} — {session.teacher.first_name} {session.teacher.last_name}
        </Text>
        <Chip label={STATUS_LABELS[session.status]} variant="navy-subtle" />
      </View>
      <Text className="text-xs text-xporadia-text-secondary">
        {session.date} à {session.start_time} · {session.child_name} ({session.child_level})
      </Text>
      {session.payment && (
        <Text className="text-xs text-xporadia-text-secondary">
          Paiement : {session.gross_amount} FCFA — {session.payment.status}
        </Text>
      )}

      {session.status === "confirmed" && (
        <Button label="Annuler" variant="secondary" pill loading={cancelMutation.isPending} onPress={() => cancelMutation.mutate()} />
      )}

      {session.status === "completed" && !hasReview && !reviewing && (
        <Button label="Laisser un avis" variant="secondary" pill onPress={() => setReviewing(true)} />
      )}

      {reviewing && (
        <View className="gap-2 mt-1">
          <Input label="Note (1-5)" value={rating} onChangeText={setRating} keyboardType="numeric" />
          <Input label="Commentaire" value={comment} onChangeText={setComment} multiline numberOfLines={2} style={{ height: 60, textAlignVertical: "top" }} />
          <Button label="Envoyer l'avis" pill loading={reviewMutation.isPending} onPress={() => reviewMutation.mutate()} />
        </View>
      )}

      {hasReview && (
        <Text className="text-xs text-xporadia-text-secondary">Avis envoyé : {reviews![0].rating}/5</Text>
      )}
    </View>
  );
}

export default function MyTutoringSessionsScreen() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["my-tutoring-sessions"],
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
          Aucune séance de cours particulier réservée pour l&apos;instant.
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
