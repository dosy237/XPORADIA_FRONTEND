import api from "@/services/api";

export interface FeeInstallment {
  id: number;
  name: string;
  amount: number;
  due_date: string;
}

export interface FeeSchedule {
  id: number;
  school_year: string;
  installments: FeeInstallment[];
  created_at: string;
}

export type InstallmentStatusValue = "paid" | "partial" | "late" | "pending";

export interface InstallmentStatusEntry {
  installment: FeeInstallment;
  amount_paid: number;
  amount_due: number;
  status: InstallmentStatusValue;
}

export type PaymentChannel = "cash" | "mobile_money" | "bank_transfer" | "other";

export interface FeePayment {
  id: number;
  child: number;
  fee_installment: number;
  amount_paid: number;
  payment_channel: PaymentChannel;
  paid_at: string;
  recorded_by: number | null;
  recorded_by_name: string;
}

export interface ChildFeeStatus {
  schedule: FeeSchedule | null;
  installments: InstallmentStatusEntry[];
  payments: FeePayment[];
}

export interface LateFamily {
  child_id: number;
  child_name: string;
  late_installments: string[];
}

export interface FeeDashboard {
  total_expected: number;
  total_collected: number;
  late_families: LateFamily[];
}

/** Renvoie null quand aucun échéancier n'existe encore pour cette année
 * scolaire (le backend répond alors 404) — cas normal en tout début de
 * configuration, à ne pas traiter comme une erreur. */
export const fetchFeeSchedule = (schoolYear: string) =>
  api
    .get<FeeSchedule>(`/tuition/fee-schedule/?school_year=${encodeURIComponent(schoolYear)}`)
    .then((r) => r.data)
    .catch((error) => {
      if (error?.response?.status === 404) return null;
      throw error;
    });

export const createFeeSchedule = (schoolYear: string) =>
  api.post<FeeSchedule>("/tuition/fee-schedule/", { school_year: schoolYear }).then((r) => r.data);

export const createFeeInstallment = (
  scheduleId: number,
  payload: { name: string; amount: number; due_date: string }
) => api.post<FeeInstallment>(`/tuition/fee-schedules/${scheduleId}/installments/`, payload).then((r) => r.data);

export const deleteFeeInstallment = (installmentId: number) =>
  api.delete(`/tuition/fee-installments/${installmentId}/`);

export const fetchChildFeeStatus = (childId: number) =>
  api.get<ChildFeeStatus>(`/tuition/children/${childId}/fees/`).then((r) => r.data);

export const recordFeePayment = (
  childId: number,
  installmentId: number,
  payload: { amount_paid: number; payment_channel: PaymentChannel }
) =>
  api
    .post<FeePayment>(`/tuition/children/${childId}/fees/installments/${installmentId}/payments/`, payload)
    .then((r) => r.data);

export const remindLateFamily = (childId: number) =>
  api.post<{ detail: string }>(`/tuition/children/${childId}/fees/remind/`).then((r) => r.data);

export const fetchFeeDashboard = (schoolYear: string) =>
  api.get<FeeDashboard>(`/tuition/fee-dashboard/?school_year=${encodeURIComponent(schoolYear)}`).then(
    (r) => r.data
  );
