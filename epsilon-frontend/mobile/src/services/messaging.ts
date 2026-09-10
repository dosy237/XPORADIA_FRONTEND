import { appendFileAsset } from "@/lib/formDataAsset";
import api from "@/services/api";
import type { UserRole } from "@/types/user";

export type ChannelType = "class" | "subject" | "direct" | "internship";

export interface ChannelMember {
  id: number;
  full_name: string;
  avatar: string | null;
  primary_role: UserRole;
  role_label: string;
}

export interface Channel {
  id: number;
  channel_type: ChannelType;
  subject_id: number | null;
  display_name: string;
  subtitle: string;
  /** Photo du correspondant — uniquement pour un canal "direct" (une
   * vraie personne). Toujours nul pour un canal de classe/matière/stage,
   * qui représente un groupe plutôt qu'une seule personne. */
  avatar: string | null;
  last_message: { body: string; author_name: string; created_at: string } | null;
  unread_count: number;
  is_archived: boolean;
  created_at: string;
  /** Vrai uniquement pour l'enseignant dédié de ce canal de matière — sert à afficher "Ajouter un devoir". */
  can_publish_exercise: boolean;
}

export type ExerciseKind = "homework" | "exam";
export type ExerciseStatus = "draft" | "published" | "closed";
export type SubmissionStatus = "submitted" | "graded";

/** Représentation légère d'un devoir pour l'afficher en carte distincte
 * dans le fil (voir Message.exercise) — les consignes complètes restent
 * sur l'écran dédié à la matière. */
export interface ExerciseCard {
  id: string;
  kind: ExerciseKind;
  title: string;
  subject_name: string;
  deadline: string | null;
  status: ExerciseStatus;
  is_overdue: boolean;
  attachments: { name: string; url: string; type: string }[];
  /** Statut de la soumission de l'utilisateur courant pour ce devoir, ou
   * null s'il n'est pas élève ou n'a encore rien soumis. */
  my_submission_status: SubmissionStatus | null;
  /** DM déjà existante avec l'enseignant dédié — le tap sur la carte y bascule directement. */
  my_dm_channel_id: number | null;
}

export interface Message {
  id: number;
  channel: number;
  author: ChannelMember;
  body: string;
  attachments: { name: string; url: string; type: string }[];
  exercise_id: string | null;
  /** Non nul si exercise_id l'est : à afficher comme une carte distincte,
   * jamais comme une bulle de message classique. */
  exercise: ExerciseCard | null;
  is_pinned: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

/** Fichier choisi côté appareil (photo, PDF...), pas encore transféré. */
export interface LocalAsset {
  uri: string;
  name: string;
  mimeType?: string | null;
}

async function appendAttachments(formData: FormData, attachments?: LocalAsset[]) {
  for (const asset of attachments ?? []) {
    await appendFileAsset(formData, "attachments", asset);
  }
}

export const fetchChannels = () => api.get<Channel[]>("/messaging/channels/").then((r) => r.data);

export const fetchChannelMessages = (channelId: number) =>
  api.get<Message[]>(`/messaging/channels/${channelId}/messages/`).then((r) => r.data);

export const sendMessage = async (
  channelId: number,
  payload: { body: string; attachments?: LocalAsset[] },
) => {
  const formData = new FormData();
  formData.append("body", payload.body);
  await appendAttachments(formData, payload.attachments);
  return api
    .post<Message>(`/messaging/channels/${channelId}/messages/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const markChannelRead = (channelId: number) => api.post(`/messaging/channels/${channelId}/read/`);

export const editMessage = (messageId: number, body: string) =>
  api.patch<Message>(`/messaging/messages/${messageId}/`, { body }).then((r) => r.data);

export const deleteMessage = (messageId: number) => api.delete(`/messaging/messages/${messageId}/`);

export const createSubjectChannel = (subjectId: number) =>
  api.post<Channel>(`/messaging/subjects/${subjectId}/create-channel/`).then((r) => r.data);

export const contactClassmate = (classmateId: number) =>
  api.post<Channel>("/messaging/contact-classmate/", { classmate_id: classmateId }).then((r) => r.data);

export interface PublishExercisePayload {
  title: string;
  instructions: string;
  kind: ExerciseKind;
  /** ISO datetime, obligatoire : cette publication rapide (depuis le "+"
   * du canal de matière) ne passe jamais par l'étape brouillon. */
  deadline: string;
  attachments?: LocalAsset[];
}

/** Publie un devoir/examen directement dans un canal de matière — action
 * "Ajouter un devoir" réservée à l'enseignant dédié. Renvoie le message
 * carte créé (avec sa donnée `exercise` imbriquée), pas l'Exercise brut. */
export const publishExercise = async (channelId: number, payload: PublishExercisePayload) => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("instructions", payload.instructions);
  formData.append("kind", payload.kind);
  formData.append("deadline", payload.deadline);
  await appendAttachments(formData, payload.attachments);
  return api
    .post<Message>(`/messaging/channels/${channelId}/exercises/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export interface SubmitExercisePayload {
  exercise_id: string;
  content: string;
  attachments?: LocalAsset[];
}

/** Soumet un devoir depuis la DM avec l'enseignant — crée ou met à jour la
 * Submission de l'élève et publie le message correspondant dans ce même
 * fil, exercise_id renseigné pour rester traçable dans l'historique. */
export const submitExercise = async (channelId: number, payload: SubmitExercisePayload) => {
  const formData = new FormData();
  formData.append("exercise_id", payload.exercise_id);
  formData.append("content", payload.content);
  await appendAttachments(formData, payload.attachments);
  return api
    .post<Message>(`/messaging/channels/${channelId}/submit-exercise/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};
