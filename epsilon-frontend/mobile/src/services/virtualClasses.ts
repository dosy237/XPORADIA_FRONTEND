import api from "@/services/api";

export type ExerciseStatus = "draft" | "published" | "closed";
export type ExerciseKind = "homework" | "exam";

export interface Exercise {
  id: string;
  kind: ExerciseKind;
  title: string;
  instructions: string;
  attachments: string[];
  deadline: string | null;
  status: ExerciseStatus;
  is_overdue: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VirtualClass {
  id: string;
  subject: number;
  subject_name: string;
  school_class_name: string;
  description: string;
  is_active: boolean;
  exercise_count: number;
  created_at: string;
  updated_at: string;
}

export const fetchSubjectVirtualClass = (subjectId: number) =>
  api.get<VirtualClass>(`/virtual-classes/subjects/${subjectId}/`).then((r) => r.data);

export const updateVirtualClassDescription = (subjectId: number, description: string) =>
  api
    .patch<VirtualClass>(`/virtual-classes/subjects/${subjectId}/`, { description })
    .then((r) => r.data);

export const fetchExercises = (subjectId: number) =>
  api.get<Exercise[]>(`/virtual-classes/subjects/${subjectId}/exercises/`).then((r) => r.data);

export const fetchExercise = (exerciseId: string) =>
  api.get<Exercise>(`/virtual-classes/exercises/${exerciseId}/`).then((r) => r.data);

export const createExercise = (
  subjectId: number,
  payload: { title: string; instructions: string; kind?: ExerciseKind; status?: ExerciseStatus; deadline?: string }
) => api.post<Exercise>(`/virtual-classes/subjects/${subjectId}/exercises/`, payload).then((r) => r.data);

export const updateExercise = (exerciseId: string, payload: Partial<{ status: ExerciseStatus }>) =>
  api.patch<Exercise>(`/virtual-classes/exercises/${exerciseId}/`, payload).then((r) => r.data);

export const deleteExercise = (exerciseId: string) =>
  api.delete(`/virtual-classes/exercises/${exerciseId}/`);

export type SubmissionStatus = "submitted" | "graded";

export interface Submission {
  id: number;
  exercise: string;
  exercise_title: string;
  child: { id: number; first_name: string };
  content: string;
  attachments: string[];
  status: SubmissionStatus;
  grade: string | null;
  feedback: string;
  is_late: boolean;
  submitted_at: string;
  updated_at: string;
  graded_at: string | null;
}

export interface ChildExercise {
  id: string;
  kind: ExerciseKind;
  title: string;
  instructions: string;
  attachments: string[];
  deadline: string | null;
  status: ExerciseStatus;
  is_overdue: boolean;
  published_at: string | null;
  my_submission: Submission | null;
  /** DM déjà existante avec l'enseignant dédié, ou null (compte non activé, ou pas encore de DM). */
  my_dm_channel_id: number | null;
}

export interface ChildSubject {
  id: number;
  name: string;
  school_class_name: string;
  exercises: ChildExercise[];
}

export const fetchChildSubjects = (childId: number) =>
  api.get<ChildSubject[]>(`/virtual-classes/children/${childId}/subjects/`).then((r) => r.data);

/** Équivalent de fetchChildSubjects, mais pour l'élève connecté lui-même
 * (pas besoin de préciser childId — résolu côté backend via son compte). */
export const fetchMySubjects = () =>
  api.get<ChildSubject[]>("/virtual-classes/my-subjects/").then((r) => r.data);

export const fetchExerciseSubmissions = (
  exerciseId: string,
  params?: { search?: string; ordering?: string },
) => api.get<Submission[]>(`/virtual-classes/exercises/${exerciseId}/submissions/`, { params }).then((r) => r.data);

export interface ExerciseSubmissionStats {
  total_enrolled: number;
  submitted_count: number;
  not_submitted_count: number;
  late_count: number;
  graded_count: number;
}

export const fetchExerciseSubmissionStats = (exerciseId: string) =>
  api
    .get<ExerciseSubmissionStats>(`/virtual-classes/exercises/${exerciseId}/submissions/stats/`)
    .then((r) => r.data);

export interface ExerciseStudentStatus {
  child_id: number;
  first_name: string;
  last_name: string;
  status: "not_submitted" | SubmissionStatus;
  submission_id: number | null;
  grade: string | null;
  /** DM avec l'enseignant, si elle existe déjà — le tap sur un élève y bascule directement. */
  channel_id: number | null;
}

/** Effectif complet de la classe pour ce devoir (contrairement à
 * fetchExerciseSubmissions, qui ne renvoie que les copies déjà rendues) —
 * pour la liste "qui a rendu / qui n'a pas rendu" côté enseignant. */
export const fetchExerciseStudentStatus = (exerciseId: string) =>
  api
    .get<ExerciseStudentStatus[]>(`/virtual-classes/exercises/${exerciseId}/student-status/`)
    .then((r) => r.data);

export const submitExercise = (exerciseId: string, payload: { child_id: number; content: string }) =>
  api.post<Submission>(`/virtual-classes/exercises/${exerciseId}/submissions/`, payload).then((r) => r.data);

/** Modification de sa propre copie avant échéance — distinct de
 * gradeSubmission (réservé au prof). */
export const editSubmission = (id: number, payload: { content?: string; attachments?: string[] }) =>
  api.patch<Submission>(`/virtual-classes/submissions/${id}/`, payload).then((r) => r.data);

export const fetchSubmission = (id: number) =>
  api.get<Submission>(`/virtual-classes/submissions/${id}/`).then((r) => r.data);

export const gradeSubmission = (id: number, payload: { grade: number; feedback: string }) =>
  api.patch<Submission>(`/virtual-classes/submissions/${id}/`, payload).then((r) => r.data);

export const fetchMySubmissions = () =>
  api.get<Submission[]>("/virtual-classes/my-submissions/").then((r) => r.data);

export interface GradingQueueItem {
  exercise_id: string;
  title: string;
  subject_name: string;
  pending_count: number;
}

export const fetchMyGradingQueue = () =>
  api
    .get<{ total_pending: number; exercises: GradingQueueItem[] }>("/virtual-classes/my-grading-queue/")
    .then((r) => r.data);
