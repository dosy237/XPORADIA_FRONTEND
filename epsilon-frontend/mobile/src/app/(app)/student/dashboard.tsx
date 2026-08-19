import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";

import { GradeTrendChart } from "@/components/charts/GradeTrendChart";
import { SkillsRadarChart } from "@/components/charts/SkillsRadarChart";
import { DashboardHeroHeader, HeroFact } from "@/components/student/DashboardHeroHeader";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import {
  BellIcon,
  BookIcon,
  BriefcaseIcon,
  ClockIcon,
  FileTextIcon,
  GraduationCapIcon,
  MedalIcon,
  NewspaperIcon,
  StarIcon,
  UsersIcon,
} from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";
import * as gradingApi from "@/services/grading";
import * as libraryApi from "@/services/library";
import * as messagingApi from "@/services/messaging";
import * as notificationsApi from "@/services/notifications";
import * as studentLifeApi from "@/services/studentLife";
import * as virtualClassesApi from "@/services/virtualClasses";
import { useAuthStore } from "@/store/authStore";

const WEEKDAY_TODAY_INDEX = (new Date().getDay() + 6) % 7; // Lundi = 0, dimanche = 6

function computeAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hadBirthdayThisYear =
    today.getMonth() > dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}

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

/** Cellule d'accès rapide — forme organique (un coin nettement plus
 * arrondi que les 3 autres) plutôt que le carré générique demandé à
 * bannir, tout en restant cohérente avec ses voisines dans la grille. */
