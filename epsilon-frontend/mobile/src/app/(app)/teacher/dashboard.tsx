import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { AccreditationBanner } from "@/components/teacher/AccreditationBanner";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import {
  BookIcon,
  BriefcaseIcon,
  CalendarIcon,
  MedalIcon,
  NewspaperIcon,
  UsersIcon,
  WarningIcon,
} from "@/components/ui/Icon";
import { LEVEL_LABELS } from "@/constants/certificationLevels";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";
import * as certificationApi from "@/services/certification";
import * as employmentApi from "@/services/employment";
import * as messagingApi from "@/services/messaging";
import * as virtualClassesApi from "@/services/virtualClasses";
import { useAuthStore } from "@/store/authStore";

function SectionTitle({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-base font-bold text-xporadia-navy">{title}</Text>
      {actionLabel && onAction ? (
        <Text className="text-xs font-semibold text-xporadia-orange-text" onPress={onAction} suppressHighlighting>
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}

const POSITION_LABELS: Record<string, string> = {
  below: "En dessous de la fourchette recommandée pour votre niveau",
  within: "Dans la fourchette recommandée pour votre niveau",
  above: "Au-dessus de la fourchette recommandée pour votre niveau",
};

function SalaryBenchmarkCard() {
  const { data: benchmark } = useQuery({
    queryKey: ["my-salary-benchmark"],
    queryFn: employmentApi.fetchMySalaryBenchmark,
  });

  if (!benchmark || !benchmark.current_income || !benchmark.salary_range_min) return null;

  return (
    <Card className="gap-2">
      <Text className="text-xs font-semibold text-xporadia-text-secondary uppercase">
        Repère salarial (privé, visible par vous seul)
      </Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-xporadia-text-primary">
          Votre revenu {benchmark.income_source === "cdi" ? "mensuel" : "du dernier mois"}
        </Text>
        <Text className="text-sm font-bold text-xporadia-navy">
          {benchmark.current_income.toLocaleString("fr-FR")} FCFA
        </Text>
      </View>
      <Text className="text-xs text-xporadia-text-secondary">
        Fourchette recommandée pour votre niveau : {benchmark.salary_range_min?.toLocaleString("fr-FR")} –{" "}
        {benchmark.salary_range_max?.toLocaleString("fr-FR")} FCFA
      </Text>
      {benchmark.position ? (
        <Chip
          label={POSITION_LABELS[benchmark.position]}
          variant={benchmark.position === "below" ? "orange" : "navy-subtle"}
        />
      ) : null}
    </Card>
  );
}

export default function TeacherDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: certStatus } = useQuery({
    queryKey: ["my-certification-status"],
    queryFn: certificationApi.fetchMyCertificationStatus,
  });
  const { data: gradingQueue } = useQuery({
    queryKey: ["my-grading-queue"],
    queryFn: virtualClassesApi.fetchMyGradingQueue,
  });
  const { data: channels } = useQuery({ queryKey: ["channels"], queryFn: messagingApi.fetchChannels });
  const { data: wallet } = useQuery({ queryKey: ["my-wallet"], queryFn: employmentApi.fetchMyWallet });
  const { data: delegations } = useQuery({
    queryKey: ["my-delegations"],
    queryFn: academicsApi.fetchMyDelegations,
  });
  const hasDelegations =
    delegations &&
    (delegations.departments_for_tracks.length > 0 ||
      delegations.tracks_for_classes.length > 0 ||
      delegations.tasks.length > 0);

  const unreadChannels = (channels ?? []).filter((c) => c.unread_count > 0).slice(0, 3);

  return (
    <View className="flex-1 bg-xporadia-bg">
      <DashboardHeader title="Espace enseignant" subtitle={user ? `${user.first_name} ${user.last_name}` : undefined} />
      <ScrollView contentContainerClassName="p-6 gap-5 pb-12">
        <AccreditationBanner />

        <Card
          onPress={() => router.push("/(app)/teacher/certification")}
          className="flex-row items-center gap-3"
        >
          <View className="h-12 w-12 rounded-full bg-xporadia-orange/10 items-center justify-center">
            <MedalIcon size={22} color={Colors.orange} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-xporadia-text-primary">
              {certStatus?.current_level ? LEVEL_LABELS[certStatus.current_level] : "Pas encore certifié"}
            </Text>
            <Text className="text-xs text-xporadia-text-secondary">
              {certStatus?.total_points ?? 0} points cumulés
              {certStatus?.next_level
                ? ` · ${certStatus.points_needed_for_next} pour passer ${LEVEL_LABELS[certStatus.next_level]}`
                : ""}
            </Text>
          </View>
        </Card>

        {gradingQueue && gradingQueue.total_pending > 0 && (
          <View className="gap-3">
            <SectionTitle title="Copies à corriger" />
            <View className="gap-2">
              {gradingQueue.exercises.map((ex) => (
                <Card
                  key={ex.exercise_id}
                  onPress={() => router.push(`/(app)/teacher/exercise-submissions/${ex.exercise_id}`)}
                  className="flex-row items-center justify-between gap-2"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-xporadia-text-primary">{ex.title}</Text>
                    <Text className="text-xs text-xporadia-text-secondary">{ex.subject_name}</Text>
                  </View>
                  <Chip label={String(ex.pending_count)} variant="orange" />
                </Card>
              ))}
            </View>
          </View>
        )}

        {unreadChannels.length > 0 && (
          <View className="gap-3">
            <SectionTitle title="Messages non lus" actionLabel="Tout voir" onAction={() => router.push("/(app)/messages")} />
            <View className="gap-2">
              {unreadChannels.map((c) => (
                <Card key={c.id} onPress={() => router.push(`/(app)/messages/${c.id}`)} className="flex-row items-center gap-3">
                  <View className="h-9 w-9 rounded-full bg-xporadia-navy/[0.08] items-center justify-center">
                    <NewspaperIcon size={15} color={Colors.navy} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-xporadia-text-primary">{c.display_name}</Text>
                    <Text className="text-xs text-xporadia-text-secondary" numberOfLines={1}>
                      {c.last_message?.body ?? "Nouveau message"}
                    </Text>
                  </View>
                  <Chip label={String(c.unread_count)} variant="orange" />
                </Card>
              ))}
            </View>
          </View>
        )}

        {wallet && wallet.balance > 0 && (
          <Card onPress={() => router.push("/(app)/teacher/wallet")} className="flex-row items-center gap-3">
            <View className="h-11 w-11 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
              <BriefcaseIcon size={20} color={Colors.navy} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-xporadia-text-primary">Portefeuille</Text>
              <Text className="text-xs text-xporadia-text-secondary">Voir le solde et l&apos;historique</Text>
            </View>
            <Text className="text-sm font-bold text-xporadia-navy">
              {wallet.balance.toLocaleString("fr-FR")} FCFA
            </Text>
          </Card>
        )}

        <SalaryBenchmarkCard />

        {hasDelegations ? (
          <Card onPress={() => router.push("/(app)/teacher/my-delegations")} className="flex-row items-center gap-3">
            <View className="h-11 w-11 rounded-full bg-xporadia-orange/10 items-center justify-center">
              <BriefcaseIcon size={20} color={Colors.orange} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-xporadia-text-primary">Mes délégations</Text>
              <Text className="text-xs text-xporadia-text-secondary">
                Votre établissement vous a confié une tâche de gestion académique.
              </Text>
            </View>
          </Card>
        ) : null}

        <View className="gap-3">
          <SectionTitle title="Mon espace" />
          <View className="flex-row flex-wrap gap-3">
            {[
              { icon: CalendarIcon, label: "Mon agenda", href: "/(app)/teacher/agenda" },
              { icon: UsersIcon, label: "Mes classes", href: "/(app)/teacher/my-classes" },
              { icon: BookIcon, label: "Mes matières", href: "/(app)/teacher/my-subjects" },
              { icon: BriefcaseIcon, label: "Mes postes", href: "/(app)/teacher/my-recruitments" },
              { icon: MedalIcon, label: "Ma certification", href: "/(app)/teacher/certification" },
              { icon: WarningIcon, label: "Vérification de rentrée", href: "/(app)/start-of-year-check" },
            ].map((item) => (
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
        </View>

        <View className="gap-3">
          <SectionTitle title="Marché de l'emploi" />
          <View className="flex-row flex-wrap gap-3">
            {[
              { icon: BriefcaseIcon, label: "Offres d'emploi", href: "/(app)/teacher/job-offers" },
              { icon: BriefcaseIcon, label: "Mes candidatures", href: "/(app)/teacher/my-applications" },
              { icon: BriefcaseIcon, label: "Demande d'emploi", href: "/(app)/teacher/job-seeking" },
            ].map((item) => (
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
        </View>

        <Card onPress={() => router.push("/(app)/library")} className="flex-row items-center gap-3">
          <View className="h-11 w-11 rounded-full bg-xporadia-orange/10 items-center justify-center">
            <BookIcon size={20} color={Colors.orange} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-xporadia-text-primary">Bibliothèque</Text>
            <Text className="text-xs text-xporadia-text-secondary">
              Consultez le catalogue, contribuez si vous êtes certifié Or.
            </Text>
          </View>
        </Card>

        <Card onPress={() => router.push("/tutoring-transition")} className="flex-row items-center gap-3">
          <View className="h-11 w-11 rounded-full bg-xporadia-bg items-center justify-center">
            <BriefcaseIcon size={20} color={Colors.navy} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-xporadia-text-primary">Cours particuliers</Text>
            <Text className="text-xs text-xporadia-text-secondary">
              Réservations et suivi désormais gérés par notre application dédiée.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
