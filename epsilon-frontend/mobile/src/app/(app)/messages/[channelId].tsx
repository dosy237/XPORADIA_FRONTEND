import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { AttachSheet } from "@/components/messaging/AttachSheet";
import { ExerciseCardMessage } from "@/components/messaging/ExerciseCardMessage";
import { Avatar } from "@/components/ui/Avatar";
import {
  BriefcaseIcon,
  BookIcon,
  CheckCircleIcon,
  ClockIcon,
  CloseIcon,
  FileTextIcon,
  GraduationCapIcon,
  PaperclipIcon,
  PencilIcon,
  SendIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/ui/Icon";
import { Colors } from "@/constants/theme";
import { useChannelSocket } from "@/hooks/useChannelSocket";
import * as messagingApi from "@/services/messaging";
import type { ExerciseCard, LocalAsset, Message } from "@/services/messaging";
import * as virtualClassesApi from "@/services/virtualClasses";
import type { ChildExercise, Exercise as VCExercise, ExerciseSubmissionStats } from "@/services/virtualClasses";
import { useAuthStore } from "@/store/authStore";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDeadline(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

/** Deux messages consécutifs du même auteur, à moins de 3 minutes d'écart,
 * se regroupent visuellement (pas d'avatar/nom répété) — pattern Telegram. */
function isGrouped(current: Message, previous?: Message) {
  if (!previous) return false;
  if (previous.author.id !== current.author.id) return false;
  const gapMs = new Date(current.created_at).getTime() - new Date(previous.created_at).getTime();
  return gapMs < 3 * 60 * 1000;
}

function ChatBackground() {
  // Fond de conversation discret aux couleurs de la marque, plutôt qu'un
  // gris uniforme — assez subtil pour ne jamais gêner la lecture.
  return (
    <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
      <View className="absolute -top-16 -left-20 h-72 w-72 rounded-full bg-xporadia-navy/[0.035]" />
      <View className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-xporadia-orange/[0.04]" />
      <View className="absolute bottom-0 -left-16 h-64 w-64 rounded-full bg-xporadia-navy/[0.03]" />
    </View>
  );
}

function MessageActionsSheet({
  visible,
  onEdit,
  onDelete,
  onClose,
}: {
  visible: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <Pressable className="absolute inset-0 bg-black/20 items-center justify-center px-10" style={{ zIndex: 20 }} onPress={onClose}>
      <View className="bg-white rounded-2xl overflow-hidden w-full shadow-deep">
        <Pressable
          onPress={onEdit}
          className="flex-row items-center gap-3 px-4 py-3.5 active:bg-xporadia-bg"
          accessibilityRole="button"
        >
          <PencilIcon size={16} color={Colors.navy} />
          <Text className="text-sm font-medium text-xporadia-text-primary">Modifier</Text>
        </Pressable>
        <View className="h-px bg-xporadia-border" />
        <Pressable
          onPress={onDelete}
          className="flex-row items-center gap-3 px-4 py-3.5 active:bg-xporadia-bg"
          accessibilityRole="button"
        >
          <TrashIcon size={16} color={Colors.red} />
          <Text className="text-sm font-medium text-xporadia-red">Supprimer</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

/** Bandeau fixe rappelant de quel devoir parle la conversation — reste
 * visible même en faisant défiler l'historique, indispensable puisque
 * cette DM mélange discussion normale et soumissions de plusieurs devoirs
 * différents dans le temps. */
function ExerciseContextBanner({
  title,
  deadline,
  onDismiss,
}: {
  title: string;
  deadline: string | null;
  onDismiss: () => void;
}) {
  return (
    <View className="flex-row items-center gap-2.5 bg-xporadia-orange/10 border-b border-xporadia-orange/20 px-4 py-2.5">
      <FileTextIcon size={14} color={Colors.orange} />
      <Text className="flex-1 text-xs font-semibold text-xporadia-orange-text" numberOfLines={1}>
        Devoir : {title}
        {deadline ? `, à rendre le ${formatDeadline(deadline)}` : ""}
      </Text>
      <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Quitter le contexte devoir" hitSlop={8}>
        <CloseIcon size={13} color={Colors.orange} />
      </Pressable>
    </View>
  );
}

/** Action de notation de l'enseignant, réservée à la DM ouverte depuis la
 * vue d'ensemble d'un devoir — voir SubmissionDetailView côté backend, qui
 * publie ensuite lui-même le message de correction dans ce même fil. */
function GradingPanel({ submissionId, onGraded }: { submissionId: number; onGraded: () => void }) {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  const gradeMutation = useMutation({
    mutationFn: () => virtualClassesApi.gradeSubmission(submissionId, { grade: Number(grade), feedback: feedback.trim() }),
    onSuccess: () => {
      setOpen(false);
      setGrade("");
      setFeedback("");
      onGraded();
    },
    onError: () => Alert.alert("Erreur", "Impossible d'enregistrer cette note."),
  });

  const canSubmit = grade.trim().length > 0 && !Number.isNaN(Number(grade)) && Number(grade) >= 0 && Number(grade) <= 20;

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        className="flex-row items-center gap-2 bg-xporadia-navy/[0.04] border-b border-xporadia-border px-4 py-2.5"
      >
        <PencilIcon size={13} color={Colors.navy} />
        <Text className="text-xs font-semibold text-xporadia-navy">Noter cette copie</Text>
      </Pressable>
    );
  }

  return (
    <View className="gap-2 bg-white border-b border-xporadia-border px-4 py-3">
      <View className="flex-row items-center gap-2">
        <TextInput
          value={grade}
          onChangeText={setGrade}
          placeholder="Note /20"
          keyboardType="numeric"
          className="w-24 bg-xporadia-bg rounded-xl px-3 py-2 text-sm text-xporadia-text-primary"
        />
        <TextInput
          value={feedback}
          onChangeText={setFeedback}
          placeholder="Commentaire (optionnel)"
          placeholderTextColor="#94A3B8"
          className="flex-1 bg-xporadia-bg rounded-xl px-3 py-2 text-sm text-xporadia-text-primary"
        />
      </View>
      <View className="flex-row items-center gap-2 justify-end">
        <Pressable onPress={() => setOpen(false)} accessibilityRole="button">
          <Text className="text-xs font-semibold text-xporadia-text-secondary px-3 py-1.5">Annuler</Text>
        </Pressable>
        <Pressable
          onPress={() => gradeMutation.mutate()}
          disabled={!canSubmit || gradeMutation.isPending}
          accessibilityRole="button"
          className={`rounded-full px-4 py-1.5 ${canSubmit ? "bg-xporadia-orange" : "bg-xporadia-border"}`}
        >
          <Text className="text-xs font-bold text-white">Enregistrer la note</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PendingAttachmentsRow({ attachments, onRemove }: { attachments: LocalAsset[]; onRemove: (index: number) => void }) {
  if (attachments.length === 0) return null;
  return (
    <View className="flex-row flex-wrap gap-2 px-4 pt-2.5">
      {attachments.map((asset, index) => {
        const isImage = (asset.mimeType ?? "").startsWith("image/");
        return (
          <View key={`${asset.uri}-${index}`} className="relative">
            {isImage ? (
              <Image source={{ uri: asset.uri }} style={{ width: 52, height: 52, borderRadius: 12 }} contentFit="cover" />
            ) : (
              <View className="h-[52px] w-[52px] rounded-xl bg-xporadia-bg items-center justify-center border border-xporadia-border">
                <FileTextIcon size={18} color={Colors.orange} />
              </View>
            )}
            <Pressable
              onPress={() => onRemove(index)}
              accessibilityRole="button"
              accessibilityLabel="Retirer cette pièce jointe"
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-xporadia-navy items-center justify-center"
            >
              <CloseIcon size={10} color={Colors.white} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

function formatShortDeadline(iso: string | null) {
  if (!iso) return "Pas d'échéance";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

/** Ligne d'un devoir de cette matière, onglets "Devoirs en cours"/"Devoirs
 * corrigés" côté élève — mêmes données que l'écran "Mes devoirs"
 * (my_submission imbriqué dans ChildExercise), simplement filtrées à
 * cette matière, jamais une requête parallèle. */
function StudentSubjectExerciseRow({ exercise, onPress }: { exercise: ChildExercise; onPress: () => void }) {
  const isGraded = exercise.my_submission?.status === "graded";
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="bg-white rounded-2xl p-3.5 gap-2 shadow-soft">
      <View className="flex-row items-center gap-2.5">
        <View className="h-9 w-9 rounded-xl bg-xporadia-orange/10 items-center justify-center">
          <GraduationCapIcon size={16} color={Colors.orange} />
        </View>
        <Text className="flex-1 text-sm font-bold text-xporadia-text-primary" numberOfLines={2}>
          {exercise.title}
        </Text>
      </View>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <ClockIcon size={12} color={Colors.textSecondary} />
          <Text className="text-[11px] text-xporadia-text-secondary">{formatShortDeadline(exercise.deadline)}</Text>
        </View>
        {isGraded && exercise.my_submission?.grade ? (
          <View className="flex-row items-center gap-1">
            <CheckCircleIcon size={12} color={Colors.green} />
            <Text className="text-xs font-bold text-xporadia-green">{exercise.my_submission.grade}/20</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Ligne d'un devoir de cette matière, onglets "Devoirs en cours"/"Soumis"
 * côté enseignant — même liste que l'ancien écran de matière
 * (fetchExercises) et mêmes statistiques que la vue d'ensemble
 * (fetchExerciseSubmissionStats), simplement filtrées à cette matière. */
function TeacherSubjectExerciseRow({
  exercise,
  stats,
  onPress,
}: {
  exercise: VCExercise;
  stats?: ExerciseSubmissionStats;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="bg-white rounded-2xl p-3.5 gap-2 shadow-soft">
      <View className="flex-row items-center gap-2.5">
        <View className="h-9 w-9 rounded-xl bg-xporadia-orange/10 items-center justify-center">
          <GraduationCapIcon size={16} color={Colors.orange} />
        </View>
        <Text className="flex-1 text-sm font-bold text-xporadia-text-primary" numberOfLines={2}>
          {exercise.title}
        </Text>
      </View>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <ClockIcon size={12} color={Colors.textSecondary} />
          <Text className="text-[11px] text-xporadia-text-secondary">{formatShortDeadline(exercise.deadline)}</Text>
        </View>
        {stats ? (
          <Text className="text-xs font-bold text-xporadia-navy">
            {stats.submitted_count}/{stats.total_enrolled} ont soumis
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ChannelDetailScreen() {
  const params = useLocalSearchParams<{
    channelId: string;
    exerciseId?: string;
    exerciseTitle?: string;
    exerciseDeadline?: string;
    submissionId?: string;
  }>();
  const id = Number(params.channelId);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [body, setBody] = useState("");
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [actionsForMessage, setActionsForMessage] = useState<Message | null>(null);
  const [attachSheetVisible, setAttachSheetVisible] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<LocalAsset[]>([]);
  const [exerciseContext, setExerciseContext] = useState<{ id: string; title: string; deadline: string | null } | null>(
    params.exerciseId ? { id: params.exerciseId, title: params.exerciseTitle ?? "", deadline: params.exerciseDeadline || null } : null
  );
  // Raccourci de confort scopé à ce canal de matière — filtre les mêmes
  // messages déjà chargés, jamais une nouvelle source de données.
  const [subjectTab, setSubjectTab] = useState<"messages" | "devoirs_en_cours" | "devoirs_traites">("messages");
  const listRef = useRef<FlatList>(null);

  const { data: messages } = useQuery({
    queryKey: ["channel-messages", id],
    queryFn: () => messagingApi.fetchChannelMessages(id),
    enabled: !!id,
    // Le WebSocket (ci-dessous) porte le temps réel — ce polling n'est
    // qu'un filet de sécurité en cas de coupure/reconnexion silencieuse,
    // volontairement espacé pour ne pas doubler le travail du WebSocket.
    refetchInterval: 25000,
  });

  // Même clé de requête que l'écran de liste : React Query réutilise le
  // cache déjà chargé plutôt que de refaire un appel, juste pour peupler
  // l'en-tête (nom et photo du correspondant, ou icône de groupe).
  const { data: channels } = useQuery({ queryKey: ["channels"], queryFn: messagingApi.fetchChannels });
  const channel = channels?.find((c) => c.id === id);
  const [correspondentFirstName, ...correspondentRest] = (channel?.display_name ?? "").split(" ");
  const CHANNEL_HEADER_ICON = { class: UsersIcon, subject: BookIcon, direct: UsersIcon, internship: BriefcaseIcon };

  useChannelSocket(id, {
    onMessageCreated: (message) => {
      queryClient.setQueryData<Message[]>(["channel-messages", id], (current) => {
        if (!current) return current;
        if (current.some((m) => m.id === message.id)) return current;
        return [...current, message];
      });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
    onMessageUpdated: (message) => {
      queryClient.setQueryData<Message[]>(["channel-messages", id], (current) =>
        current?.map((m) => (m.id === message.id ? message : m)),
      );
    },
    onMessageDeleted: (messageId) => {
      queryClient.setQueryData<Message[]>(["channel-messages", id], (current) =>
        current?.filter((m) => m.id !== messageId),
      );
    },
  });

  useEffect(() => {
    messagingApi.markChannelRead(id).catch(() => {});
  }, [id]);

  // La soumission (endpoint réservé aux comptes élève) ne s'applique que
  // si c'est bien l'élève qui écrit ici — un enseignant qui répond dans le
  // même fil avec un contexte devoir actif envoie un message normal
  // (question de clarification), jamais une soumission.
  const isSubmittingAsStudent = !!exerciseContext && !!user?.child_id;

  const sendMutation = useMutation({
    mutationFn: () => {
      if (isSubmittingAsStudent && exerciseContext) {
        return messagingApi.submitExercise(id, {
          exercise_id: exerciseContext.id,
          content: body.trim(),
          attachments: pendingAttachments,
        });
      }
      return messagingApi.sendMessage(id, { body: body.trim(), attachments: pendingAttachments });
    },
    onSuccess: () => {
      setBody("");
      setPendingAttachments([]);
      queryClient.invalidateQueries({ queryKey: ["channel-messages", id] });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
    onError: (error: unknown) => {
      const detail = (error as { response?: { data?: Record<string, string[]> } })?.response?.data;
      const message = detail ? Object.values(detail).flat().join(" ") : null;
      Alert.alert("Erreur", message || "Impossible d'envoyer ce message.");
    },
  });

  const editMutation = useMutation({
    mutationFn: () => {
      if (!editingMessage) throw new Error("Aucun message en cours d'édition.");
      return messagingApi.editMessage(editingMessage.id, body.trim());
    },
    onSuccess: () => {
      setBody("");
      setEditingMessage(null);
      queryClient.invalidateQueries({ queryKey: ["channel-messages", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: number) => messagingApi.deleteMessage(messageId),
    onSuccess: () => {
      setActionsForMessage(null);
      queryClient.invalidateQueries({ queryKey: ["channel-messages", id] });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });

  const startEditing = (message: Message) => {
    setActionsForMessage(null);
    setEditingMessage(message);
    setBody(message.body);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setBody("");
  };

  const pickPhotos = async () => {
    setAttachSheetVisible(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsMultipleSelection: true, quality: 0.85,
    });
    if (result.canceled) return;
    setPendingAttachments((prev) => [
      ...prev,
      ...result.assets.map((asset) => ({
        uri: asset.uri, name: asset.fileName ?? `photo-${Date.now()}.jpg`, mimeType: asset.mimeType,
      })),
    ]);
  };

  const pickFile = async () => {
    setAttachSheetVisible(false);
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], multiple: true });
    if (result.canceled) return;
    setPendingAttachments((prev) => [
      ...prev,
      ...result.assets.map((asset) => ({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType })),
    ]);
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExercisePress = (exercise: ExerciseCard) => {
    if (channel?.channel_type === "direct") {
      // Déjà dans le bon fil : on affiche/actualise juste le bandeau, on
      // ne propose jamais de répondre ailleurs qu'ici.
      setExerciseContext({ id: exercise.id, title: exercise.title, deadline: exercise.deadline });
      return;
    }
    if (user?.primary_role === "teacher") {
      router.push(`/(app)/teacher/exercise-overview/${exercise.id}`);
      return;
    }
    if (exercise.my_dm_channel_id) {
      const query = new URLSearchParams({
        exerciseId: exercise.id,
        exerciseTitle: exercise.title,
        exerciseDeadline: exercise.deadline ?? "",
      });
      router.push(`/(app)/messages/${exercise.my_dm_channel_id}?${query.toString()}`);
    }
  };

  const handleSend = () => {
    if (editingMessage) editMutation.mutate();
    else sendMutation.mutate();
  };

  const isPending = sendMutation.isPending || editMutation.isPending;
  const canSend = body.trim().length > 0 || pendingAttachments.length > 0;

  const HeaderIcon = channel ? CHANNEL_HEADER_ICON[channel.channel_type] : UsersIcon;
  const isSubjectChannel = channel?.channel_type === "subject";
  const isTeacherRole = user?.primary_role === "teacher";
  const showDevoirsList = isSubjectChannel && subjectTab !== "messages";

  // Élève : même requête (clé + fonction) que l'écran global "Mes devoirs"
  // (student/my-exercises.tsx) — React Query réutilise le cache déjà
  // chargé, jamais une nouvelle source de données. Simplement filtrée ici
  // à la matière de ce canal.
  const { data: mySubjects, isLoading: isLoadingMySubjects } = useQuery({
    queryKey: ["my-subjects"],
    queryFn: virtualClassesApi.fetchMySubjects,
    enabled: showDevoirsList && !isTeacherRole,
  });
  const subjectExercisesForStudent: ChildExercise[] =
    mySubjects?.find((s) => s.id === channel?.subject_id)?.exercises ?? [];
  const devoirsEnCoursStudent = subjectExercisesForStudent.filter(
    (e) => !e.my_submission || e.my_submission.status !== "graded",
  );
  const devoirsCorrigesStudent = subjectExercisesForStudent.filter((e) => e.my_submission?.status === "graded");

  // Enseignant : même requête que teacher/subject/[subjectId].tsx pour la
  // liste (clé "subject-exercises") et que teacher/exercise-overview pour
  // les statistiques par devoir (clé "exercise-stats") — aucune nouvelle
  // requête parallèle, juste la même donnée filtrée à ce canal.
  const { data: subjectExercisesForTeacher, isLoading: isLoadingTeacherExercises } = useQuery({
    queryKey: ["subject-exercises", String(channel?.subject_id)],
    queryFn: () => virtualClassesApi.fetchExercises(channel!.subject_id!),
    enabled: showDevoirsList && isTeacherRole && !!channel?.subject_id,
  });
  const statsQueries = useQueries({
    queries: (subjectExercisesForTeacher ?? []).map((exercise) => ({
      queryKey: ["exercise-stats", exercise.id],
      queryFn: () => virtualClassesApi.fetchExerciseSubmissionStats(exercise.id),
      enabled: showDevoirsList && isTeacherRole,
    })),
  });
  const statsByExerciseId = new Map<string, ExerciseSubmissionStats | undefined>(
    (subjectExercisesForTeacher ?? []).map((exercise, i) => [exercise.id, statsQueries[i]?.data]),
  );
  const devoirsEnCoursTeacher = (subjectExercisesForTeacher ?? []).filter((e) => e.status === "published");
  const devoirsCorrigesTeacher = (subjectExercisesForTeacher ?? []).filter((e) => e.status === "closed");

  const isLoadingDevoirs = isTeacherRole ? isLoadingTeacherExercises : isLoadingMySubjects;
  const devoirsListStudent = subjectTab === "devoirs_en_cours" ? devoirsEnCoursStudent : devoirsCorrigesStudent;
  const devoirsListTeacher = subjectTab === "devoirs_en_cours" ? devoirsEnCoursTeacher : devoirsCorrigesTeacher;

  const visibleMessages = messages ?? [];

  return (
    <KeyboardAvoidingView className="flex-1 bg-xporadia-bg" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View className="flex-row items-center gap-2.5">
              {channel?.channel_type === "direct" ? (
                <Avatar firstName={correspondentFirstName} lastName={correspondentRest.join(" ")} imageUri={channel.avatar} size={32} />
              ) : (
                <View className="h-8 w-8 rounded-full bg-white/15 items-center justify-center">
                  <HeaderIcon size={16} color={Colors.white} />
                </View>
              )}
              <Text className="text-white font-semibold text-base" numberOfLines={1}>
                {channel?.display_name ?? "Conversation"}
              </Text>
            </View>
          ),
        }}
      />
      <ChatBackground />

      {isSubjectChannel ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="grow-0 bg-white border-b border-xporadia-border"
          contentContainerClassName="flex-row items-center gap-2 px-4 py-2.5"
        >
          {(
            [
              ["messages", "Messages"],
              ["devoirs_en_cours", "Devoirs en cours"],
              ["devoirs_traites", "Devoirs corrigés"],
            ] as const
          ).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setSubjectTab(key)}
              className={`rounded-full px-3 py-1.5 ${subjectTab === key ? "bg-xporadia-navy" : "bg-xporadia-bg"}`}
              accessibilityRole="button"
            >
              <Text className={`text-xs font-semibold ${subjectTab === key ? "text-white" : "text-xporadia-text-secondary"}`}>
                {label}
              </Text>
            </Pressable>
          ))}
          {isTeacherRole && channel?.can_publish_exercise && channel?.subject_id ? (
            <Pressable
              onPress={() => {
                if (!channel?.subject_id) return;
                router.push(`/(app)/teacher/grade-grid/${channel.subject_id}`);
              }}
              className="rounded-full px-3 py-1.5 bg-xporadia-bg"
              accessibilityRole="button"
            >
              <Text className="text-xs font-semibold text-xporadia-text-secondary">Notes</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      ) : null}

      {exerciseContext ? (
        <ExerciseContextBanner
          title={exerciseContext.title}
          deadline={exerciseContext.deadline}
          onDismiss={() => setExerciseContext(null)}
        />
      ) : null}

      {params.submissionId && user?.primary_role === "teacher" ? (
        <GradingPanel
          submissionId={Number(params.submissionId)}
          onGraded={() => {
            queryClient.invalidateQueries({ queryKey: ["channel-messages", id] });
          }}
        />
      ) : null}

      {showDevoirsList ? (
        isTeacherRole ? (
          <FlatList
            data={devoirsListTeacher}
            keyExtractor={(exercise) => exercise.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            renderItem={({ item: exercise }) => (
              <TeacherSubjectExerciseRow
                exercise={exercise}
                stats={statsByExerciseId.get(exercise.id)}
                onPress={() => router.push(`/(app)/teacher/exercise-overview/${exercise.id}`)}
              />
            )}
            ListEmptyComponent={
              !isLoadingDevoirs ? (
                <View className="items-center gap-2 py-10">
                  <GraduationCapIcon size={22} color={Colors.textSecondary} />
                  <Text className="text-xs text-xporadia-text-secondary">Aucun devoir dans cette catégorie.</Text>
                </View>
              ) : null
            }
          />
        ) : (
          <FlatList
            data={devoirsListStudent}
            keyExtractor={(exercise) => exercise.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            renderItem={({ item: exercise }) => (
              <StudentSubjectExerciseRow
                exercise={exercise}
                onPress={() => {
                  if (!exercise.my_dm_channel_id) return;
                  const query = new URLSearchParams({
                    exerciseId: exercise.id,
                    exerciseTitle: exercise.title,
                    exerciseDeadline: exercise.deadline ?? "",
                  });
                  router.push(`/(app)/messages/${exercise.my_dm_channel_id}?${query.toString()}`);
                }}
              />
            )}
            ListEmptyComponent={
              !isLoadingDevoirs ? (
                <View className="items-center gap-2 py-10">
                  <GraduationCapIcon size={22} color={Colors.textSecondary} />
                  <Text className="text-xs text-xporadia-text-secondary">Aucun devoir dans cette catégorie.</Text>
                </View>
              ) : null
            }
          />
        )
      ) : (
      <FlatList
        ref={listRef}
        data={visibleMessages}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        renderItem={({ item, index }) => {
          const isMine = item.author.id === user?.id;

          // Carte distincte réservée à l'annonce du devoir elle-même (le
          // message publié par l'enseignant, sans texte ni pièce jointe
          // propre). Une soumission ou une correction porte aussi
          // exercise_id pour rester traçable, mais reste une bulle
          // normale : c'est là que vit le texte/les photos envoyés.
          if (item.exercise && !item.body && item.attachments.length === 0) {
            return (
              <View className="items-center">
                <View style={{ width: "92%" }}>
                  <ExerciseCardMessage exercise={item.exercise} onPress={() => handleExercisePress(item.exercise!)} />
                </View>
              </View>
            );
          }

          const grouped = isGrouped(item, visibleMessages[index - 1]);
          return (
            <Pressable
              onLongPress={() => isMine && setActionsForMessage(item)}
              delayLongPress={280}
              className={`flex-row gap-2 ${grouped ? "mt-0.5" : "mt-3"} ${isMine ? "flex-row-reverse" : ""}`}
            >
              {!isMine ? (
                grouped ? (
                  <View style={{ width: 28 }} />
                ) : (
                  <Avatar
                    firstName={item.author.full_name.split(" ")[0]}
                    lastName={item.author.full_name.split(" ").slice(1).join(" ")}
                    imageUri={item.author.avatar}
                    size={28}
                  />
                )
              ) : null}
              <View className={`max-w-[78%] ${isMine ? "items-end" : "items-start"}`}>
                {!isMine && !grouped ? (
                  <Text className="text-[10px] font-semibold text-xporadia-text-secondary mb-1 ml-1">
                    {item.author.full_name}
                  </Text>
                ) : null}
                <View
                  className={`rounded-2xl px-3.5 py-2 ${
                    isMine
                      ? `bg-xporadia-navy ${grouped ? "rounded-br-2xl" : "rounded-br-md"}`
                      : `bg-white shadow-soft ${grouped ? "rounded-bl-2xl" : "rounded-bl-md"}`
                  }`}
                >
                  {item.attachments.length > 0 ? (
                    <View className="gap-1.5 mb-1.5">
                      {item.attachments.map((attachment: Message["attachments"][number], i: number) =>
                        attachment.type.startsWith("image/") ? (
                          <Image
                            key={i}
                            source={{ uri: attachment.url }}
                            style={{ width: 180, height: 130, borderRadius: 12 }}
                            contentFit="cover"
                          />
                        ) : (
                          <View key={i} className="flex-row items-center gap-2 bg-black/[0.04] rounded-xl px-2.5 py-2">
                            <FileTextIcon size={14} color={isMine ? Colors.white : Colors.orange} />
                            <Text
                              className={`text-xs flex-1 ${isMine ? "text-white/90" : "text-xporadia-text-primary"}`}
                              numberOfLines={1}
                            >
                              {attachment.name}
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  ) : null}
                  {item.body ? (
                    <Text className={`text-sm leading-5 ${isMine ? "text-white" : "text-xporadia-text-primary"}`}>
                      {item.body}
                    </Text>
                  ) : null}
                  <View className="flex-row items-center gap-1 self-end mt-0.5">
                    {item.is_edited ? (
                      <Text className={`text-[9px] ${isMine ? "text-white/50" : "text-xporadia-text-secondary"}`}>
                        modifié
                      </Text>
                    ) : null}
                    <Text className={`text-[9px] ${isMine ? "text-white/60" : "text-xporadia-text-secondary"}`}>
                      {formatTime(item.created_at)}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />
      )}

      <MessageActionsSheet
        visible={!!actionsForMessage}
        onEdit={() => actionsForMessage && startEditing(actionsForMessage)}
        onDelete={() => actionsForMessage && deleteMutation.mutate(actionsForMessage.id)}
        onClose={() => setActionsForMessage(null)}
      />

      <AttachSheet
        visible={attachSheetVisible}
        onClose={() => setAttachSheetVisible(false)}
        onPickPhotos={pickPhotos}
        onPickFile={pickFile}
        onAddExercise={
          channel?.can_publish_exercise
            ? () => {
                setAttachSheetVisible(false);
                router.push({ pathname: "/(app)/messages/publish-exercise", params: { channelId: id } });
              }
            : undefined
        }
      />

      <View className="bg-white border-t border-xporadia-border" style={isSubjectChannel && subjectTab !== "messages" ? { display: "none" } : undefined}>
        {editingMessage ? (
          <View className="flex-row items-center justify-between px-4 pt-2.5">
            <View className="flex-row items-center gap-2">
              <PencilIcon size={12} color={Colors.orange} />
              <Text className="text-xs font-medium text-xporadia-orange-text">Modification du message</Text>
            </View>
            <Text className="text-xs text-xporadia-text-secondary" onPress={cancelEditing} suppressHighlighting>
              Annuler
            </Text>
          </View>
        ) : null}
        <PendingAttachmentsRow attachments={pendingAttachments} onRemove={removePendingAttachment} />
        <View className="flex-row items-center gap-2.5 px-4 py-3">
          {!editingMessage ? (
            <Pressable
              onPress={() => setAttachSheetVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Ajouter une pièce jointe"
              className="h-10 w-10 items-center justify-center"
            >
              <PaperclipIcon size={19} color={Colors.textSecondary} />
            </Pressable>
          ) : null}
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={isSubmittingAsStudent ? "Décrivez votre travail..." : "Écrire un message..."}
            placeholderTextColor="#94A3B8"
            multiline
            className="flex-1 bg-xporadia-bg rounded-2xl px-4 py-3 text-sm text-xporadia-text-primary max-h-24"
          />
          <Pressable
            onPress={handleSend}
            disabled={isPending || !canSend}
            className={`h-10 w-10 rounded-full items-center justify-center ${
              canSend ? "bg-xporadia-orange" : "bg-xporadia-border"
            }`}
            accessibilityRole="button"
            accessibilityLabel="Envoyer"
          >
            <SendIcon size={16} color={Colors.white} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
