import api from "@/services/api";

export type NotificationType =
  | "new_job_offer"
  | "application_viewed"
  | "exam_available"
  | "exam_result"
  | "session_confirmed"
  | "session_cancelled"
  | "payment_received"
  | "cert_expiry"
  | "new_message"
  | "exercise_submitted"
  | "correction_ready"
  | "recruitment"
  | "stage_update"
  | "system";

export interface AppNotification {
  id: string;
  notif_type: NotificationType;
  channel: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const fetchNotifications = () =>
  api.get<AppNotification[]>("/notifications/").then((r) => r.data);

export const markNotificationRead = (id: string) =>
  api.post<AppNotification>(`/notifications/${id}/read/`).then((r) => r.data);
