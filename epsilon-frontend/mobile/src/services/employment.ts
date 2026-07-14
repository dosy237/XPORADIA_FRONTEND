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
  email: string;
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
  cert_level_required: "bronze" | "silver" | "gold";
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
  cert_level_required?: "bronze" | "silver" | "gold";
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
  payload: { status: ApplicationStatus; salary_agreed?: number }
) => api.patch<JobApplication>(`/employment/applications/${applicationId}/`, payload).then((r) => r.data);

export interface Recruitment {
  id: string;
  teacher: TeacherBasic;
  salary_agreed: number;
  commission_rate: string;
  commission_amount: number | null;
  payment_status: string;
  confirmed_at: string;
}

export const fetchMyRecruitments = () =>
  api.get<Recruitment[]>("/employment/my-recruitments/").then((r) => r.data);

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
  api.get<JobSeekingRequest | null>("/employment/my-job-seeking-request/").then((r) => r.data);

export const deleteMyJobSeekingRequest = () => api.delete("/employment/my-job-seeking-request/");
