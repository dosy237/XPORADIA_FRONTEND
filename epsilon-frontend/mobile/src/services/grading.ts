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

export const fetchMyReportCards = () =>
  api.get<ReportCard[]>("/grading/my-report-cards/").then((r) => r.data);

export interface Term {
  id: number;
  school_year: string;
  number: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export const fetchSubjectTerms = (subjectId: number) =>
  api.get<Term[]>(`/grading/subjects/${subjectId}/terms/`).then((r) => r.data);

export type EvalType = "homework" | "quiz" | "exam";

export const EVAL_TYPE_LABELS: Record<EvalType, string> = {
  homework: "Devoir",
  quiz: "Interrogation",
  exam: "Composition",
};

export interface Evaluation {
  id: number;
  subject: number;
  subject_name: string;
  term: number;
  title: string;
  eval_type: EvalType;
  coefficient: number;
  /** Barème de cette évaluation (ex : 10, 20, 40) — toujours affiché en
   * badge dans la grille pour ne jamais confondre l'échelle en saisissant. */
  max_score: number;
  date: string;
  created_at: string;
}

/** Crée une nouvelle évaluation depuis le tableur de notes — endpoint
 * existant (EvaluationListCreateView), réutilisé tel quel. */
export const createEvaluation = (
  subjectId: number,
  payload: { term: number; title: string; eval_type: EvalType; coefficient: number; max_score: number; date: string }
) => api.post<Evaluation>(`/grading/subjects/${subjectId}/evaluations/`, payload).then((r) => r.data);

export interface GradeGridCell {
  score: string | null;
  is_excused: boolean;
}

export interface GradeGridStudent {
  child_id: number;
  first_name: string;
  last_name: string;
  avatar: string | null;
  /** Clé = id de l'évaluation (en string, car clé d'objet JSON). */
  grades: Record<string, GradeGridCell | null>;
  /** Moyenne de CETTE matière uniquement pour ce trimestre — jamais
   * pondérée par Subject.coefficient, jamais la moyenne générale. */
  subject_average: string | null;
}

export interface GradeGrid {
  subject: number;
  term: Term;
  evaluations: Evaluation[];
  students: GradeGridStudent[];
}

export const fetchGradeGrid = (subjectId: number, termId: number) =>
  api.get<GradeGrid>(`/grading/subjects/${subjectId}/terms/${termId}/grade-grid/`).then((r) => r.data);

export interface GradeGridEntry {
  evaluation: number;
  child: number;
  score: string | null;
  is_excused: boolean;
}

export interface GradeGridSaveResult {
  saved: {
    id: number;
    evaluation: number;
    child: number;
    child_first_name: string;
    child_last_name: string;
    score: string | null;
    is_excused: boolean;
  }[];
  /** Clé = id élève (en string) -> nouvelle moyenne de matière. */
  updated_averages: Record<string, string | null>;
}

/** Sauvegarde une ou plusieurs notes en une fois — même endpoint que la
 * lecture de la grille (POST), réutilise/étend BulkGradeEntrySerializer
 * plutôt qu'un nouveau format. */
export const saveGradeGridEntries = (subjectId: number, termId: number, entries: GradeGridEntry[]) =>
  api
    .post<GradeGridSaveResult>(`/grading/subjects/${subjectId}/terms/${termId}/grade-grid/`, entries)
    .then((r) => r.data);
