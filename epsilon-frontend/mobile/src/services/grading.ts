import api from "@/services/api";

export type JoinRequestStatus = "pending" | "approved" | "rejected";

export interface JoinRequest {
  id: number;
  child: number;
  child_first_name: string;
  child_last_name: string;
  establishment: number | null;
  establishment_name: string;
  other_establishment_name: string;
  declared_level: string;
  status: JoinRequestStatus;
  rejection_reason: string;
  created_at: string;
  reviewed_at: string | null;
}

export const submitJoinRequest = (payload: {
  establishment?: number;
  other_establishment_name?: string;
  declared_level?: string;
}) => api.post<JoinRequest>("/grading/join-requests/", payload).then((r) => r.data);

export const fetchMyJoinRequest = () =>
  api.get<{ join_request: JoinRequest | null }>("/grading/my-join-request/").then((r) => r.data.join_request);

export const fetchDirectorJoinRequests = () =>
  api.get<JoinRequest[]>("/grading/director-join-requests/").then((r) => r.data);

export const reviewJoinRequest = (
  id: number,
  payload: { approve: boolean; rejection_reason?: string; class_id?: number }
) => api.post<JoinRequest>(`/grading/join-requests/${id}/review/`, payload).then((r) => r.data);

export interface AdmissionReportProposal {
  extracted_name: string;
  extracted_status: "admitted" | "rejected" | null;
  matched_join_request_id: number | null;
  matched_child_name: string | null;
  match_score: number;
}

export const parseAdmissionReport = (file: { uri: string; name: string; mimeType?: string | null }) => {
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? "application/octet-stream",
  } as unknown as Blob);
  return api
    .post<{ total_lines: number; proposals: AdmissionReportProposal[] }>(
      "/grading/admission-report/parse/",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    )
    .then((r) => r.data);
};

export interface AdmissionReportDecision {
  join_request_id: number;
  approve: boolean;
  class_id?: number;
}

export const confirmAdmissionReport = (decisions: AdmissionReportDecision[]) =>
  api
    .post<{ processed: number; failed: number; results: { join_request_id: number; success: boolean }[] }>(
      "/grading/admission-report/confirm/",
      { decisions }
    )
    .then((r) => r.data);

export interface SubjectReportEntry {
  subject_name: string;
  subject_average: string | null;
  coefficient: number;
  teacher_comment: string;
}

export interface ReportCard {
  id: number;
  child: number;
  child_first_name: string;
  child_last_name: string;
  term: number;
  term_label: string;
  general_average: string;
  class_average: string;
  rank: number;
  class_size: number;
  homeroom_comment: string;
  document: string | null;
  subject_entries: SubjectReportEntry[];
  published_at: string;
}

export const fetchChildReportCards = (childId: number) =>
  api.get<ReportCard[]>(`/grading/children/${childId}/report-cards/`).then((r) => r.data);
