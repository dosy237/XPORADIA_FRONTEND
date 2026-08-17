import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import {
  BookIcon,
  BriefcaseIcon,
  ClockIcon,
  MedalIcon,
  NewspaperIcon,
  UsersIcon,
} from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import * as academicsApi from "@/services/academics";
import * as gradingApi from "@/services/grading";
import * as messagingApi from "@/services/messaging";
import * as virtualClassesApi from "@/services/virtualClasses";
import { useAuthStore } from "@/store/authStore";

const WEEKDAY_TODAY_INDEX = (new Date().getDay() + 6) % 7; // Lundi = 0, dimanche = 6

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

  // rejected
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

  const { data: timetable } = useQuery({ queryKey: ["my-timetable"], queryFn: academicsApi.fetchMyTimetable });
  const { data: subjects } = useQuery({ queryKey: ["my-subjects"], queryFn: virtualClassesApi.fetchMySubjects });
  const { data: channels } = useQuery({ queryKey: ["channels"], queryFn: messagingApi.fetchChannels });
  const { data: myClass } = useQuery({ queryKey: ["my-class"], queryFn: academicsApi.fetchMyClass });

  const todaySlots = (timetable ?? [])
    .filter((slot) => slot.weekday === WEEKDAY_TODAY_INDEX)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const upcomingExercises = (subjects ?? [])
    .flatMap((s) => s.exercises.map((ex) => ({ ...ex, subjectName: s.name })))
    .filter((ex) => !ex.my_submission && ex.deadline)
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
    .slice(0, 3);

  const unreadChannels = (channels ?? []).filter((c) => c.unread_count > 0).slice(0, 3);
  const pinnedAnnouncement = channels?.find((c) => c.channel_type === "class");

  return (
    <View className="flex-1 bg-xporadia-bg">
      <DashboardHeader title="Espace élève" subtitle={user ? `${user.first_name} ${user.last_name}` : undefined} />
      <ScrollView contentContainerClassName="p-6 gap-5 pb-12">
        {!myClass?.school_class_name ? <EstablishmentAttachmentBanner /> : null}

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
          <SectionTitle
            title="Devoirs à venir"
            actionLabel="Tout voir"
            onAction={() => router.push("/(app)/student/assignments")}
          />
          {upcomingExercises.length > 0 ? (
            <View className="gap-2">
              {upcomingExercises.map((ex) => (
                <Card
                  key={ex.id}
                  onPress={() => router.push(`/(app)/student/assignments/${ex.id}`)}
                  className="gap-1"
                >
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
              <Text className="text-xs text-xporadia-text-secondary text-center py-2">
                Rien à rendre pour l'instant.
              </Text>
            </Card>
          )}
        </View>

        {unreadChannels.length > 0 && (
          <View className="gap-3">
            <SectionTitle
              title="Messages non lus"
              actionLabel="Tout voir"
              onAction={() => router.push("/(app)/messages")}
            />
            <View className="gap-2">
              {unreadChannels.map((c) => (
                <Card
                  key={c.id}
                  onPress={() => router.push(`/(app)/messages/${c.id}`)}
                  className="flex-row items-center gap-3"
                >
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

        <View className="gap-3">
          <SectionTitle title="Mon espace" />
          <View className="flex-row flex-wrap gap-3">
            {[
              { icon: UsersIcon, label: "Ma classe", href: "/(app)/student/class" },
              { icon: BookIcon, label: "Mes matières", href: "/(app)/student/subjects" },
              { icon: MedalIcon, label: "Mes résultats", href: "/(app)/student/grades" },
              { icon: BriefcaseIcon, label: "Vie & objectifs", href: "/(app)/student/goals" },
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
              Cours, fiches et livres de votre établissement.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
