import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";

import { Chip } from "@/components/ui/Chip";
import * as certificationApi from "@/services/certification";

const PAYMENT_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payé",
  refunded: "Remboursé",
};

export default function MySessionEnrollmentsScreen() {
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["my-session-enrollments"],
    queryFn: certificationApi.fetchMySessionEnrollments,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center">
        <Text className="text-xporadia-text-secondary">Chargement...</Text>
      </View>
    );
  }

  if (!enrollments || enrollments.length === 0) {
    return (
      <View className="flex-1 bg-xporadia-bg items-center justify-center p-6">
        <Text className="text-sm text-xporadia-text-secondary text-center">
          Aucune inscription à une session de formation pour l&apos;instant.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-xporadia-bg" contentContainerClassName="p-6 gap-4 pb-12">
      {enrollments.map((enrollment) => (
        <View key={enrollment.id} className="bg-white rounded-2xl p-4 border border-xporadia-border gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-xporadia-text-primary flex-1" numberOfLines={1}>
              {enrollment.session.module.title}
            </Text>
            <Chip label={PAYMENT_LABELS[enrollment.payment_status]} variant="navy-subtle" />
          </View>
          <Text className="text-xs text-xporadia-text-secondary">
            {enrollment.session.city} · {new Date(enrollment.session.date).toLocaleDateString("fr-FR")}
          </Text>
          {enrollment.payment && (
            <Text className="text-xs text-xporadia-text-secondary">
              {enrollment.payment.amount.toLocaleString("fr-FR")} FCFA · {enrollment.payment.tx_ref}
            </Text>
          )}
          {enrollment.attendance_score !== null && (
            <Text className="text-xs text-xporadia-text-secondary">
              Assiduité : {enrollment.attendance_score}/100
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}
