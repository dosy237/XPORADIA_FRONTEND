import { router } from "expo-router";
import { Text } from "react-native";

import { DashboardPlaceholder } from "@/components/DashboardPlaceholder";
import { Card } from "@/components/ui/Card";

export default function TeacherDashboard() {
  return (
    <DashboardPlaceholder
      title="Suivez votre certification et vos opportunités."
      upcomingFeatures={[
        "Statut de certification et modules de formation (EP-02)",
        "Offres d'emploi et candidatures (EP-03)",
        "Cours particuliers et agenda (EP-05)",
      ]}
    >
      <Card onPress={() => router.push("/(app)/teacher/profile")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Mon profil</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Matières, tarifs, disponibilités — visible par les directeurs et les parents.
        </Text>
      </Card>
    </DashboardPlaceholder>
  );
}
