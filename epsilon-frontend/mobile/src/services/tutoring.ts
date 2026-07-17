import api from "@/services/api";

export type MobileOperator = "orange" | "wave" | "mtn";
export type SessionMode = "home" | "teacher" | "online";
export type TutoringSessionStatus =
  | "pending"
  | "confirmed"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "disputed";
export type PaymentStatus = "pending" | "escrow" | "completed" | "failed" | "refunded" | "cancelled";

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  operator: MobileOperator;
  status: PaymentStatus;
  payment_type: string;
  tx_ref: string;
  created_at: string;
  completed_at: string | null;
}

export interface TutoringUser {
  id: number;
  first_name: string;
  last_name: string;
}

export interface TutoringSession {
  id: string;
  teacher: TutoringUser;
  parent: TutoringUser;
  child_name: string;
  child_level: string;
  subject: string;
  mode: SessionMode;
  date: string;
  start_time: string;
  duration_min: number;
  address: string;
  note_for_teacher: string;
  gross_amount: number;
  net_amount: number | null;
  status: TutoringSessionStatus;
  cancel_reason: string;
  payment: Payment | null;
  created_at: string;
}

export interface BookTutoringSessionInput {
  teacher_id: number;
  child_name: string;
  child_level: string;
  subject: string;
  mode: SessionMode;
  date: string;
  start_time: string;
  duration_min: number;
  address?: string;
  note_for_teacher?: string;
  operator: MobileOperator;
  phone_number: string;
}

export interface TutoringReview {
  id: number;
  session: string;
  author_name: string;
  author_type: string;
  rating: number;
  comment: string;
  teacher_reply: string;
  created_at: string;
}

export const fetchMyTutoringSessions = () =>
  api.get<TutoringSession[]>("/tutoring/my-sessions/").then((r) => r.data);

export const bookTutoringSession = (payload: BookTutoringSessionInput) =>
  api.post<TutoringSession>("/tutoring/my-sessions/", payload).then((r) => r.data);

export const updateTutoringSessionStatus = (
  id: string,
  payload: { status: "completed" | "cancelled"; cancel_reason?: string }
) => api.patch<TutoringSession>(`/tutoring/sessions/${id}/`, payload).then((r) => r.data);

export const fetchSessionReviews = (sessionId: string) =>
  api.get<TutoringReview[]>(`/tutoring/sessions/${sessionId}/reviews/`).then((r) => r.data);

export const createSessionReview = (sessionId: string, payload: { rating: number; comment?: string }) =>
  api.post<TutoringReview>(`/tutoring/sessions/${sessionId}/reviews/`, payload).then((r) => r.data);

export const fetchMyPayments = () => api.get<Payment[]>("/payments/my-payments/").then((r) => r.data);
