import { useQueries, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Animated, Easing, ScrollView, Text, View } from "react-native";

import { GradeTrendChart } from "@/components/charts/GradeTrendChart";
import { SkillsRadarChart } from "@/components/charts/SkillsRadarChart";
import { DashboardHeroHeader, HeroFact } from "@/components/student/DashboardHeroHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import {
  BookIcon,
  BriefcaseIcon,
  ClockIcon,
  FileTextIcon,
  GraduationCapIcon,
  MedalIcon,
  PencilIcon,
  SendIcon,
  StarIcon,
  UsersIcon,
} from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import * as academicsApi from "@/services/academics";
import * as feedApi from "@/services/feed";
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

/** Phrase d'interprétation simple — comparaison entre le premier et le
 * dernier point connus, pas un vrai modèle : suffisant pour une lecture
 * "en progression / stable / en repli" au-dessus du graphique. */
function describeTrend(points: { label: string; value: number }[]): string | null {
  if (points.length < 2) return null;
  const delta = points[points.length - 1].value - points[0].value;
  if (Math.abs(delta) < 0.3) return "Résultats stables depuis le début de l'année.";
  if (delta > 0) return `En progression constante depuis ${points[0].label}.`;
  return `En repli depuis ${points[0].label} — un accompagnement pourrait aider.`;
}

type AssignmentStatus = "en_cours" | "soumis" | "corrige";

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  en_cours: "En cours",
  soumis: "Soumis",
  corrige: "Corrigé",
};
const STATUS_COLORS: Record<AssignmentStatus, string> = {
  en_cours: Colors.orange,
  soumis: Colors.navyLight,
  corrige: Colors.green,
};

/** Léger décalage en cascade à l'entrée de l'écran — rien ne doit
 * apparaître d'un coup. Vrai "reveal au scroll" nécessiterait de mesurer
 * la position de chaque bloc dans la ScrollView (pas de librairie de ce
 * type déjà présente dans le projet) ; ce fondu-glissé échelonné à
 * l'affichage de l'écran donne le même rythme respirant pour un coût et
 * un risque bien moindres. */
