import api from "@/services/api";

export type ExerciseStatus = "draft" | "published" | "closed";

export interface Exercise {
  id: string;
  title: string;
  instructions: string;
  attachments: string[];
  deadline: string | null;
  status: ExerciseStatus;
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

export const createExercise = (
  subjectId: number,
  payload: { title: string; instructions: string; status?: ExerciseStatus; deadline?: string }
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
  submitted_at: string;
  graded_at: string | null;
}

export interface ChildExercise {
  id: string;
  title: string;
  instructions: string;
  attachments: string[];
  deadline: string | null;
  published_at: string | null;
  my_submission: Submission | null;
}

export interface ChildSubject {
  id: number;
  name: string;
  school_class_name: string;
  exercises: ChildExercise[];
}

export const fetchChildSubjects = (childId: number) =>
  api.get<ChildSubject[]>(`/virtual-classes/children/${childId}/subjects/`).then((r) => r.data);

export const fetchExerciseSubmissions = (exerciseId: string) =>
  api.get<Submission[]>(`/virtual-classes/exercises/${exerciseId}/submissions/`).then((r) => r.data);

export const submitExercise = (exerciseId: string, payload: { child_id: number; content: string }) =>
  api.post<Submission>(`/virtual-classes/exercises/${exerciseId}/submissions/`, payload).then((r) => r.data);

export const fetchSubmission = (id: number) =>
  api.get<Submission>(`/virtual-classes/submissions/${id}/`).then((r) => r.data);

export const gradeSubmission = (id: number, payload: { grade: number; feedback: string }) =>
  api.patch<Submission>(`/virtual-classes/submissions/${id}/`, payload).then((r) => r.data);

export const fetchMySubmissions = () =>
  api.get<Submission[]>("/virtual-classes/my-submissions/").then((r) => r.data);
