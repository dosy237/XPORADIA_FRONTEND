import { router } from "expo-router";
import { Text } from "react-native";

import { DashboardPlaceholder } from "@/components/DashboardPlaceholder";
import { AccreditationBanner } from "@/components/teacher/AccreditationBanner";
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
      <AccreditationBanner />

      <Card onPress={() => router.push("/(app)/teacher/certification")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Ma certification</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Statut de niveau, catalogue des modules et sessions de formation.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/teacher/profile")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Mon profil</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Matières, tarifs, disponibilités — visible par les directeurs et les parents.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/teacher/directory")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          Annuaire des enseignants
        </Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Parcourez les profils de vos collègues et découvrez leurs formations.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/teacher/my-classes")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Mes classes</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Classes dont vous êtes l&apos;enseignant titulaire.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/teacher/my-subjects")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Mes matières</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Matières où vous êtes l&apos;enseignant dédié.
        </Text>
      </Card>
    </DashboardPlaceholder>
  );
}
