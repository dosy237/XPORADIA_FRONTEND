import { router } from "expo-router";
import { Text } from "react-native";

import { DashboardPlaceholder } from "@/components/DashboardPlaceholder";
import { Card } from "@/components/ui/Card";

export default function DirectorDashboard() {
  return (
    <DashboardPlaceholder
      title="Gérez vos recrutements et vos stages."
      upcomingFeatures={["Recherche d'enseignants certifiés (EP-03)"]}
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

      <Card onPress={() => router.push("/(app)/library")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          Bibliothèque numérique
        </Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Cours, fiches, exercices et annales accessibles à tout le personnel.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/director/job-listings")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Offres d&apos;emploi</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Publiez des offres, ciblez des profils "open to work" et gérez les candidatures.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/director/internship-offers")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Offres de stage</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Parcourez les offres des entreprises et candidatez au nom de vos élèves.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/director/my-internship-applications")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          Mes candidatures de stage
        </Text>
        <Text className="text-sm text-xporadia-text-secondary">Suivez l&apos;état de vos candidatures.</Text>
      </Card>

      <Card onPress={() => router.push("/(app)/internship-convention")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Conventions de stage</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Signature, journal de stage et évaluations des stages en cours.
        </Text>
      </Card>
    </DashboardPlaceholder>
  );
}
