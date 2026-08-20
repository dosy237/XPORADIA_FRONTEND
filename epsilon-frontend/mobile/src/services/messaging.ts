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
}

export interface Message {
  id: number;
  channel: number;
  author: ChannelMember;
  body: string;
  attachments: { name: string; url: string; type: string }[];
  exercise_id: string | null;
  is_pinned: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export const fetchChannels = () => api.get<Channel[]>("/messaging/channels/").then((r) => r.data);

export const fetchChannelMessages = (channelId: number) =>
  api.get<{ results: Message[] }>(`/messaging/channels/${channelId}/messages/`).then((r) => r.data.results);

export const sendMessage = (
  channelId: number,
  payload: { body: string; attachments?: { name: string; url: string; type: string }[] },
) => api.post<Message>(`/messaging/channels/${channelId}/messages/`, payload).then((r) => r.data);

export const markChannelRead = (channelId: number) => api.post(`/messaging/channels/${channelId}/read/`);

export const editMessage = (messageId: number, body: string) =>
  api.patch<Message>(`/messaging/messages/${messageId}/`, { body }).then((r) => r.data);

export const deleteMessage = (messageId: number) => api.delete(`/messaging/messages/${messageId}/`);

export const createSubjectChannel = (subjectId: number) =>
  api.post<Channel>(`/messaging/subjects/${subjectId}/create-channel/`).then((r) => r.data);
