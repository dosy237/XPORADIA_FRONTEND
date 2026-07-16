import { router } from "expo-router";
import { Text } from "react-native";

import { DashboardPlaceholder } from "@/components/DashboardPlaceholder";
import { AccreditationBanner } from "@/components/teacher/AccreditationBanner";
import { Card } from "@/components/ui/Card";

export default function TeacherDashboard() {
  return (
    <DashboardPlaceholder title="Suivez votre certification et vos opportunités.">
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

      <Card onPress={() => router.push("/(app)/library")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          Bibliothèque numérique
        </Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Cours, fiches, exercices et annales de votre établissement.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/teacher/job-offers")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Offres d&apos;emploi</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Parcourez les offres des établissements partenaires et postulez.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/teacher/my-applications")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Mes candidatures</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Suivez l&apos;état de vos candidatures.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/teacher/job-seeking")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Demande d&apos;emploi</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Privilège des enseignants Or — publiez une demande à tout moment.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/teacher/tutoring-sessions")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Cours particuliers</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Réservations reçues des parents, paiement Mobile Money séquestré.
        </Text>
      </Card>
    </DashboardPlaceholder>
  );
}
