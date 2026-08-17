import api from "@/services/api";

export type InternshipLevel = "3e" | "2nde" | "1ere" | "terminale";
export type InternshipApplicationStatus = "pending" | "accepted" | "rejected";
export type ConventionStatus = "generated" | "signed_sch" | "signed_ent" | "complete";

export interface CompanyBasic {
  id: number;
  company_name: string;
  address: string;
  avatar: string | null;
}

export interface SchoolBasic {
  id: number;
  school_name: string;
}

export interface ChildBasic {
  id: number;
  first_name: string;
  class_level: string;
}

export interface InternshipOffer {
  id: string;
  company: CompanyBasic;
  title: string;
  domain: string;
  missions: string;
  level: InternshipLevel;
  duration_weeks: number;
  period_start: string;
  period_end: string;
  places: number;
  city: string;
  skills_wanted: string[];
  cover_image: string | null;
  is_premium: boolean;
  is_active: boolean;
  application_count: number;
  created_at: string;
}

export const fetchInternshipOffers = (filters?: { domain?: string; city?: string; level?: InternshipLevel }) =>
  api.get<InternshipOffer[]>("/internships/offers/", { params: filters }).then((r) => r.data);

export const fetchInternshipOffer = (offerId: string) =>
  api.get<InternshipOffer>(`/internships/offers/${offerId}/`).then((r) => r.data);

export const createInternshipOffer = (payload: {
  title: string;
  domain: string;
  missions: string;
  level: InternshipLevel;
  duration_weeks: number;
  period_start: string;
  period_end: string;
  city: string;
  places?: number;
}) => api.post<InternshipOffer>("/internships/offers/", payload).then((r) => r.data);

export const updateInternshipOffer = (offerId: string, payload: { is_active: boolean }) =>
  api.patch<InternshipOffer>(`/internships/offers/${offerId}/`, payload).then((r) => r.data);

export const uploadInternshipOfferCoverImage = (
  offerId: string,
  asset: { uri: string; name: string; mimeType?: string | null },
) => {
  const formData = new FormData();
  formData.append("cover_image", {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType ?? "image/jpeg",
  } as unknown as Blob);
  return api
    .patch<InternshipOffer>(`/internships/offers/${offerId}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export interface InternshipApplication {
  id: string;
  offer: InternshipOffer;
  school: SchoolBasic;
  student: ChildBasic;
  motivation: string;
  status: InternshipApplicationStatus;
  applied_at: string;
  reviewed_at: string | null;
}

export const fetchOfferApplications = (offerId: string) =>
  api.get<InternshipApplication[]>(`/internships/offers/${offerId}/applications/`).then((r) => r.data);

export const applyForInternship = (offerId: string, studentId: number, motivation: string) =>
  api
    .post<InternshipApplication>(`/internships/offers/${offerId}/applications/`, {
      student_id: studentId,
      motivation,
    })
    .then((r) => r.data);

export const fetchMyInternshipApplications = () =>
  api.get<InternshipApplication[]>("/internships/my-applications/").then((r) => r.data);

export const updateInternshipApplicationStatus = (
  applicationId: string,
  status: "accepted" | "rejected"
) =>
  api
    .patch<InternshipApplication>(`/internships/applications/${applicationId}/`, { status })
    .then((r) => r.data);

export interface InternshipConvention {
  id: string;
  application: InternshipApplication;
  position_title: string;
  document: string | null;
  pdf_url: string;
  status: ConventionStatus;
  channel_id: number | null;
  signed_by_school_at: string | null;
  signed_by_company_at: string | null;
  generated_at: string;
  has_company_review: boolean;
  can_review_company: boolean;
}

export const fetchMyConventions = () =>
  api.get<InternshipConvention[]>("/internships/my-conventions/").then((r) => r.data);

export const submitCompanyReview = (
  conventionId: string,
  payload: { atmosphere: number; mentorship: number; role_accuracy: number; learning_value: number; comment?: string }
) => api.post(`/internships/conventions/${conventionId}/company-review/`, payload);

export const signConvention = (conventionId: string) =>
  api.post<InternshipConvention>(`/internships/conventions/${conventionId}/sign/`).then((r) => r.data);

export interface InternshipJournalEntry {
  id: string;
  date: string;
  content: string;
  photos: string[];
  created_at: string;
}

export const fetchConventionJournal = (conventionId: string) =>
  api.get<InternshipJournalEntry[]>(`/internships/conventions/${conventionId}/journal/`).then((r) => r.data);

export const createJournalEntry = (conventionId: string, date: string, content: string) =>
  api
    .post<InternshipJournalEntry>(`/internships/conventions/${conventionId}/journal/`, { date, content })
    .then((r) => r.data);

export interface InternshipEvaluation {
  id: string;
  evaluator_type: "company";
  punctuality: number | null;
  initiative: number | null;
  integration: number | null;
  skills: number | null;
  global_rating: number | null;
  comment: string;
  attestation_url: string;
  created_at: string;
}

export const fetchConventionEvaluations = (conventionId: string) =>
  api.get<InternshipEvaluation[]>(`/internships/conventions/${conventionId}/evaluations/`).then((r) => r.data);

export const createEvaluation = (
  conventionId: string,
  payload: {
    punctuality: number;
    initiative: number;
    integration: number;
    skills: number;
    global_rating: number;
    comment?: string;
  }
) =>
  api
    .post<InternshipEvaluation>(`/internships/conventions/${conventionId}/evaluations/`, payload)
    .then((r) => r.data);
