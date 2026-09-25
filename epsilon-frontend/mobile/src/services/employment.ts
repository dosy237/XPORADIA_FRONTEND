import api from "@/services/api";

export type ContractType = "cdi" | "cdd" | "vacation" | "interim";
export type JobStatus = "draft" | "active" | "closed" | "expired";
export type ApplicationStatus = "pending" | "viewed" | "interview" | "accepted" | "rejected" | "withdrawn";

export interface SchoolBasic {
  id: number;
  school_name: string;
  address: string;
}

export interface TeacherBasic {
  id: number;
  first_name: string;
  last_name: string;
  avatar: string | null;
}

export interface JobListing {
  id: string;
  school: SchoolBasic;
  title: string;
  subject: string;
  levels: string[];
  contract_type: ContractType;
  salary_min: number | null;
  salary_max: number | null;
  cert_level_required: "zero" | "bronze" | "silver" | "gold" | "platinum" | "diamond";
  description: string;
  city: string;
  commune: string;
  start_date: string | null;
  status: JobStatus;
  application_count: number;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
}

// GET /employment/listings/ retourne, selon l'appelant (voir API) : le
// catalogue public des offres actives pour un visiteur/enseignant, ou les
// offres du directeur connecté (tous statuts, y compris brouillons) pour lui.
export const fetchJobListings = (filters?: { subject?: string; city?: string; contract_type?: ContractType }) =>
  api.get<JobListing[]>("/employment/listings/", { params: filters }).then((r) => r.data);

export const fetchJobListing = (listingId: string) =>
  api.get<JobListing>(`/employment/listings/${listingId}/`).then((r) => r.data);

export const createJobListing = (payload: {
  title: string;
  subject: string;
  contract_type: ContractType;
  description: string;
  city: string;
  commune?: string;
  levels?: string[];
  salary_min?: number;
  salary_max?: number;
  cert_level_required?: "zero" | "bronze" | "silver" | "gold" | "platinum" | "diamond";
  targeted_teacher_emails?: string[];
}) => api.post<JobListing>("/employment/listings/", payload).then((r) => r.data);

export const publishJobListing = (listingId: string) =>
  api.post<JobListing>(`/employment/listings/${listingId}/publish/`).then((r) => r.data);

export const closeJobListing = (listingId: string) =>
  api.post<JobListing>(`/employment/listings/${listingId}/close/`).then((r) => r.data);

export interface JobApplication {
  id: string;
  teacher: TeacherBasic;
  listing: JobListing;
  cover_letter: string;
  status: ApplicationStatus;
  applied_at: string;
  viewed_at: string | null;
  rejection_reason: string;
}

export const fetchListingApplications = (listingId: string) =>
  api.get<JobApplication[]>(`/employment/listings/${listingId}/applications/`).then((r) => r.data);

export const applyToListing = (listingId: string, coverLetter: string) =>
  api
    .post<JobApplication>(`/employment/listings/${listingId}/applications/`, { cover_letter: coverLetter })
    .then((r) => r.data);

export const fetchMyApplications = () =>
  api.get<JobApplication[]>("/employment/my-applications/").then((r) => r.data);

export const updateApplicationStatus = (
  applicationId: string,
  payload: {
    status: ApplicationStatus;
    salary_agreed?: number;
    hourly_rate_teacher?: number;
    hourly_rate_billed?: number;
  }
) => api.patch<JobApplication>(`/employment/applications/${applicationId}/`, payload).then((r) => r.data);

export interface Recruitment {
  id: string;
  teacher: TeacherBasic;
  contract_type: ContractType;
  salary_agreed: number | null;
  hourly_rate_teacher: number | null;
  hourly_rate_billed: number | null;
  requires_declared_hours: boolean;
  commission_rate: string;
  commission_amount: number | null;
  payment_status: string;
  confirmed_at: string;
  can_review: boolean;
  has_review: boolean;
}

export const fetchMyRecruitments = () =>
  api.get<Recruitment[]>("/employment/my-recruitments/").then((r) => r.data);