function Reveal({ children, index }: { children: ReactNode; index: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 520,
      delay: index * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, index]);
  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
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
 * arrondi que les 3 autres), teinte propre à son univers (discrète,
 * dérivée de la palette de marque plutôt qu'inventée), badge en chiffre
 * net plutôt qu'un simple point. */
function QuickAccessCell({
  icon, label, tint, badge, onPress,
}: { icon: ReactNode; label: string; tint: string; badge?: number; onPress: () => void }) {
  return (
    <Card
      onPress={onPress}
      className="items-center gap-2 flex-1 min-w-[30%] py-5 rounded-tl-[28px] rounded-tr-xl rounded-br-[28px] rounded-bl-xl"
    >
      <View className="relative">
        <View className="h-12 w-12 rounded-full items-center justify-center" style={{ backgroundColor: `${tint}33` }}>
          {icon}
        </View>
        {badge ? (
          <View
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-xporadia-orange items-center justify-center"
            style={{ shadowColor: Colors.orange, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 3, elevation: 3 }}
          >
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

/** Bouton "Voir mon arbre" — l'écran détaillé du profil de compétences
 * n'existe pas encore (hors périmètre de cette tâche : uniquement le
 * dashboard). Plutôt que de créer un nouvel écran placeholder, le bouton
 * reste désactivé et révèle une info-bulle tactile "Bientôt disponible" —
 * un vrai point d'entrée sans élargir la portée du chantier. */
function ViewTreeButton() {
  const [hintVisible, setHintVisible] = useState(false);

  return (
    <View className="items-center gap-1.5">
      <Text
        onPress={() => {
          setHintVisible(true);
          setTimeout(() => setHintVisible(false), 2200);
        }}
        suppressHighlighting
        className="text-xs font-bold text-xporadia-navy/40 bg-xporadia-bg rounded-full px-4 py-2"
      >
        🌳 Voir mon arbre
      </Text>
      {hintVisible ? (
        <Text className="text-[11px] font-semibold text-xporadia-orange-text">Bientôt disponible</Text>
      ) : null}
    </View>
  );
}

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: myClass } = useQuery({ queryKey: ["my-class"], queryFn: academicsApi.fetchMyClass });
  const { data: timetable } = useQuery({ queryKey: ["my-timetable"], queryFn: academicsApi.fetchMyTimetable });
  const { data: subjects } = useQuery({ queryKey: ["my-subjects"], queryFn: virtualClassesApi.fetchMySubjects });
  const { data: mySubmissions } = useQuery({ queryKey: ["my-submissions"], queryFn: virtualClassesApi.fetchMySubmissions });
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
  const { data: following } = useQuery({ queryKey: ["my-following"], queryFn: feedApi.fetchMyFollowing });
  // Une requête par auteur suivi (fetchPosts({authorId}), déjà supporté par
  // l'endpoint existant) plutôt qu'un filtrage sur la première page du fil
  // général : avec des dizaines de publications de démo plus récentes que
  // celle d'un enseignant suivi, une simple pagination aurait pu la faire
  // disparaître alors qu'elle existe bel et bien.
  const followedAuthorIds = (following ?? []).slice(0, 6).map((a) => a.id);
  const followedPostsQueries = useQueries({
    queries: followedAuthorIds.map((authorId) => ({
      queryKey: ["feed-posts-by-author", authorId],
      queryFn: () => feedApi.fetchPosts({ authorId }),
    })),
  });

  const todaySlots = (timetable ?? [])
    .filter((slot) => slot.weekday === WEEKDAY_TODAY_INDEX)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Tous les devoirs déjà publiés (le backend ne renvoie jamais de
  // brouillon à l'élève), avec leur statut réel plutôt que seulement les
  // non-soumis — "en cours" en priorité (échéance la plus proche
  // d'abord), puis "soumis", puis "corrigé".
  const allExercises = (subjects ?? []).flatMap((s) => s.exercises.map((ex) => ({ ...ex, subjectName: s.name })));
  const exerciseStatus = (ex: (typeof allExercises)[number]): AssignmentStatus => {
    if (!ex.my_submission) return "en_cours";
    return ex.my_submission.status === "graded" ? "corrige" : "soumis";
  };
  const displayedExercises = [...allExercises]
    .sort((a, b) => {
      const rank = { en_cours: 0, soumis: 1, corrige: 2 } as const;
      const rankDiff = rank[exerciseStatus(a)] - rank[exerciseStatus(b)];
      if (rankDiff !== 0) return rankDiff;
      const aDate = a.deadline ?? a.my_submission?.submitted_at ?? "";
      const bDate = b.deadline ?? b.my_submission?.submitted_at ?? "";
      return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
    })
    .slice(0, 4);
  const notSubmittedCount = allExercises.filter((ex) => !ex.my_submission).length;

  const directChannels = (channels ?? []).filter((c) => c.channel_type === "direct");
  const unreadDirectCount = directChannels.reduce((sum, c) => sum + c.unread_count, 0);
  const unreadReportCardCount = (notifications ?? []).filter(
    (n) => n.notif_type === "report_card_published" && !n.is_read
  ).length;

  // Bulletins triés du plus ancien au plus récent — l'ordre naturel d'une
  // courbe de tendance (published_at seul ne suffirait pas si republié).
  const sortedReportCards = [...(reportCards ?? [])].sort((a, b) => a.term - b.term);
  const latestReportCard = sortedReportCards[sortedReportCards.length - 1];
  const trendPoints = sortedReportCards.map((rc) => ({
    label: rc.term_label.replace("Trimestre ", "T").replace("Semestre ", "S"),
    value: Number(rc.general_average),
  }));
  const comparisonValues = sortedReportCards.map((rc) => Number(rc.class_average));
  const trendDescription = describeTrend(trendPoints);

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

  // Régularité — série de soumissions consécutives (les plus récentes
  // d'abord) rendues à temps. Exprimée en "devoirs d'affilée" plutôt
  // qu'en semaines : avec peu de soumissions de démo, un calcul par
  // semaine calendaire serait fragile et donnerait un chiffre trompeur
  // ("1re semaine") alors que le nombre de copies est la donnée solide
  // dont on dispose vraiment.
  const submissionsByRecency = [...(mySubmissions ?? [])].sort((a, b) => (a.submitted_at < b.submitted_at ? 1 : -1));
  let onTimeStreak = 0;
  for (const submission of submissionsByRecency) {
    if (submission.is_late) break;
    onTimeStreak += 1;
  }

  const heroFacts: HeroFact[] = [
    myClass?.school_class_name
      ? { icon: "🏫", text: `${myClass.class_level} · ${myClass.establishment_name ?? "Établissement"}` }
      : null,
    age != null ? { icon: "🎂", text: `${age} ans` } : null,
    lifeGoal?.description ? { icon: "🎯", text: lifeGoal.description } : null,
    strongestSubject
      ? { icon: "⭐", text: `Point fort : ${strongestSubject.subject_name} (${strongestSubject.subject_average}/20)` }
      : null,
    onTimeStreak >= 2 ? { icon: "🔥", text: `${onTimeStreak} devoirs rendus à temps d'affilée` } : null,
  ].filter((f): f is HeroFact => f !== null);

  const recentFollowedPosts = followedPostsQueries
    .flatMap((q) => q.data ?? [])
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 2);

  let sectionIndex = 0;
  const nextIndex = () => sectionIndex++;

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
          {!myClass?.school_class_name ? (
            <Reveal index={nextIndex()}>
              <EstablishmentAttachmentBanner />
            </Reveal>
          ) : null}

          {/* Résumé du jour */}
          <Reveal index={nextIndex()}>
            <View className="gap-3">
              <SectionTitle title="Aujourd'hui" actionLabel="Afficher tout" onAction={() => router.push("/(app)/student/timetable")} />
              {todaySlots.length > 0 ? (
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
              ) : (
                <Card>
                  <Text className="text-xs text-xporadia-text-secondary text-center py-2">
                    Aucun cours prévu aujourd&apos;hui.
                  </Text>
                </Card>
              )}
            </View>
          </Reveal>

          {/* Compétences & objectif */}
          {radarAxes.length >= 3 && (
            <Reveal index={nextIndex()}>
              <View className="gap-3">
                <SectionTitle title="Compétences & objectif" />
                <Card className="rounded-tl-[36px] rounded-tr-3xl rounded-br-[36px] rounded-bl-3xl items-center py-4 gap-3">
                  <SkillsRadarChart axes={radarAxes} size={230} color={Colors.orange} />
                  {lifeGoal?.description ? (
                    <View className="flex-row items-center gap-2 bg-xporadia-orange/10 rounded-full px-4 py-2 max-w-full">
                      <StarIcon size={14} color={Colors.orange} filled />
                      <Text className="text-xs font-semibold text-xporadia-orange-text flex-1" numberOfLines={2}>
                        {lifeGoal.description}
                      </Text>
                    </View>
                  ) : null}
                  <ViewTreeButton />
                </Card>
              </View>
            </Reveal>
          )}

          {/* Progression */}
          {trendPoints.length > 0 && latestReportCard && (
            <Reveal index={nextIndex()}>
              <View className="gap-3">
                <SectionTitle title="Ma progression" actionLabel="Mes résultats" onAction={() => router.push("/(app)/student/grades")} />
                <Card className="rounded-tl-3xl rounded-tr-[36px] rounded-br-3xl rounded-bl-[36px] items-center py-5 gap-1">
                  <View className="flex-row items-baseline gap-1.5 self-start px-2">
                    <Text className="text-[52px] leading-[52px] font-extrabold text-xporadia-navy">
                      {latestReportCard.general_average}
                    </Text>
                    <Text className="text-xs font-semibold text-xporadia-text-secondary mb-1">/20</Text>
                  </View>
                  {trendDescription ? (
                    <Text className="text-xs text-xporadia-text-secondary self-start px-2 mb-2">{trendDescription}</Text>
                  ) : null}
                  <GradeTrendChart
                    points={trendPoints}
                    comparisonValues={comparisonValues}
                    width={300}
                    height={170}
                    color={Colors.orange}
                  />
                  <View className="flex-row items-center gap-2 mt-1">
                    <Chip
                      label={`${latestReportCard.rank}${latestReportCard.rank === 1 ? "er" : "e"} / ${latestReportCard.class_size}`}
                      variant="navy-subtle"
                    />
                    <Chip label={`Classe : ${latestReportCard.class_average}/20`} variant="neutral" />
                  </View>
                </Card>
              </View>
            </Reveal>
          )}

          {/* Devoirs à venir */}
          <Reveal index={nextIndex()}>
            <View className="gap-3">
              <SectionTitle title="Devoirs à venir" actionLabel="Tout voir" onAction={() => router.push("/(app)/student/assignments")} />
              {displayedExercises.length > 0 ? (
                <View className="gap-2">
                  {displayedExercises.map((ex) => {
                    const status = exerciseStatus(ex);
                    return (
                      <Card key={ex.id} onPress={() => router.push(`/(app)/student/assignments/${ex.id}`)} className="gap-1.5">
                        <View className="flex-row items-center justify-between gap-2">
                          <Text className="text-sm font-semibold text-xporadia-text-primary flex-1" numberOfLines={1}>
                            {ex.title}
                          </Text>
                          <View className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1" style={{ backgroundColor: `${STATUS_COLORS[status]}26` }}>
                            <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                            <Text className="text-[10px] font-bold" style={{ color: STATUS_COLORS[status] }}>
                              {STATUS_LABELS[status]}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-xs text-xporadia-text-secondary">
                          {ex.subjectName}
                          {ex.deadline ? ` · à rendre avant le ${new Date(ex.deadline).toLocaleDateString("fr-FR")}` : ""}
                        </Text>
                      </Card>
                    );
                  })}
                </View>
              ) : (
                <Card>
                  <Text className="text-xs text-xporadia-text-secondary text-center py-2">Rien à rendre pour l&apos;instant.</Text>
                </Card>
              )}
            </View>
          </Reveal>

          {/* Activité sociale récente — limitée aux publications des
              personnes suivies (voir fetchMyFollowing) : le fil n'a pas de
              notion de "publication de ma classe" côté backend, et exposer
              l'identité des enseignants de la classe pour filtrer dessus
              aurait demandé un nouveau champ backend hors du strict besoin
              de ce dashboard. */}
          {recentFollowedPosts.length > 0 && (
            <Reveal index={nextIndex()}>
              <View className="gap-3">
                <SectionTitle title="Activité récente" actionLabel="Voir tout le fil" onAction={() => router.push("/(tabs)/actualites")} />
                <View className="gap-2">
                  {recentFollowedPosts.map((post) => (
                    <Card
                      key={post.id}
                      onPress={() => router.push(`/(tabs)/actualites/${post.id}`)}
                      className="flex-row items-start gap-3"
                    >
                      <Avatar firstName={post.author.full_name.split(" ")[0]} lastName={post.author.full_name.split(" ")[1]} imageUri={post.author.avatar} size={36} />
                      <View className="flex-1 gap-0.5">
                        <Text className="text-xs font-bold text-xporadia-text-primary">
                          {post.author.full_name} <Text className="font-normal text-xporadia-text-secondary">· {formatRelativeTime(post.created_at)}</Text>
                        </Text>
                        <Text className="text-xs text-xporadia-text-secondary" numberOfLines={2}>
                          {post.body}
                        </Text>
                      </View>
                    </Card>
                  ))}
                </View>
              </View>
            </Reveal>
          )}

          {/* Mon espace */}
          <Reveal index={nextIndex()}>
            <View className="gap-3">
              <SectionTitle title="Mon espace" />
              <View className="flex-row flex-wrap gap-3">
                <QuickAccessCell icon={<UsersIcon size={20} color={Colors.purple} />} label="Ma classe" tint={Colors.purple} onPress={() => router.push("/(app)/student/class")} />
                <QuickAccessCell icon={<ClockIcon size={20} color={Colors.platinum} />} label="Emploi du temps" tint={Colors.platinum} onPress={() => router.push("/(app)/student/timetable")} />
                <QuickAccessCell
                  icon={<FileTextIcon size={20} color={Colors.orange} />}
                  label="Devoirs & exercices"
                  tint={Colors.orange}
                  badge={notSubmittedCount}
                  onPress={() => router.push("/(app)/student/assignments")}
                />
                <QuickAccessCell icon={<PencilIcon size={20} color={Colors.green} />} label="Mes notes" tint={Colors.green} onPress={() => router.push("/(app)/student/notes")} />
                <QuickAccessCell
                  icon={<MedalIcon size={20} color={Colors.gold} />}
                  label="Bulletins"
                  tint={Colors.gold}
                  badge={unreadReportCardCount}
                  onPress={() => router.push("/(app)/student/grades")}
                />
                <QuickAccessCell
                  icon={<SendIcon size={20} color={Colors.red} />}
                  label="Messagerie"
                  tint={Colors.red}
                  badge={unreadDirectCount}
                  onPress={() => router.push("/(app)/messages")}
                />
                <QuickAccessCell icon={<BookIcon size={20} color={Colors.bronze} />} label="Bibliothèque" tint={Colors.bronze} onPress={() => router.push("/(app)/library")} />
                <QuickAccessCell icon={<GraduationCapIcon size={20} color={Colors.silver} />} label="Vie & objectifs" tint={Colors.silver} onPress={() => router.push("/(app)/student/goals")} />
              </View>
            </View>
          </Reveal>

          {/* Aperçu bibliothèque */}
          {libraryResources && libraryResources.length > 0 && (
            <Reveal index={nextIndex()}>
              <View className="gap-3">
                <SectionTitle title="Bibliothèque de mon établissement" actionLabel="Tout voir" onAction={() => router.push("/(app)/library")} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 pr-2">
                  {libraryResources.slice(0, 8).map((resource) => (
                    <Card
                      key={resource.id}
                      onPress={() => router.push("/(app)/library")}
                      className="w-44 gap-2 rounded-tl-2xl rounded-tr-[26px] rounded-br-2xl rounded-bl-[26px]"
                    >
                      <View className="h-9 w-9 rounded-full items-center justify-center" style={{ backgroundColor: `${Colors.bronze}33` }}>
                        <BookIcon size={16} color={Colors.bronze} />
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
            </Reveal>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
