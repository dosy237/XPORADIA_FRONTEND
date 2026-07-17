import { router } from "expo-router";
import { Text } from "react-native";

import { DashboardPlaceholder } from "@/components/DashboardPlaceholder";
import { Card } from "@/components/ui/Card";

export default function CompanyDashboard() {
  return (
    <DashboardPlaceholder title="Publiez des offres de stage et évaluez vos stagiaires.">
      <Card onPress={() => router.push("/(app)/company/teacher-search")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          Recherche d&apos;enseignants certifiés
        </Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Parcourez les profils avant de cibler un enseignant dans une offre d&apos;emploi.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/company/profile")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Mon entreprise</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Raison sociale, secteur, adresse — visible par Xporadia et les candidats.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/company/internship-offers")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Offres de stage</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Publiez des offres et gérez les candidatures reçues des établissements.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/internship-convention")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Conventions de stage</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Signature, journal de stage et évaluation des stagiaires accueillis.
        </Text>
      </Card>
    </DashboardPlaceholder>
  );
}
