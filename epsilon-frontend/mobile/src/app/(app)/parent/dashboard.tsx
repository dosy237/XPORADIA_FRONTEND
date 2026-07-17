import { router } from "expo-router";
import { Text } from "react-native";

import { DashboardPlaceholder } from "@/components/DashboardPlaceholder";
import { Card } from "@/components/ui/Card";

export default function ParentDashboard() {
  return (
    <DashboardPlaceholder
      title="Trouvez des cours particuliers certifiés pour vos enfants."
      upcomingFeatures={["Recherche par distance GPS autour de vous (EP-05)"]}
    >
      <Card onPress={() => router.push("/(app)/parent/profile")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Mes enfants</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Localisation et profils de vos enfants — jusqu'à 5 enfants.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/parent/find-tutor")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Trouver un enseignant</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Réservez une séance de cours particulier, paiement Mobile Money sécurisé.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/parent/my-tutoring-sessions")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Mes cours particuliers</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Suivez vos réservations et laissez un avis après la séance.
        </Text>
      </Card>
    </DashboardPlaceholder>
  );
}
