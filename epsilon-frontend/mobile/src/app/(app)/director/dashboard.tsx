import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Text, View } from "react-native";

import { DashboardPlaceholder } from "@/components/DashboardPlaceholder";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import * as directorProfileApi from "@/services/directorProfile";
import * as employmentApi from "@/services/employment";
import * as gradingApi from "@/services/grading";

function SchoolGroupInvitationBanner() {
  const queryClient = useQueryClient();
  const { data: invitations } = useQuery({
    queryKey: ["my-school-group-invitations"],
    queryFn: directorProfileApi.fetchMySchoolGroupInvitations,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, accept }: { id: number; accept: boolean }) =>
      directorProfileApi.respondToSchoolGroupInvitation(id, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-school-group-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["my-school-group"] });
    },
  });

  const invitation = (invitations ?? [])[0];
  if (!invitation) return null;

  return (
    <Card className="gap-2">
      <Text className="text-base font-semibold text-xporadia-text-primary">
        Invitation à un groupe scolaire
      </Text>
      <Text className="text-sm text-xporadia-text-secondary">
        {invitation.group_name} vous invite à rejoindre son groupe scolaire.
      </Text>
      <View className="flex-row gap-3 mt-1">
        <View className="flex-1">
          <Button
            label="Refuser"
            variant="secondary"
            pill
            loading={respondMutation.isPending}
            onPress={() => respondMutation.mutate({ id: invitation.id, accept: false })}
          />
        </View>
        <View className="flex-1">
          <Button
            label="Accepter"
            pill
            loading={respondMutation.isPending}
            onPress={() => respondMutation.mutate({ id: invitation.id, accept: true })}
          />
        </View>
      </View>
    </Card>
  );
}

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
      <SchoolGroupInvitationBanner />

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

      <Card onPress={() => router.push("/(app)/director/school-group")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Groupe scolaire</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Regroupez plusieurs établissements et consultez leurs chiffres consolidés.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/director/tuition")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Frais de scolarité</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Échéancier, paiements des familles et relances.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/director/discipline")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Suivi disciplinaire</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Incidents consignés, sanctions et relances aux familles.
        </Text>
      </Card>

      <Card onPress={() => router.push("/(app)/director/teaching-staff")} className="gap-1">
        <Text className="text-base font-semibold text-xporadia-text-primary">Équipe enseignante</Text>
        <Text className="text-sm text-xporadia-text-secondary">
          Enseignants de l&apos;établissement, leurs classes et matières.
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
