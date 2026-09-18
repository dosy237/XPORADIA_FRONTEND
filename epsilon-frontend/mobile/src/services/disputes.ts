import api from "@/services/api";

export type DisputeStatus = "open" | "reviewed" | "resolved" | "closed";

export interface Dispute {
  id: number;
  payment: string;
  payment_amount: number;
  payment_type: string;
  opened_by: number;
  opened_by_name: string;
  reason: string;
  status: DisputeStatus;
  resolution: string;
  resolved_at: string | null;
  created_at: string;
}

export const openDispute = (paymentId: string, reason: string) =>
  api.post<Dispute>(`/payments/payments/${paymentId}/dispute/`, { reason }).then((r) => r.data);

export const fetchAdminDisputes = (status?: DisputeStatus) =>
  api.get<Dispute[]>("/payments/admin/disputes/", { params: { status } }).then((r) => r.data);

export const resolveDispute = (disputeId: number, payload: { status: "resolved" | "closed"; resolution: string }) =>
  api.post<Dispute>(`/payments/admin/disputes/${disputeId}/resolve/`, payload).then((r) => r.data);
