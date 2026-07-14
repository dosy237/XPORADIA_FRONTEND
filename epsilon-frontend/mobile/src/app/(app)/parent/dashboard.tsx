import { router } from "expo-router";
import { Text } from "react-native";

import { DashboardPlaceholder } from "@/components/DashboardPlaceholder";
import { Card } from "@/components/ui/Card";

export default function ParentDashboard() {
  return (
    <DashboardPlaceholder
      title="Trouvez des cours particuliers certifiés pour vos enfants."
      upcomingFeatures={[
        "Recherche géolocalisée d'enseignants (EP-05)",
        "Réservation de séances et paiement Mobile Money (EP-05)",
        "Suivi de la classe virtuelle de vos enfants (EP-09)",
      ]}
    >
      <Card onPress={() => router.push("/(app)/parent/profile")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Mes enfants</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Localisation et profils de vos enfants — jusqu'à 5 enfants.
        </Text>
      </Card>
    </DashboardPlaceholder>
  );
}
