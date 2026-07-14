import { router } from "expo-router";
import { Text } from "react-native";

import { DashboardPlaceholder } from "@/components/DashboardPlaceholder";
import { Card } from "@/components/ui/Card";

export default function CompanyDashboard() {
  return (
    <DashboardPlaceholder
      title="Publiez des offres de stage et évaluez vos stagiaires."
      upcomingFeatures={[
        "Offres de stage et candidatures reçues (EP-04)",
        "Évaluation des stagiaires accueillis (EP-04)",
        "Recherche d'enseignants certifiés pour vos formations (EP-03)",
      ]}
    >
      <Card onPress={() => router.push("/(app)/company/profile")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Mon entreprise</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Raison sociale, secteur, adresse — visible par Xporadia et les candidats.
        </Text>
      </Card>
    </DashboardPlaceholder>
  );
}
