import { router } from "expo-router";
import { Text } from "react-native";

import { DashboardPlaceholder } from "@/components/DashboardPlaceholder";
import { Card } from "@/components/ui/Card";

export default function DirectorDashboard() {
  return (
    <DashboardPlaceholder
      title="Gérez vos recrutements et vos stages."
      upcomingFeatures={[
        "Recherche d'enseignants certifiés (EP-03)",
        "Offres d'emploi et candidatures reçues (EP-03)",
        "Suivi des stages de l'établissement (EP-04)",
      ]}
    >
      <Card onPress={() => router.push("/(app)/director/profile")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Mon établissement</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Nom, adresse, niveaux enseignés, effectif — visible par Xporadia et les partenaires.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/director/academics")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          Structure académique
        </Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Départements, filières, classes et enseignants titulaires.
        </Text>
      </Card>
    </DashboardPlaceholder>
  );
}
