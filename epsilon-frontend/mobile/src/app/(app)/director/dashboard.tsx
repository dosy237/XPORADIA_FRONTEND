import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import {
  BookIcon,
  BriefcaseIcon,
  BuildingIcon,
  CardIcon,
  CheckCircleIcon,
  ChildIcon,
  ClockIcon,
  FileTextIcon,
  GraduationCapIcon,
  LayersIcon,
  ReceiptIcon,
  SearchIcon,
  ShieldCheckIcon,
  UploadIcon,
  UserPlusIcon,
  UsersIcon,
  WarningIcon,
} from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as directorProfileApi from "@/services/directorProfile";
import * as employmentApi from "@/services/employment";
import * as gradingApi from "@/services/grading";
import { useAuthStore } from "@/store/authStore";

function SectionTitle({ title }: { title: string }) {
  return <Text className="text-base font-bold text-xporadia-navy">{title}</Text>;
}

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

const ESTABLISHMENT_TILES = [
  { icon: BuildingIcon, label: "Mon établissement", href: "/(app)/director/profile" },
  { icon: LayersIcon, label: "Groupe scolaire", href: "/(app)/director/school-group" },
  { icon: GraduationCapIcon, label: "Structure académique", href: "/(app)/director/academics" },
  { icon: ChildIcon, label: "Élèves", href: "/(app)/director/students" },
  { icon: UsersIcon, label: "Équipe enseignante", href: "/(app)/director/teaching-staff" },
] as const;

const SCOLARITE_TILES = [
  { icon: CheckCircleIcon, label: "Fin d'année", href: "/(app)/director/year-end-readiness" },
  { icon: WarningIcon, label: "Vérification de rentrée", href: "/(app)/start-of-year-check" },
  { icon: CardIcon, label: "Frais de scolarité", href: "/(app)/director/tuition" },
  { icon: ShieldCheckIcon, label: "Suivi disciplinaire", href: "/(app)/director/discipline" },
] as const;

const RECRUTEMENT_TILES = [
  { icon: SearchIcon, label: "Enseignants certifiés", href: "/(app)/director/teacher-search" },
  { icon: BriefcaseIcon, label: "Offres d'emploi", href: "/(app)/director/job-listings" },
  { icon: ClockIcon, label: "Heures à valider", href: "/(app)/director/worked-hours" },
] as const;

const STAGES_TILES = [
  { icon: BriefcaseIcon, label: "Offres de stage", href: "/(app)/director/internship-offers" },
  { icon: FileTextIcon, label: "Mes candidatures", href: "/(app)/director/my-internship-applications" },
  { icon: ReceiptIcon, label: "Conventions de stage", href: "/(app)/internship-convention" },
] as const;

function TileGrid({ tiles }: { tiles: readonly { icon: typeof BuildingIcon; label: string; href: string }[] }) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {tiles.map((item) => (
        <Card
          key={item.label}
          onPress={() => router.push(item.href as never)}
          className="items-center gap-2 flex-1 min-w-[45%] py-5"
        >
          <View className="h-11 w-11 rounded-full bg-xporadia-bg items-center justify-center">
            <item.icon size={20} color={Colors.navy} />
          </View>
          <Text className="text-xs font-semibold text-xporadia-text-primary text-center">{item.label}</Text>
        </Card>
      ))}
    </View>
  );
}

export default function DirectorDashboard() {
  const user = useAuthStore((s) => s.user);

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
    <View className="flex-1 bg-xporadia-bg">
      <DashboardHeader
        title="Espace établissement"
        subtitle={user ? `${user.first_name} ${user.last_name}` : undefined}
      />
      <ScrollView contentContainerClassName="p-6 gap-5 pb-12">
        <SchoolGroupInvitationBanner />

        {pendingCount > 0 ? (
          <Card onPress={() => router.push("/(app)/director/join-requests")} className="flex-row items-center gap-3">
            <View className="h-11 w-11 rounded-full bg-xporadia-orange/10 items-center justify-center">
              <UserPlusIcon size={20} color={Colors.orange} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-xporadia-text-primary">
                Demandes de rattachement
              </Text>
              <Text className="text-xs text-xporadia-text-secondary">
                Des élèves demandent à rejoindre votre établissement.
              </Text>
            </View>
            <Chip label={String(pendingCount)} variant="orange" />
          </Card>
        ) : null}

        {unpaidInvoicesCount > 0 ? (
          <Card onPress={() => router.push("/(app)/director/invoices")} className="flex-row items-center gap-3">
            <View className="h-11 w-11 rounded-full bg-xporadia-orange/10 items-center justify-center">
              <ReceiptIcon size={20} color={Colors.orange} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-xporadia-text-primary">Factures</Text>
              <Text className="text-xs text-xporadia-text-secondary">
                Montant dû, calculé sur les heures de vos enseignants.
              </Text>
            </View>
            <Chip label={String(unpaidInvoicesCount)} variant="orange" />
          </Card>
        ) : null}

        <Card onPress={() => router.push("/(app)/director/admission-report")} className="flex-row items-center gap-3">
          <View className="h-11 w-11 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
            <UploadIcon size={20} color={Colors.navy} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-xporadia-text-primary">Rapport d&apos;admission</Text>
            <Text className="text-xs text-xporadia-text-secondary">
              Déposez les résultats d&apos;un concours, rapprochement automatique proposé.
            </Text>
          </View>
        </Card>

        <View className="gap-3">
          <SectionTitle title="Mon établissement" />
          <TileGrid tiles={ESTABLISHMENT_TILES} />
        </View>

        <View className="gap-3">
          <SectionTitle title="Scolarité" />
          <TileGrid tiles={SCOLARITE_TILES} />
        </View>

        <View className="gap-3">
          <SectionTitle title="Recrutement" />
          <TileGrid tiles={RECRUTEMENT_TILES} />
        </View>

        <View className="gap-3">
          <SectionTitle title="Stages" />
          <TileGrid tiles={STAGES_TILES} />
        </View>

        <Card onPress={() => router.push("/(app)/library")} className="flex-row items-center gap-3">
          <View className="h-11 w-11 rounded-full bg-xporadia-orange/10 items-center justify-center">
            <BookIcon size={20} color={Colors.orange} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-xporadia-text-primary">Bibliothèque numérique</Text>
            <Text className="text-xs text-xporadia-text-secondary">
              Cours, fiches, exercices et annales accessibles à tout le personnel.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