function QuickAccessCell({
  icon, label, badge, onPress,
}: { icon: ReactNode; label: string; badge?: number; onPress: () => void }) {
  return (
    <Card
      onPress={onPress}
      className="items-center gap-2 flex-1 min-w-[30%] py-5 rounded-tl-[28px] rounded-tr-xl rounded-br-[28px] rounded-bl-xl"
    >
      <View className="relative">
        <View className="h-12 w-12 rounded-full bg-xporadia-bg items-center justify-center">{icon}</View>
        {badge ? (
          <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-xporadia-orange items-center justify-center">
            <Text className="text-[10px] font-bold text-white">{badge > 9 ? "9+" : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text className="text-xs font-semibold text-xporadia-text-primary text-center" numberOfLines={1}>
        {label}
      </Text>
    </Card>
  );
}

function EstablishmentAttachmentBanner() {
  const { data: joinRequest } = useQuery({
    queryKey: ["my-join-request"],
    queryFn: gradingApi.fetchMyJoinRequest,
  });

  if (!joinRequest) {
    return (
      <Card onPress={() => router.push("/(auth)/join-establishment")} className="flex-row items-center gap-3">
        <View className="h-11 w-11 rounded-full bg-xporadia-orange/10 items-center justify-center">
          <BriefcaseIcon size={20} color={Colors.orange} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-xporadia-text-primary">Rejoindre mon établissement</Text>
          <Text className="text-xs text-xporadia-text-secondary">
            Accédez à votre classe, votre emploi du temps et vos matières.
          </Text>
        </View>
      </Card>
    );
  }

  if (joinRequest.status === "pending") {
    return (
      <Card className="flex-row items-center gap-3">
        <View className="h-11 w-11 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
          <ClockIcon size={20} color={Colors.navy} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-xporadia-text-primary">Demande en cours d&apos;examen</Text>
          <Text className="text-xs text-xporadia-text-secondary">
            {joinRequest.establishment_name} n&apos;a pas encore répondu.
          </Text>
        </View>
      </Card>
    );
  }

  if (joinRequest.status === "approved") {
    return (
      <Card className="flex-row items-center gap-3">
        <View className="h-11 w-11 rounded-full bg-xporadia-navy/[0.06] items-center justify-center">
          <BriefcaseIcon size={20} color={Colors.navy} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-xporadia-text-primary">
            {joinRequest.establishment_name} vous a accepté(e)
          </Text>
          <Text className="text-xs text-xporadia-text-secondary">
            En attente d&apos;affectation à une classe.
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card onPress={() => router.push("/(auth)/join-establishment")} className="flex-row items-center gap-3">
      <View className="h-11 w-11 rounded-full bg-xporadia-red/10 items-center justify-center">
        <BriefcaseIcon size={20} color={Colors.red} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-xporadia-text-primary">Demande refusée</Text>
        <Text className="text-xs text-xporadia-text-secondary" numberOfLines={2}>
          {joinRequest.rejection_reason || "Touchez pour essayer un autre établissement."}
        </Text>
      </View>
    </Card>
  );
}

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: myClass } = useQuery({ queryKey: ["my-class"], queryFn: academicsApi.fetchMyClass });
  const { data: timetable } = useQuery({ queryKey: ["my-timetable"], queryFn: academicsApi.fetchMyTimetable });
  const { data: subjects } = useQuery({ queryKey: ["my-subjects"], queryFn: virtualClassesApi.fetchMySubjects });
  const { data: channels } = useQuery({ queryKey: ["channels"], queryFn: messagingApi.fetchChannels });
  const { data: notifications } = useQuery({ queryKey: ["notifications"], queryFn: notificationsApi.fetchNotifications });
  const { data: lifeGoal } = useQuery({ queryKey: ["my-life-goal"], queryFn: studentLifeApi.fetchLifeGoal });
  const { data: reportCards } = useQuery({ queryKey: ["my-report-cards"], queryFn: gradingApi.fetchMyReportCards });
  const { data: libraryEstablishments } = useQuery({
    queryKey: ["my-library-establishments"], queryFn: libraryApi.fetchMyLibraryEstablishments,
  });
  const firstLibraryEstablishmentId = libraryEstablishments?.[0]?.id;
  const { data: libraryResources } = useQuery({
    queryKey: ["library-resources", firstLibraryEstablishmentId],
    queryFn: () => libraryApi.fetchLibraryResources(firstLibraryEstablishmentId!),
    enabled: !!firstLibraryEstablishmentId,
  });

  const todaySlots = (timetable ?? [])
    .filter((slot) => slot.weekday === WEEKDAY_TODAY_INDEX)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const upcomingExercises = (subjects ?? [])
    .flatMap((s) => s.exercises.map((ex) => ({ ...ex, subjectName: s.name })))
    .filter((ex) => !ex.my_submission && ex.deadline)
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
    .slice(0, 3);

  const unreadChannels = (channels ?? []).filter((c) => c.unread_count > 0);
  const unreadMessagesCount = unreadChannels.reduce((sum, c) => sum + c.unread_count, 0);
  const unreadNotificationsCount = (notifications ?? []).filter((n) => !n.is_read).length;

  // Bulletins triés du plus ancien au plus récent — l'ordre naturel d'une
  // courbe de tendance (published_at seul ne suffirait pas si republié).
  const sortedReportCards = [...(reportCards ?? [])].sort((a, b) => a.term - b.term);
  const latestReportCard = sortedReportCards[sortedReportCards.length - 1];
  const trendPoints = sortedReportCards.map((rc) => ({
    label: rc.term_label.replace("Trimestre ", "T").replace("Semestre ", "S"),
    value: Number(rc.general_average),
  }));

  // Radar de compétences — un axe par matière déclarée dans l'objectif de
  // vie de l'élève (LifeGoal.related_subjects), rayon = sa moyenne réelle
  // sur cette matière au dernier bulletin publié. Rien n'est inventé : une
  // matière sans moyenne dans le dernier bulletin est simplement absente.
  const relatedSubjects = lifeGoal?.related_subjects ?? [];
  const radarAxes = relatedSubjects
    .map((subjectName) => {
      const entry = latestReportCard?.subject_entries.find((e) => e.subject_name === subjectName);
      return entry?.subject_average != null
        ? { label: subjectName, value: Number(entry.subject_average) }
        : null;
    })
    .filter((axis): axis is { label: string; value: number } => axis !== null);

  const strongestSubject = latestReportCard?.subject_entries
    .filter((e) => e.subject_average != null)
    .sort((a, b) => Number(b.subject_average) - Number(a.subject_average))[0];

  const age = computeAge(myClass?.birth_date);

  const heroFacts: HeroFact[] = [
    myClass?.school_class_name
      ? { icon: "🏫", text: `${myClass.class_level} · ${myClass.establishment_name ?? "Établissement"}` }
      : null,
    age != null ? { icon: "🎂", text: `${age} ans` } : null,
    lifeGoal?.description ? { icon: "🎯", text: lifeGoal.description } : null,
    strongestSubject
      ? { icon: "⭐", text: `Point fort : ${strongestSubject.subject_name} (${strongestSubject.subject_average}/20)` }
      : null,
    latestReportCard
      ? { icon: "📈", text: `Moyenne générale : ${latestReportCard.general_average}/20 (${latestReportCard.term_label})` }
      : null,
  ].filter((f): f is HeroFact => f !== null);

  return (
    <View className="flex-1 bg-xporadia-bg">
      <ScrollView contentContainerClassName="gap-5 pb-12">
        <DashboardHeroHeader
          firstName={user?.first_name}
          lastName={user?.last_name}
          avatarUri={user?.avatar}
          facts={heroFacts}
        />

        <View className="px-6 gap-5">
          {!myClass?.school_class_name ? <EstablishmentAttachmentBanner /> : null}

          {trendPoints.length > 0 && (
            <View className="gap-3">
              <SectionTitle title="Ma progression" actionLabel="Mes résultats" onAction={() => router.push("/(app)/student/grades")} />
              <Card className="rounded-tl-3xl rounded-tr-[36px] rounded-br-3xl rounded-bl-[36px] items-center py-4">
                <GradeTrendChart points={trendPoints} width={300} height={170} color={Colors.orange} />
                {latestReportCard ? (
                  <View className="flex-row items-center gap-2 mt-1">
                    <Chip
                      label={`${latestReportCard.rank}${latestReportCard.rank === 1 ? "er" : "e"} / ${latestReportCard.class_size}`}
                      variant="navy-subtle"
                    />
                    <Chip label={`Classe : ${latestReportCard.class_average}/20`} variant="neutral" />
                  </View>
                ) : null}
              </Card>
            </View>
          )}

          {radarAxes.length >= 3 && (
            <View className="gap-3">
              <SectionTitle title="Compétences & objectif" />
              <Card className="rounded-tl-[36px] rounded-tr-3xl rounded-br-[36px] rounded-bl-3xl items-center py-4 gap-2">
                <SkillsRadarChart axes={radarAxes} size={230} color={Colors.orange} />
                {lifeGoal?.description ? (
                  <View className="flex-row items-center gap-2 bg-xporadia-orange/10 rounded-full px-4 py-2 mt-1 max-w-full">
                    <StarIcon size={14} color={Colors.orange} filled />
                    <Text className="text-xs font-semibold text-xporadia-orange-text flex-1" numberOfLines={2}>
                      {lifeGoal.description}
                    </Text>
                  </View>
                ) : null}
              </Card>
            </View>
          )}

          {todaySlots.length > 0 && (
            <View className="gap-3">
              <SectionTitle title="Aujourd'hui" actionLabel="Emploi du temps" onAction={() => router.push("/(app)/student/timetable")} />
              <View className="gap-2">
                {todaySlots.map((slot) => (
                  <Card key={slot.id} variant="flat" className="flex-row items-center gap-3 bg-white">
                    <View className="h-10 w-10 rounded-full bg-xporadia-orange/10 items-center justify-center">
                      <ClockIcon size={16} color={Colors.orange} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-xporadia-text-primary">{slot.subject_name}</Text>
                      <Text className="text-xs text-xporadia-text-secondary">
                        {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                        {slot.room ? ` · ${slot.room}` : ""}
                      </Text>
                    </View>
                  </Card>
                ))}
              </View>
            </View>
          )}

          <View className="gap-3">
            <SectionTitle title="Devoirs à venir" actionLabel="Tout voir" onAction={() => router.push("/(app)/student/assignments")} />
            {upcomingExercises.length > 0 ? (
              <View className="gap-2">
                {upcomingExercises.map((ex) => (
                  <Card key={ex.id} onPress={() => router.push(`/(app)/student/assignments/${ex.id}`)} className="gap-1">
                    <Text className="text-sm font-semibold text-xporadia-text-primary">{ex.title}</Text>
                    <Text className="text-xs text-xporadia-text-secondary">
                      {ex.subjectName}
                      {ex.deadline ? ` · à rendre avant le ${new Date(ex.deadline).toLocaleDateString("fr-FR")}` : ""}
                    </Text>
                  </Card>
                ))}
              </View>
            ) : (
              <Card>
                <Text className="text-xs text-xporadia-text-secondary text-center py-2">Rien à rendre pour l&apos;instant.</Text>
              </Card>
            )}
          </View>

          <View className="gap-3">
            <SectionTitle title="Mon espace" />
            <View className="flex-row flex-wrap gap-3">
              <QuickAccessCell icon={<UsersIcon size={20} color={Colors.navy} />} label="Ma classe" onPress={() => router.push("/(app)/student/class")} />
              <QuickAccessCell icon={<BookIcon size={20} color={Colors.navy} />} label="Mes matières" onPress={() => router.push("/(app)/student/subjects")} />
              <QuickAccessCell icon={<MedalIcon size={20} color={Colors.navy} />} label="Mes résultats" onPress={() => router.push("/(app)/student/grades")} />
              <QuickAccessCell icon={<ClockIcon size={20} color={Colors.navy} />} label="Emploi du temps" onPress={() => router.push("/(app)/student/timetable")} />
              <QuickAccessCell icon={<FileTextIcon size={20} color={Colors.navy} />} label="Devoirs" onPress={() => router.push("/(app)/student/assignments")} />
              <QuickAccessCell icon={<GraduationCapIcon size={20} color={Colors.navy} />} label="Vie & objectifs" onPress={() => router.push("/(app)/student/goals")} />
              <QuickAccessCell icon={<BriefcaseIcon size={20} color={Colors.navy} />} label="Stage" onPress={() => router.push("/(app)/student/internship")} />
              <QuickAccessCell icon={<BookIcon size={20} color={Colors.navy} />} label="Bibliothèque" onPress={() => router.push("/(app)/library")} />
              <QuickAccessCell
                icon={<NewspaperIcon size={20} color={Colors.navy} />}
                label="Messages"
                badge={unreadMessagesCount}
                onPress={() => router.push("/(app)/messages")}
              />
              <QuickAccessCell
                icon={<BellIcon size={20} color={Colors.navy} />}
                label="Notifications"
                badge={unreadNotificationsCount}
                onPress={() => router.push("/(app)/notifications")}
              />
            </View>
          </View>

          {libraryResources && libraryResources.length > 0 && (
            <View className="gap-3">
              <SectionTitle title="Bibliothèque de mon établissement" actionLabel="Tout voir" onAction={() => router.push("/(app)/library")} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 pr-2">
                {libraryResources.slice(0, 8).map((resource) => (
                  <Card
                    key={resource.id}
                    onPress={() => router.push("/(app)/library")}
                    className="w-44 gap-2 rounded-tl-2xl rounded-tr-[26px] rounded-br-2xl rounded-bl-[26px]"
                  >
                    <View className="h-9 w-9 rounded-full bg-xporadia-orange/10 items-center justify-center">
                      <BookIcon size={16} color={Colors.orange} />
                    </View>
                    <Text className="text-xs font-bold text-xporadia-text-primary" numberOfLines={2}>
                      {resource.title}
                    </Text>
                    <Text className="text-[11px] text-xporadia-text-secondary" numberOfLines={2}>
                      {resource.description || resource.subject}
                    </Text>
                    <Chip label={resource.subject} variant="neutral" />
                  </Card>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
