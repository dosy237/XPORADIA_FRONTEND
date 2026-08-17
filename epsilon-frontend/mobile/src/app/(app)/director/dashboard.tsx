import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Text, View } from "react-native";

import { DashboardPlaceholder } from "@/components/DashboardPlaceholder";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import * as employmentApi from "@/services/employment";
import * as gradingApi from "@/services/grading";

export default function DirectorDashboard() {
  const { data: joinRequests } = useQuery({
    queryKey: ["director-join-requests"],
    queryFn: gradingApi.fetchDirectorJoinRequests,
  });
  const pendingCount = (joinRequests ?? []).filter((r) => r.status === "pending").length;

  const { data: invoices } = useQuery({
    queryKey: ["my-invoices"],
    queryFn: employmentApi.fetchMyInvoices,
  });
  const unpaidInvoicesCount = (invoices ?? []).filter((i) => i.status === "unpaid").length;

  return (
    <DashboardPlaceholder title="Gérez vos recrutements et vos stages.">
      <Card onPress={() => router.push("/(app)/director/join-requests")} className="gap-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-xporadia-text-primary">
            Demandes de rattachement
          </Text>
          {pendingCount > 0 ? <Chip label={String(pendingCount)} variant="orange" /> : null}
        </View>
        <Text className="text-sm text-xporadia-text-secondary">
          Des élèves demandent à rejoindre votre établissement.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/director/admission-report")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          Rapport d&apos;admission
        </Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Déposez les résultats d&apos;un concours (CSV/PDF), rapprochement automatique proposé.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/director/teacher-search")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          Recherche d&apos;enseignants certifiés
        </Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Parcourez les profils avant de cibler un enseignant dans une offre d&apos;emploi.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/director/profile")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Mon établissement</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Nom, adresse, niveaux enseignés, effectif : visible par Xporadia et les partenaires.
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

      <Card onPress={() => router.push("/(app)/director/year-end-readiness")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          Suivi de fin d&apos;année
        </Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Qui a validé le passage de sa classe, qui reste en attente.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/start-of-year-check")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">
          Vérification de rentrée
        </Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Contrôlez la cohérence entre niveau déclaré et classe réelle.
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

      <Card onPress={() => router.push("/(app)/director/worked-hours")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Heures à valider</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Vos enseignants en CDD, Vacation ou Intérim déclarent leurs heures ici.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/director/invoices")} className="gap-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-xporadia-text-primary">Factures</Text>
          {unpaidInvoicesCount > 0 ? <Chip label={String(unpaidInvoicesCount)} variant="orange" /> : null}
        </View>
        <Text className="text-sm text-xporadia-text-secondary">
          Montant dû, calculé sur les heures de vos enseignants.
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