export const fetchMySchoolRecruitments = () =>
  api.get<Recruitment[]>("/employment/my-school-recruitments/").then((r) => r.data);

export const submitEmployerReview = (
  recruitmentId: string,
  payload: {
    atmosphere: number;
    contract_respect: number;
    working_conditions: number;
    payment_timeliness: number;
    comment?: string;
  }
) => api.post(`/employment/recruitments/${recruitmentId}/review/`, payload);

export type WorkedHoursStatus = "pending" | "approved" | "rejected";

export interface WorkedHours {
  id: number;
  recruitment: string;
  date: string;
  hours: string;
  note: string;
  status: WorkedHoursStatus;
  declared_at: string;
  reviewed_at: string | null;
  rejection_reason: string;
}

export const fetchWorkedHours = (recruitmentId: string) =>
  api.get<WorkedHours[]>(`/employment/recruitments/${recruitmentId}/worked-hours/`).then((r) => r.data);

export const declareWorkedHours = (recruitmentId: string, payload: { date: string; hours: number; note?: string }) =>
  api.post<WorkedHours>(`/employment/recruitments/${recruitmentId}/worked-hours/`, payload).then((r) => r.data);

export const reviewWorkedHours = (id: number, payload: { approve: boolean; rejection_reason?: string }) =>
  api.post<WorkedHours>(`/employment/worked-hours/${id}/review/`, payload).then((r) => r.data);

export interface PayrollEntry {
  id: number;
  recruitment: string;
  school_name: string;
  period_year: number;
  period_month: number;
  total_hours: string;
  hourly_rate_teacher: number;
  gross_amount: number;
  created_at: string;
}

export interface WalletTransaction {
  id: number;
  payroll_entry: PayrollEntry;
  amount: number;
  created_at: string;
}

export const fetchMyWallet = () =>
  api.get<{ balance: number; transactions: WalletTransaction[] }>("/employment/my-wallet/").then((r) => r.data);

export type InvoiceStatus = "unpaid" | "paid";

export interface EstablishmentInvoice {
  id: number;
  period_year: number;
  period_month: number;
  total_amount: number;
  status: InvoiceStatus;
  created_at: string;
  paid_at: string | null;
}

export const fetchMyInvoices = () =>
  api.get<EstablishmentInvoice[]>("/employment/my-invoices/").then((r) => r.data);

export const payInvoice = (
  invoiceId: number,
  payload:
    | { method: "mobile_money"; operator: string; phone_number: string }
    | { method: "bank_card"; card_number: string; card_holder_name: string }
) => api.post<EstablishmentInvoice>(`/employment/invoices/${invoiceId}/pay/`, payload).then((r) => r.data);

export interface SalaryBenchmark {
  current_level: "zero" | "bronze" | "silver" | "gold" | "platinum" | "diamond" | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  current_income: number | null;
  income_source: "cdi" | "hourly_last_month" | null;
  position: "below" | "within" | "above" | null;
}

export const fetchMySalaryBenchmark = () =>
  api.get<SalaryBenchmark>("/employment/my-salary-benchmark/").then((r) => r.data);

export interface JobSeekingRequest {
  id: number;
  teacher: TeacherBasic;
  subjects: string[];
  city: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

export const fetchJobSeekingRequests = (filters?: { city?: string }) =>
  api.get<JobSeekingRequest[]>("/employment/job-seeking-requests/", { params: filters }).then((r) => r.data);

export const postJobSeekingRequest = (payload: { message: string; city?: string; subjects?: string[] }) =>
  api.post<JobSeekingRequest>("/employment/job-seeking-requests/", payload).then((r) => r.data);

export const fetchMyJobSeekingRequest = () =>
  api.get<{ request: JobSeekingRequest | null }>("/employment/my-job-seeking-request/").then((r) => r.data.request);

export const deleteMyJobSeekingRequest = () => api.delete("/employment/my-job-seeking-request/");
