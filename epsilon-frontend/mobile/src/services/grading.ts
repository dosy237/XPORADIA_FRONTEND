import api from "@/services/api";
import type { SchoolClass } from "@/services/academics";

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

/** Classes pour le placement lors du traitement d'une demande de
 * rattachement — accessible au directeur ou à l'enseignant délégué pour
 * les rattachements, jamais à un enseignant ordinaire. */
export const fetchClassesForJoinRequestPlacement = () =>
  api.get<SchoolClass[]>("/grading/classes-for-join-requests/").then((r) => r.data);

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
  teacher_name: string;
  category: "letters" | "sciences" | "other";
}

export type ReportCardDistinction =
  | "none" | "honor_roll" | "honor_roll_encouragement" | "honor_roll_congratulations" | "refused";
export type ReportCardSanction =
  | "none" | "work_warning" | "work_reprimand" | "conduct_warning" | "conduct_reprimand";

export interface ReportCard {
  id: number;
  child: number;
  child_first_name: string;
  child_last_name: string;
  term: number;
  term_label: string;
  general_average: string;
  class_average: string;
  highest_average: string | null;
  lowest_average: string | null;
  rank: number;
  class_size: number;
  homeroom_comment: string;
  justified_absence_hours: string;
  unjustified_absence_hours: string;
  distinction: ReportCardDistinction;
  distinction_label: string;
  sanction: ReportCardSanction;
  sanction_label: string;
  document: string | null;
  subject_entries: SubjectReportEntry[];
  published_at: string;
  /** Traçabilité minimale : qui a publié en dernier (une republication
   * écrase le bulletin précédent), quand. Absent si le compte a depuis
   * été supprimé. */
  updated_by_name: string | null;
  updated_at: string;
}

export const fetchChildReportCards = (childId: number) =>
  api.get<ReportCard[]>(`/grading/children/${childId}/report-cards/`).then((r) => r.data);

export const fetchMyReportCards = () =>
  api.get<ReportCard[]>("/grading/my-report-cards/").then((r) => r.data);

export interface MyGradeEvaluation {
  id: number;
  title: string;
  eval_type: string;
  score: string;
  max_score: number;
  coefficient: number;
  date: string;
}

export interface MyGradeTermEntry {
  term_id: number;
  term_label: string;
  subject_average: string | null;
  evaluations: MyGradeEvaluation[];
}

export interface MyGradeSubject {
  subject_id: number;
  subject_name: string;
  coefficient: number;
  terms: MyGradeTermEntry[];
}

/** Notes chiffrées "en direct" de l'élève connecté, groupées par matière
 * puis par trimestre — jamais liées à la publication d'un bulletin
 * (contrairement à fetchMyReportCards), pour ne jamais dépendre d'une
 * action enseignant que l'élève ne contrôle pas. */
export const fetchMyGrades = () => api.get<MyGradeSubject[]>("/grading/my-grades/").then((r) => r.data);

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
  /** Traçabilité minimale : qui a saisi/modifié cette note en dernier,
   * quand — surtout utile après une réaffectation de matière en cours
   * d'année. Absent (jamais saisie ou saisie par un compte supprimé). */
  updated_by_name: string | null;
  updated_at: string;
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
  /** Brouillon d'appréciation de matière — copié dans le bulletin figé
   * au moment de la génération, modifiable jusque-là. */
  appreciation: string;
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
    updated_by_name: string | null;
    updated_at: string;
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

/** Sauvegarde le brouillon d'appréciation de matière d'UN élève, depuis
 * le tableur — un élève à la fois, même geste que la saisie des notes. */
export const saveSubjectAppreciation = (subjectId: number, termId: number, childId: number, comment: string) =>
  api
    .post<{ child_id: number; comment: string }>(
      `/grading/subjects/${subjectId}/terms/${termId}/students/${childId}/appreciation/`,
      { comment }
    )
    .then((r) => r.data);

/** Trimestre en cours de l'établissement d'une classe — alimente l'écran
 * "Bulletins du trimestre" sans que le titulaire ait à le choisir
 * manuellement, quand un trimestre actif existe. */
export const fetchActiveTerm = (classId: number) =>
  api.get<Term>(`/grading/classes/${classId}/active-term/`).then((r) => r.data);

/** Tous les trimestres de l'établissement d'une classe — repli quand
 * aucun trimestre n'est marqué actif (fetchActiveTerm renvoie alors une
 * 404), pour que le titulaire choisisse manuellement plutôt que de
 * rester bloqué. */
export const fetchClassTerms = (classId: number) =>
  api.get<Term[]>(`/grading/classes/${classId}/terms/`).then((r) => r.data);

export interface ClassReportPreviewEntry {
  child: number;
  first_name: string;
  last_name: string;
  general_average: string;
  rank: number;
  avatar: string | null;
}

export interface ClassReportPreview {
  class_average: string | null;
  ranked: ClassReportPreviewEntry[];
  without_average: { child: number; first_name: string; last_name: string }[];
}

/** Aperçu en direct des moyennes — rien n'est encore écrit en base à ce
 * stade, réutilisé tel quel depuis ClassReportPreviewView. */
export const fetchClassReportPreview = (classId: number, termId: number) =>
  api
    .get<ClassReportPreview>(`/grading/classes/${classId}/terms/${termId}/report-preview/`)
    .then((r) => r.data);

export interface GenerateReportCardsPayload {
  homeroom_comments: Record<string, string>;
  // Toutes optionnelles : absences/distinction/sanction non renseignées ->
  // 0 heure, distinction suggérée automatiquement (voir
  // services.suggest_distinction côté backend), aucune sanction.
  absences?: Record<string, { justified?: number; unjustified?: number }>;
  distinctions?: Record<string, ReportCardDistinction>;
  sanctions?: Record<string, ReportCardSanction>;
}

/** Génère ET publie les bulletins de TOUTE la classe en un seul appel —
 * réutilise GenerateReportCardsView, jamais élève par élève. Réservé au
 * titulaire de la classe (ou au directeur en supervision). */
export const generateReportCards = (classId: number, termId: number, payload: GenerateReportCardsPayload) =>
  api
    .post<ReportCard[]>(`/grading/classes/${classId}/terms/${termId}/generate-report-cards/`, payload)
    .then((r) => r.data);

// Bulletins déjà publiés d'une classe pour un trimestre — accessible au
// titulaire, à tout enseignant dédié d'une matière de cette classe, et au
// directeur (voir ClassReportCardsView côté backend). Distinct de
// fetchClassReportPreview : ici on ne lit que des bulletins déjà figés.
export const fetchClassReportCards = (classId: number, termId: number) =>
  api.get<ReportCard[]>(`/grading/classes/${classId}/terms/${termId}/report-cards/`).then((r) => r.data);
